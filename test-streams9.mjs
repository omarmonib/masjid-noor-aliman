// Radio Garden has a search API - find correct station IDs
async function search(q) {
  const res = await fetch(`https://radio.garden/api/search?q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  const hits = data?.hits?.hits || [];
  return hits.slice(0, 8).map(h => ({
    title: h._source?.title,
    country: h._source?.country,
    id: h._source?.stream,
    placeId: h._source?.place?.id,
  }));
}

async function testStream(name, url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": "bytes=0-1023", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(7000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const icy = res.headers.get("icy-name") || "";
    console.log(`  ✓ ${res.status} | ${ct} | icy:${icy}`);
    return res.status === 200 && (ct.includes("audio") || ct.includes("mpeg"));
  } catch(e) {
    console.log(`  ✗ ${e.message?.slice(0,60)}`);
    return false;
  }
}

console.log("=== Searching: quran saudi ===");
const saudi = await search("quran saudi").catch(() => []);
for (const s of saudi) {
  console.log(`${s.title} | ${s.country} | id:${s.id}`);
  if (s.id) await testStream(s.title, `https://radio.garden/api/ara/content/listen/${s.id}/channel.mp3`);
}

console.log("\n=== Searching: quran egypt ===");
const egypt = await search("quran egypt").catch(() => []);
for (const s of egypt) {
  console.log(`${s.title} | ${s.country} | id:${s.id}`);
  if (s.id) await testStream(s.title, `https://radio.garden/api/ara/content/listen/${s.id}/channel.mp3`);
}

console.log("\n=== Searching: القرآن ===");
const arabic = await search("القرآن الكريم").catch(() => []);
for (const s of arabic) {
  console.log(`${s.title} | ${s.country} | id:${s.id}`);
  if (s.id) await testStream(s.title, `https://radio.garden/api/ara/content/listen/${s.id}/channel.mp3`);
}
