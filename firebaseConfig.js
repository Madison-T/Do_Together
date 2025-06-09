import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './apiKeys';

// Initialize Firebase
let app;
if(!getApps().length){
  app = initializeApp(firebaseConfig);
}else{
  app = getApp();
}

// Initialize Firestore and Authentication
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, auth, firestore };

