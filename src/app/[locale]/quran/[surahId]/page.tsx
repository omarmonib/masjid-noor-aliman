import { getSurahs, getVerses } from "@/lib/quran-reader";
import QuranReader from "@/components/quran/QuranReader";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function SurahPage({
  params,
}: {
  params: Promise<{ locale: string; surahId: string }>;
}) {
  const { locale, surahId } = await params;
  const isAr = locale === "ar";
  const id = parseInt(surahId);

  if (isNaN(id) || id < 1 || id > 114) notFound();

  const [surahs, verses] = await Promise.all([getSurahs(), getVerses(id)]);
  const surah = surahs.find((s) => s.id === id);
  if (!surah) notFound();

  const prevSurah = surahs.find((s) => s.id === id - 1);
  const nextSurah = surahs.find((s) => s.id === id + 1);

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-10 px-4 text-center text-white">
        <Link
          href={`/${locale}/quran`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-arabic mb-4 transition-colors"
        >
          → {isAr ? "القرآن الكريم" : "Quran"}
        </Link>
        <h1 className="font-arabic text-4xl font-bold mb-1">
          {surah.nameArabic}
        </h1>
        <p className="text-white/60 font-arabic text-sm">
          {surah.nameTranslation} ·{" "}
          {surah.revelationPlace === "makkah" ? "مكية" : "مدنية"} ·{" "}
          {surah.versesCount} {isAr ? "آية" : "verses"}
        </p>
      </div>

      {/* Reader */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Bismillah — except Al-Fatiha and At-Tawbah */}
        {id !== 1 && id !== 9 && (
          <div className="text-center font-arabic text-2xl text-primary mb-8 py-4 border-y border-primary/10">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        <QuranReader verses={verses} surahId={id} locale={locale} />

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          {nextSurah ? (
            <Link
              href={`/${locale}/quran/${nextSurah.id}`}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <span className="text-lg">→</span>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-arabic">
                  {isAr ? "السورة التالية" : "Next"}
                </p>
                <p className="font-arabic font-bold text-gray-800">
                  {nextSurah.nameArabic}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {prevSurah ? (
            <Link
              href={`/${locale}/quran/${prevSurah.id}`}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="text-left">
                <p className="text-xs text-gray-400 font-arabic">
                  {isAr ? "السورة السابقة" : "Previous"}
                </p>
                <p className="font-arabic font-bold text-gray-800">
                  {prevSurah.nameArabic}
                </p>
              </div>
              <span className="text-lg">←</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </main>
  );
}
