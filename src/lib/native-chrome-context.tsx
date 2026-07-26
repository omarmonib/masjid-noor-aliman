// src/lib/native-chrome-context.tsx
"use client";

import { createContext, useContext, useState, useCallback } from "react";

/**
 * Lets a page deep in the tree (currently only MushafViewer's Focus Mode)
 * tell NativeLayout to temporarily hide the fixed Bottom Nav — without
 * NativeLayout needing to know anything about Quran-specific concepts
 * like "Focus Mode", and without MushafViewer needing to know anything
 * about NativeLayout's internals.
 *
 * Provided once by NativeLayout, consumed by any native page that needs
 * this control. On web, WebLayout never renders this provider, so
 * useNativeChrome() falls back to a harmless no-op (see default value
 * below) — components can safely call setHideBottomNav() on web without
 * any error or effect, which is what keeps MushafViewer a single shared
 * component rather than needing a native/web fork.
 *
 * Default state is always `false` (bottom nav visible) so any page that
 * never touches this context — which is every page except the Quran
 * reader today — automatically satisfies "bottom nav stays visible
 * throughout the native app."
 */

interface NativeChromeState {
  hideBottomNav: boolean;
  setHideBottomNav: (hidden: boolean) => void;
}

const noop = () => {};

const NativeChromeContext = createContext<NativeChromeState>({
  hideBottomNav: false,
  setHideBottomNav: noop,
});

export function NativeChromeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideBottomNav, setHideBottomNavState] = useState(false);

  const setHideBottomNav = useCallback((hidden: boolean) => {
    setHideBottomNavState(hidden);
  }, []);

  return (
    <NativeChromeContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </NativeChromeContext.Provider>
  );
}

export function useNativeChrome() {
  return useContext(NativeChromeContext);
}
