"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Settings2,
  RefreshCw,
} from "lucide-react";
import type { ReciterMoshaf } from "@/lib/reciters";
import { surahAudioUrl } from "@/lib/reciters";
import type { PageWord } from "@/lib/quran-page";
import { SURAH_NAMES_AR } from "@/lib/surahs";
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionHandlers,
  clearMediaSession,
} from "@/lib/media-session";
import {
  enableBackgroundAudio,
  disableBackgroundAudio,
} from "@/lib/background-audio";

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

export interface AudioPlayerHandle {
  /**
   * Starts recitation from the given ayah. Sync mode is exact (word-level
   * audio segments, timing data comes from the API). Continuous mode has
   * no per-ayah timestamps available from mp3quran's full-surah files, so
   * it uses the same proportional (ayah index / total ayahs of the surah)
   * estimate already used elsewhere in this component for resuming — this
   * is reciter-agnostic, so it works the same regardless of which reciter
   * is selected. Returns false if playback couldn't be started (no
   * reciter chosen yet for continuous mode, or the verse isn't on the
   * current surah).
   */
  startFromVerse: (verseKey: string) => Promise<boolean>;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Verse-count-per-surah lookup, used only as a best-effort seek estimate
// (see the comment in the continuous-mode effect below) — fetched once and
// cached for the tab's lifetime, never re-fetched per reciter/page change.
const verseCountCache = new Map<number, number>();
let verseCountsPromise: Promise<void> | null = null;
async function ensureVerseCounts() {
  if (verseCountCache.size > 0) return;
  if (!verseCountsPromise) {
    verseCountsPromise = import("@/lib/quran-reader")
      .then(async ({ getSurahs }) => {
        const surahs = await getSurahs();
        for (const s of surahs) verseCountCache.set(s.id, s.versesCount);
      })
      .catch(() => {
        verseCountsPromise = null;
      });
  }
  await verseCountsPromise;
}

function AudioPlayerImpl(
  {
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
  }: Props,
  ref: React.ForwardedRef<AudioPlayerHandle>,
) {
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

  // Remembers the last playback position per surah (continuous mode) so
  // switching reciters mid-surah resumes where you were instead of
  // restarting at 0:00.
  const resumePositions = useRef<Map<number, number>>(new Map());

  // Tracks which reciter+surah the currently-loaded continuous <audio>
  // element belongs to, so startFromVerse() can tell whether it can reuse
  // it or needs to build a fresh one.
  const continuousKeyRef = useRef<string | null>(null);

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
  // Builds (or rebuilds) the <audio> element for the given reciter/surah.
  // When `forceSeekVerseKey` is passed, the estimate always targets that
  // verse and starts playing immediately — this is the explicit "start
  // recitation from here" path. Without it, this falls back to the normal
  // resume-position / activeVerseKey estimate used when switching
  // reciters mid-listen, and does NOT autoplay (matches prior behavior).
  const buildContinuousAudio = useCallback(
    (reciter: ReciterMoshaf, surahId: number, forceSeekVerseKey?: string) => {
      if (audioRef.current) audioRef.current.pause();

      let cancelled = false;
      const audio = new Audio(surahAudioUrl(reciter, surahId));
      audio.playbackRate = speed;
      audioRef.current = audio;
      continuousKeyRef.current = `${reciter.id}-${surahId}`;

      audio.onloadedmetadata = async () => {
        if (cancelled) return;
        setDuration(audio.duration || 0);

        if (forceSeekVerseKey) {
          await ensureVerseCounts();
          if (cancelled) return;
          const total = verseCountCache.get(surahId);
          const [, ayahStr] = forceSeekVerseKey.split(":");
          const ayah = parseInt(ayahStr, 10);
          if (total && total > 1 && audio.duration) {
            const ratio = Math.max(0, (ayah - 1) / total);
            audio.currentTime = Math.min(
              audio.duration - 0.5,
              ratio * audio.duration,
            );
          } else {
            audio.currentTime = 0;
          }
          resumePositions.current.set(surahId, audio.currentTime);
          if (!cancelled) setCurrentTime(audio.currentTime);
          audio.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
          return;
        }

        const resumed = resumePositions.current.get(surahId);
        if (resumed !== undefined && resumed > 0 && resumed < audio.duration) {
          audio.currentTime = resumed;
        } else if (activeVerseKey && audio.duration) {
          const [verseSurah, verseAyah] = activeVerseKey.split(":").map(Number);
          if (verseSurah === surahId) {
            await ensureVerseCounts();
            if (cancelled) return;
            const total = verseCountCache.get(surahId);
            if (total && total > 1) {
              const ratio = Math.max(0, (verseAyah - 1) / total);
              audio.currentTime = Math.min(
                audio.duration - 1,
                ratio * audio.duration,
              );
            }
          }
        }
        if (!cancelled) setCurrentTime(audio.currentTime);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        resumePositions.current.set(surahId, audio.currentTime);
      };
      audio.onended = () => {
        resumePositions.current.delete(surahId);
        if (repeatMode === "page" || repeatMode === "verse") {
          audio.currentTime = 0;
          audio.play();
        } else {
          setIsPlaying(false);
        }
      };

      return () => {
        cancelled = true;
        audio.pause();
      };
    },
    [speed, repeatMode, activeVerseKey],
  );

  useEffect(() => {
    if (mode !== "continuous") return;
    if (!selectedReciter || !currentSurahId) return;
    const cleanup = buildContinuousAudio(selectedReciter, currentSurahId);
    return cleanup;
    // Deliberately NOT depending on activeVerseKey/buildContinuousAudio's
    // other closure values — this effect should only recreate the Audio
    // element when the mode, reciter, or surah actually changes, not on
    // every tap-to-select-a-verse. buildContinuousAudio reads the latest
    // activeVerseKey itself via closure at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedReciter?.id, currentSurahId]);

  const togglePlay = useCallback(() => {
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
  }, [mode, isPlaying, activeVerseKey, playFromVerse, playWordAt]);

  const restartFromBeginning = () => {
    if (currentSurahId !== null) resumePositions.current.delete(currentSurahId);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // ── Imperative "start from this ayah" entry point ──
  const startFromVerse = useCallback(
    async (verseKey: string): Promise<boolean> => {
      if (!currentSurahId) return false;
      const [surahStr] = verseKey.split(":");
      if (parseInt(surahStr, 10) !== currentSurahId) return false;

      if (mode === "sync") {
        playFromVerse(verseKey);
        return true;
      }

      // continuous mode needs a reciter — can't build a stream without one
      if (!selectedReciter) return false;

      onVerseChange(verseKey);
      if (mode !== "continuous") setMode("continuous");
      // Always rebuild against this exact verse — simpler and more
      // reliable than trying to reuse a possibly-in-flight audio element,
      // and the browser has the file cached after the first load anyway.
      buildContinuousAudio(selectedReciter, currentSurahId, verseKey);
      return true;
    },
    [
      mode,
      currentSurahId,
      selectedReciter,
      playFromVerse,
      onVerseChange,
      buildContinuousAudio,
    ],
  );

  useImperativeHandle(ref, () => ({ startFromVerse }), [startFromVerse]);

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

  useEffect(() => {
    if (mode === "sync" && activeVerseKey && !isPlaying) {
      const idx = playableWords.findIndex((w) => w.verseKey === activeVerseKey);
      if (idx >= 0) setWordIndex(idx);
    }
  }, [activeVerseKey, mode, isPlaying, playableWords]);

  // ── Lock-screen / background media controls ──
  useEffect(() => {
    if (!isPlaying) {
      setMediaSessionPlaybackState("paused");
      disableBackgroundAudio();
      return;
    }

    setMediaSessionPlaybackState("playing");
    enableBackgroundAudio();

    const surahName = currentSurahId ? SURAH_NAMES_AR[currentSurahId - 1] : "";
    setMediaSessionMetadata({
      title: surahName || (isAr ? "القرآن الكريم" : "Quran"),
      artist: selectedReciter?.reciterNameAr || "",
      album: isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman",
    });

    setMediaSessionHandlers({
      onPlay: togglePlay,
      onPause: togglePlay,
      onNext: onNextPage,
      onPrevious: onPrevPage,
    });
  }, [
    isPlaying,
    currentSurahId,
    selectedReciter?.reciterNameAr,
    isAr,
    togglePlay,
    onNextPage,
    onPrevPage,
  ]);

  useEffect(() => {
    return () => {
      clearMediaSession();
      disableBackgroundAudio();
    };
  }, []);

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
            <>
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
              <button
                onClick={restartFromBeginning}
                title={isAr ? "البدء من البداية" : "Start from beginning"}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center flex-shrink-0"
              >
                <RefreshCw size={13} />
              </button>
            </>
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
                className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative group"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                    background: "linear-gradient(to right, #1B6B4A, #C9A84C)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 7px)`,
                    borderColor: "#C9A84C",
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

const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(AudioPlayerImpl);
export default AudioPlayer;
