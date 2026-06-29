// TuneIn returned audio/x-mpegurl — fetch the playlist to get real stream URL
// Then test those real URLs

async function resolveM3U(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  console.log("M3U content:", text.slice(0, 500));
  // Extract URLs from playlist
  const urls = text.split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("http"));
  return urls;
}

async function testStream(name, url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Range": "bytes=0-1023",
        "User-Agent": "Mozilla/5.0",
        "Icy-MetaData": "0",
      },
      signal: AbortSignal.timeout(8000),
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const icy = res.headers.get("icy-name") || "";
    console.log(`✓ ${name}: ${res.status} | ${ct} | icy:${icy}`);
    return res.status === 200 && ct.includes("audio");
  } catch(e) {
    console.log(`✗ ${name}: ${e.message?.slice(0,70)}`);
    return false;
  }
}

// Step 1: resolve Saudi TuneIn playlist
console.log("=== Resolving Saudi TuneIn ===");
const saudiUrls = await resolveM3U(
  "https://opml.radiotime.com/Tune.ashx?id=s4930&formats=mp3"
).catch(e => { console.log("failed:", e.message); return []; });

console.log("Resolved URLs:", saudiUrls);
for (const url of saudiUrls) {
  // If it's another playlist, resolve again
  if (url.includes(".pls") || url.includes(".m3u")) {
    const inner = await resolveM3U(url).catch(() => []);
    for (const u of inner) await testStream("  saudi-inner", u);
  } else {
    await testStream("saudi-stream", url);
  }
}

// Step 2: Try TuneIn for Egyptian Quran Radio (station ID s15735)
console.log("\n=== Resolving Egypt TuneIn ===");
const egyptUrls = await resolveM3U(
  "https://opml.radiotime.com/Tune.ashx?id=s15735&formats=mp3"
).catch(e => { console.log("failed:", e.message); return []; });

console.log("Resolved URLs:", egyptUrls);
for (const url of egyptUrls) {
  if (url.includes(".pls") || url.includes(".m3u")) {
    const inner = await resolveM3U(url).catch(() => []);
    for (const u of inner) await testStream("  egypt-inner", u);
  } else {
    await testStream("egypt-stream", url);
  }
}

// Step 3: Also try TuneIn for Egypt alt IDs
console.log("\n=== Egypt alt TuneIn IDs ===");
for (const [name, id] of [
  ["Egypt Quran ERTU", "s15735"],
  ["Egypt Quran 2",    "s122955"],
  ["Egypt Quran 3",    "s45689"],
]) {
  const urls = await resolveM3U(
    `https://opml.radiotime.com/Tune.ashx?id=${id}&formats=mp3`
  ).catch(() => []);
  if (urls.length) {
    console.log(`${name} (${id}) => ${urls[0]}`);
    await testStream(name, urls[0]);
  }
}
