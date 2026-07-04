// src/app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import path from "path";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const { prisma } = await import("@/lib/prisma");
  const media = await prisma.media.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const titleAr = (formData.get("titleAr") as string)?.trim();
    const titleEn = (formData.get("titleEn") as string)?.trim() || null;
    const type = formData.get("type") as string;
    const speaker = (formData.get("speaker") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const externalUrl = (formData.get("externalUrl") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!titleAr || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 },
      );
    }
    if (!["quran", "lesson"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    let url = "";

    if (file && file.size > 0) {
      const allowedExt = [".mp3", ".m4a", ".wav", ".ogg", ".aac"];
      const ext = path.extname(file.name).toLowerCase();
      if (!allowedExt.includes(ext)) {
        return NextResponse.json(
          { error: "Only audio files are allowed (mp3, m4a, wav, ogg, aac)" },
          { status: 400 },
        );
      }
      // 100MB safety cap
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }

      const filename = `media/${randomUUID()}${ext}`;
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      url = blob.url;
    } else if (externalUrl) {
      url = externalUrl;
    } else {
      return NextResponse.json(
        { error: "Provide an audio file or an external URL" },
        { status: 400 },
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const media = await prisma.media.create({
      data: { titleAr, titleEn, type, url, speaker, description },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (e) {
    console.error("Media upload error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
