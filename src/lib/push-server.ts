import webPush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
}

export async function sendPushToAll(payload: PushPayload) {
  ensureConfigured();
  const { prisma } = await import("@/lib/prisma");
  const subs = await prisma.pushSubscription.findMany();

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      ),
    ),
  );

  const toDelete: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410)
        toDelete.push(subs[i].endpoint);
    }
  });

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: toDelete } },
    });
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    removed: toDelete.length,
  };
}
