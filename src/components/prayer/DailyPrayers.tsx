"use client";

import { useEffect, useState } from "react";
import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Prayer,
  SunnahTimes,
} from "adhan";

const COORDS = new Coordinates(30.8708, 31.5588);
const PARAMS = CalculationMethod.Egyptian();

const PRAYERS = [
  { key: "fajr", labelAr: "الفجر", labelEn: "Fajr", icon: "🌙" },
  { key: "sunrise", labelAr: "الشروق", labelEn: "Sunrise", icon: "🌅" },
  { key: "dhuhr", labelAr: "الظهر", labelEn: "Dhuhr", icon: "☀️" },
  { key: "asr", labelAr: "العصر", labelEn: "Asr", icon: "🌤️" },
  { key: "maghrib", labelAr: "المغرب", labelEn: "Maghrib", icon: "🌇" },
  { key: "isha", labelAr: "العشاء", labelEn: "Isha", icon: "🌃" },
] as const;

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatGregorian(date: Date, locale: string) {
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatHijri(date: Date, locale: string) {
  try {
    return date.toLocaleDateString(
      locale === "ar"
        ? "ar-SA-u-ca-islamic-umalqura"
        : "en-US-u-ca-islamic-umalqura",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  } catch {
    return "";
  }
}

function getCountdown(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getNextPrayerTarget(): { name: string; target: Date } {
  const now = new Date();
  const pt = new PrayerTimes(COORDS, now, PARAMS);
  const next = pt.nextPrayer();
  if (next !== Prayer.None) {
    return {
      name: next,
      target: pt.timeForPrayer(next as (typeof Prayer)[keyof typeof Prayer])!,
    };
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    name: "fajr",
    target: new PrayerTimes(COORDS, tomorrow, PARAMS).fajr,
  };
}

export default function DailyPrayers({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const now = new Date();

  // Calculate everything synchronously on first render
  const pt = new PrayerTimes(COORDS, now, PARAMS);
  const sunnah = new SunnahTimes(pt);
  const initialNext = getNextPrayerTarget();

  const [times] = useState({
    fajr: formatTime(pt.fajr, locale),
    sunrise: formatTime(pt.sunrise, locale),
    dhuhr: formatTime(pt.dhuhr, locale),
    asr: formatTime(pt.asr, locale),
    maghrib: formatTime(pt.maghrib, locale),
    isha: formatTime(pt.isha, locale),
  });

  const [midnight] = useState(formatTime(sunnah.middleOfTheNight, locale));
  const [lastThird] = useState(formatTime(sunnah.lastThirdOfTheNight, locale));
  const [nextPrayer, setNextPrayer] = useState(initialNext.name);

  // Initialize countdown immediately — no waiting for useEffect
  const [countdown, setCountdown] = useState(() =>
    getCountdown(initialNext.target),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const { name, target } = getNextPrayerTarget();
      setNextPrayer(name);
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nextLabel = PRAYERS.find((p) => p.key === nextPrayer);

  return (
    <div className="space-y-6">
      {/* Dates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center space-y-1">
        <p className="font-arabic text-gray-800 font-medium">
          {formatGregorian(now, locale)}
        </p>
        <p className="font-arabic text-primary text-sm">
          {formatHijri(now, locale)}
        </p>
      </div>

      {/* Next prayer countdown */}
      <div
        className="rounded-2xl p-6 text-center text-white"
        style={{ background: "linear-gradient(135deg, #0D3D28, #1B6B4A)" }}
      >
        <p className="font-arabic text-white/60 text-sm mb-1">
          {isAr ? "الصلاة القادمة" : "Next Prayer"}
        </p>
        <p className="font-arabic text-3xl font-bold mb-2">
          {nextLabel ? (isAr ? nextLabel.labelAr : nextLabel.labelEn) : "—"}
        </p>
        <p className="font-mono text-4xl font-bold text-[#C9A84C] tracking-widest">
          {countdown}
        </p>
      </div>

      {/* Prayer cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PRAYERS.map(({ key, labelAr, labelEn, icon }) => {
          const isNext = key === nextPrayer;
          return (
            <div
              key={key}
              className={`rounded-2xl p-4 text-center border transition-all ${
                isNext
                  ? "bg-primary text-white border-primary shadow-lg scale-105"
                  : "bg-white border-gray-100 shadow-sm"
              }`}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p
                className={`font-arabic text-sm font-bold mb-2 ${isNext ? "text-white" : "text-gray-700"}`}
              >
                {isAr ? labelAr : labelEn}
              </p>
              <p
                className={`font-mono text-xl font-bold ${isNext ? "text-[#C9A84C]" : "text-primary"}`}
              >
                {times[key] || "—"}
              </p>
              {isNext && (
                <div className="mt-2 text-xs text-white/70 font-arabic">
                  {isAr ? "القادمة" : "Next"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sunnah times */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="font-arabic font-bold text-gray-700">
            {isAr ? "أوقات إضافية" : "Additional Times"}
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              labelAr: "منتصف الليل",
              labelEn: "Midnight",
              time: midnight,
              icon: "🌑",
            },
            {
              labelAr: "الثلث الأخير من الليل",
              labelEn: "Last Third of Night",
              time: lastThird,
              icon: "⭐",
            },
          ].map(({ labelAr, labelEn, time, icon }) => (
            <div
              key={labelAr}
              className="flex items-center justify-between px-5 py-4"
            >
              <span className="font-mono text-base text-primary font-bold">
                {time}
              </span>
              <div className="flex items-center gap-2 font-arabic text-sm text-gray-600">
                <span>{isAr ? labelAr : labelEn}</span>
                <span>{icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location note */}
      <p className="text-center text-xs text-gray-400 font-arabic">
        {isAr
          ? "الحسابات بناءً على إحداثيات بلبيس · الهيئة المصرية العامة للمساحة"
          : "Calculated for Belbeis coordinates · Egyptian General Authority of Survey"}
      </p>
    </div>
  );
}
