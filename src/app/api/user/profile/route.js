import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import fs from 'fs';
import path from 'path';

export const runtime = "nodejs";
const prisma = new PrismaClient();

// Pobieranie listy dostępnych kierunków studiów z pliku JSON
const getMajors = () => {
  try {
    // Teraz plik jest w folderze 'public'
    const majorsPath = path.join(process.cwd(), 'public', 'ug_majors.json');
    const majorsData = fs.readFileSync(majorsPath, 'utf8');
    return JSON.parse(majorsData);
  } catch (error) {
    console.error("Błąd odczytu pliku z kierunkami:", error);
    return [];
  }
};

// GET /api/user/profile
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        major: true,
        image: true,
        createdAt: true
      }
    });
    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    }

    // Pobierz kierunki studiów i wyślij tylko listę napisów
    const majorsRaw = getMajors();
    const majors = majorsRaw.map(item => item.kierunek);

    return NextResponse.json({
      user,
      majors
    }, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/user/profile:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST /api/user/profile
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }
    const data = await request.json();
    const updateData = {};

    // Aktualizacja imienia, jeśli przesłano
    if (data.name !== undefined) updateData.name = data.name;

    // Aktualizacja kierunku – walidacja
    if (data.major !== undefined) {
      // Pobierz tablicę dostępnych kierunków ze zaktualizowanego pliku JSON
      const majorsRaw = getMajors();
      const availableMajors = majorsRaw.map(item => item.kierunek);
      if (data.major && !availableMajors.includes(data.major)) {
        return NextResponse.json(
          { error: "Nieprawidłowy kierunek studiów" },
          { status: 400 }
        );
      }
      updateData.major = data.major;
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: { id: true, email: true, name: true, major: true, image: true }
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Błąd w POST /api/user/profile:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// PUT zachowujemy dla kompatybilności
export async function PUT(request) {
  return POST(request);
}
