"use client";

import { useState, useEffect } from "react";
import {
  getReciterGroups,
  type ReciterGroup,
  type ReciterMoshaf,
} from "@/lib/reciters";

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
  const [groups, setGroups] = useState<ReciterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-arabic text-white text-lg font-bold">
            {isAr ? "اختر القارئ" : "Choose Reciter"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
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

          {!loading &&
            groups.map((g) => (
              <div key={g.reciterId}>
                <p className="font-arabic text-[#C9A84C] text-sm font-bold mb-2 px-1">
                  {g.nameAr}
                </p>
                <div className="space-y-1.5">
                  {g.moshafs.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelect(m)}
                      className={`w-full text-right px-3 py-2.5 rounded-xl font-arabic text-sm transition-colors ${
                        selectedId === m.id
                          ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                          : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {m.styleAr}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
