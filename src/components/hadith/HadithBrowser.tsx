"use client";

import { useState } from "react";
import { COLLECTIONS, type Hadith } from "@/lib/hadith";
import HadithReader from "./HadithReader";

interface Props {
  locale: string;
  dailyHadith: Hadith | null;
}

type View = "home" | "reader";

export default function HadithBrowser({ locale, dailyHadith }: Props) {
  const isAr = locale === "ar";
  const [view, setView] = useState<View>("home");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<
    { col: string; hadiths: Hadith[] }[]
  >([]);
  const [globalSearching, setGlobalSearching] = useState(false);

  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) return;
    setGlobalSearching(true);
    setGlobalResults([]);
    const results = await Promise.all(
      COLLECTIONS.map(async (c) => {
        try {
          const res = await fetch(`/api/hadith?collection=${c.id}`);
          const data = await res.json();
          const raw = (data.hadiths || data.hadith || []) as {
            id?: number;
            text?: string;
          }[];
          const matched = raw
            .filter(
              (h): h is { id?: number; text: string } =>
                typeof h.text === "string" && h.text.includes(globalSearch.trim()),
            )
            .slice(0, 5)
            .map((h, i: number) => ({
              id: h.id ?? i + 1,
              collection: c.id,
              bookNumber: 1,
              hadithNumber: h.id ?? i + 1,
              textAr: h.text,
              textEn: "",
            }));
          return { col: c.id, hadiths: matched };
        } catch {
          return { col: c.id, hadiths: [] };
        }
      }),
    );
    setGlobalResults(results.filter((r) => r.hadiths.length > 0));
    setGlobalSearching(false);
  };

  if (view === "reader") {
    return (
      <HadithReader
        collection={selectedCollection}
        locale={locale}
        onBack={() => setView("home")}
        onSwitchCollection={(id) => setSelectedCollection(id)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-12 px-4 text-center text-white">
        <p className="font-arabic text-[#C9A84C] text-lg mb-2">
          وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ
        </p>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "الحديث الشريف" : "Hadith"}
        </h1>
        <p className="text-white/60 font-arabic text-sm">
          {isAr ? "كتب السنة النبوية المشرفة" : "Books of the Prophetic Sunnah"}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Global search */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="font-arabic text-lg font-bold text-gray-800">
              {isAr ? "البحث في جميع الكتب" : "Search All Books"}
            </h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
              placeholder={
                isAr
                  ? "ابحث في جميع كتب الحديث..."
                  : "Search across all hadith books..."
              }
              className="flex-1 bg-white border border-gray-200 rounded-xl px-5 py-3 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-right shadow-sm"
              dir="rtl"
            />
            <button
              onClick={handleGlobalSearch}
              disabled={globalSearching || !globalSearch.trim()}
              className="bg-primary text-white px-5 py-3 rounded-xl font-arabic text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {globalSearching ? "⏳" : isAr ? "🔍 بحث" : "🔍 Search"}
            </button>
          </div>

          {globalSearching && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="font-arabic text-gray-400 text-sm">
                {isAr
                  ? "جارٍ البحث في جميع الكتب..."
                  : "Searching all books..."}
              </p>
            </div>
          )}

          {globalResults.length > 0 && (
            <div className="space-y-4">
              {globalResults.map(({ col: colId, hadiths }) => {
                const c = COLLECTIONS.find((x) => x.id === colId)!;
                return (
                  <div
                    key={colId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCollection(colId);
                          setView("reader");
                        }}
                        className="font-arabic text-sm font-bold text-primary hover:underline"
                      >
                        {isAr ? c.nameAr : c.nameEn}
                      </button>
                      <span className="text-xs text-gray-400 font-arabic">
                        {hadiths.length} {isAr ? "نتائج" : "results"}
                      </span>
                    </div>
                    {hadiths.map((h) => (
                      <div
                        key={h.hadithNumber}
                        className="px-5 py-4 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => {
                              setSelectedCollection(colId);
                              setView("reader");
                            }}
                            className="text-xs text-gray-400 font-arabic hover:text-primary transition-colors"
                          >
                            {isAr
                              ? `عرض في ${c.nameAr}`
                              : `View in ${c.nameEn}`}
                          </button>
                          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {h.hadithNumber}
                          </span>
                        </div>
                        <p
                          className="font-arabic text-base leading-loose text-gray-800 text-right line-clamp-3"
                          dir="rtl"
                        >
                          {h.textAr}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Daily Hadith */}
        {dailyHadith && dailyHadith.textAr && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#C9A84C] rounded-full" />
              <h2 className="font-arabic text-lg font-bold text-gray-800">
                {isAr ? "حديث اليوم" : "Hadith of the Day"}
              </h2>
            </div>
            <div
              className="rounded-2xl p-6 text-white"
              style={{
                background: "linear-gradient(135deg, #0D3D28, #1B6B4A)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#C9A84C] text-lg">🌟</span>
                <span className="font-arabic text-[#C9A84C] text-sm">
                  {isAr ? "الأربعون النووية" : "40 Hadith Nawawi"} ·{" "}
                  {isAr ? "حديث" : "Hadith"} {dailyHadith.hadithNumber}
                </span>
              </div>
              <p
                className="font-arabic text-xl leading-loose text-right"
                dir="rtl"
              >
                {dailyHadith.textAr}
              </p>
            </div>
          </div>
        )}

        {/* Collections grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="font-arabic text-lg font-bold text-gray-800">
              {isAr ? "كتب الحديث" : "Hadith Collections"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLLECTIONS.map((col) => (
              <button
                key={col.id}
                onClick={() => {
                  setSelectedCollection(col.id);
                  setView("reader");
                }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group text-right"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  {col.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-arabic font-bold text-gray-800 group-hover:text-primary transition-colors">
                    {isAr ? col.nameAr : col.nameEn}
                  </p>
                  <p className="font-arabic text-xs text-gray-400 mt-0.5">
                    {col.totalHadith.toLocaleString()}{" "}
                    {isAr ? "حديث" : "hadiths"}
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-colors text-lg">
                  ←
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
