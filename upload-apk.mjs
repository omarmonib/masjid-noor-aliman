// upload-apk.mjs — run locally, not part of the app
import { put } from "@vercel/blob";
import { readFileSync } from "fs";

const file = readFileSync("./android/app-arm64-v8a-release-signed.apk");

const blob = await put("apk/masjid-noor-aliman.apk", file, {
  access: "public",
  contentType: "application/vnd.android.package-archive",
  addRandomSuffix: false, // keeps the URL stable across uploads
  allowOverwrite: true, // intentionally replacing the same blob each release
});

console.log("Uploaded to:", blob.url);
