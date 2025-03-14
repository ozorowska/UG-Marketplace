import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

export const runtime = "nodejs";
// (opcjonalnie: export const dynamic = "force-dynamic"; 
//  jeśli zdarzy się błąd 'res.getHeader is not a function')

const prisma = new PrismaClient();

// GET /api/favorites
// Zwraca listę ulubionych ofert zalogowanego użytkownika
export async function GET(request) {
  try {
    // Odczytujemy sesję z NextAuth
    const session = await getServerSession();

    // Sprawdzamy, czy user jest zalogowany (patrzymy na email)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Znajdujemy w bazie usera po mailu
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        favorites: {
          include: { tags: true, user: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    // Zwracamy listę ulubionych ofert
    return NextResponse.json(user.favorites, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/favorites:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST /api/favorites
// Dodaje ofertę do ulubionych zalogowanego użytkownika
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Odczytujemy JSON z requestu
    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: "Brak offerId w body żądania" },
        { status: 400 }
      );
    }

    // Znajdujemy usera po mailu
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika w bazie" },
        { status: 404 }
      );
    }

    // Znajdujemy ofertę
    const existingOffer = await prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!existingOffer) {
      return NextResponse.json({ error: "Nie ma takiej oferty" }, { status: 404 });
    }

    // Dodajemy do ulubionych (relacja many-to-many)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        favorites: {
          connect: { id: offerId },
        },
      },
    });

    return NextResponse.json({ message: "Dodano do ulubionych" }, { status: 200 });
  } catch (error) {
    console.error("Błąd w POST /api/favorites:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// DELETE /api/favorites
// Usuwa ofertę z ulubionych zalogowanego użytkownika
export async function DELETE(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: "Brak offerId w body żądania" },
        { status: 400 }
      );
    }

    // Znajdujemy usera
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika w bazie" },
        { status: 404 }
      );
    }

    // Usuwamy z ulubionych (disconnect)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        favorites: {
          disconnect: { id: offerId },
        },
      },
    });

    return NextResponse.json({ message: "Usunięto z ulubionych" }, { status: 200 });
  } catch (error) {
    console.error("Błąd w DELETE /api/favorites:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
