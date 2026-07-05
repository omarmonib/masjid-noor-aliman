import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, keys } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 },
      );
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("Push subscribe error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push unsubscribe error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
