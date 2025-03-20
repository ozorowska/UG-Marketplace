"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import TopNavbar from "../../components/TopNavbar";
import SidebarLayout from "../../components/SidebarLayout";

export default function ChatPage() {
  const { recipientId } = useParams(); // dynamiczny segment – identyfikator rozmówcy
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  // Pobieramy historię rozmowy
  useEffect(() => {
    async function fetchConversation() {
      try {
        const res = await fetch(
          `/api/messages/conversations?senderId=${session.user.id}&recipientId=${recipientId}`
        );
        if (!res.ok) throw new Error("Błąd pobierania rozmowy");
        const data = await res.json();
        setChat(data);
      } catch (error) {
        console.error(error);
      }
    }
    if (session) {
      fetchConversation();
    }
  }, [session, recipientId]);

  // Inicjalizacja Pushera
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("chat");

    channel.bind("new-message", function (data) {
      // Filtrujemy wiadomości – dodajemy tylko te dotyczące tej rozmowy
      if (
        (data.sender === session?.user.id && data.recipient === recipientId) ||
        (data.sender === recipientId && data.recipient === session?.user.id)
      ) {
        setChat((prevChat) => [...prevChat, data.message]);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [session, recipientId]);

  // Automatyczne przewijanie do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async () => {
    if (!session) {
      alert("Musisz być zalogowany, aby wysyłać wiadomości.");
      return;
    }
    if (message.trim()) {
      const payload = {
        text: message,
        sender: session.user.id,
        recipient: recipientId,
      };

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage("");
      } else {
        console.error("Błąd przy wysyłaniu wiadomości");
      }
    }
  };

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="flex flex-col h-screen bg-gray-100">
          {/* Header czatu */}
          <header className="bg-blue-600 text-white p-4 flex items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {recipientId.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold">Rozmówca</h2>
                <p className="text-sm">Online</p>
              </div>
            </div>
          </header>

          {/* Obszar wiadomości */}
          <main className="flex-1 p-4 overflow-y-auto">
            {chat.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Nie masz jeszcze żadnych wiadomości.
              </div>
            ) : (
              chat.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    msg.sender === session?.user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-xs break-words ${
                      msg.sender === session?.user.id
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
