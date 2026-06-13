"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Dhikr } from "@/lib/adhkar";

interface Props {
  dhikr: Dhikr;
  locale: string;
}

export default function DhikrCard({ dhikr, locale }: Props) {
  const isAr = locale === "ar";
  const [count, setCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const isDone = count >= dhikr.repeat;

  const handleTap = () => {
    if (isDone) return;
    setCount((c) => c + 1);
  };

  const handleReset = () => setCount(0);

  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-300",
        isDone ? "border-primary/40 bg-primary/5" : "border-gray-200 bg-white",
      )}
    >
      {isDone && (
        <div className="bg-primary text-white text-center py-1.5 text-sm font-arabic">
          ✓ {isAr ? "تم بحمد الله" : "Completed"}
        </div>
      )}

      <div className="p-5">
        <p
          className="font-arabic text-xl leading-loose text-gray-800 text-right mb-4"
          dir="rtl"
        >
          {dhikr.textAr}
        </p>

        {(dhikr.bless || dhikr.source) && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-primary/60 hover:text-primary transition-colors mb-3 font-arabic"
            >
              {showDetails
                ? isAr
                  ? "إخفاء التفاصيل"
                  : "Hide details"
                : isAr
                  ? "فضل الذكر والمصدر"
                  : "Show virtue & source"}
            </button>

            {showDetails && (
              <div className="mb-4 space-y-2">
                {dhikr.bless && (
                  <p
                    className="text-gray-600 text-sm leading-relaxed font-arabic text-right border-r-2 border-gold/40 pr-3"
                    dir="rtl"
                  >
                    {dhikr.bless}
                  </p>
                )}
                {dhikr.source && (
                  <p className="text-xs text-gray-400 font-arabic text-right">
                    رواه {dhikr.source}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Counter */}
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1 font-arabic">
              <span>
                {count} / {dhikr.repeat}
              </span>
              {count > 0 && (
                <button
                  onClick={handleReset}
                  className="text-red-400 hover:text-red-500 transition-colors"
                >
                  {isAr ? "إعادة" : "Reset"}
                </button>
              )}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((count / dhikr.repeat) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <button
            onClick={handleTap}
            disabled={isDone}
            className={cn(
              "w-14 h-14 rounded-full font-arabic text-sm font-bold transition-all duration-150 active:scale-95 shadow-md flex-shrink-0",
              isDone
                ? "bg-primary/20 text-primary/40 cursor-default"
                : "bg-primary text-white hover:bg-primary/90",
            )}
          >
            {isDone
              ? "✓"
              : dhikr.repeat === 1
                ? "اذكر"
                : count === 0
                  ? dhikr.repeat
                  : dhikr.repeat - count}
          </button>
        </div>
      </div>
    </div>
  );
}
