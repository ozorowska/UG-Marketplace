import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()

    // Sprawdź domenę
    if (!email.endsWith("@studms.ug.edu.pl")) {
      return NextResponse.json(
        { error: "Email musi kończyć się na @studms.ug.edu.pl" },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: "Imię jest wymagane" },
        { status: 400 }
      )
    }

    // Czy user już istnieje?
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "Taki użytkownik już istnieje." },
        { status: 400 }
      )
    }

    // Haszujemy hasło
    const hashedPassword = await hash(password, 10)

    // Tworzymy w bazie
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Błąd w /api/register:", error)
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    )
  }
}
