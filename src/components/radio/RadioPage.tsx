"use client";

import { useState, useEffect, useRef } from "react";
import {
  RADIO_STATIONS,
  CATEGORIES,
  type RadioStation,
} from "@/data/radio-stations";
import { SURAH_NAMES_AR } from "@/lib/surahs";

const RESYNC_INTERVAL_MS = 45000;
const DRIFT_TOLERANCE_SECONDS = 5;

interface LiveState {
  mode: "adhan" | "recitation";
  url: string;
  offsetSeconds: number;
  reciterName?: string;
  surahId?: number;
}

function CategoryBadge({ category }: { category: RadioStation["category"] }) {
  const map: Record<
    RadioStation["category"],
    { label: string; color: string }
  > = {
    quran: { label: "قرآن كريم", color: "bg-green-100 text-green-700" },
    sunnah: { label: "سنة نبوية", color: "bg-amber-100 text-amber-700" },
    reciter: { label: "إذاعة قارئ", color: "bg-blue-100 text-blue-700" },
  };
  const { label, color } = map[category] ?? map.quran;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-arabic font-medium ${color}`}
    >
      {label}
    </span>
  );
}

export default function RadioPage({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");
  const [liveMeta, setLiveMeta] = useState<LiveState | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resyncTimerRef = useRef<number | null>(null);
  const liveUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const filtered =
    activeCategory === "all"
      ? RADIO_STATIONS
      : RADIO_STATIONS.filter((s) => s.category === activeCategory);

  const surahName = (id?: number) =>
    id ? (isAr ? SURAH_NAMES_AR[id - 1] || `سورة ${id}` : `Surah ${id}`) : "";

  const clearResync = () => {
    if (resyncTimerRef.current) {
      window.clearInterval(resyncTimerRef.current);
      resyncTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearResync();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const fetchLiveState = async (): Promise<LiveState> => {
    const res = await fetch("/api/radio/mosque-station", { cache: "no-store" });
    if (!res.ok) throw new Error("live fetch failed");
    return res.json();
  };

const resyncMosqueLive = async () => {
  if (!audioRef.current || currentStation?.id !== "mosque-live") return;
  try {
    const state = await fetchLiveState();
    setLiveMeta(state);
    const audio = audioRef.current;

    if (state.url !== liveUrlRef.current) {
      liveUrlRef.current = state.url;
      audio.src = state.url;

      await new Promise<void>((resolve) => {
        const onMeta = () => {
          audio.removeEventListener("loadedmetadata", onMeta);
          resolve();
        };
        audio.addEventListener("loadedmetadata", onMeta);
        setTimeout(resolve, 3000);
      });

      audio.currentTime = state.offsetSeconds;
      if (isPlayingRef.current) await audio.play().catch(() => {});
      return;
    }

    if (
      Math.abs(audio.currentTime - state.offsetSeconds) >
      DRIFT_TOLERANCE_SECONDS
    ) {
      audio.currentTime = state.offsetSeconds;
    }
  } catch {
    // try again next tick
  }
};

const startMosqueLive = async (station: RadioStation) => {
  setError("");
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = "";
    audioRef.current.load();
    audioRef.current = null;
  }
  clearResync();
  setCurrentStation(station);
  setIsPlaying(false);
  setIsLoading(true);

  try {
    const state = await fetchLiveState();
    setLiveMeta(state);
    liveUrlRef.current = state.url;

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    audio.onplaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    audio.onwaiting = () => setIsLoading(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => resyncMosqueLive();
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError(isAr ? "تعذّر تشغيل البث المباشر." : "Live broadcast failed.");
    };

    audio.src = state.url;

    // Wait for metadata before seeking — seeking before this fires gets
    // silently dropped on some browsers, which is why it was starting
    // from 0 instead of jumping to the live offset.
    await new Promise<void>((resolve) => {
      const onMeta = () => {
        audio.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      audio.addEventListener("loadedmetadata", onMeta);
      // Safety timeout in case loadedmetadata never fires (bad stream/CORS)
      setTimeout(resolve, 3000);
    });

    audio.currentTime = state.offsetSeconds;
    await audio.play().catch(() => {});

    resyncTimerRef.current = window.setInterval(
      resyncMosqueLive,
      RESYNC_INTERVAL_MS,
    );
  } catch {
    setIsLoading(false);
    setError(
      isAr
        ? "تعذّر الاتصال بالبث المباشر."
        : "Couldn't reach the live broadcast.",
    );
  }
};

  const playStation = (station: RadioStation) => {
    setError("");

    if (station.isLive) {
      if (currentStation?.id === station.id) {
        if (isPlaying) {
          audioRef.current?.pause();
        } else {
          // resuming rejoins the live position — it does not continue from where it paused
          resyncMosqueLive().then(() =>
            audioRef.current?.play().catch(() => {}),
          );
        }
        return;
      }
      startMosqueLive(station);
      return;
    }

    clearResync();

    if (currentStation?.id === station.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current?.play();
        if (playPromise) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() =>
              setError(isAr ? "تعذّر تشغيل البث." : "Playback failed."),
            );
        }
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }

    setCurrentStation(station);
    setLiveMeta(null);
    setIsPlaying(false);
    setIsLoading(true);

    const audio = new Audio();
    audio.preload = "none";
    audio.volume = volume;
    audioRef.current = audio;

    audio.onplaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError("");
    };
    audio.onwaiting = () => setIsLoading(true);
    audio.oncanplay = () => {
      if (!isPlaying) setIsLoading(false);
    };
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError(
        isAr
          ? "تعذّر تحميل البث. حاول مرة أخرى."
          : "Failed to load stream. Please try again.",
      );
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    audio.onstalled = () => setIsLoading(true);

    audio.src = `/api/radio/proxy?url=${encodeURIComponent(station.streamUrl)}`;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((e) => {
        if (e?.name !== "AbortError") {
          setIsLoading(false);
          setError(isAr ? "تعذّر تشغيل البث." : "Playback failed.");
        }
      });
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const stop = () => {
    clearResync();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentStation(null);
    setLiveMeta(null);
    setError("");
  };

  const nowPlayingLabel = () => {
    if (!currentStation) return "";
    if (currentStation.isLive && liveMeta) {
      if (liveMeta.mode === "adhan") return isAr ? "الأذان" : "Adhan";
      return `${liveMeta.reciterName ?? ""} · ${surahName(liveMeta.surahId)}`;
    }
    return isAr ? currentStation.nameAr : currentStation.nameEn;
  };

  return (
    <main className="min-h-screen bg-surface">
      <div
        className="py-14 px-4 text-center text-white"
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
      >
        <div className="text-5xl mb-4">📻</div>
        <h1 className="font-arabic text-4xl font-bold mb-2">
          {isAr ? "الإذاعة الإسلامية" : "Islamic Radio"}
        </h1>
        <p className="font-arabic text-white/60 text-sm">
          {isAr
            ? "استمع للقرآن الكريم وإذاعات العالم الإسلامي"
            : "Listen to Quran and Islamic radio stations worldwide"}
        </p>
      </div>

      {currentStation && (
        <div
          className="sticky top-16 z-30 px-4 py-3 border-b border-white/10 text-white"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                currentStation.icon
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-arabic font-bold text-sm truncate">
                {nowPlayingLabel()}
              </p>
              <p className="font-arabic text-white/50 text-xs">
                {isPlaying
                  ? isAr
                    ? "🔴 يبث الآن"
                    : "🔴 Live"
                  : isLoading
                    ? isAr
                      ? "⏳ جارٍ التحميل..."
                      : "⏳ Loading..."
                    : isAr
                      ? "⏸ متوقف"
                      : "⏸ Paused"}
              </p>
              {error && (
                <p className="font-arabic text-red-300 text-xs mt-0.5">
                  {error}
                </p>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/50 text-xs">🔈</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-amber-400"
              />
              <span className="text-white/50 text-xs">🔊</span>
            </div>

            <button
              onClick={() => playStation(currentStation)}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-40 text-lg"
            >
              {isLoading ? "⏳" : isPlaying ? "⏸" : "▶️"}
            </button>

            <button
              onClick={stop}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-lg"
            >
              ⏹
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-arabic text-sm transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{isAr ? cat.labelAr : cat.labelEn}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((station) => {
            const isActive = currentStation?.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-colors ${
                    isActive ? "bg-primary/10" : "bg-gray-50"
                  }`}
                >
                  {isActive && isLoading ? (
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    station.icon
                  )}
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <p
                    className={`font-arabic font-bold text-base truncate ${isActive ? "text-primary" : "text-gray-800"}`}
                  >
                    {isAr ? station.nameAr : station.nameEn}
                    {station.isLive && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 align-middle">
                        {isAr ? "مباشر" : "LIVE"}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <span className="font-arabic text-xs text-gray-400">
                      {station.country}
                    </span>
                    <CategoryBadge category={station.category} />
                  </div>
                </div>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive && isPlaying
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isActive && isPlaying ? "⏸" : "▶"}
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-arabic">
            {isAr
              ? "لا توجد إذاعات في هذه الفئة"
              : "No stations in this category"}
          </div>
        )}

        <p className="text-center font-arabic text-xs text-gray-400 pb-4">
          {isAr
            ? "جميع البثوث مباشرة ومجانية · قد يستغرق التحميل بضع ثوانٍ"
            : "All streams are live and free · Loading may take a few seconds"}
        </p>
      </div>
    </main>
  );
}
