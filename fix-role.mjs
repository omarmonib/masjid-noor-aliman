import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN ?? "",
});

// Show all users
const users = await db.execute('SELECT id, email, role FROM "User"');
console.log("All users:", users.rows);

// Update all omar.monib emails to ADMIN
const result = await db.execute({
  sql: 'UPDATE "User" SET role = ? WHERE email = ?',
  args: ["ADMIN", "omar.monib.03@gmail.com"],
});
console.log("Updated rows:", result.rowsAffected);

// Verify
const verify = await db.execute('SELECT email, role FROM "User"');
console.log("After update:", verify.rows);

db.close();
