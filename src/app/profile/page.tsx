"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";

export default function FavoritesPage() {
  return (
    <>
      <TopNavbar />

      <SidebarLayout>
        <div className="flex items-center justify-center h-full">
          <h1 className="text-2xl font-semibold text-gray-700">
            Strona w budowie
          </h1>
        </div>
      </SidebarLayout>
    </>
  );
}
