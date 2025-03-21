import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

// GET -> pobiera konwersacje dla zalogowanego usera (tak jak w Favorites - email)
export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Znajdź usera (kupującego lub sprzedającego) po email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Brak użytkownika" }, { status: 404 });
    }

    // Pobierz listę konwersacji, gdzie user jest buyerem lub sellerem
    const convs = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        offer: { select: { title: true, imageUrl: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(convs, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST -> tworzy (lub zwraca istniejącą) konwersację z oferty i zalogowanego usera
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // 1. Z requestu otrzymujemy tylko 'offerId'
    const { offerId } = await request.json();
    if (!offerId) {
      return NextResponse.json(
        { error: "Brak offerId w body żądania" },
        { status: 400 }
      );
    }

    // 2. Znajdźmy w bazie obecnie zalogowanego usera
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: "Brak użytkownika w bazie" }, { status: 404 });
    }

    // 3. Znajdź ofertę razem z informacją o sprzedawcy
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { user: true }, // user = sprzedawca
    });
    if (!offer) {
      return NextResponse.json({ error: "Brak takiej oferty" }, { status: 404 });
    }

    // 4. seller to autor oferty
    const sellerId = offer.user.id; // z relacji 'user' w modelu Offer

    // 5. Sprawdź, czy taka konwersacja już istnieje
    const existing = await prisma.conversation.findFirst({
      where: {
        offerId: offer.id,
        buyerId: buyer.id,
        sellerId,
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // 6. Jeśli nie istnieje, utwórz nową
    const newConv = await prisma.conversation.create({
      data: {
        offerId: offer.id,
        buyerId: buyer.id,
        sellerId: sellerId,
      },
    });

    return NextResponse.json(newConv, { status: 201 });
  } catch (error) {
    console.error("Błąd tworzenia konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
