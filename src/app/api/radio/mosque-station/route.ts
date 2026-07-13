import { NextResponse } from "next/server";
import {
  buildPlaylist,
  computeLiveState,
  type RadioTrack,
} from "@/lib/radio-schedule";

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

const KEYWORDS = ["المنشاوي", "الباسط", "الحصري", "المعيقلي", "الدوسري"];

async function fetchTracks(): Promise<RadioTrack[]> {
  const res = await fetch(
    "https://www.mp3quran.net/api/v3/reciters?language=ar",
    {
      next: { revalidate: 60 * 60 * 24 * 7 },
    },
  );
  if (!res.ok) throw new Error(`mp3quran API HTTP ${res.status}`);

  const data = await res.json();
  const reciters: ApiReciter[] = data.reciters || [];
  const tracks: RadioTrack[] = [];

  for (const keyword of KEYWORDS) {
    const candidates = reciters.filter((r) => r.name.includes(keyword));
    if (candidates.length === 0) continue;

    let best: { reciter: ApiReciter; moshaf: Moshaf } | null = null;
    for (const reciter of candidates) {
      for (const moshaf of reciter.moshaf || []) {
        const total = parseInt(moshaf.surah_total, 10) || 0;
        const bestTotal = best
          ? parseInt(best.moshaf.surah_total, 10) || 0
          : -1;
        if (total > bestTotal) best = { reciter, moshaf };
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

  return tracks;
}

export async function GET() {
  try {
    const tracks = await fetchTracks();
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "No tracks available" },
        { status: 500 },
      );
    }

    const playlist = buildPlaylist(tracks);

    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.radioTrackDuration.findMany({
      where: { url: { in: playlist.map((t) => t.url) } },
      select: { url: true, durationSeconds: true },
    });
    const durations = new Map(rows.map((r) => [r.url, r.durationSeconds]));

    const state = computeLiveState(playlist, durations);

    if (state.mode === "adhan") {
      return NextResponse.json({
        mode: "adhan",
        url: "/audio/adhan.mp3",
        offsetSeconds: state.offsetSeconds,
      });
    }

    return NextResponse.json({
      mode: "recitation",
      url: state.track.url,
      reciterName: state.track.reciterName,
      surahId: state.track.surahId,
      offsetSeconds: state.offsetSeconds,
      trackDurationSeconds: state.trackDurationSeconds,
    });
  } catch (e) {
    console.error("mosque-station route error:", e);
    return NextResponse.json(
      { error: "Failed to compute live station" },
      { status: 500 },
    );
  }
}
