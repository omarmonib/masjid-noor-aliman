export interface PageWord {
  id: number;
  position: number;
  codeV2: string;
  textQpcHafs: string;
  pageNumber: number;
  lineNumber: number;
  charTypeName: string;
  verseKey: string;
  audioUrl?: string;
}

export interface PageVerseMeta {
  verseKey: string;
  juzNumber: number;
  hizbNumber: number;
  rubNumber: number;
  sajdahNumber: number | null;
}

export interface MushafPageData {
  words: PageWord[];
  verseMeta: PageVerseMeta[];
  surahIds: number[];
}

interface RawWord {
  id: number;
  position: number;
  code_v2?: string;
  text_qpc_hafs?: string;
  text?: string;
  page_number?: number;
  line_number?: number;
  char_type_name?: string;
  audio_url?: string;
}

interface RawVerse {
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  sajdah_number: number | null;
  words?: RawWord[];
}

const pageCache = new Map<number, MushafPageData>();
const surahFirstPageCache = new Map<number, number>();
const inflight = new Map<number, Promise<MushafPageData>>();

export const TOTAL_MUSHAF_PAGES = 604;

export async function getMushafPage(
  pageNumber: number,
): Promise<MushafPageData> {
  if (pageCache.has(pageNumber)) return pageCache.get(pageNumber)!;
  if (inflight.has(pageNumber)) return inflight.get(pageNumber)!;

  const promise = (async () => {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&word_fields=text_qpc_hafs,code_v2,line_number,page_number&fields=text_uthmani,juz_number,hizb_number,rub_el_hizb_number,sajdah_number&per_page=50`,
    );
    if (!res.ok) throw new Error(`Failed to load page ${pageNumber}`);
    const json = await res.json();

    const words: PageWord[] = [];
    const verseMeta: PageVerseMeta[] = [];
    const surahIds: number[] = [];

    for (const verse of (json.verses ?? []) as RawVerse[]) {
      const surahId = parseInt(verse.verse_key.split(":")[0], 10);
      if (!surahIds.includes(surahId)) surahIds.push(surahId);

      verseMeta.push({
        verseKey: verse.verse_key,
        juzNumber: verse.juz_number,
        hizbNumber: verse.hizb_number,
        rubNumber: verse.rub_el_hizb_number,
        sajdahNumber: verse.sajdah_number ?? null,
      });

      for (const w of verse.words ?? []) {
        words.push({
          id: w.id,
          position: w.position,
          codeV2: w.code_v2 || "",
          textQpcHafs: w.text_qpc_hafs || w.text || "",
          pageNumber: w.page_number || pageNumber,
          lineNumber: w.line_number || 1,
          charTypeName: w.char_type_name || "word",
          verseKey: verse.verse_key,
          audioUrl: w.audio_url,
        });
      }
    }

    const data: MushafPageData = { words, verseMeta, surahIds };
    pageCache.set(pageNumber, data);
    return data;
  })();

  inflight.set(pageNumber, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(pageNumber);
  }
}

/** Silently warms the cache for neighboring pages — call, don't await. */
export function prefetchNeighborPages(pageNumber: number) {
  [pageNumber - 1, pageNumber + 1].forEach((p) => {
    if (p >= 1 && p <= TOTAL_MUSHAF_PAGES && !pageCache.has(p)) {
      getMushafPage(p).catch(() => {});
    }
  });
}

export async function getSurahFirstPage(surahId: number): Promise<number> {
  if (surahFirstPageCache.has(surahId))
    return surahFirstPageCache.get(surahId)!;
  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?words=true&word_fields=page_number&per_page=1`,
  );
  const json = await res.json();
  const page: number = json.verses?.[0]?.words?.[0]?.page_number || 1;
  surahFirstPageCache.set(surahId, page);
  return page;
}
