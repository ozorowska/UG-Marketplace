import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// DELETE /api/user/delete – usuwanie konta
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // pobranie użytkownika w celu usunięcia zdjęcia
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    // usunięcie zdjęcia z dysku, jeśli istnieje
    if (user.image) {
      try {
        const imagePath = path.join(process.cwd(), "public", user.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error("Błąd podczas usuwania zdjęcia profilowego:", error);
      }
    }

    // usunięcie użytkownika z bazy
    await prisma.user.delete({
      where: { email: session.user.email },
    });

    return NextResponse.json(
      { message: "Konto zostało usunięte pomyślnie" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd w DELETE /api/user/delete:", error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
