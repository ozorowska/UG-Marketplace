import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// funkcja zapisująca plik do katalogu publicznego
const saveFile = (buffer: Buffer, fileName: string): string => {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profile");

  // tworzenie folderu jeśli nie istnieje
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  // zwracamy ścieżkę względną do frontendu
  return `/uploads/profile/${fileName}`;
};

// POST /api/user/profile/image – zapis zdjęcia profilowego
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // odczyt pliku z formularza
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nie przesłano pliku" }, { status: 400 });
    }

    // sprawdzenie czy plik jest obrazem
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Przesłany plik nie jest obrazem" }, { status: 400 });
    }

    // przygotowanie danych do zapisu
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.type.split("/")[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = saveFile(buffer, fileName);

    // zapis nowego zdjęcia w bazie
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: filePath },
      select: { id: true, image: true },
    });

    // pobranie poprzedniego zdjęcia (jeśli istnieje)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true },
    });

    // usuwanie starego zdjęcia (jeśli różne)
    if (user?.image && user.image !== filePath) {
      try {
        const oldImagePath = path.join(process.cwd(), "public", user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (err) {
        console.error("Błąd podczas usuwania starego zdjęcia:", err);
      }
    }

    return NextResponse.json(
      {
        message: "Zdjęcie zostało zapisane",
        imageUrl: filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd w POST /api/user/profile/image:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
