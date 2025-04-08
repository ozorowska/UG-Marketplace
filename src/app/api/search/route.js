import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    if (!q || q.trim() === "") {
      return NextResponse.json([], { status: 200 });
    }

    // Przeszukujemy tylko title i description
    const offers = await prisma.offer.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } }
        ],
      },
      include: {
        tags: true,
        user: true, // pobieramy dane użytkownika – category jest enum, więc nie trzeba dołączać
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(offers, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/search:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
