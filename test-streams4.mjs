// Search zeno.fm for Islamic/Quran radio stations
const searches = [
  "https://api.zeno.fm/search/?q=quran+saudi&limit=10",
  "https://api.zeno.fm/search/?q=quran+egypt&limit=10",
  "https://api.zeno.fm/search/?q=quran+radio&limit=20",
  "https://api.zeno.fm/mounts/?q=quran&limit=20",
];

for (const url of searches) {
  console.log("\n--- " + url);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    console.log(res.status, text.slice(0, 800));
  } catch(e) {
    console.log("ERROR:", e.message);
  }
}
