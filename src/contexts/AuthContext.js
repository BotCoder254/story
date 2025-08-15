import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();
      
      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || '',
          email,
          photoURL: photoURL || '',
          createdAt,
          updatedAt: createdAt,
          bio: '',
          location: '',
          website: '',
          storiesCount: 0,
          followersCount: 0,
          followingCount: 0,
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        toast.error('Failed to create user profile');
      }
    }
    
    return userRef;
  };

  // Get user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      await createUserProfile(user, { displayName });
      
      toast.success('Account created successfully!');
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('Email is already registered');
          break;
        case 'auth/weak-password':
          toast.error('Password should be at least 6 characters');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address');
          break;
        default:
          toast.error('Failed to create account');
      }
      throw error;
    }
  };

  // Sign in with email and password
  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      return user;
    } catch (error) {
      console.error('Signin error:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later');
          break;
        default:
          toast.error('Failed to sign in');
      }
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Create user profile if it doesn't exist
      await createUserProfile(user);
      
      toast.success('Welcome!');
      return user;
    } catch (error) {
      console.error('Google signin error:', error);
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          toast.error('Sign-in cancelled');
          break;
        case 'auth/popup-blocked':
          toast.error('Popup blocked. Please allow popups and try again');
          break;
        default:
          toast.error('Failed to sign in with Google');
      }
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Password reset error:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address');
          break;
        default:
          toast.error('Failed to send reset email');
      }
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user profile from Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    createUserProfile,
    getUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};