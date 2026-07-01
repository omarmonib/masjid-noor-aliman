import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) { console.error("❌ TURSO_DATABASE_URL not set"); process.exit(1); }

const db = createClient({ url, authToken: authToken ?? "" });
console.log("Connected to Turso:", url);

const ddl = [
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY,"name" TEXT,"email" TEXT NOT NULL UNIQUE,"emailVerified" DATETIME,"image" TEXT,"password" TEXT,"role" TEXT NOT NULL DEFAULT 'USER',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "Account" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"type" TEXT NOT NULL,"provider" TEXT NOT NULL,"providerAccountId" TEXT NOT NULL,"refresh_token" TEXT,"access_token" TEXT,"expires_at" INTEGER,"token_type" TEXT,"scope" TEXT,"id_token" TEXT,"session_state" TEXT,FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,UNIQUE("provider","providerAccountId"))`,
  `CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY,"sessionToken" TEXT NOT NULL UNIQUE,"userId" TEXT NOT NULL,"expires" DATETIME NOT NULL,FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "VerificationToken" ("identifier" TEXT NOT NULL,"token" TEXT NOT NULL UNIQUE,"expires" DATETIME NOT NULL,UNIQUE("identifier","token"))`,
  `CREATE TABLE IF NOT EXISTS "Post" ("id" TEXT NOT NULL PRIMARY KEY,"title" TEXT NOT NULL,"content" TEXT NOT NULL,"type" TEXT NOT NULL DEFAULT 'NEWS',"published" INTEGER NOT NULL DEFAULT 0,"authorId" TEXT NOT NULL,"publishedAt" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY ("authorId") REFERENCES "User"("id"))`,
  `CREATE TABLE IF NOT EXISTS "Donation" ("id" TEXT NOT NULL PRIMARY KEY,"amount" REAL NOT NULL,"status" TEXT NOT NULL DEFAULT 'PENDING',"userId" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS "Bookmark" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"type" TEXT NOT NULL,"refId" TEXT NOT NULL,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY ("userId") REFERENCES "User"("id"))`,
  `CREATE TABLE IF NOT EXISTS "Media" ("id" TEXT NOT NULL PRIMARY KEY,"titleAr" TEXT NOT NULL,"titleEn" TEXT,"type" TEXT NOT NULL,"url" TEXT NOT NULL,"speaker" TEXT,"description" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
];

console.log("Creating tables...");
for (const sql of ddl) {
  await db.execute(sql);
  const name = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
  console.log(`  ✓ ${name}`);
}

const email = "omar.monib.03@gmail.com";
const existing = await db.execute({ sql: `SELECT id FROM "User" WHERE email = ?`, args: [email] });
if (existing.rows.length > 0) {
  console.log("✅ Admin user already exists — skipping.");
} else {
  const { default: bcrypt } = await import("bcryptjs");
  const hashed = await bcrypt.hash("0113012314Omar", 12);
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  await db.execute({ sql: `INSERT INTO "User" (id,name,email,password,role,updatedAt) VALUES (?,?,?,?,'ADMIN',CURRENT_TIMESTAMP)`, args: [id,"Omar Monib",email,hashed] });
  console.log("✅ Admin user created.");
}

console.log("\n✅ Turso setup complete!");
db.close();
