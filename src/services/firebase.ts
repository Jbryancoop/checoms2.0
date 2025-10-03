// Use Firebase Web SDK
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth with local persistence
// Use getAuth if already initialized, otherwise initializeAuth
let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} catch (error: any) {
  // If already initialized, just get the existing auth instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

// Initialize Firestore with React Native compatibility
const db = getFirestore(app);

// Configure Firestore for React Native
if (Platform.OS !== 'web') {
  // Enable network for Firestore
  import('firebase/firestore').then(({ enableNetwork }) => {
    enableNetwork(db).catch(console.error);
  });
}

export { db };

console.log('🔥 Firebase Web SDK initialized with local persistence and React Native Firestore config');
