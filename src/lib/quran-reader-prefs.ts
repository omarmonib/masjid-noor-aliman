// src/lib/quran-reader-prefs.ts
"use client";

import { TOTAL_MUSHAF_PAGES } from "@/lib/quran-page";
import type { CuratedReciter } from "@/lib/reciters";

/**
 * Single source of truth for Quran reader UI preferences that persist
 * across sessions — last-read page, zoom level, and selected reciter.
 * Extracted from MushafViewer.tsx (where this logic previously lived
 * privately in local functions/inline localStorage calls) so the
 * Settings page can read and write the exact same values MushafViewer
 * uses, without a second copy of the storage keys or validation logic
 * that could silently drift out of sync.
 *
 * This module does NOT change any values, keys, or validation rules —
 * every constant and every clamping/fallback behavior here is copied
 * verbatim from MushafViewer.tsx's previous private implementation.
 * MushafViewer itself is being refactored (separately) to call these
 * functions instead of its own local copies, so there is now exactly one
 * implementation of each preference.
 *
 * Focus Mode and settings-panel-hidden preferences already had their own
 * shared modules (quran-focus-prefs.ts, quran-panel-prefs.ts) before this
 * refactor — this file follows the same pattern for the remaining three
 * preferences that didn't yet have one.
 */

const LAST_PAGE_KEY = "quran:last-page";
const ZOOM_KEY = "quran:zoom";
const RECITER_KEY = "quran:selected-reciter";

export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 2.5;

export function getLastPage(): number {
  if (typeof window === "undefined") return 1;
  const stored = Number(localStorage.getItem(LAST_PAGE_KEY));
  return stored >= 1 && stored <= TOTAL_MUSHAF_PAGES ? stored : 1;
}

export function setLastPage(page: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_PAGE_KEY, String(page));
}

export function getZoom(): number {
  if (typeof window === "undefined") return 1;
  const stored = Number(localStorage.getItem(ZOOM_KEY));
  return stored >= MIN_ZOOM && stored <= MAX_ZOOM ? stored : 1;
}

/** Clamps to [MIN_ZOOM, MAX_ZOOM] and persists — returns the clamped
 * value so callers can immediately use it for local state too. */
export function setZoom(z: number): number {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  if (typeof window !== "undefined") {
    localStorage.setItem(ZOOM_KEY, String(clamped));
  }
  return clamped;
}

export function getSelectedReciter(): CuratedReciter | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(RECITER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CuratedReciter;
  } catch {
    return null;
  }
}

export function setSelectedReciter(reciter: CuratedReciter | null): void {
  if (typeof window === "undefined") return;
  if (reciter === null) {
    localStorage.removeItem(RECITER_KEY);
  } else {
    localStorage.setItem(RECITER_KEY, JSON.stringify(reciter));
  }
}
