import { NextRequest, NextResponse } from "next/server";
import  {prisma} from "../../../../lib/prisma";
import fs from "fs/promises";
import path from "path";

const uploadDir = "./public/uploads";

// pobieranie jednej oferty po id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // wyciągnięcie id z parametrów dynamicznego routingu

    const offer = await prisma.offer.findUnique({
      where: { id }, // szukamy oferty po id
      include: { user: true, tags: true }, // dołączamy dane użytkownika i tagi
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta nie została znaleziona" }, { status: 404 });
    }

    return NextResponse.json(offer, { status: 200 }); // zwracamy ofertę jako JSON
  } catch (error) {
    console.error("Błąd w metodzie GET:", error); // log błędu w konsoli
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// edycja oferty
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id; // wyciągamy id z URL
    const formData = await request.formData(); // pobieramy dane formularza

    // wyciąganie pól formularza z bezpiecznym fallbackiem
    const title = formData.get("title")?.toString() ?? null;
    const description = formData.get("description")?.toString() ?? null;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    const major = formData.get("major")?.toString() ?? null;
    const department = formData.get("department")?.toString() ?? null;
    const category = formData.get("category")?.toString() ?? null;
    const image = formData.get("image") as File | null;
    const tagsFromForm = formData.get("tags")?.toString().split(",").map((t: string) => t.trim()) ?? [];
    let imageUrl = formData.get("imageUrl")?.toString() ?? null;

    // weryfikacja wymaganych danych
    if (!title || !description || isNaN(price ?? NaN) || !major || !category) {
      return NextResponse.json({
        error: "Wszystkie pola (title, description, price, major, category) są wymagane"
      }, { status: 400 });
    }

    // pobranie istniejącej oferty z bazy
    const existingOffer = await prisma.offer.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingOffer) {
      return NextResponse.json({ error: "Oferta nie istnieje" }, { status: 404 });
    }

    // zapis nowego obrazu jeśli przesłano plik
    if (image && image instanceof File) {
      await fs.mkdir(uploadDir, { recursive: true }); // tworzymy folder jeśli nie istnieje
      const fileName = `${Date.now()}-${image.name}`; // generujemy unikalną nazwę
      const filePath = path.join(uploadDir, fileName); // pełna ścieżka do pliku
      const buffer = Buffer.from(await image.arrayBuffer()); // konwertujemy do bufora
      await fs.writeFile(filePath, buffer); // zapisujemy na dysk
      imageUrl = `/uploads/${fileName}`; // zapisujemy ścieżkę względną
    } else {
      imageUrl = existingOffer.imageUrl; // zachowujemy stary obraz jeśli brak nowego
    }

    // ustalenie które tagi należy dodać, a które usunąć
    const currentTags = existingOffer.tags.map((tag: { name: string }) => tag.name);
    const tagsToAdd = tagsFromForm.filter((tag: string) => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter((tag: string) => !tagsFromForm.includes(tag));

    // tworzenie nowych tagów jeśli nie istnieją
    const newTags = await Promise.all(
      tagsToAdd.map(async (tag: string) => {
        let existingTag = await prisma.tag.findUnique({ where: { name: tag } });
        if (!existingTag) {
          existingTag = await prisma.tag.create({ data: { name: tag } });
        }
        return existingTag;
      })
    );

    // odpinamy tagi które zostały usunięte z formularza
    await prisma.offer.update({
      where: { id },
      data: {
        tags: {
          disconnect: tagsToRemove.map((tag: string) => ({ name: tag })),
        },
      },
    });

    // dynamiczne zbudowanie danych do aktualizacji oferty
    const updateData: any = {
      tags: {
        connect: newTags.map((tag: { id: string }) => ({ id: tag.id })),
      },
      imageUrl, // aktualizujemy obrazek niezależnie
    };

    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (price !== null) updateData.price = price;
    if (major !== null) updateData.major = major;
    if (department !== null) updateData.department = department;
    if (category !== null) updateData.category = category;

    // aktualizacja oferty w bazie danych
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedOffer, { status: 200 }); // zwracamy nową wersję oferty
  } catch (error: any) {
    console.error("Błąd w metodzie PUT:", error); // log błędu
    return NextResponse.json({ error: "Błąd serwera", details: error.message }, { status: 500 });
  }
}

// usuwanie oferty
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Brak ID oferty w zapytaniu" }, { status: 400 });
    }

    await prisma.offer.delete({ where: { id } }); // usunięcie rekordu oferty z bazy

    return NextResponse.json({ message: "Oferta została usunięta" }); // potwierdzenie
  } catch (error) {
    console.error("Błąd w metodzie DELETE:", error); // log błędu
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}