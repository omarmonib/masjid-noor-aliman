"use client";

export function isMediaSessionSupported(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function setMediaSessionMetadata(meta: {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}) {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession!.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist || "",
      album: meta.album || "",
      artwork: meta.artworkUrl
        ? [{ src: meta.artworkUrl, sizes: "512x512", type: "image/png" }]
        : [],
    });
  } catch {
    /* MediaMetadata unavailable in this environment — ignore */
  }
}

export function setMediaSessionPlaybackState(
  state: "playing" | "paused" | "none",
) {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession!.playbackState = state;
  } catch {
    /* ignore */
  }
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStop?: () => void;
}

export function setMediaSessionHandlers(handlers: MediaSessionHandlers) {
  if (!isMediaSessionSupported()) return;
  const ms = navigator.mediaSession!;
  const set = (
    action: MediaSessionAction,
    handler: (() => void) | undefined,
  ) => {
    try {
      ms.setActionHandler(action, handler ? () => handler() : null);
    } catch {
      /* action not supported by this browser/webview — ignore */
    }
  };
  set("play", handlers.onPlay);
  set("pause", handlers.onPause);
  set("nexttrack", handlers.onNext);
  set("previoustrack", handlers.onPrevious);
  set("stop", handlers.onStop);
}

export function clearMediaSession() {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession!.metadata = null;
    setMediaSessionPlaybackState("none");
    setMediaSessionHandlers({});
  } catch {
    /* ignore */
  }
}
