"use client"

import React, { useState, useEffect, FormEvent, JSX } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"


export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white rounded shadow p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Witaj w UG Marketplace!</h1>
        <p className="mb-8">
          Platforma ogłoszeniowa Uniwersytetu Gdańskiego.
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Zaloguj się
        </a>
      </div>
    </main>
  )
}

