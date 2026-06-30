import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { app } from './firebase';

export const auth = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? getAuth(app) : null;

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signupWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};
