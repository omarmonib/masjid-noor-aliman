"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
} from "./push-client";

export default function NotificationBell({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [status, setStatus] = useState<
    "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"
  >("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus);
  }, []);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);

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

  if (status === "loading" || status === "unsupported") return null;

  const Icon =
    status === "subscribed" ? BellRing : status === "denied" ? BellOff : Bell;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={
        status === "subscribed"
          ? isAr
            ? "إيقاف تنبيهات الصلاة"
            : "Disable prayer notifications"
          : isAr
            ? "تفعيل تنبيهات الصلاة"
            : "Enable prayer notifications"
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
