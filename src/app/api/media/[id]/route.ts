// src/app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { del } from "@vercel/blob";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
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

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (media.url.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(media.url);
    } catch {
      // blob may already be gone — ignore
    }
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { titleAr, titleEn, speaker, speakerId, description } = body;

  const { prisma } = await import("@/lib/prisma");
  const media = await prisma.media.update({
    where: { id },
    data: {
      titleAr,
      titleEn,
      description,
      speakerId: speakerId || null,
      speaker: speakerId ? null : speaker || null,
    },
    include: { speakerRef: true },
  });

  return NextResponse.json(media);
}
