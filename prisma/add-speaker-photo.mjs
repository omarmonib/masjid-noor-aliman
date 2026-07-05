// prisma/add-speaker-photo.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

try {
  await db.execute(`ALTER TABLE "Speaker" ADD COLUMN "photoUrl" TEXT`);
  console.log("✓ Speaker.photoUrl added");
} catch (e) {
  console.log("⚠ column may already exist:", e.message);
}

console.log("✅ Done.");
db.close();
