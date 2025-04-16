import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import fs from 'fs';
import path from 'path';

export const runtime = "nodejs";
const prisma = new PrismaClient();

// DELETE /api/user/delete
// Usuwanie konta użytkownika
export async function DELETE(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Pobierz użytkownika, aby uzyskać jego zdjęcie profilowe (jeśli istnieje)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, image: true }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Nie znaleziono użytkownika" 
      }, { status: 404 });
    }

    // Usunięcie zdjęcia profilowego z serwera (jeśli istnieje)
    if (user.image) {
      try {
        const imagePath = path.join(process.cwd(), 'public', user.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error("Błąd podczas usuwania zdjęcia profilowego:", error);
      }
    }

    // Usunięcie użytkownika z bazy danych
    // Prisma obsłuży kaskadowe usuwanie powiązanych rekordów
    await prisma.user.delete({
      where: { email: session.user.email }
    });

    return NextResponse.json({ 
      message: "Konto zostało usunięte pomyślnie" 
    }, { status: 200 });
  } catch (error) {
    console.error("Błąd w DELETE /api/user/delete:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}