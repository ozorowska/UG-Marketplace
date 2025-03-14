"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../components/SidebarLayout";
import TopNavbar from "../components/TopNavbar";
import { FaHeart } from "react-icons/fa";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favoriteOffers, setFavoriteOffers] = useState([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    // pobierz ulubione oferty
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) {
          throw new Error("Nie udało się pobrać ulubionych ofert");
        }
        const data = await res.json();
        setFavoriteOffers(data); // tablica ofert
      } catch (error) {
        console.error(error);
      }
    }
    fetchFavorites();
  }, []);

  if (!session) {
    return null;
  }

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <h1 className="text-2xl font-bold mb-4">Twoje ulubione</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteOffers.map((offer) => (
            <div key={offer.id} className="relative bg-white border ...">
              <div className="absolute top-2 right-2 text-red-600">
                <FaHeart />
              </div>
              <div className="bg-gray-50 flex items-center justify-center h-60">
                {offer.imageUrl && (
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="h-full max-h-full w-auto object-contain"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-base font-medium text-gray-800 truncate">
                  {offer.title}
                </h3>
                <p className="mt-3 text-lg font-semibold text-blue-600">
                  {offer.price} zł
                </p>
                {/* Tagi */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {offer.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SidebarLayout>
    </>
  );
}
