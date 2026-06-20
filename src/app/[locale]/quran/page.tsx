import MushafViewer from "@/components/quran/MushafViewer";

export default async function QuranPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-10 px-4 text-center text-white">
        <p className="font-arabic text-[#C9A84C] text-xl mb-2">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="font-arabic text-4xl font-bold mb-1">
          {isAr ? "القرآن الكريم" : "The Holy Quran"}
        </h1>
        <p className="text-white/60 font-arabic text-sm">
          {isAr
            ? "مصحف المدينة المنورة · حفص عن عاصم"
            : "Madinah Mushaf · Hafs 'an Asim"}
        </p>
      </div>
      <MushafViewer locale={locale} />
    </main>
  );
}
