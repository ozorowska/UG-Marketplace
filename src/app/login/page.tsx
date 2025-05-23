"use client"; 

import React, { useState, useEffect, FormEvent } from "react"; 
import { signIn, useSession } from "next-auth/react";          
import { useRouter } from "next/navigation";                   
import Image from "next/image";                                

// główny komponent – strona logowania
export default function LoginPage() {
  // zmienne stanu do przechowywania danych wpisanych przez użytkownika
  const [email, setEmail] = useState<string>("");        
  const [password, setPassword] = useState<string>("");  
  const [error, setError] = useState<string>("");        

  const router = useRouter();                            
  const { data: session, status } = useSession();        

  // jeśli użytkownik już jest zalogowany, przekieruj go na dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // funkcja wywoływana przy kliknięciu "Zaloguj"
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();      
    setError("");            

    // wywołanie funkcji logowania z NextAuth
    const result = await signIn("credentials", {
      email,                 
      password,
      redirect: false,      
    });

    // jeśli logowanie nie powiodło się – pokaż błąd
    if (result?.error) {
      setError(result.error); 
    } else {
      // jeśli OK – przekieruj użytkownika na dashboard
      router.push("/dashboard");
    }
  }

  // renderowanie strony
  return (
    <div className="min-h-screen flex">
      {/* lewa kolumna – formularz logowania */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[#002147] mb-2">
              UG Marketplace
            </h2>
            <h3 className="text-2xl font-bold text-gray-900">Zaloguj się</h3>
          </div>

          {/* formularz logowania */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  placeholder="twojmail@studms.ug.edu.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // aktualizujemy stan email
                  className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Hasło</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Twoje hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // aktualizujemy stan hasła
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                />
              </div>
            </div>

            {/* pokaz jeśli jest błąd logowania */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* przyciski logowania */}
            <div className="space-y-2">
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#002147] hover:bg-[#001a3e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002147]"
                >
                  Zaloguj
                </button>
              </div>
              <div>
                {/* alternatywny przycisk logowania CAS – np. uczelniany system */}
                <a
                  href="https://logowanie.euczelnia.ug.edu.pl/login"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#ff9900] hover:bg-[#e68a00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002147]"
                >
                  Zaloguj przy użyciu CAS
                </a>
              </div>
            </div>
          </form>

          {/* dolne linki – zapomniane hasło i rejestracja */}
          <div className="flex items-center justify-between text-sm">
            <a href="#" className="font-medium text-[#002147] hover:text-[#001a3e]">
              Zapomniałem hasła
            </a>
            <a
              href="/register"
              className="font-medium text-[#002147] hover:text-[#001a3e]"
            >
              Pierwszy raz? Zarejestruj się
            </a>
          </div>
        </div>
      </div>

      {/* prawa kolumna – obrazek tła */}
      <div className="hidden md:flex w-1/2 relative">
        <Image
          src="/img/wzr1.jpg"
          alt="Panorama kampusu UG"
          fill
          className="object-cover" // obraz ma wypełnić cały kontener
        />
        {/* przyciemnienie obrazu – lepszy kontrast */}
        <div className="absolute inset-0 bg-[#002147] opacity-75"></div>
      </div>
    </div>
  );
}
