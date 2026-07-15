import { splitHadithNarration } from "@/lib/hadith";

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
  

  return (
    <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
      {/* Top accent */}
      <div
        className="h-1"
        style={{
          background: "linear-gradient(to right, #0D3D28, #C9A84C, #0D3D28)",
        }}
      />

      {/* Decorative quote mark */}
      <div
        className="absolute top-4 right-8 font-arabic text-8xl leading-none select-none pointer-events-none opacity-5"
        style={{ color: "#1B6B4A" }}
      >
        ❝
      </div>

      <div className="px-8 py-10 text-center relative z-10">
        <p className="font-arabic text-gray-400 text-sm mb-4">
          {isAr ? "قال رسول الله ﷺ" : "The Prophet ﷺ said"}
        </p>

        {/* Arabic hadith — narration chain in normal color, the Prophet's
            actual words in the accent (primary) color when detectable */}
        <p
          className="font-arabic text-xl leading-loose text-gray-500 mb-6"
          dir="rtl"
        >
          {split ? (
            <>
              <span>{split.chain}</span>

              <span className="text-primary font-bold">{split.content}</span>

              {split.reference && (
                <span className="text-gray-500 font-normal">
                  {" "}
                  {split.reference}
                </span>
              )}
            </>
          ) : (
            hadith.arabic
          )}
        </p>

        {/* Reference badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 border"
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
