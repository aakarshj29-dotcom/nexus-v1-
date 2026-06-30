import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from './firestore';
import { db } from './firestore';
import { AppUser } from '@/types/auth';

const COLLECTION_NAME = 'users';

export const createUserDocument = async (user: AppUser) => {
  const userRef = doc(db, COLLECTION_NAME, user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...user,
      isNewUser: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return true; // Document created
  }

  return false; // Document already exists
};

export const getUserDocument = async (uid: string): Promise<AppUser | null> => {
  const userRef = doc(db, COLLECTION_NAME, uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as AppUser;
  }

  return null;
};

export const updateLastLogin = async (uid: string) => {
  const userRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(userRef, {
    lastLogin: serverTimestamp(),
    isNewUser: false, // Once they login again, they are no longer "new" in this context
  });
};
