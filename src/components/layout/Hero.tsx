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
      {/* Decorative dots */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-5 blur-3xl"
        style={{ background: "#C9A84C" }}
      />
      <div
        className="absolute bottom-40 left-10 w-56 h-56 rounded-full opacity-5 blur-3xl"
        style={{ background: "#C9A84C" }}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center px-6 md:px-16 py-16">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          {/* Text + Buttons */}
          <div className="flex-1 flex flex-col text-white text-center md:text-right">
            <p className="font-arabic text-[#C9A84C] text-xl md:text-2xl mb-4 leading-loose">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <h1 className="font-arabic text-4xl md:text-7xl font-bold mb-3 leading-tight">
              {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
            </h1>

            <p className="font-arabic text-white/70 text-base md:text-lg mb-6">
              {isAr ? "بلبيس — محافظة الشرقية" : "Belbeis — Al-Sharqia, Egypt"}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
              <Link
                href={`/${locale}/quran`}
                className="font-arabic text-base md:text-lg font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 text-center"
                style={{
                  background: "linear-gradient(135deg, #C9A84C, #E8C56A)",
                  color: "#0D3D28",
                  boxShadow: "0 4px 24px rgba(201,168,76,0.35)",
                }}
              >
                📖 {isAr ? "اقرأ القرآن الكريم" : "Read Holy Quran"}
              </Link>

              <Link
                href={`/${locale}/prayer-times`}
                className="font-arabic text-base md:text-lg font-bold px-8 py-4 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white transition-all hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 text-center"
              >
                🕌 {isAr ? "مواقيت الصلاة" : "Prayer Times"}
              </Link>
            </div>

            <p className="font-arabic text-white/70 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
              {isAr
                ? "منارة للعلم والإيمان في قلب بلبيس — نسعى لخدمة المجتمع وتعليم القرآن الكريم والسنة النبوية الشريفة"
                : "A beacon of knowledge and faith in the heart of Belbeis — serving the community through Quran and Sunnah"}
            </p>
          </div>

          {/* Prayer Times Widget */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div
              className="rounded-2xl p-5 border border-white/10"
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
      </div>
    </section>
  );
}
