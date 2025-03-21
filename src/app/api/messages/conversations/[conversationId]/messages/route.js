import { PrismaClient } from "@prisma/client";
import Pusher from "pusher";

const prisma = new PrismaClient();
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// GET → pobierz wszystkie wiadomości w konwersacji
export async function GET(req, { params }) {
  const { conversationId } = params;
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return new Response(JSON.stringify(messages), { status: 200 });
}

// POST → wyślij nową wiadomość
export async function POST(req, { params }) {
  const { conversationId } = params;
  const { text, senderId } = await req.json();
  if (!text || !senderId) return new Response("Brak danych", { status: 400 });

  try {
    const newMessage = await prisma.message.create({
      data: { text, senderId, conversationId },
    });

    // Trigger w Pusherze
    await pusher.trigger(`conversation-${conversationId}`, "new-message", {
      message: newMessage,
      sender: senderId,
      conversationId,
    });

    return new Response(JSON.stringify(newMessage), { status: 200 });
  } catch (error) {
    console.error("Błąd podczas tworzenia wiadomości:", error);
    return new Response(JSON.stringify({ message: "Błąd serwera" }), { status: 500 });
  }
}
