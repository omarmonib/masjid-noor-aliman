async function search(q) {
  const res = await fetch(`https://radio.garden/api/search?q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return (data?.hits?.hits || []).map(h => {
    const page = h._source?.page;
    const id = page?.url?.split("/").pop();
    return { title: page?.title, country: page?.country?.title, stream: page?.stream, id };
  });
}

async function testStream(name, id) {
  const url = `https://radio.garden/api/ara/content/listen/${id}/channel.mp3`;
  try {
    const res = await fetch(url, {
      headers: { "Range": "bytes=0-1023", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "no-ct";
    console.log(`  ${res.status} | ${ct} | final: ${res.url.slice(0, 80)}`);
    return res.status === 200;
  } catch(e) {
    console.log(`  ERROR: ${e.message?.slice(0, 60)}`);
    return false;
  }
}

// Search specifically for Saudi Quran Radio (official SBC channel)
const queries = [
  "إذاعة القرآن الكريم السعودية",
  "saudi quran",
  "quran radio riyadh",
  "Saudi Broadcasting Quran",
  "SBC quran",
];

for (const q of queries) {
  console.log(`\n=== "${q}" ===`);
  const results = await search(q);
  for (const s of results.slice(0, 5)) {
    if (!s.country?.toLowerCase().includes("saudi") && 
        !s.title?.toLowerCase().includes("saudi") &&
        !s.title?.includes("السعود")) continue;
    console.log(`[${s.country}] ${s.title} | stream:${s.stream} | id:${s.id}`);
    await testStream(s.title, s.id);
  }
}

// Also directly test known Saudi Quran Radio Garden IDs
console.log("\n=== Direct Saudi ID tests ===");
const knownIds = [
  ["Saudi Quran 1", "hhcO5mrf"],
  ["Saudi Quran 2", "KgHzLkej"],
  ["Saudi Quran 3", "BDE3WVKJ"],
  ["Saudi Quran 4", "yqJmOBNK"],
  ["Saudi Quran 5", "9OJEqNsT"],
  ["Saudi Quran 6", "amPJBl9n"],
  ["Saudi Quran 7", "vXKmIBNK"],
  ["Saudi Quran 8", "pqJmOBNK"],
];
for (const [name, id] of knownIds) {
  process.stdout.write(`${name} (${id}): `);
  await testStream(name, id);
}
