import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email"; // ← Upewnij się, że masz ten plik!

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email.endsWith("@studms.ug.edu.pl")) {
      return NextResponse.json(
        { error: "Email musi kończyć się na @studms.ug.edu.pl" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Imię jest wymagane" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Taki użytkownik już istnieje." },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        emailVerified: false,
        verificationToken,
      },
    });

    const verifyLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken}`;
    console.log("📧 Rejestracja przebiegła, wysyłam maila do:", email);
    console.log("🔗 Link aktywacyjny:", verifyLink);

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "Utworzono konto. Sprawdź maila i potwierdź swój adres.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Błąd w /api/register:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
