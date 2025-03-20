import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  // Pobieramy parametry zapytania z URL
  const { searchParams } = new URL(req.url);
  const senderId = searchParams.get("senderId");
  const recipientId = searchParams.get("recipientId");

  if (!senderId || !recipientId) {
    return new Response(
      JSON.stringify({ message: "Brak wymaganych parametrów" }),
      { status: 400 }
    );
  }

  try {
    // Pobieramy wiadomości między dwoma użytkownikami.
    // Uproszczony przykład – pobieramy wszystkie wiadomości, których senderId to jeden z tych identyfikatorów.
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId }, { senderId: recipientId }],
      },
      orderBy: { createdAt: "asc" },
    });

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania rozmowy:", error);
    return new Response(
      JSON.stringify({ message: "Wewnętrzny błąd serwera" }),
      { status: 500 }
    );
  }
}
