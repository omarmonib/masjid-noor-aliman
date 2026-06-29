// Direct approach: test known working Islamic radio stream URLs
// These are collected from app source codes and public radio directories

const streams = [
  // Saudi Quran Radio - various known endpoints
  ["Saudi 1", "https://www.spacitylive.com/saudi-quran"],
  ["Saudi 2", "http://stream.radiomonitor.com/content/saudi-quran-radio/"],
  ["Saudi 3", "https://edge.mixlr.com/channel/ibqka"],
  ["Saudi 4", "http://216.234.234.5:8068/stream"],
  ["Saudi 5", "https://radio.garden/api/ara/content/listen/BDE3WVKJ/channel.mp3"],
  ["Saudi 6", "https://radio.garden/api/ara/content/listen/hhcO5mrf/channel.mp3"],
  ["Saudi 7", "https://radio.garden/api/ara/content/listen/KgHzLkej/channel.mp3"],
  // Egypt Quran Radio  
  ["Egypt 1", "https://radio.garden/api/ara/content/listen/amPJBl9n/channel.mp3"],
  ["Egypt 2", "https://radio.garden/api/ara/content/listen/5XP2YNiN/channel.mp3"],
  ["Egypt 3", "https://radio.garden/api/ara/content/listen/9OJEqNsT/channel.mp3"],
  // Radio Garden is a major platform with no origin restrictions
  ["RadioGarden Saudi Quran", "https://radio.garden/api/ara/content/listen/BDE3WVKJ/channel.mp3"],
];

for (const [name, url] of streams) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "Range": "bytes=0-2048",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      },
      signal: AbortSignal.timeout(7000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const icy = res.headers.get("icy-name") || res.headers.get("x-icy-name") || "";
    const loc = res.headers.get("location") || "";
    console.log(`✓ ${name}: ${res.status} | ${ct} | icy:${icy} | loc:${loc.slice(0,60)}`);
  } catch(e) {
    console.log(`✗ ${name}: ${e.message?.slice(0,70)}`);
  }
}
