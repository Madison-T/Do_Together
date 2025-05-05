import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKN9fJQ7WSR864Fy-vwta70-9VVQrIXUs",
  authDomain: "dotogether-9e024.firebaseapp.com",
  projectId: "dotogether-9e024",
  storageBucket: "dotogether-9e024.firebasestorage.app",
  messagingSenderId: "238799534169",
  appId: "1:238799534169:web:2fd405c24e324a1c89d948",
  measurementId: "G-7R8PYJDQLK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
const firestore = getFirestore(app);
const auth = getAuth(app);

export { auth, firestore };
