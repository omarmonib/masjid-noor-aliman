interface Props {
  hadith: {
    arabic: string;
    number: number;
  };
  locale: string;
}

export default function DailyHadithSection({ hadith, locale }: Props) {
  const isAr = locale === "ar";

  return (
    <section className="bg-[#0D3D28] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-gold font-arabic text-sm tracking-widest mb-2">
            ✦ {isAr ? "حديث اليوم" : "Hadith of the Day"} ✦
          </p>
          <div className="w-16 h-0.5 bg-gold/40 mx-auto" />
        </div>

        {/* Hadith card */}
        <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
          {/* Quote mark */}
          <div className="absolute top-6 right-8 text-gold/20 font-arabic text-8xl leading-none select-none">
            &quot;
          </div>

          <div className="px-8 py-10 text-center relative z-10">
            {/* Arabic hadith */}
            <p
              className="font-arabic text-2xl leading-loose text-white mb-8"
              dir="rtl"
            >
              {hadith.arabic}
            </p>

            {/* Reference */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2">
              <span className="text-gold font-arabic text-sm">
                {isAr ? "صحيح مسلم" : "Sahih Muslim"}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm">
                {isAr
                  ? `حديث رقم ${hadith.number}`
                  : `Hadith #${hadith.number}`}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/30 text-xs font-arabic mt-6">
          {isAr ? "قال رسول الله ﷺ" : "The Prophet ﷺ said"}
        </p>
      </div>
    </section>
  );
}
