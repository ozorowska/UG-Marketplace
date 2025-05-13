"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FaHome,
  FaTimes,
  FaList,
  FaHeart,
  FaEnvelope,
  FaUserCircle,
  FaPlus,
} from "react-icons/fa";
import TopNavbar from "./TopNavbar";
import Pusher from "pusher-js";

type SidebarLayoutProps = {
  children: ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const navigateTo = (path: string) => {
    closeSidebar();
    router.push(path);
  };

  // Pobieranie liczby nieprzeczytanych wiadomości
  const fetchUnreadMessages = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();
      let count = 0;

      data.forEach((conv: any) => {
        conv.messages.forEach((msg: any) => {
          if (!msg.read) count++;
        });
      });

      setUnreadCount(count);
    } catch (error) {
      console.error("Błąd pobierania wiadomości:", error);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();

    // 🔁 Pusher: nasłuchiwanie nowej wiadomości
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Nasłuchujemy na wszystkich konwersacjach (można zmienić)
    const channel = pusher.subscribe("global-messages");
    channel.bind("new-message", () => {
      fetchUnreadMessages(); // po nowej wiadomości aktualizujemy licznik
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const MessageButton = () => (
    <div className="flex items-center justify-between w-full pr-2">
      <div className="flex items-center gap-2">
        <FaEnvelope className="text-lg" />
        <span>Wiadomości</span>
      </div>
      {unreadCount > 0 && (
        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );

  const sidebarItem = (label: ReactNode, path: string) => (
    <li
      className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
      onClick={() => navigateTo(path)}
    >
      {label}
    </li>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full py-6 px-4">
      <ul className="flex flex-col gap-4 flex-grow">
        {sidebarItem(
          <>
            <FaHome className="text-lg" /> Dashboard
          </>,
          "/dashboard"
        )}
        {sidebarItem(
          <>
            <FaList className="text-lg" /> Moje Oferty
          </>,
          "/offer/myoffers"
        )}
        {sidebarItem(
          <>
            <FaHeart className="text-lg" /> Ulubione
          </>,
          "/favorites"
        )}
        {sidebarItem(<MessageButton />, "/messages")}
        {sidebarItem(
          <>
            <FaUserCircle className="text-lg" /> Profil
          </>,
          "/profile"
        )}
        {sidebarItem(
          <>
            <FaPlus className="text-lg" /> Dodaj ofertę
          </>,
          "/offer/new"
        )}
      </ul>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
      >
        Wyloguj się
      </button>
    </div>
  );

  return (
    <div className="flex h-screen">
      <TopNavbar onHamburgerClick={toggleSidebar} />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden">
          <div className="absolute left-0 top-0 h-full w-full max-w-xs bg-white shadow-xl">
            <div className="flex flex-col h-full p-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={closeSidebar}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-white shadow-lg border-r flex flex-col py-6 px-4 fixed h-full">
        <h1
          className="text-2xl font-bold text-[#002d73] mb-8 cursor-pointer"
          onClick={() => navigateTo("/dashboard")}
        >
          UG Marketplace
        </h1>
        {sidebarContent}
      </aside>

      <main className="flex-1 bg-gray-50 p-6 md:ml-64 mt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
