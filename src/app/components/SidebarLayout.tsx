"use client";

import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { FaHome, FaList, FaHeart, FaEnvelope, FaUserCircle } from "react-icons/fa";

type SidebarLayoutProps = {
  children: ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex">
      {/* Menu boczne */}
      <aside className="w-64 bg-[#002d73] text-white flex flex-col py-6 px-4 fixed h-full">
        <h1
          className="text-2xl font-bold mb-8 cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          UG Marketplace
        </h1>
        <ul className="flex flex-col gap-4 flex-grow">
          <li
            className="flex items-center gap-4 py-2 px-4 hover:bg-[#001a4f] rounded cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <FaHome /> Dashboard
          </li>
          <li
            className="flex items-center gap-4 py-2 px-4 hover:bg-[#001a4f] rounded cursor-pointer"
            onClick={() => router.push("/offers")}
          >
            <FaList /> Moje Oferty
          </li>
          <li
            className="flex items-center gap-4 py-2 px-4 hover:bg-[#001a4f] rounded cursor-pointer"
            onClick={() => router.push("/favorites")}
          >
            <FaHeart /> Ulubione
          </li>
          <li
            className="flex items-center gap-4 py-2 px-4 hover:bg-[#001a4f] rounded cursor-pointer"
            onClick={() => router.push("/messages")}
          >
            <FaEnvelope /> Wiadomości
          </li>
          <li
            className="flex items-center gap-4 py-2 px-4 hover:bg-[#001a4f] rounded cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <FaUserCircle /> Profil
          </li>
        </ul>
        {/* Wyloguj się */}
        <button
          onClick={() => signOut()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow mt-4"
        >
          Wyloguj się
        </button>
      </aside>

      {/* Główna zawartość */}
      <main className="flex-1 bg-gray-100 p-6 ml-64 mt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
