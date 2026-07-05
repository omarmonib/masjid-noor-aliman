import { Suspense } from "react";
import MediaLibrary from "@/components/media/MediaLibrary";

export default async function SermonsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <MediaLibrary locale={locale} />
    </Suspense>
  );
}
