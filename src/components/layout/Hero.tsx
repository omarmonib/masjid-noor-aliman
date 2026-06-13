import PrayerTimesWidget from "@/components/widgets/PrayerTimesWidget";

export default function Hero({ locale }: { locale: string }) {
  const isAr = locale === "ar";

  return (
    <section className="relative bg-gradient-to-br from-[#0D3D28] via-[#1B6B4A] to-[#2d8a62] min-h-[90vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`text-white ${isAr ? "text-right" : "text-left"}`}>
            <p className="font-arabic text-2xl text-[#C9A84C] mb-6 opacity-90">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <h1 className="font-arabic text-5xl lg:text-6xl font-bold leading-tight mb-4">
              مسجد نور الإيمان
            </h1>

            <p className="text-xl text-white/80 font-arabic mb-2">
              بلبيس — محافظة الشرقية
            </p>

            <div className="w-24 h-1 bg-[#C9A84C] my-6 rounded-full" />

            <p className="text-white/70 font-arabic text-lg leading-relaxed mb-8">
              منارة للعلم والإيمان في قلب بلبيس — نسعى لخدمة المجتمع وتعليم
              القرآن الكريم والسنة النبوية الشريفة
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={`/${locale}/quran`}
                className="bg-[#C9A84C] text-[#0D3D28] font-arabic font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                اقرأ القرآن الكريم
              </a>

              <a
                href={`/${locale}/prayer-times`}
                className="border-2 border-white/40 text-white font-arabic font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                مواقيت الصلاة
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ms-auto">
            <PrayerTimesWidget locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
