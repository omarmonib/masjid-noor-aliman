"use client";

import { useState, useEffect, useRef } from "react";

interface Word {
  id: number;
  position: number;
  codeV2: string;
  textQpcHafs: string;
  pageNumber: number;
  lineNumber: number;
  charTypeName: string;
  verseKey: string;
  audioUrl?: string;
}

interface Props {
  locale: string;
}

const SURAHS = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس",
];

const CDN = "https://verses.quran.foundation";
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

export default function MushafViewer({ locale }: Props) {
  const [surah, setSurah] = useState(1);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false);
  const [playingWord, setPlayingWord] = useState<number | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    setLoading(true);
    setFontsReady(false);
    setWords([]);
    setCurrentPageNum(null);

    fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}?words=true&word_fields=text_qpc_hafs,code_v2,line_number,page_number&per_page=300&mushaf=1`,
    )
      .then((r) => r.json())
      .then(async (json) => {
        const allWords: Word[] = [];
     json.verses?.forEach(
       (verse: {
         verse_key: string;
         words: {
           id: number;
           position: number;
           code_v2: string;
           text_qpc_hafs: string;
           text: string;
           page_number: number;
           line_number: number;
           char_type_name: string;
           audio_url?: string;
         }[];
       }) => {
         verse.words?.forEach((w) => {
           allWords.push({
             id: w.id,
             position: w.position,
             codeV2: w.code_v2 || "",
             textQpcHafs: w.text_qpc_hafs || w.text || "",
             pageNumber: w.page_number || 1,
             lineNumber: w.line_number || 1,
             charTypeName: w.char_type_name || "word",
             verseKey: verse.verse_key,
             audioUrl: w.audio_url,
           });
         });
       },
     );

        setWords(allWords);

        // Set to first page of this surah
        const firstPage = Math.min(...allWords.map((w) => w.pageNumber));
        setCurrentPageNum(firstPage);

        // Load fonts for all pages in this surah
        const pages = new Set(allWords.map((w) => w.pageNumber));
        await Promise.all(Array.from(pages).map(loadPageFont));
        setFontsReady(true);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [surah]);

  // Group words by page then line
  const pageMap = words.reduce(
    (acc, word) => {
      const page = word.pageNumber;
      if (!acc[page]) acc[page] = {};
      const lineKey = `${page}-${word.lineNumber}`;
      if (!acc[page][lineKey]) acc[page][lineKey] = [];
      acc[page][lineKey].push(word);
      return acc;
    },
    {} as Record<number, Record<string, Word[]>>,
  );

  const pageNumbers = Object.keys(pageMap)
    .map(Number)
    .sort((a, b) => a - b);
  const activePage = currentPageNum ?? pageNumbers[0];
  const currentPageIndex = pageNumbers.indexOf(activePage);

  // Get sorted lines for active page
  const activePageLines =
    activePage && pageMap[activePage]
      ? Object.entries(pageMap[activePage])
          .sort(([a], [b]) => {
            const aLine = parseInt(a.split("-")[1]);
            const bLine = parseInt(b.split("-")[1]);
            return aLine - bLine;
          })
          .map(([key, lineWords]) => ({ key, words: lineWords }))
      : [];

  const playWord = (word: Word) => {
    if (!word.audioUrl) return;
    if (audioRef.current) audioRef.current.pause();
    if (playingWord === word.id) {
      setPlayingWord(null);
      return;
    }
    const audio = new Audio(`${CDN}/${word.audioUrl}`);
    audio.play();
    audio.onended = () => setPlayingWord(null);
    audioRef.current = audio;
    setPlayingWord(word.id);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Toolbar */}
      <div className="sticky top-16 z-40 bg-[#111] border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Surah selector */}
          <div className="relative">
            <button
              onClick={() => setShowSurahList(!showSurahList)}
              className="bg-white/10 hover:bg-white/20 text-white font-arabic px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <span>{SURAHS[surah - 1]}</span>
              <span className="text-white/40 text-xs">▼</span>
            </button>
            {showSurahList && (
              <div className="absolute top-full mt-1 right-0 w-60 bg-[#222] border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                {SURAHS.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSurah(i + 1);
                      setShowSurahList(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-right transition-colors ${surah === i + 1 ? "bg-primary/30" : ""}`}
                  >
                    <span className="text-white/40 text-xs w-6 text-left">
                      {i + 1}
                    </span>
                    <span className="font-arabic text-white text-sm">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prev / Next surah */}
          <div className="flex gap-2">
            <button
              onClick={() => setSurah((s) => Math.max(1, s - 1))}
              disabled={surah === 1}
              className="px-3 py-1.5 text-white/60 hover:text-white disabled:opacity-30 text-sm font-arabic"
            >
              › {isAr ? "السابقة" : "Prev"}
            </button>
            <button
              onClick={() => setSurah((s) => Math.min(114, s + 1))}
              disabled={surah === 114}
              className="px-3 py-1.5 text-white/60 hover:text-white disabled:opacity-30 text-sm font-arabic"
            >
              {isAr ? "التالية" : "Next"} ‹
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-4" />
              <p className="font-arabic text-white/40">
                {isAr ? "جارٍ تحميل المصحف..." : "Loading Quran..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Page navigation top */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const prev = pageNumbers[currentPageIndex - 1];
                  if (prev) setCurrentPageNum(prev);
                }}
                disabled={currentPageIndex <= 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-arabic rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "‹ الصفحة التالية" : "‹ Next"}
              </button>

              <span className="text-white/50 font-arabic text-sm">
                {isAr ? `صفحة ${activePage}` : `Page ${activePage}`}
              </span>

              <button
                onClick={() => {
                  const next = pageNumbers[currentPageIndex + 1];
                  if (next) setCurrentPageNum(next);
                }}
                disabled={currentPageIndex >= pageNumbers.length - 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-arabic rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "الصفحة السابقة ›" : "Prev ›"}
              </button>
            </div>

            {/* Mushaf page */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #fdf8f0 0%, #faf4e8 100%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Top bar */}
              <div
                className="h-2"
                style={{
                  background:
                    "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                }}
              />

              {/* Page number */}
              <div className="text-center pt-3 pb-1">
                <span className="text-xs text-gray-400 font-arabic">
                  {isAr ? `صفحة ${activePage}` : `Page ${activePage}`}
                </span>
              </div>

              {/* Surah header on first page */}
              {currentPageIndex === 0 && (
                <div className="text-center py-4 px-8">
                  <div
                    className="inline-block px-8 py-2 rounded-full border"
                    style={{
                      borderColor: "#C9A84C",
                      background: "rgba(201,168,76,0.08)",
                    }}
                  >
                    <p
                      className="font-arabic text-xl font-bold"
                      style={{ color: "#1B6B4A" }}
                    >
                      سورة {SURAHS[surah - 1]}
                    </p>
                  </div>
                </div>
              )}

              {/* Bismillah on first page */}
              {currentPageIndex === 0 && surah !== 1 && surah !== 9 && (
                <div className="text-center pb-4">
                  <p
                    style={{
                      fontFamily: "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                      fontSize: "28px",
                      color: "#1a1a1a",
                    }}
                  >
                    بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                  </p>
                </div>
              )}

              {/* Lines */}
              <div className="px-8 pb-6" dir="rtl">
                {activePageLines.map(({ key, words: lineWords }) => (
                  <div
                    key={key}
                    className="flex justify-center items-baseline flex-wrap"
                    style={{ minHeight: "48px", marginBottom: "4px" }}
                  >
                    {lineWords.map((word) => {
                      const isEnd = word.charTypeName === "end";
                      const fontLoaded =
                        fontsReady && loadedFonts.has(`p${word.pageNumber}-v2`);

                      if (isEnd) {
                        return (
                          <span
                            key={word.id}
                            style={{
                              fontFamily:
                                "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                              fontSize: "28px",
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
                          onClick={() => playWord(word)}
                          title={word.verseKey}
                          className="cursor-pointer hover:bg-primary/10 rounded transition-colors"
                          style={{
                            fontFamily: fontLoaded
                              ? `p${word.pageNumber}-v2`
                              : "'UthmanicHafs1Ver18', 'Amiri Quran', serif",
                            fontSize: "32px",
                            lineHeight: "2.2",
                            color:
                              playingWord === word.id ? "#1B6B4A" : "#1a1a1a",
                            padding: "0 1px",
                          }}
                          dangerouslySetInnerHTML={
                            fontLoaded ? { __html: word.codeV2 } : undefined
                          }
                        >
                          {!fontLoaded ? word.textQpcHafs : undefined}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div
                className="h-2"
                style={{
                  background:
                    "linear-gradient(to right, #C9A84C, #1B6B4A, #C9A84C)",
                }}
              />
            </div>

            {/* Bottom navigation */}
            <div className="flex justify-between mt-4 gap-4">
              <button
                onClick={() => {
                  const prev = pageNumbers[currentPageIndex - 1];
                  if (prev) setCurrentPageNum(prev);
                }}
                disabled={currentPageIndex <= 0}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-arabic py-3 rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "‹ الصفحة التالية" : "‹ Next Page"}
              </button>
              <button
                onClick={() => {
                  const next = pageNumbers[currentPageIndex + 1];
                  if (next) setCurrentPageNum(next);
                }}
                disabled={currentPageIndex >= pageNumbers.length - 1}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-arabic py-3 rounded-xl disabled:opacity-30 transition-colors text-sm"
              >
                {isAr ? "الصفحة السابقة ›" : "Prev Page ›"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preload UthmanicHafs font */}
      <style>{`
        @font-face {
          font-family: 'UthmanicHafs1Ver18';
          src: url('${CDN}/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2') format('woff2');
          font-display: swap;
        }
      `}</style>
    </div>
  );
}
