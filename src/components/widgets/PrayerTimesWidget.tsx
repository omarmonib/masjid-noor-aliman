"use client";

import { useEffect, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes, Prayer } from "adhan";
import Link from "next/link";

const COORDS = new Coordinates(30.8708, 31.5588);
const PARAMS = CalculationMethod.Egyptian();

const PRAYERS = [
  { key: "fajr", labelAr: "الفجر", labelEn: "Fajr", icon: "🌙" },
  { key: "sunrise", labelAr: "الشروق", labelEn: "Sunrise", icon: "🌅" },
  { key: "dhuhr", labelAr: "الظهر", labelEn: "Dhuhr", icon: "☀️" },
  { key: "asr", labelAr: "العصر", labelEn: "Asr", icon: "🌤" },
  { key: "maghrib", labelAr: "المغرب", labelEn: "Maghrib", icon: "🌇" },
  { key: "isha", labelAr: "العشاء", labelEn: "Isha", icon: "🌃" },
] as const;

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicDigits(s: string) {
  return s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

// Manual 12-hour formatter — avoids toLocaleTimeString/Intl entirely so the
// output is byte-identical on server and client regardless of ICU version.
function fmt(date: Date, locale: string) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isAr = locale === "ar";

  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;

  const hh = String(h12).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const period = hours >= 12 ? (isAr ? "م" : "PM") : isAr ? "ص" : "AM";

  const digits = isAr ? toArabicDigits(`${hh}:${mm}`) : `${hh}:${mm}`;
  return `${digits} ${period}`;
}

function getNextInfo() {
  const now = new Date();
  const pt = new PrayerTimes(COORDS, now, PARAMS);
  const next = pt.nextPrayer();
  const name = next !== Prayer.None ? next : "fajr";
  let target: Date;
  if (next !== Prayer.None) {
    target = pt.timeForPrayer(next as (typeof Prayer)[keyof typeof Prayer])!;
  } else {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    target = new PrayerTimes(COORDS, tom, PARAMS).fajr;
  }
  const diff = target.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    name,
    countdown: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
}

interface Props {
  locale: string;
  compact?: boolean;
}

export function PrayerTimesWidget({ locale, compact = false }: Props) {
  const isAr = locale === "ar";
  const now = new Date();
  const pt = new PrayerTimes(COORDS, now, PARAMS);

  // Static for the day — safe to compute during the shared render, since
  // it only depends on the calendar date, not the current second.
  const [times] = useState({
    fajr: fmt(pt.fajr, locale),
    sunrise: fmt(pt.sunrise, locale),
    dhuhr: fmt(pt.dhuhr, locale),
    asr: fmt(pt.asr, locale),
    maghrib: fmt(pt.maghrib, locale),
    isha: fmt(pt.isha, locale),
  });

  // "Next prayer" and the countdown depend on the exact current second, so
  // computing them during the initial render risks a different result on
  // the server (render time) vs. the client (hydration time) — a real
  // hydration mismatch, not a formatting quirk. Start both null on every
  // render (server AND client's first pass), then fill them in only after
  // mount, so the first paint is always identical on both sides.
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const { name, countdown } = getNextInfo();
      setNextPrayer(name);
      setCountdown(countdown);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const nextLabel = PRAYERS.find((p) => p.key === nextPrayer);

  if (compact) {
    return (
      <div className="text-white">
        {/* Next prayer */}
        <div className="mb-4">
          <p className="font-arabic text-white/60 text-xs mb-0.5">
            {isAr ? "الصلاة القادمة" : "Next Prayer"}
          </p>
          <div className="flex items-center justify-between">
            <p className="font-arabic text-lg font-bold">
              {nextLabel ? (isAr ? nextLabel.labelAr : nextLabel.labelEn) : "—"}
            </p>
            <p className="font-mono text-xl font-bold text-[#C9A84C]">
              {countdown ?? "--:--:--"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 mb-3" />

        {/* All prayers */}
        <div className="space-y-2">
          {PRAYERS.map(({ key, labelAr, labelEn }) => {
            const isNext = key === nextPrayer;
            return (
              <div
                key={key}
                className={`flex items-center justify-between py-1 px-2 rounded-lg transition-all ${
                  isNext ? "bg-white/15" : ""
                }`}
              >
                <span
                  className={`font-mono text-sm ${isNext ? "text-[#C9A84C] font-bold" : "text-white/70"}`}
                >
                  {times[key as keyof typeof times]}
                </span>
                <span
                  className={`font-arabic text-sm ${isNext ? "text-white font-bold" : "text-white/70"}`}
                >
                  {isAr ? labelAr : labelEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* Link */}
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <Link
            href={`/${locale}/prayer-times`}
            className="font-arabic text-xs text-[#C9A84C] hover:text-white transition-colors"
          >
            {isAr ? "الجدول الشهري ←" : "Monthly Schedule ←"}
          </Link>
        </div>

        {/* Location */}
        <p className="font-arabic text-white/30 text-xs text-center mt-2">
          {isAr ? "بلبيس — الشرقية" : "Belbeis — Al-Sharqia"}
        </p>
      </div>
    );
  }

  // Full widget (for non-hero use)
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="flex-shrink-0 text-center bg-primary/5 rounded-2xl px-6 py-4 border border-primary/10">
        <p className="font-arabic text-xs text-gray-500 mb-1">
          {isAr ? "الصلاة القادمة" : "Next Prayer"}
        </p>
        <p className="font-arabic text-lg font-bold text-primary mb-1">
          {nextLabel ? (isAr ? nextLabel.labelAr : nextLabel.labelEn) : "—"}
        </p>
        <p className="font-mono text-2xl font-bold text-[#C9A84C] tracking-wider">
          {countdown ?? "--:--:--"}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-2 w-full">
        {PRAYERS.map(({ key, labelAr, labelEn, icon }) => {
          const isNext = key === nextPrayer;
          return (
            <div
              key={key}
              className={`text-center rounded-xl py-3 px-2 transition-all ${
                isNext
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              <div className="text-lg mb-1">{icon}</div>
              <p
                className={`font-arabic text-xs font-bold mb-1 ${isNext ? "text-white" : "text-gray-600"}`}
              >
                {isAr ? labelAr : labelEn}
              </p>
              <p
                className={`font-mono text-xs font-bold ${isNext ? "text-[#C9A84C]" : "text-primary"}`}
              >
                {times[key as keyof typeof times]}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href={`/${locale}/prayer-times`}
        className="flex-shrink-0 font-arabic text-sm text-primary hover:underline whitespace-nowrap"
      >
        {isAr ? "الجدول الكامل ←" : "Full Schedule ←"}
      </Link>
    </div>
  );
}
