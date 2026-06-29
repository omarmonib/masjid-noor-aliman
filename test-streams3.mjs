const streams = [
  // Zeno.fm - try different Egypt Quran station IDs
  ["Egypt zeno 1", "https://stream.zeno.fm/yn65m7h8tw8uv"],
  ["Egypt zeno 2", "https://stream.zeno.fm/q0598bh9p9zuv"],
  ["Egypt zeno 3", "https://stream.zeno.fm/hbn9rk49k6zuv"],
  ["Egypt zeno 4", "https://stream.zeno.fm/t0tb8tnhh7zuv"],
  ["Egypt zeno 5", "https://stream.zeno.fm/4d5gd9shm7zuv"],
  ["Egypt zeno 6", "https://stream.zeno.fm/9g9tnddthh8uv"],
  // Saudi - confirm the working one and find alternatives
  ["Saudi zeno confirm", "https://stream.zeno.fm/0r0xa792kwzuv"],
  ["Saudi zeno 2",       "https://stream.zeno.fm/y0pb9gj2gzquv"],
  ["Saudi zeno 3",       "https://stream.zeno.fm/avbmmgmv7p8uv"],
  // Zeno.fm has a search API
  ["Zeno API quran",     "https://api.zeno.fm/mounts/uuid/0r0xa792kwzuv/broadcast"],
];

for (const [name, url] of streams) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": "bytes=0-1023" },
      signal: AbortSignal.timeout(6000),
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const icy = res.headers.get("icy-name") || "";
    console.log(`✓ ${name}: ${res.status} | ${ct} | icy:${icy}`);
  } catch(e) {
    console.log(`✗ ${name}: ${e.message?.slice(0,60)}`);
  }
}
