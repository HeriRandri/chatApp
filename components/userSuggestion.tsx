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
// import Image from "next/image";

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

      setUsers(results);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSendRequest = async (targetUser: UserSuggestion) => {
    if (!currentUser) return;

    const currentRef = doc(db, "friends", currentUser.uid);
    const targetRef = doc(db, "friends", targetUser.uid);

    const currentDoc = await getDoc(currentRef);
    const targetDoc = await getDoc(targetRef);

    const currentList = currentDoc.exists() ? currentDoc.data().list || [] : [];
    const targetList = targetDoc.exists() ? targetDoc.data().list || [] : [];

    await setDoc(currentRef, {
      list: [...currentList, { uid: targetUser.uid, status: "pending" }],
    });

    await setDoc(targetRef, {
      list: [...targetList, { uid: currentUser.uid, status: "requested" }],
    });
  };

  const handleAcceptRequest = async (targetUser: UserSuggestion) => {
    if (!currentUser) return;

    const currentRef = doc(db, "friends", currentUser.uid);
    const targetRef = doc(db, "friends", targetUser.uid);

    const currentDoc = await getDoc(currentRef);
    const targetDoc = await getDoc(targetRef);

    const currentList =
      (currentDoc.exists() ? currentDoc.data().list : []) || [];
    const targetList = (targetDoc.exists() ? targetDoc.data().list : []) || [];

    interface FriendEntry {
      uid: string;
      status: string;
    }

    const updatedCurrent = currentList.map((f: FriendEntry) =>
      f.uid === targetUser.uid ? { ...f, status: "accepted" } : f
    );
    const updatedTarget = targetList.map((f: FriendEntry) =>
      f.uid === currentUser.uid ? { ...f, status: "accepted" } : f
    );

    await setDoc(currentRef, { list: updatedCurrent });
    await setDoc(targetRef, { list: updatedTarget });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Suggestions</h2>
      {users.map((user) => (
        <div
          key={user.uid}
          className="flex items-center justify-between bg-white shadow p-3 rounded"
        >
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt={user.displayName}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          {user.status === "accepted" ? (
            <span className="text-green-600 text-sm">Ami</span>
          ) : user.status === "pending" ? (
            <span className="text-yellow-500 text-sm">En attente</span>
          ) : user.status === "requested" ? (
            <button
              onClick={() => handleAcceptRequest(user)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded"
            >
              Accepter
            </button>
          ) : (
            <button
              onClick={() => handleSendRequest(user)}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
            >
              Ajouter
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
