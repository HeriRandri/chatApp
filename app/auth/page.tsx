"use client";

import {
  auth,
  providerGoogle,
  registerUser, // fonction Firestore bien typée
} from "@/app/firebase/clientApp";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthEntryPoint() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      // Connexion avec Google via le provider déjà exporté
      const result = await signInWithPopup(auth, providerGoogle);

      // Préparation des données utilisateur à enregistrer dans Firestore
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };

      // Enregistrement dans Firestore
      await registerUser(userData);

      // Redirection vers la page principale
      router.push("/chats");
    } catch (err) {
      console.error("Erreur Google :", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-gray-900 text-white p-6">
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-lg rounded-xl p-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src="/chat.jpg"
          alt="Chat App Logo"
          width={80}
          height={80}
          className="dark:invert rounded-full shadow-lg mb-4"
        />

        <h1 className="text-3xl font-bold text-center">
          Bienvenue sur <span className="text-blue-500">ChattApp</span>
        </h1>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold"
        >
          Se connecter avec Google
        </button>

        {/* Séparateur */}
        <div className="flex items-center w-full gap-4">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          <span className="text-sm text-gray-400">ou</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
        </div>

        {/* Autres options */}
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 py-2 rounded"
          >
            Connexion par Email
          </button>
          <button
            onClick={() => router.push("/auth")}
            className="w-full border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 py-2 rounded"
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
