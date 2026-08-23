package com.masjidnooraliman.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class AdhanPlaybackService extends Service {

    private static final String TAG = "AdhanPlaybackService";
    private static final String CHANNEL_ID = "adhan-playback-fg";
    private static final int FG_NOTIF_ID = 7777;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private AudioManager.OnAudioFocusChangeListener focusChangeListener;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannelIfNeeded();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String voiceFile = intent != null ? intent.getStringExtra("voiceFile") : null;
        String prayerLabel = intent != null ? intent.getStringExtra("prayerLabel") : "";

        startForeground(FG_NOTIF_ID, buildForegroundNotification(prayerLabel));

        if (voiceFile == null) {
            stopSelfCleanly();
            return START_NOT_STICKY;
        }

        acquireWakeLock();
        requestAudioFocus();
        playFullAdhan(voiceFile);

        return START_NOT_STICKY;
    }

    private void playFullAdhan(String voiceFile) {
        String resourceName = voiceFile.replaceFirst("\\.[^.]+$", "");
        int resId = getResources().getIdentifier(resourceName, "raw", getPackageName());

        if (resId == 0) {
            Log.e(TAG, "Raw resource not found for voiceFile=" + voiceFile);
            stopSelfCleanly();
            return;
        }

        try {
            mediaPlayer = MediaPlayer.create(this, resId);
            if (mediaPlayer == null) {
                Log.e(TAG, "MediaPlayer.create returned null for " + voiceFile);
                stopSelfCleanly();
                return;
            }

            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);

            mediaPlayer.setOnCompletionListener(mp -> stopSelfCleanly());
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: what=" + what + " extra=" + extra);
                stopSelfCleanly();
                return true;
            });

            mediaPlayer.start();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start full Adhan playback", e);
            stopSelfCleanly();
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "MasjidNoorAlIman:AdhanPlayback"
        );
        wakeLock.acquire(10 * 60 * 1000L);
    }

    private void requestAudioFocus() {
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;

        focusChangeListener = focusChange -> {
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(attrs)
                    .setOnAudioFocusChangeListener(focusChangeListener)
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            //noinspection deprecation
            audioManager.requestAudioFocus(
                    focusChangeListener, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else if (focusChangeListener != null) {
            //noinspection deprecation
            audioManager.abandonAudioFocus(focusChangeListener);
        }
    }

    private void stopSelfCleanly() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            } catch (IllegalStateException ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        abandonAudioFocus();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        stopForeground(true);
        stopSelf();
    }

    private void createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "تشغيل الأذان الكامل",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setSound(null, null);
        channel.setShowBadge(false);
        nm.createNotificationChannel(channel);
    }

    private Notification buildForegroundNotification(String prayerLabel) {
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            //noinspection deprecation
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("مسجد نور الإيمان")
                .setContentText(prayerLabel != null && !prayerLabel.isEmpty() ? prayerLabel : "جارٍ تشغيل الأذان")
                .setSmallIcon(getResources().getIdentifier("ic_stat_icon", "drawable", getPackageName()))
                .setOngoing(true)
                .setPriority(Notification.PRIORITY_LOW)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopSelfCleanly();
        super.onDestroy();
    }
}
