import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForDevelopment123456789012345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "galileo-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "galileo-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "galileo-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Log configuration for debugging (remove in production)
console.log('🔥 Firebase Config:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialiser Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Fallback: use demo configuration
  const demoConfig = {
    apiKey: "AIzaSyDemoKeyForDevelopment123456789012345",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:demo"
  };
  app = initializeApp(demoConfig);
  auth = getAuth(app);
  console.warn('⚠️ Using demo Firebase configuration');
}

export { auth };
export default app;
