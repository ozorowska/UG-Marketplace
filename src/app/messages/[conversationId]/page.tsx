"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import TopNavbar from "../../../components/TopNavbar";
import SidebarLayout from "../../../components/SidebarLayout";
import { IoArrowBack, IoSend } from "react-icons/io5";
import { BsCheck, BsCheckAll, BsEmojiSmile } from "react-icons/bs";

// typy danych
interface Message {
  id: string;
  text: string;
  senderId: string;
  read: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name?: string;
  image?: string;
}

interface Offer {
  id: string;
  title: string;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  offer: Offer;
  buyer: User;
  seller: User;
  buyerId: string;
  sellerId: string;
}

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

export default function ChatPage() {
  const { conversationId } = useParams() as { conversationId: string };
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // przekierowanie do logowania jeśli brak sesji
  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/login");
    }
  }, [session, status, router]);

  // pobierz szczegóły konwersacji i drugiego użytkownika
  useEffect(() => {
    async function fetchConversationDetails() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}`);
        const data = await res.json();
        setConversation(data);
        if (data && session) {
          const sessionUser = session.user as SessionUser;
          const other = sessionUser.id === data.buyerId ? data.seller : data.buyer;
          setOtherUser(other || null);
        }
      } catch (error) {
        console.error("Błąd:", error);
      }
    }
    if (session) fetchConversationDetails();
  }, [session, conversationId]);

  // pobierz wiadomości i oznacz jako przeczytane
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        const data = await res.json();
        setChat(data);
        markMessagesAsRead(data);
      } catch (error) {
        console.error("Błąd:", error);
      }
    }
    if (session) fetchMessages();
  }, [session, conversationId]);

  // oznacz wiadomości jako przeczytane
  const markMessagesAsRead = async (messages: Message[]) => {
    if (!session) return;
    const sessionUser = session.user as SessionUser;
    const unread = messages.filter(msg => msg.senderId !== sessionUser.id && !msg.read);
    if (unread.length === 0) return;
    await fetch(`/api/messages/conversations/${conversationId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  };

  // nasłuch na nowe wiadomości i zmiany stanu "przeczytane"
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
    });
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", (data: { message: Message }) => {
      setChat(prev => [...prev, data.message]);
      if (session) {
        const sessionUser = session.user as SessionUser;
        if (data.message.senderId !== sessionUser.id) {
          markMessagesAsRead([data.message]);
        }
      }
    });
    channel.bind("message-read", (data: { messageIds: string[] }) => {
      setChat(prev => prev.map(msg => data.messageIds.includes(msg.id) ? { ...msg, read: true } : msg));
    });
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [conversationId, session]);

  // przewiń na dół po załadowaniu wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // wyślij wiadomość
  const sendMessage = async () => {
    if (!session || !message.trim()) return;
    const sessionUser = session.user as SessionUser;
    const payload = { text: message.trim(), senderId: sessionUser.id };
    const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setMessage("");
    messageInputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col">
      <TopNavbar />
      <SidebarLayout>
        <div className="flex flex-col h-full max-h-screen overflow-hidden bg-gray-50">
          <header className="bg-white shadow-sm z-10 py-3 px-4 flex items-center sticky top-0 w-full">
            <button onClick={() => router.push("/messages")} className="mr-3 p-2 rounded-full hover:bg-gray-100">
              <IoArrowBack size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 overflow-hidden mr-3">
                {otherUser?.image ? (
                  <img src={otherUser.image} alt={otherUser.name || "Użytkownik"} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-blue-500">
                    {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-medium text-gray-800">{otherUser?.name || "Użytkownik"}</h2>
                <div className="text-xs text-gray-500">{conversation?.offer?.title || ""}</div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 overflow-y-auto">
            {chat.map((msg) => {
              const sessionUser = session.user as SessionUser;
              const isFromMe = msg.senderId === sessionUser.id;
              return (
                <div key={msg.id} className={`mb-2 flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] md:max-w-[70%]">
                    <div className={`rounded-2xl py-2 px-4 break-words ${
                      isFromMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center mt-1 text-xs text-gray-500 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isFromMe && (
                        <span className="ml-1">
                          {msg.read ? (
                            <BsCheckAll size={14} className="text-blue-500" />
                          ) : (
                            <BsCheck size={14} className="text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </main>

          <footer className="p-3 bg-white border-t border-gray-200 sticky bottom-0">
            <div className="flex items-center">
              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Emoji"
                >
                  <BsEmojiSmile size={20} />
                </button>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Wpisz wiadomość..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className={`p-2.5 rounded-full ${message.trim() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400"}`}
                  aria-label="Wyślij"
                >
                  <IoSend size={20} />
                </button>
              </div>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-md text-xl">
                {["😀", "😂", "😍", "👍", "🙏", "🎓", "😎"].map((emoji) => (
                  <button
                    key={emoji}
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </footer>
        </div>
      </SidebarLayout>
    </div>
  );
}
