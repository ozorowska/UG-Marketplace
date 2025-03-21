"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface NewOfferModalProps {
  onClose: () => void;
}

export default function NewOfferModal({ onClose }: NewOfferModalProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  const [major, setMajor] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Rzutowanie: mówimy TS, że user może mieć pole 'id'.
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      setError("Nie można dodać oferty. Użytkownik niezalogowany.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("tags", tags);
      formData.append("major", major);
      formData.append("userId", userId);
      if (image) formData.append("image", image);

      const res = await fetch("/api/offers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nie udało się dodać oferty");
      }

      alert("Oferta została dodana!");
      onClose(); // zamknięcie modala
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      {/* Overlay – kliknięcie w tło zamyka modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      ></div>

      {/* Główny kontener modala */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div
          className="relative w-full max-w-lg bg-white rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()} // kliknięcie wewnątrz nie zamyka
        >
          {/* Górny pasek / przycisk zamknięcia */}
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Dodaj nową ofertę
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              &#10005;
            </button>
          </div>

          {/* Sekcja przewijana (jeśli potrzeba) */}
          <div className="max-h-[80vh] overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Tytuł
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wprowadź tytuł oferty"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Opis
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Opisz swoją ofertę..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Cena (zł)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="np. 50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div>
  <label className="block mb-2 font-medium text-gray-700">
    Tagi (oddziel przecinkami)
  </label>
  <input
    type="text"
    className="w-full rounded-lg border border-gray-300 px-3 py-2
               focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Np. książki, programowanie, edukacja"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
  />
</div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Kierunek studiów
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Np. Informatyka, Ekonomia..."
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Zdjęcie
                </label>
                <input
                  type="file"
                  className="block w-full text-sm text-gray-900 border border-gray-300 
                             rounded-lg cursor-pointer bg-gray-50 focus:outline-none
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700
                             hover:file:bg-blue-100"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImage(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
                           hover:bg-blue-700 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:ring-offset-2"
              >
                Dodaj ofertę
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
