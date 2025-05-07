import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getFirestore, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import notificationService from '../services/notifications/notificationService';

//custom hook for managing notifications
export const useNotifications = () =>{
    const [user] = useAuthState(getAuth());
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissionState, setPermissionState] = useState(Notification.permission);

    const firestore = getFirestore();

    //Get current permission state
    useEffect(()=>{
        if(typeof Notification !== 'undefined'){
            setPermissionState(Notification.permission);
        }
    }, []);

    //Request permission for notifications
    const requestPermission = useCallback(async () =>{
        try{
            const result = await notificationService.initialize();

            if(typeof Notification !== 'undefined'){
                setPermissionState(Notification.permission);
            }

            return result;
        }catch(error){
            setError(error);
            return false;
        }
    }, []);

    //Send a notification to a specific user
    const sendNotification = useCallback(async(userId, title, body, data = {}) =>{
        if(!user){
            return {success: false, error: 'Not authenticated'};
        }

        try{
            const result = await notificationService.sendNotification(
                userId || user.uid,
                title,
                body,
                data
            );

            if(result.success){
                const targetUserId = userId || user.uid;
                await addNotificationToFirestore(targetUserId, title, body, data);
            }

            return result;
        }catch(error){
            setError(error);
            return {success: false, error: error.message};
        }
    }, [user, firestore]);

    //Helper to add notification to Firestore
    const addNotificationToFirestore = async (targetUserId, title, body, data={}) =>{
        try{
            const notificationsRef = collection(firestore, 'users', targetUserId, 'notifications');
            await addDoc(notificationsRef, {
                title,
                body,
                data,
                createdAt: new Date(),
                read: false,
                senderId: user.uid
            });

            return true;
        }catch(error){
            console.error("Error storing notification in Firestore", error);
            return false;
        }
    };

    //Send notifications to multiple users
    const sendNotificationsToMany = useCallback(async(userIds, title, body, data={})=>{
        if(!user){
            return {success: false, error: "Not authenticated"};
        }

        try{
            const result = await notificationService.sendNotificationsToMany({
                userIds,
                title,
                body,
                data
            });

            if(result.success){
                await Promise.all(
                    userIds.map(userId => addNotificationToFirestore(userId, title, body, data))
                );
            }

            return result;
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user, firestore]);

    //Send a notification to a topic
    const sendToTopic = useCallback(async(topic, title, body, data ={}) =>{
        if(!user){
            return {success: false, error: 'Not authenticated'};
        }

        try{
            const result = await notificationService.sendToTopic({
                topic,
                title,
                body,
                data
            });

            return result;
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user]);

    //Mark a notification as read
    const markAsRead = useCallback(async(notificationId) =>{
        if(!user || !notificationId){
            return false;
        }

        try{
            const notificationRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
            await updateDoc(notificationRef, {read: true});

            //update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                    ? {...notification, read:true}
                    :notification
                )
            );
            
            setUnreadCount(prev=>Math.max(0, prev-1));

            return true;
        }catch(error){
            setError(error);
            return false;
        }
    }, [user, firestore]);

    //Mark all notifications as read
    const markAllAsRead = useCallback(async () =>{
        if(!user){
            return false;
        }

        try{
            const unreadNotifications = notifications.filter(notification => !notification.read);
            const markPromises = unreadNotifications.map(notification => markAsRead(notification.id));

            await Promise.all(markPromises);
            setUnreadCount(0);
            return true;
        }catch(error){
            setError(error);
            return false;
        }
    }, [user, notifications, markAsRead]);

    //Subscribe to user's notifications in Firestore
    useEffect(()=>{
        let unsubscribeFirestore = () => {};
        let subscriptionIndex = -1;

        const subscribeToNotifications = async () =>{
            setLoading(true);

            try{
                //Initialise notification service
                await notificationService.initialize();

                //Subscribe to the notification service for real-time notifications
                subscriptionIndex = notificationService.subscribe((message) =>{
                    if(message.type === 'NOTIFICATION_CLICK'){
                        console.log("Notification clicked:", message);
                        return;
                    }
                    
                    setNotifications(prev =>{
                        const newMessage = {
                            id: message.data?.notificationId || `temp=${Date.now()}`,
                            title: message.title,
                            body: message.body,
                            data: message.data || {},
                            createdAt: new Date(),
                            read: false
                        };

                        //Avoid duplicates
                        const exists = prev.some (n => n.id === newMessage.id);
                        if(exists) return prev;

                        setUnreadCount(count =>count+1);

                        return [newMessage, ...prev];
                    });
                });

                //Subscribe to Firestore for stored notification
                if(user){
                    const notificationsRef = collection(firestore, 'users', user.uid, 'notifications');
                    const recentNotificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

                    unsubscribeFirestore = onSnapshot(recentNotificationsQuery, (snapshot) =>{
                        const notificationsList = [];
                        let unread = 0;

                        snapshot.forEach(doc =>{
                            const data = doc.data();
                            const notification = {
                                id: doc.id,
                                title: data.title,
                                body: data.body,
                                data: data.data || {},
                                createdAt: data.createdAt?.toDate() || new Date(),
                                read: data.read || false
                            };

                            if(!notification.read){
                                unread++;
                            }

                            notificationsList.push(notification);
                        });

                        setNotifications(notificationsList);
                        setUnreadCount(unread);
                        setLoading(false);
                    }, (err) =>{
                        setError(err);
                        setLoading(false);
                    });
                }else{
                    setLoading(false);
                }
            }catch(err){
                setError(err);
                setLoading(false);
            }
        };

        subscribeToNotifications();

        //Cleanup function
        return () =>{
            unsubscribeFirestore();
            if(subscriptionIndex >= 0){
                notificationService.unsubscribe(subscriptionIndex);
            }
        };
    }, [user, firestore]);

    const addLocalNotification = (notification) =>{
        setNotifications((prev) => [notification, ...prev]);
    };

    return {
        notifications,
        unreadCount,
        loading, 
        error,
        permissionState,

        requestPermission,
        sendNotification,
        sendNotificationsToMany,
        sendToTopic,
        markAsRead,
        markAllAsRead,
        addLocalNotification
    };
};