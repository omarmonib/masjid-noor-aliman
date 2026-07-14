export interface QuranVerseIndexEntry {
  key: string; // "2:255"
  surahId: number;
  ayah: number;
  textUthmani: string;
  normalized: string;
}

export interface QuranSearchResult extends QuranVerseIndexEntry {
  preview: string;
}

/**
 * Strips diacritics (tashkeel) and normalizes letter variants that people
 * routinely skip/confuse when typing Arabic search queries:
 *   أ إ آ ا → ا      ى → ي      ة → ه
 * Also collapses tatweel and repeated whitespace.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // tashkeel/quranic marks
    .replace(/\u0640/g, "") // tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

let indexCache: QuranVerseIndexEntry[] | null = null;
let indexPromise: Promise<QuranVerseIndexEntry[]> | null = null;

/** Fetches the full Mushaf text once (all 6236 verses in a single call) and
 * builds a normalized, diacritic-free search index. Cached in-memory for
 * the life of the tab — every subsequent search reuses it for free. */
export async function getQuranIndex(): Promise<QuranVerseIndexEntry[]> {
  if (indexCache) return indexCache;
  if (indexPromise) return indexPromise;

  indexPromise = (async () => {
    const res = await fetch(
      "https://api.quran.com/api/v4/quran/verses/uthmani",
    );
    if (!res.ok) throw new Error("Failed to load Quran text");
    const data = await res.json();
    const verses: { verse_key: string; text_uthmani: string }[] =
      data.verses || [];

    const entries: QuranVerseIndexEntry[] = verses.map((v) => {
      const [surahIdStr, ayahStr] = v.verse_key.split(":");
      return {
        key: v.verse_key,
        surahId: parseInt(surahIdStr, 10),
        ayah: parseInt(ayahStr, 10),
        textUthmani: v.text_uthmani,
        normalized: normalizeArabic(v.text_uthmani),
      };
    });

    indexCache = entries;
    return entries;
  })();

  try {
    return await indexPromise;
  } catch (e) {
    indexPromise = null; // allow retry on next call if this failed
    throw e;
  }
}

export async function searchQuran(
  query: string,
  limit = 60,
): Promise<QuranSearchResult[]> {
  const q = normalizeArabic(query);
  if (!q) return [];

  const index = await getQuranIndex();
  const results: QuranSearchResult[] = [];
  for (const entry of index) {
    if (entry.normalized.includes(q)) {
      results.push({ ...entry, preview: entry.textUthmani });
      if (results.length >= limit) break;
    }
  }
  return results;
}

const pageForVerseCache = new Map<string, number>();

/** Looked up lazily (only when a search result is actually clicked), one
 * request per verse, cached after that — never needed for the search
 * itself, so it doesn't slow indexing/searching down. */
export async function getPageForVerseKey(verseKey: string): Promise<number> {
  const cached = pageForVerseCache.get(verseKey);
  if (cached) return cached;

  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${verseKey}?fields=page_number`,
  );
  if (!res.ok) throw new Error("Failed to resolve verse page");
  const data = await res.json();
  const page: number = data.verse?.page_number || 1;
  pageForVerseCache.set(verseKey, page);
  return page;
}
