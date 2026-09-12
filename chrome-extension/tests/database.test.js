"use strict";

require("fake-indexeddb/auto");

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../lib/database.js");

test.beforeEach(async () => {
  await database.clearClips();
  await database.deleteFileHandle();
  await database.deleteFileHandle("txt");
});

test("stores concurrent clips without losing entries", async () => {
  const clips = Array.from({ length: 40 }, (_, index) => ({
    id: `clip-${index}`,
    quote: `Excerpt ${index}`,
    createdAt: new Date(index * 1_000).toISOString(),
  }));

  await Promise.all(clips.map((clip) => database.putClip(clip)));

  assert.equal(await database.countClips(), clips.length);
  const stored = await database.getClips();
  assert.deepEqual(new Set(stored.map((clip) => clip.id)), new Set(clips.map((clip) => clip.id)));
});

test("uses clip IDs to make retries idempotent", async () => {
  await database.putClip({ id: "stable-id", quote: "First", createdAt: "2026-01-01T00:00:00Z" });
  await database.putClip({ id: "stable-id", quote: "Updated", createdAt: "2026-01-01T00:00:00Z" });

  assert.equal(await database.countClips(), 1);
  assert.equal((await database.getClips())[0].quote, "Updated");
});

test("stores and removes a default file handle", async () => {
  await database.putFileHandle({ name: "Notes.md" });
  assert.equal((await database.getFileHandle()).name, "Notes.md");

  await database.deleteFileHandle();
  assert.equal(await database.getFileHandle(), undefined);
});

test("TXT and legacy Markdown handles stay separate without changing the database", async () => {
  await database.putFileHandle({ name: "Notes.md" });
  await database.putFileHandle({ name: "Notes.txt" }, "txt");
  assert.equal((await database.getFileHandle("markdown")).name, "Notes.md");
  assert.equal((await database.getFileHandle("txt")).name, "Notes.txt");
  await database.deleteFileHandle("txt");
  assert.equal((await database.getFileHandle()).name, "Notes.md");
  assert.equal(await database.getFileHandle("txt"), undefined);
  await assert.rejects(database.getFileHandle("pdf"), /Invalid file format/);
});
