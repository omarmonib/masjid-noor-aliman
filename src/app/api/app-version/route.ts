// src/app/api/app-version/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    latestVersionCode: 2,
    minVersionCode: 1,
    downloadUrl:
      "https://yzxmxw1es97h5xoh.public.blob.vercel-storage.com/apk/masjid-noor-aliman.apk",
  });
}
