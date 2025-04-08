"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars, FaSearch, FaTimes, FaPlus } from "react-icons/fa";
import NewOfferModal from "./NewOfferModal";

interface TopNavbarProps {
  onHamburgerClick?: () => void;
}

export default function TopNavbar({ onHamburgerClick }: TopNavbarProps) {
  const router = useRouter();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // stan dla zapytania
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);

  // Funkcja obsługująca wyszukiwanie – przekierowuje do dashboardu z parametrem q
  // Funkcja obsługująca wyszukiwanie – przekierowuje do dashboardu z parametrem q
const handleSearch = () => {
  if (searchQuery.trim()) {
    router.push(`/dashboard?q=${encodeURIComponent(searchQuery)}`);
  }
};


  return (
    <>
      {/* Mobile layout */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 z-50 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          {onHamburgerClick && (
            <button
              onClick={onHamburgerClick}
              className="text-gray-700 focus:outline-none"
              aria-label="Otwórz menu"
            >
              <FaBars size={20} />
            </button>
          )}

          <h1
            className="text-xl font-bold text-[#002d73] cursor-pointer mx-2"
            onClick={() => router.push("/dashboard")}
          >
            UG Marketplace
          </h1>

          <div className="flex items-center">
            {!searchExpanded ? (
              <button
                onClick={() => setSearchExpanded(true)}
                className="text-gray-700 focus:outline-none"
                aria-label="Wyszukaj"
              >
                <FaSearch size={20} />
              </button>
            ) : (
              <div className="flex items-center bg-white rounded-full border border-gray-300 px-2">
                <input
                  type="text"
                  placeholder="Czego szukasz?"
                  className="py-1 px-2 focus:outline-none text-sm w-32"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
                <button
                  onClick={() => setSearchExpanded(false)}
                  className="text-gray-500 ml-1"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 bg-white shadow-md border-b z-50">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          {/* Logo */}
          <h1
            className="text-xl font-bold text-[#002d73] cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            UG Marketplace
          </h1>

          {/* Pasek wyszukiwania */}
          <div className="flex items-center w-full max-w-md">
            <input
              type="text"
              placeholder="Czego szukasz?"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002d73] border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Przycisk dodawania oferty */}
          <button
            onClick={() => setShowNewOfferModal(true)}
            className="bg-[#002d73] hover:bg-[#001a4f] text-white text-sm font-medium py-2 px-4 rounded-full transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Dodaj ofertę
          </button>
        </div>
      </header>

      {showNewOfferModal && (
        <NewOfferModal onClose={() => setShowNewOfferModal(false)} onOfferAdded={function (): Promise<void> {
          throw new Error("Function not implemented.");
        } } />
      )}
    </>
  );
}
