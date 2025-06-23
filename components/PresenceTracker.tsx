// components/PresenceTracker.tsx
"use client";
import { useEffect } from "react";
import { auth, db } from "@/app/firebase/clientApp";
import { doc, updateDoc } from "firebase/firestore";

export default function PresenceTracker() {
  useEffect(() => {
    const setOnline = async () => {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          isOnline: true,
        });
      }
    };

    const setOffline = async () => {
      const user = auth.currentUser;
      if (user) {
        navigator.sendBeacon(`/api/set-offline?uid=${user.uid}`);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setOnline();
      }
    });

    window.addEventListener("beforeunload", setOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", setOffline);
    };
  }, []);

  return null;
}
