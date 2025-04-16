import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const runtime = "nodejs";
const prisma = new PrismaClient();

// Funkcja do zapisu pliku z obsługą katalogów
const saveFile = (buffer, fileName) => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile');
  
  // Sprawdź czy katalog istnieje, jeśli nie - utwórz go
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/profile/${fileName}`;
};

// POST /api/user/profile/image
// Przesyłanie zdjęcia profilowego
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    // Parsowanie formularza multipart
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: "Nie przesłano pliku" }, { status: 400 });
    }

    // Sprawdzenie typu pliku (powinien być obrazem)
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: "Przesłany plik nie jest obrazem" }, { status: 400 });
    }

    // Generowanie unikalnej nazwy pliku
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = fileType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Zapis pliku
    const filePath = saveFile(buffer, fileName);

    // Aktualizacja pola image w bazie danych
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: filePath },
      select: { id: true, image: true }
    });

    // Jeśli użytkownik miał wcześniej zdjęcie, usuwamy je
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true }
    });

    if (user.image && user.image !== filePath) {
      try {
        const oldImagePath = path.join(process.cwd(), 'public', user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (error) {
        console.error("Błąd podczas usuwania starego zdjęcia:", error);
      }
    }

    return NextResponse.json({
      message: "Zdjęcie zostało zapisane",
      imageUrl: filePath
    }, { status: 200 });
  } catch (error) {
    console.error("Błąd w POST /api/user/profile/image:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}