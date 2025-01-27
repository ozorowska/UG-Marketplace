"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function TopNavbar() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md border-b z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* logo */}
        <h1
          className="text-xl font-bold text-[#002d73] cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          UG Marketplace
        </h1>

        {/* pasek wyszukiwania */}
        <div className="flex items-center w-full max-w-md">
          <input
            type="text"
            placeholder="Szukaj ofert..."
            className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d73] border-gray-300"
          />
        </div>

        {/* przycisk dodawania oferty */}
        <button
          onClick={() => router.push("/offer/new")}
          className="bg-[#002d73] hover:bg-[#001a4f] text-white text-sm font-medium py-2 px-4 rounded transition-colors"
        >
          Dodaj ofertę
        </button>
      </div>
    </header>
  );
}
