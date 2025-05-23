import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const prisma = new PrismaClient();

// typ danych przesyłanych z formularza rejestracji
interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: Request) {
  try {
    const { email, password, name }: RegisterPayload = await request.json(); // odczytanie danych z żądania

    // walidacja domeny UG
    if (!email.endsWith("@studms.ug.edu.pl")) {
      return NextResponse.json(
        { error: "Email musi kończyć się na @studms.ug.edu.pl" },
        { status: 400 }
      );
    }

    // walidacja imienia
    if (!name) {
      return NextResponse.json({ error: "Imię jest wymagane" }, { status: 400 });
    }

    // sprawdzenie czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Taki użytkownik już istnieje." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10); // haszowanie hasła
    const verificationToken = crypto.randomBytes(32).toString("hex"); // generowanie tokenu

    // utworzenie nowego użytkownika
    await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        emailVerified: false,
        verificationToken,
      },
    });

    // wysłanie e-maila weryfikacyjnego
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { message: "Utworzono konto. Sprawdź maila i potwierdź swój adres." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Błąd w /api/register:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
