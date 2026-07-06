import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const COORDS = new Coordinates(30.8708, 31.5588);
const PARAMS = CalculationMethod.Egyptian();

// Egypt does not currently observe DST — fixed UTC+2 offset
const CAIRO_OFFSET_HOURS = 2;
const HEADSUP_MINUTES = 10;

const IQAMAH_OFFSETS: Record<string, number> = {
  fajr: 20,
  dhuhr: 15,
  asr: 15,
  maghrib: 10,
  isha: 15,
};

const PRAYER_LABELS_AR: Record<string, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export interface NotificationEvent {
  key: string;
  time: Date;
  title: string;
  body: string;
  tag: string;
}

function getCairoToday(): Date {
  const now = new Date();
  const shifted = new Date(now.getTime() + CAIRO_OFFSET_HOURS * 3600 * 1000);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
}

export function getTodayNotificationEvents(): NotificationEvent[] {
  const today = getCairoToday();
  const pt = new PrayerTimes(COORDS, today, PARAMS);
  const dateKey = today.toISOString().slice(0, 10);

  const prayers: { key: string; time: Date }[] = [
    { key: "fajr", time: pt.fajr },
    { key: "dhuhr", time: pt.dhuhr },
    { key: "asr", time: pt.asr },
    { key: "maghrib", time: pt.maghrib },
    { key: "isha", time: pt.isha },
  ];

  const events: NotificationEvent[] = [];

  for (const { key, time } of prayers) {
    const label = PRAYER_LABELS_AR[key];

    events.push({
      key: `${dateKey}:${key}:headsup`,
      time: new Date(time.getTime() - HEADSUP_MINUTES * 60 * 1000),
      title: "تذكير بالصلاة",
      body: `صلاة ${label} بعد ${HEADSUP_MINUTES} دقائق`,
      tag: `${key}-headsup`,
    });

    events.push({
      key: `${dateKey}:${key}:adhan`,
      time,
      title: `حان الآن وقت صلاة ${label}`,
      body: "حي على الصلاة، حي على الفلاح",
      tag: `${key}-adhan`,
    });

    events.push({
      key: `${dateKey}:${key}:iqamah`,
      time: new Date(time.getTime() + IQAMAH_OFFSETS[key] * 60 * 1000),
      title: `إقامة صلاة ${label}`,
      body: "حان الآن وقت الإقامة",
      tag: `${key}-iqamah`,
    });
  }

  events.push({
    key: `${dateKey}:sunrise:simple`,
    time: pt.sunrise,
    title: "الشروق",
    body: "حان الآن وقت الشروق",
    tag: "sunrise",
  });

  return events;
}

export function getNotificationEventsForOffset(
  dayOffset: number,
): NotificationEvent[] {
  const base = getCairoToday();
  const target = new Date(base);
  target.setUTCDate(target.getUTCDate() + dayOffset);

  const pt = new PrayerTimes(COORDS, target, PARAMS);
  const dateKey = target.toISOString().slice(0, 10);

  const prayers: { key: string; time: Date }[] = [
    { key: "fajr", time: pt.fajr },
    { key: "dhuhr", time: pt.dhuhr },
    { key: "asr", time: pt.asr },
    { key: "maghrib", time: pt.maghrib },
    { key: "isha", time: pt.isha },
  ];

  return prayers.map(({ key, time }) => ({
    key: `${dateKey}:${key}:adhan`,
    time,
    title: `حان الآن وقت صلاة ${PRAYER_LABELS_AR[key]}`,
    body: "حي على الصلاة، حي على الفلاح",
    tag: `${key}-adhan`,
  }));
}
