"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getReciterGroups,
  labelReciterMoshafs,
  type ReciterGroup,
  type ReciterMoshaf,
} from "@/lib/reciters";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { ChevronDown } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moshaf: ReciterMoshaf) => void;
  locale: string;
  selectedId?: string;
  /** Desktop-only: collapses the docked panel to zero width for a
   * distraction-free reading view, without unmounting it — search text,
   * expanded accordion groups, and the reciter drilldown step all survive
   * the toggle, and the width animates smoothly instead of popping. */
  collapsed?: boolean;
}

function arabicFirstLetter(name: string): string {
  const trimmed = name.trim();
  const stripped = trimmed.replace(/^(الشيخ|الشيخة)\s+/, "");
  return (stripped[0] || trimmed[0] || "#").toUpperCase();
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
  const [groups, setGroups] = useState<ReciterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReciterId, setSelectedReciterId] = useState<number | null>(
    null,
  );
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(
    new Set(),
  );

  // On desktop the panel is always mounted (just visually collapsed), so
  // fetch as soon as we know we're on desktop rather than waiting for it
  // to be opened.
  const shouldFetch = isDesktop || isOpen;

  useEffect(() => {
    if (!shouldFetch || groups.length > 0) return;
    setLoading(true);
    getReciterGroups()
      .then(setGroups)
      .catch(() =>
        setError(isAr ? "تعذّر تحميل القرّاء" : "Failed to load reciters"),
      )
      .finally(() => setLoading(false));
  }, [shouldFetch, groups.length, isAr]);

  // Land directly on the currently-playing reciter's recordings whenever
  // the panel is (re)opened / uncollapsed.
  useEffect(() => {
    if (!isOpen && collapsed) return;
    if (!selectedId) return;
    const reciterId = parseInt(selectedId.split("-")[0], 10);
    if (Number.isFinite(reciterId)) setSelectedReciterId(reciterId);
  }, [isOpen, collapsed, selectedId]);

  const letterGroups = useMemo(() => {
    const q = search.trim();
    const filtered = q ? groups.filter((g) => g.nameAr.includes(q)) : groups;
    const byLetter = new Map<string, ReciterGroup[]>();
    for (const g of filtered) {
      const letter = arabicFirstLetter(g.nameAr);
      if (!byLetter.has(letter)) byLetter.set(letter, []);
      byLetter.get(letter)!.push(g);
    }
    return Array.from(byLetter.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "ar"),
    );
  }, [groups, search]);

  // Searching implicitly expands every matching group so results are never
  // hidden behind a collapsed accordion.
  useEffect(() => {
    if (!search.trim()) return;
    setExpandedLetters(new Set(letterGroups.map(([letter]) => letter)));
  }, [search, letterGroups]);

  const toggleLetter = (letter: string) => {
    setExpandedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  };

  const selectedGroup =
    groups.find((g) => g.reciterId === selectedReciterId) || null;

  const labeledMoshafs = useMemo(
    () =>
      selectedGroup ? labelReciterMoshafs(selectedGroup.moshafs, isAr) : [],
    [selectedGroup, isAr],
  );

  const handleSelect = (m: ReciterMoshaf) => {
    onSelect(m);
    if (!isDesktop) onClose();
  };

  const goBackToReciters = () => setSelectedReciterId(null);

  const body = (
    <>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {selectedGroup ? (
          <button
            onClick={goBackToReciters}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-arabic transition-colors"
          >
            → {isAr ? "كل القراء" : "All reciters"}
          </button>
        ) : (
          <h2 className="font-arabic text-white text-lg font-bold">
            {isAr ? "اختر القارئ" : "Choose Reciter"}
          </h2>
        )}
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          ✕
        </button>
      </div>

      {!selectedGroup && (
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
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {loading && (
          <div className="text-center py-10 text-white/40 font-arabic text-sm">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-red-400 font-arabic text-sm">
            {error}
          </div>
        )}

        {/* Step 1: pick a reciter, grouped into alphabet accordions so the
           list doesn't force one long uninterrupted scroll. */}
        {!loading &&
          !error &&
          !selectedGroup &&
          letterGroups.map(([letter, letterReciters]) => {
            const isExpanded = expandedLetters.has(letter);
            return (
              <div
                key={letter}
                className="rounded-xl overflow-hidden bg-white/[0.03]"
              >
                <button
                  onClick={() => toggleLetter(letter)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <ChevronDown
                    size={14}
                    className={`text-white/40 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">
                      {letterReciters.length}
                    </span>
                    <span className="font-arabic text-[#C9A84C] text-sm font-bold">
                      {letter}
                    </span>
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-2 pb-2 space-y-1">
                    {letterReciters.map((g) => (
                      <button
                        key={g.reciterId}
                        onClick={() => setSelectedReciterId(g.reciterId)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-right transition-colors"
                      >
                        <span className="text-white/30 text-xs">
                          {g.moshafs.length} {isAr ? "رواية" : "editions"}
                        </span>
                        <span className="font-arabic text-white text-sm font-bold">
                          {g.nameAr}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && !error && !selectedGroup && letterGroups.length === 0 && (
          <div className="text-center py-10 text-white/30 font-arabic text-sm">
            {isAr ? "لا توجد نتائج" : "No results"}
          </div>
        )}

        {/* Step 2: pick a recording type — only the ones this reciter has */}
        {!loading && !error && selectedGroup && (
          <div className="space-y-1.5">
            <p className="font-arabic text-[#C9A84C] text-sm font-bold mb-2 px-1">
              {selectedGroup.nameAr}
            </p>
            {labeledMoshafs.map(({ moshaf, label }) => (
              <button
                key={moshaf.id}
                onClick={() => handleSelect(moshaf)}
                className={`w-full text-right px-3 py-2.5 rounded-xl font-arabic text-sm transition-colors ${
                  selectedId === moshaf.id
                    ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
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
        {/* Fixed-width inner wrapper keeps content laid out at full size
           while the outer <aside> animates width — prevents squish/reflow
           during the collapse/expand transition. */}
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
