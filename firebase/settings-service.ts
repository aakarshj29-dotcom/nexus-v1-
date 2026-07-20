import { doc, updateDoc } from './firestore';
import { db } from './firestore';
import { getAuth, updatePassword } from 'firebase/auth';
import { app } from './firebase';

const USERS_COLLECTION = 'users';

/**
 * Updates the user's theme preference in Firestore.
 */
export const updateThemePreference = async (uid: string, theme: 'light' | 'dark' | 'system') => {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return;
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    'preferences.theme': theme,
  });
};

/**
 * Updates the user's notification preferences in Firestore.
 */
export const updateNotificationPreferences = async (
  uid: string,
  notifications: {
    emailNotifications: boolean;
    desktopNotifications: boolean;
    weeklyDigest: boolean;
  }
) => {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return;
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    'preferences.notifications': notifications,
  });
};

/**
 * Updates user timezone in Firestore.
 */
export const updateTimezonePreference = async (uid: string, timezone: string) => {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return;
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    timezone,
  });
};

/**
 * Changes user's password.
 * Will throw errors from Firebase Auth (such as auth/requires-recent-login).
 */
export const changeUserPassword = async (password: string): Promise<void> => {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return;
  }

  const auth = getAuth(app);
  if (!auth.currentUser) {
    throw new Error('User is not authenticated.');
  }

  try {
    await updatePassword(auth.currentUser, password);
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
};
