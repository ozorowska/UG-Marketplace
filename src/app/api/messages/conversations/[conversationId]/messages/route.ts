import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

// pobierz wszystkie wiadomości z danej konwersacji
export async function GET(
  _req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId } = params;

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }, // wiadomości od najstarszej
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania wiadomości:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// dodaj nową wiadomość do konwersacji i wyślij ją przez Pushera
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId } = params;

  try {
    const { text, senderId } = await req.json();

    if (!text || !senderId) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    // utwórz nową wiadomość w bazie
    const newMessage = await prisma.message.create({
      data: { text, senderId, conversationId },
    });

    // trigger Pushera – dla odbiorcy (czat)
    await pusher.trigger(`conversation-${conversationId}`, "new-message", {
      message: newMessage,
      sender: senderId,
      conversationId,
    });

    // trigger globalny – do sidebarów, powiadomień itd.
    await pusher.trigger("global-messages", "new-message", {
      conversationId,
    });

    return NextResponse.json(newMessage, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas tworzenia wiadomości:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
