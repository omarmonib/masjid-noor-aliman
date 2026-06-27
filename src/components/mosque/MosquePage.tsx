"use client";

import { useState } from "react";

interface Props {
  locale: string;
}

type Tab = "news" | "events" | "about";

export default function MosquePage({ locale }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const isAr = locale === "ar";

  const tabs: { id: Tab; labelAr: string; labelEn: string; icon: string }[] = [
    { id: "news", labelAr: "الأخبار والإعلانات", labelEn: "News", icon: "📰" },
    { id: "events", labelAr: "الفعاليات", labelEn: "Events", icon: "📅" },
    { id: "about", labelAr: "عن المسجد", labelEn: "About", icon: "🕌" },
  ];

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-12 px-4 text-center text-white">
        <div className="text-5xl mb-4">🕌</div>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
        </h1>
        <p className="text-white/70 font-arabic">
          {isAr
            ? "بلبيس — محافظة الشرقية — مصر"
            : "Belbeis — Al-Sharqia — Egypt"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-arabic text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder */}
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🔧</div>
        <h2 className="font-arabic text-2xl font-bold text-gray-700 mb-3">
          {isAr ? "سيتم إضافة التفاصيل قريباً" : "Details will be added soon"}
        </h2>
        <p className="font-arabic text-gray-400 text-base">
          {isAr
            ? "نعمل على تحديث هذا القسم. تابعونا للمزيد."
            : "We are working on updating this section. Stay tuned."}
        </p>
      </div>
    </main>
  );
}
