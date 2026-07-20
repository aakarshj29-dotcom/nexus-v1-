import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!hasFirebaseConfig && typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    console.warn(
      'Nexus Warning: Firebase configuration keys are missing. Mock Authentication is active, which is expected for offline mock execution.'
    );
  } else {
    console.error(
      'Nexus Error: Firebase configuration keys are missing. Please configure your environment variables in your deployment dashboard.'
    );
  }
}

// Use fallback dummy config if no key is provided to avoid crashing builds/mock runtime
const activeConfig = hasFirebaseConfig
  ? firebaseConfig
  : {
      apiKey: 'dummy-api-key-for-nexus-mock-mode',
      authDomain: 'dummy-nexus.firebaseapp.com',
      projectId: 'dummy-nexus-project',
      storageBucket: 'dummy-nexus.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
    };

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);

export { app };
