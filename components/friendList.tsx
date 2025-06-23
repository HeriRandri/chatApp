"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/firebase/clientApp";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type FriendEntry = { uid: string; status: string };

function removeDuplicates(arr: FriendEntry[]) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.uid)) return false;
    seen.add(item.uid);
    return true;
  });
}

type Friend = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: Date;
};

export default function FriendList({
  currentUserId,
  onSelect,
}: {
  currentUserId: string;
  onSelect: (userId: string) => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    // Détacher les anciens listeners
    const unsubscribes: (() => void)[] = [];

    const unsubscribeFriends = onSnapshot(
      doc(db, "friends", currentUserId),
      async (snapshot) => {
        const data = snapshot.data();
        if (!data || !data.list) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const accepted = removeDuplicates(
          data.list.filter((entry: FriendEntry) => entry.status === "accepted")
        );

        const friendsData = await Promise.all(
          accepted.map(async (entry: FriendEntry) => {
            // Écouter les changements de statut pour chaque ami
            const unsubscribe = onSnapshot(
              doc(db, "users", entry.uid),
              (userDoc) => {
                const userData = userDoc.data();
                setFriends((prev) =>
                  prev.map((friend) =>
                    friend.uid === entry.uid
                      ? {
                          ...friend,
                          displayName: userData?.displayName,
                          email: userData?.email,
                          photoURL: userData?.photoURL,
                          isOnline: userData?.isOnline,
                          lastSeen: userData?.lastSeen?.toDate(),
                        }
                      : friend
                  )
                );
              }
            );

            unsubscribes.push(unsubscribe);

            const userDoc = await getDoc(doc(db, "users", entry.uid));
            const userData = userDoc.data();
            return {
              uid: entry.uid,
              displayName: userData?.displayName,
              email: userData?.email,
              photoURL: userData?.photoURL,
              isOnline: userData?.isOnline,
              lastSeen: userData?.lastSeen?.toDate(),
            };
          })
        );

        setFriends(friendsData);
        setLoading(false);
      }
    );

    unsubscribes.push(unsubscribeFriends);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUserId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const fetchUsers = async () => {
        try {
          const q = query(
            collection(db, "users"),
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + "\uf8ff")
          );
          const snapshot = await getDocs(q);
          const results = snapshot.docs
            .map((doc) => ({
              ...(doc.data() as Friend),
              lastSeen: doc.data().lastSeen?.toDate(),
            }))
            .filter((user) => user.uid !== currentUserId);
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching users:", error);
        }
      };
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentUserId]);

  const displayUsers = searchTerm ? searchResults : friends;

  const getOnlineStatus = (user: Friend) => {
    if (user.isOnline) return "En ligne";
    if (user.lastSeen) {
      const now = new Date();
      const lastSeen = user.lastSeen;
      const diffMinutes = Math.floor(
        (now.getTime() - lastSeen.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 5) return "En ligne récemment";
      if (diffMinutes < 60) return `Hors ligne depuis ${diffMinutes} min`;
      if (diffMinutes < 24 * 60)
        return `Hors ligne depuis ${Math.floor(diffMinutes / 60)} h`;
      return `Hors ligne depuis ${Math.floor(diffMinutes / (60 * 24))} j`;
    }
    return "Hors ligne";
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Amis</h2>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Rechercher un ami..."
        className="w-full p-2 rounded border text-black bg-white"
      />

      {loading && !searchTerm ? (
        <p className="text-gray-500">Chargement des amis...</p>
      ) : displayUsers.length > 0 ? (
        displayUsers.map((user) => (
          <div
            key={user.uid}
            className="flex items-center gap-3 p-3  shadow rounded cursor-pointer hover:bg-gray-100 hover:text-black"
            onClick={() => onSelect(user.uid)}
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt={user.displayName || "Avatar"}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">{getOnlineStatus(user)}</p>
            </div>
            <span
              className={`w-3 h-3 rounded-full ${
                user.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              title={getOnlineStatus(user)}
            ></span>
          </div>
        ))
      ) : (
        <p className="text-gray-500">
          {searchTerm ? "Aucun résultat trouvé." : "Aucun ami à afficher."}
        </p>
      )}
    </div>
  );
}
