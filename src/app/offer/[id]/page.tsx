"use client"

import React from "react"

export default function AdPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Test przekierowania</h1>
      <p>ID oferty: {params.id}</p>
      <button onClick={() => window.history.back()}>Powrót</button>
    </div>
  )
}

