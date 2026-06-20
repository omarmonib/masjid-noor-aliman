import PrayerTimesPage from "@/components/prayer/PrayerTimesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PrayerTimesPage locale={locale} />;
}
