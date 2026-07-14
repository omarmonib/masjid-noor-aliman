"use client";

export interface ReadingBookmark {
  pageNumber: number;
  surahId: number;
  surahName: string;
  juzNumber: number;
  savedAt: string;
}

export interface MemorizationBookmark {
  pageNumber: number;
  verseKey: string;
  notes: string;
  savedAt: string;
}

const READING_KEY = "quran:reading-bookmark";
const MEMO_KEY = "quran:memorization-bookmark";

export function getReadingBookmark(): ReadingBookmark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(READING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveReadingBookmark(b: Omit<ReadingBookmark, "savedAt">) {
  const entry: ReadingBookmark = { ...b, savedAt: new Date().toISOString() };
  localStorage.setItem(READING_KEY, JSON.stringify(entry));
  return entry;
}

export function clearReadingBookmark() {
  localStorage.removeItem(READING_KEY);
}

export function getMemorizationBookmark(): MemorizationBookmark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMemorizationBookmark(
  b: Omit<MemorizationBookmark, "savedAt">,
) {
  const entry: MemorizationBookmark = {
    ...b,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(MEMO_KEY, JSON.stringify(entry));
  return entry;
}

export function clearMemorizationBookmark() {
  localStorage.removeItem(MEMO_KEY);
}
