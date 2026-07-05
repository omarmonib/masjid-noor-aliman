// prisma/link-remaining-speaker.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

const speaker = await db.execute({
  sql: `SELECT id FROM "Speaker" WHERE nameAr = ?`,
  args: ["الشيخ محمود فؤاد"],
});

if (speaker.rows.length === 0) {
  console.error(
    "❌ Speaker 'الشيخ محمود فؤاد' not found — check exact spelling",
  );
  process.exit(1);
}

const speakerId = speaker.rows[0].id;
console.log("Speaker id:", speakerId);

const result = await db.execute({
  sql: `UPDATE "Media" SET speakerId = ?, speaker = NULL WHERE speaker = ? AND speakerId IS NULL`,
  args: [speakerId, "محمود فؤاد"],
});

console.log(`✅ Linked ${result.rowsAffected} media rows`);
db.close();
