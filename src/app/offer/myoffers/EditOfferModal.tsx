"use client";

import React, { useState, useEffect } from "react";
import majorsData from "../../../../public/ug_majors.json";

// Typy

type Tag = { id: string; name: string };
type Offer = {
  id: string;
  category?: string;
  major?: string;
  price?: number;
  imageUrl?: string | null;
  tags?: Tag[];
  title: string;
  description: string;
};

interface EditOfferModalProps {
  offer: Offer | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditOfferModal({ offer, onClose, onSuccess }: EditOfferModalProps) {
  const [error, setError] = useState("");
  const [category, setCategory] = useState("INNE");
  const [major, setMajor] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookYear, setBookYear] = useState("");
  const [bookCondition, setBookCondition] = useState("");

  const [notesSubject, setNotesSubject] = useState("");
  const [notesTeacher, setNotesTeacher] = useState("");
  const [notesScope, setNotesScope] = useState<string[]>([]);

  const [tutorSubject, setTutorSubject] = useState("");
  const [tutorDescription, setTutorDescription] = useState("");

  const [otherTitle, setOtherTitle] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  useEffect(() => {
    if (!offer) return;

    setCategory(offer.category ?? "INNE");
    setMajor(offer.major ?? "");
    setPrice(String(offer.price ?? ""));
    if (offer.tags) setTags(offer.tags.map((tag) => tag.name));
    setImage(null);

    try {
      const parsed = JSON.parse(offer.description);
      if (offer.category === "KSIAZKI") {
        setBookTitle(offer.title || "");
        setBookAuthor(parsed.ksiazki?.author || "");
        setBookPublisher(parsed.ksiazki?.publisher || "");
        setBookYear(parsed.ksiazki?.year || "");
        setBookCondition(parsed.ksiazki?.condition || "");
      } else if (offer.category === "NOTATKI") {
        setNotesSubject(offer.title || "");
        setNotesTeacher(parsed.notatki?.teacher || "");
        setNotesScope(parsed.notatki?.scope || []);
      } else if (offer.category === "KOREPETYCJE") {
        setTutorSubject(offer.title || "");
        setTutorDescription(parsed.korepetycje?.availability || "");
      } else {
        setOtherTitle(offer.title || "");
        setOtherDescription(parsed.baseDescription || "");
      }
    } catch {
      setOtherTitle(offer.title || "");
      setOtherDescription(offer.description || "");
    }
  }, [offer]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed !== "" && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const allMajors = Array.from(new Set(majorsData.map((item) => item.kierunek)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!offer?.id) {
      setError("Brak ID oferty do edycji.");
      return;
    }

    try {
      let finalTitle = "";
      let finalDescriptionData: Record<string, any> = {
        baseDescription: tutorDescription || otherDescription || "",
      };

      switch (category) {
        case "KSIAZKI":
          finalTitle = bookTitle;
          finalDescriptionData.ksiazki = {
            author: bookAuthor,
            publisher: bookPublisher,
            year: bookYear,
            condition: bookCondition,
          };
          break;
        case "NOTATKI":
          finalTitle = notesSubject;
          finalDescriptionData.notatki = {
            teacher: notesTeacher,
            scope: notesScope,
          };
          break;
        case "KOREPETYCJE":
          finalTitle = tutorSubject;
          finalDescriptionData.korepetycje = {
            subject: tutorSubject,
            availability: tutorDescription,
          };
          break;
        default:
          finalTitle = otherTitle;
      }

      const finalDescription = JSON.stringify(finalDescriptionData);

      const formData = new FormData();
      formData.append("category", category);
      formData.append("major", major);
      formData.append("price", price);
      formData.append("title", finalTitle);
      formData.append("description", finalDescription);
      formData.append("tags", tags.join(","));
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
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div
          className="relative w-full max-w-lg bg-white rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Edytuj ofertę</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              &#10005;
            </button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Kierunek</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                >
                  <option value="">-- Wybierz kierunek --</option>
                  {allMajors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Kategoria</label>
                <div className="p-2 bg-gray-100 rounded text-gray-800 font-medium">
                  {category === "KSIAZKI" && "Książki"}
                  {category === "NOTATKI" && "Notatki"}
                  {category === "KOREPETYCJE" && "Korepetycje"}
                  {category === "INNE" && "Inne"}
                </div>
                <input type="hidden" name="category" value={category} />
              </div>

              {category === "KSIAZKI" && (
                <>
                  <div>
                    <label className="block font-medium">Tytuł książki</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block font-medium">Autor</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium">Wydawnictwo</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={bookPublisher} onChange={(e) => setBookPublisher(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium">Rok wydania</label>
                    <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={bookYear} onChange={(e) => setBookYear(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium">Stan książki</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={bookCondition} onChange={(e) => setBookCondition(e.target.value)} />
                  </div>
                </>
              )}

              {category === "NOTATKI" && (
                <>
                  <div>
                    <label className="block font-medium">Przedmiot</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block font-medium">Prowadzący</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={notesTeacher} onChange={(e) => setNotesTeacher(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium">Zakres</label>
                    <div className="flex gap-2 flex-wrap">
                      {["wykład", "ćwiczenia", "laboratoria", "egzamin"].map((item) => (
                        <label key={item} className="flex items-center">
                          <input type="checkbox" className="mr-1" checked={notesScope.includes(item)} onChange={(e) => {
                            if (e.target.checked) setNotesScope((prev) => [...prev, item]);
                            else setNotesScope((prev) => prev.filter((x) => x !== item));
                          }} />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {category === "KOREPETYCJE" && (
                <>
                  <div>
                    <label className="block font-medium">Przedmiot</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={tutorSubject} onChange={(e) => setTutorSubject(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block font-medium">Opis</label>
                    <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" value={tutorDescription} onChange={(e) => setTutorDescription(e.target.value)} rows={3} />
                  </div>
                </>
              )}

              {category === "INNE" && (
                <>
                  <div>
                    <label className="block font-medium">Tytuł</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block font-medium">Opis</label>
                    <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)} rows={3} />
                  </div>
                </>
              )}

              <div>
                <label className="block font-medium">Cena (zł)</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>

              <div>
                <label className="block font-medium">Tagi</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                      {tag}
                      <button type="button" className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleRemoveTag(tag)}>✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Dodaj nowy tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleAddTag}>Dodaj</button>
                </div>
              </div>

              <div>
                <label className="block font-medium">Zdjęcie (opcjonalnie)</label>
                {offer?.imageUrl && !image && (
                  <div className="mb-4">
                    <p className="text-gray-700">Obecne zdjęcie:</p>
                    <img src={offer.imageUrl} alt="Obecne zdjęcie" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
                <input type="file" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={(e) => e.target.files && setImage(e.target.files[0])} />
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Zapisz zmiany</button>
            </form>
          </div>
        </div>
      </div>
    </>
  )}