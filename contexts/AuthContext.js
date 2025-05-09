import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
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

            await setDoc(doc(firestore, 'Users', newUser.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
            });

            setUser(newUser);
        } catch (err) {
            setError(err.message);
        }
    };

    const loginUser = async (email, password) => {
        setError(null);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          setUser(userCredential.user);
          return true; // ⬅️ success
        } catch (err) {
          setError(err.message);
          return false; // ⬅️ failure
        }
      };
      

    const logoutUser = async () => {
        setError(null);
        try {
            await signOut(auth);
            setUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, registerUser, loginUser, logoutUser, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
