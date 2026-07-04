"use client";

import { useState, useEffect } from "react";
import { EVENT_CATEGORIES, type EventItem } from "@/lib/mosque-content";

export default function EventsSection({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? events : events.filter((e) => e.category === filter);
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const upcoming = sorted.filter((e) => new Date(e.date) >= new Date());
  const past = sorted.filter((e) => new Date(e.date) < new Date());

  const renderEvent = (event: EventItem, isPast = false) => {
    const meta = EVENT_CATEGORIES.find((c) => c.id === event.category);
    return (
      <div
        key={event.id}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
          isPast
            ? "opacity-60 border-gray-100"
            : "border-gray-100 hover:border-primary/30 hover:shadow-md"
        }`}
      >
        <div className="flex">
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
              {new Date(event.date).toLocaleDateString(
                isAr ? "ar-EG" : "en-US",
                { month: "short" },
              )}
            </span>
            <span className="font-arabic text-xs opacity-60">
              {new Date(event.date).getFullYear()}
            </span>
          </div>

          <div className="flex-1 p-4 text-right" dir="rtl">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <span className="text-xs px-2 py-0.5 rounded-full font-arabic bg-gray-100 text-gray-700">
                {meta?.icon} {isAr ? meta?.labelAr : meta?.labelEn}
              </span>
            </div>
            <h3 className="font-arabic text-base font-bold text-gray-800 mb-1">
              {isAr ? event.titleAr : event.titleEn || event.titleAr}
            </h3>
            {(event.descriptionAr || event.descriptionEn) && (
              <p className="font-arabic text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {isAr
                  ? event.descriptionAr
                  : event.descriptionEn || event.descriptionAr}
              </p>
            )}
            <div className="flex items-center gap-4 justify-end text-xs text-gray-400 font-arabic">
              <span>📍 {event.location}</span>
              <span>🕐 {event.time}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {["all", ...EVENT_CATEGORIES.map((c) => c.id)].map((cat) => {
          const meta = EVENT_CATEGORIES.find((c) => c.id === cat);
          return (
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
                : `${meta?.icon} ${isAr ? meta?.labelAr : meta?.labelEn}`}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      )}

      {!loading && upcoming.length > 0 && (
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

      {!loading && past.length > 0 && (
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

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          {isAr ? "لا توجد فعاليات" : "No events found"}
        </div>
      )}
    </div>
  );
}
