import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// pobierz szczegóły pojedynczej konwersacji
export async function GET(
  _req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId } = params;

  if (!conversationId) {
    return NextResponse.json({ error: "Brak conversationId" }, { status: 400 });
  }

  try {
    // znajdź konwersację po ID, razem z ofertą i użytkownikami
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        offer: {
          select: {
            id: true,
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
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Nie znaleziono konwersacji" }, { status: 404 });
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
