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

const PREVIEW_BASE = "https://archive.org/download/adhan_202607";

export type PreviewVariant = "regular" | "fajr";
export type PreviewKey = `${AdhanVoiceId}:${PreviewVariant}`;

export function useAdhanSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
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

      // Preview clips are streamed from archive.org — genuinely
      // online-only. A clear Arabic message beats a silent hang or a
      // confusing generic "check the URL" alert while offline.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        alert(
          isAr
            ? "معاينة الصوت تحتاج إلى اتصال بالإنترنت"
            : "Audio preview requires an internet connection",
        );
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
            ? "تعذّر تشغيل المعاينة — تحقق من الاتصال بالإنترنت"
            : "Preview failed to load — check your internet connection",
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
      if (busy) return;
      setBusy(true);
      try {
        const next = !enabled;
        await toggleNativeAdhan(next, isAr);
        setEnabled(next);
      } finally {
        setBusy(false);
      }
    },
    [enabled, busy],
  );

  return {
    enabled,
    busy,
    toggleEnabled,
    selectedVoice,
    selectVoice,
    previewingKey,
    preview,
    stopPreview,
  };
}
