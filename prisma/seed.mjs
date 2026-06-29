// Run with: node --loader ts-node/esm prisma/seed.ts
// OR just run this .mjs directly: node prisma/seed.mjs

import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let prisma;

if (tursoUrl) {
  const libsql = createClient({ url: tursoUrl, authToken: tursoToken ?? "" });
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
  console.log("Using Turso:", tursoUrl);
} else {
  prisma = new PrismaClient();
  console.log("Using local SQLite");
}

async function main() {
  const email = "omar.monib.03@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin user already exists — skipping.");
    return;
  }
  const hashed = await bcrypt.hash("0113012314Omar", 12);
  await prisma.user.create({
    data: { name: "Omar Monib", email, password: hashed, role: "ADMIN" },
  });
  console.log("✅ Admin user created successfully.");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
