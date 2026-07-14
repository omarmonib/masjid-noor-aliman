// src/app/api/radio/proxy/route.ts
import { NextRequest } from "next/server";
import * as net from "net";
import * as tls from "tls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_HOSTS = [
  "radio.garden",
  "radiojar.com",
  "quran-radio.org",
  "itworkscdn.net",
  "radioca.st",
  "qurango.net",
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`),
  );
}

interface UpstreamHead {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  socket: net.Socket;
  leftover: Buffer;
}

const MAX_REDIRECTS = 5;
const CONNECT_TIMEOUT_MS = 8000; // only guards connect + header exchange, never the body stream

function connectRaw(targetUrl: URL): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const isTls = targetUrl.protocol === "https:";
    const port = targetUrl.port
      ? parseInt(targetUrl.port, 10)
      : isTls
        ? 443
        : 80;
    const host = targetUrl.hostname;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection to ${host}:${port} timed out`));
    }, CONNECT_TIMEOUT_MS);

    const onError = (err: Error) => {
      clearTimeout(timer);
      reject(err);
    };

    const socket = isTls
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.connect({ host, port });

    socket.once("error", onError);
    socket.once(isTls ? "secureConnect" : "connect", () => {
      socket.removeListener("error", onError);
      clearTimeout(timer);
      resolve(socket);
    });
  });
}

function sendRequest(socket: net.Socket, targetUrl: URL) {
  const path = `${targetUrl.pathname || "/"}${targetUrl.search || ""}`;
  const lines = [
    `GET ${path} HTTP/1.1`,
    `Host: ${targetUrl.hostname}`,
    `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`,
    `Accept: */*`,
    // Explicitly 0: requesting ICY metadata interleaves "now playing" text
    // blocks INSIDE the audio byte stream at a fixed interval, which would
    // corrupt playback in a plain <audio> element. We surface icy-* headers
    // separately below instead.
    `Icy-MetaData: 0`,
    `Connection: close`,
    "",
    "",
  ];
  socket.write(lines.join("\r\n"));
}

// Reads raw bytes until the header terminator. Deliberately does NOT
// validate the first token of the status line ("HTTP/1.1" vs the legacy
// Shoutcast "ICY") — only the numeric status code (2nd token) matters. This
// is the actual fix: Node's built-in fetch/http both reject "ICY ..." status
// lines outright with a parser exception, which was the real 502 cause.
function readHeaders(socket: net.Socket): Promise<UpstreamHead> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);

    const cleanup = () => {
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
    };

    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      const idx = buffer.indexOf("\r\n\r\n");
      if (idx === -1) {
        if (buffer.length > 64 * 1024) {
          cleanup();
          reject(new Error("Upstream headers too large"));
        }
        return;
      }

      cleanup();
      const headerText = buffer.slice(0, idx).toString("latin1");
      const leftover = buffer.slice(idx + 4);
      const rawLines = headerText.split("\r\n");
      const statusLine = rawLines.shift() || "";
      const statusParts = statusLine.split(" ");
      const statusCode = parseInt(statusParts[1], 10);
      const statusText = statusParts.slice(2).join(" ");

      const headers: Record<string, string> = {};
      for (const line of rawLines) {
        const sep = line.indexOf(":");
        if (sep === -1) continue;
        headers[line.slice(0, sep).trim().toLowerCase()] = line
          .slice(sep + 1)
          .trim();
      }

      if (!Number.isFinite(statusCode)) {
        reject(
          new Error(`Could not parse upstream status line: "${statusLine}"`),
        );
        return;
      }

      resolve({ statusCode, statusText, headers, socket, leftover });
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function fetchUpstream(
  targetUrl: URL,
  redirectChain: string[],
  redirectsLeft: number,
): Promise<UpstreamHead> {
  redirectChain.push(targetUrl.toString());
  const socket = await connectRaw(targetUrl);
  sendRequest(socket, targetUrl);
  const head = await readHeaders(socket);

  const isRedirect = [301, 302, 303, 307, 308].includes(head.statusCode);
  if (isRedirect && head.headers["location"]) {
    socket.destroy();
    if (redirectsLeft <= 0) {
      throw new Error(`Too many redirects, stopped at ${targetUrl}`);
    }
    const next = new URL(head.headers["location"], targetUrl);
    return fetchUpstream(next, redirectChain, redirectsLeft - 1);
  }

  return head;
}

