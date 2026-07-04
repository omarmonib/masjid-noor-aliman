import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NewsManager from "@/components/admin/NewsManager";
import AccessDenied from "@/components/admin/AccessDenied";

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session)
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin/news`);
  if (session.user.role !== "ADMIN") return <AccessDenied locale={locale} />;

  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-surface">
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-10 px-4 text-center text-white">
        <h1 className="font-arabic text-3xl font-bold">
          {isAr ? "إدارة الأخبار والإعلانات" : "Manage News & Announcements"}
        </h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <NewsManager locale={locale} />
      </div>
    </main>
  );
}
