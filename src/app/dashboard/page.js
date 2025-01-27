"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../components/SidebarLayout";
import TopNavbar from "../components/TopNavbar";
import FloatingButton from "../components/FloatingButton";
import { FaEye } from "react-icons/fa";

// Komponenty modalowe
import NewOfferModal from "./NewOfferModal";
import OfferDetailModal from "./OfferDetailModal";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]); // stan dla przefiltrowanych ofert
  const [sortOption, setSortOption] = useState("Najnowsze"); // domyślnie najnowsze

  // Stany do sterowania modalami:
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch("/api/offers");
        if (!res.ok) {
          throw new Error("Nie udało się pobrać ofert");
        }
        const data = await res.json();
        setOffers(data);
        setFilteredOffers(data); // ustawienie początkowej listy
      } catch (error) {
        console.error("Błąd przy pobieraniu ofert:", error);
      }
    }

    fetchOffers();
  }, []);

  // funkcja do obsługi sortowania
  function handleSortChange(e) {
    const option = e.target.value;
    setSortOption(option);

    let sortedOffers = [...offers];
    if (option === "Ceny rosnąco") {
      sortedOffers.sort((a, b) => a.price - b.price);
    } else if (option === "Ceny malejąco") {
      sortedOffers.sort((a, b) => b.price - a.price);
    }

    setFilteredOffers(sortedOffers);
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        {/* filtry */}
        <div className="bg-white shadow-sm py-4 px-6 mb-8 flex justify-between items-center">
          <div className="flex gap-4">
            <button className="bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200">
              Tagi
            </button>
            <button className="bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200">
              Cena
            </button>
          </div>
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="bg-gray-100 px-4 py-2 rounded-full text-sm border border-gray-300"
          >
            <option>Najnowsze</option>
            <option>Ceny rosnąco</option>
            <option>Ceny malejąco</option>
          </select>
        </div>

        {/* oferty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="relative bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden 
                         hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => setSelectedOfferId(offer.id)} // zamiast router.push...
            >
              <div className="bg-gray-50 flex items-center justify-center h-60">
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="h-full max-h-full w-auto object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-medium text-gray-800 truncate">
                  {offer.title}
                </h3>
                <p className="mt-3 text-lg font-semibold text-blue-600">
                  {offer.price} zł
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {offer.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* przycisk dodawania nowej oferty */}
        <FloatingButton onClick={() => setShowNewOfferModal(true)} />
      </SidebarLayout>

      {/* modale (warunkowe renderowanie) */}
      {showNewOfferModal && (
        <NewOfferModal onClose={() => setShowNewOfferModal(false)} />
      )}
      {selectedOfferId && (
        <OfferDetailModal
          offerId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      )}
    </>
  );
}
