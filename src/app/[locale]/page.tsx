import Hero from "@/components/layout/Hero";
import DailyVerseSection from "@/components/sections/DailyVerseSection";
import DailyHadithSection from "@/components/sections/DailyHadithSection";
import { getDailyVerse, getDailyHadith } from "@/lib/quran";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [verse, hadith] = await Promise.all([
    getDailyVerse(),
    getDailyHadith(),
  ]);

  return (
    <main>
      <Hero locale={locale} />
      <DailyVerseSection verse={verse} locale={locale} />
      <DailyHadithSection hadith={hadith} locale={locale} />
    </main>
  );
}
