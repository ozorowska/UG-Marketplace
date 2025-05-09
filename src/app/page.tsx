"use client";

import React from "react";

export default function HomePage() {
  return (
    <main
      className="
        min-h-screen
        relative
        flex
        items-center
        justify-center
        bg-fixed
        bg-center
        bg-cover
      "
      style={{
        backgroundImage: 'url("/img/wzr1.jpg")',
      }}
    >
      {/* Półprzezroczysta nakładka w kolorze granatowym */}
      <div className="absolute inset-0 bg-[#002147] opacity-50"></div>

      {/* Szklany panel w centrum */}
      <div
        className="
          relative
          z-10
          bg-white
          bg-opacity-20
          backdrop-blur-md
          p-8
          rounded-2xl
          shadow-lg
          text-center
          max-w-lg
          animate-fadeIn
        "
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Witaj w UG Marketplace!
        </h1>
        <p className="text-white mb-8">
          Platforma ogłoszeniowa Uniwersytetu Gdańskiego.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <a
            href="/login"
            className="
              w-64
              text-center
              bg-[#002147]
              hover:bg-[#001a3e]
              text-white
              font-semibold
              py-2
              px-4
              rounded
              transition
              duration-200
            "
          >
            Zaloguj się
          </a>
          <a
            href="https://logowanie.euczelnia.ug.edu.pl/login"
            className="
              w-64
              text-center
              bg-[#ff9900]
              hover:bg-[#e68a00]
              text-white
              font-semibold
              py-2
              px-4
              rounded
              transition
              duration-200
            "
          >
            Zaloguj przy użyciu CAS
          </a>
        </div>
      </div>
    </main>
  );
}
