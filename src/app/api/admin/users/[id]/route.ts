// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// The original founding admin — protected from role changes by anyone
const PROTECTED_ADMIN_EMAIL = "omar.monib.03@gmail.com";

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
  const { role } = await req.json();

  if (!["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only the protected admin can change their own role (or in practice, never via this UI)
  if (
    target.email === PROTECTED_ADMIN_EMAIL &&
    session.user.email !== PROTECTED_ADMIN_EMAIL
  ) {
    return NextResponse.json(
      { error: "This account is protected and cannot be modified" },
      { status: 403 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json(user);
}
