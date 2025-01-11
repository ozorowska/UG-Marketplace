import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

// Pobiera wszystkie oferty
export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      include: { user: true }, // Pobiera dane użytkownika
    })
    return NextResponse.json(offers)
  } catch (error) {
    console.error("Błąd w metodzie GET:", error)
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 })
  }
}


// Tworzy nową ofertę
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, description, price, category, major, userId } = body

    // Walidacja danych
    if (!title || !description || !price || !category || !major || !userId) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      )
    }

    // Sprawdzenie, czy użytkownik istnieje
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userExists) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika z podanym ID" },
        { status: 400 }
      )
    }

    // Tworzenie nowej oferty
    const newOffer = await prisma.offer.create({
      data: {
        title,
        description,
        price,
        category,
        major,
        user: { connect: { id: userId } },
      },
    })

    return NextResponse.json(newOffer, { status: 201 })
  } catch (error) {
    console.error("Błąd w metodzie POST:", error)
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 })
  }
}
