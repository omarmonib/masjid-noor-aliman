// src/hooks/useNetworkStatus.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { isNativeApp } from "@/lib/capacitor-adhan";

export interface NetworkStatus {
  /** True once we've actually determined status — avoids flashing an
   * "offline" banner during the brief window before the first check. */
  isResolved: boolean;
  isOnline: boolean;
  /** Manually re-check right now (e.g. user tapped "retry"). */
  recheck: () => void;
}

const PING_URL_WEB = "/api/ping";
const PING_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 15000;

async function pingServer(): Promise<boolean> {
  if (typeof fetch !== "function") return navigator.onLine;
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
    : null;
  try {
    const res = await fetch(PING_URL_WEB, {
      method: "GET",
      cache: "no-store",
      signal: controller?.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isResolved, setIsResolved] = useState(false);
  const pollRef = useRef<number | null>(null);

  const recheck = useCallback(() => {
    if (isNativeApp()) {
      import("@capacitor/network").then(({ Network }) => {
        Network.getStatus().then((status) => {
          setIsOnline(status.connected);
          setIsResolved(true);
        });
      });
      return;
    }
    pingServer().then((online) => {
      setIsOnline(online);
      setIsResolved(true);
    });
  }, []);

  useEffect(() => {
    let cleanupNative: (() => void) | null = null;

    if (isNativeApp()) {
      import("@capacitor/network").then(({ Network }) => {
        Network.getStatus().then((status) => {
          setIsOnline(status.connected);
          setIsResolved(true);
        });
        const sub = Network.addListener("networkStatusChange", (status) => {
          setIsOnline(status.connected);
        });
        cleanupNative = () => {
          sub.then((s) => s.remove());
        };
      });
    } else {
      recheck();
      const onOnline = () => recheck();
      const onOffline = () => setIsOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      pollRef.current = window.setInterval(recheck, POLL_INTERVAL_MS);

      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }

    return () => {
      if (cleanupNative) cleanupNative();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, isResolved, recheck };
}
