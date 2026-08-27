"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const extensionRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, "manifest.json"), "utf8"));

test("uses Manifest V3 with narrow permissions", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions.sort(), ["downloads", "storage"]);
  assert.deepEqual(manifest.content_scripts[0].matches.sort(), [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*"
  ]);
});

test("all files referenced by the manifest exist", () => {
  const paths = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    manifest.options_page,
    ...manifest.content_scripts.flatMap((script) => [...(script.js || []), ...(script.css || [])]),
    ...Object.values(manifest.icons)
  ];

  for (const relativePath of paths) {
    assert.ok(fs.existsSync(path.join(extensionRoot, relativePath)), `Missing ${relativePath}`);
  }
});

test("store description fits Chrome manifest limit", () => {
  assert.ok(manifest.description.length <= 132);
});
