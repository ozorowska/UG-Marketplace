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
          rounded
          shadow
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
        <a
          href="/login"
          className="
            inline-block
            bg-[#002147]
            hover:bg-[#001a3e]
            text-white
            font-semibold
            py-2
            px-4
            rounded
          "
        >
          Zaloguj się
        </a>
      </div>
    </main>
  );
}
