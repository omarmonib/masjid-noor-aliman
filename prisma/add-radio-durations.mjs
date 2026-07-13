import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

await db.execute(
  `CREATE TABLE IF NOT EXISTS "RadioTrackDuration" ("url" TEXT NOT NULL PRIMARY KEY,"durationSeconds" REAL NOT NULL,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
);
console.log("  ✓ RadioTrackDuration table");
console.log("✅ Done.");
db.close();
