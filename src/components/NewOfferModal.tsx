"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  FaBook,
  FaChalkboardTeacher,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import { GrNotes, GrMoney } from "react-icons/gr";
import majorsData from "../../ug_majors.json";

interface NewOfferMultiStepModalProps {
  onClose: () => void;
  onOfferAdded: () => Promise<void>; // Dodana właściwość onOfferAdded
}

export default function NewOfferMultiStepModal({ onClose, onOfferAdded }: NewOfferMultiStepModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("INNE");
  const [department, setDepartment] = useState("");
  const [major, setMajor] = useState("");

  // Pola wspólne
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // Pola "książki" i "notatki"
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("");
  const [teacher, setTeacher] = useState("");
  const [scope, setScope] = useState<string[]>([]);

  // Pola "korepetycje"
  const [subject, setSubject] = useState("");
  const [availability, setAvailability] = useState("");

  // Krok 3
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [error, setError] = useState("");

  // Lista wydziałów i kierunków
  const uniqueDepartments = Array.from(new Set(majorsData.map((item) => item.wydzial)));
  const filteredMajors = majorsData
    .filter((item) => item.wydzial === department)
    .map((item) => item.kierunek);

  // Dodawanie/Usuwanie tagów
  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Kontrola ceny (nie dopuszczamy ujemnej)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseFloat(e.target.value) || 0);
    setPrice(value.toString());
  };

  // Wysyłanie danych
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Upewniamy się, że użytkownik jest zalogowany
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      setError("Musisz być zalogowany, aby dodać ofertę");
      return;
    }

    try {
      // 1) Składamy obiekt z danymi do zapisania w `description`
      const extraData: Record<string, any> = {
        baseDescription: description, // główny opis
        location,                     // miejsce odbioru/odbywania
      };

      if (category === "KSIAZKI") {
        extraData.ksiazki = { author, publisher, year, condition };
      }

      if (category === "NOTATKI") {
        extraData.notatki = { teacher, scope };
      }

      if (category === "KOREPETYCJE") {
        extraData.korepetycje = {
          subject,
          availability,
        };
      }

      // Konwertujemy do JSON:
      const finalDescriptionString = JSON.stringify(extraData);

      // 2) Budujemy formData do wysłania
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", finalDescriptionString);
      formData.append("price", price);
      formData.append("tags", tags.join(","));
      formData.append("department", department);
      formData.append("major", major);
      formData.append("category", category);
      formData.append("location", location);
      formData.append("userId", userId);

      if (image) {
        formData.append("image", image);
      }

      // 3) Wysłanie do /api/offers
      const res = await fetch("/api/offers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Nie udało się dodać oferty");
      }

      alert("Oferta dodana!");

      // Wywołujemy callback onOfferAdded aby odświeżyć listę ofert
      await onOfferAdded();

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd");
    }
  };

  // Lista opcji miejsca
  const pickupOptions =
    category === "KOREPETYCJE"
      ? ["Stacjonarnie", "Online"]
      : ["Kampus Oliwa", "Kampus Sopot", "Online", "Dogadamy się"];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pasek postępu */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Nagłówek */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Dodaj nową ofertę</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Krok 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                {/* Kategoria */}
                <label className="block mb-1 font-medium">
                  Kategoria <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "KSIAZKI", label: "Książki", icon: <FaBook /> },
                    { value: "NOTATKI", label: "Notatki", icon: <GrNotes /> },
                    { value: "KOREPETYCJE", label: "Korepetycje", icon: <FaChalkboardTeacher /> },
                    { value: "INNE", label: "Inne", icon: <GrMoney /> },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`p-3 border rounded flex flex-col items-center ${
                        category === item.value
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                      onClick={() => setCategory(item.value)}
                    >
                      <span className="text-lg mb-1">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {/* Wydział */}
                <label className="block mb-1 font-medium">
                  Wydział <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setMajor("");
                  }}
                  required
                >
                  <option value="">Wybierz</option>
                  {uniqueDepartments.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {/* Kierunek */}
                <label className="block mb-1 font-medium">
                  Kierunek <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                  disabled={!department}
                >
                  <option value="">Wybierz</option>
                  {filteredMajors.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Krok 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                {/* Tytuł */}
                <label className="block mb-1 font-medium">
                  Tytuł <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Pola KSIĄŻKI */}
              {category === "KSIAZKI" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-medium">
                        Autor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">
                        Wydawnictwo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-medium">
                        Rok wydania <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">
                        Stan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        placeholder="np. Nowa"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Pola NOTATKI */}
              {category === "NOTATKI" && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">
                      Prowadzący <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={teacher}
                      onChange={(e) => setTeacher(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Zakres <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["wykład", "ćwiczenia", "laboratoria", "egzamin"].map((item) => (
                        <label key={item} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={scope.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScope((prev) => [...prev, item]);
                              } else {
                                setScope((prev) => prev.filter((val) => val !== item));
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

              {/* Pola KOREPETYCJE */}
              {category === "KOREPETYCJE" && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">
                      Przedmiot <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Dostępność czasowa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="np. Pn-Pt 16:00-20:00"
                      required
                    />
                  </div>
                </>
              )}

              {/* Opis (wspólne) */}
              <div>
                <label className="block mb-1 font-medium">
                  Opis <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Zdjęcie */}
              <div>
                <label className="block mb-1 font-medium">Zdjęcie</label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed rounded cursor-pointer">
                  {image ? (
                    <span className="text-blue-600">Wybrano plik: {image.name}</span>
                  ) : (
                    <div className="text-center">
                      <FaImage className="mx-auto text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Kliknij, aby dodać zdjęcie</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Krok 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                {/* Cena */}
                <label className="block mb-1 font-medium">
                  Cena (PLN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={price}
                  onChange={handlePriceChange}
                  min="0"
                  step="0.01"
                  required
                />
                {price === "0" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Oferta będzie widoczna jako „za darmo”
                  </p>
                )}
              </div>

              <div>
                {/* Miejsce */}
                <label className="block mb-1 font-medium">
                  {category === "KOREPETYCJE" ? "Miejsce odbywania" : "Miejsce odbioru"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pickupOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`p-2 border rounded text-sm ${
                        location === option
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                      onClick={() => setLocation(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {/* Tagi */}
                <label className="block mb-1 font-medium">Tagi</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-blue-500"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-l"
                    placeholder="Dodaj tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <button
                    type="button"
                    className="px-3 bg-blue-500 text-white rounded-r"
                    onClick={handleAddTag}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Komunikat błędu (jeśli wystąpi) */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* Nawigacja */}
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                <FaChevronLeft className="mr-1" /> Wstecz
              </button>
            )}
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
                >
                  Dalej <FaChevronRight className="ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded"
                >
                  Opublikuj <FaCheck className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
