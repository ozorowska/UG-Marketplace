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

export async function POST(req) {
  try {
    const body = await req.json();
    // Oczekujemy, że klient prześle: text, sender (ID nadawcy) oraz recipient (ID rozmówcy)
    const { text, sender, recipient } = body;

    if (!text || !sender || !recipient) {
      return new Response(JSON.stringify({ message: "Brak wymaganych danych" }), { status: 400 });
    }

    // Zapisz wiadomość do bazy
    const newMessage = await prisma.message.create({
      data: {
        text,
        sender: { connect: { id: sender } },
      },
    });

    // Wywołaj zdarzenie Pusher – używamy kanału "chat" i eventu "new-message"
    await pusher.trigger("chat", "new-message", {
      message: newMessage,
      sender,
      recipient,
    });

    return new Response(JSON.stringify({ message: "Wiadomość wysłana", data: newMessage }), { status: 200 });
  } catch (error) {
    console.error("Błąd wysyłania wiadomości:", error);
    return new Response(JSON.stringify({ message: "Wewnętrzny błąd serwera" }), { status: 500 });
  }
}
