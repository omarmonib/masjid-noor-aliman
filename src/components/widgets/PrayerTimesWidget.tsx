"use client";

import { useEffect, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes, Prayer } from "adhan";

const PRAYERS = [
  { key: "fajr", labelAr: "الفجر", labelEn: "Fajr" },
  { key: "sunrise", labelAr: "الشروق", labelEn: "Sunrise" },
  { key: "dhuhr", labelAr: "الظهر", labelEn: "Dhuhr" },
  { key: "asr", labelAr: "العصر", labelEn: "Asr" },
  { key: "maghrib", labelAr: "المغرب", labelEn: "Maghrib" },
  { key: "isha", labelAr: "العشاء", labelEn: "Isha" },
] as const;

const COORDS = new Coordinates(30.8708, 31.5588);
const PARAMS = CalculationMethod.Egyptian();

function formatTime(date: Date) {
  return date.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PrayerTimesWidget({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [times, setTimes] = useState<Record<string, string>>({});
  const [nextPrayer, setNextPrayer] = useState<string>("");
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const pt = new PrayerTimes(COORDS, now, PARAMS);
    setTimes({
      fajr: formatTime(pt.fajr),
      sunrise: formatTime(pt.sunrise),
      dhuhr: formatTime(pt.dhuhr),
      asr: formatTime(pt.asr),
      maghrib: formatTime(pt.maghrib),
      isha: formatTime(pt.isha),
    });

    const next = pt.nextPrayer();
    if (next !== Prayer.None) {
      setNextPrayer(next);
    } else {
      setNextPrayer("fajr");
    }
  }, []);

  useEffect(() => {
    if (!nextPrayer) return;

    const getTargetTime = (): Date => {
      const now = new Date();
      const pt = new PrayerTimes(COORDS, now, PARAMS);
      const next = pt.nextPrayer();

      if (next !== Prayer.None) {
        return pt.timeForPrayer(next as (typeof Prayer)[keyof typeof Prayer])!;
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ptTomorrow = new PrayerTimes(COORDS, tomorrow, PARAMS);
        return ptTomorrow.fajr;
      }
    };

    const tick = () => {
      const now = new Date();
      const target = getTargetTime();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const nextLabel = PRAYERS.find((p) => p.key === nextPrayer);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#C9A84C]/20 overflow-hidden">
      <div className="bg-[#1B6B4A] px-6 py-4 text-white text-center">
        <p className="text-sm text-white/70 mb-1">
          {isAr ? "الصلاة القادمة" : "Next Prayer"}
        </p>
        <p className="text-2xl font-arabic font-bold">
          {nextLabel ? (isAr ? nextLabel.labelAr : nextLabel.labelEn) : "—"}
        </p>
        <p className="text-3xl font-mono font-bold tracking-widest mt-1 text-[#C9A84C]">
          {countdown || "00:00:00"}
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {PRAYERS.map(({ key, labelAr, labelEn }) => {
          const isNext = key === nextPrayer;
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-6 py-3 ${
                isNext
                  ? "bg-[#1B6B4A]/5 font-semibold text-[#1B6B4A]"
                  : "text-gray-700"
              }`}
            >
              <span className="font-arabic text-sm">
                {isAr ? labelAr : labelEn}
              </span>
              <span className="font-mono text-sm">{times[key] || "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 text-center text-xs text-gray-400 font-arabic">
        {isAr ? "بلبيس — الشرقية" : "Belbeis — Al-Sharqia"}
      </div>
    </div>
  );
}
