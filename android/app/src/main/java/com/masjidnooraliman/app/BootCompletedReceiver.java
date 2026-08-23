package com.masjidnooraliman.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootCompletedReceiver extends BroadcastReceiver {

    private static final String TAG = "BootCompletedReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        int rearmed = AdhanAlarmScheduler.reArmFromPersisted(context);
        Log.i(TAG, "Re-armed " + rearmed + " full-Adhan alarm(s) after boot");
    }
}
