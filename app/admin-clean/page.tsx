"use client";
import { useEffect, useState } from "react";
import { cleanAllFriendLists } from "../utils/cleanFriends";

export default function AdminCleanPage() {
  const [status, setStatus] = useState("Nettoyage en cours...");

  useEffect(() => {
    cleanAllFriendLists()
      .then(() => setStatus("✅ Nettoyage terminé !"))
      .catch((err) => setStatus("❌ Erreur: " + err.message));
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-semibold mb-4">Nettoyage des amis</h1>
      <p>{status}</p>
    </div>
  );
}
