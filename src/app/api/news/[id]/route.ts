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
    summaryAr,
    summaryEn,
    contentAr,
    contentEn,
    category,
  } = body;

  const { prisma } = await import("@/lib/prisma");
  const news = await prisma.newsPost.update({
    where: { id },
    data: {
      titleAr,
      titleEn: titleEn || null,
      summaryAr: summaryAr || null,
      summaryEn: summaryEn || null,
      contentAr,
      contentEn: contentEn || null,
      category,
    },
  });

  return NextResponse.json(news);
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
  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
