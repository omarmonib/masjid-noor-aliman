"use client";

const PANEL_HIDDEN_KEY = "quran:settings-panel-hidden";

/** Session-only (tab lifetime) memory of whether the user explicitly hid
 * the desktop settings panel for a distraction-free reading view. */
export function getPanelHiddenPref(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PANEL_HIDDEN_KEY) === "1";
}

export function setPanelHiddenPref(hidden: boolean) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PANEL_HIDDEN_KEY, hidden ? "1" : "0");
}
