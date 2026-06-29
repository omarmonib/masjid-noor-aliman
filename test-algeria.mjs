const variants = [
  "https://radiocoran.ice.infomaniak.ch/coran.mp3",
  "https://radiocoran.ice.infomaniak.ch/coran-high.mp3",
  "https://radiocoran.ice.infomaniak.ch/coran-low.mp3",
  "https://radiocoran.ice.infomaniak.ch/coran128.mp3",
  "https://radiocoran.ice.infomaniak.ch/stream",
  "https://radiocoran.ice.infomaniak.ch/live",
  "https://radiocoran.ice.infomaniak.ch/radio.mp3",
  // The earlier test showed audio/aac — try aac endpoints
  "https://radiocoran.ice.infomaniak.ch/coran.aac",
  "https://radiocoran.ice.infomaniak.ch/coran-hifi.aac",
  "https://radiocoran.ice.infomaniak.ch/coran.m3u8",
];

for (const url of variants) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": "bytes=0-1023", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "no-ct";
    console.log(`${res.status} | ${ct.padEnd(25)} | ${url.split("/").pop()}`);
  } catch(e) {
    console.log(`ERR | ${e.message?.slice(0,40).padEnd(40)} | ${url.split("/").pop()}`);
  }
}
