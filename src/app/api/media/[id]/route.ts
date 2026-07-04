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

  // Only delete from Blob storage if it's a blob URL we manage
  // (external URLs entered manually shouldn't be deleted from our storage)
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
  const { titleAr, titleEn, speaker, description } = body;

  const { prisma } = await import("@/lib/prisma");
  const media = await prisma.media.update({
    where: { id },
    data: { titleAr, titleEn, speaker, description },
  });

  return NextResponse.json(media);
}
