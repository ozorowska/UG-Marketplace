/*"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function HomePage() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div>
        <h1>Nie jesteś zalogowany</h1>
        <button onClick={() => signIn()}>Zaloguj</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Witaj {session.user?.email}!</h1>
      <button onClick={() => signOut()}>Wyloguj</button>
    </div>
  )
}*/

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-ugBlue">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">
          UG Marketplace
        </h1>
        <p className="mb-4">
          Witaj na platformie ogłoszeniowej Uniwersytetu Gdańskiego.
          Zaloguj się, aby przeglądać i wystawiać oferty.
        </p>
        <a
          href="/login"
          className="bg-ugBlue text-white px-4 py-2 rounded hover:bg-ugLightBlue transition"
        >
          Zaloguj się
        </a>
      </div>
    </main>
  )
}

