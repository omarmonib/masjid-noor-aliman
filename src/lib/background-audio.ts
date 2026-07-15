"use client";

import { Capacitor } from "@capacitor/core";

let enabled = false;
let unavailableWarned = false;

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Keeps the WebView's JS runtime (and therefore the <audio> element it
 * owns) alive when the app is backgrounded or the screen locks, and shows
 * an Android foreground-service notification while active — this is what
 * lets Quran playback survive the screen locking or the user switching
 * apps, instead of the WebView being frozen/suspended like a normal
 * backgrounded tab.
 *
 * Requires `@anuradev/capacitor-background-mode` (the maintained successor
 * to the now-unpublished `@capacitor-community/background-mode`):
 *   pnpm add @anuradev/capacitor-background-mode
 *   npx cap sync android
 * plus the FOREGROUND_SERVICE / FOREGROUND_SERVICE_MEDIA_PLAYBACK /
 * WAKE_LOCK permissions in AndroidManifest.xml (added alongside this
 * change). No-ops on web, and silently no-ops if the plugin isn't
 * installed yet, so it's always safe to call.
 */
export async function enableBackgroundAudio(): Promise<void> {
  if (!isNativePlatform() || enabled) return;
  try {
    const { BackgroundMode } =
      await import("@anuradev/capacitor-background-mode");
    await BackgroundMode.enable({});
    await BackgroundMode.disableWebViewOptimizations().catch(() => {});
    enabled = true;
  } catch (e) {
    if (!unavailableWarned) {
      console.warn(
        "[background-audio] @anuradev/capacitor-background-mode not installed:",
        e,
      );
      unavailableWarned = true;
    }
  }
}

export async function disableBackgroundAudio(): Promise<void> {
  if (!isNativePlatform() || !enabled) return;
  try {
    const { BackgroundMode } =
      await import("@anuradev/capacitor-background-mode");
    await BackgroundMode.disable();
  } catch {
    /* ignore */
  } finally {
    enabled = false;
  }
}
