"use client";

import { Play } from "lucide-react";

interface Props {
  verseKey: string;
  x: number;
  y: number;
  locale: string;
  onStartFromHere: () => void;
  onClose: () => void;
}

export default function AyahActionMenu({
  verseKey,
  x,
  y,
  locale,
  onStartFromHere,
  onClose,
}: Props) {
  const isAr = locale === "ar";

  return (
    <div className="fixed inset-0 z-[85]" onClick={onClose}>
      <div
        className="absolute bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl py-1.5 min-w-[210px]"
        style={{
          left: Math.min(x, window.innerWidth - 230),
          top: Math.min(y, window.innerHeight - 80),
        }}
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="px-3 py-1.5 border-b border-white/10">
          <span className="text-white/40 text-xs font-mono">{verseKey}</span>
        </div>
        <button
          onClick={() => {
            onStartFromHere();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors text-sm font-arabic text-right"
        >
          <Play size={14} className="text-[#C9A84C] flex-shrink-0" />
          {isAr ? "ابدأ التلاوة من هنا" : "Start Recitation From Here"}
        </button>
      </div>
    </div>
  );
}
