// src/components/settings/SettingsPage.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Languages,
  Maximize2,
  Volume2,
  Bell,
  BookOpen,
  ZoomIn,
} from "lucide-react";
import { isNativeApp } from "@/lib/capacitor-adhan";
import { useAdhanSettings } from "@/hooks/useAdhanSettings";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { getFocusModePref, setFocusModePref } from "@/lib/quran-focus-prefs";
import { getZoom, getSelectedReciter } from "@/lib/quran-reader-prefs";
import {
  MobilePage,
  MobileSection,
  MobileListItem,
} from "@/components/mobile/MobileUI";

/**
 * Real Settings screen — surfaces only preferences that genuinely exist
 * and are actually persisted somewhere in this codebase today. No fake
 * toggles, no "Coming soon" rows.
 *
 * Reciter selection and Focus Mode are runtime states of an active Quran
 * reading session (ReciterPanel is a rich searchable picker that needs
 * reader context to make sense). Reciter is shown here read-only with a
 * link into the reader, rather than duplicating ReciterPanel's picker UI
 * a second time. Focus Mode is a plain boolean, safe to toggle directly.
 *
 * Adhan/Push logic is entirely delegated to the same shared hooks used by
 * NotificationBell/AdhanSettingsButton/NotificationsPage — this file adds
 * zero new notification business logic, only presentation + one link to
 * the full voice picker (which already lives on the Notifications page)
 * instead of building a third copy of that picker UI.
 */

interface Props {
  locale: string;
}

type Locale = "ar" | "en";

export default function SettingsPage({ locale }: Props) {
  const isAr = locale === "ar";
  const native = isNativeApp();
  const router = useRouter();
  const pathname = usePathname();

  const adhan = useAdhanSettings();
  const push = usePushSubscription(locale);

  const [focusMode, setFocusModeState] = useState(false);
  const [zoom, setZoomDisplay] = useState(1);
  const [reciterName, setReciterName] = useState<string | null>(null);

  useEffect(() => {
    setFocusModeState(getFocusModePref());
    setZoomDisplay(getZoom());
    const reciter = getSelectedReciter();
    setReciterName(reciter ? (isAr ? reciter.nameAr : reciter.nameEn) : null);
  }, [isAr]);

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusModeState(next);
    setFocusModePref(next);
  };

  const switchLocale = (target: Locale) => {
    if (target === locale) return;
    // Preserve the current page when switching — swap only the leading
    // /ar or /en segment of the pathname rather than always returning to
    // the home page, matching next-intl's localePrefix: "always" setup.
    const segments = pathname.split("/");
    segments[1] = target;
    router.push(segments.join("/"));
  };

  return (
    <MobilePage>
      <MobileSection title={isAr ? "اللغة" : "Language"}>
        <MobileListItem
          icon={Languages}
          title={isAr ? "العربية" : "Arabic"}
          trailing={
            locale === "ar" ? (
              <span className="text-primary text-sm">✓</span>
            ) : undefined
          }
          onTap={() => switchLocale("ar")}
          locale={locale}
          showChevron={false}
        />
        <MobileListItem
          icon={Languages}
          title={isAr ? "الإنجليزية" : "English"}
          trailing={
            locale === "en" ? (
              <span className="text-primary text-sm">✓</span>
            ) : undefined
          }
          onTap={() => switchLocale("en")}
          locale={locale}
          showChevron={false}
        />
      </MobileSection>

      <MobileSection title={isAr ? "قراءة القرآن" : "Quran Reading"}>
        <MobileListItem
          icon={ZoomIn}
          title={isAr ? "مستوى التكبير" : "Zoom Level"}
          subtitle={`${Math.round(zoom * 100)}%`}
          onTap={() => router.push(`/${locale}/quran`)}
          locale={locale}
        />
        <MobileListItem
          icon={BookOpen}
          title={isAr ? "القارئ المختار" : "Selected Reciter"}
          subtitle={
            reciterName ||
            (isAr
              ? "لم يُحدد بعد — اختر من داخل القارئ"
              : "Not set — choose from the reader")
          }
          onTap={() => router.push(`/${locale}/quran`)}
          locale={locale}
        />
        <MobileListItem
          icon={Maximize2}
          title={isAr ? "وضع القراءة المركّز" : "Reading Focus Mode"}
          subtitle={
            focusMode
              ? isAr
                ? "مفعّل"
                : "Enabled"
              : isAr
                ? "متوقف"
                : "Disabled"
          }
          onTap={toggleFocusMode}
          locale={locale}
          showChevron={false}
        />
      </MobileSection>

      {native ? (
        <MobileSection title={isAr ? "الأذان" : "Adhan"}>
          <MobileListItem
            icon={Volume2}
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
          <MobileListItem
            icon={Volume2}
            title={isAr ? "اختيار صوت الأذان" : "Choose Adhan Voice"}
            onTap={() => router.push(`/${locale}/notifications`)}
            locale={locale}
          />
        </MobileSection>
      ) : (
        push.status !== "unsupported" && (
          <MobileSection title={isAr ? "الإشعارات" : "Notifications"}>
            <MobileListItem
              icon={Bell}
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
              onTap={() => {
                if (push.status === "denied") return;
                push.toggle();
              }}
              locale={locale}
              showChevron={false}
            />
          </MobileSection>
        )
      )}
    </MobilePage>
  );
}
