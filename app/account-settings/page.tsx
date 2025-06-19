"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/firebase/clientApp";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AccountSettings() {
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDisplayName(user.displayName || "");
        setPhotoURL(user.photoURL || "");
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.push("/chats");
    } catch (err) {
      console.error("Erreur mise à jour:", err);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-semibold mb-4">Mon compte</h1>

      <label className="block mb-2">Nom affiché</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2">URL de la photo de profil</label>
      <input
        type="text"
        value={photoURL}
        onChange={(e) => setPhotoURL(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={handleUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Mettre à jour
      </button>

      {success && <p className="text-green-600 mt-4">Profil mis à jour !</p>}
    </div>
  );
}
