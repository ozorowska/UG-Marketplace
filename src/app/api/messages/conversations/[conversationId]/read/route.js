import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Pusher from "pusher";

const prisma = new PrismaClient();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// POST → oznacz wiadomości jako przeczytane
export async function POST(req, { params }) {
  const { conversationId } = params;

  try {
    // znajdź nieprzeczytane wiadomości z tej rozmowy
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        read: false,
      },
    });

    const ids = unreadMessages.map((m) => m.id);

    if (ids.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // oznacz jako przeczytane w bazie
    await prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    });

    // wyślij do Pushera event o przeczytaniu
    await pusher.trigger(`conversation-${conversationId}`, "message-read", {
      messageIds: ids,
    });

    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    console.error("Błąd przy oznaczaniu wiadomości jako przeczytanych:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
