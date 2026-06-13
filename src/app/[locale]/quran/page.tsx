import { getSurahs } from "@/lib/quran-reader";
import SurahList from "@/components/quran/SurahList";

export default async function QuranPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const surahs = await getSurahs();

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-14 px-4 text-center text-white">
        <p className="font-arabic text-[#C9A84C] text-2xl mb-3">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "القرآن الكريم" : "The Holy Quran"}
        </h1>
        <p className="text-white/60 font-arabic text-sm">
          {isAr ? "١١٤ سورة · ٦٢٣٦ آية" : "114 Surahs · 6236 Verses"}
        </p>
      </div>

      {/* Surah list */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SurahList surahs={surahs} locale={locale} />
      </div>
    </main>
  );
}
