"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "@/app/firebase/clientApp";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { FiMoreVertical, FiSearch, FiUser, FiX, FiCheck } from "react-icons/fi";
import { debounce } from "lodash";
import toast from "react-hot-toast";

type FriendEntry = { uid: string; status: string; updatedAt?: Date };

interface Friend {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  unreadCount?: number;
  status?: string;
}

export default function FriendList({
  currentUserId,
  onSelect,
}: {
  currentUserId: string;
  onSelect: (userId: string) => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"friends" | "blocked">(
    "friends"
  );

  // Mémoized filtered friends
  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) return friends;
    return friends.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [friends, searchTerm]);

  // Optimized search with debounce
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Fetch friends data with optimized queries
  const fetchFriendsData = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return;

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    try {
      const friendsDoc = await getDoc(doc(db, "friends", currentUserId));
      if (!friendsDoc.exists()) {
        setFriends([]);
        setBlockedUsers([]);
        return;
      }

      const friendsData = friendsDoc.data().list || [];
      const accepted = friendsData.filter(
        (f: FriendEntry) => f.status === "accepted"
      );
      const blocked = friendsData.filter(
        (f: FriendEntry) => f.status === "blocked"
      );

      // Process blocked users
      const blockedUsersData = await Promise.all(
        blocked.map(async (entry: FriendEntry) => {
          const userDoc = await getDoc(doc(db, "users", entry.uid));
          return {
            uid: entry.uid,
            status: "blocked",
            ...userDoc.data(),
            lastSeen: userDoc.data()?.lastSeen?.toDate(),
          };
        })
      );
      setBlockedUsers(blockedUsersData);

      // Process accepted friends with real-time updates
      const friendsWithData = await Promise.all(
        accepted.map(async (entry: FriendEntry) => {
          const userRef = doc(db, "users", entry.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          // Get unread count
          const chatId = [currentUserId, entry.uid].sort().join("_");
          const unreadQuery = query(
            collection(db, `chats/${chatId}/messages`),
            where("senderId", "==", entry.uid),
            where("readAt", "==", null)
          );
          const unreadSnapshot = await getDocs(unreadQuery);

          // Subscribe to user updates
          const unsubscribe = onSnapshot(userRef, (doc) => {
            const updatedData = doc.data();
            setFriends((prev) =>
              prev.map((f) =>
                f.uid === entry.uid
                  ? {
                      ...f,
                      ...updatedData,
                      lastSeen: updatedData?.lastSeen?.toDate(),
                    }
                  : f
              )
            );
          });
          unsubscribes.push(unsubscribe);

          return {
            uid: entry.uid,
            status: "accepted",
            ...userData,
            lastSeen: userData?.lastSeen?.toDate(),
            unreadCount: unreadSnapshot.size,
          };
        })
      );

      setFriends(friendsWithData);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends list");
    } finally {
      setLoading(false);
    }

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    fetchFriendsData(currentUserId).then((unsub) => {
      if (isMounted && typeof unsub === "function") {
        unsubscribe = unsub;
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, fetchFriendsData]);

  // Friend actions with batch writes
  const updateFriendStatus = useCallback(
    async (targetUid: string, status: "accepted" | "blocked" | "removed") => {
      if (!currentUserId) return;

      try {
        const batch = writeBatch(db);
        const friendsRef = doc(db, "friends", currentUserId);
        const friendDoc = await getDoc(friendsRef);

        let updatedList = friendDoc.exists() ? friendDoc.data().list || [] : [];

        if (status === "removed") {
          updatedList = updatedList.filter(
            (f: FriendEntry) => f.uid !== targetUid
          );
        } else {
          const existingIndex = updatedList.findIndex(
            (f: FriendEntry) => f.uid === targetUid
          );
          if (existingIndex >= 0) {
            updatedList[existingIndex] = {
              ...updatedList[existingIndex],
              status,
              updatedAt: serverTimestamp(),
            };
          } else {
            updatedList.push({
              uid: targetUid,
              status,
              updatedAt: serverTimestamp(),
            });
          }
        }

        batch.set(friendsRef, { list: updatedList });
        await batch.commit();

        toast.success(
          status === "blocked"
            ? "User blocked successfully"
            : status === "accepted"
            ? "User unblocked"
            : "Friend removed"
        );
      } catch (error) {
        console.error("Error updating friend status:", error);
        toast.error("Failed to update friend status");
      }
    },
    [currentUserId]
  );

  const handleBlockFriend = (targetUser: Friend) => {
    updateFriendStatus(targetUser.uid, "blocked");
    setMenuOpen(null);
  };

  const handleRemoveFriend = (targetUser: Friend) => {
    updateFriendStatus(targetUser.uid, "removed");
    setMenuOpen(null);
  };

  const handleUnblock = (targetUser: Friend) => {
    updateFriendStatus(targetUser.uid, "accepted");
  };

  // Online status calculation
  const getOnlineStatus = useCallback((user: Friend) => {
    if (user.isOnline)
      return { text: "En ligne", icon: "🟢", color: "text-green-500" };
    if (!user.lastSeen)
      return { text: "Hors ligne", icon: "⚪", color: "text-gray-500" };

    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - user.lastSeen.getTime()) / 60000
    );

    if (diffMinutes < 1)
      return { text: "En ligne", icon: "🟢", color: "text-green-500" };
    if (diffMinutes < 60)
      return {
        text: `${diffMinutes} min`,
        icon: "🕒",
        color: "text-yellow-500",
      };
    if (diffMinutes < 1440)
      return {
        text: `${Math.floor(diffMinutes / 60)} h`,
        icon: "🕒",
        color: "text-yellow-500",
      };
    return {
      text: `${Math.floor(diffMinutes / 1440)} j`,
      icon: "📆",
      color: "text-gray-400",
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Contacts</h2>

      {/* Search bar */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher un contact..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`flex-1 py-2 font-medium ${
            selectedTab === "friends"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setSelectedTab("friends")}
        >
          Amis ({friends.length})
        </button>
        <button
          className={`flex-1 py-2 font-medium ${
            selectedTab === "blocked"
              ? "text-red-400 border-b-2 border-red-400"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setSelectedTab("blocked")}
        >
          Bloqués ({blockedUsers.length})
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : selectedTab === "friends" ? (
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Aucun ami trouvé" : "Aucun ami ajouté"}
            </div>
          ) : (
            filteredFriends.map((user) => (
              <div
                key={user.uid}
                className="relative flex items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition cursor-pointer group"
                onClick={() => onSelect(user.uid)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt={user.displayName || "Avatar"}
                      className="w-10 h-10 rounded-full border-2 border-gray-600 object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        user.isOnline ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {user.displayName || user.email}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className={getOnlineStatus(user).color}>
                        {getOnlineStatus(user).icon}{" "}
                        {getOnlineStatus(user).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.unreadCount && user.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {user.unreadCount}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === user.uid ? null : user.uid);
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600"
                  >
                    <FiMoreVertical />
                  </button>
                </div>

                {menuOpen === user.uid && (
                  <div className="absolute right-2 top-12 bg-gray-700 rounded-md shadow-xl z-10 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(user.uid);
                        setMenuOpen(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-600 w-full text-left"
                    >
                      <FiUser size={14} /> Voir profil
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockFriend(user);
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-600 w-full text-left"
                    >
                      <FiX size={14} /> Bloquer
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur bloqué
            </div>
          ) : (
            blockedUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full border-2 border-gray-600"
                  />
                  <div>
                    <p className="font-medium">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-gray-400">Bloqué</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  <FiCheck size={14} /> Débloquer
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
