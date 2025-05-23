import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"; // globalna instancja prisma

// pobiera konwersacje dla zalogowanego użytkownika
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(); // pobiera sesję użytkownika z next-auth

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 }); // brak sesji lub e-maila
    }

    // znajdź użytkownika po emailu z sesji
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Brak użytkownika" }, { status: 404 });
    }

    // pobierz wszystkie konwersacje, w których user jest kupującym lub sprzedającym
    const convs = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        offer: {
          select: {
            title: true,
            imageUrl: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" }, // najnowsze pierwsze
          where: {
            read: false,
            NOT: { senderId: user.id }, // tylko nieprzeczytane od innych
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(convs, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// tworzy nową konwersację między userem a właścicielem oferty
export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.email) {
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

    // pobierz ofertę i jej właściciela
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { user: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta nie istnieje" }, { status: 404 });
    }

    // nie pozwól użytkownikowi pisać do siebie samego
    if (offer.userId === user.id) {
      return NextResponse.json({ error: "Nie można wysłać wiadomości do samego siebie" }, { status: 400 });
    }

    // sprawdź, czy taka konwersacja już istnieje
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

    // utwórz nową konwersację
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
