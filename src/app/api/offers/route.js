import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const uploadDir = "./public/uploads"; // Ścieżka do folderu, w którym będą zapisywane obrazy

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      include: { user: true }, // Pobiera dane użytkownika
    });
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Błąd w metodzie GET:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Sprawdź, czy katalog na obrazy istnieje, jeśli nie, utwórz go
    await fs.mkdir(uploadDir, { recursive: true });

    const formData = await request.formData(); // Pobieranie danych jako FormData
    const title = formData.get("title");
    const description = formData.get("description");
    const price = parseFloat(formData.get("price"));
    const category = formData.get("category");
    const major = formData.get("major");
    const userId = formData.get("userId");
    const image = formData.get("image");

    // Walidacja danych
    if (!title || !description || isNaN(price) || !category || !major || !userId) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    // Sprawdzenie, czy użytkownik istnieje
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika z podanym ID" },
        { status: 400 }
      );
    }

    // Obsługa przesyłania obrazu
    let imageUrl = null;
    if (image && image instanceof File) {
      const fileName = `${Date.now()}-${image.name}`;
      const filePath = path.join(uploadDir, fileName);

      // Zapis obrazu na serwerze
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/${fileName}`; // Ścieżka URL obrazu
    }

    // Tworzenie nowej oferty
    const newOffer = await prisma.offer.create({
      data: {
        title,
        description,
        price,
        category,
        major,
        imageUrl, // Zapisujemy URL obrazu
        user: { connect: { id: userId } },
      },
    });

    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    console.error("Błąd w metodzie POST:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
