"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
// Załóżmy, że plik ug_majors.json jest w katalogu głównym projektu:
import majorsData from "../../ug_majors.json";

interface NewOfferMultiStepModalProps {
  onClose: () => void;
}

export default function NewOfferMultiStepModal({
  onClose,
}: NewOfferMultiStepModalProps) {
  const { data: session } = useSession();

  // KROK FORMULARZA
  const [step, setStep] = useState(1);

  // Pola wspólne
  const [category, setCategory] = useState<string>("INNE"); // enum: "KSIAZKI" | "NOTATKI" | "KOREPETYCJE" | "INNE"
  const [department, setDepartment] = useState<string>(""); // wydział
  const [major, setMajor] = useState<string>("");           // kierunek

  // Pola KROKU 2: (zależne od kategorii)
  // --- Przykładowe stany dla Książki:
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookYear, setBookYear] = useState("");
  const [bookCondition, setBookCondition] = useState("");

  // --- Notatki:
  const [notesSubject, setNotesSubject] = useState("");
  const [notesTeacher, setNotesTeacher] = useState("");
  const [notesScope, setNotesScope] = useState<string[]>([]); // np. ["wykład", "ćwiczenia"]

  // --- Korepetycje:
  const [tutorSubject, setTutorSubject] = useState("");
  const [tutorDescription, setTutorDescription] = useState("");

  // --- Inne:
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  // Pole wspólne – zdjęcie:
  const [image, setImage] = useState<File | null>(null);

  // KROK 3: cena, odbiór/miejsce, tagi
  const [price, setPrice] = useState("");
  const [pickup, setPickup] = useState(""); // np. "Odbiór osobisty" / "dostawa"
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // W korepetycjach: cena/h i miejsce
  // (Możemy użyć jednego stanu price i jednego pickUp/miejsce, by nie komplikować)

  // Komunikat błędu
  const [error, setError] = useState("");

  // --------------
  // Obsługa Wydział/Kierunek z pliku JSON
  // --------------
  // Wyłuskujemy unikalne wydziały
  const uniqueDepartments = Array.from(
    new Set(majorsData.map((item) => item.wydzial))
  );

  // Filtrowanie kierunków na podstawie wybranego wydziału
  const filteredMajors = majorsData
    .filter((item) => item.wydzial === department)
    .map((item) => item.kierunek);

  // --------------
  // Obsługa tagów
  // --------------
  function handleAddTag() {
    if (newTag.trim() !== "") {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  }
  function handleRemoveTag(tagToRemove: string) {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }

  // --------------
  // Zarządzanie krokami
  // --------------
  function goNextStep() {
    setError("");
    setStep((prev) => prev + 1);
  }
  function goPrevStep() {
    setError("");
    setStep((prev) => prev - 1);
  }

  // --------------
  // Zbieranie danych i wysyłka do API
  // --------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Sprawdzamy, czy mamy ID zalogowanego użytkownika
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      setError("Nie można dodać oferty. Użytkownik niezalogowany.");
      return;
    }

    try {
      const formData = new FormData();
      // Zależnie od kategorii – tworzymy jakiś sensowny tytuł i opis,
      // aby spiąć to w jednej ofercie
      // ---------------------------------------------------------------
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

      // W formData przekazujemy:
      formData.append("title", finalTitle);
      formData.append("description", finalDescription);
      formData.append("price", price);
      formData.append("tags", tags.join(",")); // Tagi jako string
      formData.append("department", department); // Wydział
      formData.append("major", major);           // Kierunek
      formData.append("category", category);     // Kategoria
      formData.append("userId", userId);

      if (image) formData.append("image", image);

      // Możesz też dodać pole "pickup" czy "miejsce", w zależności od Twojej logiki:
      formData.append("pickup", pickup);

      // --------------
      // Wysyłka do backendu
      // --------------
      const res = await fetch("/api/offers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nie udało się dodać oferty");
      }

      alert("Oferta została dodana!");
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // --------------
  // Render
  // --------------
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
            {/* W zależności od kroku renderujemy inne pola */}
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  {/* Kategoria */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Kategoria
                    </label>
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

                  {/* Wydział */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Wydział
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setMajor(""); // reset kierunku przy zmianie wydziału
                      }}
                      required
                    >
                      <option value="">-- Wybierz wydział --</option>
                      {uniqueDepartments.map((dep) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kierunek */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Kierunek
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      required
                    >
                      <option value="">-- Wybierz kierunek --</option>
                      {filteredMajors.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {/* Zdjęcie (wspólne dla wszystkich kategorii) */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Zdjęcie (opcjonalne)
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

                  {/* Pola specyficzne dla kategorii */}
                  {category === "KSIAZKI" && (
                    <>
                      <div>
                        <label>Tytuł książki</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label>Autor</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={bookAuthor}
                          onChange={(e) => setBookAuthor(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Wydawnictwo</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={bookPublisher}
                          onChange={(e) => setBookPublisher(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Rok wydania</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={bookYear}
                          onChange={(e) => setBookYear(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Stan książki</label>
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
                        <label>Przedmiot</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={notesSubject}
                          onChange={(e) => setNotesSubject(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label>Prowadzący</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={notesTeacher}
                          onChange={(e) => setNotesTeacher(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Zakres</label>
                        <div className="flex gap-2">
                          {["wykład", "ćwiczenia", "laboratoria", "egzamin"].map(
                            (item) => (
                              <label key={item} className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-1"
                                  checked={notesScope.includes(item)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNotesScope((prev) => [...prev, item]);
                                    } else {
                                      setNotesScope((prev) =>
                                        prev.filter((val) => val !== item)
                                      );
                                    }
                                  }}
                                />
                                {item}
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {category === "KOREPETYCJE" && (
                    <>
                      <div>
                        <label>Przedmiot</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={tutorSubject}
                          onChange={(e) => setTutorSubject(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label>Opis</label>
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
                        <label>Tytuł</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={otherTitle}
                          onChange={(e) => setOtherTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label>Opis</label>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={otherDescription}
                          onChange={(e) =>
                            setOtherDescription(e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {/* Cena */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Cena
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="np. 50"
                      required
                    />
                  </div>

                  {/* Odbiór / Miejsce */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Odbiór / Miejsce
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="np. Odbiór osobisty w Gdańsku / Spotkanie w bibliotece..."
                    />
                  </div>

                  {/* Tagi */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tagi
                    </label>
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
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              {/* Przycisk NAWIGACJI (do przodu/do tyłu) */}
              <div className="flex justify-end mt-6 gap-2">
                {/* Cofnij (niedostępne w kroku 1) */}
                {step > 1 && (
                  <button
                    type="button"
                    onClick={goPrevStep}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    Wróć
                  </button>
                )}

                {/* Dalej / Opublikuj (na ostatnim kroku) */}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNextStep}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Dalej
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Opublikuj
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
