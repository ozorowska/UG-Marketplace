"use client";

import React, { useState, useEffect } from "react";

export default function EditOfferModal({ offer, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [major, setMajor] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (offer) {
      setTitle(offer.title || "");
      setDescription(offer.description || "");
      setPrice(String(offer.price || ""));
      setMajor(offer.major || "");
      setImage(null);

      // Load existing tags as an array
      setTags(offer.tags ? offer.tags.map(tag => tag.name) : []);
    }
  }, [offer]);

  const handleAddTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

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
      formData.append("major", major);
      formData.append("tags", tags.join(",")); // Convert tags array to string

      if (image) {
        formData.append("image", image);
      } else if (offer.imageUrl) {
        formData.append("imageUrl", offer.imageUrl);
      }

      const res = await fetch(`/api/offers/${offer.id}`, { 
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Nie udało się zaktualizować oferty");
      }

      alert("Oferta została zaktualizowana!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>

      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Edytuj ofertę</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              &#10005;
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Tytuł</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wprowadź tytuł oferty"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Opis</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Opisz swoją ofertę..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Cena (zł)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Tag management */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Tagi</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                      {tag}
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dodaj nowy tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={handleAddTag}
                  >
                    Dodaj
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Kierunek studiów</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Nowe zdjęcie (opcjonalnie)</label>
                {offer?.imageUrl && !image && (
                  <div className="mb-4">
                    <p className="text-gray-700">Obecne zdjęcie:</p>
                    <img src={offer.imageUrl} alt="Obecne zdjęcie" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}

                <input
                  type="file"
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
