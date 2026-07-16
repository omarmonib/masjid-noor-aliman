export interface HadithCollection {
  id: string;
  nameAr: string;
  nameEn: string;
  totalHadith: number;
  icon: string;
}

export interface Hadith {
  id: number;
  collection: string;
  bookNumber: number;
  hadithNumber: number;
  textAr: string;
  textEn: string;
}

export const COLLECTIONS: HadithCollection[] = [
  {
    id: "bukhari",
    nameAr: "صحيح البخاري",
    nameEn: "Sahih Bukhari",
    totalHadith: 7563,
    icon: "📖",
  },
  {
    id: "muslim",
    nameAr: "صحيح مسلم",
    nameEn: "Sahih Muslim",
    totalHadith: 7453,
    icon: "📗",
  },
  {
    id: "abudawud",
    nameAr: "سنن أبي داود",
    nameEn: "Sunan Abu Dawud",
    totalHadith: 5274,
    icon: "📘",
  },
  {
    id: "tirmidhi",
    nameAr: "جامع الترمذي",
    nameEn: "Jami At-Tirmidhi",
    totalHadith: 3956,
    icon: "📙",
  },
  {
    id: "nasai",
    nameAr: "سنن النسائي",
    nameEn: "Sunan An-Nasai",
    totalHadith: 5758,
    icon: "📕",
  },
  {
    id: "ibnmajah",
    nameAr: "سنن ابن ماجه",
    nameEn: "Sunan Ibn Majah",
    totalHadith: 4341,
    icon: "📓",
  },
  {
    id: "malik",
    nameAr: "موطأ مالك",
    nameEn: "Muwatta Malik",
    totalHadith: 1832,
    icon: "📒",
  },
  {
    id: "nawawi40",
    nameAr: "الأربعون النووية",
    nameEn: "40 Hadith Nawawi",
    totalHadith: 42,
    icon: "🌟",
  },
  {
    id: "riyadussalihin",
    nameAr: "رياض الصالحين",
    nameEn: "Riyad As-Salihin",
    totalHadith: 1896,
    icon: "🌿",
  },
  {
    id: "adab",
    nameAr: "الأدب المفرد",
    nameEn: "Al-Adab Al-Mufrad",
    totalHadith: 1322,
    icon: "📜",
  },
  {
    id: "bulugh",
    nameAr: "بلوغ المرام",
    nameEn: "Bulugh Al-Maram",
    totalHadith: 1597,
    icon: "⚖️",
  },
];

export async function getDailyHadithData(): Promise<Hadith | null> {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const number = (dayOfYear % 42) + 1;
  try {
    const base =
      "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
    const res = await fetch(`${base}/ara-nawawi/${number}.json`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    const textAr = data.hadiths?.[0]?.text || data.hadith?.[0]?.text || "";
    return {
      id: number,
      collection: "nawawi40",
      bookNumber: 1,
      hadithNumber: number,
      textAr,
      textEn: "",
    };
  } catch {
    return null;
  }
}

// ── Narration-chain / Prophet's-words split (for visual styling) ──

export interface HadithSplit {
  chain: string;
  content: string;
  reference: string;
}

// Arabic diacritics (tashkeel), Quranic annotation marks, and tatweel —
// optional between letters in real hadith text (which is normally fully
// vocalized), so every trigger phrase must tolerate them.
const DIACRITIC_CLASS = "\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640";

/** Turns a plain literal phrase into a diacritic-tolerant regex source. */
function flexible(literal: string): string {
  return Array.from(literal)
    .map((ch) => {
      if (ch === " ") return "\\s+";
      if (ch === "ا") return `[اأإآ][${DIACRITIC_CLASS}]*`;
      if (ch === "ى") return `[ىي][${DIACRITIC_CLASS}]*`;
      if (ch === "ة") return `[ةه][${DIACRITIC_CLASS}]*`;
      const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return `${escaped}[${DIACRITIC_CLASS}]*`;
    })
    .join("");
}

// Diacritic marks only (harakat, sukun, shadda, tanwin, dagger alif, and
// Quranic annotation marks) — unlike normalizeArabic() in quran-search.ts,
// this does NOT swap letter variants (ة→ه, ى→ي, etc). It's for producing
// clean, shareable plain text that still reads as normal Arabic spelling,
// just without the vowel markings.
export function stripDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "") // tatweel
    .replace(/\s+/g, " ")
    .trim();
}

const REPORTING_VERBS = ["قال", "قالت", "يقول", "تقول"];
const PROPHET_MARKERS = ["رسول الله", "النبي"];

// A bounded, non-greedy "anything" gap. This is the actual fix: earlier
// code tried to hard-code the exact salutation phrase between the marker
// and the verb ("صلى الله عليه وسلم"), but wrote it as a plain literal
// instead of running it through flexible(). Real hadith text is fully
// diacritized, so that literal never matched, the optional group silently
// contributed nothing, and the surrounding pattern then required the verb
// to sit immediately (whitespace-only) next to the marker — which it
// never does, since the salutation phrase sits in between. Net effect:
// every pattern failed silently and splitHadithNarration always returned
// null. A bounded wildcard sidesteps needing to enumerate every possible
// salutation spelling/punctuation combination.
const GAP = `[\\s\\S]{0,60}?`;

