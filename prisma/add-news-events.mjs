import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

const ddl = [
  `CREATE TABLE IF NOT EXISTS "NewsPost" ("id" TEXT NOT NULL PRIMARY KEY,"titleAr" TEXT NOT NULL,"titleEn" TEXT,"summaryAr" TEXT,"summaryEn" TEXT,"contentAr" TEXT NOT NULL,"contentEn" TEXT,"category" TEXT NOT NULL DEFAULT 'news',"image" TEXT,"publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "MosqueEvent" ("id" TEXT NOT NULL PRIMARY KEY,"titleAr" TEXT NOT NULL,"titleEn" TEXT,"descriptionAr" TEXT,"descriptionEn" TEXT,"date" DATETIME NOT NULL,"time" TEXT NOT NULL,"location" TEXT NOT NULL,"category" TEXT NOT NULL DEFAULT 'other',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
];

for (const sql of ddl) {
  await db.execute(sql);
  console.log(`  ✓ ${sql.match(/"(\w+)"/)[1]}`);
}
console.log("✅ Done.");
db.close();
