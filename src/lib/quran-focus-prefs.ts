"use client";

const FOCUS_MODE_KEY = "quran:focus-mode";

/** Persists whether Focus Mode was last left on, so it's remembered across
 * visits (unlike the settings-panel-hidden pref, which is session-only). */
export function getFocusModePref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FOCUS_MODE_KEY) === "1";
}

export function setFocusModePref(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_MODE_KEY, enabled ? "1" : "0");
}
