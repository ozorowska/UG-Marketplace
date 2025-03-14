"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../components/SidebarLayout";
import TopNavbar from "../components/TopNavbar";
import FloatingButton from "../components/FloatingButton";
import { FaHeart } from "react-icons/fa";

// Komponenty modalowe
import NewOfferModal from "./NewOfferModal";
import OfferDetailModal from "./OfferDetailModal";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Wszystkie oferty
  const [offers, setOffers] = useState([]);
  // Lista ofert do wyświetlenia (po ewentualnym sortowaniu)
  const [filteredOffers, setFilteredOffers] = useState([]);
  // Opcja sortowania
  const [sortOption, setSortOption] = useState("Najnowsze");

  // Lista ofert-ulubionych (przechowujemy same ID)
  const [favoriteOffers, setFavoriteOffers] = useState([]);

  // Zarządzanie modalami
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  // Jeżeli user nie jest zalogowany, przerzuć na /login
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  // Pobranie ofert
  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch("/api/offers");
        if (!res.ok) {
          throw new Error("Nie udało się pobrać ofert");
        }
        const data = await res.json();
        setOffers(data);
        setFilteredOffers(data);
      } catch (error) {
        console.error("Błąd przy pobieraniu ofert:", error);
      }
    }
    fetchOffers();
  }, []);

  // Pobranie ulubionych (ofert w relacji favorites)
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          // data to tablica ofert, bierzemy same ID
          setFavoriteOffers(data.map((offer) => offer.id));
        } else {
          console.error("Nie udało się pobrać ulubionych (401/500?)");
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu ulubionych:", error);
      }
    }
    // Odczyt ulubionych tylko jeśli jest sesja
    if (session) {
      fetchFavorites();
    }
  }, [session]);

  // Funkcja sortowania
  function handleSortChange(e) {
    const option = e.target.value;
    setSortOption(option);

    let sorted = [...offers];
    if (option === "Ceny rosnąco") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (option === "Ceny malejąco") {
      sorted.sort((a, b) => b.price - a.price);
    }
    // "Najnowsze" -> brak zmian (lub posortować po dacie, zależnie od potrzeb)

    setFilteredOffers(sorted);
  }

  // Dodawanie/usuwanie z ulubionych
  async function toggleFavorite(offerId) {
    try {
      const isFavorite = favoriteOffers.includes(offerId);
      if (isFavorite) {
        // Usuń z ulubionych
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId }),
        });
        if (!res.ok) throw new Error("Nie udało się usunąć z ulubionych");

        setFavoriteOffers((prev) => prev.filter((id) => id !== offerId));
      } else {
        // Dodaj do ulubionych
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId }),
        });
        if (!res.ok) throw new Error("Nie udało się dodać do ulubionych");

        setFavoriteOffers((prev) => [...prev, offerId]);
      }
    } catch (err) {
      console.error("Błąd przy toggleFavorite:", err);
    }
  }

  if (!session) {
    // Jeszcze wczytuje lub brak zalogowania
    return null;
  }

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        {/* Filtry i sortowanie */}
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

        {/* Lista ofert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const isFavorite = favoriteOffers.includes(offer.id);

            return (
              <div
                key={offer.id}
                className="relative bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden 
                           hover:shadow-md transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedOfferId(offer.id)}
              >
                {/* Ikona serduszka (klik w nią nie otwiera modala) */}
                <button
                  className="absolute top-2 right-2 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(offer.id);
                  }}
                >
                  <FaHeart
                    className={
                      isFavorite
                        ? "text-red-500 hover:text-red-600"
                        : "text-gray-300 hover:text-red-500"
                    }
                    size={20}
                  />
                </button>

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
            );
          })}
        </div>

        {/* Przycisk do dodawania nowej oferty */}
        <FloatingButton onClick={() => setShowNewOfferModal(true)} />
      </SidebarLayout>

      {/* Modale */}
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
