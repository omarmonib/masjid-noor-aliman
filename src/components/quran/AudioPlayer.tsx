"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Settings2,
} from "lucide-react";
import type { ReciterMoshaf } from "@/lib/reciters";
import { surahAudioUrl } from "@/lib/reciters";
import type { PageWord } from "@/lib/quran-page";

type Mode = "sync" | "continuous";
type RepeatMode = "off" | "verse" | "page";

interface Props {
  locale: string;
  pageWords: PageWord[]; // words for current page, in order
  activeVerseKey: string | null;
  currentSurahId: number | null;
  selectedReciter: ReciterMoshaf | null;
  onOpenReciterPanel: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onVerseChange: (verseKey: string | null) => void;
  cdnBase: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({
  locale,
  pageWords,
  activeVerseKey,
  currentSurahId,
  selectedReciter,
  onOpenReciterPanel,
  onNextPage,
  onPrevPage,
  onVerseChange,
  cdnBase,
}: Props) {
  const isAr = locale === "ar";
  const [mode, setMode] = useState<Mode>("sync");
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setWordIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playableWords = pageWords.filter(
    (w) => w.charTypeName !== "end" && w.audioUrl,
  );

  // ── Sync mode: sequential word playback ──
  const playWordAt = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= playableWords.length) {
        setIsPlaying(false);
        return;
      }
      const word = playableWords[idx];
      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(`${cdnBase}/${word.audioUrl}`);
      audio.playbackRate = speed;
      audioRef.current = audio;
      onVerseChange(word.verseKey);
      setWordIndex(idx);

      audio.onended = () => {
        const next = idx + 1;
        const stillSameVerse = playableWords[next]?.verseKey === word.verseKey;

        if (repeatMode === "verse" && !stillSameVerse) {
          // restart from first word of this verse
          const verseStart = playableWords.findIndex(
            (w) => w.verseKey === word.verseKey,
          );
          playWordAt(verseStart);
          return;
        }
        if (next >= playableWords.length) {
          if (repeatMode === "page") {
            playWordAt(0);
          } else {
            setIsPlaying(false);
          }
          return;
        }
        playWordAt(next);
      };

      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    },
    [playableWords, speed, repeatMode, onVerseChange, cdnBase],
  );

  const playFromVerse = useCallback(
    (verseKey: string) => {
      const idx = playableWords.findIndex((w) => w.verseKey === verseKey);
      if (idx >= 0) playWordAt(idx);
    },
    [playableWords, playWordAt],
  );

  // ── Continuous mode: full surah mp3 ──
  useEffect(() => {
    if (mode !== "continuous") return;
    if (!selectedReciter || !currentSurahId) return;
    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(surahAudioUrl(selectedReciter, currentSurahId));
    audio.playbackRate = speed;
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      if (repeatMode === "page" || repeatMode === "verse") {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedReciter?.id, currentSurahId]);

  const togglePlay = () => {
    if (mode === "sync") {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else if (activeVerseKey) {
        playFromVerse(activeVerseKey);
      } else {
        playWordAt(0);
      }
      return;
    }
    // continuous
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const cycleRepeat = () => {
    setRepeatMode((r) =>
      r === "off" ? "page" : r === "page" ? "verse" : "off",
    );
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "continuous" || !audioRef.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "00:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // expose word index for external tap-to-play wiring
  useEffect(() => {
    if (mode === "sync" && activeVerseKey && !isPlaying) {
      const idx = playableWords.findIndex((w) => w.verseKey === activeVerseKey);
      if (idx >= 0) setWordIndex(idx);
    }
  }, [activeVerseKey, mode, isPlaying, playableWords]);

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 bg-[#111] border-t border-white/10 px-3 py-2.5"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        {/* Mode + reciter */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <select
            value={mode}
            onChange={(e) => {
              audioRef.current?.pause();
              setIsPlaying(false);
              setMode(e.target.value as Mode);
            }}
            className="bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 font-arabic focus:outline-none"
          >
            <option value="sync">{isAr ? "مزامنة" : "Sync"}</option>
            <option value="continuous">
              {isAr ? "استماع متواصل" : "Continuous"}
            </option>
          </select>
          {mode === "continuous" && (
            <button
              onClick={onOpenReciterPanel}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg px-2 py-1.5 font-arabic max-w-[90px] truncate"
              title={isAr ? "اختر القارئ" : "Choose reciter"}
            >
              <Settings2 size={12} />
              {selectedReciter
                ? selectedReciter.reciterNameAr
                : isAr
                  ? "القارئ"
                  : "Reciter"}
            </button>
          )}
        </div>

        {/* Prev / Play / Next */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrevPage}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title={isAr ? "الصفحة السابقة" : "Prev page"}
          >
            <SkipForward size={14} className={isAr ? "" : "rotate-180"} />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={onNextPage}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title={isAr ? "الصفحة التالية" : "Next page"}
          >
            <SkipForward size={14} className={isAr ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Progress (continuous mode only — sync mode has no single duration) */}
        <div className="flex-1 min-w-0">
          {mode === "continuous" ? (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] font-mono w-9">
                {fmt(currentTime)}
              </span>
              <div
                onClick={seek}
                className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                    background: "linear-gradient(to right, #1B6B4A, #C9A84C)",
                  }}
                />
              </div>
              <span className="text-white/40 text-[10px] font-mono w-9">
                {fmt(duration)}
              </span>
            </div>
          ) : (
            <p className="text-white/50 text-xs font-arabic truncate text-center">
              {activeVerseKey
                ? isAr
                  ? `الآية ${activeVerseKey}`
                  : `Verse ${activeVerseKey}`
                : isAr
                  ? "اضغط على أي آية لبدء الاستماع"
                  : "Tap any verse to start listening"}
            </p>
          )}
        </div>

        {/* Repeat + speed */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={cycleRepeat}
            title={isAr ? "تكرار" : "Repeat"}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              repeatMode !== "off"
                ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                : "bg-white/10 text-white/70"
            }`}
          >
            {repeatMode === "verse" ? (
              <Repeat1 size={14} />
            ) : (
              <Repeat size={14} />
            )}
          </button>
          <button
            onClick={changeSpeed}
            className="px-2 h-8 rounded-full bg-white/10 text-white/70 text-xs font-mono"
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}
