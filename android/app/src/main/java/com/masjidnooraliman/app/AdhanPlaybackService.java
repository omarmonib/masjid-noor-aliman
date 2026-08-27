package com.masjidnooraliman.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class AdhanPlaybackService extends Service {

    private static final String TAG = "AdhanPlaybackService";
    private static final String CHANNEL_ID = "adhan-playback-fg-v3";
    private static final int FG_NOTIF_ID = 7777;

    public static final String ACTION_STOP_ADHAN =
            "com.masjidnooraliman.app.ACTION_STOP_ADHAN";

    public static final String EXTRA_VOICE_FILE = "voiceFile";
    public static final String EXTRA_PRAYER_LABEL = "prayerLabel";
    public static final String EXTRA_PRAYER_NAME = "prayerName";
    public static final String EXTRA_PRAYER_TIME = "prayerTime";

    public interface StopListener {
        void onAdhanStopped();
    }

    private static StopListener stopListener;

    public static void setStopListener(StopListener listener) {
        stopListener = listener;
    }

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private AudioManager.OnAudioFocusChangeListener focusChangeListener;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannelIfNeeded();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent != null && ACTION_STOP_ADHAN.equals(intent.getAction())) {
            stopSelfCleanly();
            return START_NOT_STICKY;
        }

        String voiceFile = intent != null
                ? intent.getStringExtra(EXTRA_VOICE_FILE)
                : null;

        String prayerLabel = intent != null
                ? intent.getStringExtra(EXTRA_PRAYER_LABEL)
                : "";

        String prayerName = intent != null
                ? intent.getStringExtra(EXTRA_PRAYER_NAME)
                : "";

        String prayerTime = intent != null
                ? intent.getStringExtra(EXTRA_PRAYER_TIME)
                : "";

        startForeground(
                FG_NOTIF_ID,
                buildForegroundNotification(
                        prayerLabel,
                        prayerName,
                        prayerTime
                )
        );

        if (voiceFile == null) {
            stopSelfCleanly();
            return START_NOT_STICKY;
        }

        acquireWakeLock();
        requestAudioFocus();
        startMediaSession();
        playFullAdhan(voiceFile);

        return START_NOT_STICKY;
    }

    private void playFullAdhan(String voiceFile) {

        String resourceName = voiceFile.replaceFirst("\\.[^.]+$", "");

        int resId = getResources().getIdentifier(
                resourceName,
                "raw",
                getPackageName()
        );

        if (resId == 0) {
            Log.e(
                    TAG,
                    "Raw resource not found for voiceFile=" + voiceFile
            );
            stopSelfCleanly();
            return;
        }

        try {

            mediaPlayer = MediaPlayer.create(this, resId);

            if (mediaPlayer == null) {
                Log.e(
                        TAG,
                        "MediaPlayer.create returned null for " + voiceFile
                );
                stopSelfCleanly();
                return;
            }

            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            mediaPlayer.setAudioAttributes(attrs);

            mediaPlayer.setOnCompletionListener(
                    mp -> stopSelfCleanly()
            );

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {

                Log.e(
                        TAG,
                        "MediaPlayer error: what=" + what +
                                " extra=" + extra
                );

                stopSelfCleanly();
                return true;
            });

            mediaPlayer.start();

        } catch (Exception e) {

            Log.e(
                    TAG,
                    "Failed to start full Adhan playback",
                    e
            );

            stopSelfCleanly();
        }
    }

    /**
     * Registers a real MediaSession reporting STATE_PLAYING
     * using the ALARM audio usage.
     *
     * This allows Android to associate the active playback session
     * with the physical volume controls.
     */
    private void startMediaSession() {

        try {

            mediaSession = new MediaSession(
                    this,
                    "MasjidNoorAlIman-Adhan"
            );

            AudioAttributes sessionAttrs =
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(
                                    AudioAttributes.CONTENT_TYPE_MUSIC
                            )
                            .build();

            mediaSession.setPlaybackToLocal(sessionAttrs);

            // Explicitly allow this MediaSession to handle
            // hardware media/volume related controls.
            mediaSession.setFlags(
                    MediaSession.FLAG_HANDLES_MEDIA_BUTTONS
                            | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
            );

            PlaybackState state =
                    new PlaybackState.Builder()
                            .setActions(
                                    PlaybackState.ACTION_STOP
                            )
                            .setState(
                                    PlaybackState.STATE_PLAYING,
                                    0,
                                    1.0f
                            )
                            .build();

            mediaSession.setPlaybackState(state);
            mediaSession.setActive(true);

        } catch (Exception e) {

            Log.e(
                    TAG,
                    "Failed to start MediaSession",
                    e
            );
        }
    }

    private void stopMediaSession() {

        if (mediaSession != null) {

            try {

                mediaSession.setActive(false);
                mediaSession.release();

            } catch (Exception ignored) {
            }

            mediaSession = null;
        }
    }

    private void acquireWakeLock() {

        PowerManager pm =
                (PowerManager) getSystemService(
                        Context.POWER_SERVICE
                );

        if (pm == null) return;

        wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "MasjidNoorAlIman:AdhanPlayback"
        );

        wakeLock.acquire(
                10 * 60 * 1000L
        );
    }

    private void requestAudioFocus() {

        audioManager =
                (AudioManager) getSystemService(
                        Context.AUDIO_SERVICE
                );

        if (audioManager == null) return;

        focusChangeListener = focusChange -> {
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            AudioAttributes attrs =
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(
                                    AudioAttributes.CONTENT_TYPE_MUSIC
                            )
                            .build();

            audioFocusRequest =
                    new AudioFocusRequest.Builder(
                            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                    )
                            .setAudioAttributes(attrs)
                            .setOnAudioFocusChangeListener(
                                    focusChangeListener
                            )
                            .build();

            audioManager.requestAudioFocus(
                    audioFocusRequest
            );

        } else {

            //noinspection deprecation
            audioManager.requestAudioFocus(
                    focusChangeListener,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
    }

    private void abandonAudioFocus() {

        if (audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && audioFocusRequest != null) {

            audioManager.abandonAudioFocusRequest(
                    audioFocusRequest
            );

        } else if (focusChangeListener != null) {

            //noinspection deprecation
            audioManager.abandonAudioFocus(
                    focusChangeListener
            );
        }
    }

    private void stopSelfCleanly() {

        if (mediaPlayer != null) {

            try {

                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }

            } catch (IllegalStateException ignored) {
            }

            mediaPlayer.release();
            mediaPlayer = null;
        }

        abandonAudioFocus();
        stopMediaSession();

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        if (stopListener != null) {
            stopListener.onAdhanStopped();
        }

        stopForeground(true);
        stopSelf();
    }

    private void createChannelIfNeeded() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager nm =
                (NotificationManager) getSystemService(
                        Context.NOTIFICATION_SERVICE
                );

        if (nm == null) return;

        NotificationChannel channel =
                new NotificationChannel(
                        CHANNEL_ID,
                        "تشغيل الأذان الكامل",
                        NotificationManager.IMPORTANCE_HIGH
                );

        channel.setSound(null, null);
        channel.setShowBadge(false);

        nm.createNotificationChannel(channel);
    }

    private PendingIntent buildStopPendingIntent() {

        Intent stopIntent =
                new Intent(
                        this,
                        AdhanPlaybackService.class
                );

        stopIntent.setAction(ACTION_STOP_ADHAN);

        return PendingIntent.getService(
                this,
                0,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
                        | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private PendingIntent buildOpenScreenPendingIntent(
            String prayerLabel,
            String prayerName,
            String prayerTime
    ) {

        Intent activityIntent =
                new Intent(
                        this,
                        AdhanFullScreenActivity.class
                );

        activityIntent.putExtra(
                EXTRA_PRAYER_LABEL,
                prayerLabel
        );

        activityIntent.putExtra(
                EXTRA_PRAYER_NAME,
                prayerName
        );

        activityIntent.putExtra(
                EXTRA_PRAYER_TIME,
                prayerTime
        );

        activityIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        return PendingIntent.getActivity(
                this,
                1,
                activityIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
                        | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private Notification buildForegroundNotification(
            String prayerLabel,
            String prayerName,
            String prayerTime
    ) {

        Notification.Builder builder =
                new Notification.Builder(
                        this,
                        CHANNEL_ID
                );

        String title = "مسجد نور الإيمان";

        String text =
                (prayerName != null && !prayerName.isEmpty())
                        ? "أذان " + prayerName + " يعمل الآن"
                        : (
                            prayerLabel != null
                                    && !prayerLabel.isEmpty()
                                    ? prayerLabel
                                    : "جارٍ تشغيل الأذان"
                        );

        PendingIntent stopPI =
                buildStopPendingIntent();

        /*
         * This PendingIntent is used by Android's
         * full-screen notification mechanism.
         */
        PendingIntent openPI =
                buildOpenScreenPendingIntent(
                        prayerLabel,
                        prayerName,
                        prayerTime
                );

        int stopIconRes =
                getResources().getIdentifier(
                        "ic_stop_adhan",
                        "drawable",
                        getPackageName()
                );

        builder
                .setContentTitle(title)
                .setContentText(text)

                .setSmallIcon(
                        getResources().getIdentifier(
                                "ic_stat_icon",
                                "drawable",
                                getPackageName()
                        )
                )

                .setOngoing(true)

                // High priority for the full-screen alarm notification.
                .setPriority(
                        Notification.PRIORITY_HIGH
                )

                // Identify this notification as an alarm.
                .setCategory(
                        Notification.CATEGORY_ALARM
                )

                .setContentIntent(openPI)

                // Android-sanctioned full-screen notification mechanism.
                .setFullScreenIntent(
                        openPI,
                        true
                )

                .addAction(
                        new Notification.Action.Builder(
                                Icon.createWithResource(
                                        this,
                                        stopIconRes
                                ),
                                "إيقاف الأذان",
                                stopPI
                        ).build()
                );

        return builder.build();
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