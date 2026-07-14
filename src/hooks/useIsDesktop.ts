"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the viewport is at least `breakpointPx` wide, updating live
 * as the window is resized (via matchMedia — cheap, doesn't fire on every
 * pixel of a drag-resize like a raw `resize` listener would).
 *
 * Starts `false` on the server and on first client render to avoid a
 * hydration mismatch, then syncs to the real viewport right after mount.
 */
export function useIsDesktop(breakpointPx: number = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();

    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    // Safari < 14 fallback
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [breakpointPx]);

  return isDesktop;
}
