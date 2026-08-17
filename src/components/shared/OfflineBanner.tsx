// src/components/shared/OfflineBanner.tsx
"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface Props {
  locale: string;
  /** Optional extra context, e.g. "الأخبار والإعلانات" */
  featureLabel?: string;
  className?: string;
}

/** Renders nothing while online or before the first check resolves —
 * safe to mount unconditionally at the top of any network-dependent
 * section without affecting the online experience at all. */
export default function OfflineBanner({
  locale,
  featureLabel,
  className,
}: Props) {
  const { isOnline, isResolved, recheck } = useNetworkStatus();
  const isAr = locale === "ar";

  if (!isResolved || isOnline) return null;

  return (
    <div
      className={`flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 ${className ?? ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <WifiOff size={18} className="text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-arabic text-sm font-bold text-amber-800">
          {isAr ? "لا يوجد اتصال بالإنترنت" : "No internet connection"}
        </p>
        <p className="font-arabic text-xs text-amber-700 mt-0.5">
          {isAr
            ? `${featureLabel ? featureLabel + " " : ""}يحتاج إلى اتصال بالإنترنت. حاول مرة أخرى عند توفر الاتصال.`
            : `${featureLabel ?? "This"} requires an internet connection. Try again once you're back online.`}
        </p>
      </div>
      <button
        onClick={recheck}
        className="flex-shrink-0 text-xs font-arabic font-bold text-amber-700 border border-amber-300 rounded-full px-3 py-1.5 hover:bg-amber-100 transition-colors"
      >
        {isAr ? "إعادة المحاولة" : "Retry"}
      </button>
    </div>
  );
}
