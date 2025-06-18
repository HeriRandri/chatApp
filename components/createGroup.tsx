"use client";
import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../app/firebase/clientApp";
import { useRouter } from "next/navigation";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const router = useRouter();

  const createGroup = async () => {
    if (!auth.currentUser) return;

    const groupData = {
      name,
      description,
      members: [...members, auth.currentUser.uid],
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      lastMessage: "",
      updatedAt: serverTimestamp(),
    };

    const groupRef = doc(collection(db, "groups"));
    await setDoc(groupRef, groupData);

    router.push(`/chat?group=${groupRef.id}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Créer un groupe</h2>
      <div className="space-y-4">
        <div>
          <label>Nom du groupe</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Ici vous pourriez ajouter un sélecteur de membres */}
        <button
          onClick={createGroup}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Créer le groupe
        </button>
      </div>
    </div>
  );
}
