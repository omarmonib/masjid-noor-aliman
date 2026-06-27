/* eslint-disable @typescript-eslint/no-require-imports */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "omar.monib.03@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin user already exists — skipping.");
    return;
  }

  const hashed = await bcrypt.hash("0113012314Omar", 12);

  await prisma.user.create({
    data: {
      name: "Omar Monib",
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
