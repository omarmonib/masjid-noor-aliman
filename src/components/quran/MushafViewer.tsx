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
import type { ReciterMoshaf } from "@/lib/reciters";
import SurahPanel from "./SurahPanel";
import ReciterPanel from "./ReciterPanel";
import AudioPlayer from "./AudioPlayer";
import { Bookmark, BookmarkCheck, PenLine } from "lucide-react";

interface Props {
  locale: string;
}

const CDN = "https://verses.quran.foundation";
const LAST_PAGE_KEY = "quran:last-page";
const ZOOM_KEY = "quran:zoom";
const RECITER_KEY = "quran:selected-reciter";
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const loadedFonts = new Set<string>();

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

function readInitialPage(): number {
  if (typeof window === "undefined") return 1;
  const stored = Number(localStorage.getItem(LAST_PAGE_KEY));
  return stored >= 1 && stored <= TOTAL_MUSHAF_PAGES ? stored : 1;
}

function readInitialZoom(): number {
  if (typeof window === "undefined") return 1;
  const stored = Number(localStorage.getItem(ZOOM_KEY));
  return stored >= MIN_ZOOM && stored <= MAX_ZOOM ? stored : 1;
}

export default function MushafViewer({ locale }: Props) {
  const isAr = locale === "ar";
  const [pageNumber, setPageNumber] = useState(1);
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontReady, setFontReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [surahPanelOpen, setSurahPanelOpen] = useState(false);
  const [reciterPanelOpen, setReciterPanelOpen] = useState(false);
  const [activeVerseKey, setActiveVerseKey] = useState<string | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<ReciterMoshaf | null>(
    null,
  );

  const [readingSaved, setReadingSaved] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoNotes, setMemoNotes] = useState("");
  const [toast, setToast] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Touch gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  useEffect(() => {
    setPageNumber(readInitialPage());
    setZoom(readInitialZoom());
    const rb = getReadingBookmark();
    setReadingSaved(!!rb && rb.pageNumber === readInitialPage());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RECITER_KEY);
    if (stored) {
      try {
        setSelectedReciter(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
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
      localStorage.setItem(LAST_PAGE_KEY, String(pageNumber));

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
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    setZoom(clamped);
    localStorage.setItem(ZOOM_KEY, String(clamped));
  }, []);

  const goToPage = useCallback((p: number) => {
    if (p < 1 || p > TOTAL_MUSHAF_PAGES) return;
    setPageNumber(p);
  }, []);

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
        case "f":
        case "F":
          toggleFullscreen();
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
  }, [pageNumber, zoom, isAr, goToPage, toggleFullscreen, setAndPersistZoom]);

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
      localStorage.setItem(ZOOM_KEY, String(zoom));
      pinchStartDist.current = null;
      return;
    }
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;

    // Double tap → reset zoom
    const now = Date.now();
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      if (now - lastTapTime.current < 300) {
        setAndPersistZoom(1);
      }
      lastTapTime.current = now;
    }
    // Swipe (horizontal dominant, minimal vertical drift so it doesn't fight scroll)
    else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
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

  const handleSelectReciter = (m: ReciterMoshaf) => {
    setSelectedReciter(m);
    localStorage.setItem(RECITER_KEY, JSON.stringify(m));
    setReciterPanelOpen(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

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

  const currentSurahId = pageData?.surahIds[0] ?? null;
  const currentSurahName = currentSurahId
    ? SURAH_NAMES_AR[currentSurahId - 1]
    : "";
  const hasSajdah = pageData?.verseMeta.some((v) => v.sajdahNumber !== null);
  const firstMeta = pageData?.verseMeta[0];
  const fontLoadedForPage = fontReady && loadedFonts.has(`p${pageNumber}-v2`);

  return (
    <div ref={containerRef} className="h-screen bg-[#1a1a1a] flex flex-col">
      {/* Toolbar — fixed, never scrolls, never disappears */}
      <div className="flex-shrink-0 bg-[#111] border-b border-white/10 px-3 py-2.5 z-40">
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
          </div>
        </div>
      </div>

      {/* Page nav — fixed, always visible regardless of zoom */}
      <div className="flex-shrink-0 bg-[#161616] border-b border-white/5 px-3 py-2 z-30">
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

      {/* Scrollable, zoomable Mushaf area — this is the ONLY part that scales/scrolls */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-4 py-6 pb-28"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="max-w-3xl mx-auto">
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
            <div
              ref={contentRef}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
              className="rounded-2xl overflow-hidden shadow-2xl transition-transform duration-150"
            >
              <div
                className="h-2"
                style={{
                  background:
                    "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                }}
              />
              <div
                className="pt-3 pb-1 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)",
                }}
              >
                <span className="text-xs text-gray-400 font-arabic">
                  {isAr ? `صفحة ${pageNumber}` : `Page ${pageNumber}`}
                </span>
              </div>

              <div
                className="px-8 pb-6"
                dir="rtl"
                style={{
                  background:
                    "linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)",
                }}
              >
                {lines.map(({ key, words }) => (
                  <div
                    key={key}
                    className="flex justify-center items-baseline flex-wrap"
                    style={{ minHeight: "48px", marginBottom: "4px" }}
                  >
                    {words.map((word) => {
                      const isEnd = word.charTypeName === "end";
                      const isActive = word.verseKey === activeVerseKey;

                      if (isEnd) {
                        return (
                          <span
                            key={word.id}
                            style={{
                              fontFamily:
                                "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                              fontSize: "clamp(12px, 4.5vw, 28px)",
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
                          onClick={() => setActiveVerseKey(word.verseKey)}
                          title={word.verseKey}
                          className={`cursor-pointer rounded transition-colors ${
                            isActive ? "bg-[#C9A84C]/25" : "hover:bg-primary/10"
                          }`}
                          style={{
                            fontFamily: fontLoadedForPage
                              ? `p${word.pageNumber}-v2`
                              : "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                            fontSize: "clamp(14px, 4vw, 32px)",
                            lineHeight: "2.2",
                            color: "#1a1a1a",
                            padding: "0 1px",
                          }}
                          dangerouslySetInnerHTML={
                            fontLoadedForPage
                              ? { __html: word.codeV2 }
                              : undefined
                          }
                        >
                          {!fontLoadedForPage ? word.textQpcHafs : undefined}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div
                className="h-2"
                style={{
                  background:
                    "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Audio player — fixed at bottom, always visible */}
      <AudioPlayer
        locale={locale}
        pageWords={pageData?.words ?? []}
        activeVerseKey={activeVerseKey}
        currentSurahId={currentSurahId}
        selectedReciter={selectedReciter}
        onOpenReciterPanel={() => setReciterPanelOpen(true)}
        onNextPage={() => goToPage(pageNumber + 1)}
        onPrevPage={() => goToPage(pageNumber - 1)}
        onVerseChange={setActiveVerseKey}
        cdnBase={CDN}
      />
      {/* hidden button so the Space-bar shortcut can trigger AudioPlayer's own toggle without prop drilling a ref */}
      <button id="quran-audio-toggle" className="hidden" aria-hidden />

      <SurahPanel
        isOpen={surahPanelOpen}
        onClose={() => setSurahPanelOpen(false)}
        onSelect={handleSelectSurah}
        locale={locale}
        currentSurahId={currentSurahId ?? undefined}
      />
      <ReciterPanel
        isOpen={reciterPanelOpen}
        onClose={() => setReciterPanelOpen(false)}
        onSelect={handleSelectReciter}
        locale={locale}
        selectedId={selectedReciter?.id}
      />

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
      `}</style>
    </div>
  );
}
