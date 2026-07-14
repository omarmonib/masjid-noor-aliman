"use client";

import { useState, useEffect, useRef } from "react";
import {
  searchQuran,
  getPageForVerseKey,
  type QuranSearchResult,
} from "@/lib/quran-search";
import { SURAH_NAMES_AR } from "@/lib/surahs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  onNavigate: (page: number, verseKey: string) => void;
}

export default function QuranSearchPanel({
  isOpen,
  onClose,
  locale,
  onNavigate,
}: Props) {
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuranSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [navigatingKey, setNavigatingKey] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchQuran(query, 60);
        setResults(r);
        setError("");
      } catch {
        setError(isAr ? "تعذّر تحميل نص القرآن" : "Failed to load Quran text");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, isAr]);

  const handleResultClick = async (r: QuranSearchResult) => {
    if (navigatingKey) return;
    setNavigatingKey(r.key);
    try {
      const page = await getPageForVerseKey(r.key);
      onNavigate(page, r.key);
      onClose();
    } catch {
      setError(isAr ? "تعذّر فتح الآية" : "Failed to open verse");
    } finally {
      setNavigatingKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/60 flex items-start justify-center pt-16 px-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#111] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr ? "ابحث في القرآن الكريم..." : "Search the Quran..."
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-arabic text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
            dir="rtl"
          />
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {loading && (
            <div className="text-center py-8 text-white/40 font-arabic text-sm">
              {isAr ? "جارٍ البحث..." : "Searching..."}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-red-400 font-arabic text-sm">
              {error}
            </div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="text-center py-8 text-white/30 font-arabic text-sm">
              {isAr ? "لا توجد نتائج" : "No results"}
            </div>
          )}

          {!loading &&
            !error &&
            results.map((r) => (
              <button
                key={r.key}
                onClick={() => handleResultClick(r)}
                disabled={navigatingKey === r.key}
                className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/30 text-xs font-mono">
                    {navigatingKey === r.key ? "…" : r.key}
                  </span>
                  <span className="font-arabic text-[#C9A84C] text-xs font-bold">
                    {SURAH_NAMES_AR[r.surahId - 1]} · {r.ayah}
                  </span>
                </div>
                <p className="font-arabic text-white text-base leading-loose line-clamp-2">
                  {r.preview}
                </p>
              </button>
            ))}

          {!loading && !error && !query.trim() && (
            <div className="text-center py-8 text-white/30 font-arabic text-sm">
              {isAr
                ? "اكتب كلمة أو جزءاً من آية — لا داعي للتشكيل"
                : "Type a word or part of a verse — no diacritics needed"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
