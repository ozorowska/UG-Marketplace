"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft, FaHeart, FaEnvelope } from "react-icons/fa"; // Ikony

type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  user?: { name: string }; // Dodano użytkownika
};

export default function OfferPage() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        if (!params?.id) throw new Error("ID ogłoszenia nie zostało przekazane.");

        const response = await fetch(`/api/offers/${params.id}`);
        if (!response.ok) {
          throw new Error("Nie udało się pobrać szczegółów ogłoszenia.");
        }
        const data = await response.json();
        setOffer(data);
      } catch (error) {
        console.error(error);
        router.push("/dashboard"); // Przekierowanie w przypadku błędu
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [params?.id, router]);

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Ogłoszenie nie zostało znalezione.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        {/* Nagłówek */}
        <header className="flex items-center justify-between bg-[#002d73] text-white px-6 py-4 rounded-t-lg">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200"
          >
            <FaArrowLeft /> Powrót do Dashboardu
          </button>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200">
              <FaHeart /> Dodaj do ulubionych
            </button>
            <button className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200">
              <FaEnvelope /> Wyślij wiadomość
            </button>
          </div>
        </header>

        {/* Zdjęcie */}
        {offer.imageUrl && (
          <div className="w-full h-64 bg-gray-200 overflow-hidden flex items-center justify-center">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {/* Szczegóły */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-[#002d73] mb-4">{offer.title}</h1>
          <p className="text-gray-600 mb-6">{offer.description}</p>

          <p className="text-2xl font-semibold text-[#002d73] mb-4">
            Cena: {offer.price} zł
          </p>

          <p className="text-sm text-gray-500">
            Wystawiono przez: <span className="font-medium text-gray-700">{offer.user?.name || "Nieznany użytkownik"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}