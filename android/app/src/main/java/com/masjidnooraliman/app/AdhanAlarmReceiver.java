package com.masjidnooraliman.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AdhanAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String voiceFile = intent.getStringExtra("voiceFile");
        String prayerLabel = intent.getStringExtra("prayerLabel");
        String prayerName = intent.getStringExtra("prayerName");
        String prayerTime = intent.getStringExtra("prayerTime");
        if (voiceFile == null) return;

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
