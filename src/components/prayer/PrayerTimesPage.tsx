"use client";

import { useState } from "react";
import DailyPrayers from "@/components/prayer/DailyPrayers";
import MonthlyTable from "@/components/prayer/MonthlyTable";
import QiblaCompass from "@/components/prayer/QiblaCompass";

interface Props {
  locale: string;
}

type Tab = "daily" | "monthly" | "qibla";

export default function PrayerTimesPage({ locale }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const isAr = locale === "ar";

  const tabs: { id: Tab; labelAr: string; labelEn: string; icon: string }[] = [
    { id: "daily", labelAr: "اليوم", labelEn: "Today", icon: "🕐" },
    { id: "monthly", labelAr: "الجدول الشهري", labelEn: "Monthly", icon: "📅" },
    { id: "qibla", labelAr: "اتجاه القبلة", labelEn: "Qibla", icon: "🧭" },
  ];

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-12 px-4 text-center text-white">
        <p className="font-arabic text-[#C9A84C] text-lg mb-2">
          حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ
        </p>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "مواقيت الصلاة" : "Prayer Times"}
        </h1>
        <p className="text-white/60 font-arabic text-sm">
          {isAr ? "بلبيس — محافظة الشرقية" : "Belbeis — Al-Sharqia, Egypt"}
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {activeTab === "daily" && <DailyPrayers locale={locale} />}
        {activeTab === "monthly" && <MonthlyTable locale={locale} />}
        {activeTab === "qibla" && <QiblaCompass locale={locale} />}
      </div>
    </main>
  );
}
