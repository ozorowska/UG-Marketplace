import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const uploadDir = "./public/uploads";

export async function PUT(request, context) {
  try {
    const { params } = context;
    if (!params || !params.id) {
      return NextResponse.json({ error: "Brak ID oferty w zapytaniu" }, { status: 400 });
    }

    const id = String(params.id);
    const formData = await request.formData();

    const title = formData.get("title") || null;
    const description = formData.get("description") || null;
    const price = formData.get("price") ? parseFloat(formData.get("price")) : null;
    const major = formData.get("major") || null;
    const image = formData.get("image") || null;
    const tags = formData.get("tags")?.split(",").map((tag) => tag.trim()) || [];
    let imageUrl = formData.get("imageUrl") || null;

    console.log("📌 Przychodzące dane:", { title, description, price, major, image, imageUrl, tags });

    if (!title || !description || isNaN(price) || !major) {
      return NextResponse.json({ error: "Wszystkie pola są wymagane" }, { status: 400 });
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
      const fileName = `${Date.now()}-${image.name}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    } else {
      imageUrl = existingOffer.imageUrl;
    }

    // Obsługa tagów – aktualizacja tagów w bazie
    const currentTags = existingOffer.tags.map((tag) => tag.name);
    const tagsToAdd = tags.filter((tag) => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter((tag) => !tags.includes(tag));

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
