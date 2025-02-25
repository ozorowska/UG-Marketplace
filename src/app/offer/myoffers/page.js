"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";

// Załóżmy, że umieściłaś EditOfferModal w tym samym folderze co page.js
// lub w folderze components – dostosuj ścieżkę w zależności od miejsca:
import EditOfferModal from "./EditOfferModal"; 
// np. jeśli jest w app/offer/myoffers/EditOfferModal.jsx
// w innym wypadku dopasuj: "../../../components/EditOfferModal" itd.

export default function MyOffersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myOffers, setMyOffers] = useState([]);

  // Stan do obsługi modala edycji
  const [showEditModal, setShowEditModal] = useState(false);
  const [offerToEdit, setOfferToEdit] = useState(null);

  // Pobieranie ofert
  async function fetchMyOffers() {
    try {
      const res = await fetch(`/api/offers?userId=${session.user.id}`);
      if (!res.ok) {
        throw new Error("Nie udało się pobrać ofert użytkownika");
      }
      const data = await res.json();
      setMyOffers(data);
    } catch (error) {
      console.error("Błąd przy pobieraniu moich ofert:", error);
    }
  }
  

  // Usuwanie oferty
  async function handleDeleteOffer(offerId) {
    if (!window.confirm("Na pewno chcesz usunąć tę ofertę?")) {
      return;
    }

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Nie udało się usunąć oferty");
      }
      // Odśwież listę po usunięciu
      fetchMyOffers();
    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd przy usuwaniu oferty");
    }
  }

  // Obsługa kliknięcia "Edytuj"
  function handleEditClick(offer) {
    setOfferToEdit(offer);
    setShowEditModal(true);
  }

  // Callback wywoływany po udanej edycji oferty (odświeżamy listę)
  function handleEditSuccess() {
    fetchMyOffers();
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchMyOffers();
  }, [session, status, router]);

  if (!session) {
    return null;
  }

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
                className="bg-white p-4 rounded shadow flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">ID: {offer.id}</p>
                  <h3 className="text-lg font-medium">{offer.title}</h3>
                </div>
                <div className="flex gap-2">
                  {/* Przycisk "Edytuj" otwiera modal */}
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => handleEditClick(offer)}
                  >
                    Edytuj
                  </button>

                  {/* Przycisk "Usuń" wywołuje funkcję usunięcia */}
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDeleteOffer(offer.id)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarLayout>

      {/* Renderowanie modala edycji (warunkowe) */}
      {showEditModal && (
        <EditOfferModal
          offer={offerToEdit}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
