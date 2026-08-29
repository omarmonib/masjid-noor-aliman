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
import { useAdhanSettings } from "@/hooks/useAdhanSettings";

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
  const adhan = useAdhanSettings();

  const isDefault = !title && !showBackButton;

  const handleBellTap = async () => {
    // Keep the existing quick inline toggle behavior (same as the
    // web Navbar's NotificationBell), then take the user to the full
    // settings page so they can see/control everything in one place —
    // this component is native-only, so no web/push branch is needed here.
    await adhan.toggleEnabled(isAr);
    router.push(`/${locale}/notifications`);
  };

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

        <div className="flex-1 min-w-0 px-1">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={title || "default"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
              onTap={handleBellTap}
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
