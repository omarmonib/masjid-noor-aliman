// src/app/[locale]/more/page.tsx
import MorePage from "@/components/more/MorePage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MorePage locale={locale} />;
}
