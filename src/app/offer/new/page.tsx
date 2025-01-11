"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Dodanie pola id
      email: string;
    };
  }
}

export default function NewOfferPage() {
  const { data: session, status } = useSession(); // Pobieranie sesji
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("KSIAZKI");
  const [major, setMajor] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!session?.user?.id) {
      setError("Nie można dodać oferty. Użytkownik niezalogowany.");
      return;
    }

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          category,
          major,
          userId: session.user.id, // Pobieramy ID zalogowanego użytkownika
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nie udało się dodać oferty");
      }

      alert("Oferta została dodana!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }


  if (!session) {
    return <p>Musisz być zalogowany, aby dodać ofertę.</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dodaj nową ofertę</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Tytuł</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Opis</label>
          <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Cena (zł)</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Kategoria</label>
          <select
            className="w-full border p-2 rounded"
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
          <label className="block mb-2 font-medium">Kierunek studiów</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Dodaj ofertę
        </button>
      </form>
    </div>
  );
}
