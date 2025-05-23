import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"; // korzystamy z globalnej instancji Prisma

export const runtime = "nodejs";

// typowanie danych wejściowych
type OfferIdPayload = {
  offerId: string;
};

// GET /api/favorites
// zwraca listę ulubionych ofert zalogowanego użytkownika
export async function GET() {
  try {
    // pobranie sesji użytkownika
    const session = await getServerSession();

    // sprawdzenie autoryzacji
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // pobranie użytkownika z bazy wraz z ulubionymi ofertami
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        favorites: {
          include: { tags: true, user: true },
        },
      },
    });

    // jeśli użytkownik nie istnieje
    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    }

    // zwrócenie listy ulubionych
    return NextResponse.json(user.favorites, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/favorites:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST /api/favorites
// dodaje ofertę do ulubionych
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // odczytanie offerId z ciała żądania
    const { offerId }: OfferIdPayload = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: "Brak offerId w body żądania" }, { status: 400 });
    }

    // pobranie użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika w bazie" }, { status: 404 });
    }

    // sprawdzenie czy oferta istnieje
    const existingOffer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer) {
      return NextResponse.json({ error: "Nie ma takiej oferty" }, { status: 404 });
    }

    // dodanie oferty do ulubionych
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
// usuwa ofertę z ulubionych
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // odczytanie offerId z ciała żądania
    const { offerId }: OfferIdPayload = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: "Brak offerId w body żądania" }, { status: 400 });
    }

    // pobranie użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika w bazie" }, { status: 404 });
    }

    // usunięcie z ulubionych
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
