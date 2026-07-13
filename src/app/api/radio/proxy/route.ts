import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// TEMPORARY: "example.com" added only for diagnosing whether Vercel's
// outbound network is broken generally, or just for radio-streaming hosts.
// Remove this entry once the radio-proxy issue is resolved.
const ALLOWED_HOSTS = [
  "radio.garden",
  "radiojar.com",
  "quran-radio.org",
  "itworkscdn.net",
  "radioca.st",
  "qurango.net",
  "example.com", // TEMP — remove after diagnosis
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`),
  );
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const debug = req.nextUrl.searchParams.get("debug") === "1";

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

  const fetchOptions = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: `${parsed.protocol}//${parsed.hostname}/`,
      Accept: "*/*",
    },
    signal: AbortSignal.timeout(8000),
  };

  if (debug) {
    try {
      const upstream = await fetch(target, fetchOptions);
      return Response.json({
        ok: upstream.ok,
        status: upstream.status,
        statusText: upstream.statusText,
        finalUrl: upstream.url,
        contentType: upstream.headers.get("content-type"),
      });
    } catch (e) {
      return Response.json({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  try {
    const upstream = await fetch(target, fetchOptions);

    if (!upstream.ok || !upstream.body) {
      const bodyPreview = await upstream.text().catch(() => "");
      console.error(
        `Radio proxy upstream failure: ${upstream.status} ${upstream.statusText} for ${target}`,
        bodyPreview.slice(0, 300),
      );
      return new Response(
        `Upstream returned ${upstream.status} ${upstream.statusText}`,
        { status: 502 },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Radio proxy error for ${target}:`, message);
    return new Response(`Proxy error: ${message}`, { status: 502 });
  }
}
