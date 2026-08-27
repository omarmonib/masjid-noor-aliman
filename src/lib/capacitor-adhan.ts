"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getNotificationEventsForOffset } from "@/lib/prayer-schedule";
import { AdhanAlarm } from "@/lib/adhan-native-alarm";

const BASE_ID = 5000;
const FULL_ALARM_ID_BASE = 6000;
const CONFIRM_ID = 4999;
const DAYS_AHEAD = 7;
const ENABLED_KEY = "adhan-audio-enabled";
const VOICE_KEY = "adhan-voice-choice";
const CHANNEL_PREFIX = "adhan-v2-";

const NOTIFICATION_SOUND = "adhan_short.wav";

export const ADHAN_VOICES = [
  {
    id: "nabawi",
    labelAr: "الشيخ عادل كاتب — المسجد النبوي",
    labelEn: "Sheikh Adel Kateb — Masjid An-Nabawi",
    file: "adhan_nabawi.m4a",
    fajrFile: "adhan_nabawi_fajr.m4a",
  },
  {
    id: "masri",
    labelAr: "الشيخ عبد الباسط عبد الصمد — مصر",
    labelEn: "Sheikh Abdul Basit Abdul Samad — Egypt",
    file: "adhan_masri.m4a",
    fajrFile: "adhan_masri_fajr.m4a",
  },
  {
    id: "makkah",
    labelAr: "الشيخ علي ملا — الحرم المكي",
    labelEn: "Sheikh Ali Mulla — Masjid Al-Haram",
    file: "adhan_makkah.m4a",
    fajrFile: "adhan_makkah_fajr.m4a",
  },
  {
    id: "short",
    labelAr: "أذان قصير",
    labelEn: "Short Adhan",
    file: "adhan_short.wav",
    fajrFile: "adhan_short.wav",
  },
] as const;

export type AdhanVoiceId = (typeof ADHAN_VOICES)[number]["id"];

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getSelectedVoice(): AdhanVoiceId {
  if (typeof window === "undefined") return "nabawi";
  return (localStorage.getItem(VOICE_KEY) as AdhanVoiceId) || "nabawi";
}

export function setSelectedVoice(id: AdhanVoiceId) {
  localStorage.setItem(VOICE_KEY, id);
  if (isNativeAdhanEnabled()) scheduleNativeAdhanNotifications();
}

export function isNativeAdhanEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

async function ensurePermission(): Promise<boolean> {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display === "granted") return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === "granted";
}

function channelId(voiceId: AdhanVoiceId, fajr: boolean) {
  return `${CHANNEL_PREFIX}${voiceId}${fajr ? "-fajr" : ""}`;
}

async function ensureChannels() {
  for (const v of ADHAN_VOICES) {
    await LocalNotifications.createChannel({
      id: channelId(v.id, false),
      name: `Adhan — ${v.labelEn}`,
      sound: NOTIFICATION_SOUND,
      importance: 5,
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: channelId(v.id, true),
      name: `Adhan (Fajr) — ${v.labelEn}`,
      sound: NOTIFICATION_SOUND,
      importance: 5,
      vibration: true,
    });
  }
}

async function clearOurs() {
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(
    (n) => n.id >= BASE_ID && n.id < BASE_ID + 300,
  );
  if (ours.length > 0) {
    await LocalNotifications.cancel({
      notifications: ours.map((n) => ({ id: n.id })),
    });
  }
}

async function clearOurFullPlaybackAlarms() {
  if (!isNativeApp()) return;
  try {
    await AdhanAlarm.cancelAll();
  } catch (e) {
    console.warn("[capacitor-adhan] cancelAll (native full-playback alarms) failed:", e);
  }
}

const PRAYER_LABELS_AR: Record<string, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function formatArabicTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "م" : "ص";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export async function scheduleNativeAdhanNotifications() {
  if (!isNativeApp()) return;

  const granted = await ensurePermission();
  if (!granted) return;

  await ensureChannels();
  await clearOurs();
  await clearOurFullPlaybackAlarms();

  const voiceId = getSelectedVoice();
  const voice = ADHAN_VOICES.find((v) => v.id === voiceId) ?? ADHAN_VOICES[0];
  const now = Date.now();
  const upcoming = Array.from({ length: DAYS_AHEAD }, (_, i) => i)
    .flatMap((offset) => getNotificationEventsForOffset(offset))
    .filter((e) => e.time.getTime() > now);

  const notifications = upcoming.slice(0, 250).map((event, i) => {
    const isFajr = event.tag.startsWith("fajr-");
    return {
      id: BASE_ID + i,
      title: event.title,
      body: event.body,
      schedule: { at: event.time, allowWhileIdle: true },
      sound: NOTIFICATION_SOUND,
      smallIcon: "ic_stat_icon",
      channelId: channelId(voice.id, isFajr),
    };
  });

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  const fullAlarms = upcoming.slice(0, 250).map((event, i) => {
    const isFajr = event.tag.startsWith("fajr-");
    const rawKey = event.tag.split("-")[0];
    const label = PRAYER_LABELS_AR[rawKey] || "";
    return {
      id: FULL_ALARM_ID_BASE + i,
      timeMillis: event.time.getTime(),
      voiceFile: isFajr ? voice.fajrFile : voice.file,
      prayerLabel: label ? `جارٍ تشغيل أذان ${label}` : "جارٍ تشغيل الأذان",
      prayerName: label,
      prayerTime: formatArabicTime(event.time),
    };
  });

  if (fullAlarms.length > 0) {
    try {
      await AdhanAlarm.scheduleAlarms({ alarms: fullAlarms });
    } catch (e) {
      console.warn("[capacitor-adhan] scheduleAlarms (native full-playback) failed:", e);
    }
  }
}

export async function cancelNativeAdhanNotifications() {
  if (!isNativeApp()) return;
  await clearOurs();
  await clearOurFullPlaybackAlarms();
}

async function confirmToggle(enabled: boolean, isAr: boolean) {
  if (!isNativeApp()) return;
  const granted = await ensurePermission();
  if (!granted) return;
  await ensureChannels();
  const voiceId = getSelectedVoice();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: CONFIRM_ID,
        title: enabled
          ? isAr
            ? "تنبيه الصلاة مفعّل"
            : "Prayer Alert On"
          : isAr
            ? "تنبيه الصلاة متوقف"
            : "Alert Off",
        body: enabled
          ? isAr
            ? "سيتم تنبيهك عند كل أذان"
            : "You'll be notified for every Adhan"
          : isAr
            ? "لن تصلك تنبيهات الصلاة"
            : "Prayer notifications are paused",
        schedule: { at: new Date(Date.now() + 400) },
        channelId: channelId(voiceId, false),
      },
    ],
  });
}

export async function toggleNativeAdhan(enabled: boolean, isAr: boolean) {
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  if (enabled) {
    await scheduleNativeAdhanNotifications();
  } else {
    await cancelNativeAdhanNotifications();
  }
  await confirmToggle(enabled, isAr);
}
