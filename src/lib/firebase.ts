import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIrildL9l7YfRrz5UPNfMjRDE-XuogPSw",
  authDomain: "tracker-d1610.firebaseapp.com",
  projectId: "tracker-d1610",
  storageBucket: "tracker-d1610.firebasestorage.app",
  messagingSenderId: "701900652654",
  appId: "1:701900652654:web:7ed2fab51e0a68a081267f",
  measurementId: "G-R22WRSHSS5"
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null;
let db: Firestore;
let auth: Auth;

if (typeof window !== "undefined") {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Server-side: create a minimal app
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, analytics, db, auth };

