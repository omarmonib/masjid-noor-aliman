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
  const news = await prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(news);
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
      summaryAr,
      summaryEn,
      contentAr,
      contentEn,
      category,
    } = body;

    if (!titleAr?.trim() || !contentAr?.trim()) {
      return NextResponse.json(
        { error: "Arabic title and content are required" },
        { status: 400 },
      );
    }
    if (!["news", "announcement"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    const news = await prisma.newsPost.create({
      data: {
        titleAr: titleAr.trim(),
        titleEn: titleEn?.trim() || null,
        summaryAr: summaryAr?.trim() || null,
        summaryEn: summaryEn?.trim() || null,
        contentAr: contentAr.trim(),
        contentEn: contentEn?.trim() || null,
        category,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (e) {
    console.error("News create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
