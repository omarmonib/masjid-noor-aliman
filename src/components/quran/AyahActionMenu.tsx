"use client";

import {
  Play,
  Repeat1,
  FlagTriangleRight,
  FlagTriangleLeft,
  ListPlus,
  Copy,
  Share2,
  Bookmark,
} from "lucide-react";

interface Props {
  verseKey: string;
  x: number;
  y: number;
  locale: string;
  onStartFromHere: () => void;
  onRepeatAyah: () => void;
  onAddToSelection: () => void;
  onStartSelection: () => void;
  onEndSelection: () => void;
  onCopyAyah: () => void;
  onShareAyah: () => void;
  onBookmark: () => void;
  onClose: () => void;
}

export default function AyahActionMenu({
  verseKey,
  x,
  y,
  locale,
  onStartFromHere,
  onRepeatAyah,
  onAddToSelection,
  onStartSelection,
  onEndSelection,
  onCopyAyah,
  onShareAyah,
  onBookmark,
  onClose,
}: Props) {
  const isAr = locale === "ar";

  const run = (action: () => void) => {
    action();
    onClose();
  };

  const items: {
    icon: typeof Play;
    labelAr: string;
    labelEn: string;
    onClick: () => void;
    color?: string;
  }[] = [
    {
      icon: Play,
      labelAr: "ابدأ التلاوة من هنا",
      labelEn: "Start Recitation From Here",
      onClick: onStartFromHere,
      color: "#C9A84C",
    },
    {
      icon: Repeat1,
      labelAr: "كرّر هذه الآية",
      labelEn: "Repeat This Ayah",
      onClick: onRepeatAyah,
      color: "#C9A84C",
    },
    {
      icon: ListPlus,
      labelAr: "أضف إلى تحديد الحفظ",
      labelEn: "Add to Memorization Selection",
      onClick: onAddToSelection,
      color: "#7C9A82",
    },
    {
      icon: FlagTriangleRight,
      labelAr: "بداية التحديد",
      labelEn: "Start Selection",
      onClick: onStartSelection,
      color: "#7C9A82",
    },
    {
      icon: FlagTriangleLeft,
      labelAr: "نهاية التحديد",
      labelEn: "End Selection",
      onClick: onEndSelection,
      color: "#7C9A82",
    },
    {
      icon: Copy,
      labelAr: "نسخ الآية",
      labelEn: "Copy Ayah",
      onClick: onCopyAyah,
    },
    {
      icon: Share2,
      labelAr: "مشاركة الآية",
      labelEn: "Share Ayah",
      onClick: onShareAyah,
    },
    {
      icon: Bookmark,
      labelAr: "علامة مرجعية",
      labelEn: "Bookmark",
      onClick: onBookmark,
    },
  ];

  return (
    <div className="fixed inset-0 z-[85]" onClick={onClose}>
      <div
        className="absolute bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl py-1.5 min-w-[230px] max-h-[80vh] overflow-y-auto"
        style={{
          left: Math.min(x, window.innerWidth - 250),
          top: Math.min(y, window.innerHeight - 380),
        }}
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="px-3 py-1.5 border-b border-white/10">
          <span className="text-white/40 text-xs font-mono">{verseKey}</span>
        </div>
        {items.map(({ icon: Icon, labelAr, labelEn, onClick, color }, i) => (
          <button
            key={i}
            onClick={() => run(onClick)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors text-sm font-arabic text-right"
          >
            <Icon
              size={14}
              className="flex-shrink-0"
              style={{ color: color || "rgba(255,255,255,0.5)" }}
            />
            {isAr ? labelAr : labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
