"use client"

import React, { useState, useEffect, FormEvent, JSX } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function RegisterPage(): JSX.Element {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")

  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Coś poszło nie tak")
        return
      }

      alert("Konto utworzone poprawnie! Zaloguj się.")
      router.push("/login")
    } catch (err) {
      setError("Błąd połączenia z serwerem")
      console.error(err)
    }
  }

 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Zarejestruj się</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">
              Email (tylko @studms.ug.edu.pl)
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="np. anna.kowalska@studms.ug.edu.pl"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Hasło</label>
            <input
              type="password"
              className="w-full border border-gray-300 p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Twoje hasło"
            />
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Zarejestruj
          </button>
        </form>

        <div className="mt-4 flex justify-center text-sm">
          <a href="/login" className="text-blue-600 hover:underline">
            Masz już konto? Zaloguj się
          </a>
        </div>
      </div>
    </div>
  )
}
