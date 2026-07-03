import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import MediaManager from "@/components/admin/MediaManager";
import AccessDenied from "@/components/admin/AccessDenied";

export default async function AdminMediaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin/media`);
  }

  if (session.user.role !== "ADMIN") {
    return <AccessDenied locale={locale} />;
  }

  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-surface">
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-10 px-4 text-center text-white">
        <h1 className="font-arabic text-3xl font-bold">
          {isAr ? "إدارة الخطب والتسجيلات" : "Manage Sermons & Recordings"}
        </h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <MediaManager locale={locale} />
      </div>
    </main>
  );
}
