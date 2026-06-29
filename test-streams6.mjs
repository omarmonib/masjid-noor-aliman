// Direct known stream URLs for Saudi and Egyptian Quran Radio
// sourced from publicly documented broadcast endpoints

const streams = [
  // Saudi Quran Radio — Saudi Broadcasting Authority direct streams
  ["Saudi SBA 1",        "https://KSAradio.Prod.streaming.edgesuite.net/ksa-radio/quran/aacp"],
  ["Saudi SBA 2",        "https://KSAradio.Prod.streaming.edgesuite.net/ksa-radio/quran/aac"],
  ["Saudi SBA HLS",      "http://sc.rss.net.sa:8290/stream"],
  ["Saudi SBC direct",   "http://18.185.11.214:8000/quran"],
  ["Saudi tunein",       "https://opml.radiotime.com/Tune.ashx?id=s4930&formats=mp3"],
  // Egyptian Quran Radio — ERTU direct
  ["Egypt ERTU 1",       "http://ero.eu.cps.ero.strmz.io:9110/ergquran"],
  ["Egypt ERTU 2",       "https://ero.eu.cps.ero.strmz.io:9110/ergquran"],
  ["Egypt ERTU 3",       "http://51.161.115.200:8002/stream"],
  ["Egypt stream 1",     "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_QURAN_SC"],
  ["Egypt live 1",       "http://live.ertu.tv:8002/quran.mp3"],
  // Alternative open Islamic streams
  ["IslamWeb Quran",     "https://radio.islamweb.net/quran/index.php"],
  ["Quran Explorer",     "https://streams.quranexplorer.com/quran.mp3"],
  ["5Pillars Radio",     "https://s8.myradiostream.com/14508/listen.mp3"],
  ["Islamica Radio",     "https://uk3.internet-radio.com/proxy/islamica?mp=/stream"],
];

for (const [name, url] of streams) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "Range": "bytes=0-1023",
        "User-Agent": "Mozilla/5.0",
        "Icy-MetaData": "0",
      },
      signal: AbortSignal.timeout(7000),
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const icy = res.headers.get("icy-name") || res.headers.get("icy-description") || "";
    console.log(`✓ ${name}: ${res.status} | ${ct} | ${icy}`);
  } catch(e) {
    console.log(`✗ ${name}: ${e.message?.slice(0,70)}`);
  }
}
