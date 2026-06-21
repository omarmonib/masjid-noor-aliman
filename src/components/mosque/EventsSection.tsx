"use client";

import { useState } from "react";
import { EVENTS, type Event } from "@/data/news";

const CATEGORY_ICONS: Record<string, string> = {
  lecture: "🎙️",
  quran: "📖",
  charity: "💚",
  celebration: "🌙",
  other: "📌",
};

const CATEGORY_COLORS: Record<string, string> = {
  lecture: "bg-purple-100 text-purple-700",
  quran: "bg-green-100 text-green-700",
  charity: "bg-pink-100 text-pink-700",
  celebration: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-700",
};

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  lecture: { ar: "محاضرة", en: "Lecture" },
  quran: { ar: "قرآن", en: "Quran" },
  charity: { ar: "خيري", en: "Charity" },
  celebration: { ar: "احتفال", en: "Celebration" },
  other: { ar: "أخرى", en: "Other" },
};

export default function EventsSection({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? EVENTS : EVENTS.filter((e) => e.category === filter);

  // Sort by date
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const upcoming = sorted.filter((e) => new Date(e.date) >= new Date());
  const past = sorted.filter((e) => new Date(e.date) < new Date());

  const renderEvent = (event: Event, isPast = false) => (
    <div
      key={event.id}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        isPast
          ? "opacity-60 border-gray-100"
          : "border-gray-100 hover:border-primary/30 hover:shadow-md"
      }`}
    >
      <div className="flex">
        {/* Date column */}
        <div
          className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-5 text-white"
          style={{
            background: isPast
              ? "#9CA3AF"
              : "linear-gradient(135deg, #0D3D28, #1B6B4A)",
          }}
        >
          <span className="font-arabic text-2xl font-bold">
            {new Date(event.date).getDate()}
          </span>
          <span className="font-arabic text-xs opacity-80">
            {new Date(event.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
              month: "short",
            })}
          </span>
          <span className="font-arabic text-xs opacity-60">
            {new Date(event.date).getFullYear()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 text-right" dir="rtl">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-arabic ${CATEGORY_COLORS[event.category]}`}
            >
              {CATEGORY_ICONS[event.category]}{" "}
              {isAr
                ? CATEGORY_LABELS[event.category].ar
                : CATEGORY_LABELS[event.category].en}
            </span>
          </div>
          <h3 className="font-arabic text-base font-bold text-gray-800 mb-1">
            {isAr ? event.titleAr : event.titleEn}
          </h3>
          <p className="font-arabic text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {isAr ? event.descriptionAr : event.descriptionEn}
          </p>
          <div className="flex items-center gap-4 justify-end text-xs text-gray-400 font-arabic">
            <span>📍 {event.location}</span>
            <span>🕐 {event.time}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "lecture", "quran", "charity", "celebration", "other"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full font-arabic text-sm transition-all ${
                filter === cat
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
              }`}
            >
              {cat === "all"
                ? isAr
                  ? "الكل"
                  : "All"
                : `${CATEGORY_ICONS[cat]} ${isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}`}
            </button>
          ),
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="font-arabic text-lg font-bold text-gray-800">
              {isAr ? "الفعاليات القادمة" : "Upcoming Events"}
            </h2>
          </div>
          <div className="space-y-3">
            {upcoming.map((e) => renderEvent(e, false))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gray-300 rounded-full" />
            <h2 className="font-arabic text-lg font-bold text-gray-500">
              {isAr ? "الفعاليات السابقة" : "Past Events"}
            </h2>
          </div>
          <div className="space-y-3">
            {past.map((e) => renderEvent(e, true))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          {isAr ? "لا توجد فعاليات" : "No events found"}
        </div>
      )}
    </div>
  );
}
