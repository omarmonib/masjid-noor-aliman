package com.masjidnooraliman.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AdhanAlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AdhanAlarmReceiver";

    // How late an alarm delivery can be before it's treated as stale and
    // playback is skipped entirely. OEM battery management (Samsung Deep
    // Sleep / Sleeping Apps / adaptive battery, etc.) can defer even exact
    // alarms until the device wakes (e.g. on unlock) — without this check
    // the Adhan would play well after the prayer time had already passed.
    private static final long STALE_TOLERANCE_MS = 5 * 60 * 1000L;

    @Override
    public void onReceive(Context context, Intent intent) {
        String voiceFile = intent.getStringExtra("voiceFile");
        String prayerLabel = intent.getStringExtra("prayerLabel");
        String prayerName = intent.getStringExtra("prayerName");
        String prayerTime = intent.getStringExtra("prayerTime");
        long scheduledMillis = intent.getLongExtra("timeMillis", 0L);

        if (voiceFile == null) return;

        if (scheduledMillis > 0) {
            long lateBy = System.currentTimeMillis() - scheduledMillis;
            if (lateBy > STALE_TOLERANCE_MS) {
                Log.w(TAG, "Skipping stale Adhan alarm (" + lateBy + "ms late), prayerName=" + prayerName);
                return;
            }
        }

        Intent serviceIntent = new Intent(context, AdhanPlaybackService.class);
        serviceIntent.putExtra(AdhanPlaybackService.EXTRA_VOICE_FILE, voiceFile);
        serviceIntent.putExtra(AdhanPlaybackService.EXTRA_PRAYER_LABEL, prayerLabel != null ? prayerLabel : "");
        serviceIntent.putExtra(AdhanPlaybackService.EXTRA_PRAYER_NAME, prayerName != null ? prayerName : "");
        serviceIntent.putExtra(AdhanPlaybackService.EXTRA_PRAYER_TIME, prayerTime != null ? prayerTime : "");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}