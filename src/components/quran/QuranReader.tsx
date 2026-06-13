"use client";

import { useState } from "react";
import type { Verse } from "@/lib/quran-reader";

interface Props {
  verses: Verse[];
  surahId: number;
  locale: string;
}

export default function QuranReader({ verses, surahId, locale }: Props) {
  const isAr = locale === "ar";
  const [showTranslation, setShowTranslation] = useState(false);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playVerse = (verseNumber: number) => {
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    if (playingVerse === verseNumber) {
      setPlayingVerse(null);
      return;
    }
    // Mishary Rashid Al-Afasy recitation
    const paddedSurah = String(surahId).padStart(3, "0");
    const paddedVerse = String(verseNumber).padStart(3, "0");
    const url = `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedVerse}.mp3`;
    const newAudio = new Audio(url);
    newAudio.play();
    newAudio.onended = () => setPlayingVerse(null);
    setAudio(newAudio);
    setPlayingVerse(verseNumber);
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`font-arabic text-sm px-4 py-2 rounded-full border transition-all ${
            showTranslation
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
          }`}
        >
          {isAr ? "عرض الترجمة" : "Show Translation"}
        </button>

        <p className="text-sm text-gray-400 font-arabic">
          {isAr ? "المصحف الشريف · حفص عن عاصم" : "Hafs 'an Asim"}
        </p>
      </div>

      {/* Verses */}
      <div className="space-y-1">
        {verses.map((verse) => (
          <div
            key={verse.id}
            className={`group relative rounded-2xl px-6 py-5 transition-all ${
              playingVerse === verse.verseNumber
                ? "bg-primary/5 border border-primary/20"
                : "bg-white border border-gray-100 hover:border-primary/20"
            }`}
          >
            {/* Verse text */}
            <p
              className="font-quran text-2xl leading-loose text-gray-800 text-right mb-3"
              dir="rtl"
            >
              {verse.textUthmani}
              {/* Verse number in Arabic */}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-arabic mx-2">
                {verse.verseNumber}
              </span>
            </p>

            {/* Translation */}
            {showTranslation && verse.translations[0] && (
              <p
                className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-3 mt-3"
                dir="ltr"
              >
                {verse.translations[0].text.replace(/<[^>]*>/g, "")}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => playVerse(verse.verseNumber)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all font-arabic ${
                  playingVerse === verse.verseNumber
                    ? "bg-primary text-white border-primary"
                    : "text-gray-400 border-gray-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {playingVerse === verse.verseNumber ? "⏸ إيقاف" : "▶ استمع"}
              </button>

              <span className="text-xs text-gray-300 font-arabic">
                {surahId}:{verse.verseNumber}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
