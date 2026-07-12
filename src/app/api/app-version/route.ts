// src/app/api/app-version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    latestVersionCode: 4,
    minVersionCode: 4,
    downloadUrl:
      "https://yzxmxw1es97h5xoh.public.blob.vercel-storage.com/apk/masjid-noor-aliman.apk",
  });
}
