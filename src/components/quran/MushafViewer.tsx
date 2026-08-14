"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getMushafPage,
  prefetchNeighborPages,
  getSurahFirstPage,
  TOTAL_MUSHAF_PAGES,
  type MushafPageData,
} from "@/lib/quran-page";
import { SURAH_NAMES_AR } from "@/lib/surahs";
import {
  getReadingBookmark,
  saveReadingBookmark,
  getMemorizationBookmark,
  saveMemorizationBookmark,
} from "@/lib/quran-bookmarks";
import type { CuratedReciter } from "@/lib/reciters";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import {
  getPanelHiddenPref,
  setPanelHiddenPref,
} from "@/lib/quran-panel-prefs";
import { getFocusModePref, setFocusModePref } from "@/lib/quran-focus-prefs";
import {
  getLastPage,
  setLastPage,
  getZoom,
  setZoom as persistZoom,
  getSelectedReciter,
  setSelectedReciter as persistSelectedReciter,
  MIN_ZOOM,
  MAX_ZOOM,
} from "@/lib/quran-reader-prefs";
import { getPageForVerseKey } from "@/lib/quran-search";
import { isNativeApp } from "@/lib/capacitor-adhan";
import { useNativeChrome } from "@/lib/native-chrome-context";
import SurahPanel from "./SurahPanel";
import ReciterPanel from "./ReciterPanel";
import QuranSearchPanel from "./QuranSearchPanel";
import AudioPlayer, { type AudioPlayerHandle } from "./AudioPlayer";
import AyahActionMenu from "./AyahActionMenu";
import QuranMoreSheet from "./QuranMoreSheet";
import {
  Bookmark,
  BookmarkCheck,
  PenLine,
  Search,
  Settings2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
} from "lucide-react";

interface Props {
  locale: string;
}

const CDN = "https://verses.quran.foundation";
const LONG_PRESS_MS = 500;
const loadedFonts = new Set<string>();

// Surah At-Tawbah (9) has no Bismillah per the standard Mushaf. Surah 1
// (Al-Fatiha) already counts the Bismillah as its own Ayah 1, so inserting
// a second copy there would duplicate it and shift nothing — but it'd look
// wrong, so it's excluded too.
const NO_BISMILLAH_SURAHS = new Set([1, 9]);
const BISMILLAH_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

// Reference dimensions the Mushaf card is designed against on desktop
// (640px wide, locked to the same 0.66 aspect-ratio used on the card
// itself). Used to compute a fullscreen "fit" zoom without depending on
// DOM measurement timing — see the immersive-mode effect below.
const MUSHAF_BASE_WIDTH = 640;
const MUSHAF_ASPECT_RATIO = 0.66;
const MUSHAF_BASE_HEIGHT = MUSHAF_BASE_WIDTH / MUSHAF_ASPECT_RATIO;

async function loadPageFont(page: number): Promise<void> {
  const fontName = `p${page}-v2`;
  if (loadedFonts.has(fontName)) return;
  try {
    const fontFace = new FontFace(
      fontName,
      `url('${CDN}/fonts/quran/hafs/v2/woff2/p${page}.woff2')`,
    );
    fontFace.display = "block";
    await fontFace.load();
    document.fonts.add(fontFace);
    loadedFonts.add(fontName);
  } catch (e) {
    console.warn(`Font p${page} failed`, e);
  }
}

/**
 * Returns the set of line numbers on this page that should have a
 * Bismillah banner rendered immediately above them — i.e. lines that carry
 * the first word of Ayah 1 of a surah other than Al-Fatiha/At-Tawbah.
 * Doesn't touch verseMeta/word data at all, so it can never affect verse
 * numbering or word rendering — it's purely an extra visual line.
 */
function getBismillahLineNumbers(pageData: MushafPageData | null): Set<number> {
  const result = new Set<number>();
  if (!pageData) return result;

  const seenSurahStarts = new Set<number>();
  for (const meta of pageData.verseMeta) {
    const [surahStr, ayahStr] = meta.verseKey.split(":");
    const surahId = parseInt(surahStr, 10);
    const ayah = parseInt(ayahStr, 10);
    if (ayah !== 1) continue;
    if (NO_BISMILLAH_SURAHS.has(surahId)) continue;
    if (seenSurahStarts.has(surahId)) continue;
    seenSurahStarts.add(surahId);

    const firstWord = pageData.words.find((w) => w.verseKey === meta.verseKey);
    if (firstWord) result.add(firstWord.lineNumber);
  }
  return result;
}

