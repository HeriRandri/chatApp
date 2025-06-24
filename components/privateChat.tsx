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
  getDocs,
  where,
} from "firebase/firestore";
import { db, auth } from "@/app/firebase/clientApp";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  FiSend,
  FiImage,
  FiSmile,
  FiTrash,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

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
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion des notifications
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sms.mp3");
      requestNotificationPermission();
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn("Erreur lecture audio :", err);
      });
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showChatNotification = useCallback((title: string, body: string) => {
    if (document.hidden && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/notification-icon.png",
        silent: true,
      });
    }
  }, []);

  // Gestion de la conversation
  const getChatId = useCallback(() => {
    const currentUserId = auth.currentUser?.uid;
    return [currentUserId, recipientId].sort().join("_");
  }, [recipientId]);

  // Scroll automatique
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    const chatId = getChatId();
    const unreadQuery = query(
      collection(db, `chats/${chatId}/messages`),
      where("senderId", "==", recipientId),
      where("readAt", "==", null)
    );

    const snapshot = await getDocs(unreadQuery);
    const updates = snapshot.docs.map((docSnap) =>
      setDoc(
        doc(db, `chats/${chatId}/messages/${docSnap.id}`),
        { readAt: serverTimestamp() },
        { merge: true }
      )
    );
    await Promise.all(updates);
  }, [getChatId, recipientId]);

  // Écoute des messages
  useEffect(() => {
    let unsubscribe: () => void;
    let isActive = true;

    const initializeChat = async () => {
      try {
        if (!recipientId || !auth.currentUser?.uid) return;

        setIsLoading(true);
        const chatId = getChatId();
        const messagesQuery = query(
          collection(db, `chats/${chatId}/messages`),
          orderBy("createdAt")
        );

        unsubscribe = onSnapshot(
          messagesQuery,
          async (snapshot) => {
            if (!isActive) return;

            const newMessages = snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Message)
            );

            if (!isActive) return;

            setMessages(newMessages);
            scrollToBottom();

            // Marquer les messages comme lus
            const unreadMessages = snapshot.docs.filter((doc) => {
              const data = doc.data();
              return (
                data.senderId === recipientId &&
                !data.readAt &&
                auth.currentUser?.uid
              );
            });

            if (unreadMessages.length > 0) {
              await markMessagesAsRead();
            }

            // Notification pour nouveau message
            const latest = newMessages[newMessages.length - 1];
            const previousLatest = messages[messages.length - 1];

            if (
              latest &&
              latest.id !== previousLatest?.id &&
              latest.senderId !== auth.currentUser?.uid &&
              Notification.permission === "granted"
            ) {
              showChatNotification(
                "Nouveau message",
                latest.text || "📷 Image envoyée"
              );
              playNotificationSound();
            }
          },
          (error) => {
            console.error("Firestore snapshot error:", error);
            if (isActive) {
              toast.error("Erreur de chargement des messages");
            }
          }
        );
      } catch (error) {
        console.error("Chat initialization error:", error);
        if (isActive) {
          toast.error("Échec de l'initialisation du chat");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isActive = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    };
  }, [
    recipientId,
    getChatId,
    markMessagesAsRead,
    playNotificationSound,
    showChatNotification,
    messages,

    scrollToBottom,
  ]);

  // Envoi de message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || isUploading) return;

    setIsUploading(true);
    const chatId = getChatId();

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const messageData = {
        text: newMessage.trim(),
        imageUrl,
        senderId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        readAt: null,
      };

      const batch = [
        setDoc(doc(db, `chats/${chatId}/messages/${Date.now()}`), messageData),
        setDoc(
          doc(db, `chats/${chatId}`),
          {
            lastUpdated: serverTimestamp(),
            lastMessage: newMessage.trim() || (imageFile ? "📷 Image" : ""),
          },
          { merge: true }
        ),
      ];

      await Promise.all(batch);

      setNewMessage("");
      resetImageInput();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Échec de l'envoi du message");
    } finally {
      setIsUploading(false);
    }
  };

  const resetImageInput = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload d'image
  const uploadImage = async (file: File): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(
      storage,
      `chat-images/${auth.currentUser?.uid}/${Date.now()}_${file.name}`
    );
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Gestion des images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors de la lecture de l'image");
    }
  };

  // Suppression de message
  const handleDelete = async (messageId: string) => {
    const confirm = window.confirm("Supprimer ce message ?");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, `chats/${getChatId()}/messages/${messageId}`));
      toast.success("Message supprimé");
    } catch (error) {
      console.error("Erreur suppression :", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Détection de saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    } else {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Chargement des messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Envoyez votre premier message !</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === auth.currentUser?.uid
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                  msg.senderId === auth.currentUser?.uid
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                {msg.imageUrl && (
                  <div className="mb-2">
                    <Image
                      src={msg.imageUrl}
                      alt="Image envoyée"
                      width={300}
                      height={300}
                      className="rounded-lg w-full h-auto max-h-64 object-cover"
                      priority={false}
                    />
                  </div>
                )}
                {msg.text && <p className="break-words">{msg.text}</p>}
                <div className="flex justify-between items-center mt-1 text-xs opacity-80">
                  <span>
                    {msg.createdAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.senderId === auth.currentUser?.uid && (
                    <span
                      className={msg.readAt ? "text-blue-300" : "text-gray-400"}
                    >
                      {msg.readAt ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
                {msg.senderId === auth.currentUser?.uid && (
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      onClick={() => alert("Édition à venir")}
                      className="text-gray-200 hover:text-white p-1"
                      title="Modifier"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-gray-200 hover:text-red-400 p-1"
                      title="Supprimer"
                    >
                      <FiTrash size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview d'image */}
      {imagePreview && (
        <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={imagePreview}
              alt="Preview"
              width={60}
              height={60}
              className="rounded-md"
            />
            <span className="text-sm text-gray-300">Image à envoyer</span>
          </div>
          <button
            onClick={resetImageInput}
            className="text-gray-400 hover:text-white p-1"
          >
            <FiX size={20} />
          </button>
        </div>
      )}

      {/* Indicateur de saisie */}
      {isTyping && (
        <div className="px-4 py-1 bg-gray-800 text-sm text-gray-400">
          {recipientId} est en train d écrire...
        </div>
      )}

      {/* Barre d'envoi */}
      <form
        onSubmit={sendMessage}
        className="bg-gray-800 border-t border-gray-700 p-3"
      >
        <div className="flex items-center gap-2">
          {/* Bouton emoji */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-blue-400 p-2"
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
                  previewPosition="none"
                />
              </div>
            )}
          </div>

          {/* Upload d'image */}
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
            className="text-gray-400 hover:text-blue-400 p-2 cursor-pointer"
          >
            <FiImage size={22} />
          </label>

          {/* Champ de saisie */}
          <input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={isUploading || (!newMessage.trim() && !imageFile)}
            className={`p-2 rounded-full ${
              isUploading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition-colors`}
          >
            {isUploading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <FiSend size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
