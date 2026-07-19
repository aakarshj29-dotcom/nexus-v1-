import { Timestamp } from 'firebase/firestore';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    emailNotifications: boolean;
    desktopNotifications: boolean;
    weeklyDigest: boolean;
  };
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  onboardingComplete: boolean;
  provider: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isNewUser?: boolean;
  preferences?: UserPreferences;
}

export interface AuthError {
  code: string;
  message: string;
}
