// src/components/account/AccountPage.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  ShieldCheck,
  Mail,
  User as UserIcon,
} from "lucide-react";
import {
  MobilePage,
  MobileSection,
  MobileListItem,
} from "@/components/mobile/MobileUI";

/**
 * Real Account screen — uses next-auth's existing session data exactly as
 * MorePage's account-summary strip and Navbar's account dropdown already
 * do. No new auth logic, no placeholders: signed out shows a real sign-in
 * entry point, signed in shows real session fields (name, email, role)
 * and a working sign-out action. "Profile editing" is not built here
 * since there is no profile-update API/form anywhere in this codebase —
 * per project convention, that's omitted entirely rather than shown as
 * a disabled "Coming soon" row.
 */

interface Props {
  locale: string;
}

export default function AccountPage({ locale }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (status === "loading") {
    return (
      <MobilePage>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </MobilePage>
    );
  }

  if (!session) {
    return (
      <MobilePage>
        <div className="flex flex-col items-center text-center py-10 px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <UserIcon size={28} />
          </div>
          <p className="font-arabic font-bold text-gray-800 mb-1">
            {isAr ? "لم تسجّل الدخول بعد" : "You're not signed in"}
          </p>
          <p className="font-arabic text-sm text-gray-400 mb-6">
            {isAr
              ? "سجّل الدخول للوصول إلى حسابك وإعداداتك"
              : "Sign in to access your account and settings"}
          </p>
          <button
            onClick={() => router.push(`/${locale}/auth/login`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-arabic font-bold"
            style={{
              background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
            }}
          >
            <LogIn size={16} />
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </button>
        </div>
      </MobilePage>
    );
  }

  return (
    <MobilePage>
      {/* Identity header */}
      <div className="flex flex-col items-center text-center py-6 mb-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl mb-3">
          {(session.user?.name || session.user?.email || "?")[0].toUpperCase()}
        </div>
        <p className="font-arabic text-lg font-bold text-gray-800">
          {session.user?.name || (isAr ? "بدون اسم" : "No name set")}
        </p>
        <p className="font-arabic text-sm text-gray-400">
          {session.user?.email}
        </p>
        {isAdmin && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-arabic">
            <ShieldCheck size={12} />
            {isAr ? "مدير" : "Admin"}
          </span>
        )}
      </div>

      <MobileSection title={isAr ? "معلومات الحساب" : "Account Info"}>
        <MobileListItem
          icon={UserIcon}
          title={isAr ? "الاسم" : "Name"}
          subtitle={session.user?.name || (isAr ? "غير محدد" : "Not set")}
          locale={locale}
          showChevron={false}
        />
        <MobileListItem
          icon={Mail}
          title={isAr ? "البريد الإلكتروني" : "Email"}
          subtitle={session.user?.email || ""}
          locale={locale}
          showChevron={false}
        />
      </MobileSection>

      {isAdmin && (
        <MobileSection title={isAr ? "الإدارة" : "Administration"}>
          <MobileListItem
            icon={ShieldCheck}
            title={isAr ? "لوحة الإدارة" : "Admin Dashboard"}
            onTap={() => router.push(`/${locale}/admin`)}
            locale={locale}
          />
        </MobileSection>
      )}

      <MobileSection>
        <MobileListItem
          icon={LogOut}
          iconColor="#DC2626"
          iconBg="rgba(220,38,38,0.1)"
          title={isAr ? "تسجيل الخروج" : "Sign Out"}
          onTap={() => signOut({ callbackUrl: `/${locale}` })}
          locale={locale}
          showChevron={false}
        />
      </MobileSection>
    </MobilePage>
  );
}
