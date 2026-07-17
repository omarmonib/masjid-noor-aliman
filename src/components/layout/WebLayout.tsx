// src/components/layout/WebLayout.tsx
"use client";

import Navbar from "@/components/layout/Navbar";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";
import AdhanPlayer from "@/components/notifications/AdhanPlayer";

/**
 * The web/desktop browser shell — this is a near-verbatim extraction of
 * what [locale]/layout.tsx already rendered before this native-app
 * project started. Nothing here is new or restyled; it exists purely so
 * AppChrome can switch between this and NativeLayout symmetrically,
 * without web visitors experiencing any change at all.
 *
 * Deliberately NOT included here (unlike before): NativeAdhanScheduler,
 * NativeAuthBridge, and UpdateGate. Those three components already
 * internally no-op on non-native platforms (they each check
 * isNativeApp()/Capacitor.isNativePlatform() at the top of their own
 * effects), so they stay mounted at the root layout level for both
 * shells rather than being duplicated into WebLayout and NativeLayout
 * separately — see the updated [locale]/layout.tsx for where they now
 * live.
 */

interface Props {
  locale: string;
  children: React.ReactNode;
}

export default function WebLayout({ locale, children }: Props) {
  return (
    <>
      <Navbar locale={locale} />
      <NotificationPrompt locale={locale} />
      <AdhanPlayer locale={locale} />
      {children}
    </>
  );
}
