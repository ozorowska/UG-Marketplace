
"use client";

import React from "react";
import { FaPlus } from "react-icons/fa";

type Props = {
  onClick: () => void;
};

export default function FloatingButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-[#002d73] text-white w-16 h-16 rounded-full flex items-center 
                 justify-center shadow-lg hover:bg-[#001a4f] transition-transform transform hover:scale-110"
    >
      <FaPlus className="text-2xl" />
    </button>
  );
}

