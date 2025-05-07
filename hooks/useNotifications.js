import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';

//custom hook for managing notifications
export const useNotifications = () =>{
    const [user] = useAuthState(getAuth());
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const firestore = getFirestore();

    //Create notification in Firestore
    const createNotification = useCallback (async (targetUserId, title, body, data ={}) =>{
        if(!targetUserId){
            return {success: false, error: "User ID is required"};
        }

        try{
            const notificationsRef = collection(firestore, 'Notifications');

            const newNotification = {
                title, 
                body,
                data,
                createdAt: serverTimestamp(),
                userId: targetUserId,
                read: false
            };

            const docRef = await addDoc(notificationsRef, newNotification);

            return{
                success: true,
                notificationId: docRef.id
            };
        }catch(error){
            console.error("Error creating notification in firestore:", error);
            return{
                success: false,
                error: error.message
            };
        }
    }, [firestore]);

    //Send a notification to a specific user
    const sendNotification = useCallback(async(userId, title, body, data = {}) =>{
        if(!user){
            return {success: false, error: 'Not authenticated'};
        }

        try{
            return await createNotification(userId || user.uid, title, body, data);
        }catch(error){
            setError(error);
            return {success: false, error: error.message};
        }
    }, [user, createNotification]);

    //Send notifications to multiple users
    const sendNotificationsToMany = useCallback(async(userIds, title, body, data={})=>{
        if(!user){
            return {success: false, error: "Not authenticated"};
        }

        try{
            const results = await Promise.all (
                userIds.map(userId => createNotification(userId, title, body, data))
            );

            const success = results.every(result =>result.success);

            return {
                success,
                results
            }
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user, createNotification]);

    //Send a notification to a group/topic (store all members)
    const sendToGroup = useCallback(async(groupId, memberIds, title, body, data ={}) =>{
        if(!user){
            return {success: false, error: 'Not authenticated'};
        }

        try{
            const notificationData = {
                ...data,
                groupId
            };
            
            return await sendNotificationsToMany(memberIds, title, body, notificationData);
        }catch(error){
            setError(error);
            return {success:false, error: error.message};
        }
    }, [user, sendNotificationsToMany]);

    //Mark a notification as read
    const markAsRead = useCallback(async(notificationId) =>{
        if(!user || !notificationId){
            return false;
        }

        try{
            const notificationRef = doc(firestore, 'Notifications', notificationId);
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

    // Changing this to test actual notifications
    const addLocalNotification = async() =>{
        const targetUserId = 'PP84Kawv6WNDa8C046iEpreeoAg2';

        const result = await createNotification(
            targetUserId, 
            'Test Notification', 
            'This is a test notification'
        );
        
        if(result.success && user && user.uid === targetUserId){
            const newNotification = {
                id:result.notificationId,
                title: 'Test Notification',
                body: 'This is a test notification',
                data: {},
                createdAt: new Date().toISOString(),
                read: false
            };
            setNotifications(prev =>[newNotification, ...prev]);
            setUnreadCount(prev => prev+1);
        }
    };

    //Mark all notifications as read
    const markAllAsRead = useCallback(async () =>{
        if(!user){
            return false;
        }

        try{
            const batch = [];
            
            notifications.forEach(notification =>{
                if(!notification.read){
                    const notificationRef = doc(firestore, 'Notifications', notification.id);
                    batch.push(updateDoc(notificationRef, {read:true}));
                }
            });

            if(batch.length > 0){
                await Promise.all(batch);

                //Update local state
                setNotifications(prev =>
                    prev.map(notification => ({...notification, read: true}))
                );

                setUnreadCount(0);
            }
            return true;
        }catch(error){
            console.error("Error marking all notifications as read", error);
            return false;
        }
    }, [user, firestore, notifications]);

    //Subscribe to user's notifications in Firestore
    useEffect(()=>{
        let unsubscribeFirestore = () => {};

        const subscribeToNotifications = async () =>{
            setLoading(true);

            try{
                if(user){
                    const notificationsRef = collection(firestore, "Notifications");
                    const notificationsQuery = query(
                        notificationsRef,
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc'),
                        limit(50)
                    );

                    unsubscribeFirestore = onSnapshot(notificationsQuery, (snapshot) =>{
                        const notificationsList = [];
                        let unread = 0;

                        snapshot.forEach(doc =>{
                            const data = doc.data();
                            const notification = {
                                id: doc.id,
                                title: data.title,
                                body: data.body,
                                data: data.data || {},
                                createdAt: data.createdAt instanceof Timestamp ?
                                    data.createdAt.toDate().toISOString() : 
                                    (data.createdAt || new Date().toISOString()),
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
                    }, (error) =>{
                        console.error("Error fetching notifications", error);
                        setError(error);
                        setLoading(false);
                    });
                }else{
                    setNotifications([]);
                    setUnreadCount(0);
                    setLoading(false);
                }
            }catch(err){
                console.error("Error setting up notifications subscription", err);
                setError(err);
                setLoading(false);
            }
        };

        subscribeToNotifications();

        return () =>{
            unsubscribeFirestore();
        }
    }, [user, firestore]);


    return {
        notifications,
        unreadCount,
        loading, 
        error,

        sendNotification,
        sendNotificationsToMany,
        sendToGroup,
        markAsRead,
        markAllAsRead,
        addLocalNotification
    };
};