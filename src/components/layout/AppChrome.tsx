// src/components/layout/AppChrome.tsx
"use client";

import { useIsNative } from "@/hooks/useIsNative";
import WebLayout from "@/components/layout/WebLayout";
import NativeLayout from "@/components/layout/native/NativeLayout";

/**
 * The single switch point between the web/desktop experience and the
 * native (Capacitor) app experience. This component has no visual output
 * of its own — it purely decides which of the two independent shells to
 * render, both of which wrap the exact same `children` (the actual page
 * content), so no page is ever duplicated between platforms.
 *
 * While platform detection is still resolving (the brief window right
 * after mount before useIsNative's effect runs), this renders nothing
 * rather than committing to WebLayout first and possibly swapping to
 * NativeLayout a frame later — avoiding a visible flash of the wrong
 * chrome on a real native device. This window is only a few milliseconds
 * and the app's own splash screen (configured via
 * @capacitor/splash-screen) covers it in practice on native devices; on
 * web, isResolved becomes true essentially instantly since there's no
 * native bridge to check.
 */

interface Props {
  locale: string;
  children: React.ReactNode;
}

export default function AppChrome({ locale, children }: Props) {
  const { isNative, isResolved } = useIsNative();

  if (!isResolved) return null;

  if (isNative) {
    return <NativeLayout locale={locale}>{children}</NativeLayout>;
  }

  return <WebLayout locale={locale}>{children}</WebLayout>;
}
