"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/capacitor-adhan";

export default function NativeAuthBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;

    const subPromise = App.addListener("appUrlOpen", async ({ url }) => {
      try {
        const parsed = new URL(url);
        if (
          parsed.protocol !== "masjidnooraliman:" ||
          parsed.host !== "auth-callback"
        ) {
          return;
        }

        const { Browser } = await import("@capacitor/browser");
        Browser.close().catch(() => {});

        const error = parsed.searchParams.get("error");
        if (error) {
          window.location.href = "/";
          return;
        }

        const code = parsed.searchParams.get("code");
        const dest = parsed.searchParams.get("dest");
        if (!code) return;

        const res = await fetch("/api/auth/native-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        window.location.href = res.ok && dest ? decodeURIComponent(dest) : "/";
      } catch (e) {
        console.error("Native auth bridge error:", e);
      }
    });

    return () => {
      subPromise.then((sub) => sub.remove());
    };
  }, []);

  return null;
}
