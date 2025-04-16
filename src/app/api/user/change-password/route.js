import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";

export const runtime = "nodejs";
const prisma = new PrismaClient();

// POST /api/user/change-password
// Zmiana hasła zalogowanego użytkownika
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Brakuje aktualnego lub nowego hasła" 
      }, { status: 400 });
    }

    // Sprawdzenie minimalnej długości nowego hasła
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "Nowe hasło musi mieć co najmniej 6 znaków" 
      }, { status: 400 });
    }

    // Pobierz aktualne hasło użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { hashedPassword: true }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Nie znaleziono użytkownika" 
      }, { status: 404 });
    }

    // Sprawdź czy aktualne hasło jest poprawne
    const isPasswordValid = await compare(currentPassword, user.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: "Aktualne hasło jest nieprawidłowe" 
      }, { status: 400 });
    }

    // Haszowanie nowego hasła
    const hashedPassword = await hash(newPassword, 12);

    // Aktualizacja hasła w bazie danych
    await prisma.user.update({
      where: { email: session.user.email },
      data: { hashedPassword }
    });

    return NextResponse.json({ 
      message: "Hasło zostało zmienione pomyślnie" 
    }, { status: 200 });
  } catch (error) {
    console.error("Błąd w POST /api/user/change-password:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}