// src/hooks/usePushSubscription.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
  type PushStatus,
} from "@/components/notifications/push-client";

/**
 * Single source of truth for web push notification subscription state —
 * extracted so NotificationBell (navbar bell icon) and the Notifications
 * page consume the exact same logic instead of each maintaining its own
 * local status/loading/error state, mirroring the useAdhanSettings
 * extraction for the same reasons (single source of truth, easier
 * debugging, easier maintenance).
 *
 * This hook does NOT change how push subscriptions actually work — every
 * call here delegates directly to the existing, untouched functions in
 * push-client.ts (subscribeToPush, unsubscribeFromPush,
 * getPushSubscriptionStatus). Those already handle the real browser APIs
 * (navigator.serviceWorker, PushManager, VAPID key, the /api/push/subscribe
 * fetch calls) — this hook only adds a coherent loading/error layer on
 * top and exposes one `toggle()` entry point so consuming components
 * don't need to re-implement the "if subscribed, unsubscribe; if
 * unsubscribed, subscribe; if denied, explain why" branching themselves.
 */

interface UsePushSubscriptionResult {
  status: PushStatus;
  busy: boolean;
  error: string | null;
  toggle: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePushSubscription(locale: string): UsePushSubscriptionResult {
  const isAr = locale === "ar";
  const [status, setStatus] = useState<PushStatus>("unsubscribed");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await getPushSubscriptionStatus();
      setStatus(result);
    } catch {
      setError(
        isAr
          ? "تعذّر التحقق من حالة الإشعارات"
          : "Couldn't check notification status",
      );
    } finally {
      setBusy(false);
    }
  }, [isAr]);

  useEffect(() => {
    refresh();
    // Deliberately not depending on `refresh` beyond mount — this should
    // only run once when the hook is first used, same as
    // NotificationBell's original one-time status check on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("unsubscribed");
      } else if (status === "unsubscribed") {
        const ok = await subscribeToPush();
        setStatus(ok ? "subscribed" : "denied");
      } else if (status === "denied") {
        setError(
          isAr
            ? "الإشعارات محظورة من إعدادات المتصفح. يرجى تفعيلها من إعدادات الموقع."
            : "Notifications are blocked in your browser. Please enable them in site settings.",
        );
      }
      // "unsupported" — nothing to toggle, no-op.
    } catch {
      setError(
        isAr
          ? "حدث خطأ أثناء تحديث إعدادات الإشعارات"
          : "Something went wrong updating notification settings",
      );
    } finally {
      setBusy(false);
    }
  }, [status, busy, isAr]);

  return { status, busy, error, toggle, refresh };
}