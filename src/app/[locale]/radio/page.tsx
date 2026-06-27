import RadioPage from "@/components/radio/RadioPage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RadioPage locale={locale} />;
}
