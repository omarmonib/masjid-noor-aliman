// src/app/[locale]/notifications/page.tsx
import NotificationsPage from "@/components/notifications/NotificationsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <NotificationsPage locale={locale} />;
}
