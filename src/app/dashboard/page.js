"use client"
import { useSession, signOut } from "next-auth/react"

export default function DashboardPage() {
  const { data: session } = useSession()

  if (!session) {
    // jeśli nie zalogowany, przekieruj do /login
    // (lub wyświetl komunikat i link do login)
    return (
      <div className="p-8">
        <p>Nie masz dostępu. <a href="/login">Zaloguj się</a></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-ugBlue text-white p-4 flex justify-between">
        <h1 className="font-bold text-xl">UG Marketplace</h1>
        <nav>
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
          >
            Wyloguj
          </button>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl mb-4">Witaj, {session.user?.email}!</h2>
        <p className="mb-6">Oto Twój panel. Możesz przeglądać oferty, dodawać nowe, itp.</p>
        {/* Tu wstaw listę ofert, przyciski do dodania nowej oferty, itp. */}
      </main>
      <footer className="bg-ugBlue text-white p-4 text-sm text-center">
        © 2025 Uniwersytet Gdański – Wszelkie prawa zastrzeżone
      </footer>
    </div>
  )
}
