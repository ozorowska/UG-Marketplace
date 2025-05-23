"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";
import EditOfferModal from "./EditOfferModal";
import { FaEdit, FaTrash, FaRegCalendarAlt } from "react-icons/fa";

// typ oferty z wymaganymi polami
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

export default function MyOffersPage() {
  // dane sesji użytkownika
  const { data: session, status } = useSession();
  const router = useRouter();

  const [myOffers, setMyOffers] = useState<Offer[]>([]); // oferty użytkownika
  const [showEditModal, setShowEditModal] = useState(false); // widoczność modala
  const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null); // oferta do edycji

  // pobranie ofert zalogowanego użytkownika
  async function fetchMyOffers() {
    if (!session || !session.user) return;
    const userId = (session.user as { id: string }).id;
    try {
      const res = await fetch(`/api/offers?userId=${userId}`);
      if (!res.ok) {
        throw new Error("Nie udało się pobrać ofert użytkownika");
      }
      const data = await res.json();
      setMyOffers(data);
    } catch (error) {
      console.error("Błąd przy pobieraniu moich ofert:", error);
    }
  }

  // usuwanie oferty po potwierdzeniu
  async function handleDeleteOffer(offerId: string) {
    if (!window.confirm("Na pewno chcesz usunąć tę ofertę?")) return;
    try {
      const res = await fetch(`/api/offers/${offerId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Nie udało się usunąć oferty");
      }
      fetchMyOffers(); // odśwież listę
    } catch (error) {
      console.error("Błąd przy usuwaniu oferty:", error);
      alert("Wystąpił błąd przy usuwaniu oferty");
    }
  }

  // kliknięcie przycisku edycji
  function handleEditClick(offer: Offer) {
    setOfferToEdit(offer);
    setShowEditModal(true);
  }

  // po udanej edycji odśwież dane
  function handleEditSuccess() {
    fetchMyOffers();
  }

  // przekierowanie do logowania, jeśli brak sesji
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchMyOffers();
  }, [session, status, router]);

  if (!session) return null; // fallback na brak sesji

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <h1 className="text-2xl font-bold mb-6">Moje oferty</h1>
        {myOffers.length === 0 ? (
          <p className="text-gray-600">Nie masz jeszcze żadnych ofert.</p>
        ) : (
          <div className="space-y-4">
            {myOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white p-4 rounded shadow flex items-center gap-4 cursor-pointer"
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
                    {offer.price === 0 ? "Za darmo" : `${offer.price} zł`}
                  </p>
                </div>

                {/* przyciski edycji i usuwania */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(offer)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    title="Edytuj ofertę"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Usuń ofertę"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarLayout>

      {/* modal edycji */}
      {showEditModal && offerToEdit && (
        <EditOfferModal
          offer={offerToEdit}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
