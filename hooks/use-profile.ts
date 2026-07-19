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
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const savedMock = localStorage.getItem('mock_user_profile');
      if (savedMock) {
        setProfile(JSON.parse(savedMock));
      } else {
        const initialMock: AppUser = {
          uid: 'mock-user-123',
          email: 'jules@nexus.com',
          displayName: 'Jules Nexus',
          photoURL: null,
          username: 'jules_nexus',
          bio: 'Senior Software Engineer',
          avatarUrl: null,
          timezone: 'UTC',
          onboardingComplete: true,
          provider: 'password',
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          lastLogin: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        };
        setProfile(initialMock);
        localStorage.setItem('mock_user_profile', JSON.stringify(initialMock));
      }
      setLoading(false);
      return;
    }

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
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const current = profile || { uid: 'mock-user-123' };
      const updated = { ...current, ...data };
      setProfile(updated as AppUser);
      localStorage.setItem('mock_user_profile', JSON.stringify(updated));
      return;
    }

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
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const dummyUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
      const current = profile || { uid: 'mock-user-123' };
      const updated = { ...current, avatarUrl: dummyUrl };
      setProfile(updated as AppUser);
      localStorage.setItem('mock_user_profile', JSON.stringify(updated));
      return dummyUrl;
    }

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
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const current = profile || { uid: 'mock-user-123' };
      const updated = { ...current, username };
      setProfile(updated as AppUser);
      localStorage.setItem('mock_user_profile', JSON.stringify(updated));
      return;
    }

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
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      const current = profile || { uid: 'mock-user-123' };
      const updated = { ...current, ...data, onboardingComplete: true };
      setProfile(updated as AppUser);
      localStorage.setItem('mock_user_profile', JSON.stringify(updated));
      return;
    }

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
