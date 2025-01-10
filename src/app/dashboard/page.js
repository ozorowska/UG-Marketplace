"use client"

import React, { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("Dashboard session:", session)
    console.log("Dashboard status:", status)

    if (status === "loading") return

    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-700 text-white p-4 flex justify-between">
        <h1 className="text-xl font-bold">UG Marketplace</h1>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          Wyloguj
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">
          Witaj, {session.user.email}!
        </h2>
        <p className="mb-4">
          Tutaj możesz przeglądać i wystawiać oferty, modyfikować je...
        </p>
        {/* ... docelowo: kod do marketplace ... */}
      </main>
    </div>
  )
}
