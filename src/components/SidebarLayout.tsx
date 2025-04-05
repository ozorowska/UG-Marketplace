"use client";

import React, { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { FaHome, FaTimes, FaList, FaHeart, FaEnvelope, FaUserCircle, FaPlus } from "react-icons/fa";
import TopNavbar from "./TopNavbar";

type SidebarLayoutProps = {
  children: ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const navigateTo = (path: string) => {
    closeSidebar();
    router.push(path);
  };

  // Mobile sidebar – niezmieniona wersja
  const sidebarContent = (
    <div className="flex flex-col h-full py-6 px-4">
      <ul className="flex flex-col gap-4 flex-grow">
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/dashboard")}
        >
          <FaHome className="text-lg" /> Dashboard
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/offer/myoffers")}
        >
          <FaList className="text-lg" /> Moje Oferty
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/favorites")}
        >
          <FaHeart className="text-lg" /> Ulubione
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/messages")}
        >
          <FaEnvelope className="text-lg" /> Wiadomości
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/profile")}
        >
          <FaUserCircle className="text-lg" /> Profil
        </li>
        <li
          className="md:hidden flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/offer/new")}
        >
          <FaPlus className="text-lg" /> Dodaj ofertę
        </li>
      </ul>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
      >
        Wyloguj się
      </button>
    </div>
  );

  // Desktop sidebar – zawartość bez dodatkowego kontenera i mobilnego elementu "Dodaj ofertę"
  const desktopSidebarContent = (
    <>
      <ul className="flex flex-col gap-4 flex-grow">
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/dashboard")}
        >
          <FaHome className="text-lg" /> Dashboard
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/offer/myoffers")}
        >
          <FaList className="text-lg" /> Moje Oferty
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/favorites")}
        >
          <FaHeart className="text-lg" /> Ulubione
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/messages")}
        >
          <FaEnvelope className="text-lg" /> Wiadomości
        </li>
        <li
          className="flex items-center gap-4 py-2 px-4 text-gray-700 hover:bg-gray-100 hover:text-[#002d73] rounded cursor-pointer"
          onClick={() => navigateTo("/profile")}
        >
          <FaUserCircle className="text-lg" /> Profil
        </li>
      </ul>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
      >
        Wyloguj się
      </button>
    </>
  );

  return (
    <div className="flex h-screen">
      <TopNavbar onHamburgerClick={toggleSidebar} />

      {/* Mobile sidebar overlay */}
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

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-lg border-r flex flex-col py-6 px-4 fixed h-full">
        <h1
          className="text-2xl font-bold text-[#002d73] mb-8 cursor-pointer"
          onClick={() => navigateTo("/dashboard")}
        >
          UG Marketplace
        </h1>
        {desktopSidebarContent}
      </aside>

      {/* Główna zawartość */}
      <main className="flex-1 bg-gray-50 p-6 md:ml-64 mt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
