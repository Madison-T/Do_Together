import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { app, auth, firestore } from '../firebaseConfig';

const messaging = isSupported() ? getMessaging(app) : null;

class NotificationService{
    constructor() {
        this.token = null;
        this.userId = null;
        this.isWebPushSupported = !!messaging;
        this.unsubscribeAuthListener = null;
        this.registeredCallbacks = [];
        this.deviceType = Platform.OS;
    }

    //Initialise the notification service
    async initialize(){
        //set up authentication listener to get userId when available
        this.unsubscribeAuthListener = onAuthStateChanged(auth, (user) =>{
            if(user){
                this.userId = user.uid;
                //if we already have a token, register it with the user
                if(this.token){
                    this.registerTokenWithServer(this.token);
                }
            }else{
                this.userId = null;
            }
        });

        //Set up web push if supported
        if(this.isWebPushSupported){
            await this.setupWebPushNotifications();
        }
    }

    async setupWebPushNotifications(){
        try{
            const permission = await Notification.requestPermission();

            if(permission !== 'granted'){
                console.log("Notification permission not granted");
                return;
            }

            //Get the FCM token
            const token = await getToken(messaging, {
                vapidKey: "BAZysKY0xa_S0bHG3Na756docmg8D8D-7G9aYo0Vrl8kMoF15I3vC57zkYdcmOZ4al9S6wEyMHYTm8H8dsIxyF0"
            });

            if(token){
                this.token = token;
                console.log("FCM Token obtained:", token);

                if(this.userId){
                    await this.registerTokenWithServer(token);
                }

                onMessage(messaging, (payload) =>{
                    console.log("Message received:", payload);
                    this.handleIncomingNotification(payload);
                });
            }else{
                console.log("No token available");
            }
        }catch(error){
            console.error("Error setting up notifications:", error);
        }
    }

    //Register the FCM token with our firestore database
    async registerTokenWithServer(token){
        if(!this.userId){
            console.warn("Cannot register token: No user ID available");
            return;
        }

        try{
            //Store token in Firestore
            await addDoc(collection(firestore, 'users', this.userId, 'tokens'),{
                token,
                deviceType: Platform.OS,
                createdAt: serverTimestamp(),
                lastUsed: serverTimestamp(),
                platform: navigator.platform,
                userAgent: navigator.userAgent
            });

            console.log("Token registered successfully");
        }catch(error){
            console.error("Error registering token", error);
        }
    }

    //handle incoming notifications
    handleIncomingNotification(payload){
        const notification = payload.notification || {};
        const data = payload.data || {};

        //combine notifications and data fields
        const message = {
            title: notification.title || data.title || 'New Notification',
            body: notification.body || data.body || '',
            data: {
                ...data,
                timestamp: data.timestamp || new Date().toISOString(),
                notificationId: data.notificationId || `notification-${Date.now()}`
            }
        };

        //For ios where FCM doesn't work, instead we show an in app alert
        if(Platform.OS === "ios"){
            this.showInAppAlert(message);
        }

        //Web notifications for foreground web users
        if(Platform.OS ==='web' && document.visibilityState==='visible'){
            this.showWebNotification(message);
        }

        //Call any registered callbacks
        this.notifySubscribers(message);
    }

    //Show an in-app alert
    showInAppAlert(message){
        
    }

    //Show a web notification
    showWebNotification(message){
    }

    //Handle click actions on notifications
    handleClickAction(action, data){

    }

    //Subscribe to notificaitons
    subscribe(callback){
        if(typeof callback === 'function'){
            this.registeredCallbacks.push(callback);
            return this.registeredCallbacks.length-1;
        }

        return -1;
    }

    //Unsubscribe from notifications
    unsubscribe(index){
        if(index >= 0 && index < this.registeredCallbacks.length){
            this.registeredCallbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    //Notify all subscribers
    notifySubscribers(message){
        this.registeredCallbacks.forEach(callback =>{
            try{
                callback(message);
            }catch(error){
                console.error("Error in notification callback", error);
            }
        });
    }

    cleanup(){
        if(this.unsubscribeAuthListener){
            this.unsubscribeAuthListener();
        }
        this.registeredCallbacks = [];
    }
}

const notificationService = new NotificationService();
export default notificationService;