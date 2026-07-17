// src/components/layout/native/NativeAppBar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { MobileIconButton } from "@/components/mobile/MobileUI";

/**
 * Reusable top App Bar for the native (Capacitor) shell — distinct from
 * the website's Navbar. Every native page can configure it via props
 * rather than each page hardcoding its own header, matching how a real
 * native app's top bar works (title/subtitle/actions swap per screen,
 * the bar itself never changes structure).
 *
 * Uses the same green primary color as the status bar (set at runtime by
 * the existing NativeAdhanScheduler component via @capacitor/status-bar),
 * so the two form one continuous colored header rather than a visible
 * seam between a green status bar and a differently-colored App Bar.
 *
 * Default (no props beyond locale): shows the mosque logo + name, used
 * on the Home tab. Any other native page can override `title`,
 * `subtitle`, provide `showBackButton`, or inject custom `actions`.
 */

export interface NativeAppBarAction {
  icon: LucideIcon;
  label: string;
  onTap: () => void;
}

interface NativeAppBarProps {
  locale: string;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showNotification?: boolean;
  showSearch?: boolean;
  onSearchTap?: () => void;
  actions?: NativeAppBarAction[];
}

export default function NativeAppBar({
  locale,
  title,
  subtitle,
  showBackButton = false,
  showNotification = true,
  showSearch = false,
  onSearchTap,
  actions = [],
}: NativeAppBarProps) {
  const isAr = locale === "ar";
  const router = useRouter();
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const isDefault = !title && !showBackButton;

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: "linear-gradient(to bottom, #0D3D28, #1B6B4A)",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="h-14 px-3 flex items-center gap-2">
        {/* Leading: back button OR logo, never both */}
        {showBackButton ? (
          <MobileIconButton
            icon={BackIcon}
            label={isAr ? "رجوع" : "Back"}
            onTap={() => router.back()}
            className="text-white hover:bg-white/10"
          />
        ) : (
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
            <span className="text-lg">🕌</span>
          </div>
        )}

        {/* Title / subtitle block — animates in when it changes between
           pages, giving a native-feeling transition instead of a hard cut. */}
        <div className="flex-1 min-w-0 px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={title || "default"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <p className="font-arabic text-base font-bold truncate">
                {title || (isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman")}
              </p>
              {(subtitle || isDefault) && (
                <p className="font-arabic text-[11px] text-white/60 truncate -mt-0.5">
                  {subtitle ||
                    (isAr ? "بلبيس — الشرقية" : "Belbeis — Al-Sharqia")}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Trailing actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showSearch && (
            <MobileIconButton
              icon={Search}
              label={isAr ? "بحث" : "Search"}
              onTap={onSearchTap || (() => {})}
              className="text-white hover:bg-white/10"
            />
          )}
          {showNotification && (
            <MobileIconButton
              icon={Bell}
              label={isAr ? "الإشعارات" : "Notifications"}
              onTap={() => router.push(`/${locale}/more`)}
              className="text-white hover:bg-white/10"
            />
          )}
          {actions.map((action, i) => (
            <MobileIconButton
              key={i}
              icon={action.icon}
              label={action.label}
              onTap={action.onTap}
              className="text-white hover:bg-white/10"
            />
          ))}
        </div>
      </div>
    </header>
  );
}
