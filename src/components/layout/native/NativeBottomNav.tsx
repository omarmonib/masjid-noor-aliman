// src/components/layout/native/NativeBottomNav.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Clock,
  Sparkles,
  Grid2x2,
  type LucideIcon,
} from "lucide-react";

/**
 * Fixed bottom navigation for the native (Capacitor) shell — Material
 * Design 3 style, 5 destinations, with a spring-animated active
 * indicator that slides between tabs instead of just recoloring them.
 *
 * EXTENSIBILITY: every tab is a plain object in NAV_TABS below. Adding
 * a future tab (Qibla, Favorites, Downloads, Profile) means adding one
 * object here — no changes to the rendering, animation, or active-state
 * logic in this component. If the list ever grows past 5 items, this
 * same array can drive an overflow menu without restructuring anything
 * that depends on it (NativeLayout only ever reads NAV_TABS.length for
 * bottom-padding math, so it stays correct automatically).
 */

interface NavTab {
  id: string;
  href: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
}

export const NAV_TABS: NavTab[] = [
  { id: "home", href: "", labelAr: "الرئيسية", labelEn: "Home", icon: Home },
  {
    id: "quran",
    href: "/quran",
    labelAr: "القرآن",
    labelEn: "Quran",
    icon: BookOpen,
  },
  {
    id: "prayer",
    href: "/prayer-times",
    labelAr: "الصلاة",
    labelEn: "Prayer",
    icon: Clock,
  },
  {
    id: "adhkar",
    href: "/adhkar",
    labelAr: "الأذكار",
    labelEn: "Adhkar",
    icon: Sparkles,
  },
  {
    id: "more",
    href: "/more",
    labelAr: "المزيد",
    labelEn: "More",
    icon: Grid2x2,
  },
];

interface Props {
  locale: string;
}

export default function NativeBottomNav({ locale }: Props) {
  const isAr = locale === "ar";
  const pathname = usePathname();

  const activeIndex = (() => {
    // Longest-matching-href wins, so `/ar/quran/anything` still highlights
    // "Quran" rather than falling through. Home ("" suffix) only matches
    // an exact locale root, otherwise every route would match it first.
    let bestIndex = -1;
    let bestLength = -1;
    NAV_TABS.forEach((tab, i) => {
      const fullHref = `/${locale}${tab.href}`;
      const matches =
        tab.href === ""
          ? pathname === fullHref
          : pathname === fullHref || pathname.startsWith(`${fullHref}/`);
      if (matches && fullHref.length > bestLength) {
        bestIndex = i;
        bestLength = fullHref.length;
      }
    });
    return bestIndex;
  })();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="relative flex items-stretch h-16">
        {/* Sliding active indicator — a soft pill behind the active tab's
           icon, spring-animated between positions rather than an abrupt
           jump. Positioned via percentage math so it stays correct at
           any screen width without measuring DOM nodes. */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute top-1.5 h-8 rounded-full bg-primary/10"
            style={{ width: `${100 / NAV_TABS.length}%` }}
            animate={{
              left: `${(activeIndex * 100) / NAV_TABS.length}%`,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}

        {NAV_TABS.map((tab, i) => {
          const isActive = i === activeIndex;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/${locale}${tab.href}`}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 min-w-0"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  size={22}
                  className={isActive ? "text-primary" : "text-gray-400"}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span
                  className={`font-arabic text-[10px] font-medium truncate max-w-[60px] ${
                    isActive ? "text-primary font-bold" : "text-gray-400"
                  }`}
                >
                  {isAr ? tab.labelAr : tab.labelEn}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
