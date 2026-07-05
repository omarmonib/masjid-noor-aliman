import { NextRequest, NextResponse } from "next/server";
import { getTodayNotificationEvents } from "@/lib/prayer-schedule";
import { sendPushToAll } from "@/lib/push-server";

const WINDOW_MS = 90 * 1000;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const events = getTodayNotificationEvents();
  const due = events.filter(
    (e) => Math.abs(now.getTime() - e.time.getTime()) <= WINDOW_MS,
  );

  if (due.length === 0) {
    return NextResponse.json({ checked: events.length, sent: 0 });
  }

  const { prisma } = await import("@/lib/prisma");
  const results: Record<string, string> = {};

  for (const event of due) {
    try {
      // Unique constraint on eventKey prevents double-sending if this
      // endpoint gets pinged more than once for the same event.
      await prisma.notificationLog.create({ data: { eventKey: event.key } });
    } catch {
      results[event.key] = "already-sent";
      continue;
    }

    try {
      const outcome = await sendPushToAll({
        title: event.title,
        body: event.body,
        tag: event.tag,
      });
      results[event.key] = `sent:${outcome.sent},failed:${outcome.failed}`;
    } catch (e) {
      console.error(`Failed to send for ${event.key}:`, e);
      results[event.key] = "error";
    }
  }

  return NextResponse.json({
    checked: events.length,
    due: due.length,
    results,
  });
}
