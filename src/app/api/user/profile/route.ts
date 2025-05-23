import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import type { User } from "@prisma/client";

export const runtime = "nodejs";


// funkcja pomocnicza – wczytywanie kierunków studiów z pliku JSON
const getMajors = (): { kierunek: string }[] => {
  try {
    const majorsPath = path.join(process.cwd(), "public", "ug_majors.json");
    const majorsData = fs.readFileSync(majorsPath, "utf8");
    return JSON.parse(majorsData);
  } catch (error) {
    console.error("Błąd odczytu pliku z kierunkami:", error);
    return [];
  }
};

// GET /api/user/profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
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
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    }

    const majorsRaw = getMajors();
    const majors = majorsRaw.map(item => item.kierunek);

    return NextResponse.json({ user, majors }, { status: 200 });
  } catch (error) {
    console.error("Błąd w GET /api/user/profile:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST /api/user/profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    }

    const data: Partial<Pick<User, "name" | "major">> = await request.json();
    const updateData: Partial<Pick<User, "name" | "major">> = {};

    // aktualizacja imienia
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    // walidacja i aktualizacja kierunku studiów
    if (data.major !== undefined) {
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
      select: {
        id: true,
        email: true,
        name: true,
        major: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Błąd w POST /api/user/profile:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// PUT /api/user/profile – alias dla POST
export async function PUT(request: NextRequest) {
  return POST(request);
}
