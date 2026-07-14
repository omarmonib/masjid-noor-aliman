"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getReciterGroups,
  labelReciterMoshafs,
  type ReciterGroup,
  type ReciterMoshaf,
} from "@/lib/reciters";
import { useIsDesktop } from "@/hooks/useIsDesktop";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moshaf: ReciterMoshaf) => void;
  locale: string;
  selectedId?: string;
}

export default function ReciterPanel({
  isOpen,
  onClose,
  onSelect,
  locale,
  selectedId,
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

  useEffect(() => {
    if (!isOpen || groups.length > 0) return;
    setLoading(true);
    getReciterGroups()
      .then(setGroups)
      .catch(() =>
        setError(isAr ? "تعذّر تحميل القرّاء" : "Failed to load reciters"),
      )
      .finally(() => setLoading(false));
  }, [isOpen, groups.length, isAr]);

  // Land directly on the currently-playing reciter's list of recordings
  // whenever the panel is (re)opened.
  useEffect(() => {
    if (!isOpen || !selectedId) return;
    const reciterId = parseInt(selectedId.split("-")[0], 10);
    if (Number.isFinite(reciterId)) setSelectedReciterId(reciterId);
  }, [isOpen, selectedId]);

  const filteredGroups = useMemo(() => {
    const q = search.trim();
    if (!q) return groups;
    return groups.filter((g) => g.nameAr.includes(q));
  }, [groups, search]);

  const selectedGroup =
    groups.find((g) => g.reciterId === selectedReciterId) || null;

  const labeledMoshafs = useMemo(
    () =>
      selectedGroup ? labelReciterMoshafs(selectedGroup.moshafs, isAr) : [],
    [selectedGroup, isAr],
  );

  const handleSelect = (m: ReciterMoshaf) => {
    onSelect(m);
    if (!isDesktop) handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const goBackToReciters = () => setSelectedReciterId(null);

  if (!isOpen) return null;

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
          onClick={handleClose}
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

        {/* Step 1: pick a reciter */}
        {!loading &&
          !error &&
          !selectedGroup &&
          filteredGroups.map((g) => (
            <button
              key={g.reciterId}
              onClick={() => setSelectedReciterId(g.reciterId)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-right transition-colors"
            >
              <span className="text-white/30 text-xs">
                {g.moshafs.length} {isAr ? "رواية" : "editions"}
              </span>
              <span className="font-arabic text-white text-sm font-bold">
                {g.nameAr}
              </span>
            </button>
          ))}

        {!loading &&
          !error &&
          !selectedGroup &&
          filteredGroups.length === 0 && (
            <div className="text-center py-10 text-white/30 font-arabic text-sm">
              {isAr ? "لا توجد نتائج" : "No results"}
            </div>
          )}

        {/* Step 2: pick a recording type, only the ones this reciter actually has */}
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

  // Docked: a plain flex sibling (no `fixed`), meant to be rendered right
  // next to the scrollable Mushaf area so it takes its own column and the
  // Mushaf keeps the rest — see MushafViewer's layout wrapper.
  if (isDesktop) {
    return (
      <aside
        className="w-80 flex-shrink-0 h-full bg-[#111] border-r border-white/10 flex flex-col"
        dir="rtl"
      >
        {body}
      </aside>
    );
  }

  // Narrow / mobile: overlay drawer, same as before.
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 flex justify-end"
      onClick={handleClose}
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
