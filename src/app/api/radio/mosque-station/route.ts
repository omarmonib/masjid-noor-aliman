import { NextResponse } from "next/server";
import {
  buildPlaylist,
  computeLiveState,
  fetchTracks,
} from "@/lib/radio-schedule";

export async function GET() {
  try {
    const tracks = await fetchTracks();
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "No tracks available" },
        { status: 500 },
      );
    }

    const playlist = buildPlaylist(tracks);

    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.radioTrackDuration.findMany({
      where: { url: { in: playlist.map((t) => t.url) } },
      select: { url: true, durationSeconds: true },
    });
    const durations = new Map(rows.map((r) => [r.url, r.durationSeconds]));

    const state = computeLiveState(playlist, durations);

    if (state.mode === "adhan") {
      return NextResponse.json({
        mode: "adhan",
        url: "/audio/adhan.mp3",
        offsetSeconds: state.offsetSeconds,
      });
    }

    return NextResponse.json({
      mode: "recitation",
      url: state.track.url,
      reciterName: state.track.reciterName,
      surahId: state.track.surahId,
      offsetSeconds: state.offsetSeconds,
      trackDurationSeconds: state.trackDurationSeconds,
    });
  } catch (e) {
    console.error("mosque-station route error:", e);
    return NextResponse.json(
      { error: "Failed to compute live station" },
      { status: 500 },
    );
  }
}
