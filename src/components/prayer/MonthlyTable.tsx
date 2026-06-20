"use client";

import { useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const COORDS = new Coordinates(30.8708, 31.5588);
const PARAMS = CalculationMethod.Egyptian();

function fmt(date: Date) {
  return date.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hijriDay(date: Date): string {
  try {
    return date.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function MonthlyTable({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const rows = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const pt = new PrayerTimes(COORDS, date, PARAMS);
    return {
      day: i + 1,
      hijri: hijriDay(date),
      date,
      fajr: fmt(pt.fajr),
      sunrise: fmt(pt.sunrise),
      dhuhr: fmt(pt.dhuhr),
      asr: fmt(pt.asr),
      maghrib: fmt(pt.maghrib),
      isha: fmt(pt.isha),
    };
  });

  const monthNames = isAr
    ? [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ]
    : [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

  const goMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setMonth(m);
    setYear(y);
  };

  const headers = isAr
    ? ["م", "هجري", "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"]
    : ["#", "Hijri", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

  return (
    <div>
      {/* Month selector */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <button
          onClick={() => goMonth(-1)}
          className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
        >
          {isAr ? "‹" : "›"}
        </button>
        <div className="text-center">
          <p className="font-arabic text-xl font-bold text-gray-800">
            {monthNames[month]} {year}
          </p>
          <p className="text-xs text-gray-400 font-arabic mt-1">
            {isAr ? "بلبيس — مصر" : "Belbeis — Egypt"}
          </p>
        </div>
        <button
          onClick={() => goMonth(1)}
          className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
        >
          {isAr ? "›" : "‹"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" dir={isAr ? "rtl" : "ltr"}>
            <thead>
              <tr
                style={{
                  background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
                }}
              >
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-white font-arabic text-center text-sm font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isToday =
                  row.day === now.getDate() &&
                  month === now.getMonth() &&
                  year === now.getFullYear();
                return (
                  <tr
                    key={row.day}
                    className={`border-t border-gray-50 transition-colors ${
                      isToday
                        ? "bg-primary/5 font-semibold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Day number */}
                    <td className="px-3 py-3 text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${
                          isToday ? "bg-primary text-white" : "text-gray-600"
                        }`}
                      >
                        {row.day}
                      </div>
                    </td>
                    {/* Hijri */}
                    <td className="px-2 py-3 text-center font-arabic text-xs text-gray-400 whitespace-nowrap">
                      {row.hijri}
                    </td>
                    {/* Prayer times — bigger font */}
                    {[
                      row.fajr,
                      row.sunrise,
                      row.dhuhr,
                      row.asr,
                      row.maghrib,
                      row.isha,
                    ].map((t, i) => (
                      <td
                        key={i}
                        className={`px-3 py-3 text-center font-mono font-bold whitespace-nowrap ${
                          isToday
                            ? "text-primary text-base"
                            : "text-gray-700 text-sm"
                        }`}
                      >
                        {t}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print */}
      <div className="mt-4 text-center">
        <button
          onClick={() => window.print()}
          className="font-arabic text-sm text-primary border border-primary/30 px-5 py-2 rounded-full hover:bg-primary hover:text-white transition-colors"
        >
          {isAr ? "🖨️ طباعة الجدول" : "🖨️ Print Table"}
        </button>
      </div>
    </div>
  );
}
