import DailyVerseSection from "@/components/sections/DailyVerseSection";
import DailyHadithSection from "@/components/sections/DailyHadithSection";
import Hero from "@/components/layout/Hero";
import Link from "next/link";
import { getDailyVerse, getDailyHadith } from "@/lib/quran";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const [verse, hadith] = await Promise.all([
    getDailyVerse(),
    getDailyHadith(),
  ]);

  const features = [
    {
      href: `/${locale}/quran`,
      icon: "📖",
      labelAr: "القرآن الكريم",
      labelEn: "Holy Quran",
      descAr: "اقرأ واستمع للقرآن الكريم",
      descEn: "Read & listen to Quran",
    },
    {
      href: `/${locale}/prayer-times`,
      icon: "🕐",
      labelAr: "مواقيت الصلاة",
      labelEn: "Prayer Times",
      descAr: "أوقات الصلاة واتجاه القبلة",
      descEn: "Prayer times & Qibla",
    },
    {
      href: `/${locale}/adhkar`,
      icon: "📿",
      labelAr: "الأذكار",
      labelEn: "Adhkar",
      descAr: "أذكار من حصن المسلم",
      descEn: "Hisn Al-Muslim Adhkar",
    },
    {
      href: `/${locale}/hadith`,
      icon: "📚",
      labelAr: "الحديث الشريف",
      labelEn: "Hadith",
      descAr: "كتب السنة النبوية",
      descEn: "Books of Sunnah",
    },
    {
      href: `/${locale}/mosque`,
      icon: "🕌",
      labelAr: "المسجد",
      labelEn: "Mosque",
      descAr: "أخبار وفعاليات المسجد",
      descEn: "News & Events",
    },
  ];

  return (
    <main>
      {/* Hero */}
      <Hero locale={locale} />

      {/* Quick access grid */}
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-arabic text-2xl font-bold text-gray-800 mb-2">
              {isAr ? "خدمات المسجد" : "Mosque Services"}
            </h2>
            <div
              className="w-16 h-1 rounded-full mx-auto"
              style={{
                background: "linear-gradient(to right, #1B6B4A, #C9A84C)",
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group text-center"
              >
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-arabic font-bold text-gray-800 group-hover:text-primary transition-colors mb-1">
                  {isAr ? f.labelAr : f.labelEn}
                </h3>
                <p className="font-arabic text-xs text-gray-400">
                  {isAr ? f.descAr : f.descEn}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Verse — dark green background */}
      <section
        className="py-12 px-4"
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <p
              className="font-arabic text-sm tracking-widest mb-1"
              style={{ color: "#C9A84C" }}
            >
              ✦ {isAr ? "آية عشوائية" : "Random Verse"} ✦
            </p>
          </div>
          <DailyVerseSection verse={verse} locale={locale} />
        </div>
      </section>

      {/* Daily Hadith — light surface background */}
      <section className="bg-surface py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <p className="font-arabic text-sm tracking-widest mb-1 text-primary">
              ✦ {isAr ? "حديث عشوائي" : "Random Hadith"} ✦
            </p>
          </div>
          <DailyHadithSection hadith={hadith} locale={locale} />
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
        className="text-white py-10 px-4"
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="text-3xl">🕌</div>
          <h3 className="font-arabic text-xl font-bold">
            {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
          </h3>
          <p className="font-arabic text-white/60 text-sm">
            {isAr
              ? "بلبيس — محافظة الشرقية — مصر"
              : "Belbeis — Al-Sharqia — Egypt"}
          </p>
          <div className="flex justify-center gap-6 flex-wrap pt-2">
            {[
              { href: `/${locale}/quran`, label: isAr ? "القرآن" : "Quran" },
              {
                href: `/${locale}/prayer-times`,
                label: isAr ? "الصلاة" : "Prayer Times",
              },
              { href: `/${locale}/adhkar`, label: isAr ? "الأذكار" : "Adhkar" },
              { href: `/${locale}/hadith`, label: isAr ? "الحديث" : "Hadith" },
              { href: `/${locale}/mosque`, label: isAr ? "المسجد" : "Mosque" },
              { href: `/${locale}/donate`, label: isAr ? "تبرع" : "Donate" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-arabic text-sm text-white/70 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="font-arabic text-white/30 text-xs pt-4">
            © {new Date().getFullYear()}{" "}
            {isAr
              ? "مسجد نور الإيمان — جميع الحقوق محفوظة"
              : "Masjid Noor Al-Iman — All Rights Reserved"}
          </p>
        </div>
      </footer>
    </main>
  );
}
