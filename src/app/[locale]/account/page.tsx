// src/app/[locale]/account/page.tsx
import AccountPage from "@/components/account/AccountPage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AccountPage locale={locale} />;
}
