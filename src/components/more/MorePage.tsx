// src/components/more/MorePage.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Radio,
  Mic2,
  Building2,
  Clock,
  LogIn,
  User,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import {
  MobilePage,
  MobileSection,
  MobileListItem,
} from "@/components/mobile/MobileUI";

/**
 * The native app's "More" screen — a real dedicated page (not a bottom
 * sheet), styled as a grouped settings/menu screen rather than a website
 * nav list. Groupings match the architecture: General / Mosque / Account
 * / Application / Administration (admin-only, conditionally rendered).
 *
 * This page only renders inside NativeLayout in practice (it's reached
 * via the "More" tab in NativeBottomNav), but nothing here assumes that —
 * it would render correctly on web too if visited directly, it simply
 * isn't linked to from WebLayout's Navbar since the website already
 * exposes all these destinations directly in its own nav.
 */

interface Props {
  locale: string;
}

export default function MorePage({ locale }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const go = (path: string) => router.push(`/${locale}${path}`);

  return (
    <MobilePage>
      {/* Account summary strip when signed in — quick identity glance at
         the top of the page, similar to how native apps surface the
         current user above the settings groups. */}
      {session && (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg flex-shrink-0">
            {(session.user?.name ||
              session.user?.email ||
              "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-right" dir="rtl">
            <p className="font-arabic font-bold text-gray-800 truncate">
              {session.user?.name || session.user?.email}
            </p>
            <p className="font-arabic text-xs text-gray-400 truncate">
              {isAdmin ? (isAr ? "مدير" : "Admin") : isAr ? "مستخدم" : "User"}
            </p>
          </div>
        </div>
      )}

      <MobileSection title={isAr ? "عام" : "General"}>
        <MobileListItem
          icon={Mic2}
          title={isAr ? "الحديث الشريف" : "Hadith"}
          onTap={() => go("/hadith")}
          locale={locale}
        />
        <MobileListItem
          icon={Radio}
          title={isAr ? "الإذاعة" : "Radio"}
          onTap={() => go("/radio")}
          locale={locale}
        />
        <MobileListItem
          icon={BookOpen}
          title={isAr ? "الخطب والتسجيلات" : "Sermons"}
          onTap={() => go("/sermons")}
          locale={locale}
        />
      </MobileSection>

      <MobileSection title={isAr ? "المسجد" : "Mosque"}>
        <MobileListItem
          icon={Building2}
          title={isAr ? "المسجد" : "Mosque"}
          onTap={() => go("/mosque")}
          locale={locale}
        />
        <MobileListItem
          icon={Clock}
          title={isAr ? "مواقيت الصلاة" : "Prayer Times"}
          onTap={() => go("/prayer-times")}
          locale={locale}
        />
      </MobileSection>

      <MobileSection title={isAr ? "الحساب" : "Account"}>
        {session ? (
          <>
            <MobileListItem
              icon={User}
              title={isAr ? "الملف الشخصي" : "Profile"}
              subtitle={isAr ? "قريباً" : "Coming soon"}
              onTap={() => {}}
              locale={locale}
              showChevron={false}
            />
            <MobileListItem
              icon={LogOut}
              iconColor="#DC2626"
              iconBg="rgba(220,38,38,0.1)"
              title={isAr ? "تسجيل الخروج" : "Sign Out"}
              onTap={() => signOut({ callbackUrl: `/${locale}` })}
              locale={locale}
              showChevron={false}
            />
          </>
        ) : (
          <MobileListItem
            icon={LogIn}
            title={isAr ? "تسجيل الدخول" : "Sign In"}
            onTap={() => go("/auth/login")}
            locale={locale}
          />
        )}
      </MobileSection>

      <MobileSection title={isAr ? "التطبيق" : "Application"}>
        <MobileListItem
          icon={Settings}
          title={isAr ? "الإعدادات" : "Settings"}
          subtitle={isAr ? "قريباً" : "Coming soon"}
          onTap={() => {}}
          locale={locale}
          showChevron={false}
        />
        <MobileListItem
          icon={Bell}
          title={isAr ? "الإشعارات" : "Notifications"}
          subtitle={isAr ? "قريباً" : "Coming soon"}
          onTap={() => {}}
          locale={locale}
          showChevron={false}
        />
      </MobileSection>

      {isAdmin && (
        <MobileSection title={isAr ? "الإدارة" : "Administration"}>
          <MobileListItem
            icon={ShieldCheck}
            title={isAr ? "لوحة الإدارة" : "Admin Dashboard"}
            onTap={() => go("/admin")}
            locale={locale}
          />
        </MobileSection>
      )}
    </MobilePage>
  );
}
