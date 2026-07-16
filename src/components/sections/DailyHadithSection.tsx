import { splitHadithNarration, stripDiacritics } from "@/lib/hadith";
import ShareButtons from "@/components/shared/ShareButtons";

interface Props {
  hadith: {
    arabic: string;
    number: number;
  };
  locale: string;
}

export default function DailyHadithSection({ hadith, locale }: Props) {
  const isAr = locale === "ar";
  const split = splitHadithNarration(hadith.arabic);

  const shareText = [
    stripDiacritics(hadith.arabic),
    isAr
      ? `الأربعون النووية - حديث رقم ${hadith.number}`
      : `40 Hadith Nawawi - Hadith #${hadith.number}`,
  ].join("\n\n");

  return (
    <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
      {/* Top accent */}
      <div
        className="h-1"
        style={{
          background: "linear-gradient(to right, #0D3D28, #C9A84C, #0D3D28)",
        }}
      />

      <div className="px-8 py-10 text-center relative z-10">
        <p className="font-arabic text-gray-400 text-sm mb-4">
          {isAr ? "قال رسول الله ﷺ" : "The Prophet ﷺ said"}
        </p>

        {/* Arabic hadith — narration chain in muted body text, the Prophet's
            actual words rendered as the manuscript-style focal point */}
        <div className="relative max-w-2xl mx-auto mb-6">
          {/* Decorative opening quote mark */}
          <span
            aria-hidden="true"
            className="absolute -top-3 -right-2 sm:-right-4 font-arabic text-4xl sm:text-5xl leading-none select-none pointer-events-none opacity-[0.12] text-primary dark:opacity-20"
          >
            ❝
          </span>

          <p
            dir="rtl"
            className="font-quran text-[20px] sm:text-[24px] md:text-[24px] leading-[1.7] sm:leading-[1.85] text-gray-600 dark:text-gray-300 [word-spacing:0.15em] px-3 sm:px-6"
          >
            {split ? (
              <>
                <span className="font-arabic text-[17px] sm:text-[19px] align-middle text-gray-400 dark:text-gray-500">
                  {split.chain}
                </span>
                <br />
                <span className="font-semibold bg-gradient-to-b from-primary to-primary-dark bg-clip-text text-transparent dark:from-[#C9A84C] dark:to-[#8f7530]">
                  {split.content}
                </span>
                {split.reference && (
                  <>
                    <br />
                    <span className="font-arabic text-base sm:text-lg align-middle text-gray-400 dark:text-gray-500 font-normal">
                      {split.reference}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="font-semibold bg-gradient-to-b from-primary to-primary-dark bg-clip-text text-transparent dark:from-[#C9A84C] dark:to-[#8f7530]">
                {hadith.arabic}
              </span>
            )}
          </p>

          {/* Decorative closing quote mark */}
          <span
            aria-hidden="true"
            className="absolute -bottom-6 -left-2 sm:-left-4 font-arabic text-4xl sm:text-5xl leading-none select-none pointer-events-none opacity-[0.12] text-primary dark:opacity-20 rotate-180"
          >
            ❝
          </span>
        </div>

        {/* Reference badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 border mb-5"
          style={{
            background: "rgba(27,107,74,0.05)",
            borderColor: "rgba(27,107,74,0.2)",
          }}
        >
          <span
            className="font-arabic text-sm font-medium"
            style={{ color: "#1B6B4A" }}
          >
            {isAr ? "الأربعون النووية" : "40 Hadith Nawawi"}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 text-sm font-arabic">
            {isAr ? `حديث رقم ${hadith.number}` : `Hadith #${hadith.number}`}
          </span>
        </div>

        <div>
          <ShareButtons text={shareText} locale={locale} variant="light" />
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className="h-1"
        style={{
          background: "linear-gradient(to right, #0D3D28, #C9A84C, #0D3D28)",
        }}
      />
    </div>
  );
}
