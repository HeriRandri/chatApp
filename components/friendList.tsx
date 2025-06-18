"use client";
import { useEffect, useState } from "react";
import { db } from "../app/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Image from "next/image";

type Friend = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
};

export default function FriendList({
  currentUserId,
  onSelect,
}: {
  currentUserId: string;
  onSelect: (userId: string) => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "friends", currentUserId),
      async (snapshot) => {
        const data = snapshot.data();
        if (!data || !data.list) return;

        type FriendEntry = { uid: string; status: string };

        const accepted = data.list.filter(
          (entry: FriendEntry) => entry.status === "accepted"
        );

        const friendsData = await Promise.all(
          accepted.map(async (entry: FriendEntry) => {
            const userDoc = await getDoc(doc(db, "users", entry.uid));
            const userData = userDoc.data();
            return {
              uid: entry.uid,
              displayName: userData?.displayName,
              email: userData?.email,
              photoURL: userData?.photoURL,
            };
          })
        );

        setFriends(friendsData);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Amis</h2>
      {friends.length > 0 ? (
        friends.map((user) => (
          <div
            key={user.uid}
            className="flex items-center gap-3 p-3 bg-white shadow rounded cursor-pointer hover:bg-gray-100"
            onClick={() => onSelect(user.uid)}
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt={user.displayName || "Avatar"}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Vous n'avez pas encore d'amis.</p>
      )}
    </div>
  );
}
