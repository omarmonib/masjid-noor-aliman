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

  const { prisma } = await import("@/lib/prisma");
  const event = await prisma.mosqueEvent.update({
    where: { id },
    data: {
      titleAr,
      titleEn: titleEn || null,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      date: new Date(date),
      time,
      location,
      category,
    },
  });

  return NextResponse.json(event);
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
  await prisma.mosqueEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
