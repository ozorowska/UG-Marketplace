"use client";

import React, { useState, useEffect } from "react";
import majorsData from "../../../../public/ug_majors.json"; // <-- import pliku JSON z kierunkami

// Przykładowy typ oferty, by mieć lepsze podpowiedzi
type Tag = { id: string; name: string };
type Offer = {
  id: string;
  category?: string;     // "KSIAZKI", "NOTATKI", "KOREPETYCJE", "INNE"
  major?: string;        // kierunek
  price?: number;
  imageUrl?: string | null;
  tags?: Tag[];
  // W bazie finalnie masz tylko title/description,
  // ale w edycji chcesz "rozbić" to na poszczególne pola
  title: string;
  description: string;
};

interface EditOfferModalProps {
  offer: Offer | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditOfferModal({ offer, onClose, onSuccess }: EditOfferModalProps) {
  // -----------------------------------
  // 1) STANY OGÓLNE
  // -----------------------------------
  const [error, setError] = useState("");

  // Kategoria (np. KSIĄŻKI, NOTATKI, KOREPETYCJE, INNE)
  const [category, setCategory] = useState("INNE");

  // Kierunek (dropdown z całej listy)
  const [major, setMajor] = useState("");

  // Cena i tagi
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Zdjęcie
  const [image, setImage] = useState<File | null>(null);

  // -----------------------------------
  // 2) STANY ZALEŻNE OD KATEGORII
  //    (podobnie jak w multi-step)
  // -----------------------------------
  // - Książki
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookYear, setBookYear] = useState("");
  const [bookCondition, setBookCondition] = useState("");

  // - Notatki
  const [notesSubject, setNotesSubject] = useState("");
  const [notesTeacher, setNotesTeacher] = useState("");
  const [notesScope, setNotesScope] = useState<string[]>([]);

  // - Korepetycje
  const [tutorSubject, setTutorSubject] = useState("");
  const [tutorDescription, setTutorDescription] = useState("");

  // - Inne
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  // -----------------------------------
  // 3) ŁADOWANIE POCZĄTKOWYCH DANYCH
  // -----------------------------------
  useEffect(() => {
    if (!offer) return;

    // Ustawiamy kategorie z oferty (jeśli jest)
    setCategory(offer.category ?? "INNE");
    // Kierunek
    setMajor(offer.major ?? "");
    // Cena
    setPrice(String(offer.price ?? ""));

    // Tagi
    if (offer.tags) {
      setTags(offer.tags.map((tag) => tag.name));
    }

    // Zdjęcie - puste, bo user może/chce wgrać nowe
    setImage(null);

    // Tutaj najtrudniejsza część: Rozbicie `offer.title` i `offer.description`
    // na poszczególne pola (bookAuthor, bookPublisher, itp.)
    // Jeśli w bazie "title" i "description" zawierają już poskładane info,
    // musisz napisać parser, który je rozdzieli.
    // Poniżej TYLKO PRZYKŁAD "w ciemno":
    if (offer.category === "KSIAZKI") {
      // Przykład: offer.title = "Programowanie w C++"
      //           offer.description = "Autor: Bjarne, Wydawnictwo: XYZ, Rok: 2012, Stan: Używana"

      // Wyłóżmy to na stany:
      setBookTitle(offer.title || "");
      // Prosta "niedoskonała" metoda, np. poszukaj "Autor: X, Wydawnictwo: Y, ..." w description
      const desc = offer.description ?? "";
      // Tu w praktyce musisz wyciąć fragment "Autor: ...", "Wydawnictwo: ...", itp.
      // Na potrzeby przykładu robimy coś symbolicznego:
      // Uwaga: to jest "ręcznie" – do production przydałby się lepszy parser
      const authorMatch = desc.match(/Autor:\s*(.*?),/);
      if (authorMatch) setBookAuthor(authorMatch[1].trim());

      const pubMatch = desc.match(/Wydawnictwo:\s*(.*?),/);
      if (pubMatch) setBookPublisher(pubMatch[1].trim());

      const yearMatch = desc.match(/Rok:\s*(.*?),/);
      if (yearMatch) setBookYear(yearMatch[1].trim());

      const condMatch = desc.match(/Stan:\s*(.*)/);
      if (condMatch) setBookCondition(condMatch[1].trim());

    } else if (offer.category === "NOTATKI") {
      // np. title = "Algorytmy i Struktury Danych"
      //     description = "Prowadzący: Kowalski, Zakres: wykład, ćwiczenia"
      setNotesSubject(offer.title || "");
      const desc = offer.description ?? "";
      // ...
      // Reszta – analogicznie jak wyżej, ewentualnie parser

    } else if (offer.category === "KOREPETYCJE") {
      setTutorSubject(offer.title || "");
      setTutorDescription(offer.description || "");
    } else {
      // INNE
      setOtherTitle(offer.title || "");
      setOtherDescription(offer.description || "");
    }
  }, [offer]);

