// components/Chat.tsx
"use client";
import { useState, useEffect } from "react";
import { db, auth, serverTimestamp } from "../app/firebase/clientApp";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";

interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  userId: string;
  userPhoto: string | null;
  userName: string | null;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        messagesData.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt,
          userId: data.userId,
          userPhoto: data.userPhoto,
          userName: data.userName,
        });
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) return;

    const user = auth.currentUser as User;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      createdAt: serverTimestamp(),
      userId: user.uid,
      userPhoto: user.photoURL,
      userName: user.displayName,
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start mb-4">
            {msg.userPhoto && (
              <img
                src={msg.userPhoto}
                alt="Profil"
                className="w-8 h-8 rounded-full mr-3"
              />
            )}
            <div>
              <p className="font-semibold">{msg.userName || "Anonyme"}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 p-2 border rounded-l"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r">
          Envoyer
        </button>
      </form>
    </div>
  );
}
