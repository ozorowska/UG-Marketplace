"use client";

import React, { useState, useEffect } from "react";

export default function EditOfferModal({ offer, onClose, onSuccess }) {
  // Oczekujemy, że "offer" to obiekt z polami: id, title, description, price, category, major, imageUrl
  // onSuccess to np. callback do odświeżenia listy

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("KSIAZKI");
  const [major, setMajor] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (offer) {
      setTitle(offer.title || "");
      setDescription(offer.description || "");
      setPrice(String(offer.price || ""));
      setCategory(offer.category || "KSIAZKI");
      setMajor(offer.major || "");
    }
  }, [offer]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!offer?.id) {
      setError("Brak ID oferty do edycji.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("major", major);
      // userId – jeśli chcesz go przekazywać, np. sprawdzać na backendzie
      // formData.append("userId", session?.user?.id);  // opcjonalnie
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`/api/offers?id=${offer.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nie udało się zaktualizować oferty");
      }

      // Powiadomienie, zamknięcie modala, odświeżenie listy
      alert("Oferta została zaktualizowana!");
      onClose();
      if (onSuccess) onSuccess(); // np. ponowne pobranie danych
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div
          className="relative w-full max-w-lg bg-white rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Edytuj ofertę
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              &#10005;
            </button>
          </div>

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
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Kategoria
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="KSIAZKI">Książki</option>
                  <option value="NOTATKI">Notatki</option>
                  <option value="KOREPETYCJE">Korepetycje</option>
                  <option value="INNE">Inne</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Kierunek studiów
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Nowe zdjęcie (opcjonalnie)
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
                Zapisz zmiany
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
