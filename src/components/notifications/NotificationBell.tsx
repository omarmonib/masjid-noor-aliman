"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
} from "./push-client";
import {
  isNativeApp,
  isNativeAdhanEnabled,
  toggleNativeAdhan,
} from "@/lib/capacitor-adhan";

export default function NotificationBell({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const native = isNativeApp();

  const [status, setStatus] = useState<
    "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"
  >("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (native) {
      setStatus(isNativeAdhanEnabled() ? "subscribed" : "unsubscribed");
    } else {
      getPushSubscriptionStatus().then(setStatus);
    }
  }, [native]);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);

    if (native) {
      const next = status !== "subscribed";
      await toggleNativeAdhan(next, isAr);
      setStatus(next ? "subscribed" : "unsubscribed");
      setBusy(false);
      return;
    }

    if (status === "subscribed") {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
    } else if (status === "unsubscribed") {
      const ok = await subscribeToPush();
      setStatus(ok ? "subscribed" : "denied");
    } else if (status === "denied") {
      alert(
        isAr
          ? "الإشعارات محظورة من إعدادات المتصفح. يرجى تفعيلها من إعدادات الموقع."
          : "Notifications are blocked in your browser. Please enable them in site settings.",
      );
    }

    setBusy(false);
  };

  // Only the web-push path can legitimately be "unsupported"; the native
  // path always resolves to subscribed/unsubscribed synchronously.
  if (status === "loading") return null;
  if (!native && status === "unsupported") return null;

  const Icon =
    status === "subscribed" ? BellRing : status === "denied" ? BellOff : Bell;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={
        status === "subscribed"
          ? isAr
            ? "تنبيه الصلاة مفعّل — اضغط للإيقاف"
            : "Prayer Alert On — tap to turn off"
          : isAr
            ? "تنبيه الصلاة متوقف — اضغط للتفعيل"
            : "Alert Off — tap to enable"
      }
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
        status === "subscribed"
          ? "bg-primary/10 text-primary"
          : "text-gray-500 hover:bg-gray-50 hover:text-primary"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}
