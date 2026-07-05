import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import path from "path";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const formData = await req.formData();
    const nameAr = (formData.get("nameAr") as string)?.trim();
    const nameEn = (formData.get("nameEn") as string)?.trim() || null;
    const orderRaw = formData.get("order");
    const order = orderRaw ? Number(orderRaw) : 0;
    const file = formData.get("photo") as File | null;
    const removePhoto = formData.get("removePhoto") === "1";

    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.speaker.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    let photoUrl = existing.photoUrl;

    if (file && file.size > 0) {
      const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      if (!allowedExt.includes(ext)) {
        return NextResponse.json(
          { error: "Only image files are allowed (jpg, png, webp)" },
          { status: 400 },
        );
      }
      const blob = await put(`speakers/${randomUUID()}${ext}`, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      if (existing.photoUrl?.includes(".public.blob.vercel-storage.com")) {
        try {
          await del(existing.photoUrl);
        } catch {
          // ignore
        }
      }
      photoUrl = blob.url;
    } else if (removePhoto) {
      if (existing.photoUrl?.includes(".public.blob.vercel-storage.com")) {
        try {
          await del(existing.photoUrl);
        } catch {
          // ignore
        }
      }
      photoUrl = null;
    }

    const speaker = await prisma.speaker.update({
      where: { id },
      data: {
        nameAr,
        nameEn,
        order: Number.isFinite(order) ? order : 0,
        photoUrl,
      },
    });

    return NextResponse.json(speaker);
  } catch (e) {
    console.error("Speaker update error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (existing?.photoUrl?.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(existing.photoUrl);
    } catch {
      // ignore
    }
  }

  await prisma.media.updateMany({
    where: { speakerId: id },
    data: { speakerId: null },
  });
  await prisma.speaker.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
