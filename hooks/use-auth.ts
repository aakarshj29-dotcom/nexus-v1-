'use client';

import { useAuthContext } from '@/providers/auth-provider';
import {
  signInWithGoogle,
  loginWithEmail,
  signupWithEmail,
  logout as firebaseLogout
} from '@/firebase/auth';

export const useAuth = () => {
  const { user, loading } = useAuthContext();

  return {
    user,
    loading,
    login: loginWithEmail,
    signup: signupWithEmail,
    signInWithGoogle,
    logout: firebaseLogout,
  };
};
