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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getChatId = useCallback(() => {
    const currentUserId = auth.currentUser?.uid;
    return [currentUserId, recipientId].sort().join("_");
  }, [recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `chat-images/${auth.currentUser?.uid}/${Date.now()}_${file.name}`
      );

      const metadata = { contentType: file.type };
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Erreur d'upload:", error);
      throw error;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    if (!file.type.match("image.*")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const chatId = getChatId();
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      );
    });
    return () => unsubscribe();
  }, [recipientId, getChatId]);

  const handleDelete = async (messageId: string) => {
    const chatId = getChatId();
    const confirm = window.confirm("Supprimer ce message ?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, `chats/${chatId}/messages/${messageId}`));
      console.log("Message supprimé !");
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  return (
    <div className="flex flex-col h-full  rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-200">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${
              msg.senderId === auth.currentUser?.uid
                ? "justify-end"
                : "justify-start"
            } group`}
          >
            <div
              className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === auth.currentUser?.uid
                  ? "bg-gray-600 text-white rounded-br-none"
                  : "bg-green-300 text-black rounded-bl-none"
              }`}
            >
              {msg.text && <p className="break-words pr-8">{msg.text}</p>}
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
                      maxHeight: "300px",
                      objectFit: "cover",
                    }}
                    className="rounded-lg"
                  />
                </div>
              )}
              <div className="text-xs opacity-70 mt-1">
                {msg.createdAt?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {msg.senderId === auth.currentUser?.uid && (
                <div className="absolute top-1 right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => alert("Fonction modification à venir")}
                    className="text-white/80 hover:text-white"
                    title="Modifier"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="text-white/80 hover:text-red-400"
                    title="Supprimer"
                  >
                    <FiTrash size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
        <div ref={messagesEndRef} />
      </div>

      {imagePreview && (
        <div className="px-4 py-2 bg-gray-50 border-t relative">
          <div className="relative inline-block">
            <Image
              src={imagePreview}
              alt="Preview"
              width={120}
              height={120}
              className="rounded-lg"
            />
            <button
              onClick={() => {
                setImagePreview(null);
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="p-4 bg-gray-50 border-t">
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <FiSmile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-10">
              <Picker
                data={data}
                onEmojiSelect={(emoji: { native: string }) => {
                  setNewMessage((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
                onClickOutside={() => setShowEmojiPicker(false)}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={fileInputRef}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <FiImage size={20} />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Écrivez un message..."
          />

          <button
            type="submit"
            disabled={isUploading || (!newMessage.trim() && !imageFile)}
            className={`p-3 rounded-full ${
              isUploading || (!newMessage.trim() && !imageFile)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
