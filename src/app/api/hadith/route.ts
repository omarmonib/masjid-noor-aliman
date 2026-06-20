import { NextRequest, NextResponse } from "next/server";

const CDN_IDS: Record<string, string> = {
  bukhari: "ara-bukhari",
  muslim: "ara-muslim1", // muslim1 = diacritics removed, better for search
  abudawud: "ara-abudawud",
  tirmidhi: "ara-tirmidhi",
  nasai: "ara-nasai",
  ibnmajah: "ara-ibnmajah",
  malik: "ara-malik",
  nawawi40: "ara-nawawi",
  riyadussalihin: "ara-riyadussalihin",
  adab: "ara-adab",
  bulugh: "ara-bulugh",
};

const BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection") || "";
  const cdnId = CDN_IDS[collection];
  if (!cdnId)
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });

  try {
    // Always return the full minified collection — client handles pagination & search
    const res = await fetch(`${BASE}/${cdnId}.min.json`, {
      next: { revalidate: 86400 * 7 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
