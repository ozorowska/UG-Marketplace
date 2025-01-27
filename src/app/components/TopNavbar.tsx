"use client";

import React from "react";

export default function TopNavbar() {
  return (
    <nav className="bg-white shadow-md fixed w-full h-16 flex items-center px-6 z-50">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <h1 className="text-xl font-bold text-[#002d73] cursor-pointer">
          UG Marketplace
        </h1>
        {/* Pasek wyszukiwania */}
        <input
          type="text"
          placeholder="Wyszukaj książki lub notatki..."
          className="flex-grow bg-gray-100 rounded-full px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002d73]"
        />
      </div>
      {/* Ikony */}
      <div className="flex items-center gap-6 ml-auto">
        <button className="text-gray-500 hover:text-gray-700">
          <i className="fas fa-bell"></i>
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <i className="fas fa-user-circle"></i>
        </button>
      </div>
    </nav>
  );
}
