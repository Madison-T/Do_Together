// public firebase messaging sw.js

importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

//Initialise Firebase with your config directly in the service worker

firebase.initializeApp({
    apiKey: "AIzaSyDKN9fJQ7WSR864Fy-vwta70-9VVQrIXUs",
    authDomain: "dotogether-9e024.firebaseapp.com",
    projectId: "dotogether-9e024",
    storageBucket: "dotogether-9e024.firebasestorage.app",
    messagingSenderId: "238799534169",
    appId: "1:238799534169:web:2fd405c24e324a1c89d948",
    measurementId: "G-7R8PYJDQLK"
});

const messaging = firebase.messaging();

//Handle background messages
messaging.onBackgroundMessage((payload) =>{
    console.log("Background message received:", payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/notification-icon.png',
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

//Handle notification click
self.addEventListener('notificationclick', (event)=>{
    event.notification.close();


    //Get any custom data from the notification
    const action = event.notification.data?.action || '';
    const url = event.notification.data?.url || '/';

    //Looks for a matching client otherwise opens a new client
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            // If a tab is already open, focus it
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                        break;
                    }
                }
                client.postMessage({
                    type: 'NOTIFICATION_CLICK',
                    action: action,
                    url: url,
                    data: event.notification.data
                });
                return client.focus();
            }
            
            // Otherwise open a new tab
            return clients.openWindow(url);
        })
    );
});