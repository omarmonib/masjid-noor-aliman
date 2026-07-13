import { getNotificationEventsForOffset } from "@/lib/prayer-schedule";

export interface RadioTrack {
  reciterId: number;
  reciterName: string;
  surahId: number;
  url: string;
}

// Never change this seed or epoch — doing so would jump the "live" position
// for every listener at once.
const PLAYLIST_SEED = 913247;
const EPOCH = Date.UTC(2024, 0, 1);
const ADHAN_WINDOW_SECONDS = 210;
const DEFAULT_TRACK_DURATION = 480;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPlaylist(tracks: RadioTrack[]): RadioTrack[] {
  const rand = mulberry32(PLAYLIST_SEED);
  const arr = [...tracks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface LiveRecitationState {
  mode: "recitation";
  track: RadioTrack;
  offsetSeconds: number;
  trackDurationSeconds: number;
}
export interface LiveAdhanState {
  mode: "adhan";
  offsetSeconds: number;
}
export type LiveState = LiveRecitationState | LiveAdhanState;

export function computeLiveState(
  playlist: RadioTrack[],
  durations: Map<string, number>,
  now: number = Date.now(),
): LiveState {
  // Adhan takes over the "broadcast" for everyone at once, same as the recitation does
  for (const offset of [-1, 0, 1]) {
    for (const event of getNotificationEventsForOffset(offset)) {
      const diff = (now - event.time.getTime()) / 1000;
      if (diff >= 0 && diff < ADHAN_WINDOW_SECONDS) {
        return { mode: "adhan", offsetSeconds: diff };
      }
    }
  }

  const durationsList = playlist.map(
    (t) => durations.get(t.url) ?? DEFAULT_TRACK_DURATION,
  );
  const total = durationsList.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return {
      mode: "recitation",
      track: playlist[0],
      offsetSeconds: 0,
      trackDurationSeconds: DEFAULT_TRACK_DURATION,
    };
  }

  const elapsed = ((now - EPOCH) / 1000) % total;
  let acc = 0;
  for (let i = 0; i < playlist.length; i++) {
    const d = durationsList[i];
    if (elapsed < acc + d) {
      return {
        mode: "recitation",
        track: playlist[i],
        offsetSeconds: elapsed - acc,
        trackDurationSeconds: d,
      };
    }
    acc += d;
  }

  return {
    mode: "recitation",
    track: playlist[0],
    offsetSeconds: 0,
    trackDurationSeconds: durationsList[0],
  };
}

// ── Track fetching ─────────────────────────────────────────────────
// Moved here (shared) so both /api/radio/mosque-station and the new
// /api/radio/live-stream route build the exact same playlist without
// duplicating this logic in two files.

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

export async function fetchTracks(): Promise<RadioTrack[]> {
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
