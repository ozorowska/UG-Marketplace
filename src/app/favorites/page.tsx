"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";
import OfferDetailModal from "../../components/OfferDetailModal";
import { FaHeart, FaRegCalendarAlt } from "react-icons/fa";
import { IoOptions } from "react-icons/io5";
import { GiTeacher } from "react-icons/gi";
import { BsJournalBookmark } from "react-icons/bs";

// typ interfejsu oferty
interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  tags: { id: string; name: string }[];
  category: string;
  createdAt: string;
  department: string;
  major: string;
  location: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession(); // pobieranie sesji użytkownika
  const router = useRouter(); // inicjalizacja routera
  const [favoriteOffers, setFavoriteOffers] = useState<Offer[]>([]); // stan na ulubione oferty
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null); // stan na ID wybranej oferty

  // przekierowanie na /login jeśli nie ma sesji
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  // pobieranie ulubionych ofert po załadowaniu komponentu
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites"); // żądanie GET do API
        if (!res.ok) throw new Error("Nie udało się pobrać ulubionych ofert");
        const data = await res.json(); // parsowanie odpowiedzi
        setFavoriteOffers(data); // ustawienie stanu
      } catch (error) {
        console.error("Błąd pobierania ulubionych:", error);
      }
    }
    fetchFavorites();
  }, []);

  // jeśli użytkownik nie jest zalogowany, nie renderuj nic
  if (!session) return null;

  // usuwanie oferty z ulubionych (API DELETE)
  const toggleFavorite = async (offerId: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!res.ok) throw new Error("Nie udało się usunąć z ulubionych");

      // usuwanie oferty z widoku po stronie klienta
      setFavoriteOffers((prev) => prev.filter((offer) => offer.id !== offerId));
    } catch (error) {
      console.error("Błąd podczas usuwania z ulubionych:", error);
    }
  };

  // lista kategorii i odpowiadających im ikon
  const categories = [
    { value: "KSIAZKI", label: "Książki", icon: <BsJournalBookmark className="mr-2" /> },
    { value: "NOTATKI", label: "Notatki", icon: <BsJournalBookmark className="mr-2" /> },
    { value: "KOREPETYCJE", label: "Korepetycje", icon: <GiTeacher className="mr-2" /> },
    { value: "INNE", label: "Inne", icon: <IoOptions className="mr-2" /> },
  ];

  // funkcja pomocnicza do pobrania ikony dla kategorii
  const getCategoryIcon = (category: string) => {
    const found = categories.find(c => c.value === category);
    return found ? found.icon : <IoOptions className="mr-2" />;
  };

  return (
    <>
      <TopNavbar /> {/* górna nawigacja */}
      <SidebarLayout> {/* layout z bocznym panelem */}
        <h1 className="text-2xl font-bold mb-4">Twoje ulubione</h1>

        {/* jeśli brak ulubionych */}
        {favoriteOffers.length === 0 ? (
          <p className="text-gray-600">Brak ulubionych ofert</p>
        ) : (
          <div className="space-y-4">
            {favoriteOffers.map((offer) => {
              const isFree = offer.price === 0; // sprawdzenie czy oferta darmowa
              const categoryData = categories.find(c => c.value === offer.category); // dane kategorii
              return (
                <div
                  key={offer.id}
                  className="bg-white p-4 rounded shadow flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedOfferId(offer.id)} // otwarcie modala
                >
                  {/* miniatura oferty */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">Brak obrazu</div>
                    )}
                  </div>

                  {/* szczegóły oferty */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">{offer.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FaRegCalendarAlt size={14} />
                      <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-blue-600 font-semibold">
                      {isFree ? "Za darmo" : `${offer.price} zł`}
                    </p>
                  </div>

                  {/* przycisk do usuwania z ulubionych */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // zapobiega kliknięciu w kartę
                        toggleFavorite(offer.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                      title="Usuń z ulubionych"
                    >
                      <FaHeart className="text-red-500" size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SidebarLayout>

      {/* modal ze szczegółami oferty */}
      {selectedOfferId && (
        <OfferDetailModal
          offerId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)} // zamknięcie modala
          onFavoriteToggle={(id, isNowFavorite) => {
            if (!isNowFavorite) {
              setFavoriteOffers(favoriteOffers.filter((offer) => offer.id !== id)); // aktualizacja widoku
            }
          }}
        />
      )}
    </>
  );
}