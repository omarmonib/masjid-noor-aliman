export interface ReciterMoshaf {
  id: string; // `${reciterId}-${moshafId}`
  reciterId: number;
  reciterNameAr: string;
  style: "Murattal" | "Mujawwad" | "Muallim" | "Taraweeh" | "Nabawi" | "Other";
  styleAr: string;
  server: string;
  surahList: number[];
}

export interface ReciterGroup {
  reciterId: number;
  nameAr: string;
  moshafs: ReciterMoshaf[];
}

function detectStyle(moshafName: string): {
  style: ReciterMoshaf["style"];
  styleAr: string;
} {
  if (moshafName.includes("تراويح"))
    return { style: "Taraweeh", styleAr: "تراويح" };
  if (moshafName.includes("النبوي") || moshafName.includes("الحرم"))
    return { style: "Nabawi", styleAr: "الحرم النبوي" };
  if (moshafName.includes("معلم")) return { style: "Muallim", styleAr: "معلم" };
  if (moshafName.includes("مجود"))
    return { style: "Mujawwad", styleAr: "مجود" };
  if (moshafName.includes("مرتل") || moshafName.includes("مرتلة"))
    return { style: "Murattal", styleAr: "مرتل" };
  return { style: "Other", styleAr: moshafName };
}

let cache: ReciterGroup[] | null = null;

export async function getReciterGroups(): Promise<ReciterGroup[]> {
  if (cache) return cache;

  const res = await fetch(
    "https://www.mp3quran.net/api/v3/reciters?language=ar",
  );
  if (!res.ok) throw new Error("Failed to load reciters");
  const data = await res.json();

  const groups = new Map<number, ReciterGroup>();

  for (const reciter of data.reciters || []) {
    const moshafs: ReciterMoshaf[] = (reciter.moshaf || []).map(
      (m: { id: number; name: string; server: string; surah_list: string }) => {
        const { style, styleAr } = detectStyle(m.name);
        return {
          id: `${reciter.id}-${m.id}`,
          reciterId: reciter.id,
          reciterNameAr: reciter.name,
          style,
          styleAr,
          server: m.server,
          surahList: m.surah_list
            .split(",")
            .map((s: string) => parseInt(s.trim(), 10))
            .filter((n: number) => Number.isFinite(n)),
        };
      },
    );

    if (!groups.has(reciter.id)) {
      groups.set(reciter.id, {
        reciterId: reciter.id,
        nameAr: reciter.name,
        moshafs: [],
      });
    }
    groups.get(reciter.id)!.moshafs.push(...moshafs);
  }

  const list = Array.from(groups.values()).sort((a, b) =>
    a.nameAr.localeCompare(b.nameAr, "ar"),
  );
  cache = list;
  return list;
}

export function surahAudioUrl(moshaf: ReciterMoshaf, surahId: number): string {
  return `${moshaf.server}${String(surahId).padStart(3, "0")}.mp3`;
}

/**
 * Groups a reciter's moshafs by detected style and appends a running index
 * ("مرتل 1", "مرتل 2"...) whenever a reciter has more than one recording of
 * the same style — otherwise the plain style label is used. Styles the
 * reciter doesn't actually have never appear, since this only ever maps
 * over `moshafs` that exist.
 */
export function labelReciterMoshafs(
  moshafs: ReciterMoshaf[],
  isAr: boolean,
): { moshaf: ReciterMoshaf; label: string }[] {
  const counts = new Map<string, number>();
  for (const m of moshafs) counts.set(m.style, (counts.get(m.style) || 0) + 1);

  const seen = new Map<string, number>();
  return moshafs.map((m) => {
    const total = counts.get(m.style) || 1;
    const baseLabel = isAr ? m.styleAr : m.style;
    if (total <= 1) return { moshaf: m, label: baseLabel };
    const idx = (seen.get(m.style) || 0) + 1;
    seen.set(m.style, idx);
    return { moshaf: m, label: `${baseLabel} ${idx}` };
  });
}
