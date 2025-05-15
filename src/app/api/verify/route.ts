// app/api/verify/route.ts
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Brak tokena" }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) {
    return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null
    }
  })

  return NextResponse.json({ success: true })
}
