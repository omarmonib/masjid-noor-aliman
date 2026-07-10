"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getTodayNotificationEvents } from "@/lib/prayer-schedule";
import { SURAH_NAMES_AR } from "@/lib/surahs";

interface Track {
  reciterId: number;
  reciterName: string;
  surahId: number;
  url: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MosqueRadioPlayer({ locale }: { locale: string }) {
  const isAr = locale === "ar";

  const allTracksRef = useRef<Track[]>([]);
  const queueRef = useRef<Track[]>([]);
  const playedAdhanRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAdhanRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdhan, setIsAdhan] = useState(false);
  const [started, setStarted] = useState(false);

  // Load the track list once
  useEffect(() => {
    fetch("/api/radio/mosque-station")
      .then((r) => r.json())
      .then((data) => {
        const list: Track[] = Array.isArray(data.tracks) ? data.tracks : [];
        if (list.length === 0) {
          setLoadError(
            isAr
              ? "تعذر تحميل قائمة التلاوات حالياً"
              : "Couldn't load the recitation list right now",
          );
        }
        allTracksRef.current = list;
        queueRef.current = shuffle(list);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(
          isAr
            ? "تعذر تحميل قائمة التلاوات حالياً"
            : "Couldn't load the recitation list right now",
        );
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      if (allTracksRef.current.length === 0) return;
      queueRef.current = shuffle(allTracksRef.current);
    }
    const next = queueRef.current.shift();
    if (!next) return;
    setCurrent(next);
    isAdhanRef.current = false;
    setIsAdhan(false);
    if (audioRef.current) {
      audioRef.current.src = next.url;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, []);

  const playAdhan = useCallback(() => {
    isAdhanRef.current = true;
    setIsAdhan(true);
    if (audioRef.current) {
      audioRef.current.src = "/audio/adhan.mp3";
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, []);

  // Set up the single shared audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => playNext();
    audio.onerror = () => {
      // A broken track or missing adhan file — skip past it quietly
      isAdhanRef.current = false;
      playNext();
    };
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [playNext]);

  // Watch for prayer time and interrupt with the Adhan
  useEffect(() => {
    const check = () => {
      if (!started) return;
      const events = getTodayNotificationEvents().filter((e) =>
        e.tag.endsWith("-adhan"),
      );
      const now = Date.now();
      for (const ev of events) {
        if (
          Math.abs(now - ev.time.getTime()) <= 15000 &&
          !playedAdhanRef.current.has(ev.key)
        ) {
          playedAdhanRef.current.add(ev.key);
          playAdhan();
          break;
        }
      }
    };
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [started, playAdhan]);

  const handleStart = () => {
    setStarted(true);
    if (!current) {
      playNext();
    } else {
      audioRef.current?.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!started) {
      handleStart();
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(() => {});
    }
  };

  const surahName = (id: number) =>
    isAr ? SURAH_NAMES_AR[id - 1] || `سورة ${id}` : `Surah ${id}`;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md border"
      style={{ borderColor: "rgba(201,168,76,0.3)" }}
    >
      <div
        className="px-5 py-4 text-white flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
      >
        <div className="text-2xl">🕌</div>
        <div className="flex-1">
          <p className="font-arabic font-bold">
            {isAr ? "إذاعة المسجد المباشرة" : "Mosque Live Radio"}
          </p>
          <p className="font-arabic text-white/60 text-xs">
            {isAr
              ? "تلاوات عشوائية من ٥ قراء · يتوقف تلقائياً عند كل أذان"
              : "Random recitations from 5 reciters · auto-pauses for each Adhan"}
          </p>
        </div>
      </div>

      <div className="bg-white px-5 py-5">
        {loading && (
          <div className="text-center py-6 text-gray-400 font-arabic text-sm">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        )}

        {!loading && loadError && (
          <div className="text-center py-4">
            <p className="font-arabic text-red-500 text-sm mb-2">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-arabic text-xs text-primary hover:underline"
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {isAdhan && (
              <div className="mb-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-4 py-3 text-center">
                <p className="font-arabic text-sm font-bold text-[#8a6d1f]">
                  🕌 {isAr ? "حان الآن وقت الأذان" : "It's time for the Adhan"}
                </p>
              </div>
            )}

            <div className="text-center mb-5">
              {current ? (
                <>
                  <p className="font-arabic text-lg font-bold text-gray-800">
                    {isAdhan
                      ? isAr
                        ? "الأذان"
                        : "Adhan"
                      : surahName(current.surahId)}
                  </p>
                  {!isAdhan && (
                    <p className="font-arabic text-sm text-gray-400 mt-0.5">
                      {current.reciterName}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-arabic text-sm text-gray-400">
                  {isAr
                    ? "اضغط تشغيل لبدء الإذاعة"
                    : "Press play to start the station"}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #0D3D28, #1B6B4A)",
                }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={playNext}
                disabled={!started}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30"
                title={isAr ? "التالي" : "Next"}
              >
                ⏭
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
