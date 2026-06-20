"use client";

import { useState, useEffect, useRef} from "react";
import { COLLECTIONS, type Hadith } from "@/lib/hadith";
import HadithCard from "./HadithCard";

interface Props {
  collection: string;
  locale: string;
  onBack: () => void;
  onSwitchCollection: (id: string) => void;
}

const PAGE_SIZE = 15;

// Cache full collections in memory across renders
const collectionCache: Record<string, Hadith[]> = {};

export default function HadithReader({
  collection,
  locale,
  onBack,
  onSwitchCollection,
}: Props) {
  const isAr = locale === "ar";
  const col = COLLECTIONS.find((c) => c.id === collection)!;

  const [allHadiths, setAllHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [jumpTo, setJumpTo] = useState("");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Load full collection once
  useEffect(() => {
    setLoading(true);
    setError("");
    setAllHadiths([]);
    setPage(1);
    setSearchQuery("");
    setActiveSearch("");
    setHighlightId(null);

    if (collectionCache[collection]) {
      setAllHadiths(collectionCache[collection]);
      setLoading(false);
      return;
    }

    fetch(`/api/hadith?collection=${collection}`)
      .then((r) => r.json())
      .then((data) => {
        const raw: { id?: number; hadithnumber?: number; text?: string }[] =
          data.hadiths || data.hadith || [];
        const parsed: Hadith[] = raw
          .filter((h) => h.text?.trim())
          .map((h, i) => ({
            id: h.id ?? h.hadithnumber ?? i + 1,
            collection,
            bookNumber: 1,
            hadithNumber: h.id ?? h.hadithnumber ?? i + 1,
            textAr: h.text!,
            textEn: "",
          }));
        collectionCache[collection] = parsed;
        setAllHadiths(parsed);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [collection]);

  // Scroll to highlighted hadith
  useEffect(() => {
    if (highlightId !== null && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightId, page]);

  // Filtered list
  const filtered = activeSearch
    ? allHadiths.filter((h) => h.textAr.includes(activeSearch))
    : allHadiths;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageHadiths = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => {
    setActiveSearch(searchQuery.trim());
    setPage(1);
    setHighlightId(null);
  };

  const clearSearch = () => {
    setActiveSearch("");
    setSearchQuery("");
    setPage(1);
    setHighlightId(null);
  };

  const handleJump = () => {
    const n = parseInt(jumpTo);
    if (isNaN(n)) return;
    setJumpTo("");
    setActiveSearch("");
    setSearchQuery("");
    // Find this hadith in allHadiths
    const idx = allHadiths.findIndex((h) => h.hadithNumber === n);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
    setPage(targetPage);
    setHighlightId(n);
  };

  const resetToStart = () => {
    clearSearch();
    setPage(1);
    setHighlightId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-8 px-4 text-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-arabic transition-colors"
          >
            → {isAr ? "كتب الحديث" : "Collections"}
          </button>

          {/* Book switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-arabic transition-colors"
            >
              {isAr ? "تغيير الكتاب" : "Switch Book"}
              <span className="text-xs text-white/50">▼</span>
            </button>
            {showSwitcher && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-[#0a2e1c] border border-white/20 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                {COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSwitchCollection(c.id);
                      setShowSwitcher(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${c.id === collection ? "bg-white/20" : ""}`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <div className="text-right flex-1">
                      <p className="font-arabic text-white text-sm font-medium">
                        {isAr ? c.nameAr : c.nameEn}
                      </p>
                      <p className="font-arabic text-white/40 text-xs">
                        {c.totalHadith.toLocaleString()}{" "}
                        {isAr ? "حديث" : "hadiths"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clickable title → reset to page 1 */}
        <div className="text-center">
          <button onClick={resetToStart} className="group">
            <h1 className="font-arabic text-3xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">
              {isAr ? col.nameAr : col.nameEn}
            </h1>
          </button>
          <p className="text-white/60 font-arabic text-sm">
            {loading
              ? isAr
                ? "جارٍ التحميل..."
                : "Loading..."
              : `${allHadiths.length.toLocaleString()} ${isAr ? "حديث محمّل" : "hadiths loaded"}`}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                isAr ? "ابحث بكلمة في الحديث..." : "Search by keyword..."
              }
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-right"
              dir="rtl"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="bg-primary text-white px-4 py-2.5 rounded-xl font-arabic text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {isAr ? "🔍 بحث" : "🔍 Search"}
            </button>
            {activeSearch && (
              <button
                onClick={clearSearch}
                className="bg-gray-100 text-gray-600 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Jump */}
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={jumpTo}
              onChange={(e) => setJumpTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJump()}
              placeholder={
                isAr ? "اذهب إلى حديث رقم..." : "Jump to hadith #..."
              }
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] text-right"
              dir="rtl"
              disabled={loading}
            />
            <button
              onClick={handleJump}
              disabled={loading || !jumpTo}
              className="bg-[#C9A84C] text-white px-4 py-2.5 rounded-xl font-arabic text-sm hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-40"
            >
              {isAr ? "اذهب" : "Go"}
            </button>
          </div>
        </div>

        {/* Search result count */}
        {activeSearch && !loading && (
          <div
            className={`text-center font-arabic text-sm py-2 px-4 rounded-xl border ${
              filtered.length > 0
                ? "bg-primary/5 text-primary border-primary/20"
                : "bg-red-50 text-red-500 border-red-100"
            }`}
          >
            {filtered.length > 0
              ? `${isAr ? "وُجد" : "Found"} ${filtered.length.toLocaleString()} ${isAr ? `نتيجة عن "${activeSearch}"` : `results for "${activeSearch}"`}`
              : isAr
                ? `لم يُوجد نتائج عن "${activeSearch}"`
                : `No results for "${activeSearch}"`}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="font-arabic text-gray-500 font-medium mb-1">
                {isAr ? "جارٍ تحميل الكتاب كاملاً..." : "Loading full book..."}
              </p>
              <p className="font-arabic text-gray-400 text-sm">
                {isAr
                  ? "يتم تحميل الكتاب مرة واحدة ثم البحث فوري"
                  : "Book loads once, then search is instant"}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="font-arabic text-red-500 mb-3">
              {isAr ? "حدث خطأ في التحميل" : "Failed to load"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-xl font-arabic text-sm"
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {/* Hadiths */}
        {!loading &&
          !error &&
          pageHadiths.map((h) => (
            <div
              key={h.hadithNumber}
              ref={h.hadithNumber === highlightId ? highlightRef : undefined}
            >
              <HadithCard
                hadith={h}
                locale={locale}
                collectionNameAr={col.nameAr}
                collectionNameEn={col.nameEn}
                highlighted={h.hadithNumber === highlightId}
              />
            </div>
          ))}

        {/* Empty search */}
        {!loading && !error && activeSearch && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-arabic">
            {isAr ? "لا توجد نتائج" : "No results"}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 gap-3">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0 });
              }}
              disabled={page <= 1}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-arabic text-sm hover:border-primary/40 disabled:opacity-30 transition-colors"
            >
              {isAr ? "‹ السابق" : "‹ Prev"}
            </button>
            <span className="font-arabic text-sm text-gray-500">
              {isAr
                ? `صفحة ${page} من ${totalPages} · إجمالي ${filtered.length.toLocaleString()}`
                : `Page ${page} of ${totalPages} · ${filtered.length.toLocaleString()} total`}
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0 });
              }}
              disabled={page >= totalPages}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-arabic text-sm hover:border-primary/40 disabled:opacity-30 transition-colors"
            >
              {isAr ? "التالي ›" : "Next ›"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
