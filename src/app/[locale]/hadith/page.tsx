import HadithBrowser from "@/components/hadith/HadithBrowser";
import { getDailyHadithData } from "@/lib/hadith";

export default async function HadithPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dailyHadith = await getDailyHadithData();

  return <HadithBrowser locale={locale} dailyHadith={dailyHadith} />;
}
