const streams = [
  // Saudi Quran Radio - known CDN endpoints
  ["Saudi mp3quran sudais",    "https://backup.mp3quran.net/sudais"],
  ["Saudi mp3quran ghamdi",    "https://backup.mp3quran.net/ghamdi"],
  ["Saudi mp3quran shuraim",   "https://backup.mp3quran.net/shuraim"],
  ["Saudi mp3quran afasy",     "https://backup.mp3quran.net/afasy"],
  ["Saudi stream mp3quran",    "https://stream.mp3quran.net/sudais"],
  ["Saudi live mp3quran 9920", "https://live.mp3quran.net:9920/"],
  ["Saudi live mp3quran 9304", "https://live.mp3quran.net:9304/"],
  // Egypt Quran Radio
  ["Egypt mp3quran husary",    "https://backup.mp3quran.net/husary"],
  ["Egypt mp3quran minshawi",  "https://backup.mp3quran.net/minshawi_m"],
  ["Egypt stream husary",      "https://stream.mp3quran.net/husary"],
  ["Egypt live 9902",          "https://live.mp3quran.net:9902/"],
  // Other open CDNs
  ["Saudi zeno quran",         "https://stream.zeno.fm/0r0xa792kwzuv"],
  ["Egypt zeno quran",         "https://stream.zeno.fm/yn65m7h8tw8uv"],
  ["Saudi radioking",          "https://listen.radioking.com/radio/285880/stream/329666"],
  ["Quran radio org saudi",    "https://quranradio.com:8000/quran"],
];

for (const [name, url] of streams) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": "bytes=0-1023" },
      signal: AbortSignal.timeout(6000),
    });
    const ct = res.headers.get("content-type") || "no-ct";
    console.log(`✓ ${name}: ${res.status} | ${ct}`);
  } catch(e) {
    console.log(`✗ ${name}: ${e.message?.slice(0,60)}`);
  }
}
