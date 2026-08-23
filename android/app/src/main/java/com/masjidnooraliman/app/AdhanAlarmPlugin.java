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
            JSONArray raw = alarmsArray;
            List<AdhanAlarmScheduler.Entry> entries = new ArrayList<>();
            for (int i = 0; i < raw.length(); i++) {
                JSONObject o = raw.getJSONObject(i);
                entries.add(new AdhanAlarmScheduler.Entry(
                        o.getInt("id"),
                        o.getLong("timeMillis"),
                        o.getString("voiceFile"),
                        o.optString("prayerLabel", "")
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
}
