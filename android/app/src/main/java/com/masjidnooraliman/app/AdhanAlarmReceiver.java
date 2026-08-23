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
        if (voiceFile == null) return;

        Intent serviceIntent = new Intent(context, AdhanPlaybackService.class);
        serviceIntent.putExtra("voiceFile", voiceFile);
        serviceIntent.putExtra("prayerLabel", prayerLabel != null ? prayerLabel : "");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
