import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

await db.execute(
  `CREATE TABLE IF NOT EXISTS "Speaker" ("id" TEXT NOT NULL PRIMARY KEY,"nameAr" TEXT NOT NULL,"nameEn" TEXT,"order" INTEGER NOT NULL DEFAULT 0,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
);
console.log("  ✓ Speaker table");

try {
  await db.execute(`ALTER TABLE "Media" ADD COLUMN "speakerId" TEXT`);
  console.log("  ✓ Media.speakerId column added");
} catch (e) {
  console.log("  ⚠ speakerId column may already exist:", e.message);
}

console.log("✅ Done.");
db.close();
