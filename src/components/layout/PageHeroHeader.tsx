// src/components/layout/PageHeroHeader.tsx
"use client";

import { useIsNative } from "@/hooks/useIsNative";

/**
 * Wraps a page's large green hero/header section (used today on Home,
 * Quran, Prayer Times, and Adhkar) so it renders normally on the web,
 * but is omitted entirely inside the native app shell — where
 * NativeAppBar already shows the page title in a compact fixed bar, so
 * repeating it in a large banner would waste vertical space and not
 * match how a real native app screen looks.
 *
 * Each page keeps its existing hero JSX completely unchanged — it's
 * simply passed as `children` to this wrapper instead of being rendered
 * directly. No page markup is duplicated or rewritten; only wrapped.
 *
 * While platform detection is still resolving (the same brief window
 * described in useIsNative/AppChrome), this renders nothing rather than
 * flashing the hero on a native device before hiding it a frame later.
 */

interface Props {
  children: React.ReactNode;
}

export default function PageHeroHeader({ children }: Props) {
  const { isNative, isResolved } = useIsNative();

  if (!isResolved) return null;
  if (isNative) return null;

  return <>{children}</>;
}
