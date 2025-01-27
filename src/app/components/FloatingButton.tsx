"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";

export default function FloatingButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/offer/new")}
      className="fixed bottom-8 right-8 bg-[#002d73] text-white w-16 h-16 rounded-full flex items-center 
      justify-center shadow-lg hover:bg-[#001a4f] transition-transform transform hover:scale-110"
    >
      <FaPlus className="text-2xl" />
    </button>
  );
}
