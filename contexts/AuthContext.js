import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../firebaseConfig';
  
  export const AuthContext = createContext();
  
  export const useAuth = () => useContext(AuthContext);
  
  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser || null);
        setLoading(false);
      });
      return () => unsubscribe();
    }, []);
  
    const registerUser = async (email, password, name) => {
      setError(null);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
  
        await updateProfile(newUser, { displayName: name });
  
        await setDoc(doc(firestore, 'Users', newUser.uid), {
          name,
          email,
          createdAt: new Date().toISOString(),
        });
  
        setUser(newUser);
        return true;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Email is already in use.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else {
          setError('Sign up failed. Please try again.');
          console.error(err);
        }
        return false;
      }
    };
  
    const loginUser = async (email, password) => {
      setError(null);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        return true;
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          setError('No account found with this email.');
        } else if (err.code === 'auth/wrong-password') {
          setError('Incorrect password.');
        } else {
          setError('Login failed. Try again.');
        }
        return false;
      }
    };
  
    const logoutUser = async () => {
      setError(null);
      try {
        await signOut(auth);
        setUser(null);
      } catch (err) {
        setError('Logout failed. Try again.');
      }
    };
  
    return (
      <AuthContext.Provider value={{ user, registerUser, loginUser, logoutUser, loading, error }}>
        {children}
      </AuthContext.Provider>
    );
  };
  