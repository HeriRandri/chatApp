"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/app/firebase/clientApp";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { FiLoader, FiX, FiUserPlus, FiCheck, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";

interface UserSuggestion {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  status: string | null;
}

export default function UserSuggestions() {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users"),
      where("uid", "!=", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendsSnapshot = await getDoc(doc(db, "friends", currentUser.uid));
      const friendsData = friendsSnapshot.exists()
        ? friendsSnapshot.data().list || []
        : [];

      interface FriendEntry {
        uid: string;
        status: string;
      }

      const results = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const statusEntry = (friendsData as FriendEntry[]).find(
          (f: FriendEntry) => f.uid === data.uid
        );
        return {
          id: docSnap.id,
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          status: statusEntry?.status || null,
        };
      });

      // Filtrer les utilisateurs déjà amis ou ceux dont la demande est en attente
      setUsers(results.filter((u) => u.status !== "accepted"));
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSendRequest = async (targetUser: UserSuggestion) => {
    if (!currentUser) return;
    setLoadingUid(targetUser.uid);

    // Mise à jour optimiste
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === targetUser.uid ? { ...u, status: "pending" } : u
      )
    );

    try {
      const currentRef = doc(db, "friends", currentUser.uid);
      const targetRef = doc(db, "friends", targetUser.uid);

      const [currentDoc, targetDoc] = await Promise.all([
        getDoc(currentRef),
        getDoc(targetRef),
      ]);

      const currentList = currentDoc.exists()
        ? currentDoc.data().list || []
        : [];
      const targetList = targetDoc.exists() ? targetDoc.data().list || [] : [];

      // Vérifier si la demande existe déjà
      const alreadyRequested = currentList.some(
        (f: { uid: string }) => f.uid === targetUser.uid
      );

      if (alreadyRequested) {
        throw new Error("Demande déjà envoyée");
      }

      await Promise.all([
        setDoc(currentRef, {
          list: [...currentList, { uid: targetUser.uid, status: "pending" }],
        }),
        setDoc(targetRef, {
          list: [...targetList, { uid: currentUser.uid, status: "requested" }],
        }),
      ]);

      toast.success(`Demande envoyée à ${targetUser.displayName}`);
    } catch (err) {
      console.error("Erreur d'envoi de demande:", err);
      toast.error(
        err instanceof Error
          ? `Erreur: ${err.message}`
          : "Erreur lors de l'envoi de la demande"
      );
      // Annuler la mise à jour optimiste en cas d'erreur
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, status: null } : u))
      );
    } finally {
      setLoadingUid(null);
    }
  };

  const handleAcceptRequest = async (targetUser: UserSuggestion) => {
    if (!currentUser) return;
    setLoadingUid(targetUser.uid);

    try {
      const currentRef = doc(db, "friends", currentUser.uid);
      const targetRef = doc(db, "friends", targetUser.uid);

      const [currentDoc, targetDoc] = await Promise.all([
        getDoc(currentRef),
        getDoc(targetRef),
      ]);

      const currentList = currentDoc.exists()
        ? currentDoc.data().list || []
        : [];
      const targetList = targetDoc.exists() ? targetDoc.data().list || [] : [];

      const updatedCurrent = currentList.map(
        (f: { uid: string; status: string }) =>
          f.uid === targetUser.uid ? { ...f, status: "accepted" } : f
      );
      const updatedTarget = targetList.map(
        (f: { uid: string; status: string }) =>
          f.uid === currentUser.uid ? { ...f, status: "accepted" } : f
      );

      await Promise.all([
        setDoc(currentRef, { list: updatedCurrent }),
        setDoc(targetRef, { list: updatedTarget }),
      ]);

      // Mettre à jour l'état local
      setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      toast.success(`${targetUser.displayName} ajouté(e) à vos amis`);
    } catch (err) {
      console.error("Erreur d'acceptation:", err);
      toast.error("Erreur lors de l'acceptation de la demande");
    } finally {
      setLoadingUid(null);
    }
  };

  const handleCancelRequest = async (targetUser: UserSuggestion) => {
    if (!currentUser) return;
    setLoadingUid(targetUser.uid);

    try {
      const currentRef = doc(db, "friends", currentUser.uid);
      const targetRef = doc(db, "friends", targetUser.uid);

      const [currentDoc, targetDoc] = await Promise.all([
        getDoc(currentRef),
        getDoc(targetRef),
      ]);

      const currentList = currentDoc.exists()
        ? currentDoc.data().list || []
        : [];
      const targetList = targetDoc.exists() ? targetDoc.data().list || [] : [];

      const updatedCurrent = currentList.filter(
        (f: { uid: string }) => f.uid !== targetUser.uid
      );
      const updatedTarget = targetList.filter(
        (f: { uid: string }) => f.uid !== currentUser.uid
      );

      await Promise.all([
        setDoc(currentRef, { list: updatedCurrent }),
        setDoc(targetRef, { list: updatedTarget }),
      ]);

      // Mettre à jour l'état local
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, status: null } : u))
      );
      toast.success("Demande annulée");
    } catch (err) {
      console.error("Erreur d'annulation:", err);
      toast.error("Erreur lors de l'annulation de la demande");
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
        <FiUserPlus className="text-blue-400" />
        Suggestions d amis
      </h2>

      {users.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          Aucune suggestion pour le moment
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between bg-gray-800/80 hover:bg-gray-800 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt={user.displayName}
                className="w-10 h-10 rounded-full border-2 border-gray-600 object-cover"
              />
              <div className="truncate">
                <p className="font-medium text-gray-100 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {user.status === "pending" ? (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <FiClock className="animate-pulse" />
                  <span>En attente</span>
                </div>
              ) : user.status === "requested" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(user)}
                    disabled={loadingUid === user.uid}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {loadingUid === user.uid ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <FiCheck />
                    )}
                    <span>Accepter</span>
                  </button>
                  <button
                    onClick={() => handleCancelRequest(user)}
                    disabled={loadingUid === user.uid}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Refuser"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSendRequest(user)}
                  disabled={loadingUid === user.uid}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {loadingUid === user.uid ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiUserPlus />
                  )}
                  <span>Ajouter</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
