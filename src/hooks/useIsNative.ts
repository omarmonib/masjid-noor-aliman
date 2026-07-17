"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/capacitor-adhan";

/**
 * Detects whether the app is running inside the Capacitor native shell
 * (Android/iOS) versus a normal web browser.
 *
 * Starts `false` (web) on both the server and the client's first render to
 * avoid a hydration mismatch — Capacitor's native bridge doesn't exist
 * during SSR, so the server can never know the real answer. Once mounted,
 * it synchronously checks `isNativeApp()` (Capacitor.isNativePlatform())
 * and flips to `true` if running natively. This mirrors the exact pattern
 * already used by useIsDesktop.ts elsewhere in this codebase.
 *
 * Also exposes `isResolved` so callers can distinguish "definitely web"
 * from "haven't checked yet" — useful for chrome-switching components
 * that want to avoid a flash of the wrong layout on native devices.
 */
export function useIsNative(): { isNative: boolean; isResolved: boolean } {
  const [isNative, setIsNative] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());
    setIsResolved(true);
  }, []);

  return { isNative, isResolved };
}
