import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import fs from "fs/promises";
import path from "path";

const uploadDir = "./public/uploads";

// obsługa zapytań GET 
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url); 
    const userId = searchParams.get("userId"); 

    // pobranie ofert z bazy, opcjonalnie filtrowanie po userId
    const offers = await prisma.offer.findMany({
      where: userId ? { userId } : {}, 
      include: { user: true, tags: true }, 
    });

    return NextResponse.json(offers); 
  } catch (error) {
    console.error("Błąd w metodzie GET:", error); 
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 }); 
  }
}

// obsługa zapytań POST 
export async function POST(request: NextRequest) {
  try {
    await fs.mkdir(uploadDir, { recursive: true }); 

    const formData = await request.formData(); // pobieramy dane z formularza
    const title = formData.get("title")?.toString(); // tytuł oferty
    const description = formData.get("description")?.toString(); // opis oferty
    const price = parseFloat(formData.get("price") as string); // cena (konwersja z tekstu)
    const tags = formData.get("tags")?.toString().split(",").map((tag) => tag.trim()); // tagi jako lista
    const major = formData.get("major")?.toString(); // kierunek studiów
    const userId = formData.get("userId")?.toString(); // id użytkownika
    const image = formData.get("image") as File | null; // plik graficzny (jeśli jest)
    const department = formData.get("department")?.toString(); // wydział
    const category = formData.get("category")?.toString() as any; // kategoria (np. KSIAZKI)

    // walidacja wymaganych pól
    if (!title || !description || isNaN(price) || !tags || !major || !userId || !department || !category) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    // sprawdzenie czy użytkownik istnieje
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika z podanym ID" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null; // zmienna na link do pliku

    
    if (image && image instanceof File) {
      const fileName = `${Date.now()}-${image.name}`; // unikalna nazwa pliku
      const filePath = path.join(uploadDir, fileName); // ścieżka do zapisu

      const buffer = Buffer.from(await image.arrayBuffer()); // konwersja pliku do bufora
      await fs.writeFile(filePath, buffer); // zapis pliku na dysku

      imageUrl = `/uploads/${fileName}`; // ścieżka do obrazu, którą zapiszemy w bazie
    }

    // tworzenie lub pobieranie tagów
    const tagRecords = await Promise.all(
      tags.map(async (tag) => {
        const existingTag = await prisma.tag.findUnique({ where: { name: tag } }); // sprawdzamy czy tag już istnieje
        if (existingTag) return existingTag; // jeśli tak, zwracamy go
        return prisma.tag.create({ data: { name: tag } }); // jeśli nie, tworzymy nowy
      })
    );

    // tworzenie nowej oferty w bazie
    const newOffer = await prisma.offer.create({
      data: {
        title,
        description,
        price,
        major,
        department,
        category,
        imageUrl,
        user: { connect: { id: userId } }, // powiązanie z użytkownikiem
        tags: { connect: tagRecords.map((tag) => ({ id: tag.id })) }, // powiązanie z tagami
      },
    });

    return NextResponse.json(newOffer, { status: 201 }); // zwracamy nową ofertę z kodem 201
  } catch (error) {
    console.error("Błąd w metodzie POST:", error); // log błędu
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 }); // zwracamy błąd 500
  }
}