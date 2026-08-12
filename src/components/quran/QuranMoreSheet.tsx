"use client";

import type { ReactNode } from "react";
import {
  Bookmark,
  BookmarkCheck,
  PenLine,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onFitScreen: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  readingSaved: boolean;
  onSaveReadingBookmark: () => void;
  onContinueReading: () => void;
  onOpenMemoDialog: () => void;
}

/**
 * Native/mobile "More" sheet — houses every secondary Quran reader control
 * that used to live permanently in the desktop toolbar (reading bookmark,
 * continue reading, memorization bookmark, zoom, fit width/height/screen,
 * fullscreen). Nothing here was removed from the app — every action still
 * calls the exact same handler MushafViewer already had (fitWidth/
 * fitHeight/fitScreen/toggleFullscreen/etc are untouched); this component
 * only relocates the buttons out of the cramped mobile toolbar.
 *
 * Reading Focus Mode is NOT here — it has its own dedicated icon in the
 * main native toolbar (a primary action, not secondary), so it isn't
 * duplicated inside this sheet.
 *
 * Web/desktop never renders this — MushafViewer keeps its original full
 * toolbar there, unchanged.
 */
export default function QuranMoreSheet({
  isOpen,
  onClose,
  locale,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitHeight,
  onFitScreen,
  isFullscreen,
  onToggleFullscreen,
  readingSaved,
  onSaveReadingBookmark,
  onContinueReading,
  onOpenMemoDialog,
}: Props) {
  const isAr = locale === "ar";

  if (!isOpen) return null;

  const Row = ({
    icon,
    label,
    onClick,
  }: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-white/5 transition-colors"
      dir={isAr ? "rtl" : "ltr"}
    >
      <span className="text-white/70 flex-shrink-0">{icon}</span>
      <span className="flex-1 font-arabic text-sm text-white/90">{label}</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#161616] rounded-t-2xl border-t border-white/10 max-h-[75vh] overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-arabic text-white text-base font-bold">
            {isAr ? "المزيد من الخيارات" : "More Options"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="py-1 divide-y divide-white/5">
          <Row
            icon={
              readingSaved ? (
                <BookmarkCheck size={17} className="text-[#C9A84C]" />
              ) : (
                <Bookmark size={17} />
              )
            }
            label={isAr ? "حفظ علامة القراءة" : "Save Reading Bookmark"}
            onClick={onSaveReadingBookmark}
          />
          <Row
            icon={<Bookmark size={17} />}
            label={isAr ? "متابعة القراءة" : "Continue Reading"}
            onClick={onContinueReading}
          />
          <Row
            icon={<PenLine size={17} />}
            label={isAr ? "علامة الحفظ" : "Memorization Bookmark"}
            onClick={onOpenMemoDialog}
          />
        </div>

        <div className="px-4 pt-3 pb-1 border-t border-white/10">
          <p className="font-arabic text-white/40 text-xs mb-2">
            {isAr ? "التكبير" : "Zoom"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onZoomOut}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ZoomOut size={16} />
            </button>
            <span className="flex-1 text-center font-mono text-white/70 text-sm">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 pb-3 flex items-center gap-2">
          <button
            onClick={onFitWidth}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-arabic"
          >
            {isAr ? "ملائمة العرض" : "Fit Width"}
          </button>
          <button
            onClick={onFitHeight}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-arabic"
          >
            {isAr ? "ملائمة الارتفاع" : "Fit Height"}
          </button>
          <button
            onClick={onFitScreen}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-arabic"
          >
            {isAr ? "ملائمة الشاشة" : "Fit Screen"}
          </button>
        </div>

        <div className="py-1 border-t border-white/10">
          <Row
            icon={
              isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />
            }
            label={isAr ? "ملء الشاشة" : "Fullscreen"}
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
}
