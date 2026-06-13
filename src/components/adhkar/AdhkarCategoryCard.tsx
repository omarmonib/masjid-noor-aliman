"use client";

import { useState } from "react";
import type { AdhkarCategoryData } from "@/lib/adhkar";
import DhikrCard from "./DhikrCard";

interface Props {
  category: AdhkarCategoryData;
  locale: string;
}

const ICON_BG: Record<string, string> = {
  "🌅": "#FEF3C7",
  "🌙": "#EDE9FE",
  "☀️": "#FEF9C3",
  "🚿": "#CFFAFE",
  "✅": "#D1FAE5",
  "💧": "#DBEAFE",
  "🤲": "#E0F2FE",
  "🚪": "#DCFCE7",
  "🏠": "#D1FAE5",
  "🕌": "#D1FAE5",
  "📢": "#FEF3C7",
  "🙏": "#F3E8FF",
  "🙇": "#EDE9FE",
  "⬇️": "#FCE7F3",
  "☝️": "#FFE4E6",
  "✨": "#D1FAE5",
  "🌿": "#DCFCE7",
  "💚": "#D1FAE5",
  "🤍": "#F1F5F9",
  "🌧️": "#DBEAFE",
  "🍔": "#FEF9C3",
  "🍽️": "#FEF3C7",
  "🤧": "#CFFAFE",
  "💍": "#FCE7F3",
  "😤": "#FEE2E2",
  "🚗": "#DBEAFE",
  "✈️": "#E0F2FE",
  "🕋": "#FEF3C7",
  "💫": "#F3E8FF",
  "📿": "#D1FAE5",
};

const ICON_COLOR: Record<string, string> = {
  "🌅": "#D97706",
  "🌙": "#7C3AED",
  "☀️": "#CA8A04",
  "🚿": "#0891B2",
  "✅": "#059669",
  "💧": "#2563EB",
  "🤲": "#0284C7",
  "🚪": "#16A34A",
  "🏠": "#059669",
  "🕌": "#1B6B4A",
  "📢": "#D97706",
  "🙏": "#9333EA",
  "🙇": "#7C3AED",
  "⬇️": "#DB2777",
  "☝️": "#E11D48",
  "✨": "#059669",
  "🌿": "#16A34A",
  "💚": "#059669",
  "🤍": "#475569",
  "🌧️": "#2563EB",
  "🍽️": "#D97706",
  "🤧": "#0891B2",
  "💍": "#DB2777",
  "😤": "#DC2626",
  "🚗": "#2563EB",
  "✈️": "#0284C7",
  "🕋": "#B45309",
  "💫": "#9333EA",
  "📿": "#059669",
};

export default function AdhkarCategoryCard({ category, locale }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isAr = locale === "ar";

  const bg = ICON_BG[category.icon] || "#D1FAE5";
  const color = ICON_COLOR[category.icon] || "#1B6B4A";

  return (
    <>
      {/* Card */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center w-full"
      >
        {/* Icon circle */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm"
          style={{ backgroundColor: bg }}
        >
          {category.icon}
        </div>

        {/* Label */}
        <p
          className="font-arabic text-sm font-bold leading-snug"
          style={{ color }}
        >
          {isAr ? category.labelAr : category.labelEn}
        </p>

        {/* Count */}
        <span className="text-xs text-gray-400 font-arabic">
          {category.adhkar.length} {isAr ? "ذكر" : "adhkar"}
        </span>
      </button>

      {/* Full screen modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col">
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-5 py-4 text-white"
            style={{
              background: `linear-gradient(to right, #0D3D28, #1B6B4A)`,
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
            <div className="text-center">
              <p className="font-arabic text-lg font-bold">
                {isAr ? category.labelAr : category.labelEn}
              </p>
              <p className="text-white/60 text-xs font-arabic">
                {category.adhkar.length} {isAr ? "ذكر" : "adhkar"}
              </p>
            </div>
            <div className="text-2xl w-10 h-10 flex items-center justify-center">
              {category.icon}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto bg-surface px-4 py-6 space-y-4">
            {category.adhkar.map((dhikr) => (
              <DhikrCard key={dhikr.id} dhikr={dhikr} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
