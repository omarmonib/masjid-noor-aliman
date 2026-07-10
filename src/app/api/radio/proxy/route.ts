import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
// Vercel Hobby plan caps function duration (up to 60s) — a long listening
// session may still get disconnected and need the client to reconnect.
// Worth watching in practice; if it's a real problem, the alternative is
// enabling mixed content in the native WebView instead (requires a rebuild).
export const maxDuration = 60;

// Only proxy known radio-stream hosts — this must not become an open proxy.
const ALLOWED_HOSTS = [
  "radio.garden",
  "radiojar.com",
  "quran-radio.org",
  "itworkscdn.net",
  "radioca.st",
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`),
  );
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" },
      // fetch() follows redirects by default — including any http:// hop,
      // which is fine here since this runs server-side, not in a browser.
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Radio proxy error:", e);
    return new Response("Proxy error", { status: 502 });
  }
}
