import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AccessDenied from "@/components/admin/AccessDenied";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Not logged in at all — send to login, remembering where they wanted to go
  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin`);
  }

  // Logged in, but not an admin — logging in again won't help, so explain instead
  if (session.user.role !== "ADMIN") {
    return <AccessDenied locale={locale} />;
  }

  return <AdminDashboard locale={locale} />;
}
