"use client";

import { useState, useEffect } from "react";
import {
  subscribeToPush,
  getPushSubscriptionStatus,
  type PushStatus,
} from "./push-client";

const DISMISS_KEY = "prayer-notif-prompt-dismissed";

export default function NotificationPrompt({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    getPushSubscriptionStatus().then((status: PushStatus) => {
      if (status === "unsubscribed") {
        setTimeout(() => setVisible(true), 2500);
      }
    });
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    await subscribeToPush();
    setBusy(false);
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🔔</div>
        <div className="flex-1 min-w-0">
          <p className="font-arabic font-bold text-gray-800 text-sm mb-1">
            {isAr ? "تفعيل تنبيهات الصلاة" : "Enable Prayer Notifications"}
          </p>
          <p className="font-arabic text-gray-500 text-xs leading-relaxed mb-3">
            {isAr
              ? "احصل على تنبيه بالأذان وموعد الإقامة لكل صلاة على هاتفك"
              : "Get notified for the Adhan and Iqamah time for each prayer on your phone"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={enable}
              disabled={busy}
              className="px-4 py-1.5 rounded-lg text-white text-xs font-arabic font-bold disabled:opacity-50"
              style={{
                background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
              }}
            >
              {busy
                ? isAr
                  ? "جارٍ التفعيل..."
                  : "Enabling..."
                : isAr
                  ? "تفعيل"
                  : "Enable"}
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-arabic"
            >
              {isAr ? "لاحقاً" : "Later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
