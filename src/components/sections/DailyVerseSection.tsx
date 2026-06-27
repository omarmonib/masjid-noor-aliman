interface Props {
  verse: {
    arabic: string;
    english: string;
    surah: string;
    surahEn: string;
    ayah: number;
  };
  locale: string;
}

export default function DailyVerseSection({ verse, locale }: Props) {
  const isAr = locale === "ar";

  return (
    <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
      {/* Decorative quote mark */}
      <div className="absolute top-4 right-8 text-[#C9A84C]/20 font-arabic text-8xl leading-none select-none pointer-events-none">
        ❝
      </div>

      <div className="px-8 py-10 text-center relative z-10">
        {/* Arabic verse */}
        <p
          className="font-arabic text-2xl md:text-3xl leading-loose text-white mb-6"
          dir="rtl"
          style={{ fontFamily: "var(--font-amiri), serif" }}
        >
          {verse.arabic}
        </p>

        {/* Reference badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2">
          <span
            className="font-arabic text-sm font-medium"
            style={{ color: "#C9A84C" }}
          >
            {isAr ? verse.surah : verse.surahEn}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/60 text-sm font-arabic">
            {isAr ? `آية ${verse.ayah}` : `Ayah ${verse.ayah}`}
          </span>
        </div>
      </div>
    </div>
  );
}
