import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { app, auth, firestore } from '../../firebaseConfig';

// Check if Firebase Messaging is supported on the current platform
const isMessagingSupported = async () => {
  try {
    return await isSupported();
  } catch (error) {
    console.log('Firebase Messaging not supported:', error);
    return false;
  }
};

class NotificationService {
  constructor() {
    this.token = null;
    this.userId = null;
    this.isWebPushSupported = false; // Will be set properly during initialization
    this.unsubscribeAuthListener = null;
    this.registeredCallbacks = [];
    this.deviceType = Platform.OS;
    this.messaging = null;
  }

  // Initialize the notification service
  async initialize() {
    try {
      // Set up authentication listener to get userId when available
      this.unsubscribeAuthListener = onAuthStateChanged(auth, (user) => {
        if (user) {
          this.userId = user.uid;
          // If we already have a token, register it with the user
          if (this.token) {
            this.registerTokenWithServer(this.token);
          }
        } else {
          this.userId = null;
        }
      });

      // Check for messaging support
      this.isWebPushSupported = await isMessagingSupported();

      // Set up the appropriate notification system based on platform
      if (Platform.OS === 'web' && this.isWebPushSupported) {
        await this.setupWebPushNotifications();
      } else if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await this.setupExpoPushNotifications();
      }

      return true;
    } catch (error) {
      console.error("Error initializing notification service:", error);
      return false;
    }
  }

  async setupWebPushNotifications() {
    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log("Notification permission not granted");
        return false;
      }

      this.messaging = getMessaging(app);

      // Get the FCM token
      const token = await getToken(this.messaging, {
        vapidKey: "BAZysKY0xa_S0bHG3Na756docmg8D8D-7G9aYo0Vrl8kMoF15I3vC57zkYdcmOZ4al9S6wEyMHYTm8H8dsIxyF0"
      });

      if (token) {
        this.token = token;
        console.log("FCM Token obtained:", token);

        if (this.userId) {
          await this.registerTokenWithServer(token);
        }

        // Set up foreground message handler
        onMessage(this.messaging, (payload) => {
          console.log("Foreground message received:", payload);
          this.handleIncomingNotification(payload);
        });

        return true;
      } else {
        console.log("No token available");
        return false;
      }
    } catch (error) {
      console.error("Error setting up web push notifications:", error);
      return false;
    }
  }

  async setupExpoPushNotifications() {
    if (Platform.OS === 'web') return false;
    
    try {
      // Request permission for push notifications (iOS)
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return false;
        }
      }

      // Set notification handler for foreground notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Get push token
      let token;
      if (Device.isDevice) {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                         Constants.manifest?.extra?.eas?.projectId;
                  
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId
        })).data;
        
        console.log('Expo Push Token:', token);
        this.token = token;
        
        if (this.userId) {
          await this.registerTokenWithServer(token);
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      // Set up notification listeners
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
        this.handleIncomingNotification({
          notification: {
            title: notification.request.content.title,
            body: notification.request.content.body,
          },
          data: notification.request.content.data
        });
      });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response received:', response);
        this.handleClickAction('default', response.notification.request.content.data);
      });

      // Store subscriptions for cleanup
      this._notificationSubscription = subscription;
      this._notificationResponseSubscription = responseSubscription;

      return true;
    } catch (error) {
      console.error("Error setting up Expo push notifications:", error);
      return false;
    }
  }

  // Register the token with our Firestore database
  async registerTokenWithServer(token) {
    if (!this.userId) {
      console.warn("Cannot register token: No user ID available");
      return false;
    }

    try {
      // Store token in Firestore
      await addDoc(collection(firestore, 'users', this.userId, 'tokens'), {
        token,
        deviceType: Platform.OS,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        platform: Platform.OS === 'web' ? navigator.platform : Device.osName,
        userAgent: Platform.OS === 'web' ? navigator.userAgent : `${Device.osName} ${Device.osVersion}`
      });

      console.log("Token registered successfully");
      return true;
    } catch (error) {
      console.error("Error registering token", error);
      return false;
    }
  }

  // Handle incoming notifications
  handleIncomingNotification(payload) {
    const notification = payload.notification || {};
    const data = payload.data || {};

    // Combine notification and data fields
    const message = {
      title: notification.title || data.title || 'New Notification',
      body: notification.body || data.body || '',
      data: {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        notificationId: data.notificationId || `notification-${Date.now()}`
      }
    };

    // For iOS where FCM doesn't work in foreground, show an in-app alert
    if (Platform.OS === "ios" && !data.silent) {
      this.showInAppAlert(message);
    }

    // Web notifications for foreground web users
    if (Platform.OS === 'web' && document.visibilityState === 'visible' && this.isWebPushSupported) {
      this.showWebNotification(message);
    }

    // Call any registered callbacks
    this.notifySubscribers(message);
  }

  // Show an in-app alert for iOS
  showInAppAlert(message) {
    // In a real implementation, you might want to show a custom UI alert
    // This could use a state management solution or event emitter
    // For now, we'll just notify subscribers who can handle displaying UI
    this.notifySubscribers({
      ...message,
      isInAppAlert: true
    });
  }

  // Show a web notification
  showWebNotification(message) {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(message.title, {
        body: message.body,
        icon: '/notification-icon.png',
        data: message.data
      });

      notification.onclick = () => {
        this.handleClickAction('default', message.data);
        notification.close();
        window.focus();
      };
    }
  }

  // Handle click actions on notifications
  handleClickAction(action, data) {
    console.log("Notification clicked with action:", action, "and data:", data);
    
    // Notify subscribers about the click
    this.notifySubscribers({
      type: 'NOTIFICATION_CLICK',
      action: action,
      data: data
    });
    
    // Additional action-specific handling can be added here
  }

  // Subscribe to notifications
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.registeredCallbacks.push(callback);
      return this.registeredCallbacks.length - 1;
    }
    return -1;
  }

  // Unsubscribe from notifications
  unsubscribe(index) {
    if (index >= 0 && index < this.registeredCallbacks.length) {
      this.registeredCallbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  // Notify all subscribers
  notifySubscribers(message) {
    this.registeredCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error in notification callback", error);
      }
    });
  }

  // Clean up resources
  cleanup() {
    if (this.unsubscribeAuthListener) {
      this.unsubscribeAuthListener();
    }
    
    if (this._notificationSubscription) {
      this._notificationSubscription.remove();
    }
    
    if (this._notificationResponseSubscription) {
      this._notificationResponseSubscription.remove();
    }
    
    this.registeredCallbacks = [];
  }
}

const notificationService = new NotificationService();
export default notificationService;