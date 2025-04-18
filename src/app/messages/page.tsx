"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopNavbar from "../../components/TopNavbar";
import SidebarLayout from "../../components/SidebarLayout";
import { IoMdChatbubbles } from "react-icons/io";
import { BsCheckAll, BsCheck } from "react-icons/bs";

// Interfejsy dla typów danych
interface Message {
  id: string;
  text: string;
  senderId: string;
  read: boolean;
  createdAt: string;
}

interface Offer {
  id: string;
  title: string;
  imageUrl?: string;
}

interface User {
  id: string;
  name?: string;
  image?: string;
}

interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  offer: Offer;
  messages: Message[];
  participants: User[];
}

// Rozszerzenie interfejsu dla danych sesji
interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

export default function MessagesDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchConversations();
  }, [session, status, router]);

  // Pobieranie listy konwersacji
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) throw new Error("Błąd pobierania rozmów");
      const data = await res.json();
      
      // Sortowanie konwersacji od najnowszej
      const sortedConversations = data.sort(
        (a: Conversation, b: Conversation) => 
          new Date(b.updatedAt || b.createdAt).getTime() - 
          new Date(a.updatedAt || a.createdAt).getTime()
      );
      setConversations(sortedConversations);
    } catch (error) {
      console.error("Błąd przy pobieraniu rozmów:", error);
    } finally {
      setLoading(false);
    }
  };

  // Przejście do widoku czatu
  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Jeśli wiadomość jest z dzisiaj, pokaż tylko godzinę
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Jeśli z ostatnich 7 dni, pokaż dzień tygodnia
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // W przeciwnym razie pokaż datę
    return date.toLocaleDateString();
  };

  // Pobieranie drugiego uczestnika rozmowy (nie aktualnego użytkownika)
  const getOtherParticipant = (conversation: Conversation): User => {
    if (!session || !conversation.participants) return { id: "", name: "Użytkownik" };
    
    const sessionUser = session.user as SessionUser;
    
    const otherParticipant = conversation.participants.find(
      (user) => user.id !== sessionUser.id
    );
    
    return otherParticipant || { id: "", name: "Użytkownik" };
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Wiadomości</h1>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse flex space-x-4 w-full max-w-md">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="bg-blue-50 p-4 rounded-full mb-4">
                    <IoMdChatbubbles className="text-blue-500" size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Brak wiadomości
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Nie masz jeszcze żadnych rozmów. Przeglądaj oferty i skontaktuj się z innymi studentami.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((convo) => {
                    // Sprawdzanie czy ostatnia wiadomość była przeczytana
                    const lastMessage = convo.messages[0];
                    const isRead = lastMessage?.read || false;
                    const sessionUser = session.user as SessionUser;
                    const wasISender = lastMessage?.senderId === sessionUser.id;
                    const otherUser = getOtherParticipant(convo);
                    
                    return (
                      <div
                        key={convo.id}
                        onClick={() => handleConversationClick(convo.id)}
                        className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border border-gray-100"
                      >
                        {/* Awatar rozmówcy lub zdjęcie oferty */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 mr-4 overflow-hidden">
                          {otherUser?.image ? (
                            <img
                              src={otherUser.image}
                              alt={otherUser.name || "Użytkownik"}
                              className="w-full h-full object-cover"
                            />
                          ) : convo.offer.imageUrl ? (
                            <img
                              src={convo.offer.imageUrl}
                              alt={convo.offer.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-500 bg-blue-50">
                              {otherUser.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        
                        {/* Treść wiadomości */}
                        <div className="flex-grow overflow-hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium ${!isRead && !wasISender ? "text-blue-600" : "text-gray-800"}`}>
                              {otherUser.name || "Użytkownik"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {lastMessage ? formatDate(lastMessage.createdAt) : 
                                formatDate(convo.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <p className={`text-sm truncate mr-2 ${
                              !isRead && !wasISender ? "text-gray-800 font-medium" : "text-gray-500"
                            }`}>
                              {lastMessage?.text || "Rozpocznij rozmowę"} 
                            </p>
                            
                            {/* Wskaźnik statusu wiadomości */}
                            {lastMessage && wasISender && (
                              <span className="flex-shrink-0 text-gray-400">
                                {isRead ? <BsCheckAll size={16} className="text-blue-500" /> : <BsCheck size={16} />}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1">
                            <span className="text-xs text-gray-400">
                              {convo.offer.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}