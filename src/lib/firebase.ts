import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB9L-2iD8TfXn66IzTjGmE67zXeDSLbybo",
  authDomain: "boutique-curator-488515.firebaseapp.com",
  projectId: "boutique-curator-488515",
  storageBucket: "boutique-curator-488515.firebasestorage.app",
  messagingSenderId: "803771232940",
  appId: "1:803771232940:web:a18532e54110d61d796509"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
