// Radio Browser is an open community radio directory with verified stream URLs
// API docs: https://api.radio-browser.info/
const base = "https://de1.api.radio-browser.info/json";

const searches = [
  `${base}/stations/search?name=quran+saudi&limit=5&hidebroken=true&order=clickcount&reverse=true`,
  `${base}/stations/search?name=quran+egypt&limit=5&hidebroken=true&order=clickcount&reverse=true`,
  `${base}/stations/search?name=quran+cairo&limit=5&hidebroken=true&order=clickcount&reverse=true`,
  `${base}/stations/search?tag=quran&country=saudi+arabia&limit=5&hidebroken=true&order=clickcount&reverse=true`,
  `${base}/stations/search?tag=quran&country=egypt&limit=5&hidebroken=true&order=clickcount&reverse=true`,
];

for (const url of searches) {
  console.log("\n---", url.split("?")[1]);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MasjidApp/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.log("  no results");
      continue;
    }
    for (const s of data.slice(0, 5)) {
      console.log(`  [${s.votes}v] ${s.name} | ${s.url_resolved}`);
    }
  } catch(e) {
    console.log("  ERROR:", e.message);
  }
}
