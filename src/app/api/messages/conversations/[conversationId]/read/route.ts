import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

// oznacz wiadomości jako przeczytane w ramach danej konwersacji
export async function POST(
  _req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId } = params;

  try {
    // znajdź wszystkie nieprzeczytane wiadomości z tej konwersacji
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        read: false,
      },
    });

    const ids = unreadMessages.map((m) => m.id); // wyciągamy ID wiadomości

    if (ids.length === 0) {
      return NextResponse.json({ updated: 0 }); // nic do aktualizacji
    }

    // aktualizuj wiadomości w bazie jako przeczytane
    await prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    });

    // wyślij event Pushera o przeczytaniu wiadomości
    await pusher.trigger(`conversation-${conversationId}`, "message-read", {
      messageIds: ids,
    });

    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    console.error("Błąd przy oznaczaniu wiadomości jako przeczytanych:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
