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
    <section className="bg-surface py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-gold font-arabic text-sm tracking-widest mb-2">
            ✦ {isAr ? "آية اليوم" : "Verse of the Day"} ✦
          </p>
          <div className="w-16 h-0.5 bg-gold/40 mx-auto" />
        </div>

        {/* Verse card */}
        <div className="relative bg-white rounded-3xl shadow-md border border-gold/15 overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-primary via-gold to-primary" />

          <div className="px-8 py-10 text-center">
            {/* Arabic text */}
            <p
              className="font-quran text-3xl leading-loose text-gray-800 mb-6"
              dir="rtl"
            >
              {verse.arabic}
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gold text-lg">❧</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* English translation */}
            <p
              className="text-gray-600 text-lg italic leading-relaxed mb-6"
                dir="ltr"
              >
                &quot;{verse.english}&quot;
            </p>

            {/* Reference */}
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-5 py-2">
              <span className="font-arabic text-primary font-medium text-sm">
                {verse.surah} : {verse.ayah}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-primary/70 text-sm">{verse.surahEn}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
