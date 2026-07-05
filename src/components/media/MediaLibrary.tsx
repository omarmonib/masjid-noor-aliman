"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, Volume1, VolumeX, RotateCcw, RotateCw } from "lucide-react";
import {
  MEDIA_TYPES,
  formatDuration,
  groupBySpeaker,
  type MediaItem,
  type SpeakerGroup,
} from "@/lib/media";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MediaLibrary({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string>("lesson");
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
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
  const groups = groupBySpeaker(filtered, isAr);
  const activeMeta = MEDIA_TYPES.find((t) => t.id === section);
  const activeGroup: SpeakerGroup | undefined = groups.find(
    (g) => g.key === activeGroupKey,
  );

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

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(playbackRate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const openGroup = (key: string) => setActiveGroupKey(key);
  const closeGroup = () => setActiveGroupKey(null);

  const renderItem = (item: MediaItem) => {
    const active = playingId === item.id;
    const activePlaying = active && isPlaying;
    return (
      <div
        key={item.id}
        className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
          active
            ? "border-[#C9A84C]/50 shadow-[0_4px_20px_rgba(201,168,76,0.15)]"
            : "border-gray-100 hover:border-primary/20"
        } bg-white`}
      >
        <div className="flex items-center gap-4 p-5 sm:p-6">
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

          <div className="flex-1 min-w-0 text-right" dir="rtl">
            <h3 className="font-arabic font-bold text-gray-800 text-base sm:text-lg truncate">
              {isAr ? item.titleAr : item.titleEn || item.titleAr}
            </h3>
          </div>
        </div>

        {item.description && (
          <p
            className="px-5 pb-2 font-arabic text-sm text-gray-500 text-right leading-relaxed"
            dir="rtl"
          >
            {item.description}
          </p>
        )}

        {active && (
          <div className="mx-4 mb-5 sm:mx-5 rounded-2xl bg-gray-50/80 border border-gray-100 p-4 space-y-3">
            <div dir="ltr" className="space-y-1.5">
              <div
                onClick={seek}
                className="h-2 rounded-full bg-gray-200/70 cursor-pointer relative group"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #1B6B4A, #C9A84C)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    left: `calc(${progress}% - 7px)`,
                    borderColor: "#C9A84C",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 pt-3">
                <button
                  onClick={toggleMute}
                  title={isAr ? "كتم الصوت" : "Mute"}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-primary transition-colors flex-shrink-0"
                >
                  <VolumeIcon size={16} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 accent-[#1B6B4A]"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 pt-3">
                <button
                  onClick={() => skip(-10)}
                  title={isAr ? "رجوع ١٠ ثوانٍ" : "Back 10s"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <RotateCcw size={14} strokeWidth={2.25} />
                  <span className="text-xs font-bold font-mono">10</span>
                </button>
                <button
                  onClick={() => skip(10)}
                  title={isAr ? "تقديم ١٠ ثوانٍ" : "Forward 10s"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <RotateCw size={14} strokeWidth={2.25} />
                  <span className="text-xs font-bold font-mono">10</span>
                </button>
              </div>

              <button
                onClick={cycleSpeed}
                title={isAr ? "سرعة التشغيل" : "Playback speed"}
                className="flex-shrink-0 text-xs font-bold font-mono px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors min-w-[46px]"
              >
                {playbackRate}×
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
              onClick={() => {
                setSection(t.id);
                setActiveGroupKey(null);
              }}
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

      <div className="max-w-3xl mx-auto px-4 py-8">
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

        {!loading && groups.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-40">{activeMeta?.icon}</div>
            <p className="font-arabic text-gray-400">
              {isAr
                ? "لا يوجد محتوى في هذا القسم حالياً"
                : "No content in this section yet"}
            </p>
          </div>
        )}

        {/* Speaker profile squares */}
        {!loading && groups.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {groups.map((group) => (
              <button
                key={group.key}
                onClick={() => openGroup(group.key)}
                className="group flex flex-col items-center gap-2 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                  {group.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.photoUrl}
                      alt={group.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl">🎙️</span>
                  )}
                  <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {group.items.length}
                  </span>
                </div>
                <span
                  className="font-arabic text-xs sm:text-sm font-bold text-gray-800 text-center leading-snug line-clamp-2"
                  dir="rtl"
                >
                  {group.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center font-arabic text-xs text-gray-400 pb-10">
        {isAr
          ? "جميع التسجيلات الخاصة بمسجد نور الإيمان"
          : "All recordings are audio-only and free"}
      </p>

      {/* Speaker modal */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col">
          <div
            className="flex items-center justify-between px-5 py-4 text-white"
            style={{
              background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
            }}
          >
            <button
              onClick={closeGroup}
              className="text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
            <div className="text-center">
              <p className="font-arabic text-lg font-bold">
                {activeGroup.label}
              </p>
              <p className="text-white/60 text-xs font-arabic">
                {activeGroup.items.length} {isAr ? "تسجيل" : "recordings"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {activeGroup.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeGroup.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">🎙️</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface px-4 py-6 space-y-4">
            {activeGroup.items.map(renderItem)}
          </div>
        </div>
      )}
    </main>
  );
}
