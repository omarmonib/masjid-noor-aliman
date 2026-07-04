import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const body = await req.json();
  const { nameAr, nameEn, order } = body;

  const { prisma } = await import("@/lib/prisma");
  const speaker = await prisma.speaker.update({
    where: { id },
    data: {
      nameAr,
      nameEn: nameEn || null,
      order: Number.isFinite(order) ? order : 0,
    },
  });

  return NextResponse.json(speaker);
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

  // Detach media from this speaker before deleting (keeps the recordings, just unlinks the section)
  await prisma.media.updateMany({
    where: { speakerId: id },
    data: { speakerId: null },
  });
  await prisma.speaker.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
