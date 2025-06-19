// app/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { auth } from "../app/firebase/clientApp";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  if (!user) return <p className="text-center mt-20">Chargement...</p>;

  return (
    <div className="flex flex-col items-center  min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow text-center">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <h1 className="text-xl font-semibold">
          {user.displayName || "Utilisateur"}
        </h1>
        <p className="text-gray-500">{user.email}</p>

        <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