export default function MushafViewer({ locale }: Props) {
  const isAr = locale === "ar";
  // Rendered only after AppChrome resolves the platform (isNativeApp is
  // safe to read synchronously here — see ShareButtons.tsx for the same
  // pattern), so this drives every mobile-vs-desktop branch in this file.
  const native = isNativeApp();
  const { setHideAppBar, setHideBottomNav } = useNativeChrome();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageNumberRef = useRef(1);
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontReady, setFontReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [surahPanelOpen, setSurahPanelOpen] = useState(false);

  // ── Fullscreen reading (native) ──
  // A single, explicit on/off toggle. One tap hides the top App Bar, the
  // global Bottom Navigation, the Quran toolbar, page-nav row, and audio
  // bar (all already gated by chromeVisible below), leaving only the
  // Mushaf page and a small floating exit pill. This intentionally
  // overrides the app-wide "never hide the Bottom Nav" rule — only on
  // this page, only while this toggle is on, per explicit request.
  const [immersive, setImmersive] = useState(false);
  // Remembers the user's normal reading zoom so entering/exiting
  // fullscreen never overwrites their persisted preference — see the
  // fit-to-screen effect below.
  const preFullscreenZoomRef = useRef<number | null>(null);

  useEffect(() => {
    setImmersive(getFocusModePref());
  }, []);

  const enterImmersive = useCallback(() => {
    setImmersive(true);
    setFocusModePref(true);
    if (native) {
      setHideAppBar(true);
      setHideBottomNav(true);
    }
  }, [native, setHideAppBar, setHideBottomNav]);

  const exitImmersive = useCallback(() => {
    setImmersive(false);
    setFocusModePref(false);
    if (native) {
      setHideAppBar(false);
      setHideBottomNav(false);
    }
  }, [native, setHideAppBar, setHideBottomNav]);

  const toggleImmersive = useCallback(() => {
    if (immersive) exitImmersive();
    else enterImmersive();
  }, [immersive, enterImmersive, exitImmersive]);

  // Safety net: if the component unmounts (route change) while still
  // immersive on native, make sure the App Bar and Bottom Nav come back.
  useEffect(() => {
    return () => {
      if (native) {
        setHideAppBar(false);
        setHideBottomNav(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fit the Mushaf page to the true available screen whenever
  // fullscreen is toggled on native — computed from fixed reference
  // dimensions (not live DOM measurement) so it's correct on the very
  // first frame, with no flash of the wrong size. The page's own
  // aspect-ratio (0.66, set on the card itself) guarantees it's never
  // stretched or cropped — only the "zoom" (scale) changes. The user's
  // normal reading zoom is saved before entering and restored on exit,
  // so fullscreen never overwrites their persisted preference.
  useEffect(() => {
    if (!native) return;

    if (immersive) {
      preFullscreenZoomRef.current = zoom;
      const computeFit = () => {
        const el = scrollRef.current;
        if (!el) return;
        const availableW = el.clientWidth;
        const availableH = el.clientHeight;
        if (availableW <= 0 || availableH <= 0) return;
        const fit = Math.min(
          availableW / MUSHAF_BASE_WIDTH,
          availableH / MUSHAF_BASE_HEIGHT,
        );
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fit)));
      };
      const raf = requestAnimationFrame(computeFit);
      window.addEventListener("resize", computeFit);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", computeFit);
      };
    }

    if (preFullscreenZoomRef.current !== null) {
      setZoom(preFullscreenZoomRef.current);
      preFullscreenZoomRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersive, native]);

  // ── Settings (reciter) panel ──
  const isDesktopPanel = useIsDesktop(1024);
  const [panelHidden, setPanelHidden] = useState(false);
  const [reciterPanelOpen, setReciterPanelOpen] = useState(false);

  useEffect(() => {
    setPanelHidden(getPanelHiddenPref());
  }, []);

  const openSettingsPanel = useCallback(() => {
    if (isDesktopPanel) {
      setPanelHidden(false);
      setPanelHiddenPref(false);
    } else {
      setReciterPanelOpen(true);
    }
  }, [isDesktopPanel]);

  const handlePanelClose = useCallback(() => {
    if (isDesktopPanel) {
      setPanelHidden(true);
      setPanelHiddenPref(true);
    } else {
      setReciterPanelOpen(false);
    }
  }, [isDesktopPanel]);

  const toggleSettingsPanel = useCallback(() => {
    if (isDesktopPanel) {
      setPanelHidden((prev) => {
        const next = !prev;
        setPanelHiddenPref(next);
        return next;
      });
    } else {
      setReciterPanelOpen((prev) => !prev);
    }
  }, [isDesktopPanel]);

  const settingsPanelVisible = isDesktopPanel ? !panelHidden : reciterPanelOpen;

  // ── Quran search ──
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [searchHighlightKey, setSearchHighlightKey] = useState<string | null>(
    null,
  );
  const searchHighlightTimeoutRef = useRef<number | null>(null);

  const [activeVerseKey, setActiveVerseKey] = useState<string | null>(null);
  const [selectedReciter, setSelectedReciterState] =
    useState<CuratedReciter | null>(null);

  const [readingSaved, setReadingSaved] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoNotes, setMemoNotes] = useState("");
  const [toast, setToast] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null);

  // ── Ayah long-press context menu ──
  const [contextMenu, setContextMenu] = useState<{
    verseKey: string;
    x: number;
    y: number;
  } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const handleWordPointerDown = useCallback(
    (e: React.PointerEvent, verseKey: string) => {
      longPressFiredRef.current = false;
      const x = e.clientX;
      const y = e.clientY;
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true;
        setContextMenu({ verseKey, x, y });
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer],
  );

  const handleWordPointerUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleWordClick = useCallback((verseKey: string) => {
    // A long press already opened the context menu for this tap — don't
    // also treat the resulting click as a plain verse-select.
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    setActiveVerseKey(verseKey);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  const handleStartFromHere = useCallback(
    async (verseKey: string) => {
      const ok = await audioPlayerRef.current?.startFromVerse(verseKey);
      if (ok === false) {
        showToast(
          isAr
            ? "اختر قارئاً أولاً من إعدادات الاستماع المتواصل"
            : "Choose a reciter first from continuous-mode settings",
        );
        openSettingsPanel();
      }
    },
    [isAr, openSettingsPanel, showToast],
  );

  const handleRepeatAyah = useCallback(
    async (verseKey: string) => {
      const ok = await audioPlayerRef.current?.repeatVerse(verseKey);
      if (ok === false) {
        showToast(
          isAr
            ? "اختر قارئاً أولاً من إعدادات الاستماع المتواصل"
            : "Choose a reciter first from continuous-mode settings",
        );
        openSettingsPanel();
      }
    },
    [isAr, openSettingsPanel, showToast],
  );

  // ── Memorization selection (feeds Hifz Mode) ──
  const [memorizationSelection, setMemorizationSelection] = useState<
    Set<string>
  >(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);

  const handleAddToSelection = useCallback(
    (verseKey: string) => {
      setMemorizationSelection((prev) => {
        const next = new Set(prev);
        next.add(verseKey);
        return next;
      });
      showToast(
        isAr
          ? "أُضيفت الآية إلى تحديد الحفظ"
          : "Ayah added to memorization selection",
      );
    },
    [isAr, showToast],
  );

  const handleStartSelection = useCallback(
    (verseKey: string) => {
      setSelectionAnchor(verseKey);
      showToast(
        isAr ? `بداية التحديد: ${verseKey}` : `Selection starts at ${verseKey}`,
      );
    },
    [isAr, showToast],
  );

  const handleEndSelection = useCallback(
    (verseKey: string) => {
      if (!selectionAnchor) {
        showToast(
          isAr ? "اختر بداية التحديد أولاً" : "Choose a selection start first",
        );
        return;
      }
      const [anchorSurahStr, anchorAyahStr] = selectionAnchor.split(":");
      const [endSurahStr, endAyahStr] = verseKey.split(":");
      const anchorSurah = parseInt(anchorSurahStr, 10);
      const endSurah = parseInt(endSurahStr, 10);
      if (anchorSurah !== endSurah) {
        showToast(
          isAr
            ? "التحديد يجب أن يكون ضمن نفس السورة"
            : "Selection must stay within the same surah",
        );
        return;
      }
      const anchorAyah = parseInt(anchorAyahStr, 10);
      const endAyah = parseInt(endAyahStr, 10);
      const lo = Math.min(anchorAyah, endAyah);
      const hi = Math.max(anchorAyah, endAyah);
      setMemorizationSelection((prev) => {
        const next = new Set(prev);
        for (let a = lo; a <= hi; a++) next.add(`${anchorSurah}:${a}`);
        return next;
      });
      setSelectionAnchor(null);
      showToast(
        isAr
          ? `تم تحديد ${hi - lo + 1} آية للحفظ`
          : `${hi - lo + 1} ayahs selected for memorization`,
      );
    },
    [isAr, selectionAnchor, showToast],
  );

  const getAyahText = useCallback(
    (verseKey: string) => {
      if (!pageData) return "";
      return pageData.words
        .filter((w) => w.verseKey === verseKey && w.charTypeName !== "end")
        .sort((a, b) => a.position - b.position)
        .map((w) => w.textQpcHafs)
        .join(" ");
    },
    [pageData],
  );

  const handleCopyAyah = useCallback(
    async (verseKey: string) => {
      const text = getAyahText(verseKey);
      if (!text) {
        showToast(isAr ? "تعذّر نسخ الآية" : "Couldn't copy this ayah");
        return;
      }
      try {
        await navigator.clipboard.writeText(`${text} (${verseKey})`);
        showToast(isAr ? "تم نسخ الآية" : "Ayah copied");
      } catch {
        showToast(isAr ? "تعذّر نسخ الآية" : "Couldn't copy this ayah");
      }
    },
    [getAyahText, isAr, showToast],
  );

  const handleShareAyah = useCallback(
    async (verseKey: string) => {
      const text = getAyahText(verseKey);
      if (!text) {
        showToast(isAr ? "تعذّر مشاركة الآية" : "Couldn't share this ayah");
        return;
      }
      const shareText = `${text}\n\n﴾ ${verseKey} ﴿`;
      try {
        if (isNativeApp()) {
          const { Share } = await import("@capacitor/share");
          await Share.share({ text: shareText });
          return;
        }
        if (navigator.share) {
          await navigator.share({ text: shareText });
          return;
        }
        await navigator.clipboard.writeText(shareText);
        showToast(isAr ? "تم نسخ الآية للمشاركة" : "Ayah copied for sharing");
      } catch {
        // user cancelled the native share sheet — not an error
      }
    },
    [getAyahText, isAr, showToast],
  );

  const handleBookmarkAyah = useCallback((verseKey: string) => {
    setActiveVerseKey(verseKey);
    openMemoDialog();
  }, []);

  // Touch gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  useEffect(() => {
    setPageNumber(getLastPage());
    setZoom(getZoom());
    const rb = getReadingBookmark();
    setReadingSaved(!!rb && rb.pageNumber === getLastPage());
  }, []);

  useEffect(() => {
    setSelectedReciterState(getSelectedReciter());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFontReady(false);
    setActiveVerseKey(null);

    (async () => {
      const data = await getMushafPage(pageNumber);
      if (cancelled) return;
      setPageData(data);
      await loadPageFont(pageNumber);
      if (cancelled) return;
      setFontReady(true);
      setLoading(false);
      prefetchNeighborPages(pageNumber);
      setLastPage(pageNumber);

      const rb = getReadingBookmark();
      setReadingSaved(!!rb && rb.pageNumber === pageNumber);
    })().catch((e) => {
      console.error(e);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  const setAndPersistZoom = useCallback((z: number) => {
    const clamped = persistZoom(z);
    setZoom(clamped);
  }, []);

  const goToPage = useCallback((p: number) => {
    if (p < 1 || p > TOTAL_MUSHAF_PAGES) return;
    setPageNumber(p);
  }, []);

  const handleAudioVerseChange = useCallback(
    (verseKey: string | null) => {
      setActiveVerseKey(verseKey);
      if (!verseKey) return;

      const onCurrentPage = pageData?.verseMeta.some(
        (v) => v.verseKey === verseKey,
      );
      if (onCurrentPage) return;

      getPageForVerseKey(verseKey)
        .then((page) => {
          if (page !== pageNumberRef.current) goToPage(page);
        })
        .catch(() => {
          // Lookup failed — audio keeps playing regardless, the page just
          // won't auto-follow for this particular ayah.
        });
    },
    [pageData, goToPage],
  );

  // ── Fit width / height / screen ──
  const fitWidth = () => setAndPersistZoom(1);

  const fitHeight = () => {
    if (!scrollRef.current || !contentRef.current) return fitWidth();
    const availableH = scrollRef.current.clientHeight - 32;
    const contentH = contentRef.current.scrollHeight / zoom;
    if (contentH > 0) setAndPersistZoom(availableH / contentH);
  };

  const fitScreen = () => {
    if (!scrollRef.current || !contentRef.current) return fitWidth();
    const availableH = scrollRef.current.clientHeight - 32;
    const availableW = scrollRef.current.clientWidth - 32;
    const contentH = contentRef.current.scrollHeight / zoom;
    const contentW = contentRef.current.scrollWidth / zoom;
    const scaleH = contentH > 0 ? availableH / contentH : 1;
    const scaleW = contentW > 0 ? availableW / contentW : 1;
    setAndPersistZoom(Math.min(scaleH, scaleW));
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "Escape":
          if (contextMenu) {
            setContextMenu(null);
          } else if (immersive) {
            exitImmersive();
          }
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "z":
        case "Z":
          toggleImmersive();
          break;
        case "s":
        case "S":
          toggleSettingsPanel();
          break;
        case "ArrowRight":
          if (isAr) {
            goToPage(pageNumber - 1);
          } else {
            goToPage(pageNumber + 1);
          }
          break;
        case "ArrowLeft":
          if (isAr) {
            goToPage(pageNumber + 1);
          } else {
            goToPage(pageNumber - 1);
          }
          break;
        case "+":
        case "=":
          setAndPersistZoom(zoom + 0.1);
          break;
        case "-":
          setAndPersistZoom(zoom - 0.1);
          break;
        case "0":
          setAndPersistZoom(1);
          break;
        case " ":
          e.preventDefault();
          document.getElementById("quran-audio-toggle")?.click();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    pageNumber,
    zoom,
    isAr,
    goToPage,
    toggleFullscreen,
    setAndPersistZoom,
    toggleSettingsPanel,
    immersive,
    exitImmersive,
    toggleImmersive,
    contextMenu,
  ]);

  // ── Touch gestures: swipe, pinch, double-tap ──
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchStartDist.current = Math.hypot(
        a.clientX - b.clientX,
        a.clientY - b.clientY,
      );
      pinchStartZoom.current = zoom;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / pinchStartDist.current;
      setZoom(
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom.current * ratio)),
      );
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinchStartDist.current) {
      // Pinch-adjustments made while fullscreen are temporary — don't let
      // them overwrite the user's normal persisted reading zoom.
      if (!immersive) persistZoom(zoom);
      pinchStartDist.current = null;
      return;
    }
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;

    const now = Date.now();
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // Double-tap-to-reset is disabled in fullscreen — it would fight
      // the auto-computed fit zoom.
      if (now - lastTapTime.current < 300 && !immersive) {
        setAndPersistZoom(1);
      }
      lastTapTime.current = now;
    } else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        if (isAr) {
          goToPage(pageNumber - 1);
        } else {
          goToPage(pageNumber + 1);
        }
      } else {
        if (isAr) {
          goToPage(pageNumber + 1);
        } else {
          goToPage(pageNumber - 1);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSelectSurah = async (surahId: number) => {
    setSurahPanelOpen(false);
    const page = await getSurahFirstPage(surahId);
    goToPage(page);
  };

  const handleSelectReciter = (m: CuratedReciter) => {
    setSelectedReciterState(m);
    persistSelectedReciter(m);
  };

  const handleSearchNavigate = (page: number, verseKey: string) => {
    goToPage(page);
    setActiveVerseKey(verseKey);
    setSearchHighlightKey(verseKey);
    if (searchHighlightTimeoutRef.current) {
      window.clearTimeout(searchHighlightTimeoutRef.current);
    }
    searchHighlightTimeoutRef.current = window.setTimeout(() => {
      setSearchHighlightKey(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (searchHighlightTimeoutRef.current) {
        window.clearTimeout(searchHighlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!searchHighlightKey || loading) return;
    const el = document.querySelector(
      `[data-verse-key="${CSS.escape(searchHighlightKey)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchHighlightKey, loading, pageNumber]);

  const handleSaveReadingBookmark = () => {
    if (!pageData) return;
    const surahId = pageData.surahIds[0];
    const meta = pageData.verseMeta[0];
    saveReadingBookmark({
      pageNumber,
      surahId,
      surahName: SURAH_NAMES_AR[surahId - 1] || "",
      juzNumber: meta?.juzNumber || 1,
    });
    setReadingSaved(true);
    showToast(isAr ? "تم حفظ العلامة" : "Bookmark saved");
  };

  const handleContinueReading = () => {
    const rb = getReadingBookmark();
    if (rb) goToPage(rb.pageNumber);
  };

  const handleSaveMemo = () => {
    if (!activeVerseKey) {
      showToast(isAr ? "اختر آية أولاً" : "Select a verse first");
      return;
    }
    saveMemorizationBookmark({
      pageNumber,
      verseKey: activeVerseKey,
      notes: memoNotes,
    });
    setMemoOpen(false);
    showToast(isAr ? "تم حفظ علامة الحفظ" : "Memorization bookmark saved");
  };

  const openMemoDialog = () => {
    const existing = getMemorizationBookmark();
    setMemoNotes(existing?.notes || "");
    setMemoOpen(true);
  };

  // Group words by line
  const lineMap = new Map<number, MushafPageData["words"]>();
  (pageData?.words ?? []).forEach((w) => {
    if (!lineMap.has(w.lineNumber)) lineMap.set(w.lineNumber, []);
    lineMap.get(w.lineNumber)!.push(w);
  });
  const lines = Array.from(lineMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, words]) => ({ key, words }));

  const bismillahLines = getBismillahLineNumbers(pageData);

  type PageRow =
    | { type: "bismillah" }
    | { type: "words"; lineKey: number; words: MushafPageData["words"] };
  const pageRows: PageRow[] = [];
  for (const line of lines) {
    if (bismillahLines.has(line.key)) pageRows.push({ type: "bismillah" });
    pageRows.push({ type: "words", lineKey: line.key, words: line.words });
  }

  const currentSurahId = pageData?.surahIds[0] ?? null;
  const currentSurahName = currentSurahId
    ? SURAH_NAMES_AR[currentSurahId - 1]
    : "";
  const hasSajdah = pageData?.verseMeta.some((v) => v.sajdahNumber !== null);
  const firstMeta = pageData?.verseMeta[0];
  const fontLoadedForPage = fontReady && loadedFonts.has(`p${pageNumber}-v2`);

  // No more tap-to-reveal/auto-hide — chrome is simply on or off, matching
  // the `immersive` toggle exactly.
  const chromeVisible = !immersive;

  return (
    <div
      ref={containerRef}
      className={`bg-[#1a1a1a] flex flex-col ${native ? "" : "h-screen"}`}
    >
      {chromeVisible && (
        // On native, the toolbar + page-nav stick to the top of the
        // scrollable content area (the outer NativeLayout <main> owns the
        // actual scrolling here — MushafViewer no longer forces its own
        // h-screen/overflow region on native, see the scrollRef div
        // below). Web/desktop is unaffected: this wrapper is still a
        // plain flex-col, so the two rows stack exactly as before.
        <div className={`flex flex-col ${native ? "sticky top-0 z-40" : ""}`}>
          {/* Toolbar */}
          {native ? (
            <div className="flex-shrink-0 bg-[#111] border-b border-white/10 px-3 py-2.5 transition-opacity duration-200">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSurahPanelOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-arabic px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 min-w-0"
                >
                  <span className="truncate">{currentSurahName || "…"}</span>
                  <span className="text-white/40 text-xs flex-shrink-0">▾</span>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={enterImmersive}
                    title={isAr ? "ملء الشاشة" : "Fullscreen"}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    onClick={() => setSearchPanelOpen(true)}
                    title={isAr ? "بحث في القرآن" : "Search Quran"}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    onClick={toggleSettingsPanel}
                    title={isAr ? "القارئ" : "Reciter"}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      settingsPanelVisible
                        ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <Settings2 size={16} />
                  </button>
                  <button
                    onClick={() => setMoreSheetOpen(true)}
                    title={isAr ? "المزيد" : "More"}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 bg-[#111] border-b border-white/10 px-3 py-2.5 z-40 transition-opacity duration-200">
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setSurahPanelOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-arabic px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <span>{currentSurahName || "…"}</span>
                  <span className="text-white/40 text-xs">▾</span>
                </button>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={handleSaveReadingBookmark}
                    title={isAr ? "حفظ علامة القراءة" : "Save reading bookmark"}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    {readingSaved ? (
                      <BookmarkCheck size={15} className="text-[#C9A84C]" />
                    ) : (
                      <Bookmark size={15} />
                    )}
                  </button>
                  <button
                    onClick={handleContinueReading}
                    title={isAr ? "متابعة القراءة" : "Continue reading"}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-arabic"
                  >
                    {isAr ? "متابعة" : "Continue"}
                  </button>
                  <button
                    onClick={openMemoDialog}
                    title={isAr ? "علامة الحفظ" : "Memorization bookmark"}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <PenLine size={15} />
                  </button>

                  <span className="w-px h-5 bg-white/10 mx-0.5" />

                  <button
                    onClick={() => setAndPersistZoom(zoom - 0.1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="px-1 text-white/60 text-xs font-mono w-11 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setAndPersistZoom(zoom + 0.1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={fitWidth}
                    title={isAr ? "ملائمة العرض" : "Fit width"}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-arabic"
                  >
                    {isAr ? "العرض" : "Width"}
                  </button>
                  <button
                    onClick={fitHeight}
                    title={isAr ? "ملائمة الارتفاع" : "Fit height"}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-arabic"
                  >
                    {isAr ? "الارتفاع" : "Height"}
                  </button>
                  <button
                    onClick={fitScreen}
                    title={isAr ? "ملائمة الشاشة" : "Fit screen"}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-arabic"
                  >
                    {isAr ? "الشاشة" : "Screen"}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    title={isAr ? "ملء الشاشة (F)" : "Fullscreen (F)"}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center"
                  >
                    {isFullscreen ? "⤢" : "⛶"}
                  </button>

                  <span className="w-px h-5 bg-white/10 mx-0.5" />

                  <button
                    onClick={() => setSearchPanelOpen(true)}
                    title={isAr ? "بحث في القرآن" : "Search Quran"}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <Search size={15} />
                  </button>
                  <button
                    onClick={toggleSettingsPanel}
                    title={
                      isAr
                        ? "إظهار/إخفاء الإعدادات (S)"
                        : "Show/hide settings (S)"
                    }
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      settingsPanelVisible
                        ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <Settings2 size={15} />
                  </button>
                  <button
                    onClick={enterImmersive}
                    title={
                      isAr
                        ? "وضع القراءة الكاملة (Z)"
                        : "Fullscreen Reading (Z)"
                    }
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page nav */}
          <div className="flex-shrink-0 bg-[#161616] border-b border-white/5 px-3 py-2 z-30 transition-opacity duration-200">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <button
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-arabic rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "‹ السابقة" : "‹ Prev"}
              </button>

              <div className="text-center">
                <span className="text-white/70 font-arabic text-sm block">
                  {isAr ? `صفحة ${pageNumber}` : `Page ${pageNumber}`}
                </span>
                {firstMeta && (
                  <span className="text-white/30 font-arabic text-xs block">
                    {isAr
                      ? `جزء ${firstMeta.juzNumber} · حزب ${firstMeta.hizbNumber}`
                      : `Juz ${firstMeta.juzNumber} · Hizb ${firstMeta.hizbNumber}`}
                    {hasSajdah && <> · {isAr ? "۩ سجدة" : "۩ Sajdah"}</>}
                  </span>
                )}
              </div>

              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= TOTAL_MUSHAF_PAGES}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-arabic rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "التالية ›" : "Next ›"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable, zoomable Mushaf area + docked settings panel.
         flex-1/min-h-0 only makes sense against a height-bound ancestor
         (the h-screen root on web). On native the root has no fixed
         height by design, so this wrapper must fall back to plain block
         flow and just size to its content instead of collapsing. */}
      <div className={`relative ${native ? "" : "flex-1 flex min-h-0"}`}>
        <div
          ref={scrollRef}
          className={
            native
              ? immersive
                ? // True fullscreen: a fixed overlay spanning the entire
                  // viewport, independent of any parent's layout/height
                  // quirks — this is what guarantees "maximum available
                  // screen, edge to edge" regardless of how NativeLayout's
                  // own <main> is sized. Centering here (both axes) plus
                  // the card's own aspect-ratio is what keeps the page
                  // correctly proportioned, never stretched or cropped.
                  "fixed inset-0 z-[95] bg-[#1a1a1a] flex items-center justify-center overflow-hidden min-w-0"
                : "min-w-0 px-4 py-6"
              : "min-w-0 flex-1 overflow-auto px-4 py-6 pb-28"
          }
          style={
            native
              ? immersive
                ? {
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                  }
                : { paddingBottom: "calc(200px + env(safe-area-inset-bottom))" }
              : undefined
          }
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-arabic text-white/40">
                    {isAr ? "جارٍ تحميل الصفحة..." : "Loading page..."}
                  </p>
                </div>
              </div>
            ) : (
              // Zoom is applied by resizing this box directly (width in %,
              // height following from aspect-ratio) instead of CSS
              // transform: scale(), so a smaller zoom shrinks the actual
              // footprint too — no dead space around the page.
              <div
                className="mx-auto transition-[width,max-width] duration-150"
                style={{ width: `${100 * zoom}%`, maxWidth: `${640 * zoom}px` }}
              >
                <div
                  ref={contentRef}
                  style={{ aspectRatio: "0.66" }}
                  className="mushaf-container-query rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                >
                  <div
                    className="h-1.5 flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                    }}
                  />
                  <div
                    className="pt-1.5 pb-0.5 text-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)",
                    }}
                  >
                    <span className="text-[10px] text-gray-400 font-arabic">
                      {isAr ? `صفحة ${pageNumber}` : `Page ${pageNumber}`}
                    </span>
                  </div>

                  <div
                    dir="rtl"
                    className="flex-1 min-h-0 px-6"
                    style={{
                      display: "grid",
                      gridTemplateRows: `repeat(${pageRows.length}, 1fr)`,
                      background:
                        "linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)",
                    }}
                  >
                    {pageRows.map((row, rowIdx) =>
                      row.type === "bismillah" ? (
                        <div
                          key={`bismillah-${rowIdx}`}
                          className="flex justify-center items-center"
                        >
                          <span
                            style={{
                              fontFamily:
                                "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                              // Ratio matches the desktop card's clamped
                              // value exactly at 640px (26/640), so
                              // desktop is pixel-identical; on narrower
                              // mobile cards this now scales down
                              // proportionally instead of using a larger,
                              // unclamped ratio that caused line-wrapping.
                              fontSize: "clamp(11px, 4.0625cqw, 26px)",
                              color: "#1B6B4A",
                            }}
                          >
                            {BISMILLAH_TEXT}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={row.lineKey}
                          className="flex justify-center items-center flex-wrap"
                        >
                          {row.words.map((word) => {
                            const isEnd = word.charTypeName === "end";
                            const isActive = word.verseKey === activeVerseKey;
                            const isSearchHit =
                              word.verseKey === searchHighlightKey;
                            const isSelected = memorizationSelection.has(
                              word.verseKey,
                            );

                            if (isEnd) {
                              return (
                                <span
                                  key={word.id}
                                  data-verse-key={word.verseKey}
                                  style={{
                                    fontFamily:
                                      "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                                    // Ratio matches desktop's clamped
                                    // value at 640px (24/640) — see note
                                    // above.
                                    fontSize: "clamp(10px, 3.75cqw, 24px)",
                                    color: "#C9A84C",
                                    margin: "0 2px",
                                  }}
                                >
                                  {word.textQpcHafs}
                                </span>
                              );
                            }

                            return (
                              <span
                                key={word.id}
                                data-verse-key={word.verseKey}
                                onPointerDown={(e) =>
                                  handleWordPointerDown(e, word.verseKey)
                                }
                                onPointerUp={handleWordPointerUp}
                                onPointerLeave={handleWordPointerUp}
                                onPointerCancel={handleWordPointerUp}
                                onClick={() => handleWordClick(word.verseKey)}
                                title={word.verseKey}
                                className={`cursor-pointer rounded transition-colors select-none ${
                                  isSearchHit
                                    ? "bg-[#C9A84C]/40 ring-2 ring-[#C9A84C] animate-pulse"
                                    : isActive
                                      ? "bg-[#C9A84C]/25"
                                      : isSelected
                                        ? "bg-blue-400/20 ring-1 ring-blue-400/50"
                                        : "hover:bg-primary/10"
                                }`}
                                style={{
                                  fontFamily: fontLoadedForPage
                                    ? `p${word.pageNumber}-v2`
                                    : "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                                  // Ratio matches desktop's clamped value
                                  // at 640px (28/640 = 4.375%) exactly, so
                                  // desktop's rendering is byte-for-byte
                                  // unchanged. The old 5.4cqw coefficient
                                  // was only ever exercised UNCLAMPED on
                                  // narrow mobile cards (desktop always
                                  // hit the 28px ceiling), where it
                                  // produced a larger font-to-page-width
                                  // ratio than desktop — causing each
                                  // Mushaf line's words to no longer fit
                                  // their row, wrapping onto an extra
                                  // line, overflowing the row's fixed 1fr
                                  // grid height, and getting visually
                                  // clipped by the card's overflow-hidden.
                                  // That was the entire root cause of the
                                  // native/mobile cropping and mismatched
                                  // line breaks.
                                  fontSize: "clamp(12px, 4.375cqw, 28px)",
                                  lineHeight: "1.6",
                                  color: "#1a1a1a",
                                  padding: "0 1px",
                                  WebkitTouchCallout: "none",
                                }}
                                dangerouslySetInnerHTML={
                                  fontLoadedForPage
                                    ? { __html: word.codeV2 }
                                    : undefined
                                }
                              >
                                {!fontLoadedForPage
                                  ? word.textQpcHafs
                                  : undefined}
                              </span>
                            );
                          })}
                        </div>
                      ),
                    )}
                  </div>

                  <div
                    className="h-1.5 flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {chromeVisible && (
          <ReciterPanel
            isOpen={reciterPanelOpen}
            onClose={handlePanelClose}
            onSelect={handleSelectReciter}
            locale={locale}
            selectedId={selectedReciter?.id}
            collapsed={panelHidden}
          />
        )}

        {immersive && (
          <button
            onClick={exitImmersive}
            title={
              isAr ? "الخروج من ملء الشاشة (Esc)" : "Exit Fullscreen (Esc)"
            }
            className="fixed inset-x-0 mx-auto w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white text-xs font-arabic backdrop-blur-sm transition-all z-[100]"
            style={{ top: "calc(12px + env(safe-area-inset-top))" }}
          >
            <Minimize2 size={12} />
            {isAr ? "الخروج من ملء الشاشة" : "Exit Fullscreen"}
          </button>
        )}
      </div>

      {chromeVisible && (
        <AudioPlayer
          ref={audioPlayerRef}
          locale={locale}
          pageWords={pageData?.words ?? []}
          activeVerseKey={activeVerseKey}
          currentSurahId={currentSurahId}
          selectedReciter={selectedReciter}
          onOpenReciterPanel={openSettingsPanel}
          onNextPage={() => goToPage(pageNumber + 1)}
          onPrevPage={() => goToPage(pageNumber - 1)}
          onVerseChange={handleAudioVerseChange}
          cdnBase={CDN}
        />
      )}
      <button id="quran-audio-toggle" className="hidden" aria-hidden />

      <SurahPanel
        isOpen={surahPanelOpen}
        onClose={() => setSurahPanelOpen(false)}
        onSelect={handleSelectSurah}
        locale={locale}
        currentSurahId={currentSurahId ?? undefined}
      />
      <QuranSearchPanel
        isOpen={searchPanelOpen}
        onClose={() => setSearchPanelOpen(false)}
        locale={locale}
        onNavigate={handleSearchNavigate}
      />

      <QuranMoreSheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        locale={locale}
        zoom={zoom}
        onZoomIn={() => setAndPersistZoom(zoom + 0.1)}
        onZoomOut={() => setAndPersistZoom(zoom - 0.1)}
        onFitWidth={fitWidth}
        onFitHeight={fitHeight}
        onFitScreen={fitScreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => {
          toggleFullscreen();
          setMoreSheetOpen(false);
        }}
        readingSaved={readingSaved}
        onSaveReadingBookmark={() => {
          handleSaveReadingBookmark();
          setMoreSheetOpen(false);
        }}
        onContinueReading={() => {
          handleContinueReading();
          setMoreSheetOpen(false);
        }}
        onOpenMemoDialog={() => {
          openMemoDialog();
          setMoreSheetOpen(false);
        }}
      />

      {contextMenu && (
        <AyahActionMenu
          verseKey={contextMenu.verseKey}
          x={contextMenu.x}
          y={contextMenu.y}
          locale={locale}
          onStartFromHere={() => handleStartFromHere(contextMenu.verseKey)}
          onRepeatAyah={() => handleRepeatAyah(contextMenu.verseKey)}
          onAddToSelection={() => handleAddToSelection(contextMenu.verseKey)}
          onStartSelection={() => handleStartSelection(contextMenu.verseKey)}
          onEndSelection={() => handleEndSelection(contextMenu.verseKey)}
          onCopyAyah={() => handleCopyAyah(contextMenu.verseKey)}
          onShareAyah={() => handleShareAyah(contextMenu.verseKey)}
          onBookmark={() => handleBookmarkAyah(contextMenu.verseKey)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Memorization dialog */}
      {memoOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setMemoOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? "rtl" : "ltr"}
          >
            <h3 className="font-arabic font-bold text-gray-800 mb-1">
              {isAr ? "علامة الحفظ" : "Memorization Bookmark"}
            </h3>
            <p className="font-arabic text-xs text-gray-400 mb-4">
              {activeVerseKey
                ? isAr
                  ? `سيتم حفظ الآية ${activeVerseKey} — صفحة ${pageNumber}`
                  : `Saves verse ${activeVerseKey} — page ${pageNumber}`
                : isAr
                  ? "اضغط على آية في الصفحة أولاً"
                  : "Tap a verse on the page first"}
            </p>
            <textarea
              value={memoNotes}
              onChange={(e) => setMemoNotes(e.target.value)}
              rows={3}
              placeholder={isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 font-arabic text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir={isAr ? "rtl" : "ltr"}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveMemo}
                className="flex-1 py-2.5 rounded-xl text-white font-arabic font-bold"
                style={{
                  background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
                }}
              >
                {isAr ? "حفظ" : "Save"}
              </button>
              <button
                onClick={() => setMemoOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-arabic"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-black/80 text-white text-sm font-arabic px-4 py-2 rounded-full">
          {toast}
        </div>
      )}

      <style suppressHydrationWarning>{`
         @font-face {
          font-family: 'UthmanicHafs1Ver18';
          src: url('${CDN}/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2') format('woff2');
          font-display: swap;
        }
        .mushaf-container-query {
          container-type: inline-size;
        }
      `}</style>
    </div>
  );
}
