"use client";

import { useState, useEffect, useRef } from "react";
import { MEDIA_TYPES, formatDuration, type MediaItem } from "@/lib/media";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MediaLibrary({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string>("lesson");

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const filtered = items.filter((i) => i.type === section);
  const activeMeta = MEDIA_TYPES.find((t) => t.id === section);

  const playItem = (item: MediaItem) => {
    if (playingId === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const audio = new Audio(item.url);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    setPlayingId(item.id);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(
        audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
      );
    };

    audio.play().catch(() => setIsPlaying(false));
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.min(
      Math.max(0, audio.currentTime + seconds),
      audio.duration,
    );
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (v > 0) setPrevVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (volume > 0) {
      changeVolume(0);
    } else {
      changeVolume(prevVolume || 1);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const handleDownload = async (item: MediaItem) => {
    setDownloadingId(item.id);
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = item.url.split(".").pop()?.split("?")[0] || "mp3";
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(isAr ? item.titleAr : item.titleEn || item.titleAr).replace(/[/\\?%*:|"<>]/g, "-")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback — open in new tab if fetch/blob fails (e.g. CORS)
      window.open(item.url, "_blank");
    }
    setDownloadingId(null);
  };

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div
        className="relative overflow-hidden py-16 px-4 text-center text-white"
        style={{
          background:
            "linear-gradient(135deg, #0D3D28 0%, #1B6B4A 60%, #0D3D28 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
        <div
          className="absolute top-10 right-10 w-56 h-56 rounded-full opacity-10 blur-3xl"
          style={{ background: "#C9A84C" }}
        />
        <div className="relative z-10">
          <div className="text-5xl mb-4">🎙️</div>
          <h1 className="font-arabic text-4xl font-bold mb-2">
            {isAr ? "الخطب والتسجيلات" : "Sermons & Recordings"}
          </h1>
          <p className="font-arabic text-white/60 text-sm">
            {isAr
              ? "استمع لتلاوات القرآن الكريم وخطب ودروس المسجد"
              : "Listen to Quran recitations and mosque sermons & lessons"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-7 relative z-20">
        {/* Section switcher */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-1.5 flex gap-1.5">
          {MEDIA_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-arabic text-sm font-bold transition-all ${
                section === t.id
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={
                section === t.id
                  ? {
                      background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
                    }
                  : undefined
              }
            >
              <span className="text-lg">{t.icon}</span>
              <span>{isAr ? t.labelAr : t.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="font-arabic text-gray-400 text-sm">
                {isAr ? "جارٍ التحميل..." : "Loading..."}
              </p>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-40">{activeMeta?.icon}</div>
            <p className="font-arabic text-gray-400">
              {isAr
                ? "لا يوجد محتوى في هذا القسم حالياً"
                : "No content in this section yet"}
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((item) => {
            const active = playingId === item.id;
            const activePlaying = active && isPlaying;
            const isDownloading = downloadingId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  active
                    ? "border-[#C9A84C]/50 shadow-[0_4px_20px_rgba(201,168,76,0.15)]"
                    : "border-gray-100 hover:border-primary/20"
                } bg-white`}
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  {/* Play button */}
                  <button
                    onClick={() => playItem(item)}
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #C9A84C, #E8C56A)"
                        : "linear-gradient(135deg, #0D3D28, #1B6B4A)",
                    }}
                  >
                    <span className="text-white text-xl sm:text-2xl">
                      {activePlaying ? "⏸" : "▶"}
                    </span>
                    {activePlaying && (
                      <span className="absolute -inset-1 rounded-full border-2 border-[#C9A84C]/40 animate-ping" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right" dir="rtl">
                    <h3 className="font-arabic font-bold text-gray-800 text-base sm:text-lg truncate">
                      {isAr ? item.titleAr : item.titleEn || item.titleAr}
                    </h3>
                    <div className="flex items-center gap-2 justify-end mt-1 flex-wrap">
                      {item.speaker && (
                        <span className="text-xs sm:text-sm text-primary font-arabic font-medium">
                          {item.speaker}
                        </span>
                      )}
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 font-arabic">
                        {new Date(item.createdAt).toLocaleDateString(
                          isAr ? "ar-EG" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Download button — always visible */}
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    title={isAr ? "تحميل" : "Download"}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <span className="text-base">⬇️</span>
                    )}
                  </button>
                </div>

                {/* Description */}
                {item.description && (
                  <p
                    className="px-5 pb-2 font-arabic text-sm text-gray-500 text-right leading-relaxed"
                    dir="rtl"
                  >
                    {item.description}
                  </p>
                )}

                {/* Player */}
                {active && (
                  <div className="px-5 pb-5 pt-1 space-y-3">
                    {/* Seek bar */}
                    <div
                      onClick={seek}
                      className="h-2 rounded-full bg-gray-100 cursor-pointer relative overflow-hidden"
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background:
                            "linear-gradient(to right, #1B6B4A, #C9A84C)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>

                    {/* Control bar */}
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap pt-1 border-t border-gray-50">
                      {/* Skip buttons */}
                      <div className="flex items-center gap-1.5 pt-3">
                        <button
                          onClick={() => skip(-10)}
                          title={isAr ? "رجوع ١٠ ثوانٍ" : "Back 10s"}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors text-sm"
                        >
                          {isAr ? "10⟲" : "⟲10"}
                        </button>
                        <button
                          onClick={() => skip(10)}
                          title={isAr ? "تقديم ١٠ ثوانٍ" : "Forward 10s"}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors text-sm"
                        >
                          {isAr ? "⟳10" : "10⟳"}
                        </button>
                      </div>

                      {/* Speed */}
                      <div className="flex items-center gap-1.5 pt-3">
                        <span className="text-xs text-gray-400 font-arabic">
                          {isAr ? "السرعة" : "Speed"}
                        </span>
                        <select
                          value={playbackRate}
                          onChange={(e) =>
                            changeSpeed(parseFloat(e.target.value))
                          }
                          className="text-xs font-mono border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-gray-700"
                        >
                          {SPEED_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}x
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Volume */}
                      <div className="flex items-center gap-2 pt-3 flex-1 sm:flex-none min-w-[120px]">
                        <button
                          onClick={toggleMute}
                          className="text-gray-500 hover:text-primary transition-colors text-sm flex-shrink-0"
                        >
                          {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={volume}
                          onChange={(e) =>
                            changeVolume(parseFloat(e.target.value))
                          }
                          className="flex-1 sm:w-20 accent-[#1B6B4A]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <p className="text-center font-arabic text-xs text-gray-400 pb-10">
        {isAr
          ? "جميع التسجيلات الخاصة بمسجد نور الإيمان"
          : "All recordings are audio-only and free"}
      </p>
    </main>
  );
}
