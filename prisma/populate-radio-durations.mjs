import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

const KEYWORDS = ["المنشاوي", "الباسط", "الحصري", "المعيقلي", "الدوسري"];

const res = await fetch("https://www.mp3quran.net/api/v3/reciters?language=ar");
const data = await res.json();
const reciters = data.reciters || [];

const tracks = [];
for (const keyword of KEYWORDS) {
  const candidates = reciters.filter((r) => r.name.includes(keyword));
  if (candidates.length === 0) continue;

  let best = null;
  for (const reciter of candidates) {
    for (const moshaf of reciter.moshaf || []) {
      const total = parseInt(moshaf.surah_total, 10) || 0;
      const bestTotal = best ? parseInt(best.moshaf.surah_total, 10) || 0 : -1;
      if (total > bestTotal) best = { reciter, moshaf };
    }
  }
  if (!best) continue;

  const surahIds = best.moshaf.surah_list
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 114);

  for (const surahId of surahIds) {
    tracks.push(`${best.moshaf.server}${String(surahId).padStart(3, "0")}.mp3`);
  }
}

console.log(`Found ${tracks.length} tracks. Probing sizes...`);

const CONCURRENCY = 10;
let done = 0;

async function probe(trackUrl) {
  const existing = await db.execute({
    sql: `SELECT url FROM "RadioTrackDuration" WHERE url = ?`,
    args: [trackUrl],
  });
  if (existing.rows.length > 0) return;

  try {
    const head = await fetch(trackUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });
    const len = parseInt(head.headers.get("content-length") || "0", 10);
    if (!len) return;
    const durationSeconds = (len * 8) / (128 * 1000); // assume 128kbps CBR
    await db.execute({
      sql: `INSERT OR IGNORE INTO "RadioTrackDuration" (url, durationSeconds) VALUES (?, ?)`,
      args: [trackUrl, durationSeconds],
    });
  } catch (e) {
    console.warn(`  ⚠ failed: ${trackUrl}`, e.message);
  }
}

for (let i = 0; i < tracks.length; i += CONCURRENCY) {
  const batch = tracks.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(probe));
  done += batch.length;
  process.stdout.write(`\r  ${done}/${tracks.length}`);
}

console.log("\n✅ Done.");
db.close();
