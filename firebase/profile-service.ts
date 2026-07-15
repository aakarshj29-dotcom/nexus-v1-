import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
} from './firestore';
import { db } from './firestore';
import { storage } from './storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppUser } from '@/types/auth';

const USERS_COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';

/**
 * Fetches a user profile by UID.
 */
export const getProfile = async (uid: string): Promise<AppUser | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as AppUser;
  }

  return null;
};

/**
 * Updates a user profile.
 */
export const updateProfile = async (uid: string, data: Partial<AppUser>) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, data);
};

/**
 * Checks if a username is already taken.
 */
export const usernameExists = async (username: string): Promise<boolean> => {
  const usernameRef = doc(db, USERNAMES_COLLECTION, username.toLowerCase());
  const usernameSnap = await getDoc(usernameRef);
  return usernameSnap.exists();
};

/**
 * Safe mechanism to reserve a username and update the user profile.
 * Uses a transaction to ensure uniqueness and prevent race conditions.
 */
export const claimUsername = async (uid: string, username: string) => {
  const normalizedUsername = username.toLowerCase();
  const userRef = doc(db, USERS_COLLECTION, uid);
  const usernameRef = doc(db, USERNAMES_COLLECTION, normalizedUsername);

  await runTransaction(db, async (transaction) => {
    const usernameDoc = await transaction.get(usernameRef);
    if (usernameDoc.exists()) {
      throw new Error('Username is already taken.');
    }

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User does not exist.');
    }

    const oldUsername = userDoc.data().username;

    // If user already had a username, remove it from the usernames collection
    if (oldUsername && oldUsername !== normalizedUsername) {
      const oldUsernameRef = doc(db, USERNAMES_COLLECTION, oldUsername.toLowerCase());
      transaction.delete(oldUsernameRef);
    }

    // Reserve the new username
    transaction.set(usernameRef, { uid });

    // Update the user profile
    transaction.update(userRef, { username: normalizedUsername });
  });
};

/**
 * Uploads an avatar image to Firebase Storage and returns the download URL.
 */
export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  // Update the user profile with the new avatar URL
  await updateProfile(uid, { avatarUrl: downloadURL });

  return downloadURL;
};

/**
 * Completes the onboarding process for a user.
 */
export const completeOnboarding = async (uid: string, data: Partial<AppUser>) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    onboardingComplete: true,
  });
};
