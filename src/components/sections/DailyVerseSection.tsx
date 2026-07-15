import ShareButtons from "@/components/shared/ShareButtons";

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

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

export default function DailyVerseSection({ verse, locale }: Props) {
  const isAr = locale === "ar";

  // Surah At-Tawbah (9) is the one surah traditionally recited without a
  // preceding Bismillah, so skip it there even though this is just a home
  // page snippet rather than the full Mushaf reader.
  const showBismillah = verse.surah !== "التوبة";

  const shareText = [
    showBismillah ? BISMILLAH : null,
    verse.arabic,
    verse.english,
    `﴾ ${isAr ? verse.surah : verse.surahEn} : ${verse.ayah} ﴿`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
      <div className="absolute top-4 right-8 text-[#C9A84C]/20 font-arabic text-8xl leading-none select-none pointer-events-none">
        ❝
      </div>

      <div className="px-6 md:px-10 py-10 text-center relative z-10">
        {showBismillah && (
          <p
            className="text-lg md:text-xl text-[#C9A84C]/90 mb-4"
            dir="rtl"
            style={{ fontFamily: "var(--font-amiri), 'Amiri', serif" }}
          >
            {BISMILLAH}
          </p>
        )}

        <p
          className="text-2xl md:text-3xl leading-loose text-white mb-6"
          dir="rtl"
          style={{ fontFamily: "var(--font-amiri), 'Amiri', serif" }}
        >
          {verse.arabic}
        </p>

        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-5">
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

        <div>
          <ShareButtons text={shareText} locale={locale} variant="dark" />
        </div>
      </div>
    </div>
  );
}
