// src/app/[locale]/settings/page.tsx
import SettingsPage from "@/components/settings/SettingsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SettingsPage locale={locale} />;
}