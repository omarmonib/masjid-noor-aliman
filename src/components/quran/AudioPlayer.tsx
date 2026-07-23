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
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/capacitor-adhan";
import { ayahAudioUrl, type CuratedReciter } from "@/lib/reciters";
import type { PageWord } from "@/lib/quran-page";
import { SURAH_NAMES_AR } from "@/lib/surahs";
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPositionState,
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
  selectedReciter: CuratedReciter | null;
  onOpenReciterPanel: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onVerseChange: (verseKey: string | null) => void;
  cdnBase: string;
}

export interface AudioPlayerHandle {
  /**
   * Starts recitation from the given ayah. Sync mode plays the exact
   * word-level audio segment (Quran Foundation's timestamped word data).
   * Continuous mode plays the exact per-ayah file for the selected
   * reciter and chains forward ayah-by-ayah to the end of the surah —
   * every reciter in the picker has verified per-ayah audio, so this is
   * always exact, never an estimate. Returns false only if continuous
   * mode has no reciter selected yet (nothing to play).
   */
  startFromVerse: (verseKey: string) => Promise<boolean>;
  /**
   * Same accuracy guarantees as startFromVerse, but also forces repeat
   * mode to "verse" first, so the ayah loops indefinitely instead of
   * continuing on to the next one. Used by the "Repeat This Ayah" context
   * menu action.
   */
  repeatVerse: (verseKey: string) => Promise<boolean>;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Verse-count-per-surah lookup — used only to know where a surah ends
// (so the ayah chain knows when to stop / loop), never for seeking.
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

// ── Background-resilience: persisted playback snapshot ──
// A safety net only — if Android kills the app process despite the
// foreground-service background-audio mode (rare, but possible under
// memory pressure), this records exactly which ayah and timestamp
// playback had reached, so a future "continue where you left off" action
// could restore it precisely. It is NEVER used to auto-resume playback on
// its own (that would mean autoplaying audio without a fresh user gesture
// after a cold start, which this app deliberately does not do).
const SESSION_KEY = "quran:playback-session";
interface PlaybackSession {
  reciterId: string;
  surahId: number;
  ayah: number;
  currentTime: number;
  savedAt: number;
}
function saveSession(s: PlaybackSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — safety net only, fine to skip */
  }
}
const SESSION_SAVE_THROTTLE_MS = 3000;

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
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [totalAyahs, setTotalAyahs] = useState<number | null>(null);
  const [, setWordIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playableWords = pageWords.filter(
    (w) => w.charTypeName !== "end" && w.audioUrl,
  );

  // Remembers the last ayah reached per reciter+surah, so pressing play
  // again after switching pages/reciters resumes at that exact ayah
  // (never a time estimate — always a specific ayah number).
  const resumeAyahRef = useRef<Map<string, number>>(new Map());

  // Cancellation token for the in-flight ayah chain — lets us stop a
  // chain cleanly when the surah/reciter changes or a new chain starts,
  // without racing a stale onended callback into playing the wrong file.
  const chainTokenRef = useRef<{ cancelled: boolean } | null>(null);

  const lastSessionSaveRef = useRef(0);

  // ── Sync mode: sequential word playback (unaffected by this redesign —
  // already exact, since Quran Foundation's word audio is timestamped) ──
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

  // ── Continuous mode: per-ayah chain ──
  // Plays ayah `startAyah`, then `startAyah + 1`, and so on to the end of
  // the surah. Every reciter available in the picker has a real, distinct
  // audio file per ayah — there is no seeking or estimation anywhere in
  // this function. This is used both for "Start Recitation From Here"
  // and for the ordinary play button, just with a different starting ayah.
  const playAyahChain = useCallback(
    async (reciter: CuratedReciter, surahId: number, startAyah: number) => {
      if (chainTokenRef.current) chainTokenRef.current.cancelled = true;
      if (audioRef.current) audioRef.current.pause();

      const token = { cancelled: false };
      chainTokenRef.current = token;

      await ensureVerseCounts();
      if (token.cancelled) return;
      const total = verseCountCache.get(surahId) ?? startAyah;
      setTotalAyahs(total);
      const resumeKey = `${reciter.id}-${surahId}`;

      const playAyah = (ayahNum: number) => {
        if (token.cancelled) return;

        if (ayahNum > total) {
          if (repeatMode === "page") {
            playAyah(startAyah);
          } else {
            setIsPlaying(false);
            resumeAyahRef.current.delete(resumeKey);
          }
          return;
        }

        const audio = new Audio(ayahAudioUrl(reciter.id, surahId, ayahNum));
        audio.playbackRate = speed;
        audioRef.current = audio;
        setCurrentAyah(ayahNum);
        resumeAyahRef.current.set(resumeKey, ayahNum);
        onVerseChange(`${surahId}:${ayahNum}`);

        // Immediate, un-throttled snapshot at the start of each ayah —
        // this is the moment most worth capturing accurately.
        saveSession({
          reciterId: reciter.id,
          surahId,
          ayah: ayahNum,
          currentTime: 0,
          savedAt: Date.now(),
        });
        lastSessionSaveRef.current = Date.now();

        audio.onloadedmetadata = () => {
          if (!token.cancelled) setDuration(audio.duration || 0);
        };
        audio.ontimeupdate = () => {
          if (token.cancelled) return;
          setCurrentTime(audio.currentTime);
          setMediaSessionPositionState(
            audio.duration,
            audio.currentTime,
            speed,
          );

          const now = Date.now();
          if (now - lastSessionSaveRef.current > SESSION_SAVE_THROTTLE_MS) {
            lastSessionSaveRef.current = now;
            saveSession({
              reciterId: reciter.id,
              surahId,
              ayah: ayahNum,
              currentTime: audio.currentTime,
              savedAt: now,
            });
          }
        };
        audio.onended = () => {
          if (token.cancelled) return;
          if (repeatMode === "verse") {
            playAyah(ayahNum);
            return;
          }
          playAyah(ayahNum + 1);
        };
        // A single ayah file failing to load (network hiccup, etc.)
        // shouldn't stall the whole recitation — skip to the next ayah
        // rather than leaving playback silently stuck.
        audio.onerror = () => {
          if (!token.cancelled) playAyah(ayahNum + 1);
        };

        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      };

      playAyah(startAyah);
    },
    [speed, repeatMode, onVerseChange],
  );

  // Switching surah or reciter stops whatever continuous playback was
  // running rather than trying to carry it over — the user presses play
  // again to start the new surah/reciter combination explicitly.
  useEffect(() => {
    return () => {
      if (chainTokenRef.current) chainTokenRef.current.cancelled = true;
      audioRef.current?.pause();
    };
  }, [currentSurahId, selectedReciter?.id]);

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
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (audioRef.current && !audioRef.current.ended) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      return;
    }
    if (!selectedReciter || !currentSurahId) return;
    const resumeKey = `${selectedReciter.id}-${currentSurahId}`;
    const resumed = resumeAyahRef.current.get(resumeKey);
    const fromActive =
      activeVerseKey &&
      parseInt(activeVerseKey.split(":")[0], 10) === currentSurahId
        ? parseInt(activeVerseKey.split(":")[1], 10)
        : null;
    playAyahChain(selectedReciter, currentSurahId, resumed ?? fromActive ?? 1);
  }, [
    mode,
    isPlaying,
    activeVerseKey,
    playFromVerse,
    playWordAt,
    selectedReciter,
    currentSurahId,
    playAyahChain,
  ]);

  const restartFromBeginning = () => {
    if (!selectedReciter || !currentSurahId) return;
    playAyahChain(selectedReciter, currentSurahId, 1);
  };

  // ── Imperative "start from this ayah" entry point ──
  const startFromVerse = useCallback(
    async (verseKey: string): Promise<boolean> => {
      if (!currentSurahId) return false;
      const [surahStr, ayahStr] = verseKey.split(":");
      if (parseInt(surahStr, 10) !== currentSurahId) return false;

      if (mode === "sync") {
        playFromVerse(verseKey);
        return true;
      }

      // Continuous mode — every reciter in the picker has verified
      // per-ayah audio, so this is always exact. The only thing that can
      // block it is no reciter being selected yet.
      if (!selectedReciter) return false;

      const ayah = parseInt(ayahStr, 10);
      await playAyahChain(selectedReciter, currentSurahId, ayah);
      return true;
    },
    [mode, currentSurahId, selectedReciter, playFromVerse, playAyahChain],
  );

  const repeatVerse = useCallback(
    async (verseKey: string): Promise<boolean> => {
      if (!currentSurahId) return false;
      const [surahStr, ayahStr] = verseKey.split(":");
      if (parseInt(surahStr, 10) !== currentSurahId) return false;

      if (mode === "sync") {
        setRepeatMode("verse");
        playFromVerse(verseKey);
        return true;
      }

      if (!selectedReciter) return false;
      setRepeatMode("verse");
      const ayah = parseInt(ayahStr, 10);
      await playAyahChain(selectedReciter, currentSurahId, ayah);
      return true;
    },
    [mode, currentSurahId, selectedReciter, playFromVerse, playAyahChain],
  );

  useImperativeHandle(ref, () => ({ startFromVerse, repeatVerse }), [
    startFromVerse,
    repeatVerse,
  ]);

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

  // Seeking here only scrubs within the currently-loaded ayah's own file
  // (a normal, exact HTML5 audio seek) — it never jumps between ayahs or
  // estimates a position inside a longer file.
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
  const refreshMediaSession = useCallback(() => {
    const surahName = currentSurahId ? SURAH_NAMES_AR[currentSurahId - 1] : "";
    setMediaSessionMetadata({
      title: surahName || (isAr ? "القرآن الكريم" : "Quran"),
      artist: selectedReciter?.nameAr || "",
      album: isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman",
    });
    setMediaSessionHandlers({
      onPlay: togglePlay,
      onPause: togglePlay,
      onNext: onNextPage,
      onPrevious: onPrevPage,
    });
    if (audioRef.current) {
      setMediaSessionPositionState(
        audioRef.current.duration || 0,
        audioRef.current.currentTime || 0,
        speed,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSurahId,
    selectedReciter?.nameAr,
    isAr,
    togglePlay,
    onNextPage,
    onPrevPage,
    speed,
  ]);

  useEffect(() => {
    if (!isPlaying) {
      setMediaSessionPlaybackState("paused");
      disableBackgroundAudio();
      return;
    }

    setMediaSessionPlaybackState("playing");
    enableBackgroundAudio();
    refreshMediaSession();
  }, [isPlaying, refreshMediaSession]);

  useEffect(() => {
    return () => {
      clearMediaSession();
      disableBackgroundAudio();
    };
  }, []);

  // ── App-state transitions (native only): keep recitation genuinely
  // uninterrupted across screen lock / background, and recover cleanly
  // if the OS paused audio anyway (some Android versions still do this
  // under aggressive battery optimization despite the foreground
  // service). Enabling background-audio mode again on backgrounding is
  // redundant most of the time (it's already on from the isPlaying
  // effect above) but costs nothing and closes a race where the app was
  // backgrounded in the same tick playback started. ──
  useEffect(() => {
    if (!isNativeApp()) return;

    const subPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        if (isPlaying) {
          enableBackgroundAudio();
          if (audioRef.current) {
            saveSession({
              reciterId: selectedReciter?.id || "",
              surahId: currentSurahId || 0,
              ayah: currentAyah || 0,
              currentTime: audioRef.current.currentTime,
              savedAt: Date.now(),
            });
          }
        }
        return;
      }

      // Returning to the foreground.
      if (!isPlaying) return;
      refreshMediaSession();
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    });

    return () => {
      subPromise.then((sub) => sub.remove());
    };
  }, [
    isPlaying,
    currentSurahId,
    currentAyah,
    selectedReciter?.id,
    refreshMediaSession,
  ]);

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
                  ? selectedReciter.nameAr
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

        {/* Progress */}
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
              {currentAyah !== null && totalAyahs !== null && (
                <span className="text-white/30 text-[10px] font-mono whitespace-nowrap">
                  {currentAyah}/{totalAyahs}
                </span>
              )}
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
