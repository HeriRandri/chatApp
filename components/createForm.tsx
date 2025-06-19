"use client";
import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/app/firebase/clientApp";
import UserSelector from "@/components/userSelector";
import { useRouter } from "next/navigation";

export default function CreateGroupForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const router = useRouter();

  const createGroup = async () => {
    if (!auth.currentUser || !name.trim()) return;

    try {
      const groupData = {
        name,
        description,
        members: [...selectedUsers, auth.currentUser.uid],
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessage: "",
        updatedAt: serverTimestamp(),
      };

      // Crée le groupe avec un ID auto-généré
      const groupRef = doc(collection(db, "groups"));
      await setDoc(groupRef, groupData);
      console.log("====================================");
      console.log(`Groupe créé avec succès: ${groupRef.id}`);
      console.log("====================================");
      // Redirige vers le nouveau groupe
      router.push(`/chats`);
    } catch (error) {
      console.error("Erreur création groupe:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow text-black">
      <h2 className="text-2xl font-bold mb-6">Nouveau groupe</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1">Nom du groupe*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nommez votre groupe"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Décrivez le but du groupe"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1">Membres*</label>
          <UserSelector
            currentUserId={auth.currentUser?.uid || ""}
            onUsersSelected={setSelectedUsers}
          />
        </div>

        <button
          onClick={createGroup}
          disabled={!name.trim() || selectedUsers.length === 0}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Créer le groupe
        </button>
      </div>
    </div>
  );
}
