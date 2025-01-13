import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = params; // Pobieramy id z parametrów URL
    console.log("Fetching offer with ID:", id);

    // Znalezienie ogłoszenia po ID
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        user: true, // Dołączenie danych użytkownika (jeśli potrzebne)
      },
    });

    // Jeśli ogłoszenie nie istnieje
    if (!offer) {
      return NextResponse.json({ error: "Ogłoszenie nie zostało znalezione" }, { status: 404 });
    }

    // Zwrócenie szczegółów ogłoszenia
    return NextResponse.json(offer, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas pobierania szczegółów ogłoszenia:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
