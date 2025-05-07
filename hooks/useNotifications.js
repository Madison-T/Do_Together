import { getAuth } from 'firebase/auth';
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import notificationService from '../services/notifications/notificationService';

//custom hook for managing notifications
export const useNotifictions = () =>{
    const [user] = useAuthState(getAuth());
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissionState, setPermissionState] = useState(Notification.permission);

    const firestore = getFirestore();
    const functions = getFunctions();

    //Initialise the send notification function
    const sendNotificationToUser= httpsCallable(functions, 'sendNotificationToUser');
    const sendBulkNotifications = httpsCallable(functions, 'sendBulkNotifications');
    const sendTopicNotification = httpsCallable(functions, 'sendTopicNotification');

    //Get current permission state
    useEffect(()=>{
        if(typeof Notification !== 'undefined'){
            setPermissionState(Notification.permission);
        }
    }, []);

    //Request permission for notifications
    const requestPermission = useCallback(async () =>{
        try{
            if(typeof Notification === 'undefined'){
                const result = await notificationService.initialize();
                return resultl
            }

            const permission = await Notification.requestPermission();
            setPermissionState(permission);

            if(permission === 'granted'){
                await notificationService.initialize();
                return true;
            }
            return false;
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
            const result = await sendNotificationToUser({
                userId,
                title,
                body,
                data,
                requireAuth: true
            });

            return result.data;
        }catch(error){
            setError(error);
            return {success: false, error: error.message};
        }
    }, [user, sendNotificationToUser]);

    //Send notifications to multiple users
    const sendNotificationsToMany = useCallback(async(userIds, title, body, data={})=>{
        if(!user){
            return {success: false, error: "Not authenticated"};
        }

        try{
            const result = await sendBulkNotifications({
                userIds,
                title,
                body,
                data
            });

            return result.data;
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user, sendBulkNotifications]);

    //Send a notification to a topic
    const sendToTopic = useCallback(async(topic, title, body, data ={}) =>{
        if(!user){
            return {success: false, error: 'Not authenticated'};
        }

        try{
            const result = await sendTopicNotification({
                topic,
                title,
                body,
                data
            });

            return result.data;
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user, sendTopicNotification]);

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
        markAllAsRead
    };
};