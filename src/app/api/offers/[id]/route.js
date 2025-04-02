import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const uploadDir = "./public/uploads";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { user: true, tags: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta nie została znaleziona" }, { status: 404 });
    }

    return NextResponse.json(offer, { status: 200 });
  } catch (error) {
    console.error("Błąd w metodzie GET:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { params } = context;
    if (!params || !params.id) {
      return NextResponse.json({ error: "Brak ID oferty w zapytaniu" }, { status: 400 });
    }

    const id = String(params.id);
    const formData = await request.formData();

    // Pobieramy dane z formData
    const title = formData.get("title") || null;
    const description = formData.get("description") || null;
    const price = formData.get("price") ? parseFloat(formData.get("price")) : null;
    const major = formData.get("major") || null;
    const department = formData.get("department") || null;  // może być puste
    const category = formData.get("category") || null;      // np. "KSIAZKI", "NOTATKI", "INNE"
    const image = formData.get("image") || null;

    const tagsFromForm = formData.get("tags")?.split(",").map((tag) => tag.trim()) || [];
    let imageUrl = formData.get("imageUrl") || null;

    console.log("📌 Przychodzące dane:", {
      title, description, price, major, department, category, image, imageUrl, tagsFromForm
    });

    // Zmieniamy walidację tak, by nie wymagała zawsze department
    if (!title || !description || isNaN(price) || !major || !category) {
      return NextResponse.json({
        error: "Wszystkie pola (title, description, price, major, category) są wymagane"
      }, { status: 400 });
    }

    const existingOffer = await prisma.offer.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingOffer) {
      return NextResponse.json({ error: "Oferta nie istnieje" }, { status: 404 });
    }

    // Obsługa nowego zdjęcia
    if (image && image instanceof File) {
      await fs.mkdir(uploadDir, { recursive: true });
      const fileName = `${Date.now()}-${image.name}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    } else {
      // Jeśli nie wysyłano nowego zdjęcia, zachowaj poprzednie
      imageUrl = existingOffer.imageUrl;
    }

    // Obsługa tagów – aktualizacja tagów w bazie
    const currentTags = existingOffer.tags.map((tag) => tag.name);
    const tagsToAdd = tagsFromForm.filter((tag) => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter((tag) => !tagsFromForm.includes(tag));

    console.log("➕ Dodajemy tagi:", tagsToAdd);
    console.log("➖ Usuwamy tagi:", tagsToRemove);

    // Dodawanie nowych tagów, jeśli nie istnieją
    const newTags = await Promise.all(
      tagsToAdd.map(async (tag) => {
        let existingTag = await prisma.tag.findUnique({ where: { name: tag } });
        if (!existingTag) {
          existingTag = await prisma.tag.create({ data: { name: tag } });
        }
        return existingTag;
      })
    );

    // Usuwanie starych tagów
    await prisma.offer.update({
      where: { id },
      data: {
        tags: {
          disconnect: tagsToRemove.map((tag) => ({ name: tag })),
        },
      },
    });

    // Aktualizacja oferty
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        title: title ?? existingOffer.title,
        description: description ?? existingOffer.description,
        price: price ?? existingOffer.price,
        major: major ?? existingOffer.major,
        department: department ?? existingOffer.department,
        category: category ?? existingOffer.category,
        imageUrl: imageUrl,
        tags: {
          connect: newTags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    return NextResponse.json(updatedOffer, { status: 200 });
  } catch (error) {
    console.error("🚨 Błąd w metodzie PUT:", error);
    return NextResponse.json({ error: "Błąd serwera", details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Brak ID oferty w zapytaniu" }, { status: 400 });
    }

    await prisma.offer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Oferta została usunięta" });
  } catch (error) {
    console.error("Błąd w metodzie DELETE:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
