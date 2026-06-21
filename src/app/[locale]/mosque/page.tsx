import MosquePage from "@/components/mosque/MosquePage";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MosquePage locale={locale} />;
}
