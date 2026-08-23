"use client";

import { registerPlugin } from "@capacitor/core";

export interface AdhanAlarmEntry {
  id: number;
  timeMillis: number;
  voiceFile: string;
  prayerLabel: string;
}

export interface AdhanAlarmPlugin {
  scheduleAlarms(options: { alarms: AdhanAlarmEntry[] }): Promise<{ scheduled: number; exact: boolean }>;
  cancelAlarms(options: { ids: number[] }): Promise<void>;
  cancelAll(): Promise<void>;
}

export const AdhanAlarm = registerPlugin<AdhanAlarmPlugin>("AdhanAlarm");
