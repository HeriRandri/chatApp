// firebase/clientApp.ts (UNIQUEMENT pour le client)
"use client"; // Important pour Next.js

import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLKj8QnapiBrb3XKb3NKbTEo67IyD5xFw",
  authDomain: "chattapp-475bc.firebaseapp.com", // Utilisez toujours le domaine Firebase
  projectId: "chattapp-475bc",
  storageBucket: "chattapp-475bc.appspot.com",
  messagingSenderId: "814755818371",
  appId: "1:814755818371:web:703072cd7409c3415764b6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const providerGithub = new GithubAuthProvider();
export const providerGoogle = new GoogleAuthProvider();
export const storage = getStorage(app);
export { serverTimestamp };
