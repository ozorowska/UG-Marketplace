"use client"

import React, { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">UG Marketplace</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-medium"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Witaj, {session.user.email}!</h2>
        <p className="text-gray-600 mb-8">Przeglądaj najnowsze oferty lub wystaw swoje własne.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl cursor-pointer"
              onClick={() => router.push(`/offer/${offer.id}`)}
            >
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{offer.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{offer.category}</p>
                <p className="text-lg font-bold text-blue-700 mb-4">{offer.price} zł</p>
                <p className="text-gray-500 text-sm">{offer.major}</p>
              </div>
            </div>
          ))}
        </div>

        {offers.length === 0 && (
          <p className="text-gray-500 text-center mt-6">Brak dostępnych ofert. Dodaj swoją pierwszą ofertę!</p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-6">
        <div className="container mx-auto text-center">
          <p className="text-sm">© {new Date().getFullYear()} UG Marketplace. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  )
}

