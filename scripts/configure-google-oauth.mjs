import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientId = process.argv[2] || "";
if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
  console.error("Usage: node scripts/configure-google-oauth.mjs CLIENT_ID.apps.googleusercontent.com");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "chrome-extension", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
manifest.oauth2 = { client_id: clientId, scopes: ["https://www.googleapis.com/auth/documents"] };
fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("Google OAuth configured. Reload the extension and select Connect Google in Settings.");
