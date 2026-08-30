package com.masjidnooraliman.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

@CapacitorPlugin(name = "AdhanAlarm")
public class AdhanAlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarms(PluginCall call) {
        JSArray alarmsArray = call.getArray("alarms");
        if (alarmsArray == null) {
            call.reject("Missing 'alarms' array");
            return;
        }

        try {
            // JSArray extends JSONArray directly, so a plain upcast is
            // correct here — there is no .toJSONArray() conversion method.
            JSONArray raw = alarmsArray;
            List<AdhanAlarmScheduler.Entry> entries = new ArrayList<>();
            for (int i = 0; i < raw.length(); i++) {
                JSONObject o = raw.getJSONObject(i);
                entries.add(new AdhanAlarmScheduler.Entry(
                        o.getInt("id"),
                        o.getLong("timeMillis"),
                        o.getString("voiceFile"),
                        o.optString("prayerLabel", ""),
                        o.optString("prayerName", ""),
                        o.optString("prayerTime", "")
                ));
            }

            int scheduled = AdhanAlarmScheduler.scheduleAll(
                    getContext(),
                    entries.toArray(new AdhanAlarmScheduler.Entry[0])
            );

            android.app.AlarmManager alarmManager =
                    (android.app.AlarmManager) getContext().getSystemService(android.content.Context.ALARM_SERVICE);
            boolean exact = android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S
                    || (alarmManager != null && alarmManager.canScheduleExactAlarms());

            JSObject result = new JSObject();
            result.put("scheduled", scheduled);
            result.put("exact", exact);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to schedule full-Adhan alarms: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void cancelAlarms(PluginCall call) {
        JSArray idsArray = call.getArray("ids");
        if (idsArray == null) {
            call.resolve();
            return;
        }
        try {
            JSONArray raw = idsArray;
            int[] ids = new int[raw.length()];
            for (int i = 0; i < raw.length(); i++) ids[i] = raw.getInt(i);
            AdhanAlarmScheduler.cancelIds(getContext(), ids);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to cancel full-Adhan alarms: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        AdhanAlarmScheduler.cancelAllPersisted(getContext());
        call.resolve();
    }

    /**
     * Android 14+ (API 34) restricts USE_FULL_SCREEN_INTENT: apps must be
     * granted "Full-screen notifications" special access, or the full-screen
     * Adhan alert silently degrades to a normal heads-up notification and
     * AdhanFullScreenActivity (and its volume-button mute handling) never runs.
     */
    @PluginMethod
    public void checkFullScreenIntentPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManagerCompat nm = NotificationManagerCompat.from(getContext());
            granted = nm.canUseFullScreenIntent();
        }
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= 34) {
                intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open full-screen intent settings: " + e.getMessage(), e);
        }
    }
}