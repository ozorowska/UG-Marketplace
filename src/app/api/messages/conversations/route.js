import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

// GET -> pobiera konwersacje dla zalogowanego usera
export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Znajdź usera po email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Brak użytkownika" }, { status: 404 });
    }

    // Pobierz konwersacje, gdzie user jest buyerem lub sellerem
    const convs = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        offer: { select: { title: true, imageUrl: true } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, where: { read: false } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(convs, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST -> rozpocznij nową konwersację
export async function POST(request) {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
  }

  const { offerId } = await request.json();

  if (!offerId) {
    return NextResponse.json({ error: "Brak offerId" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie znaleziony" }, { status: 404 });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { user: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta nie istnieje" }, { status: 404 });
    }

    // Zapobiegamy tworzeniu konwersacji z samym sobą
    if (offer.userId === user.id) {
      return NextResponse.json({ error: "Nie można wysłać wiadomości do samego siebie" }, { status: 400 });
    }

    // Sprawdź, czy już istnieje taka konwersacja
    const existing = await prisma.conversation.findFirst({
      where: {
        offerId: offer.id,
        buyerId: user.id,
        sellerId: offer.userId,
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Utwórz nową konwersację
    const conversation = await prisma.conversation.create({
      data: {
        offerId: offer.id,
        buyerId: user.id,
        sellerId: offer.userId,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Błąd tworzenia konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
