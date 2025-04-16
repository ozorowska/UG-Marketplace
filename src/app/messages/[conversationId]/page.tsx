"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import TopNavbar from "../../../components/TopNavbar";
import SidebarLayout from "../../../components/SidebarLayout";
import { IoArrowBack, IoSend, IoImage } from "react-icons/io5";
import { BsCheck, BsCheckAll, BsEmojiSmile } from "react-icons/bs";

// Interfejsy dla typów danych
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
  participants: User[];
}

// Rozszerzenie interfejsu dla danych sesji
interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

export default function ChatPage() {
  const { conversationId } = useParams() as { conversationId: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Pobieranie danych konwersacji
  useEffect(() => {
    async function fetchConversationDetails() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}`);
        if (!res.ok) throw new Error("Błąd pobierania szczegółów konwersacji");
        const data = await res.json();
        setConversation(data);
        
        // Znajdź drugiego uczestnika czatu (nie aktualnego użytkownika)
        if (data.participants && session) {
          const sessionUser = session.user as SessionUser;
          const other = data.participants.find(
            (user: User) => user.id !== sessionUser.id
          );
          setOtherUser(other || null);
        }
      } catch (error) {
        console.error("Błąd:", error);
      }
    }
    
    if (session) fetchConversationDetails();
  }, [session, conversationId]);

  // Pobieranie historii wiadomości
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error("Błąd pobierania wiadomości");
        const data = await res.json();
        setChat(data);
        
        // Oznaczenie wiadomości jako przeczytane
        markMessagesAsRead(data);
      } catch (error) {
        console.error("Błąd:", error);
      }
    }
    
    if (session) fetchMessages();
  }, [session, conversationId]);

  // Oznaczanie wiadomości jako przeczytane
  const markMessagesAsRead = async (messages: Message[]) => {
    if (!session) return;
    
    const sessionUser = session.user as SessionUser;
    
    // Znajdź wiadomości od innych użytkowników, które nie zostały jeszcze przeczytane
    const unreadMessages = messages.filter(
      msg => msg.senderId !== sessionUser.id && !msg.read
    );
    
    if (unreadMessages.length === 0) return;
    
    try {
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Błąd oznaczania wiadomości jako przeczytane:", error);
    }
  };

  // Subskrypcja Pushera dla rozmowy
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
    });
    
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    
    channel.bind("new-message", function (data: { message: Message }) {
      setChat((prev) => [...prev, data.message]);
      
      // Jeśli wiadomość nie jest od aktualnego użytkownika, oznacz jako przeczytaną
      if (session) {
        const sessionUser = session.user as SessionUser;
        if (data.message.senderId !== sessionUser.id) {
          markMessagesAsRead([data.message]);
        }
      }
    });
    
    channel.bind("message-read", function (data: { messageIds: string[] }) {
      setChat((prev) => 
        prev.map(msg => 
          data.messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [conversationId, session]);

  // Automatyczne przewijanie do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Wysyłanie wiadomości
  const sendMessage = async () => {
    if (!session) return alert("Musisz być zalogowany.");
    if (!message.trim()) return;
    
    setIsSending(true);
    const sessionUser = session.user as SessionUser;
    const payload = { text: message.trim(), senderId: sessionUser.id };

    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setMessage("");
        // Fokus z powrotem na polu wiadomości
        messageInputRef.current?.focus();
      } else {
        console.error("Błąd wysyłania wiadomości");
      }
    } catch (error) {
      console.error("Błąd:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Obsługa wysyłania wiadomości przez Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Grupowanie wiadomości po datach
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  // Formatowanie daty dla nagłówków grup
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return "Dzisiaj";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Wczoraj";
    } else {
      return date.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  // Formatowanie czasu wiadomości
  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!session) {
    return null;
  }

  const messageGroups = groupMessagesByDate(chat);
  const sortedDates = Object.keys(messageGroups).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-50">
          {/* Nagłówek czatu */}
          <header className="bg-white shadow-sm z-10 py-3 px-4 flex items-center sticky top-0">
            <button 
              onClick={() => router.push("/messages")} 
              className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Powrót"
            >
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
                <h2 className="font-medium text-gray-800">
                  {otherUser?.name || "Użytkownik"}
                </h2>
                <div className="text-xs text-gray-500">
                  {conversation?.offer.title || ""}
                </div>
              </div>
            </div>
          </header>

          {/* Obszar wiadomości */}
          <main className="flex-1 p-4 overflow-y-auto">
            {chat.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <IoSend className="text-blue-500" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Rozpocznij rozmowę
                </h3>
                <p className="text-gray-500 max-w-xs">
                  Napisz wiadomość, aby nawiązać kontakt.
                </p>
              </div>
            ) : (
              <>
                {sortedDates.map(date => (
                  <div key={date}>
                    {/* Nagłówek daty */}
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDateHeader(date)}
                      </div>
                    </div>
                    
                    {/* Wiadomości z danego dnia */}
                    {messageGroups[date].map((msg, index) => {
                      const sessionUser = session.user as SessionUser;
                      const isFromMe = msg.senderId === sessionUser.id;
                      const showSenderInfo = index === 0 || 
                        messageGroups[date][index - 1]?.senderId !== msg.senderId;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`mb-2 flex ${
                            isFromMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="max-w-[80%] md:max-w-[70%]">
                            <div
                              className={`rounded-2xl py-2 px-4 break-words ${
                                isFromMe
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                              }`}
                            >
                              {msg.text}
                            </div>
                            
                            {/* Czas i status wiadomości */}
                            <div 
                              className={`flex items-center mt-1 text-xs text-gray-500 ${
                                isFromMe ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              
                              {isFromMe && (
                                <span className="ml-1">
                                  {msg.read ? 
                                    <BsCheckAll size={14} className="text-blue-500" /> : 
                                    <BsCheck size={14} />
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </main>

          {/* Pasek wysyłania wiadomości */}
          <footer className="p-3 bg-white border-t border-gray-200 sticky bottom-0">
            <div className="flex items-center">
              <button 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Dodaj załącznik"
              >
                <IoImage size={20} />
              </button>
              
              <div className="flex-1 mx-2 relative">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Wpisz wiadomość..."
                  className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Emoji"
                >
                  <BsEmojiSmile size={18} />
                </button>
              </div>
              
              <button
                onClick={sendMessage}
                disabled={isSending || !message.trim()}
                className={`p-2.5 rounded-full ${
                  message.trim() && !isSending 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "bg-gray-200 text-gray-400"
                } transition-colors`}
                aria-label="Wyślij"
              >
                <IoSend size={20} />
              </button>
            </div>
          </footer>
        </div>
      </SidebarLayout>
    </>
  );
}