// clientApp.ts

import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLKj8QnapiBrb3XKb3NKbTEo67IyD5xFw",
  authDomain: "chattapp-475bc.firebaseapp.com",
  projectId: "chattapp-475bc",
  storageBucket: "chattapp-475bc.firebasestorage.app",
  messagingSenderId: "814755818371",
  appId: "1:814755818371:web:703072cd7409c3415764b6",
};

// Ajoutez cette fonction
export interface FirebaseUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export async function registerUser(user: FirebaseUser) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    email: user.email,
  });
}
// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const providerGithub = new GithubAuthProvider();
export const providerGoogle = new GoogleAuthProvider();
export const storage = getStorage(app);
export { serverTimestamp };
