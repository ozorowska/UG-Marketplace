"use client" 
// Mówimy Next.js, że to komponent kliencki (możemy używać hooków, itp.)

import { SessionProvider } from "next-auth/react"
import React from "react"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
