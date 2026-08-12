"use client";

import { createContext, useContext, useState, useCallback } from "react";

/**
 * Lets a page deep in the tree (currently only MushafViewer's Focus Mode)
 * tell NativeLayout to temporarily hide the fixed Bottom Nav and/or the
 * fixed top App Bar — without NativeLayout needing to know anything about
 * Quran-specific concepts like "Focus Mode", and without MushafViewer
 * needing to know anything about NativeLayout's internals.
 *
 * hideBottomNav must NEVER be set to true by the Quran reader — the
 * Bottom Navigation must remain visible on the Quran page at all times,
 * including Focus Mode, per product requirement. hideAppBar is the only
 * chrome element Focus Mode is allowed to hide.
 *
 * Default state is always `false` for both, so any page that never
 * touches this context automatically keeps full chrome visible.
 */

interface NativeChromeState {
  hideBottomNav: boolean;
  setHideBottomNav: (hidden: boolean) => void;
  hideAppBar: boolean;
  setHideAppBar: (hidden: boolean) => void;
}

const noop = () => {};

const NativeChromeContext = createContext<NativeChromeState>({
  hideBottomNav: false,
  setHideBottomNav: noop,
  hideAppBar: false,
  setHideAppBar: noop,
});

export function NativeChromeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideBottomNav, setHideBottomNavState] = useState(false);
  const [hideAppBar, setHideAppBarState] = useState(false);

  const setHideBottomNav = useCallback((hidden: boolean) => {
    setHideBottomNavState(hidden);
  }, []);

  const setHideAppBar = useCallback((hidden: boolean) => {
    setHideAppBarState(hidden);
  }, []);

  return (
    <NativeChromeContext.Provider
      value={{ hideBottomNav, setHideBottomNav, hideAppBar, setHideAppBar }}
    >
      {children}
    </NativeChromeContext.Provider>
  );
}

export function useNativeChrome() {
  return useContext(NativeChromeContext);
}