// Most Icecast/Shoutcast live streams are NOT chunked (unbounded stream,
// connection just stays open) — but some CDN-fronted stations are, so this
// is handled rather than assumed away.
function dechunk(
  source: net.Socket,
  leftover: Buffer,
): ReadableStream<Uint8Array> {
  let buffer = leftover;
  let closed = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const pump = () => {
        while (true) {
          const idx = buffer.indexOf("\r\n");
          if (idx === -1) return;
          const sizeLine = buffer
            .slice(0, idx)
            .toString("latin1")
            .split(";")[0]
            .trim();
          const size = parseInt(sizeLine, 16);
          if (!Number.isFinite(size)) {
            // Malformed/not actually chunked — fall back to raw passthrough
            // rather than erroring the whole stream out.
            controller.enqueue(new Uint8Array(buffer));
            buffer = Buffer.alloc(0);
            source.removeAllListeners("data");
            source.on("data", (c: Buffer) =>
              controller.enqueue(new Uint8Array(c)),
            );
            return;
          }
          if (size === 0) {
            controller.close();
            source.destroy();
            closed = true;
            return;
          }
          if (buffer.length < idx + 2 + size + 2) return;
          controller.enqueue(
            new Uint8Array(buffer.slice(idx + 2, idx + 2 + size)),
          );
          buffer = buffer.slice(idx + 2 + size + 2);
        }
      };

      source.on("data", (chunk: Buffer) => {
        if (closed) return;
        buffer = Buffer.concat([buffer, chunk]);
        pump();
      });
      source.on("end", () => !closed && controller.close());
      source.on("error", (err) => !closed && controller.error(err));
      pump();
    },
    cancel() {
      source.destroy();
    },
  });
}

function rawPassthrough(
  source: net.Socket,
  leftover: Buffer,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (leftover.length > 0) controller.enqueue(new Uint8Array(leftover));
      source.on("data", (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk)),
      );
      source.on("end", () => controller.close());
      source.on("error", (err) => controller.error(err));
    },
    cancel() {
      source.destroy();
    },
  });
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  if (!target) return new Response("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  const redirectChain: string[] = [];

  try {
    const head = await fetchUpstream(parsed, redirectChain, MAX_REDIRECTS);

    console.log("[radio-proxy] requested:", target);
    console.log("[radio-proxy] redirect chain:", redirectChain);
    console.log(
      "[radio-proxy] upstream status:",
      head.statusCode,
      head.statusText,
    );
    console.log("[radio-proxy] upstream headers:", head.headers);

    if (debug) {
      head.socket.destroy();
      return Response.json({
        requestedUrl: target,
        redirectChain,
        status: head.statusCode,
        statusText: head.statusText,
        headers: head.headers,
      });
    }

    if (head.statusCode < 200 || head.statusCode >= 300) {
      const preview = head.leftover.toString("latin1").slice(0, 300);
      head.socket.destroy();
      console.error(
        `[radio-proxy] non-2xx for ${target}: ${head.statusCode} ${head.statusText}`,
        preview,
      );
      // Real upstream status now passed through, instead of always 502.
      return new Response(
        `Upstream returned ${head.statusCode} ${head.statusText}`,
        { status: head.statusCode || 502 },
      );
    }

    const isChunked = head.headers["transfer-encoding"]
      ?.toLowerCase()
      .includes("chunked");
    const body = isChunked
      ? dechunk(head.socket, head.leftover)
      : rawPassthrough(head.socket, head.leftover);

    const responseHeaders: Record<string, string> = {
      "Content-Type": head.headers["content-type"] || "audio/mpeg",
      "Cache-Control": "no-store",
    };
    if (head.headers["accept-ranges"]) {
      responseHeaders["Accept-Ranges"] = head.headers["accept-ranges"];
    }
    if (!isChunked && head.headers["content-length"]) {
      responseHeaders["Content-Length"] = head.headers["content-length"];
    }
    for (const key of ["icy-name", "icy-genre", "icy-br", "icy-description"]) {
      if (head.headers[key]) responseHeaders[`X-${key}`] = head.headers[key];
    }

    return new Response(body, { status: 200, headers: responseHeaders });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error(`[radio-proxy] error for ${target}:`, message);
    console.error(`[radio-proxy] redirect chain at failure:`, redirectChain);
    if (stack) console.error(stack);
    return new Response(`Proxy error: ${message}`, { status: 502 });
  }
}
