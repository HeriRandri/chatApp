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

  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Veuillez vous connecter</div>;

  return (
    <div className="flex h-screen bg-gray-50 text-black flex-col md:flex-row">
      {/* LISTE (amis + groupes) */}
      <div
        className={`${
          mobileTab === "list" ? "flex" : "hidden"
        } md:flex w-full md:w-1/3 border-r bg-white flex-col`}
      >
        {/* PROFILE + SETTINGS */}
        <div className="flex items-center gap-3 p-4 border-b relative">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="font-semibold">
              {user.displayName || "Utilisateur"}
            </div>
            <div className="text-sm text-gray-500 truncate">{user.email}</div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiSettings size={20} />
          </button>
          {showSettings && (
            <div className="absolute top-16 right-4 bg-white border rounded shadow w-48 z-10">
              <button
                onClick={() => {
                  setShowSettings(false);
                  router.push("/account-settings");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Mon compte
              </button>
              <button
                onClick={async () => {
                  setShowSettings(false);
                  await signOut(auth);
                  router.push("/login");
                }}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 ${
              activeTab === "private" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("private")}
          >
            Messages privés
          </button>
          <button
            className={`flex-1 py-3 ${
              activeTab === "groups" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("groups")}
          >
            Groupes
          </button>
        </div>

        <div className="p-2 border-b">
          <Link
            href="/create-group"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded text-center hover:bg-gray-300 hover:text-black transition-colors"
          >
            + Créer un groupe
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
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
        } md:flex flex-1 flex-col`}
      >
        {/* Retour mobile */}
        <div className="md:hidden p-2 border-b">
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
              <p className="text-gray-600">
                {activeTab === "private"
                  ? "Commencez une conversation privée"
                  : "Participez à une discussion de groupe"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation mobile (en bas) */}
      {/* <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-white z-10 pb-14">
        <button
          className={`flex-1 text-center ${
            mobileTab === "list" ? "text-blue-600 font-semibold" : ""
          }`}
          onClick={() => setMobileTab("list")}
        >
          <FiUser className="mx-auto mb-1" />
          Discussions
        </button>
        <button
          className={`flex-1 text-center ${
            mobileTab === "chat" ? "text-blue-600 font-semibold" : ""
          }`}
          onClick={() => setMobileTab("chat")}
          disabled={!selectedUserId && !selectedGroupId}
        >
          <FiMessageSquare className="mx-auto mb-1" />
          Chat
        </button>
      </div> */}
    </div>
  );
}
