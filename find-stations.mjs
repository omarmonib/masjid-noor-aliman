// Step 1: see raw Radio Garden search response structure
const res = await fetch("https://radio.garden/api/search?q=quran+saudi", {
  headers: { "User-Agent": "Mozilla/5.0" },
  signal: AbortSignal.timeout(8000),
});
const data = await res.json();

// Print full structure to understand it
console.log("STATUS:", res.status);
console.log("TOP KEYS:", Object.keys(data));
console.log("FULL (first 3000 chars):");
console.log(JSON.stringify(data, null, 2).slice(0, 3000));