function buildNarrationPatterns(): RegExp[] {
  const sources: string[] = [];
  for (const verb of REPORTING_VERBS) {
    for (const marker of PROPHET_MARKERS) {
      // "قال رسول الله ﷺ" — verb before the marker
      sources.push(`${flexible(verb)}${GAP}${flexible(marker)}`);
      // "(أن/سمعت) رسول الله ﷺ ... قال/يقول" — marker before the verb
      sources.push(`${flexible(marker)}${GAP}${flexible(verb)}`);
    }
  }
  return sources.map((s) => new RegExp(s, "g"));
}

const NARRATION_PATTERNS = buildNarrationPatterns();

// Characters that stay on the chain side even when they trail a match.
const CHAIN_SIDE_CHARS = new Set([" ", "\t", "\n", ":", "：", "،", ","]);

function skipChainSideChars(text: string, index: number): number {
  let i = index;
  while (i < text.length && CHAIN_SIDE_CHARS.has(text[i])) i++;
  return i;
}

// If the reporting verb came BEFORE the marker ("قال رسول الله ﷺ"), the
// salutation/greeting trails the match instead of being swallowed inside
// it. Absorb it here so it doesn't get colored as if it were the Prophet's
// own words.
const GREETING_AT_START = new RegExp(
  `^(?:${flexible("صلى الله عليه وسلم")}|${flexible(
    "صلى الله عليه وآله وسلم",
  )}|ﷺ)`,
);

function skipTrailingGreeting(text: string, index: number): number {
  let i = skipChainSideChars(text, index);
  const rest = text.slice(i);
  const match = GREETING_AT_START.exec(rest);
  if (match) {
    i += match[0].length;
    i = skipChainSideChars(text, i);
  }
  return i;
}

// ── Reference / citation detection ──
//
// Bug fixed here: this used to be a plain literal regex (e.g. checking for
// the exact substring "رواه"), but real hadith text is fully diacritized
// ("رَوَاهُ"), so it never matched — citations like "[رواه أبو داود]" were
// left inside the emphasized matn instead of being split into the muted
// reference line below it. Every trigger word is now run through the same
// flexible() diacritic-tolerant builder used for NARRATION_PATTERNS above.
// The leading "\[?" makes an opening bracket optional and applies to every
// trigger uniformly, instead of being hardcoded only onto the "رقم:" case
// like before — so a bracketed citation like "[رَوَاهُ أَبُو دَاوُدَ]" is
// now caught starting at its own opening bracket, not partway through it.
const REFERENCE_TRIGGERS = ["رواه", "أخرجه", "متفق عليه", "رقم:"];

function buildReferencePattern(): RegExp {
  const sources = REFERENCE_TRIGGERS.map((p) => flexible(p));
  return new RegExp(`\\s*\\[?(?:${sources.join("|")})`);
}

const REFERENCE_PATTERN = buildReferencePattern();

const DEBUG_HADITH_SPLIT =
  process.env.NODE_ENV !== "production" &&
  process.env.DEBUG_HADITH_SPLIT !== "0";

/**
 * Splits a hadith's Arabic text into the narration chain (isnad) and the
 * Prophet's ﷺ actual words (matn), so the caller can render them in
 * different colors. Returns null when no recognizable narration trigger is
 * found — callers should then render the whole text in the normal style.
 */
export function splitHadithNarration(text: string): HadithSplit | null {
  if (!text) return null;

  let bestEnd = -1;

  for (const pattern of NARRATION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const end = match.index + match[0].length;
      if (end > bestEnd) bestEnd = end;
      if (match[0].length === 0) pattern.lastIndex++;
    }
  }

  if (DEBUG_HADITH_SPLIT) {
    // TEMP DEBUG — remove once confirmed working.
    console.log("[splitHadithNarration] input:", text);
    console.log("[splitHadithNarration] raw bestEnd:", bestEnd);
  }

  if (bestEnd === -1) {
    if (DEBUG_HADITH_SPLIT) {
      console.log("[splitHadithNarration] no trigger matched -> null");
    }
    return null;
  }

  const splitAt = skipTrailingGreeting(text, bestEnd);
  const chain = text.slice(0, splitAt);

  const refMatch = REFERENCE_PATTERN.exec(text.slice(splitAt));

  let content = text.slice(splitAt);
  let reference = "";

  if (refMatch) {
    const refStart = splitAt + (refMatch.index ?? 0);
    content = text.slice(splitAt, refStart).trimEnd();
    reference = text.slice(refStart).trimStart();
  }

  if (DEBUG_HADITH_SPLIT) {
    console.log(
      "[splitHadithNarration] reference matched:",
      JSON.stringify(reference),
    );
  }

  return {
    chain,
    content,
    reference,
  };
}
