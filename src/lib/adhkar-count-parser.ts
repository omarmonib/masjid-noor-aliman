// src/lib/adhkar-count-parser.ts
import { stripDiacritics } from "@/lib/hadith";

/**
 * Word → count map for the vocabulary actually used in this dataset's
 * repeat-count annotations. Deliberately small and literal — this is not
 * a general Arabic-numeral parser, just enough to catch the patterns
 * ("ثلاث مرات", "سبع مرات", "مائة مرة", "ثلاثاً وثلاثين"...) that appear
 * in adhkar-raw.json.
 */
const NUMBER_WORDS: Record<string, number> = {
  مرة: 1,
  مره: 1,
  مرتين: 2,
  ثلاث: 3,
  ثلاثا: 3,
  اربع: 4,
  اربعا: 4,
  خمس: 5,
  خمسا: 5,
  ست: 6,
  ستا: 6,
  سبع: 7,
  سبعا: 7,
  ثمان: 8,
  ثماني: 8,
  ثمانيا: 8,
  تسع: 9,
  تسعا: 9,
  عشر: 10,
  عشرا: 10,
  عشرة: 10,
  مائة: 100,
  مئة: 100,
};

// Trigger words that mark a clause as a repeat-count annotation at all
// (as opposed to unrelated text that happens to contain a number word).
const TRIGGER_WORDS = ["مرات", "مرة", "مره", "مرار"];

function parseNumberPhrase(phrase: string): number | null {
  const words = phrase.trim().split(/\s+/);

  // "X وثلاثين" — e.g. "ثلاثا وثلاثين" = 33
  const andThirtyIdx = words.indexOf("وثلاثين");
  if (andThirtyIdx > 0) {
    const base = NUMBER_WORDS[words[andThirtyIdx - 1]];
    if (base !== undefined) return base + 30;
  }

  for (const w of words) {
    if (NUMBER_WORDS[w] !== undefined) return NUMBER_WORDS[w];
  }
  return null;
}

/**
 * Best-effort extraction of the repeat count a dhikr's own TEXT declares
 * for itself (e.g. "(سبع مرات)" → 7).
 *
 * This is intentionally conservative and ONLY meant for a development-time
 * sanity check against the dataset's stored `count` (see
 * auditAdhkarRepeatCounts in adhkar.ts) — never to drive the UI directly.
 * It cannot reliably tell an instruction ("say this seven times") apart
 * from a hadith merely narrating a number in prose (e.g. "...sought
 * forgiveness more than seventy times a day..."), so to keep false
 * positives low it:
 *   - only looks at a clause immediately following the dhikr's own
 *     closing "))" (the convention this dataset uses for annotations),
 *     never anything still inside the quoted matn;
 *   - bails out entirely if the clause is a "more than N" frequency
 *     description ("أكثر من ...") rather than a plain instruction.
 * Returns null when no such annotation is found, which simply means
 * "nothing to check" (the stored count is trusted as-is).
 */
export function parseDeclaredRepeatCount(rawText: string): number | null {
  const text = stripDiacritics(rawText);
  if (/اكثر من/.test(text)) return null;

  // Pattern A: parenthetical group right after the closing "))",
  // e.g. "...الْعَظِيمِ)) (سَبْعَ مَرّاتٍ)."
  const parenAfterClose = /\)\)\s*\(([^)]*)\)/.exec(text);
  if (parenAfterClose) {
    const phrase = parenAfterClose[1];
    if (TRIGGER_WORDS.some((w) => phrase.includes(w))) {
      const n = parseNumberPhrase(phrase);
      if (n !== null) return n;
    }
  }

  // Pattern B: bare trailing clause right after "))" (not parenthesized),
  // e.g. "...القُدُّوسِ)) ثلاث مرَّاتٍ والثَّالِثَةُ ..."
  const bareAfterClose = /\)\)\s*([^.]*)/.exec(text);
  if (bareAfterClose) {
    const firstWords = bareAfterClose[1]
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(" ");
    if (TRIGGER_WORDS.some((w) => firstWords.includes(w))) {
      const n = parseNumberPhrase(firstWords);
      if (n !== null) return n;
    }
  }

  return null;
}
