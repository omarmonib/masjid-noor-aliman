interface Props {
  hadith: { hadithNumber: number; collection: string; textAr: string };
  locale: string;
  collectionNameAr: string;
  collectionNameEn: string;
  highlighted?: boolean;
}

export default function HadithCard({
  hadith,
  locale,
  collectionNameAr,
  collectionNameEn,
  highlighted,
}: Props) {
  const isAr = locale === "ar";
  if (!hadith.textAr) return null;

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
        highlighted
          ? "border-[#C9A84C] shadow-[0_0_0_3px_rgba(201,168,76,0.2)]"
          : "border-gray-100 bg-white"
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 py-3 border-b ${
          highlighted
            ? "bg-[#C9A84C]/10 border-[#C9A84C]/20"
            : "bg-primary/5 border-primary/10"
        }`}
      >
        <span className="font-arabic text-xs text-gray-500">
          {isAr ? collectionNameAr : collectionNameEn}
        </span>
        <span
          className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center font-arabic ${
            highlighted ? "bg-[#C9A84C]" : "bg-primary"
          }`}
        >
          {hadith.hadithNumber}
        </span>
      </div>
      <div className={`px-5 py-5 ${highlighted ? "bg-amber-50" : "bg-white"}`}>
        <p
          className="font-arabic text-xl leading-loose text-gray-800 text-right"
          dir="rtl"
        >
          {hadith.textAr}
        </p>
      </div>
    </div>
  );
}
