"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getNotificationEventsForOffset } from "@/lib/prayer-schedule";

const BASE_ID = 5000; // reserved id range for adhan notifications
const CONFIRM_ID = 4999; // fixed id reused for the on/off confirmation
const DAYS_AHEAD = 7; // schedule a week out so alerts survive the app staying closed
const ENABLED_KEY = "adhan-audio-enabled";
const VOICE_KEY = "adhan-voice-choice";
const CHANNEL_PREFIX = "adhan-";

export const ADHAN_VOICES = [
  {
    id: "nabawi",
    labelAr: "الشيخ عادل كاتب — المسجد النبوي",
    labelEn: "Sheikh Adel Kateb — Masjid An-Nabawi",
    file: "adhan_nabawi.mp3",
    fajrFile: "adhan_nabawi_fajr.mp3",
  },
  {
    id: "masri",
    labelAr: "الشيخ عبد الباسط عبد الصمد — مصر",
    labelEn: "Sheikh Abdul Basit Abdul Samad — Egypt",
    file: "adhan_masri.mp3",
    fajrFile: "adhan_masri_fajr.mp3",
  },
  {
    id: "makkah",
    labelAr: "الشيخ علي ملا — الحرم المكي",
    labelEn: "Sheikh Ali Mulla — Masjid Al-Haram",
    file: "adhan_makkah.mp3",
    fajrFile: "adhan_makkah_fajr.mp3",
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

// Android locks a channel's sound the moment it's first created — recreating
// the same channel id with a different sound is silently ignored. So we
// pre-create one channel per voice per variant (6 total) exactly once, and
// just pick the right existing channel per event from then on.
async function ensureChannels() {
  for (const v of ADHAN_VOICES) {
    await LocalNotifications.createChannel({
      id: channelId(v.id, false),
      name: `Adhan — ${v.labelEn}`,
      sound: v.file,
      importance: 5,
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: channelId(v.id, true),
      name: `Adhan (Fajr) — ${v.labelEn}`,
      sound: v.fajrFile,
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

export async function scheduleNativeAdhanNotifications() {
  if (!isNativeApp()) return;

  const granted = await ensurePermission();
  if (!granted) return;

  await ensureChannels();
  await clearOurs();

  const voiceId = getSelectedVoice();
  const now = Date.now();
  const upcoming = Array.from({ length: DAYS_AHEAD }, (_, i) => i)
    .flatMap((offset) => getNotificationEventsForOffset(offset))
    .filter((e) => e.time.getTime() > now);

  const notifications = upcoming.slice(0, 250).map((event, i) => {
    const isFajr = event.tag.startsWith("fajr-");
    const voice = ADHAN_VOICES.find((v) => v.id === voiceId) ?? ADHAN_VOICES[0];
    return {
      id: BASE_ID + i,
      title: event.title,
      body: event.body,
      // allowWhileIdle asks Android to use an EXACT alarm that still fires
      // during Doze/App Standby — without it, delivery gets batched and
      // delayed until the app is reopened.
      schedule: { at: event.time, allowWhileIdle: true },
      sound: isFajr ? voice.fajrFile : voice.file,
      smallIcon: "ic_stat_icon",
      channelId: channelId(voice.id, isFajr),
    };
  });

  if (notifications.length === 0) return;
  await LocalNotifications.schedule({ notifications });
}

export async function cancelNativeAdhanNotifications() {
  if (!isNativeApp()) return;
  await clearOurs();
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
