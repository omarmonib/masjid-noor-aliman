import { NextRequest } from "next/server";
import {
  buildPlaylist,
  computeLiveState,
  fetchTracks,
} from "@/lib/radio-schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Matches the 128kbps CBR assumption already used in populate-radio-durations.mjs
const ASSUMED_BYTES_PER_SEC = (128 * 1000) / 8;

export async function GET(req: NextRequest) {
  try {
    const tracks = await fetchTracks();
    if (tracks.length === 0) {
      return new Response("No tracks available", { status: 500 });
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
      return Response.redirect(new URL("/audio/adhan.mp3", req.url), 302);
    }

    const byteOffset = Math.max(
      0,
      Math.floor(state.offsetSeconds * ASSUMED_BYTES_PER_SEC),
    );

    const upstream = await fetch(state.track.url, {
      headers: {
        Range: `bytes=${byteOffset}-`,
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.body) {
      return new Response("Upstream error", { status: 502 });
    }

    // Upstream honored the byte-range — already positioned correctly, stream as-is.
    if (upstream.status === 206) {
      return new Response(upstream.body, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    }

    // Upstream ignored Range and sent the full file from byte 0 — discard
    // `byteOffset` bytes ourselves so the client still joins at the live
    // position, without ever relying on client-side seeking.
    const reader = upstream.body.getReader();
    let skipped = 0;

    const stream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          if (skipped < byteOffset) {
            if (skipped + value.length <= byteOffset) {
              skipped += value.length;
              continue;
            }
            const sliceStart = byteOffset - skipped;
            skipped = byteOffset;
            controller.enqueue(value.slice(sliceStart));
            return;
          }
          controller.enqueue(value);
          return;
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("live-stream route error:", e);
    return new Response("Server error", { status: 500 });
  }
}
