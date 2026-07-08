"use client";

import { useRef, useState, useEffect } from "react";
import { Settings, Play, Square } from "lucide-react";
import {
  ADHAN_VOICES,
  getSelectedVoice,
  setSelectedVoice,
  isNativeApp,
  type AdhanVoiceId,
} from "@/lib/capacitor-adhan";

// Preview clips are hosted on archive.org (not bundled in the repo/APK) —
// only the native notification sound needs a physical file on-device.
// Replace {identifier} with your actual archive.org item identifier.
const PREVIEW_BASE = "https://archive.org/download/adhan_202607";

type PreviewKey = `${AdhanVoiceId}:regular` | `${AdhanVoiceId}:fajr`;

export default function AdhanSettingsButton({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdhanVoiceId>(getSelectedVoice());
  const [playing, setPlaying] = useState<PreviewKey | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Voice choice only matters on native — web push has no custom sound.
  if (!isNativeApp()) return null;

  const choose = (id: AdhanVoiceId) => {
    setSelected(id);
    setSelectedVoice(id);
  };

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  };

  const preview = (voiceId: AdhanVoiceId, variant: "regular" | "fajr") => {
    const key: PreviewKey = `${voiceId}:${variant}`;

    if (playing === key) {
      stopPreview();
      return;
    }

    audioRef.current?.pause();

    const voice = ADHAN_VOICES.find((v) => v.id === voiceId)!;
    const filename = variant === "fajr" ? voice.fajrFile : voice.file;
    const audio = new Audio(`${PREVIEW_BASE}/${filename}`);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    audioRef.current = audio;
    audio.play().catch(() => setPlaying(null));
    setPlaying(key);
  };

  const handleClose = () => {
    stopPreview();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={isAr ? "إعدادات صوت الأذان" : "Adhan sound settings"}
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5"
            dir={isAr ? "rtl" : "ltr"}
          >
            <h3 className="font-arabic font-bold text-gray-800 mb-1">
              {isAr ? "اختر صوت الأذان" : "Choose Adhan Voice"}
            </h3>
            <p className="font-arabic text-xs text-gray-400 mb-4">
              {isAr
                ? "استمع لكل صوت قبل الاختيار — يُستخدم أذان الفجر تلقائياً لصلاة الفجر"
                : "Listen to each voice before choosing — the Fajr variant is used automatically for Fajr"}
            </p>

            <div className="space-y-2 mb-5">
              {ADHAN_VOICES.map((v) => {
                const isSelected = selected === v.id;
                const regularKey: PreviewKey = `${v.id}:regular`;
                const fajrKey: PreviewKey = `${v.id}:fajr`;

                return (
                  <div
                    key={v.id}
                    className={`rounded-xl border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => choose(v.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-right"
                    >
                      <span
                        className={`font-arabic text-sm ${
                          isSelected
                            ? "text-primary font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {isAr ? v.labelAr : v.labelEn}
                      </span>
                      {isSelected && <span className="text-primary">✓</span>}
                    </button>

                    <div className="flex items-center gap-2 px-4 pb-3">
                      <button
                        onClick={() => preview(v.id, "regular")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors text-xs font-arabic"
                      >
                        {playing === regularKey ? (
                          <Square size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                        {isAr ? "استماع" : "Preview"}
                      </button>
                      <button
                        onClick={() => preview(v.id, "fajr")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors text-xs font-arabic"
                      >
                        {playing === fajrKey ? (
                          <Square size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                        {isAr ? "استماع (الفجر)" : "Preview (Fajr)"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-arabic font-bold"
            >
              {isAr ? "تم" : "Done"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
