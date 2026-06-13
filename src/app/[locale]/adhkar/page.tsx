import { getAllAdhkar } from "@/lib/adhkar";
import AdhkarCategoryCard from "@/components/adhkar/AdhkarCategoryCard";

export default async function AdhkarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const categories = getAllAdhkar();

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-14 px-4 text-center text-white">
        <p className="font-arabic text-[#C9A84C] text-lg mb-3">
          وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ
        </p>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "الأذكار" : "Adhkar"}
        </h1>
        <p className="text-white/60 font-arabic text-sm mb-3">
          {isAr ? "أذكار من كتاب حصن المسلم" : "From Hisn Al-Muslim"}
        </p>
        <div className="text-white/40 text-sm font-arabic">
          {categories.length} {isAr ? "باب" : "categories"} ·{" "}
          {categories.reduce((acc, c) => acc + c.adhkar.length, 0)}{" "}
          {isAr ? "ذكر" : "adhkar"}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <AdhkarCategoryCard
              key={category.id}
              category={category}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
