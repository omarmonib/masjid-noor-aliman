// src/components/notifications/AdhanPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getTodayNotificationEvents } from "@/lib/prayer-schedule";
import { isNativeApp } from "@/lib/capacitor-adhan";

const ENABLED_KEY = "adhan-audio-enabled";

export default function AdhanPlayer({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // On native, NativeAdhanScheduler + capacitor-adhan.ts own both the
  // toggle and the actual sound (via a real OS notification that also
  // fires in the background). Running this in-page timer/audio path too
  // would just double the sound while the app happens to be open.
  const native = isNativeApp();

  useEffect(() => {
    if (native) return;
    setEnabled(localStorage.getItem(ENABLED_KEY) === "1");
  }, [native]);

  useEffect(() => {
    if (native || !enabled) return;

    audioRef.current = new Audio("/audio/adhan.mp3");
    audioRef.current.preload = "auto";

    const schedule = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      const events = getTodayNotificationEvents().filter((e) =>
        e.tag.endsWith("-adhan"),
      );
      const now = Date.now();

      events.forEach((event) => {
        const delay = event.time.getTime() - now;
        if (delay > 0 && delay < 24 * 3600 * 1000) {
          const id = window.setTimeout(() => {
            audioRef.current?.play().catch(() => {});
          }, delay);
          timeoutsRef.current.push(id);
        }
      });
    };

    schedule();
    // re-schedule after midnight rollover
    const midnightCheck = window.setInterval(schedule, 60 * 60 * 1000);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      clearInterval(midnightCheck);
    };
  }, [enabled, native]);

  const enable = () => {
    // Unlock audio autoplay with a real user gesture
    const audio = new Audio("/audio/adhan.mp3");
    audio.volume = 0;
    audio
      .play()
      .then(() => audio.pause())
      .catch(() => {});
    localStorage.setItem(ENABLED_KEY, "1");
    setEnabled(true);
  };

  if (native || enabled !== false) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-4 sm:w-96 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🔊</div>
        <div className="flex-1 min-w-0">
          <p className="font-arabic font-bold text-gray-800 text-sm mb-1">
            {isAr ? "تفعيل صوت الأذان" : "Enable Adhan Sound"}
          </p>
          <p className="font-arabic text-gray-500 text-xs leading-relaxed mb-3">
            {isAr
              ? "استمع لصوت الأذان الكامل عند دخول وقت كل صلاة طالما الموقع مفتوح"
              : "Play the full Adhan when each prayer time begins, as long as this site is open"}
          </p>
          <button
            onClick={enable}
            className="px-4 py-1.5 rounded-lg text-white text-xs font-arabic font-bold"
            style={{
              background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
            }}
          >
            {isAr ? "تفعيل" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}
