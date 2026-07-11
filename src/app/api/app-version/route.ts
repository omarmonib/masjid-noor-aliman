// src/app/api/app-version/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    latestVersionCode: 3,
    minVersionCode: 2,
    downloadUrl:
      "https://masjid-noor-aliman.vercel.app/downloads/masjid-noor-aliman.apk",
  });
}
