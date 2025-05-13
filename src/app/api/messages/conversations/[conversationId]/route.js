import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  const url = new URL(request.url);
  const conversationId = url.pathname.split("/").pop(); // Wyciągamy ID z URL-a

  if (!conversationId) {
    return NextResponse.json({ error: "Brak conversationId" }, { status: 400 });
  }

  try {
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

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Błąd podczas pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}