"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const extensionRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, "manifest.json"), "utf8"));

test("supports web pages and limits Google API access to Docs", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions.sort(), ["downloads", "identity", "storage"]);
  assert.deepEqual(manifest.host_permissions, ["https://docs.googleapis.com/*"]);
  if (manifest.oauth2) assert.deepEqual(manifest.oauth2.scopes, ["https://www.googleapis.com/auth/documents"]);
  assert.deepEqual(manifest.content_scripts[0].matches.sort(), [
    "file:///*",
    "http://*/*",
    "https://*/*"
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

test("AnyAnnotate branding keeps package versions and installation configuration consistent", () => {
  assert.equal(manifest.name, "AnyAnnotate - Web Highlights & Notes");
  assert.equal(manifest.action.default_title, "AnyAnnotate");
  const pkg = require("../package.json");
  const lock = require("../package-lock.json");
  assert.equal(pkg.version, manifest.version);
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.packages[""].version, manifest.version);
  assert.equal(manifest.oauth2.client_id, "664499921933-uqk0om0t4hb0ps9b95pu9g76l8p8pngo.apps.googleusercontent.com");
  assert.equal(Object.hasOwn(manifest, "key"), false);
  for (const file of ["popup.html", "options.html", "google-setup.html"]) {
    const html = fs.readFileSync(path.join(extensionRoot, file), "utf8");
    assert.match(html, /<title>[^<]*AnyAnnotate[^<]*<\/title>/);
  }
});
