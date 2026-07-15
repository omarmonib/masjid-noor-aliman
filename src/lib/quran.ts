import { normalizeArabic } from "./quran-search";

interface YaAyyuhaVerse {
  key: string; // "surah:ayah"
  ayahNumber: number; // global 1-6236, used by alquran.cloud's /ayah endpoint
}

let yaAyyuhaCache: YaAyyuhaVerse[] | null = null;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json",
};

/**
 * Fetches the full Uthmani Quran text once and filters it down to verses
 * that begin with "يا أيها" (tashkeel-insensitive). Cached in-memory for
 * the life of the server instance — every subsequent call is free.
 */
async function getYaAyyuhaVerses(): Promise<YaAyyuhaVerse[]> {
  if (yaAyyuhaCache) return yaAyyuhaCache;

  // ── Step 1: fetch ──────────────────────────────────────────────
  let res: Response;
  try {
    res = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani", {
      headers: FETCH_HEADERS,
      // The full Uthmani text is ~6MB, which exceeds Next.js's 2MB data
      // cache entry limit and just logs a noisy "Failed to set fetch
      // cache" warning on every cold start. We already cache the parsed
      // result ourselves in `yaAyyuhaCache`, so skip Next's cache here.
      cache: "no-store",
    });
  } catch (e) {
    console.error("[getYaAyyuhaVerses] STEP 1 (network fetch) threw:", e);
    throw e;
  }

  if (!res.ok) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    console.error(
      `[getYaAyyuhaVerses] STEP 1 (fetch) non-OK response: ${res.status} ${res.statusText}`,
      "body preview:",
      bodyPreview,
    );
    throw new Error(`Failed to fetch Quran text (HTTP ${res.status})`);
  }

  // ── Step 2: parse JSON ─────────────────────────────────────────
  let data: unknown;
  try {
    data = await res.json();
  } catch (e) {
    console.error("[getYaAyyuhaVerses] STEP 2 (JSON.parse) threw:", e);
    throw e;
  }

  const surahs = (data as { data?: { surahs?: unknown } })?.data?.surahs;

  if (!Array.isArray(surahs)) {
    console.error(
      "[getYaAyyuhaVerses] STEP 2 unexpected response shape. Top-level keys:",
      data && typeof data === "object" ? Object.keys(data as object) : data,
      "data.data keys:",
      (data as { data?: object })?.data &&
        Object.keys((data as { data: object }).data),
    );
    throw new Error("Unexpected response shape from /v1/quran/quran-uthmani");
  }

  // ── Step 3: filter ─────────────────────────────────────────────
  // The Uthmani rasm writes "يا أيها" as a single fused token with no
  // space (dagger-alif ligature between ي and أيها), so after stripping
  // diacritics it normalizes to "يايها..." with no space in between.
  // Comparing without stripping whitespace from the search prefix meant
  // it could never match — hence the previous "0 matches" bug. Stripping
  // whitespace on both sides makes the match robust to either spelling
  // convention instead of hardcoding rasm-specific assumptions.
  const prefix = normalizeArabic("يا أيها").replace(/\s+/g, "");
  console.error(
    "[getYaAyyuhaVerses] normalized prefix to match against:",
    JSON.stringify(prefix),
  );

  const verses: YaAyyuhaVerse[] = [];
  let totalAyahs = 0;

  type RawSurah = {
    number: number;
    ayahs: { number: number; numberInSurah: number; text: string }[];
  };

  try {
    for (const surah of surahs as RawSurah[]) {
      if (!Array.isArray(surah.ayahs)) {
        console.error(
          `[getYaAyyuhaVerses] STEP 3 surah ${surah?.number} has no ayahs array`,
        );
        continue;
      }
      for (const ayah of surah.ayahs) {
        totalAyahs++;
        if (typeof ayah.text !== "string") {
          console.error(
            `[getYaAyyuhaVerses] STEP 3 ayah missing text: surah ${surah.number} ayah ${ayah?.numberInSurah}`,
          );
          continue;
        }
        if (normalizeArabic(ayah.text).replace(/\s+/g, "").startsWith(prefix)) {
          verses.push({
            key: `${surah.number}:${ayah.numberInSurah}`,
            ayahNumber: ayah.number,
          });
        }
      }
    }
  } catch (e) {
    console.error("[getYaAyyuhaVerses] STEP 3 (filter loop) threw:", e);
    throw e;
  }

  console.error(
    `[getYaAyyuhaVerses] diagnostics — surahs: ${surahs.length}, ayahs: ${totalAyahs}, matches: ${verses.length}`,
  );
  console.error(
    "[getYaAyyuhaVerses] first 10 matches:",
    verses.slice(0, 10).map((v) => v.key),
  );

  if (verses.length === 0) {
    const sample = (surahs as RawSurah[])?.[1]?.ayahs?.[0]?.text;
    console.error(
      "[getYaAyyuhaVerses] ZERO MATCHES. Sample ayah text (Al-Baqarah 1) raw:",
      JSON.stringify(sample),
      "normalized:",
      sample ? JSON.stringify(normalizeArabic(sample)) : undefined,
    );
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
    if (verses.length === 0) {
      console.error(
        "[getDailyVerse] verses array empty after filter — falling back",
      );
      throw new Error("No matching verses found");
    }

    const dayOfYear = getCairoDayOfYear();
    const chosen = verses[dayOfYear % verses.length];
    console.error(
      `[getDailyVerse] chosen verse: ${chosen.key} (global ayah #${chosen.ayahNumber})`,
    );

    // ── Step 4: fetch selected ayah in both editions ──────────────
    let res: Response;
    try {
      res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${chosen.ayahNumber}/editions/quran-uthmani,en.asad`,
        { headers: FETCH_HEADERS, next: { revalidate: 3600 } },
      );
    } catch (e) {
      console.error("[getDailyVerse] STEP 4 (network fetch) threw:", e);
      throw e;
    }

    if (!res.ok) {
      let bodyPreview = "";
      try {
        bodyPreview = (await res.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      console.error(
        `[getDailyVerse] STEP 4 non-OK response: ${res.status} ${res.statusText}`,
        "body preview:",
        bodyPreview,
      );
      throw new Error(`Failed to fetch verse (HTTP ${res.status})`);
    }

    // ── Step 5: parse editions response ───────────────────────────
    let data: { data?: unknown };
    try {
      data = await res.json();
    } catch (e) {
      console.error("[getDailyVerse] STEP 5 (JSON.parse) threw:", e);
      throw e;
    }

    if (!Array.isArray(data.data) || data.data.length < 2) {
      console.error(
        "[getDailyVerse] STEP 5 unexpected editions response shape:",
        data,
      );
      throw new Error(
        "Unexpected response shape from /v1/ayah/.../editions/...",
      );
    }

    const arabic = data.data[0] as {
      text: string;
      numberInSurah: number;
      surah: { name: string; englishName: string };
    };
    const english = data.data[1] as { text: string };

    return {
      arabic: arabic.text,
      english: english.text,
      surah: arabic.surah.name,
      surahEn: arabic.surah.englishName,
      ayah: arabic.numberInSurah,
    };
  } catch (e) {
    console.error(
      "[getDailyVerse] falling back to hardcoded verse. Reason:",
      e,
    );
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
    if (!res.ok) {
      console.error(
        `[getDailyHadith] non-OK response: ${res.status} ${res.statusText}`,
      );
      throw new Error("Failed to fetch hadith");
    }
    const data = await res.json();
    const arabic = data.hadiths?.[0]?.text || data.hadith?.[0]?.text || "";

    return { arabic, number };
  } catch (e) {
    console.error("[getDailyHadith] falling back. Reason:", e);
    return {
      arabic:
        "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      number: 1,
    };
  }
}
