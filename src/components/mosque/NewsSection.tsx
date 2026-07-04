"use client";

import { useState, useEffect } from "react";
import { NEWS_CATEGORIES, type NewsItem } from "@/lib/mosque-content";

export default function NewsSection({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? news : news.filter((n) => n.category === filter);

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-primary font-arabic text-sm mb-6 hover:gap-3 transition-all"
        >
          → {isAr ? "العودة للأخبار" : "Back to News"}
        </button>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs px-3 py-1 rounded-full font-arabic font-medium bg-primary/10 text-primary">
                {isAr
                  ? NEWS_CATEGORIES.find((c) => c.id === selected.category)
                      ?.labelAr
                  : NEWS_CATEGORIES.find((c) => c.id === selected.category)
                      ?.labelEn}
              </span>
              <span className="text-xs text-gray-400 font-arabic">
                {new Date(selected.publishedAt).toLocaleDateString(
                  isAr ? "ar-EG" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </div>
            <h1
              className="font-arabic text-2xl font-bold text-gray-800 text-right"
              dir="rtl"
            >
              {isAr ? selected.titleAr : selected.titleEn || selected.titleAr}
            </h1>
          </div>
          <div className="p-6">
            <p
              className="font-arabic text-lg leading-loose text-gray-700 text-right"
              dir="rtl"
            >
              {isAr
                ? selected.contentAr
                : selected.contentEn || selected.contentAr}
            </p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {["all", ...NEWS_CATEGORIES.map((c) => c.id)].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full font-arabic text-sm transition-all ${
              filter === cat
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}
          >
            {cat === "all"
              ? isAr
                ? "الكل"
                : "All"
              : isAr
                ? NEWS_CATEGORIES.find((c) => c.id === cat)?.labelAr
                : NEWS_CATEGORIES.find((c) => c.id === cat)?.labelEn}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {filtered.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelected(post)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-right hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 justify-end">
                    <span className="text-xs text-gray-400 font-arabic">
                      {new Date(post.publishedAt).toLocaleDateString(
                        isAr ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-arabic bg-primary/10 text-primary">
                      {isAr
                        ? NEWS_CATEGORIES.find((c) => c.id === post.category)
                            ?.labelAr
                        : NEWS_CATEGORIES.find((c) => c.id === post.category)
                            ?.labelEn}
                    </span>
                  </div>
                  <h3
                    className="font-arabic text-lg font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors"
                    dir="rtl"
                  >
                    {isAr ? post.titleAr : post.titleEn || post.titleAr}
                  </h3>
                  <p
                    className="font-arabic text-sm text-gray-500 leading-relaxed line-clamp-2"
                    dir="rtl"
                  >
                    {isAr
                      ? post.summaryAr || post.contentAr
                      : post.summaryEn || post.contentEn || post.contentAr}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                  ←
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-arabic">
          {isAr ? "لا توجد أخبار" : "No news found"}
        </div>
      )}
    </div>
  );
}
