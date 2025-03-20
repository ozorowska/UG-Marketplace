"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopNavbar from "../components/TopNavbar";
import SidebarLayout from "../components/SidebarLayout";

export default function MessagesDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sprawdzamy, czy użytkownik jest zalogowany
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    } else {
      fetchConversations();
    }
  }, [session, status, router]);

  // Funkcja pobierająca konwersacje
  const fetchConversations = async () => {
    try {
      // Przykładowe API – w realnej implementacji endpoint powinien zwracać listę konwersacji
      const res = await fetch(
        `/api/messages/conversations?senderId=${session.user.id}&recipientId=all`
      );
      if (!res.ok) throw new Error("Błąd pobierania rozmów");
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Błąd przy pobieraniu rozmów:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja przekierowująca do widoku konkretnej rozmowy
  const handleConversationClick = (conversationId) => {
    router.push(`/messages/${conversationId}`);
  };

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Wiadomości</h1>
          {loading ? (
            <div className="text-center text-gray-500">Ładowanie rozmów...</div>
          ) : (
            <>
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Nie masz jeszcze żadnych wiadomości.
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => handleConversationClick(convo.id)}
                      className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Awatar */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 mr-4">
                        {convo.avatar ? (
                          <img
                            src={convo.avatar}
                            alt={convo.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-500">
                            {convo.name ? convo.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      {/* Dane konwersacji */}
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-800">
                            {convo.name || "Brak nazwy"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {convo.lastMessageTime || ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {convo.lastMessage || ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}
