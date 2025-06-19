// components/UserSelector.tsx
"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase/clientApp"; // Utilisez le chemin absolu

interface User {
  uid: string;
  displayName: string;
}

export default function UserSelector({
  currentUserId,
  onUsersSelected,
}: {
  currentUserId: string;
  onUsersSelected: (userIds: string[]) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("uid", "!=", currentUserId)
        );
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map((doc) => doc.data() as User));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const toggleUser = (userId: string) => {
    const newSelected = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];

    setSelectedIds(newSelected);
    onUsersSelected(newSelected);
  };

  return (
    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
      {users.map((user) => (
        <div
          key={user.uid}
          className={`flex items-center p-2 rounded cursor-pointer ${
            selectedIds.includes(user.uid) ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
          onClick={() => toggleUser(user.uid)}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(user.uid)}
            readOnly
            className="mr-2"
          />
          <span>{user.displayName}</span>
        </div>
      ))}
    </div>
  );
}
