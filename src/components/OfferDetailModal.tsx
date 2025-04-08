"use client";

import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaHeart, FaEnvelope, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface OfferDetailModalProps {
  offerId: string;
  onClose: () => void;
}

type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  user?: { 
    id: string;
    name: string;
    image?: string;
  };
  category?: string;
  location?: string;
  createdAt?: string;
  tags?: { id: string; name: string }[];
};

export default function OfferDetailModal({ offerId, onClose }: OfferDetailModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsedDetails, setParsedDetails] = useState<{ [key: string]: any }>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    async function fetchOffer() {
      try {
        const [offerRes, favoritesRes] = await Promise.all([
          fetch(`/api/offers/${offerId}`),
          session ? fetch("/api/favorites") : Promise.resolve(null)
        ]);

        if (!offerRes.ok) throw new Error("Nie udało się pobrać oferty");
        const offerData = await offerRes.json();
        setOffer(offerData);

        try {
          setParsedDetails(JSON.parse(offerData.description));
        } catch {
          setParsedDetails({ baseDescription: offerData.description });
        }

        if (favoritesRes?.ok) {
          const favorites = await favoritesRes.json();
          setIsFavorite(favorites.some((fav: { id: string }) => fav.id === offerId));
        }
      } catch (error) {
        console.error(error);
        onClose();
      } finally {
        setLoading(false);
      }
    }
    fetchOffer();
  }, [offerId, onClose, session]);

  const handleSendMessage = async () => {
    if (!session) {
      alert("Musisz być zalogowany, aby wysłać wiadomość");
      return;
    }
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) throw new Error("Nie udało się rozpocząć konwersacji");
      const conversation = await res.json();
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Błąd podczas rozpoczynania konwersacji:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const res = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) throw new Error(`Nie udało się ${isFavorite ? "usunąć z" : "dodać do"} ulubionych`);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Błąd podczas zmiany ulubionych:", err);
    }
  };

  const toggleImageExpand = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="animate-pulse bg-white p-6 rounded-lg shadow-xl">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div 
          className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-gray-900">Oferta nieodnaleziona</h3>
          <p className="mt-2 text-gray-600">Nie można załadować oferty.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  const isFree = offer.price === 0;
  const date = offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : null;
  const pickupLocation = parsedDetails.location || offer.location;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      {/* Expanded Image View */}
      {isImageExpanded && offer.imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={toggleImageExpand}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
            aria-label="Zamknij podgląd"
          >
            <FaTimes size={24} />
          </button>
          <div className="max-w-full max-h-full">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Zamknij"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
              >
                <FaHeart className={isFavorite ? "text-red-500" : "text-gray-400"} />
              </button>
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Wyślij wiadomość"
              >
                <FaEnvelope className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[80vh]">
            {/* Image */}
            {offer.imageUrl && (
              <div 
                className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden cursor-zoom-in"
                onClick={toggleImageExpand}
              >
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="object-cover w-full h-full hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </div>
            )}

            {/* Details */}
            <div className="p-6">
              {/* Title & Price */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
                <span className={`text-xl font-semibold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                  {isFree ? "Za darmo" : `${offer.price} zł`}
                </span>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                {offer.user?.name && (
                  <div className="flex items-center">
                    <span>Dodano przez {offer.user.name}</span>
                  </div>
                )}
                {date && (
                  <div className="flex items-center">
                    <span>{date}</span>
                  </div>
                )}
                {pickupLocation && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>Miejsce odbioru: {pickupLocation}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {offer.tags && offer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {offer.tags.map(tag => (
                    <span key={tag.id} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Main description */}
              {parsedDetails.baseDescription && (
                <p className="text-gray-700 mb-6 whitespace-pre-line">
                  {parsedDetails.baseDescription}
                </p>
              )}

              {/* Category-specific details */}
              {offer.category === "KSIAZKI" && parsedDetails.ksiazki && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Szczegóły książki</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Autor" value={parsedDetails.ksiazki.author} />
                    <DetailItem label="Wydawnictwo" value={parsedDetails.ksiazki.publisher} />
                    <DetailItem label="Rok wydania" value={parsedDetails.ksiazki.year} />
                    <DetailItem label="Stan" value={parsedDetails.ksiazki.condition} />
                  </div>
                </div>
              )}

              {offer.category === "NOTATKI" && parsedDetails.notatki && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Szczegóły notatek</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Prowadzący" value={parsedDetails.notatki.teacher} />
                    <DetailItem 
                      label="Zakres" 
                      value={Array.isArray(parsedDetails.notatki.scope) 
                        ? parsedDetails.notatki.scope.join(", ") 
                        : parsedDetails.notatki.scope} 
                    />
                  </div>
                </div>
              )}

              {offer.category === "KOREPETYCJE" && parsedDetails.korepetycje && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Szczegóły korepetycji</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Przedmiot" value={parsedDetails.korepetycje.subject} />
                    <DetailItem label="Dostępność" value={parsedDetails.korepetycje.availability} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
            <button
              onClick={handleSendMessage}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaEnvelope />
              <span>Wyślij wiadomość</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-gray-900">{value || "-"}</p>
    </div>
  );
}