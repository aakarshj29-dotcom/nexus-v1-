'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getProfile,
  updateProfile as updateProfileService,
  uploadAvatar as uploadAvatarService,
  claimUsername as claimUsernameService,
  completeOnboarding as completeOnboardingService
} from '@/firebase/profile-service';
import { AppUser } from '@/types/auth';

export const useProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!authUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getProfile(authUser.uid);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [authUser?.uid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<AppUser>) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      await updateProfileService(authUser.uid, data);
      await fetchProfile();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const url = await uploadAvatarService(authUser.uid, file);
      await fetchProfile();
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload avatar');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const claimUsername = async (username: string) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      await claimUsernameService(authUser.uid, username);
      await fetchProfile();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim username');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (data: Partial<AppUser>) => {
    if (!authUser?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      await completeOnboardingService(authUser.uid, data);
      await fetchProfile();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete onboarding');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
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
    refreshProfile: fetchProfile,
  };
};
