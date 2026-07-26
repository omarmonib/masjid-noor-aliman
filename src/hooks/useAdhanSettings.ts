// src/hooks/useAdhanSettings.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ADHAN_VOICES,
  getSelectedVoice,
  setSelectedVoice,
  isNativeAdhanEnabled,
  toggleNativeAdhan,
  type AdhanVoiceId,
} from "@/lib/capacitor-adhan";

/**
 * Single source of truth for Adhan settings UI state — voice selection,
 * preview playback, enable/disable toggle. Extracted so both
 * AdhanSettingsButton (existing navbar popup) and the Notifications page
 * consume the exact same logic instead of maintaining two separate
 * copies of preview-audio handling, which would make the reported Adhan
 * bug harder to track down across two divergent implementations.
 *
 * This hook does NOT change how settings are persisted or how alarms are
 * scheduled — it only consolidates the UI-facing state management that
 * previously lived inline inside AdhanSettingsButton. All actual
 * persistence/scheduling still goes through the existing functions in
 * capacitor-adhan.ts, untouched by this refactor.
 *
 * Preview playback still uses the same archive.org-hosted preview clips
 * (PREVIEW_BASE) as the original component — that wasn't moved into
 * capacitor-adhan.ts since it's a UI-preview concern, not part of the
 * actual notification-scheduling engine.
 */

const PREVIEW_BASE = "https://archive.org/download/adhan_202607";

export type PreviewVariant = "regular" | "fajr";
export type PreviewKey = `${AdhanVoiceId}:${PreviewVariant}`;

export function useAdhanSettings() {
  const [enabled, setEnabled] = useState(false);
  const [selectedVoice, setSelectedVoiceState] =
    useState<AdhanVoiceId>(getSelectedVoice());
  const [previewingKey, setPreviewingKey] = useState<PreviewKey | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setEnabled(isNativeAdhanEnabled());
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const selectVoice = useCallback((id: AdhanVoiceId) => {
    setSelectedVoiceState(id);
    setSelectedVoice(id);
  }, []);

  const stopPreview = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewingKey(null);
  }, []);

  const preview = useCallback(
    (voiceId: AdhanVoiceId, variant: PreviewVariant, isAr: boolean) => {
      const key: PreviewKey = `${voiceId}:${variant}`;

      if (previewingKey === key) {
        stopPreview();
        return;
      }

      audioRef.current?.pause();

      const voice = ADHAN_VOICES.find((v) => v.id === voiceId)!;
      const filename = variant === "fajr" ? voice.fajrFile : voice.file;
      const audio = new Audio(`${PREVIEW_BASE}/${filename}`);
      audio.onended = () => setPreviewingKey(null);
      audio.onerror = () => {
        setPreviewingKey(null);
        alert(
          isAr
            ? "تعذّر تشغيل المعاينة — تحقق من الرابط"
            : "Preview failed to load — check the URL",
        );
      };
      audioRef.current = audio;
      audio.play().catch(() => setPreviewingKey(null));
      setPreviewingKey(key);
    },
    [previewingKey, stopPreview],
  );

  const toggleEnabled = useCallback(
    async (isAr: boolean) => {
      const next = !enabled;
      await toggleNativeAdhan(next, isAr);
      setEnabled(next);
    },
    [enabled],
  );

  return {
    enabled,
    toggleEnabled,
    selectedVoice,
    selectVoice,
    previewingKey,
    preview,
    stopPreview,
  };
}
