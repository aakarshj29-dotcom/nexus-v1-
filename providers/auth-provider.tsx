'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import {
  createUserDocument,
  getUserDocument,
  updateLastLogin
} from '@/firebase/user-service';
import { AppUser } from '@/types/auth';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Check if user exists in Firestore
          let appUser = await getUserDocument(firebaseUser.uid);

          if (!appUser) {
            // Create user document if it doesn't exist
            const newUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              username: firebaseUser.email?.split('@')[0] || null,
              provider: firebaseUser.providerData[0]?.providerId || 'password',
              createdAt: Timestamp.now(), // Placeholder, serverTimestamp used in service
              lastLogin: Timestamp.now(), // Placeholder, serverTimestamp used in service
              isNewUser: true,
            };
            await createUserDocument(newUser);
            appUser = await getUserDocument(firebaseUser.uid);
          } else {
            // Update last login
            await updateLastLogin(firebaseUser.uid);
            // Refresh appUser after update to get latest state (e.g. isNewUser: false)
            appUser = await getUserDocument(firebaseUser.uid);
          }

          setUser(appUser);
        } catch (error) {
          console.error('Error fetching/creating user document:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
