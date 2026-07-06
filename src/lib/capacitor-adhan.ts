"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getNotificationEventsForOffset } from "@/lib/prayer-schedule";

const BASE_ID = 5000; // reserved id range for adhan notifications

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function scheduleNativeAdhanNotifications() {
  if (!isNativeApp()) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== "granted") return;
  }

  // Clear previously scheduled adhan notifications before re-scheduling
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(
    (n) => n.id >= BASE_ID && n.id < BASE_ID + 100,
  );
  if (ours.length > 0) {
    await LocalNotifications.cancel({
      notifications: ours.map((n) => ({ id: n.id })),
    });
  }

  const now = Date.now();
  const upcoming = [
    ...getNotificationEventsForOffset(0),
    ...getNotificationEventsForOffset(1),
  ].filter((e) => e.time.getTime() > now);

  const notifications = upcoming.slice(0, 20).map((event, i) => ({
    id: BASE_ID + i,
    title: event.title,
    body: event.body,
    schedule: { at: event.time },
    sound: "adhan_short.wav",
    smallIcon: "ic_stat_icon",
    channelId: "adhan",
  }));

  if (notifications.length === 0) return;

  // Android needs an explicit channel with the custom sound set once
  await LocalNotifications.createChannel({
    id: "adhan",
    name: "Adhan",
    sound: "adhan_short.wav",
    importance: 5,
    vibration: true,
  });

  await LocalNotifications.schedule({ notifications });
}
