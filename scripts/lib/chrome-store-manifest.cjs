"use strict";

const { createHash, createPublicKey } = require("node:crypto");

function prepareStoreManifest(developmentManifest, config) {
  if (!/^[a-p]{32}$/.test(config.extensionId || "")) throw new Error("Invalid Chrome Web Store extension ID.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(config.publicKey || "")) throw new Error("Missing or invalid Chrome Web Store public key.");
  const der = Buffer.from(config.publicKey, "base64");
  createPublicKey({ key: der, format: "der", type: "spki" });
  const extensionId = createHash("sha256").update(der).digest("hex").slice(0, 32)
    .replace(/[0-9a-f]/g, (digit) => String.fromCharCode(97 + parseInt(digit, 16)));
  if (extensionId !== config.extensionId) throw new Error("The public key does not match the Chrome Web Store extension ID.");
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(config.oauthClientId || "")) {
    throw new Error("Configure a store-specific Google OAuth client before packaging.");
  }
  if (config.oauthClientId === developmentManifest.oauth2?.client_id) {
    throw new Error("The store build must not reuse the development OAuth client.");
  }
  const manifest = structuredClone(developmentManifest);
  manifest.key = config.publicKey;
  manifest.oauth2 = { ...manifest.oauth2, client_id: config.oauthClientId };
  return manifest;
}

module.exports = { prepareStoreManifest };
