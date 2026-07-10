import { NextResponse } from "next/server";

interface Moshaf {
  id: number;
  name: string;
  server: string;
  surah_total: string;
  surah_list: string;
  moshaf_type: number;
}

interface ApiReciter {
  id: number;
  name: string;
  letter: string;
  moshaf: Moshaf[];
}

interface Track {
  reciterId: number;
  reciterName: string;
  surahId: number;
  url: string;
}

// Substrings unique enough to match each reciter regardless of spacing
// variants (e.g. "عبدالباسط" vs "عبد الباسط").
const KEYWORDS = ["المنشاوي", "الباسط", "الحصري", "المعيقلي", "الدوسري"];

export async function GET() {
  try {
    const res = await fetch(
      "https://www.mp3quran.net/api/v3/reciters?language=ar",
      { next: { revalidate: 60 * 60 * 24 * 7 } }, // reciter list barely changes
    );
    if (!res.ok) throw new Error(`mp3quran API HTTP ${res.status}`);

    const data = await res.json();
    const reciters: ApiReciter[] = data.reciters || [];

    const tracks: Track[] = [];

    for (const keyword of KEYWORDS) {
      const candidates = reciters.filter((r) => r.name.includes(keyword));
      if (candidates.length === 0) continue;

      // Prefer the moshaf covering the full 114 surahs; if a reciter shows
      // up more than once (different riwayat), keep only the most complete.
      let best: { reciter: ApiReciter; moshaf: Moshaf } | null = null;
      for (const reciter of candidates) {
        for (const moshaf of reciter.moshaf || []) {
          const total = parseInt(moshaf.surah_total, 10) || 0;
          const bestTotal = best
            ? parseInt(best.moshaf.surah_total, 10) || 0
            : -1;
          if (total > bestTotal) {
            best = { reciter, moshaf };
          }
        }
      }
      if (!best) continue;

      const surahIds = best.moshaf.surah_list
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 114);

      for (const surahId of surahIds) {
        tracks.push({
          reciterId: best.reciter.id,
          reciterName: best.reciter.name,
          surahId,
          url: `${best.moshaf.server}${String(surahId).padStart(3, "0")}.mp3`,
        });
      }
    }

    return NextResponse.json({ tracks });
  } catch (e) {
    console.error("mosque-station route error:", e);
    return NextResponse.json(
      { tracks: [], error: "Failed to load reciter list" },
      { status: 500 },
    );
  }
}
