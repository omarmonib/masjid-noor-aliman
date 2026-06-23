"use client";

import Link from "next/link";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";

export default function Hero({ locale }: { locale: string }) {
  const isAr = locale === "ar";

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0D3D28 0%, #1B6B4A 60%, #0D3D28 100%)",
      }}
    >
      {/* Decorative dots pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative circles */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-5 blur-3xl"
        style={{ background: "#C9A84C" }}
      />
      <div
        className="absolute bottom-40 right-10 w-56 h-56 rounded-full opacity-5 blur-3xl"
        style={{ background: "#C9A84C" }}
      />

      {/* Main hero content — centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center text-white max-w-3xl mx-auto">
          {/* Bismillah */}
          <p className="font-arabic text-[#C9A84C] text-2xl mb-6 leading-loose">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {/* Mosque name */}
          <h1 className="font-arabic text-5xl md:text-7xl font-bold mb-4 leading-tight">
            {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
          </h1>

          {/* Location */}
          <p className="font-arabic text-white/70 text-lg mb-4">
            {isAr ? "بلبيس — محافظة الشرقية" : "Belbeis — Al-Sharqia, Egypt"}
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-px bg-[#C9A84C]/50" />
            <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
            <div className="w-16 h-px bg-[#C9A84C]/50" />
          </div>

          {/* Description */}
          <p className="font-arabic text-white/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            {isAr
              ? "منارة للعلم والإيمان في قلب بلبيس — نسعى لخدمة المجتمع وتعليم القرآن الكريم والسنة النبوية الشريفة"
              : "A beacon of knowledge and faith in the heart of Belbeis"}
          </p>
          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/prayer-times`}
              className="font-arabic px-8 py-3.5 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
            >
              {isAr ? "مواقيت الصلاة" : "Prayer Times"}
            </Link>
            <Link
              href={`/${locale}/quran`}
              className="font-arabic px-8 py-3.5 rounded-xl font-medium transition-all"
              style={{
                background: "linear-gradient(to right, #C9A84C, #E8C56A)",
                color: "#0D3D28",
              }}
            >
              {isAr ? "اقرأ القرآن الكريم" : "Read Quran"}
            </Link>
          </div>
        </div>
        {/* Prayer times widget — bottom left, glassmorphism style */}
        <div className="relative z-10 px-4 pb-6">
          <div
            className="max-w-xs rounded-2xl p-5 border border-white/10"
            style={{
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <PrayerTimesWidget locale={locale} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
