import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";

    if (!q.trim()) {
      return NextResponse.json([], { status: 200 });
    }

    // Pobierz wszystkie oferty z tagami i użytkownikiem
    const offers = await prisma.offer.findMany({
      include: {
        tags: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filtrowanie po stronie aplikacji
    const filtered = offers.filter((offer) => {
      const titleMatch = offer.title.toLowerCase().includes(q);
      const descMatch = offer.description.toLowerCase().includes(q);
      const tagMatch = offer.tags.some(tag => tag.name.toLowerCase().includes(q));
      return titleMatch || descMatch || tagMatch;
    });

    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/search:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

