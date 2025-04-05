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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favoriteOffers, setFavoriteOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) throw new Error("Nie udało się pobrać ulubionych ofert");
        const data = await res.json();
        setFavoriteOffers(data);
      } catch (error) {
        console.error("Błąd pobierania ulubionych:", error);
      }
    }
    fetchFavorites();
  }, []);

  if (!session) return null;

  const categories = [
    { value: "KSIAZKI", label: "Książki", icon: <BsJournalBookmark className="mr-2" /> },
    { value: "NOTATKI", label: "Notatki", icon: <BsJournalBookmark className="mr-2" /> },
    { value: "KOREPETYCJE", label: "Korepetycje", icon: <GiTeacher className="mr-2" /> },
    { value: "INNE", label: "Inne", icon: <IoOptions className="mr-2" /> },
  ];

  const getCategoryIcon = (category: string) => {
    const found = categories.find(c => c.value === category);
    return found ? found.icon : <IoOptions className="mr-2" />;
  };

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <h1 className="text-2xl font-bold mb-4">Twoje ulubione</h1>
        {favoriteOffers.length === 0 ? (
          <p className="text-gray-600">Brak ulubionych ofert</p>
        ) : (
          <div className="space-y-4">
            {favoriteOffers.map((offer) => {
              const isFree = offer.price === 0;
              const categoryData = categories.find(c => c.value === offer.category);
              return (
                <div
                  key={offer.id}
                  className="bg-white p-4 rounded shadow flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedOfferId(offer.id)}
                >
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
                  <div className="flex gap-2">
                    <FaHeart className="text-red-500" size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SidebarLayout>
      {selectedOfferId && (
        <OfferDetailModal
          offerId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      )}
    </>
  );
}
