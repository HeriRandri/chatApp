"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/app/firebase/clientApp";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiSend, FiImage, FiSmile, FiTrash, FiEdit2 } from "react-icons/fi";

interface Message {
  id: string;
  text: string;
  senderId: string;
  readAt?: Timestamp | null;
  createdAt: Timestamp;
  imageUrl?: string | null;
}

export default function PrivateChat({ recipientId }: { recipientId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showChatNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: icon || "/chat-icon.png",
      });
    }
  };

  const getChatId = useCallback(() => {
    const currentUserId = auth.currentUser?.uid;
    return [currentUserId, recipientId].sort().join("_");
  }, [recipientId]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const chatId = getChatId();
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      const latest = newMessages[newMessages.length - 1];
      const last = messages[messages.length - 1];
      const isNew = latest?.id !== last?.id;
      setMessages(newMessages);
      scrollToBottom();

      if (
        isNew &&
        latest?.senderId !== auth.currentUser?.uid &&
        Notification.permission === "granted"
      ) {
        showChatNotification("Nouveau message 🔔", latest.text || "📷 Image");
      }
    });
    return () => unsubscribe();
  }, [getChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageFile) return;
    setIsUploading(true);
    const chatId = getChatId();
    let imageUrl = null;

    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await setDoc(doc(db, `chats/${chatId}/messages/${Date.now()}`), {
        text: newMessage || "",
        imageUrl: imageUrl || null,
        senderId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, `chats/${chatId}`),
        {
          user1Id: auth.currentUser?.uid,
          user2Id: recipientId,
          lastMessage: newMessage || (imageFile ? "📷 Image" : ""),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(
      storage,
      `chat-images/${auth.currentUser?.uid}/${Date.now()}_${file.name}`
    );
    const metadata = { contentType: file.type };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }
    if (!file.type.match("image.*")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDelete = async (messageId: string) => {
    const confirm = window.confirm("Supprimer ce message ?");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, `chats/${getChatId()}/messages/${messageId}`));
    } catch (error) {
      console.error("Erreur suppression :", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white  overflow-hidden">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === auth.currentUser?.uid
                ? "justify-end"
                : "justify-start"
            } group`}
          >
            <div className="flex flex-col items-start">
              <div
                className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-xl shadow ${
                  msg.senderId === auth.currentUser?.uid
                    ? "text-black bg-white rounded-br-none"
                    : "bg-gray-900 text-white rounded-bl-none"
                }`}
              >
                {msg.text && <p className="break-words pr-6">{msg.text}</p>}
                {msg.imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={msg.imageUrl}
                      alt="Image envoyée"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: 300,
                        objectFit: "cover",
                      }}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 relative justify-between text-white">
                {msg.senderId === auth.currentUser?.uid && (
                  <div className="absolute top-1 left-12 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Modifier"
                      onClick={() => alert("Édition à venir")}
                      className="text-white/80 hover:text-black/80"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(msg.id)}
                      className="text-white/80 hover:text-red-400"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                )}
                <div className="text-xs mt-1 opacity-70 ">
                  {msg.createdAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="bg-gray-800 border-t border-gray-600 p-2 flex items-center gap-4">
          <Image
            src={imagePreview}
            alt="Preview"
            width={100}
            height={100}
            className="rounded-md"
          />
          <button
            onClick={() => {
              setImagePreview(null);
              setImageFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-red-500 hover:text-red-700"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Barre de message */}
      <form
        onSubmit={sendMessage}
        className="bg-gray-800 border-t border-gray-600 p-4"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-white"
            >
              <FiSmile size={22} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: { native: string }) => {
                    setNewMessage((prev) => prev + emoji.native);
                    setShowEmojiPicker(false);
                  }}
                  theme="dark"
                />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <FiImage size={22} />
          </label>

          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none"
          />

          <button
            type="submit"
            disabled={isUploading || (!newMessage.trim() && !imageFile)}
            className={`p-2 rounded-full ${
              isUploading || (!newMessage.trim() && !imageFile)
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
