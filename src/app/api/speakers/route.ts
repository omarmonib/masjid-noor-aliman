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
  const speakers = await prisma.speaker.findMany({
    orderBy: [{ order: "asc" }, { nameAr: "asc" }],
  });
  return NextResponse.json(speakers);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { nameAr, nameEn, order } = body;

    if (!nameAr?.trim()) {
      return NextResponse.json(
        { error: "Arabic name is required" },
        { status: 400 },
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const speaker = await prisma.speaker.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        order: Number.isFinite(order) ? order : 0,
      },
    });

    return NextResponse.json(speaker, { status: 201 });
  } catch (e) {
    console.error("Speaker create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
