"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Komponenty
import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";
import FloatingButton from "../../components/FloatingButton";
import OfferDetailModal from "../../components/OfferDetailModal";
import NewOfferModal from "../../components/NewOfferModal";

// Ikony
import { FaHeart, FaFilter, FaMapMarkerAlt, FaBook } from "react-icons/fa";
import { IoClose, IoOptions } from "react-icons/io5";
import { GiTeacher } from "react-icons/gi";
import { BsJournalBookmark } from "react-icons/bs";

// Typ oferty
interface Offer {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  tags: { id: string; name: string }[];
  category: string;
  createdAt: string;
  department: string;
  major: string;
  description: string;
  parsedLocation?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [sortOption, setSortOption] = useState<string>("Najnowsze");
  const [favoriteOffers, setFavoriteOffers] = useState<string[]>([]);
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMajor, setActiveMajor] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status, router]);

  const refreshOffers = async () => {
    try {
      const endpoint =
        query.trim() !== ""
          ? `/api/search?q=${encodeURIComponent(query)}`
          : "/api/offers";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch offers");
      const data = await res.json();
      
      const offersWithLocation = data.map((offer: any) => {
        try {
          const parsedDesc = JSON.parse(offer.description);
          return {
            ...offer,
            parsedLocation: parsedDesc.location || offer.location || "Dogadamy się"
          };
        } catch {
          return {
            ...offer,
            parsedLocation: offer.location || "Dogadamy się"
          };
        }
      });

      setOffers(offersWithLocation);
      setFilteredOffers(offersWithLocation);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  useEffect(() => {
    refreshOffers();
  }, [query]);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavoriteOffers(data.map((offer: Offer) => offer.id));
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    }
    if (session) fetchFavorites();
  }, [session]);

  const uniqueMajors = Array.from(new Set(offers.map((offer) => offer.major))).filter(Boolean);

  useEffect(() => {
    let sorted = [...offers];
    switch (sortOption) {
      case "Ceny rosnąco":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "Ceny malejąco":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "Najnowsze":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    if (activeCategory) {
      sorted = sorted.filter((offer) => offer.category === activeCategory);
    }
    if (activeMajor) {
      sorted = sorted.filter((offer) => offer.major === activeMajor);
    }
    setFilteredOffers(sorted);
  }, [offers, sortOption, activeCategory, activeMajor, favoriteOffers]);

  const toggleFavorite = async (offerId: string) => {
    try {
      const isFavorite = favoriteOffers.includes(offerId);
      const method = isFavorite ? "DELETE" : "POST";
      const res = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) throw new Error(`Failed to ${isFavorite ? "remove" : "add"} favorite`);
      setFavoriteOffers((prev) =>
        isFavorite ? prev.filter((id) => id !== offerId) : [...prev, offerId]
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const categories = [
    { value: "KSIAZKI", label: "Książki", icon: <FaBook className="mr-2" /> },
    { value: "NOTATKI", label: "Notatki", icon: <BsJournalBookmark className="mr-2" /> },
    { value: "KOREPETYCJE", label: "Korepetycje", icon: <GiTeacher className="mr-2" /> },
    { value: "INNE", label: "Inne", icon: <IoOptions className="mr-2" /> },
  ];

  const getCategoryIcon = (category: string) => {
    const found = categories.find((c) => c.value === category);
    return found ? found.icon : <IoOptions className="mr-2" />;
  };

  if (!session) return null;

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {query.trim() ? `Wyniki wyszukiwania: "${query}"` : "Oferty studenckie"}
            </h1>
            {query.trim() && (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-500 hover:text-gray-700"
                title="Zamknij wyszukiwanie"
              >
                <IoClose size={20} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50"
          >
            <FaFilter />
            <span>Filtry</span>
          </button>
        </div>
        {showFilters && (
          <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Kategoria</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() =>
                        setActiveCategory(activeCategory === category.value ? null : category.value)
                      }
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === category.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.icon}
                      {category.label}
                      {activeCategory === category.value && <IoClose className="ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Kierunek</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueMajors.slice(0, 5).map((major) => (
                    <button
                      key={major}
                      onClick={() => setActiveMajor(activeMajor === major ? null : major)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeMajor === major
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {major}
                      {activeMajor === major && <IoClose className="ml-1 inline" />}
                    </button>
                  ))}
                  {uniqueMajors.length > 5 && (
                    <select
                      value={activeMajor || ""}
                      onChange={(e) => setActiveMajor(e.target.value || null)}
                      className="px-3 py-2 rounded-lg text-sm bg-gray-100 border-none"
                    >
                      <option value="">Więcej kierunków...</option>
                      {uniqueMajors.slice(5).map((major) => (
                        <option key={major} value={major}>
                          {major}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sortowanie</h3>
              <div className="flex gap-2">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-100 border-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Najnowsze</option>
                  <option>Ceny rosnąco</option>
                  <option>Ceny malejąco</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {(activeCategory || activeMajor) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeCategory && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                {getCategoryIcon(activeCategory)}
                {categories.find((c) => c.value === activeCategory)?.label}
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <IoClose />
                </button>
              </div>
            )}
            {activeMajor && (
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                <span>{activeMajor}</span>
                <button 
                  onClick={() => setActiveMajor(null)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <IoClose />
                </button>
              </div>
            )}
          </div>
        )}
        {filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const isFavorite = favoriteOffers.includes(offer.id);
              const isFree = offer.price === 0;
              const categoryData = categories.find((c) => c.value === offer.category);
              return (
                <div
                  key={offer.id}
                  className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
                >
                  <button
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(offer.id);
                    }}
                    aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                  >
                    <FaHeart
                      className={isFavorite ? "text-red-500" : "text-gray-300 hover:text-red-400"}
                      size={18}
                    />
                  </button>
                  <div 
                    className="relative h-64 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setSelectedOfferId(offer.id)}
                  >
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                        <div className="text-center p-4">
                          {categoryData?.icon || <FaBook size={24} />}
                          <p className="mt-2 text-sm">{categoryData?.label || "Oferta"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div 
                    className="p-4 flex flex-col flex-grow cursor-pointer"
                    onClick={() => setSelectedOfferId(offer.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-xs text-gray-500">
                        {categoryData?.icon}
                        <span>{offer.department}</span>
                      </div>
                      <span className="text-xs text-gray-500">{offer.major}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">
                      {offer.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-1.5 text-gray-400" size={12} />
                      <span>{offer.parsedLocation}</span>
                    </div>
                    {offer.tags.length > 0 && (
                      <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                        {offer.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag.id}
                            onClick={(e) => {
                              e.stopPropagation(); // zapobiega otwarciu modala
                              router.push(`/dashboard?q=${encodeURIComponent(tag.name)}`);
                            }}
                            className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            #{tag.name}
                          </button>
                        ))}

                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className={`text-lg font-bold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                        {isFree ? "Za darmo" : `${offer.price} zł`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <FaFilter size={24} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Brak pasujących ofert
            </h3>
            <p className="text-gray-500 max-w-md mb-6">
              {activeCategory || activeMajor 
                ? `Nie znaleziono ofert dla wybranych filtrów`
                : "Spróbuj zmienić kryteria wyszukiwania"}
            </p>
            <button 
              onClick={() => {
                setActiveCategory(null);
                setActiveMajor(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Wyczyść filtry
            </button>
          </div>
        )}
      </SidebarLayout>
      <FloatingButton onClick={() => setShowNewOfferModal(true)} />
      {showNewOfferModal && (
        <NewOfferModal onClose={() => setShowNewOfferModal(false)} onOfferAdded={refreshOffers} />
      )}
      {selectedOfferId && (
        <OfferDetailModal
        offerId={selectedOfferId}
        onClose={() => setSelectedOfferId(null)}
        onFavoriteToggle={(id, isFav) => {
          if (isFav) {
            setFavoriteOffers([...favoriteOffers, id]);
          } else {
            setFavoriteOffers(favoriteOffers.filter((favId) => favId !== id));
          }
        }}
      />
      
      )}
    </>
  );
}