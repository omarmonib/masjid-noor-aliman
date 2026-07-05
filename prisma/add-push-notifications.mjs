import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL not set");
  process.exit(1);
}

const db = createClient({ url, authToken: authToken ?? "" });

const ddl = [
  `CREATE TABLE IF NOT EXISTS "PushSubscription" ("id" TEXT NOT NULL PRIMARY KEY,"endpoint" TEXT NOT NULL,"p256dh" TEXT NOT NULL,"auth" TEXT NOT NULL,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint")`,
  `CREATE TABLE IF NOT EXISTS "NotificationLog" ("id" TEXT NOT NULL PRIMARY KEY,"eventKey" TEXT NOT NULL,"sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationLog_eventKey_key" ON "NotificationLog"("eventKey")`,
];

for (const sql of ddl) {
  await db.execute(sql);
  console.log(`  ✓ ${sql.slice(0, 60)}...`);
}

console.log("✅ Done.");
db.close();
