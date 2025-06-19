"use client";
import {
  auth,
  registerUser, // ta fonction perso
} from "@/app/firebase/clientApp";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthEntryPoint() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await registerUser(result.user); // si tu enregistres en Firestore
      router.push("/chats");
    } catch (err) {
      console.error("Erreur Google :", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-6">
          Bienvenue sur <span className="text-blue-600">ChattApp</span>
        </h1>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium"
        >
          Se connecter avec Google
        </button>

        {/* Séparateur */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-4 text-gray-400">ou</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        {/* Liens vers login/register */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full border border-blue-500 text-blue-500 hover:bg-blue-50 py-2 rounded"
          >
            Connexion par Email
          </button>
          <button
            onClick={() => router.push("/register")}
            className="w-full border border-green-600 text-green-600 hover:bg-green-50 py-2 rounded"
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
