'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  updateProfile as updateProfileService,
  uploadAvatar as uploadAvatarService,
  claimUsername as claimUsernameService,
  completeOnboarding as completeOnboardingService
} from '@/firebase/profile-service';
import { db, doc, onSnapshot } from '@/firebase/firestore';
import { AppUser } from '@/types/auth';

const USERS_COLLECTION = 'users';

export const useProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!authUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, USERS_COLLECTION, authUser.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as AppUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Profile listener error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser?.uid]);

  const updateProfile = async (data: Partial<AppUser>) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      await updateProfileService(authUser.uid, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      const url = await uploadAvatarService(authUser.uid, file);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload avatar');
      setError(error);
      throw error;
    }
  };

  const claimUsername = async (username: string) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      await claimUsernameService(authUser.uid, username);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim username');
      setError(error);
      throw error;
    }
  };

  const completeOnboarding = async (data: Partial<AppUser>) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      await completeOnboardingService(authUser.uid, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete onboarding');
      setError(error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    claimUsername,
    completeOnboarding,
  };
};
