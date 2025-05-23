"use client" 

import { useSearchParams, useRouter } from "next/navigation" 
import { useEffect, useState } from "react" 

export default function VerifyPage() {
  const searchParams = useSearchParams() // pozwala wyciągać parametry z URL, np. ?token=abc
  const router = useRouter() // do przekierowania po sukcesie
  const [status, setStatus] = useState("Trwa weryfikacja...") // domyślny komunikat

  useEffect(() => {
    const token = searchParams.get("token") // pobranie tokena z URL

    if (!token) {
      setStatus("Brak tokena") // jeśli brak – pokazujemy błąd
      return
    }

    // wysyłamy żądanie GET do backendu w celu weryfikacji konta
    fetch(`/api/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // jeśli weryfikacja się udała – pokazujemy sukces
          setStatus("Email potwierdzony! Możesz się zalogować.")

          // po 3 sekundach przekieruj na stronę logowania
          setTimeout(() => router.push("/login"), 3000)
        } else {
          // jeśli nie – pokazujemy błąd
          setStatus(data.error || "Błąd weryfikacji")
        }
      })
  }, [searchParams, router]) // efekt uruchamia się, gdy router lub URL się zmieni

  return (
    <div className="p-10 text-center text-xl text-[#002147] font-bold">
      {status}
    </div>
  )
}
