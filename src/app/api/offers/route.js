/*import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const uploadDir = "./public/uploads"; // Ścieżka do folderu, w którym będą zapisywane obrazy

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      include: { user: true, tags: true }, // Pobiera dane użytkownika i tagów
    });
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Błąd w metodzie GET:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Tworzymy katalog na obrazy, jeśli nie istnieje
    await fs.mkdir(uploadDir, { recursive: true });

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const price = parseFloat(formData.get("price"));
    const tags = formData.get("tags")?.split(",").map((tag) => tag.trim());
    const major = formData.get("major");
    const userId = formData.get("userId");
    const image = formData.get("image");

    // Walidacja danych
    if (!title || !description || isNaN(price) || !tags || !major || !userId) {
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

    // Tworzenie tagów (jeśli nie istnieją) i pobieranie ich ID
    const tagRecords = await Promise.all(
      tags.map(async (tag) => {
        const existingTag = await prisma.tag.findUnique({ where: { name: tag } });
        if (existingTag) return existingTag;
        return prisma.tag.create({ data: { name: tag } });
      })
    );

    // Tworzenie nowej oferty
    const newOffer = await prisma.offer.create({
      data: {
        title,
        description,
        price,
        major,
        imageUrl, // Zapisujemy URL obrazu
        user: { connect: { id: userId } },
        tags: { connect: tagRecords.map((tag) => ({ id: tag.id })) }, // Łączymy ofertę z tagami
      },
    });

    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    console.error("Błąd w metodzie POST:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
*/

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const uploadDir = "./public/uploads";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Pobranie ID użytkownika z parametrów

    const offers = await prisma.offer.findMany({
      where: userId ? { userId } : {}, // Filtrujemy po userId, jeśli zostało przekazane
      include: { user: true, tags: true }, // Pobieramy użytkownika i tagi
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Błąd w metodzie GET:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await fs.mkdir(uploadDir, { recursive: true });

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const price = parseFloat(formData.get("price"));
    const tags = formData.get("tags")?.split(",").map((tag) => tag.trim());
    const major = formData.get("major");
    const userId = formData.get("userId");
    const image = formData.get("image");

    if (!title || !description || isNaN(price) || !tags || !major || !userId) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika z podanym ID" },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (image && image instanceof File) {
      const fileName = `${Date.now()}-${image.name}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/${fileName}`;
    }

    const tagRecords = await Promise.all(
      tags.map(async (tag) => {
        const existingTag = await prisma.tag.findUnique({ where: { name: tag } });
        if (existingTag) return existingTag;
        return prisma.tag.create({ data: { name: tag } });
      })
    );

    const newOffer = await prisma.offer.create({
      data: {
        title,
        description,
        price,
        major,
        imageUrl,
        user: { connect: { id: userId } },
        tags: { connect: tagRecords.map((tag) => ({ id: tag.id })) },
      },
    });

    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    console.error("Błąd w metodzie POST:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get("id");

    if (!offerId) {
      return NextResponse.json(
        { error: "Brak ID oferty w zapytaniu" },
        { status: 400 }
      );
    }

    await prisma.offer.delete({
      where: { id: offerId },
    });

    return NextResponse.json({ message: "Oferta została usunięta" });
  } catch (error) {
    console.error("Błąd w metodzie DELETE:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
