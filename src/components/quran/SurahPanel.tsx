"use client";

import { useState, useEffect, useMemo } from "react";

interface SurahMeta {
  id: number;
  nameArabic: string;
  nameSimple: string;
  versesCount: number;
  revelationPlace: string;
}

interface RawChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
  revelation_place: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (surahId: number) => void;
  locale: string;
  currentSurahId?: number;
}

let surahListCache: SurahMeta[] | null = null;

export default function SurahPanel({
  isOpen,
  onClose,
  onSelect,
  locale,
  currentSurahId,
}: Props) {
  const isAr = locale === "ar";
  const [surahs, setSurahs] = useState<SurahMeta[]>(surahListCache ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!surahListCache);

  useEffect(() => {
    if (!isOpen || surahListCache) return;
    setLoading(true);
    fetch("https://api.quran.com/api/v4/chapters?language=ar")
      .then((r) => r.json())
      .then((data) => {
        const list: SurahMeta[] = (data.chapters || []).map(
          (c: RawChapter) => ({
            id: c.id,
            nameArabic: c.name_arabic,
            nameSimple: c.name_simple,
            versesCount: c.verses_count,
            revelationPlace: c.revelation_place,
          }),
        );
        surahListCache = list;
        setSurahs(list);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.nameArabic.includes(search.trim()) ||
        s.nameSimple.toLowerCase().includes(q) ||
        String(s.id).includes(q),
    );
  }, [surahs, search]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm h-full bg-[#111] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-arabic text-white text-lg font-bold">
            {isAr ? "السور" : "Surahs"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث عن سورة..." : "Search surah..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-arabic text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
            dir="rtl"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && (
            <div className="text-center py-10 text-white/40 font-arabic text-sm">
              {isAr ? "جارٍ التحميل..." : "Loading..."}
            </div>
          )}

          {!loading &&
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  currentSurahId === s.id
                    ? "bg-[#C9A84C]/20"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-white/10 text-white/70 text-xs flex items-center justify-center flex-shrink-0">
                  {s.id}
                </span>
                <div className="flex-1 text-right">
                  <p className="font-arabic text-white text-sm font-bold">
                    {s.nameArabic}
                  </p>
                  <p className="text-white/40 text-xs">
                    {s.versesCount} {isAr ? "آية" : "verses"} ·{" "}
                    {s.revelationPlace === "makkah"
                      ? isAr
                        ? "مكية"
                        : "Meccan"
                      : isAr
                        ? "مدنية"
                        : "Medinan"}
                  </p>
                </div>
              </button>
            ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-white/30 font-arabic text-sm">
              {isAr ? "لا توجد نتائج" : "No results"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
