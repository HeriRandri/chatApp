"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/clientApp";
import GroupList from "@/components/groupeList";
import PrivateChat from "@/components/privateChat";
import GroupChat from "@/components/groupeChat";
import FriendList from "@/components/friendList";
import UserSuggestions from "@/components/userSuggestion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FiSettings, FiArrowLeft } from "react-icons/fi";

export default function ChatPage() {
  const [user, loading] = useAuthState(auth);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"private" | "groups">("private");
  const [mobileTab, setMobileTab] = useState<"list" | "chat">("list");
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedUserId || selectedGroupId) {
      setMobileTab("chat");
    }
  }, [selectedUserId, selectedGroupId]);

  if (loading)
    return <div className="text-white text-center mt-10">Chargement...</div>;
  if (!user)
    return (
      <div className="text-white text-center mt-10">
        Veuillez vous connecter
      </div>
    );

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gradient-to-br bg-black text-white ">
      {/* COLONNE LISTE */}
      <div
        className={`${
          mobileTab === "list" ? "flex" : "hidden"
        } md:flex w-full md:w-1/3 flex-col text-white dark:bg-gray-900  dark:text-white border-r`}
      >
        {/* HEADER PROFILE */}
        <div className="flex items-center gap-3 p-4 border-b relative  text-white bg-black">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="font-semibold ">
              {user.displayName || "Utilisateur"}
            </div>
            <div className="text-sm dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
          >
            <FiSettings size={20} />
          </button>
          {showSettings && (
            <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 border rounded shadow w-48 z-10">
              <button
                onClick={() => {
                  setShowSettings(false);
                  router.push("/account-settings");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 font-extrabold"
              >
                Mon compte
              </button>
              <button
                onClick={async () => {
                  setShowSettings(false);
                  await signOut(auth);
                  router.push("/auth");
                }}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex border-b bg-black ">
          <button
            className={`flex-1 py-3  ${
              activeTab === "private"
                ? "border-b-2 border-blue-500 font-semibold"
                : ""
            }`}
            onClick={() => setActiveTab("private")}
          >
            Messages privés
          </button>
          <button
            className={`flex-1 py-3   ${
              activeTab === "groups"
                ? "border-b-2 border-blue-500 font-semibold"
                : ""
            }`}
            onClick={() => setActiveTab("groups")}
          >
            Groupes
          </button>
        </div>

        {/* CREATE GROUP */}
        <div className="p-2 border-b">
          <Link
            href="/create-group"
            className="block w-full  hover:bg-white hover:text-black bg-black text-white py-2 px-4 rounded text-center transition-colors"
          >
            + Créer un groupe
          </Link>
        </div>

        {/* LISTES */}
        <div className="flex-1 overflow-y-auto p-2 bg-black text-white ">
          {activeTab === "private" ? (
            <>
              <FriendList
                currentUserId={user.uid}
                onSelect={(id) => {
                  setSelectedUserId(id);
                  setSelectedGroupId(null);
                }}
              />
              <UserSuggestions />
            </>
          ) : (
            <GroupList
              onSelect={(groupId) => {
                setSelectedGroupId(groupId);
                setSelectedUserId(null);
              }}
            />
          )}
        </div>
      </div>

      {/* CHAT */}
      <div
        className={`${
          mobileTab === "chat" ? "flex" : "hidden"
        } md:flex flex-1 flex-col bg-white dark:bg-gray-950 text-black dark:text-white`}
      >
        {/* Mobile Back Button */}
        <div className="md:hidden p-2 border-b bg-white dark:bg-gray-900">
          <button
            onClick={() => {
              setMobileTab("list");
              setSelectedUserId(null);
              setSelectedGroupId(null);
            }}
            className="flex items-center gap-1 text-blue-600"
          >
            <FiArrowLeft /> Retour
          </button>
        </div>

        {selectedUserId ? (
          <PrivateChat recipientId={selectedUserId} />
        ) : selectedGroupId ? (
          <GroupChat groupId={selectedGroupId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md">
              <h2 className="text-xl font-semibold mb-2">
                {activeTab === "private"
                  ? "Sélectionnez un contact"
                  : "Sélectionnez un groupe"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === "private"
                  ? "Commencez une conversation privée avec un ami."
                  : "Rejoignez ou créez un groupe pour discuter à plusieurs."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
