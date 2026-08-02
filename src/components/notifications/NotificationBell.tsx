"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { isNativeApp } from "@/lib/capacitor-adhan";
import { useAdhanSettings } from "@/hooks/useAdhanSettings";
import { usePushSubscription } from "@/hooks/usePushSubscription";

/**
 * Navbar bell icon — toggles native Adhan notifications on native, or web
 * push subscription on web. Both branches consume the shared hooks
 * (useAdhanSettings / usePushSubscription) instead of managing their own
 * status/busy state inline, so this component is purely presentational:
 * it renders the bell and calls the appropriate hook's toggle function.
 */
export default function NotificationBell({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const native = isNativeApp();

  const adhan = useAdhanSettings();
  const push = usePushSubscription(locale);

  // Unified view of "is this on" and "is something in-flight" regardless
  // of which branch is active, so the render logic below doesn't need to
  // branch a second time.
  const isOn = native ? adhan.enabled : push.status === "subscribed";
  const busy = native ? adhan.busy : push.busy;
  const unsupported = !native && push.status === "unsupported";

  const handleClick = async () => {
    if (native) {
      await adhan.toggleEnabled(isAr);
      return;
    }

    if (push.status === "denied") {
      alert(
        isAr
          ? "الإشعارات محظورة من إعدادات المتصفح. يرجى تفعيلها من إعدادات الموقع."
          : "Notifications are blocked in your browser. Please enable them in site settings.",
      );
      return;
    }

    await push.toggle();
  };

  if (!native && push.busy && push.status === "unsubscribed") {
    // Initial status check still in flight on first mount — render
    // nothing rather than flashing an incorrect default state, matching
    // the original component's "loading" behavior.
    return null;
  }
  if (unsupported) return null;

  const Icon = isOn
    ? BellRing
    : native
      ? Bell
      : push.status === "denied"
        ? BellOff
        : Bell;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={
        isOn
          ? isAr
            ? "تنبيه الصلاة مفعّل — اضغط للإيقاف"
            : "Prayer Alert On — tap to turn off"
          : isAr
            ? "تنبيه الصلاة متوقف — اضغط للتفعيل"
            : "Alert Off — tap to enable"
      }
      className={`flex items-center gap-1.5 px-2 h-9 rounded-full transition-colors disabled:opacity-50 ${
        isOn
          ? "bg-primary/10 text-primary"
          : "text-gray-500 hover:bg-gray-50 hover:text-primary"
      }`}
    >
      <Icon size={18} />
      {isOn && (
        <span className="font-arabic text-xs font-bold whitespace-nowrap">
          {isAr ? "مفعّل" : "Activated"}
        </span>
      )}
    </button>
  );
}
