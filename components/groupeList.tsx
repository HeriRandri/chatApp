"use client";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/app/firebase/clientApp";
import Link from "next/link";
import { deleteDocument, updateDocument } from "@/services/crudServices";
import { FiTrash, FiEdit2 } from "react-icons/fi";

interface Group {
  id: string;
  name: string;
  description: string;
  lastMessage?: string;
  updatedAt?: { toDate: () => Date };
}

export default function GroupList({
  onSelect,
}: {
  onSelect: (groupId: string) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Group)
        )
      );
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (groupId: string) => {
    if (!auth.currentUser) return;

    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce groupe ?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDocument("groups", groupId);
      console.log(`Groupe ${groupId} supprimé avec succès`);
    } catch (error) {
      console.error("Erreur lors de la suppression du groupe:", error);
    }
  };

  const handleUpdate = async (groupId: string) => {
    if (!auth.currentUser) return;

    const confirmUpdate = window.confirm(
      "Voulez-vous vraiment mettre à jour ce groupe ?"
    );
    if (!confirmUpdate) return;

    const newTitle = prompt("Entrez le nouveau nom du groupe:");
    const description = prompt("Entrez la nouvelle description du groupe:");
    if (!newTitle) return;

    try {
      await updateDocument("groups", groupId, {
        name: newTitle,
        description: description,
      });
      console.log(`Groupe ${groupId} mis à jour avec succès`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe:", error);
    }
  };

  return (
    <div>
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Vous n avez pas encore de groupes</p>
          <Link href="/create-group" className="text-blue-500 hover:underline">
            Créer un groupe
          </Link>
        </div>
      ) : (
        groups.map((group) => (
          <div
            key={group.id}
            className="p-3 border-b hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(group.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-base mb-1">{group.name}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {group.lastMessage || group.description}
                </p>
              </div>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdate(group.id);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                  title="Modifier"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Supprimer"
                >
                  <FiTrash size={16} />
                </button>
              </div>
            </div>
            {group.updatedAt && (
              <div className="text-xs text-gray-400 mt-1">
                Dernière mise à jour :{" "}
                {group.updatedAt.toDate().toLocaleDateString()}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
