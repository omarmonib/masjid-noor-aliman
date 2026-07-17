// src/components/layout/native/NativeLayout.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import NativeAppBar from "./NativeAppBar";
import NativeBottomNav from "./NativeBottomNav";

/**
 * The native (Capacitor) app shell — Material Design 3–inspired,
 * completely independent from WebLayout. Composes:
 *   NativeAppBar (fixed top) → scrollable content → NativeBottomNav (fixed bottom)
 *
 * Per-page App Bar configuration is resolved here from the current
 * pathname via ROUTE_APPBAR_CONFIG, so individual pages don't need to be
 * modified to control their own title/subtitle/back-button — this keeps
 * pages fully shared between web and native, per the architecture's core
 * requirement. Any route not listed falls back to NativeAppBar's own
 * defaults (mosque name + location, no back button).
 *
 * Page transitions: content is wrapped in AnimatePresence keyed by
 * pathname, so navigating between tabs/pages produces a subtle native-
 * feeling fade/slide instead of an abrupt swap — without needing to touch
 * the page components themselves.
 */

interface RouteAppBarConfig {
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  showBackButton?: boolean;
}

// Matched by "does the pathname end with this suffix" so it works across
// both locales (/ar/quran and /en/quran) without duplicating entries.
const ROUTE_APPBAR_CONFIG: { suffix: string; config: RouteAppBarConfig }[] = [
  {
    suffix: "/quran",
    config: { titleAr: "القرآن الكريم", titleEn: "Holy Quran" },
  },
  {
    suffix: "/prayer-times",
    config: { titleAr: "مواقيت الصلاة", titleEn: "Prayer Times" },
  },
  { suffix: "/adhkar", config: { titleAr: "الأذكار", titleEn: "Adhkar" } },
  {
    suffix: "/hadith",
    config: { titleAr: "الحديث الشريف", titleEn: "Hadith" },
  },
  {
    suffix: "/sermons",
    config: { titleAr: "الخطب والتسجيلات", titleEn: "Sermons" },
  },
  { suffix: "/radio", config: { titleAr: "الإذاعة", titleEn: "Radio" } },
  { suffix: "/mosque", config: { titleAr: "المسجد", titleEn: "Mosque" } },
  {
    suffix: "/more",
    config: { titleAr: "المزيد", titleEn: "More", showBackButton: false },
  },
  {
    suffix: "/auth/login",
    config: {
      titleAr: "تسجيل الدخول",
      titleEn: "Sign In",
      showBackButton: true,
    },
  },
  {
    suffix: "/auth/register",
    config: {
      titleAr: "إنشاء حساب",
      titleEn: "Register",
      showBackButton: true,
    },
  },
  {
    suffix: "/admin",
    config: { titleAr: "لوحة الإدارة", titleEn: "Admin", showBackButton: true },
  },
];

function resolveAppBarConfig(
  pathname: string,
  locale: string,
): RouteAppBarConfig | null {
  // Sort by suffix length descending so more specific routes (e.g.
  // "/admin/media") never get shadowed by a shorter match (e.g. "/admin")
  // if both existed — currently they don't, but this keeps it correct
  // as more entries get added.
  const sorted = [...ROUTE_APPBAR_CONFIG].sort(
    (a, b) => b.suffix.length - a.suffix.length,
  );
  const homeRoute = `/${locale}`;
  if (pathname === homeRoute) return null; // use NativeAppBar's own default
  const match = sorted.find((r) => pathname.endsWith(r.suffix));
  return match ? match.config : null;
}

interface Props {
  locale: string;
  children: React.ReactNode;
}

export default function NativeLayout({ locale, children }: Props) {
  const isAr = locale === "ar";
  const pathname = usePathname();

  const routeConfig = resolveAppBarConfig(pathname, locale);

  return (
    <div className="min-h-screen bg-surface">
      <NativeAppBar
        locale={locale}
        title={
          routeConfig
            ? isAr
              ? routeConfig.titleAr
              : routeConfig.titleEn
            : undefined
        }
        subtitle={
          routeConfig
            ? isAr
              ? routeConfig.subtitleAr
              : routeConfig.subtitleEn
            : undefined
        }
        showBackButton={routeConfig?.showBackButton ?? false}
      />

      {/* Scrollable content area. Top padding clears the fixed App Bar
         (56px + safe-area-inset-top); bottom padding clears the fixed
         Bottom Nav (64px + safe-area-inset-bottom) so content never sits
         underneath either fixed bar, and native momentum scrolling is
         used instead of any custom scroll container. */}
      <main
        className="native-scroll"
        style={{
          paddingTop: "calc(56px + env(safe-area-inset-top))",
          paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
          minHeight: "100vh",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <NativeBottomNav locale={locale} />
    </div>
  );
}
