// src/components/home/HomeContent.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Mic2, type LucideIcon } from "lucide-react";
import { useIsNative } from "@/hooks/useIsNative";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";
import DailyVerseSection from "@/components/sections/DailyVerseSection";
import DailyHadithSection from "@/components/sections/DailyHadithSection";
import { MobilePage } from "@/components/mobile/MobileUI";

/**
 * Native-only Home screen composition. On web this component isn't used
 * at all — src/app/[locale]/page.tsx keeps rendering its existing
 * Hero + services grid + full DailyVerseSection/DailyHadithSection
 * exactly as before, completely untouched.
 *
 * On native, this replaces that whole layout with:
 *   compact PrayerTimesWidget → Ayah-of-the-Day preview card → Hadith-
 *   of-the-Day preview card. Tapping a preview card expands it in place
 *   to reveal the existing DailyVerseSection/DailyHadithSection content
 *   — the exact same components used on web, not reimplemented here.
 *   The verse expand passes hideTranslation so the native Ayah card
 *   shows Arabic only (per spec); the web version of DailyVerseSection
 *   is unaffected since it never passes this prop and the default is
 *   false. Both cards can be expanded independently; expanding one does
 *   not close the other.
 *
 * The PrayerTimesWidget's `compact` variant renders white text (it was
 * built for Hero.tsx's usage, where it always sits inside a translucent
 * dark box on top of the big green hero gradient). This native screen has
 * no such background of its own — it's the plain light `bg-surface` —
 * so the widget must be wrapped in an opaque dark card here, or the white
 * text is invisible against the light background (this was the actual
 * bug: the text was always there, just white-on-white).
 */

interface Props {
  locale: string;
  verse: {
    arabic: string;
    english: string;
    surah: string;
    surahEn: string;
    ayah: number;
  };
  hadith: {
    arabic: string;
    number: number;
  };
}

function PreviewCard({
  icon: Icon,
  label,
  preview,
  isOpen,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  label: string;
  preview: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full flex items-center gap-3 p-4 text-right"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={19} />
        </div>
        <div className="flex-1 min-w-0" dir="rtl">
          <p className="font-arabic text-sm font-bold text-gray-800">{label}</p>
          <p className="font-arabic text-xs text-gray-400 truncate mt-0.5">
            {preview}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={18} className="text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomeContent({ locale, verse, hadith }: Props) {
  const { isNative, isResolved } = useIsNative();
  const isAr = locale === "ar";
  const [verseOpen, setVerseOpen] = useState(false);
  const [hadithOpen, setHadithOpen] = useState(false);

  // While platform detection resolves, render nothing to avoid a flash
  // of the wrong layout — same pattern used by AppChrome/PageHeroHeader.
  if (!isResolved) return null;

  // Web keeps using the existing page.tsx layout entirely — this
  // component is only ever mounted in the native branch, but this guard
  // makes that explicit and safe if it's ever reused elsewhere by mistake.
  if (!isNative) return null;

  return (
    <MobilePage>
      <div
        className="mb-5 rounded-2xl p-5 shadow-sm"
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
      >
        <PrayerTimesWidget locale={locale} compact />
      </div>

      <PreviewCard
        icon={BookOpen}
        label={isAr ? "آية اليوم" : "Verse of the Day"}
        preview={verse.arabic}
        isOpen={verseOpen}
        onToggle={() => setVerseOpen((v) => !v)}
      >
        <DailyVerseSection verse={verse} locale={locale} hideTranslation />
      </PreviewCard>

      <PreviewCard
        icon={Mic2}
        label={isAr ? "حديث اليوم" : "Hadith of the Day"}
        preview={hadith.arabic}
        isOpen={hadithOpen}
        onToggle={() => setHadithOpen((h) => !h)}
      >
        <DailyHadithSection hadith={hadith} locale={locale} />
      </PreviewCard>
    </MobilePage>
  );
}
