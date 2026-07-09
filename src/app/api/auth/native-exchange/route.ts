import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    const record = await prisma.verificationToken.findFirst({
      where: { token: code },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    // One-time use
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: record.identifier },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const secret = process.env.NEXTAUTH_SECRET!;
    const jwt = await encode({
      token: {
        id: user.id,
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      secret,
    });

    const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://");
    const cookieName = isHttps
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const res = NextResponse.json({ success: true });
    res.cookies.set(cookieName, jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: !!isHttps,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error("native-exchange error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
