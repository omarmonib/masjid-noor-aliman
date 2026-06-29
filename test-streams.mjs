// Run with: node test-streams.mjs
// Tests which URLs are reachable without an Origin header (as a server would see them)

const streams = [
  ["Saudi Radiojar", "https://stream.radiojar.com/0tpy1h0kxtzuv"],
  ["Cairo Radiojar",  "https://stream.radiojar.com/8s5u5tpdtwzuv"],
  // Saudi alternatives
  ["Saudi SBC HLS",  "https://KSAradio.Prod.streaming.edgesuite.net/ksa-radio/quran/playlist.m3u8"],
  ["Saudi aloula",   "https://aloula.fm/live/saudiradio"],
  // Egypt alternatives  
  ["Egypt ERTU",     "https://icecast.ertu.eg:8000/quran.mp3"],
];

for (const [name, url] of streams) {
  try {
    const res = await fetch(url, { 
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      // No Origin header — simulates server-side request
    });
    console.log(`${name}: ${res.status} ${res.headers.get("content-type") || "no-ct"}`);
  } catch(e) {
    console.log(`${name}: ERROR ${e.message}`);
  }
}
