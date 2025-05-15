// app/verify/page.tsx
"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState("Trwa weryfikacja...")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("Brak tokena")
      return
    }

    fetch(`/api/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus("Email potwierdzony! Możesz się zalogować.")
          setTimeout(() => router.push("/login"), 3000)
        } else {
          setStatus(data.error || "Błąd weryfikacji")
        }
      })
  }, [searchParams, router])

  return (
    <div className="p-10 text-center text-xl text-[#002147] font-bold">
      {status}
    </div>
  )
}