  // -----------------------------------
  // 4) Dodawanie / Usuwanie tagów
  // -----------------------------------
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

  // -----------------------------------
  // 5) Lista wszystkich dostępnych kierunków
  //    (pomijamy wydział – bierzemy unikalne "kierunek")
  // -----------------------------------
  const allMajors = Array.from(new Set(majorsData.map((item) => item.kierunek)));

  // -----------------------------------
  // 6) Wysyłka formularza (PUT do /api/offers/[id])
  // -----------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!offer?.id) {
      setError("Brak ID oferty do edycji.");
      return;
    }

    try {
      // 1) Zbudujmy "title" i "description" w sposób zbliżony do nowego formularza
      let finalTitle = "";
      let finalDescription = "";

      switch (category) {
        case "KSIAZKI":
          finalTitle = bookTitle;
          finalDescription = `Autor: ${bookAuthor}, Wydawnictwo: ${bookPublisher}, Rok: ${bookYear}, Stan: ${bookCondition}`;
          break;
        case "NOTATKI":
          finalTitle = notesSubject;
          finalDescription = `Prowadzący: ${notesTeacher}, Zakres: ${notesScope.join(", ")}`;
          break;
        case "KOREPETYCJE":
          finalTitle = tutorSubject;
          finalDescription = tutorDescription;
          break;
        case "INNE":
        default:
          finalTitle = otherTitle;
          finalDescription = otherDescription;
          break;
      }

      // 2) Pakujemy do FormData
      const formData = new FormData();
      formData.append("category", category);
      formData.append("major", major);
      formData.append("price", price);

      formData.append("title", finalTitle);
      formData.append("description", finalDescription);

      // Tagi
      formData.append("tags", tags.join(","));

      // Zdjęcie
      if (image) {
        formData.append("image", image);
      } else if (offer.imageUrl) {
        // Jeżeli nie wybrano nowego zdjęcia, podajemy stare
        formData.append("imageUrl", offer.imageUrl);
      }

      // 3) Wyślij PUT
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

  // -----------------------------------
  // 7) Render
  // -----------------------------------
  return (
    <>
      {/* Overlay – kliknięcie w tło zamyka modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-50 flex items-center justify-center px-2">
        <div
          className="relative w-full max-w-lg bg-white rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nagłówek */}
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Edytuj ofertę</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              &#10005;
            </button>
          </div>

          {/* Treść */}
          <div className="max-h-[80vh] overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kierunek */}
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
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategoria */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Kategoria</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="KSIAZKI">Książki</option>
                  <option value="NOTATKI">Notatki</option>
                  <option value="KOREPETYCJE">Korepetycje</option>
                  <option value="INNE">Inne</option>
                </select>
              </div>

              {/* Pola zależne od kategorii */}
              {category === "KSIAZKI" && (
                <>
                  <div>
                    <label className="block font-medium">Tytuł książki</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Autor</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Wydawnictwo</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={bookPublisher}
                      onChange={(e) => setBookPublisher(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Rok wydania</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={bookYear}
                      onChange={(e) => setBookYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Stan książki</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="np. Nowa, Używana..."
                      value={bookCondition}
                      onChange={(e) => setBookCondition(e.target.value)}
                    />
                  </div>
                </>
              )}

              {category === "NOTATKI" && (
                <>
                  <div>
                    <label className="block font-medium">Przedmiot</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={notesSubject}
                      onChange={(e) => setNotesSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Prowadzący</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={notesTeacher}
                      onChange={(e) => setNotesTeacher(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Zakres</label>
                    <div className="flex gap-2 flex-wrap">
                      {["wykład", "ćwiczenia", "laboratoria", "egzamin"].map((item) => (
                        <label key={item} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={notesScope.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotesScope((prev) => [...prev, item]);
                              } else {
                                setNotesScope((prev) => prev.filter((x) => x !== item));
                              }
                            }}
                          />
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
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={tutorSubject}
                      onChange={(e) => setTutorSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Opis</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={tutorDescription}
                      onChange={(e) => setTutorDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {category === "INNE" && (
                <>
                  <div>
                    <label className="block font-medium">Tytuł</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={otherTitle}
                      onChange={(e) => setOtherTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Opis</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={otherDescription}
                      onChange={(e) => setOtherDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Cena */}
              <div>
                <label className="block font-medium">Cena (zł)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Tagi */}
              <div>
                <label className="block font-medium">Tagi</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                    >
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
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

              {/* Zdjęcie */}
              <div>
                <label className="block font-medium">Zdjęcie (opcjonalnie)</label>
                {offer?.imageUrl && !image && (
                  <div className="mb-4">
                    <p className="text-gray-700">Obecne zdjęcie:</p>
                    <img
                      src={offer.imageUrl}
                      alt="Obecne zdjęcie"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
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

              {/* Przycisk ZAPISZ */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
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
