"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../components/SidebarLayout";
import TopNavbar from "../components/TopNavbar"
import FloatingButton from "../components/FloatingButton";
import { FaEye } from "react-icons/fa";


export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState([])

  useEffect(() => {
    console.log("Dashboard session:", session)
    console.log("Dashboard status:", status)

    if (status === "loading") return

    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch("/api/offers")
        if (!res.ok) {
          throw new Error("Nie udało się pobrać ofert")
        }
        const data = await res.json()
        setOffers(data)
      } catch (error) {
        console.error("Błąd przy pobieraniu ofert:", error)
      }
    }

    fetchOffers()
  }, [])

  
  if (!session) {
    return null
  }

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        {/* Filtry */}
        <div className="bg-white shadow-sm py-4 px-6 mb-8 flex justify-between items-center">
          <div className="flex gap-4">
            <button className="bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200">
              Kategorie
            </button>
            <button className="bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200">
              Cena
            </button>
          </div>
          <select
            className="bg-gray-100 px-4 py-2 rounded-full text-sm border border-gray-300"
          >
            <option>Sortuj według: Najnowsze</option>
            <option>Ceny rosnąco</option>
            <option>Ceny malejąco</option>
          </select>
        </div>

       {/* Oferty */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {offers.map((offer) => (
    <div
      key={offer.id}
      className="relative bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
      onClick={() => router.push(`/offer/${offer.id}`)}
    >
      {/* Obrazek */}
      <div className="bg-gray-50 flex items-center justify-center h-60">
        <img
          src={offer.imageUrl}
          alt={offer.title}
          className="h-full max-h-full w-auto object-contain"
        />
      </div>
      {/* Treść */}
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-800 truncate">{offer.title}</h3>
        <p className="text-sm text-gray-500">{offer.category}</p>
        <p className="mt-3 text-lg font-semibold text-blue-600">{offer.price} zł</p>
      </div>
    </div>
  ))}
</div>


        <FloatingButton />
      </SidebarLayout>
    </>
  );
}
