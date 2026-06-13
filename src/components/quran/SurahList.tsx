"use client";

import { useState } from "react";
import Link from "next/link";
import type { Surah } from "@/lib/quran-reader";

interface Props {
  surahs: Surah[];
  locale: string;
}

export default function SurahList({ surahs, locale }: Props) {
  const [search, setSearch] = useState("");
  const isAr = locale === "ar";

  const filtered = surahs.filter(
    (s) =>
      s.nameArabic.includes(search) ||
      s.nameSimple.toLowerCase().includes(search.toLowerCase()) ||
      String(s.id).includes(search),
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن سورة..." : "Search surah..."}
          className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 font-arabic text-right shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          dir="rtl"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg">
          🔍
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((surah) => (
          <Link
            key={surah.id}
            href={`/${locale}/quran/${surah.id}`}
            className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            {/* Number */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-arabic text-sm font-bold text-primary">
                {surah.id}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-right">
              <p className="font-arabic text-lg font-bold text-gray-800 group-hover:text-primary transition-colors">
                {surah.nameArabic}
              </p>
              <p className="font-arabic text-xs text-gray-400">
                {surah.nameTranslation} ·{" "}
                {surah.revelationPlace === "makkah" ? "مكية" : "مدنية"} ·{" "}
                {surah.versesCount} {isAr ? "آية" : "verses"}
              </p>
            </div>

            {/* English name */}
            <div className="text-left flex-shrink-0">
              <p className="text-sm text-gray-400 font-latin">
                {surah.nameSimple}
              </p>
            </div>

            {/* Arrow */}
            <span className="text-gray-300 group-hover:text-primary transition-colors text-lg">
              ←
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          لا توجد نتائج
        </div>
      )}
    </div>
  );
}
