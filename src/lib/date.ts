// src/lib/date.ts

// Egypt does not currently observe DST — fixed UTC+2 offset.
// This is the single source of truth for "what day is it in Belbeis
// right now," used anywhere content rotates daily (daily verse, daily
// hadith, etc). Previously duplicated independently in lib/quran.ts and
// lib/hadith.ts with different implementations, which could disagree
// near local midnight — see lib/hadith.ts and lib/quran.ts history.
const CAIRO_OFFSET_HOURS = 2;

export function getCairoDayOfYear(): number {
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
