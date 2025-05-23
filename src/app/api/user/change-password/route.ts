import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// POST /api/user/change-password – zmiana hasła użytkownika
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // odczyt danych z requesta
    const body = await request.json() as {
      currentPassword: string;
      newPassword: string;
    };

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Brakuje aktualnego lub nowego hasła" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Nowe hasło musi mieć co najmniej 6 znaków" },
        { status: 400 }
      );
    }

    // pobranie użytkownika z bazy
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { hashedPassword: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    // sprawdzenie poprawności aktualnego hasła
    const isPasswordValid = await compare(currentPassword, user.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Aktualne hasło jest nieprawidłowe" },
        { status: 400 }
      );
    }

    // haszowanie nowego hasła
    const hashedPassword = await hash(newPassword, 12);

    // zapis w bazie
    await prisma.user.update({
      where: { email: session.user.email },
      data: { hashedPassword },
    });

    return NextResponse.json(
      { message: "Hasło zostało zmienione pomyślnie" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd w POST /api/user/change-password:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
