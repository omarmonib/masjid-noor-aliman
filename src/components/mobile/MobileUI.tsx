// src/components/mobile/MobileUI.tsx
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared mobile design-system primitives for the native (Capacitor) app
 * shell. These are intentionally separate from any web/desktop styling —
 * the web experience continues to use its own Tailwind classes directly,
 * untouched. Everything here assumes it's rendered inside NativeLayout.
 *
 * Design tokens follow Material Design 3 spacing/elevation conventions
 * while reusing the site's existing color palette (primary green, gold
 * accent) rather than M3's default color tokens — per the "native feel,
 * same brand" requirement.
 */

// Subtle, non-exaggerated press feedback — used by every tappable
// primitive below so touch feedback is consistent app-wide.
const TAP_SPRING = { type: "spring" as const, stiffness: 400, damping: 25 };

// ── MobilePage ──────────────────────────────────────────────────────
// Wraps the content area of a native page. Handles consistent horizontal
// padding and bottom spacing so content never sits under the fixed
// bottom nav bar (NativeLayout also adds safe-area padding around this).
interface MobilePageProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePage({ children, className }: MobilePageProps) {
  return <div className={cn("px-4 pb-6 pt-4", className)}>{children}</div>;
}

// ── MobileSection ───────────────────────────────────────────────────
// A labeled group of MobileListItems/MobileCards — e.g. "General",
// "Mosque", "Account" groupings on the More page. Renders nothing if no
// title is given, so it can also be used as a plain spacing wrapper.
interface MobileSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileSection({
  title,
  children,
  className,
}: MobileSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      {title && (
        <p className="font-arabic text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">
          {title}
        </p>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── MobileCard ──────────────────────────────────────────────────────
// A standalone tappable or static surface — used for things like the
// "next prayer" hero card, feature tiles, etc. Distinct from
// MobileListItem (which is a row inside a MobileSection).
interface MobileCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  onTap?: () => void;
  className?: string;
}

export function MobileCard({
  children,
  onTap,
  className,
  ...motionProps
}: MobileCardProps) {
  const isInteractive = !!onTap;

  return (
    <motion.div
      onClick={onTap}
      whileTap={isInteractive ? { scale: 0.97 } : undefined}
      transition={TAP_SPRING}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm p-4",
        isInteractive && "cursor-pointer active:bg-gray-50",
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

// ── MobileListItem ──────────────────────────────────────────────────
// A single tappable row — the workhorse of the More page and any future
// settings/menu screens. Supports a leading icon, title/subtitle, a
// trailing element (badge, switch, chevron), and RTL-aware chevron
// direction automatically.
interface MobileListItemProps {
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onTap?: () => void;
  href?: string;
  locale: string;
  showChevron?: boolean;
  className?: string;
}

export function MobileListItem({
  icon: Icon,
  iconColor = "#1B6B4A",
  iconBg = "rgba(27,107,74,0.1)",
  title,
  subtitle,
  trailing,
  onTap,
  href,
  locale,
  showChevron = true,
  className,
}: MobileListItemProps) {
  const isAr = locale === "ar";
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const content = (
    <motion.div
      onClick={onTap}
      whileTap={{ backgroundColor: "rgba(0,0,0,0.02)" }}
      transition={TAP_SPRING}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 min-h-[56px] border-b border-gray-50 last:border-0",
        (onTap || href) && "cursor-pointer",
        className,
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={19} style={{ color: iconColor }} />
        </div>
      )}
      <div className="flex-1 min-w-0 text-right">
        <p className="font-arabic text-sm font-bold text-gray-800 truncate">
          {title}
        </p>
        {subtitle && (
          <p className="font-arabic text-xs text-gray-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {trailing}
      {showChevron && !trailing && (
        <ChevronIcon size={16} className="text-gray-300 flex-shrink-0" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

// ── MobileIconButton ────────────────────────────────────────────────
// Touch-friendly icon button (48dp minimum tap target per Material
// Design accessibility guidance) — used in NativeAppBar for actions
// like notifications/search/back, and anywhere else a bare icon needs
// to be tappable with consistent feedback.
interface MobileIconButtonProps {
  icon: LucideIcon;
  onTap?: () => void;
  label: string;
  active?: boolean;
  size?: number;
  className?: string;
}

export function MobileIconButton({
  icon: Icon,
  onTap,
  label,
  active = false,
  size = 20,
  className,
}: MobileIconButtonProps) {
  return (
    <motion.button
      onClick={onTap}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
      transition={TAP_SPRING}
      className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100",
        className,
      )}
    >
      <Icon size={size} />
    </motion.button>
  );
}
