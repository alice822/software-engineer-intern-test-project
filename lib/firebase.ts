import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmFEobC_dWNuGAvPNEP1nLeE4Dwrw8F24",
  authDomain: "doc-scanner-3dc89.firebaseapp.com",
  projectId: "doc-scanner-3dc89",
  storageBucket: "doc-scanner-3dc89.firebasestorage.app",
  messagingSenderId: "1047900487419",
  appId: "1:1047900487419:web:160c5555d217116a0e7a5e",
  measurementId: "G-R8DZNRCHT0"
};
// Check if Firebase config is available
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
