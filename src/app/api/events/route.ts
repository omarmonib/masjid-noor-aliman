import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const { prisma } = await import("@/lib/prisma");
  const events = await prisma.mosqueEvent.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      date,
      time,
      location,
      category,
    } = body;

    if (!titleAr?.trim() || !date || !time?.trim() || !location?.trim()) {
      return NextResponse.json(
        { error: "Title, date, time and location are required" },
        { status: 400 },
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const event = await prisma.mosqueEvent.create({
      data: {
        titleAr: titleAr.trim(),
        titleEn: titleEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        date: new Date(date),
        time: time.trim(),
        location: location.trim(),
        category: category || "other",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    console.error("Event create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
