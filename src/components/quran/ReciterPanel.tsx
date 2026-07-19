"use client";

import { useState, useMemo } from "react";
import { CURATED_RECITERS, type CuratedReciter } from "@/lib/reciters";
import { useIsDesktop } from "@/hooks/useIsDesktop";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reciter: CuratedReciter) => void;
  locale: string;
  selectedId?: string;
  /** Desktop-only: collapses the docked panel to zero width for a
   * distraction-free reading view, without unmounting it. */
  collapsed?: boolean;
}

export default function ReciterPanel({
  isOpen,
  onClose,
  onSelect,
  locale,
  selectedId,
  collapsed = false,
}: Props) {
  const isAr = locale === "ar";
  const isDesktop = useIsDesktop(1024);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURATED_RECITERS;
    return CURATED_RECITERS.filter(
      (r) =>
        r.nameAr.includes(search.trim()) || r.nameEn.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (r: CuratedReciter) => {
    onSelect(r);
    if (!isDesktop) onClose();
  };

  const body = (
    <>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-arabic text-white text-lg font-bold">
          {isAr ? "اختر القارئ" : "Choose Reciter"}
        </h2>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-3 border-b border-white/5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن قارئ..." : "Search reciter..."}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-arabic text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          dir="rtl"
        />
      </div>

      <p className="px-4 pt-3 pb-1 text-white/30 text-xs font-arabic leading-relaxed">
        {isAr
          ? "كل قارئ هنا يوفر تلاوة دقيقة لكل آية على حدة — بدء التلاوة من أي آية دقيق دائماً"
          : "Every reciter here provides exact per-ayah audio — starting from any ayah is always precise."}
      </p>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelect(r)}
            className={`w-full text-right px-4 py-3 rounded-xl font-arabic text-sm transition-colors ${
              selectedId === r.id
                ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {isAr ? r.nameAr : r.nameEn}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/30 font-arabic text-sm">
            {isAr ? "لا توجد نتائج" : "No results"}
          </div>
        )}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <aside
        className="h-full bg-[#111] border-r border-white/10 flex flex-col flex-shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-in-out"
        style={{ width: collapsed ? 0 : 320, opacity: collapsed ? 0 : 1 }}
        dir="rtl"
        aria-hidden={collapsed}
      >
        <div className="w-80 h-full flex flex-col">{body}</div>
      </aside>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm h-full bg-[#111] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {body}
      </div>
    </div>
  );
}
