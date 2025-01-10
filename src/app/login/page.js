"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()

    // Wywołujemy NextAuth: signIn("credentials", ...)
    // "credentials" to nazwa providera, w route.js
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false // chcemy przejąć wynik i ewentualnie przekierować ręcznie
    })

    if (result.error) {
      // Błąd logowania
      setError(result.error)
    } else {
      // Sukces! Przekieruj np. na stronę główną
      window.location.href = "/"
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h1>Logowanie</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input 
            type="text" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </label>
        <label>
          Hasło
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </label>
        <button type="submit">Zaloguj</button>
      </form>
      {error && <p style={{color:"red"}}>{error}</p>}
    </div>
  )
}
