package com.masjidnooraliman.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class AdhanFullScreenActivity extends AppCompatActivity implements AdhanPlaybackService.StopListener {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        setContentView(R.layout.activity_adhan_fullscreen);

        String prayerLabel = getIntent().getStringExtra(AdhanPlaybackService.EXTRA_PRAYER_LABEL);
        String prayerName = getIntent().getStringExtra(AdhanPlaybackService.EXTRA_PRAYER_NAME);
        String prayerTime = getIntent().getStringExtra(AdhanPlaybackService.EXTRA_PRAYER_TIME);

        TextView prayerNameView = findViewById(R.id.adhanPrayerName);
        TextView prayerTimeView = findViewById(R.id.adhanPrayerTime);
        TextView playingIndicatorView = findViewById(R.id.adhanPlayingIndicator);
        TextView subtitleView = findViewById(R.id.adhanSubtitle);
        Button stopButton = findViewById(R.id.adhanStopButton);

        if (prayerName != null && !prayerName.isEmpty()) {
            prayerNameView.setText("أذان " + prayerName);
        } else if (prayerLabel != null && !prayerLabel.isEmpty()) {
            prayerNameView.setText(prayerLabel);
        } else {
            prayerNameView.setText("الأذان");
        }

        prayerTimeView.setText(prayerTime != null && !prayerTime.isEmpty() ? prayerTime : "");
        subtitleView.setText("حان الآن وقت الصلاة");
        playingIndicatorView.setText("🔊 الأذان يُبَث الآن");

        stopButton.setOnClickListener(v -> stopAdhanAndClose());
    }

    @Override
    protected void onResume() {
        super.onResume();
        AdhanPlaybackService.setStopListener(this);
    }

    @Override
    protected void onPause() {
        super.onPause();
        AdhanPlaybackService.setStopListener(null);
    }

    /**
     * One-press mute: while the Adhan is playing and this screen has focus,
     * a single press of either hardware volume key silences it immediately —
     * matching standard Islamic-prayer-app behavior (and Android's own
     * built-in "silence a ringing call with the volume key" pattern). The
     * event is fully consumed on both down and up, so Android's default
     * "adjust stream volume" action never runs — the user's actual system
     * Alarm volume is left completely untouched, before, during, and after
     * the Adhan.
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            if (event.getRepeatCount() == 0) {
                stopAdhanAndClose();
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    private void stopAdhanAndClose() {
        Intent stopIntent = new Intent(this, AdhanPlaybackService.class);
        stopIntent.setAction(AdhanPlaybackService.ACTION_STOP_ADHAN);
        startService(stopIntent);
        finish();
    }

    @Override
    public void onAdhanStopped() {
        runOnUiThread(this::finish);
    }
}