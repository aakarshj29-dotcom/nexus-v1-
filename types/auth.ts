import { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  provider: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isNewUser?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}
