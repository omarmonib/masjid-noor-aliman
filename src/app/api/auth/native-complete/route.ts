import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const dest = req.nextUrl.searchParams.get("dest") || "/";

  if (!session?.user?.id) {
    return NextResponse.redirect(
      `masjidnooraliman://auth-callback?error=no_session`,
    );
  }

  const code = randomBytes(24).toString("hex");
  const { prisma } = await import("@/lib/prisma");

  await prisma.verificationToken.create({
    data: {
      identifier: session.user.id,
      token: code,
      expires: new Date(Date.now() + 2 * 60 * 1000),
    },
  });

  const redirectUrl = `masjidnooraliman://auth-callback?code=${code}&dest=${encodeURIComponent(dest)}`;
  return NextResponse.redirect(redirectUrl);
}
