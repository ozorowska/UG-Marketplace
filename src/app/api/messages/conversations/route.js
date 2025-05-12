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
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(convs, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania konwersacji:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
