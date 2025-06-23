"use client";
// import Image from "next/image";
// import chatLogo from "@/public/chat.jpg";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white p-6 gap-12">
      <main className="flex flex-col items-center gap-8">
        <img
          src="/chat.jpg"
          alt="Chat App Logo"
          width={150}
          height={150}
          className="dark:invert rounded-full shadow-lg mb-4"
        />
        <h1 className="text-4xl font-bold text-center">
          Bienvenue sur ChatApp
        </h1>
        <p className="text-center text-lg max-w-xl">
          Discutez avec vos amis, envoyez des images et des emojis, et restez
          connecté où que vous soyez.
        </p>

        <Link
          href="/auth"
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold py-3 px-6 rounded-full shadow-lg text-lg"
        >
          Se connecter / S inscrire
        </Link>
      </main>

      <footer className="flex gap-6 text-sm opacity-80">
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Next.js
        </a>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Vercel
        </a>
        <a
          href="https://firebase.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Firebase
        </a>
      </footer>
    </div>
  );
}
