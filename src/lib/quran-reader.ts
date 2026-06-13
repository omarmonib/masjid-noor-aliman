export interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  versesCount: number;
  revelationPlace: string;
}

export interface Verse {
  id: number;
  verseNumber: number;
  textUthmani: string;
  translations: { text: string }[];
}

interface RawChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  translated_name: { name: string };
  verses_count: number;
  revelation_place: string;
}

interface RawVerse {
  id: number;
  verse_number: number;
  text_uthmani: string;
  translations?: { text: string }[];
}

export async function getSurahs(): Promise<Surah[]> {
  try {
    const res = await fetch(
      "https://api.quran.com/api/v4/chapters?language=ar",
      {
        next: { revalidate: 86400 * 30 },
      },
    );
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return data.chapters.map((c: RawChapter) => ({
      id: c.id,
      nameArabic: c.name_arabic,
      nameSimple: c.name_simple,
      nameTranslation: c.translated_name.name,
      versesCount: c.verses_count,
      revelationPlace: c.revelation_place,
    }));
  } catch {
    return [];
  }
}

export async function getVerses(surahId: number): Promise<Verse[]> {
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=ar&words=false&translations=131&fields=text_uthmani&per_page=300`,
      { next: { revalidate: 86400 * 30 } },
    );
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return data.verses.map((v: RawVerse) => ({
      id: v.id,
      verseNumber: v.verse_number,
      textUthmani: v.text_uthmani,
      translations: v.translations || [],
    }));
  } catch {
    return [];
  }
}
