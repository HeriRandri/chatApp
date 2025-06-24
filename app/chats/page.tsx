"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/firebase/clientApp";
import GroupList from "@/components/groupeList";
import PrivateChat from "@/components/privateChat";
import GroupChat from "@/components/groupeChat";
import FriendList from "@/components/friendList";
import UserSuggestions from "@/components/userSuggestion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  FiSettings,
  FiArrowLeft,
  FiSun,
  FiMoon,
  FiVideo,
  FiPhone,
  FiUser,
  FiMessageSquare,
  FiUsers,
} from "react-icons/fi";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export default function ChatPage() {
  const [user, loading] = useAuthState(auth);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"private" | "groups">("private");
  const [mobileTab, setMobileTab] = useState<"list" | "chat">("list");
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return true;
  });
  const [chatTitle, setChatTitle] = useState<string>("");
  const [chatPhoto, setChatPhoto] = useState<string>("");
  const [chatOnline, setChatOnline] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedUserId || selectedGroupId) {
      setMobileTab("chat");
    }
  }, [selectedUserId, selectedGroupId]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchChatHeader = async () => {
      if (selectedUserId) {
        const unsub = onSnapshot(doc(db, "users", selectedUserId), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setChatTitle(data.displayName || "Ami(e)");
            setChatPhoto(data.photoURL || "/default-avatar.png");
            setChatOnline(!!data.isOnline);
          }
        });
        return () => unsub();
      } else if (selectedGroupId) {
        const groupSnap = await getDoc(doc(db, "groups", selectedGroupId));
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          setChatTitle(data.name || "Groupe");
          setChatPhoto(data.photoURL || "/group-default.png");
        }
      } else {
        setChatTitle("");
        setChatPhoto("");
        setChatOnline(false);
      }
    };

    fetchChatHeader();
  }, [selectedUserId, selectedGroupId]);

  if (loading)
    return (
      <div className="text-white text-center mt-10 animate-pulse">
        Chargement...
      </div>
    );
  if (!user)
    return (
      <div className="text-white text-center mt-10">
        Veuillez vous connecter
      </div>
    );

  return (
    <div
      className={`flex h-screen flex-col ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* Barre de navigation principale (toujours visible) */}
      <div className="w-full flex items-center justify-between p-3 border-b bg-white dark:bg-gray-900 dark:text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="User avatar"
              className="w-10 h-10 rounded-full border"
            />
          )}
          <div className="hidden md:block">
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {user.email}
            </p>
          </div>
        </div>

        {/* Titre du chat (visible uniquement en mode mobile chat) */}
        {(selectedUserId || selectedGroupId) && (
          <div className="md:hidden flex items-center gap-4">
            <img
              src={chatPhoto || "/default-avatar.png"}
              alt="Avatar"
              className="w-8 h-8 rounded-full border"
            />
            <h2 className="font-bold">{chatTitle}</h2>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? (
              <FiSun className="text-yellow-300" />
            ) : (
              <FiMoon className="text-gray-700" />
            )}
          </button>
          <button onClick={() => setShowSettings(!showSettings)}>
            <FiSettings className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Menu des paramètres (dropdown) */}
      {showSettings && (
        <div className="absolute right-2 top-16 bg-white dark:bg-gray-800 shadow-lg rounded-md z-20">
          <button
            onClick={async () => {
              setShowSettings(false);
              await signOut(auth);
              router.push("/auth");
            }}
            className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
          >
            Déconnexion
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Liste des utilisateurs et groupes */}
        <div
          className={`${
            mobileTab === "list" ? "flex" : "hidden"
          } md:flex w-full md:w-1/3 flex-col border-r bg-white dark:bg-gray-900`}
        >
          {/* Onglets de navigation */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 flex items-center justify-center gap-2 ${
                activeTab === "private"
                  ? "border-b-2 border-blue-500 font-bold text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab("private")}
            >
              <FiMessageSquare />
              <span>Messages</span>
            </button>
            <button
              className={`flex-1 py-3 flex items-center justify-center gap-2 ${
                activeTab === "groups"
                  ? "border-b-2 border-blue-500 font-bold text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              <FiUsers />
              <span>Groupes</span>
            </button>
          </div>

          <div className="p-3">
            <Link
              href="/create-group"
              className="w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition flex items-center justify-center gap-2"
            >
              <span>+ Créer un groupe</span>
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

        {/* Zone de chat */}
        <div
          className={`${
            mobileTab === "chat" ? "flex" : "hidden"
          } md:flex flex-1 flex-col bg-white dark:bg-gray-950`}
        >
          {/* En-tête du chat (visible uniquement sur desktop) */}
          {(selectedUserId || selectedGroupId) && (
            <div className="hidden md:flex w-full items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 dark:text-white shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={chatPhoto || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border"
                />
                <div>
                  <h2 className="font-bold text-lg tracking-wide">
                    {chatTitle}
                  </h2>
                  {selectedUserId && (
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {chatOnline ? "🟢 En ligne" : "⚪ Hors ligne"}
                    </p>
                  )}
                </div>
              </div>
              {selectedUserId && (
                <div className="flex gap-3 items-center">
                  <button
                    title="Appel vocal"
                    className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-800"
                  >
                    <FiPhone size={18} />
                  </button>
                  <button
                    title="Appel vidéo"
                    className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                  >
                    <FiVideo size={18} />
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${selectedUserId}`)}
                    title="Voir le profil"
                    className="p-2 rounded hover:bg-purple-100 dark:hover:bg-purple-800"
                  >
                    <FiUser size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bouton retour mobile */}
          <div className="md:hidden p-3 border-b">
            <button
              onClick={() => {
                setMobileTab("list");
                setSelectedUserId(null);
                setSelectedGroupId(null);
              }}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
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
              <div className="text-center p-4">
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
    </div>
  );
}
