"use client";

import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaHeart, FaEnvelope } from "react-icons/fa";
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
  };
};

export default function OfferDetailModal({ offerId, onClose }: OfferDetailModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    // jeśli użytkownik nie jest zalogowany, przekieruj np. do /login
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    // Pobierz szczegóły oferty
    async function fetchOffer() {
      try {
        const response = await fetch(`/api/offers/${offerId}`);
        if (!response.ok) {
          throw new Error("Nie udało się pobrać szczegółów oferty.");
        }
        const data = await response.json();
        setOffer(data);
      } catch (error) {
        console.error(error);
        onClose();
      } finally {
        setLoading(false);
      }
    }
    fetchOffer();
  }, [offerId, onClose]);

  const handleSendMessage = async () => {
    if (!session) {
      alert("Musisz być zalogowany, aby wysłać wiadomość.");
      return;
    }
    if (!offerId) {
      alert("Brak ID oferty");
      return;
    }

    try {
      // Wywołaj nasz nowy endpoint,
      // który sam ustali buyerId na podstawie session.user.email
      // i sellerId z oferty:
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        throw new Error("Błąd tworzenia / pobierania konwersacji");
      }

      const conversation = await response.json();
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Błąd podczas rozpoczynania konwersacji:", error);
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="text-white">Ładowanie...</div>
        </div>
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
          <div
            className="bg-white p-6 rounded shadow relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              &#10005;
            </button>
            <p className="text-gray-700">Ogłoszenie nie zostało znalezione.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Górny pasek z przyciskami */}
          <div className="flex items-center justify-between bg-[#002d73] text-white px-6 py-4 rounded-t-lg">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200"
            >
              <FaArrowLeft /> Zamknij
            </button>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200">
                <FaHeart /> Dodaj do ulubionych
              </button>
              <button
                onClick={handleSendMessage}
                className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200"
              >
                <FaEnvelope /> Wyślij wiadomość
              </button>
            </div>
          </div>

          {/* Zawartość modalu */}
          <div className="max-h-[80vh] overflow-y-auto">
            {offer.imageUrl && (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div className="p-6">
              <h1 className="text-3xl font-bold text-[#002d73] mb-4">
                {offer.title}
              </h1>
              <p className="text-gray-600 mb-6">{offer.description}</p>
              <p className="text-2xl font-semibold text-[#002d73] mb-4">
                Cena: {offer.price} zł
              </p>
              <p className="text-sm text-gray-500">
                Wystawiono przez:{" "}
                <span className="font-medium text-gray-700">
                  {offer.user?.name || "Nieznany użytkownik"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
