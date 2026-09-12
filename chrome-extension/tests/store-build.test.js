"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../manifest.json");
const config = require("../../config/chrome-web-store.json");
const { prepareStoreManifest } = require("../../scripts/lib/chrome-store-manifest.cjs");

test("store builds use their own verified identity without changing the local installation", () => {
  const original = structuredClone(manifest);
  const store = prepareStoreManifest(manifest, config);
  assert.equal(store.key, config.publicKey);
  assert.equal(store.oauth2.client_id, config.oauthClientId);
  assert.notEqual(store.oauth2.client_id, manifest.oauth2.client_id);
  assert.deepEqual(store.oauth2.scopes, manifest.oauth2.scopes);
  assert.deepEqual(store.permissions, manifest.permissions);
  assert.deepEqual(store.host_permissions, manifest.host_permissions);
  assert.equal(store.version, manifest.version);
  assert.deepEqual(manifest, original);
  assert.equal(Object.hasOwn(manifest, "key"), false);
});

test("store builds reject an absent, malformed, or development OAuth client", () => {
  for (const oauthClientId of [null, "", "not-a-client", manifest.oauth2.client_id]) {
    assert.throws(() => prepareStoreManifest(manifest, { ...config, oauthClientId }), /OAuth client/);
  }
});

test("store builds reject keys that do not identify the intended store item", () => {
  assert.throws(() => prepareStoreManifest(manifest, { ...config, extensionId: "invalid" }), /extension ID/);
  assert.throws(() => prepareStoreManifest(manifest, { ...config, publicKey: "" }), /public key/);
  assert.throws(() => prepareStoreManifest(manifest, { ...config, publicKey: "AAAA" }));
  assert.throws(() => prepareStoreManifest(manifest, { ...config, extensionId: "a".repeat(32) }), /does not match/);
});
