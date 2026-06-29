async function search(q) {
  const res = await fetch(`https://radio.garden/api/search?q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return (data?.hits?.hits || []).map(h => {
    const page = h._source?.page;
    // Extract station ID from URL: /listen/station-name/ID
    const id = page?.url?.split("/").pop();
    return {
      title: page?.title,
      country: page?.country?.title,
      city: page?.place?.title,
      stream: page?.stream,
      id,
      url: page?.url,
    };
  });
}

async function testStream(name, id) {
  const url = `https://radio.garden/api/ara/content/listen/${id}/channel.mp3`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": "bytes=0-1023", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "no-ct";
    const finalUrl = res.url;
    console.log(`  ${res.status} | ${ct} | final: ${finalUrl.slice(0, 80)}`);
  } catch(e) {
    console.log(`  ERROR: ${e.message?.slice(0, 60)}`);
  }
}

// Search for Saudi Quran Radio
console.log("=== Saudi Quran ===");
const saudi = await search("إذاعة القرآن السعودية");
for (const s of saudi.slice(0, 6)) {
  console.log(`[${s.country}] ${s.title} | stream:${s.stream} | id:${s.id}`);
  if (s.stream !== "radiojar.com") await testStream(s.title, s.id);
}

console.log("\n=== Saudi Quran (english) ===");
const saudi2 = await search("saudi quran radio");
for (const s of saudi2.slice(0, 6)) {
  console.log(`[${s.country}] ${s.title} | stream:${s.stream} | id:${s.id}`);
  if (s.stream !== "radiojar.com") await testStream(s.title, s.id);
}

console.log("\n=== Egypt Quran ===");
const egypt = await search("إذاعة القرآن الكريم مصر");
for (const s of egypt.slice(0, 6)) {
  console.log(`[${s.country}] ${s.title} | stream:${s.stream} | id:${s.id}`);
  if (s.stream !== "radiojar.com") await testStream(s.title, s.id);
}

// Also test Cairo station even though it's radiojar — to see what final URL radio.garden redirects to
console.log("\n=== Testing Cairo radiojar via radio.garden redirect ===");
await testStream("Cairo Quran", "GQxvGBNK");
