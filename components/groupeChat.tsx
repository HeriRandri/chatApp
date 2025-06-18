"use client";
import { useEffect, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../app/firebase/clientApp";

type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp | null;
};

export default function GroupChat({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const q = query(
      collection(db, `groupMessages/${groupId}/messages`),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Message)
        )
      );
    });

    return () => unsubscribe();
  }, [groupId]);

  const sendMessage = async () => {
    if (!auth.currentUser || !message.trim()) return;

    await setDoc(doc(db, `groupMessages/${groupId}/messages/${Date.now()}`), {
      text: message,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName,
      createdAt: serverTimestamp(),
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-[100vh] bg-gray-200">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === auth.currentUser?.uid;
          return (
            <div
              key={msg.id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow ${
                  isOwnMessage
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {msg.senderName}
                </div>
                <div className="text-sm break-words">{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-14 left-0 z-10">
          <Picker
            data={data}
            onEmojiSelect={(emoji: { native: string }) => {
              setMessage((prev) => prev + emoji.native);
              setShowEmojiPicker(false);
            }}
            onClickOutside={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center gap-2 relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-xl"
        >
          😊
        </button>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 p-2 border rounded-full outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
