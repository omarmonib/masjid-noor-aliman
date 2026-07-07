"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  isNativeApp,
  isNativeAdhanEnabled,
  scheduleNativeAdhanNotifications,
} from "@/lib/capacitor-adhan";

export default function NativeAdhanScheduler() {
  useEffect(() => {
    if (!isNativeApp()) return;

    // Status bar styling — reinforced at runtime since some Android
    // devices don't reliably pick up the capacitor.config.ts defaults
    // until the WebView has fully loaded.
    StatusBar.setBackgroundColor({ color: "#1B6B4A" }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    if (isNativeAdhanEnabled()) {
      scheduleNativeAdhanNotifications();
    }

    const sub = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        StatusBar.setBackgroundColor({ color: "#1B6B4A" }).catch(() => {});
        if (isNativeAdhanEnabled()) {
          scheduleNativeAdhanNotifications();
        }
      }
    });

    return () => {
      sub.then((s) => s.remove());
    };
  }, []);

  return null;
}
