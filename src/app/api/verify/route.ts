// importujemy PrismaClient – potrzebny do kontaktu z bazą danych
import { PrismaClient } from "@prisma/client";

// importujemy NextResponse – służy do zwracania odpowiedzi HTTP z API
import { NextResponse } from "next/server";

// tworzymy instancję klienta bazy danych
const prisma = new PrismaClient();

// obsługa zapytania GET – weryfikacja konta użytkownika przez link z e-maila
export async function GET(request: Request) {
  // wyciągamy parametry z adresu URL (np. ?token=abcd)
  const { searchParams } = new URL(request.url);

  // pobieramy wartość parametru "token"
  const token = searchParams.get("token");

  // jeśli nie ma tokena – zwracamy błąd
  if (!token) {
    return NextResponse.json({ error: "Brak tokena" }, { status: 400 });
  }

  // szukamy użytkownika w bazie po tym tokenie
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  // jeśli nie ma takiego tokena – zwracamy błąd
  if (!user) {
    return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 400 });
  }

  // aktualizujemy użytkownika: oznaczamy email jako potwierdzony, usuwamy token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });

  // zwracamy sukces – konto zostało aktywowane
  return NextResponse.json({ success: true });
}
