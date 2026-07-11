// upload-apk.mjs — run locally with: node upload-apk.mjs
import { put } from "@vercel/blob";
import fs from "fs";

const file = fs.readFileSync("./public/downloads/masjid-noor-aliman.apk");
const blob = await put("apk/masjid-noor-aliman.apk", file, {
  access: "public",
  contentType: "application/vnd.android.package-archive",
  token: process.env.BLOB_READ_WRITE_TOKEN, // from your Vercel project settings
  addRandomSuffix: false, // keep a stable, predictable URL
});

console.log("Uploaded:", blob.url);
