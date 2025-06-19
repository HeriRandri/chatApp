"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  CollectionReference,
  DocumentData,
  addDoc as firebaseAddDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/clientApp";

type User = {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
};

async function addDoc(
  ref: CollectionReference<DocumentData, DocumentData>,
  data: { from: string; to: string; status: string; createdAt: Date }
) {
  return await firebaseAddDoc(ref, data);
}

export default function UserList({
  onSelect,
  currentUserId,
}: {
  onSelect: (userId: string) => void;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsersAndRelations = async () => {
      const q = query(
        collection(db, "users"),
        where("uid", "!=", currentUserId)
      );
      const querySnapshot = await getDocs(q);
      const allUsers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(allUsers);

      // Get friends
      const friendsSnapshot = await getDocs(collection(db, "friends"));
      const friendList = friendsSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.users.includes(currentUserId);
        })
        .map((doc) => {
          const other = doc
            .data()
            .users.find((uid: string) => uid !== currentUserId);
          return other;
        });

      setFriends(friendList);

      // Get pending requests sent by current user
      const pendingQ = query(
        collection(db, "friendRequests"),
        where("from", "==", currentUserId),
        where("status", "==", "pending")
      );
      const pendingSnap = await getDocs(pendingQ);
      const pendingList = pendingSnap.docs.map((doc) => doc.data().to);
      setPendingRequests(pendingList);
    };

    fetchUsersAndRelations();
  }, [currentUserId]);

  const sendFriendRequest = async (toUserId: string) => {
    await addDoc(collection(db, "friendRequests"), {
      from: currentUserId,
      to: toUserId,
      status: "pending",
      createdAt: new Date(),
    });
    setPendingRequests((prev) => [...prev, toUserId]);
  };

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-semibold mb-4">Utilisateurs</h2>
      {users.length > 0 ? (
        users.map((user) => {
          const isFriend = friends.includes(user.uid);
          const isPending = pendingRequests.includes(user.uid);

          return (
            <div
              key={user.uid}
              className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
              onClick={() => onSelect(user.uid)}
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{user.displayName}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div>
                {isFriend ? (
                  <span className="text-green-500 text-sm">✅ Ami</span>
                ) : isPending ? (
                  <span className="text-yellow-500 text-sm">⏳ En attente</span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendFriendRequest(user.uid);
                    }}
                    className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600"
                  >
                    ➕ Ajouter
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          Aucun utilisateur trouvé
        </div>
      )}
    </div>
  );
}
