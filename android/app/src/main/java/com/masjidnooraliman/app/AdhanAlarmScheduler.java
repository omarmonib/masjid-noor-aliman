package com.masjidnooraliman.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class AdhanAlarmScheduler {

    private static final String TAG = "AdhanAlarmScheduler";
    private static final String PREFS = "adhan_full_alarms";
    private static final String KEY_SCHEDULE = "schedule_json";

    public static class Entry {
        public int id;
        public long timeMillis;
        public String voiceFile;
        public String prayerLabel;
        public String prayerName;
        public String prayerTime;

        Entry(int id, long timeMillis, String voiceFile, String prayerLabel, String prayerName, String prayerTime) {
            this.id = id;
            this.timeMillis = timeMillis;
            this.voiceFile = voiceFile;
            this.prayerLabel = prayerLabel;
            this.prayerName = prayerName;
            this.prayerTime = prayerTime;
        }
    }

    public static int scheduleAll(Context context, Entry[] entries) {
        cancelAllPersisted(context);

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return 0;

        boolean exact = canScheduleExact(context, alarmManager);
        int scheduled = 0;

        for (Entry e : entries) {
            if (e.timeMillis <= System.currentTimeMillis()) continue;
            PendingIntent pi = buildPendingIntent(context, e);
            try {
                if (exact) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                }
                scheduled++;
            } catch (SecurityException se) {
                Log.w(TAG, "Exact alarm denied for id=" + e.id + ", falling back to inexact", se);
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                scheduled++;
            }
        }

        persist(context, entries);
        return scheduled;
    }

    public static void cancelIds(Context context, int[] ids) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        for (int id : ids) {
            PendingIntent pi = PendingIntent.getBroadcast(
                    context, id, new Intent(context, AdhanAlarmReceiver.class),
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pi != null) {
                alarmManager.cancel(pi);
                pi.cancel();
            }
        }
        removeFromPersisted(context, ids);
    }

    public static void cancelAllPersisted(Context context) {
        Entry[] existing = readPersisted(context);
        if (existing.length == 0) return;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        for (Entry e : existing) {
            PendingIntent pi = PendingIntent.getBroadcast(
                    context, e.id, new Intent(context, AdhanAlarmReceiver.class),
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pi != null) {
                alarmManager.cancel(pi);
                pi.cancel();
            }
        }
        clearPersisted(context);
    }

    public static int reArmFromPersisted(Context context) {
        Entry[] existing = readPersisted(context);
        if (existing.length == 0) return 0;

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return 0;
        boolean exact = canScheduleExact(context, alarmManager);
        int rearmed = 0;

        for (Entry e : existing) {
            if (e.timeMillis <= System.currentTimeMillis()) continue;
            PendingIntent pi = buildPendingIntent(context, e);
            try {
                if (exact) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                }
                rearmed++;
            } catch (SecurityException se) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, e.timeMillis, pi);
                rearmed++;
            }
        }
        return rearmed;
    }

    private static boolean canScheduleExact(Context context, AlarmManager alarmManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return alarmManager.canScheduleExactAlarms();
        }
        return true;
    }

    private static PendingIntent buildPendingIntent(Context context, Entry e) {
        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.putExtra("id", e.id);
        intent.putExtra("voiceFile", e.voiceFile);
        intent.putExtra("prayerLabel", e.prayerLabel);
        intent.putExtra("prayerName", e.prayerName);
        intent.putExtra("prayerTime", e.prayerTime);
        return PendingIntent.getBroadcast(
                context, e.id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static void persist(Context context, Entry[] entries) {
        try {
            JSONArray arr = new JSONArray();
            for (Entry e : entries) {
                if (e.timeMillis <= System.currentTimeMillis()) continue;
                JSONObject o = new JSONObject();
                o.put("id", e.id);
                o.put("timeMillis", e.timeMillis);
                o.put("voiceFile", e.voiceFile);
                o.put("prayerLabel", e.prayerLabel);
                o.put("prayerName", e.prayerName);
                o.put("prayerTime", e.prayerTime);
                arr.put(o);
            }
            prefs(context).edit().putString(KEY_SCHEDULE, arr.toString()).apply();
        } catch (JSONException ex) {
            Log.e(TAG, "persist failed", ex);
        }
    }

    private static void removeFromPersisted(Context context, int[] ids) {
        Entry[] existing = readPersisted(context);
        java.util.List<Entry> kept = new java.util.ArrayList<>();
        outer:
        for (Entry e : existing) {
            for (int id : ids) {
                if (e.id == id) continue outer;
            }
            kept.add(e);
        }
        persist(context, kept.toArray(new Entry[0]));
    }

    private static void clearPersisted(Context context) {
        prefs(context).edit().remove(KEY_SCHEDULE).apply();
    }

    private static Entry[] readPersisted(Context context) {
        String json = prefs(context).getString(KEY_SCHEDULE, null);
        if (json == null) return new Entry[0];
        try {
            JSONArray arr = new JSONArray(json);
            Entry[] result = new Entry[arr.length()];
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                result[i] = new Entry(
                        o.getInt("id"),
                        o.getLong("timeMillis"),
                        o.getString("voiceFile"),
                        o.optString("prayerLabel", ""),
                        o.optString("prayerName", ""),
                        o.optString("prayerTime", "")
                );
            }
            return result;
        } catch (JSONException ex) {
            Log.e(TAG, "readPersisted failed", ex);
            return new Entry[0];
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
