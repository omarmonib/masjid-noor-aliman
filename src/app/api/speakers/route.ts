import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import path from "path";
import { randomUUID } from "crypto";

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
    const formData = await req.formData();
    const nameAr = (formData.get("nameAr") as string)?.trim();
    const nameEn = (formData.get("nameEn") as string)?.trim() || null;
    const orderRaw = formData.get("order");
    const order = orderRaw ? Number(orderRaw) : 0;
    const file = formData.get("photo") as File | null;

    if (!nameAr) {
      return NextResponse.json(
        { error: "Arabic name is required" },
        { status: 400 },
      );
    }

    let photoUrl: string | null = null;
    if (file && file.size > 0) {
      const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      if (!allowedExt.includes(ext)) {
        return NextResponse.json(
          { error: "Only image files are allowed (jpg, png, webp)" },
          { status: 400 },
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large" }, { status: 413 });
      }
      const blob = await put(`speakers/${randomUUID()}${ext}`, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      photoUrl = blob.url;
    }

    const { prisma } = await import("@/lib/prisma");
    const speaker = await prisma.speaker.create({
      data: {
        nameAr,
        nameEn,
        order: Number.isFinite(order) ? order : 0,
        photoUrl,
      },
    });

    return NextResponse.json(speaker, { status: 201 });
  } catch (e) {
    console.error("Speaker create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
