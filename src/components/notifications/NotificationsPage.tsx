// src/components/notifications/NotificationsPage.tsx
"use client";

import { Play, Square, Bell, BellRing, Volume2 } from "lucide-react";
import { isNativeApp, ADHAN_VOICES } from "@/lib/capacitor-adhan";
import { useAdhanSettings } from "@/hooks/useAdhanSettings";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import {
  MobilePage,
  MobileSection,
  MobileListItem,
} from "@/components/mobile/MobileUI";

/**
 * Real Notifications screen — surfaces only functionality that actually
 * exists in this codebase today:
 *   - Native Adhan on/off toggle + voice selection + preview (native only)
 *   - Web push subscription status + toggle
 * Deliberately omits: notification history (no backend support exists —
 * NotificationLog is a server-side dedup table, not a per-user history
 * feed), exact-alarm permission status (no runtime check is exposed
 * anywhere in this codebase to surface). Per project convention, these
 * are omitted entirely rather than shown as placeholders.
 *
 * Consumes useAdhanSettings() and usePushSubscription() directly — the
 * same shared hooks NotificationBell and AdhanSettingsButton use, so
 * there is exactly one implementation of every piece of notification
 * logic in the app.
 */

interface Props {
  locale: string;
}

export default function NotificationsPage({ locale }: Props) {
  const isAr = locale === "ar";
  const native = isNativeApp();

  const adhan = useAdhanSettings();
  const push = usePushSubscription(locale);

  const handlePushToggle = async () => {
    if (push.status === "denied") return; // message shown inline below instead of an alert on a full page
    await push.toggle();
  };

  return (
    <MobilePage>
      {native ? (
        <>
          <MobileSection title={isAr ? "الأذان" : "Adhan"}>
            <MobileListItem
              icon={adhan.enabled ? BellRing : Bell}
              iconColor={adhan.enabled ? "#1B6B4A" : "#6B7280"}
              iconBg={
                adhan.enabled ? "rgba(27,107,74,0.1)" : "rgba(107,114,128,0.1)"
              }
              title={isAr ? "تنبيهات الأذان" : "Adhan Notifications"}
              subtitle={
                adhan.busy
                  ? isAr
                    ? "جارٍ التحديث..."
                    : "Updating..."
                  : adhan.enabled
                    ? isAr
                      ? "مفعّلة"
                      : "Enabled"
                    : isAr
                      ? "متوقفة"
                      : "Disabled"
              }
              onTap={() => adhan.toggleEnabled(isAr)}
              locale={locale}
              showChevron={false}
            />
          </MobileSection>

          <MobileSection title={isAr ? "صوت الأذان" : "Adhan Voice"}>
            {ADHAN_VOICES.map((v) => {
              const isSelected = adhan.selectedVoice === v.id;
              const regularKey = `${v.id}:regular` as const;
              const fajrKey = `${v.id}:fajr` as const;

              return (
                <div
                  key={v.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <MobileListItem
                    icon={Volume2}
                    iconColor={isSelected ? "#1B6B4A" : "#6B7280"}
                    iconBg={
                      isSelected
                        ? "rgba(27,107,74,0.1)"
                        : "rgba(107,114,128,0.1)"
                    }
                    title={isAr ? v.labelAr : v.labelEn}
                    trailing={
                      isSelected ? (
                        <span className="text-primary text-sm">✓</span>
                      ) : undefined
                    }
                    onTap={() => adhan.selectVoice(v.id)}
                    locale={locale}
                    showChevron={false}
                    className="border-b-0"
                  />
                  <div className="flex items-center gap-2 px-4 pb-3 -mt-1">
                    <button
                      onClick={() => adhan.preview(v.id, "regular", isAr)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors text-xs font-arabic"
                    >
                      {adhan.previewingKey === regularKey ? (
                        <Square size={12} />
                      ) : (
                        <Play size={12} />
                      )}
                      {isAr ? "استماع" : "Preview"}
                    </button>
                    <button
                      onClick={() => adhan.preview(v.id, "fajr", isAr)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors text-xs font-arabic"
                    >
                      {adhan.previewingKey === fajrKey ? (
                        <Square size={12} />
                      ) : (
                        <Play size={12} />
                      )}
                      {isAr ? "استماع (الفجر)" : "Preview (Fajr)"}
                    </button>
                  </div>
                </div>
              );
            })}
          </MobileSection>
        </>
      ) : (
        push.status !== "unsupported" && (
          <MobileSection title={isAr ? "إشعارات الويب" : "Web Notifications"}>
            <MobileListItem
              icon={push.status === "subscribed" ? BellRing : Bell}
              iconColor={push.status === "subscribed" ? "#1B6B4A" : "#6B7280"}
              iconBg={
                push.status === "subscribed"
                  ? "rgba(27,107,74,0.1)"
                  : "rgba(107,114,128,0.1)"
              }
              title={isAr ? "تنبيهات الصلاة" : "Prayer Alerts"}
              subtitle={
                push.busy
                  ? isAr
                    ? "جارٍ التحديث..."
                    : "Updating..."
                  : push.status === "subscribed"
                    ? isAr
                      ? "مفعّلة"
                      : "Enabled"
                    : push.status === "denied"
                      ? isAr
                        ? "محظورة من المتصفح"
                        : "Blocked in browser"
                      : isAr
                        ? "متوقفة"
                        : "Disabled"
              }
              onTap={handlePushToggle}
              locale={locale}
              showChevron={false}
            />
            {push.status === "denied" && (
              <p className="font-arabic text-xs text-gray-400 px-4 pb-3 -mt-1">
                {isAr
                  ? "الإشعارات محظورة من إعدادات المتصفح. يرجى تفعيلها من إعدادات الموقع."
                  : "Notifications are blocked in your browser. Please enable them in site settings."}
              </p>
            )}
          </MobileSection>
        )
      )}

      {push.error && (
        <p className="font-arabic text-xs text-red-500 text-center mt-2">
          {push.error}
        </p>
      )}
    </MobilePage>
  );
}
