"use client";

import React, { useState, useEffect, FormEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function RegisterPage(): JSX.Element {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Coś poszło nie tak");
        return;
      }

      alert("Konto utworzone poprawnie! Zaloguj się.");
      router.push("/login");
    } catch (err) {
      setError("Błąd połączenia z serwerem");
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lewa kolumna – formularz rejestracji */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[#002147] mb-2">
              UG Marketplace
            </h2>
            <h3 className="text-2xl font-bold text-gray-900">Zarejestruj się</h3>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">
                  Imię
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                  placeholder="Twoje imię"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                  placeholder="np. anna.kowalska@studms.ug.edu.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Hasło
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                  placeholder="Twoje hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#002147] hover:bg-[#001a3e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002147]"
              >
                Zarejestruj
              </button>
            </div>
          </form>
          <div className="flex items-center justify-center text-sm">
            <a
              href="/login"
              className="font-medium text-[#002147] hover:text-[#001a3e]"
            >
              Masz już konto? Zaloguj się
            </a>
          </div>
        </div>
      </div>

      {/* Prawa kolumna – zdjęcie */}
      <div className="hidden md:flex w-1/2 relative">
        <Image
          src="/img/wzr1.jpg"
          alt="Panorama kampusu UG"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#002147] opacity-75"></div>
      </div>
    </div>
  );
}
