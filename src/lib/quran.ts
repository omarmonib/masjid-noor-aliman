import { normalizeArabic } from "./quran-search";

interface YaAyyuhaVerse {
  key: string; // "surah:ayah"
  ayahNumber: number; // global 1-6236, used by alquran.cloud's /ayah endpoint
}

let yaAyyuhaCache: YaAyyuhaVerse[] | null = null;

/**
 * Fetches the full Uthmani Quran text once and filters it down to verses
 * that begin with "يا أيها" (tashkeel-insensitive). Cached in-memory for
 * the life of the server instance — every subsequent call is free.
 */
async function getYaAyyuhaVerses(): Promise<YaAyyuhaVerse[]> {
  if (yaAyyuhaCache) return yaAyyuhaCache;

  const res = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani", {
    next: { revalidate: 86400 * 30 },
  });
  if (!res.ok) throw new Error("Failed to fetch Quran text");
  const data = await res.json();

  const prefix = normalizeArabic("يا أيها");
  const verses: YaAyyuhaVerse[] = [];

  const surahs: {
    number: number;
    ayahs: { number: number; numberInSurah: number; text: string }[];
  }[] = data.data.surahs;

  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      if (normalizeArabic(ayah.text).startsWith(prefix)) {
        verses.push({
          key: `${surah.number}:${ayah.numberInSurah}`,
          ayahNumber: ayah.number,
        });
      }
    }
  }

  yaAyyuhaCache = verses;
  return verses;
}

// Egypt does not currently observe DST — fixed UTC+2 offset, same approach
// as prayer-schedule.ts. Using a fixed local date (rather than server UTC
// date) means the verse flips at local midnight rather than at a time that
// could be several hours off from the audience's actual day boundary.
const CAIRO_OFFSET_HOURS = 2;

function getCairoDayOfYear(): number {
  const now = new Date();
  const shifted = new Date(now.getTime() + CAIRO_OFFSET_HOURS * 3600 * 1000);
  const startOfYear = Date.UTC(shifted.getUTCFullYear(), 0, 1);
  const today = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return Math.floor((today - startOfYear) / 86400000);
}

export async function getDailyVerse() {
  try {
    const verses = await getYaAyyuhaVerses();
    if (verses.length === 0) throw new Error("No matching verses found");

    const dayOfYear = getCairoDayOfYear();
    const chosen = verses[dayOfYear % verses.length];

    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${chosen.ayahNumber}/editions/quran-uthmani,en.asad`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) throw new Error("Failed to fetch verse");
    const data = await res.json();

    const arabic = data.data[0];
    const english = data.data[1];

    return {
      arabic: arabic.text,
      english: english.text,
      surah: arabic.surah.name,
      surahEn: arabic.surah.englishName,
      ayah: arabic.numberInSurah,
    };
  } catch {
    return {
      arabic:
        "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ",
      english:
        "O you who believe! Be conscious of Allah, and be with those who are true.",
      surah: "التوبة",
      surahEn: "At-Tawbah",
      ayah: 119,
    };
  }
}

export async function getDailyHadith() {
  const dayOfYear = getCairoDayOfYear();
  const number = (dayOfYear % 42) + 1;

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi/${number}.json`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch hadith");
    const data = await res.json();
    const arabic = data.hadiths?.[0]?.text || data.hadith?.[0]?.text || "";

    return {
      arabic,
      number,
    };
  } catch {
    return {
      arabic:
        "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      number: 1,
    };
  }
}
