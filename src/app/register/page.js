"use client"

import { useState } from "react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Wysyłamy dane na nasz endpoint rejestracji: /api/register
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        // Jeżeli status nie jest 2xx, to odczytujemy błąd
        const data = await res.json()
        setError(data.error || "Coś poszło nie tak")
      } else {
        // Sukces
        setSuccess("Konto zostało utworzone! Możesz się zalogować.")
        // Czyścisz pola
        setEmail("")
        setPassword("")
      }
    } catch (err) {
      console.error("Błąd w fetch:", err)
      setError("Nie można połączyć z serwerem.")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Rejestracja</h1>
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
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Zarejestruj
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-600 mt-4">{success}</p>}
    </div>
  )
}
