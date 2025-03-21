"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import TopNavbar from "../../components/TopNavbar";
import SidebarLayout from "../../components/SidebarLayout";

export default function ChatPage() {
  const { conversationId } = useParams(); // id konwersacji
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  // Pobieramy historię wiadomości z rozmowy
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error("Błąd pobierania wiadomości");
        const data = await res.json();
        setChat(data);
      } catch (error) {
        console.error(error);
      }
    }
    if (session) fetchMessages();
  }, [session, conversationId]);

  // Subskrypcja Pushera dla rozmowy
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", function (data) {
      setChat((prev) => [...prev, data.message]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [conversationId]);

  // Automatyczne przewijanie do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async () => {
    if (!session) return alert("Musisz być zalogowany.");
    if (!message.trim()) return;

    const payload = { text: message, senderId: session.user.id };

    const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("");
    } else {
      console.error("Błąd wysyłania wiadomości");
    }
  };

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="flex flex-col h-screen bg-gray-100">
          {/* Nagłówek czatu z linkiem powrotnym */}
          <header className="bg-blue-600 text-white p-4 flex items-center">
            <button onClick={() => router.push("/messages")} className="mr-4">
              ←
            </button>
            <div>
              <h2 className="font-semibold">Czat: {conversationId}</h2>
              {/* Możesz dodać tutaj nazwę oferty lub rozmówcy */}
            </div>
          </header>

          {/* Obszar wiadomości */}
          <main className="flex-1 p-4 overflow-y-auto">
            {chat.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Nie ma jeszcze wiadomości.
              </div>
            ) : (
              chat.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    msg.senderId === session.user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-xs break-words ${
                      msg.senderId === session.user.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-800 shadow"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </main>

          {/* Pasek wysyłania wiadomości */}
          <footer className="p-4 bg-white border-t border-gray-300">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Wpisz wiadomość..."
                className="flex-1 border border-gray-300 rounded-l-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-full hover:bg-blue-700 transition"
              >
                Wyślij
              </button>
            </div>
          </footer>
        </div>
      </SidebarLayout>
    </>
  );
}
