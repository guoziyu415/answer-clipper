"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const markdown = require("../lib/markdown.js");
const background = fs.readFileSync(path.join(__dirname, "../background.js"), "utf8");

function setup(initial = {}) {
  const storage = { ...initial };
  const clips = new Map();
  const handles = new Map();
  const downloads = [];
  const cloudWrites = [];
  const state = { downloadError: null, cloudError: null };
  const context = vm.createContext({
    importScripts() {},
    AnswerClipperMarkdown: markdown,
    AnswerClipperDatabase: {
      putClip: async (clip) => clips.set(clip.id, clip),
      putClips: async (list) => list.forEach((clip) => clips.set(clip.id, clip)),
      getClips: async () => [...clips.values()], countClips: async () => clips.size,
      clearClips: async () => clips.clear(),
      getFileHandle: async (format = "markdown") => handles.get(format),
    },
    AnswerClipperGoogleDocs: { createClient: () => ({
      configured: () => true,
      append: async (document, entries) => {
        if (state.cloudError) throw state.cloudError;
        cloudWrites.push({ document, entries });
        return { exported: entries.length, skipped: 0 };
      },
    }) },
    chrome: {
      identity: {},
      runtime: { id: "test", getURL: () => "chrome-extension://test/", onInstalled: { addListener() {} }, onMessage: { addListener() {} } },
      storage: { local: {
        get: async (keys) => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, storage[key]])),
        set: async (values) => Object.assign(storage, values),
        remove: async (keys) => (Array.isArray(keys) ? keys : [keys]).forEach((key) => delete storage[key]),
      } },
      downloads: { download: async (options) => {
        if (state.downloadError) throw state.downloadError;
        downloads.push(options);
        return downloads.length;
      } },
    },
  });
  vm.runInContext(background, context);
  const send = (message) => context.handleMessage(message, { id: "test", url: "chrome-extension://test/options.html" });
  return { storage, clips, handles, downloads, cloudWrites, state, send };
}

function fakeFile(name, initial = "") {
  let text = initial;
  return {
    name, text: () => text,
    queryPermission: async () => "granted",
    getFile: async () => ({ size: Buffer.byteLength(text) }),
    createWritable: async () => ({ write: async (value) => { text += value; }, seek: async () => {}, close: async () => {} }),
  };
}

const clip = { id: "clip-1", quote: "Keep this sentence 🙂", annotation: "A useful thought", pageUrl: "https://example.org/" };

test("the dialog's explicit Markdown choice overrides a Google default and is remembered", async () => {
  const app = setup({ saveDestination: "google", googleConnected: true, googleDocument: { title: "Notes" } });
  const result = await app.send({ type: "SAVE_CLIP", destination: "markdown", clip });
  assert.equal(result.savedTo, "download");
  assert.equal(app.storage.saveDestination, "markdown");
  assert.equal(app.cloudWrites.length, 0);
  assert.equal(app.clips.size, 1);
  assert.match(app.downloads[0].filename, /\.md$/);
  assert.match(decodeURIComponent(app.downloads[0].url), /^data:text\/markdown;charset=utf-8,> /);
  assert.equal(app.downloads[0].saveAs, true);
});

test("TXT uses a native save-location download and preserves the note when canceled", async () => {
  const app = setup();
  const result = await app.send({ type: "SAVE_CLIP", destination: "txt", clip });
  assert.equal(result.format, "txt");
  assert.equal(app.storage.saveDestination, "txt");
  assert.match(app.downloads[0].filename, /\.txt$/);
  assert.match(decodeURIComponent(app.downloads[0].url), /^data:text\/plain;charset=utf-8,“Keep this sentence/);
  assert.doesNotMatch(decodeURIComponent(app.downloads[0].url), /\*\*Annotation/);
  app.state.downloadError = new Error("User canceled");
  const canceled = await app.send({ type: "SAVE_CLIP", destination: "txt", clip });
  assert.equal(canceled.fileWriteFailed, true);
  assert.equal(canceled.savedLocally, true);
  assert.equal(app.clips.size, 1);
});

test("switching formats appends only to the matching connected file", async () => {
  const app = setup();
  const md = fakeFile("Notes.md", "Existing Markdown\n");
  const txt = fakeFile("Notes.txt");
  app.handles.set("markdown", md);
  app.handles.set("txt", txt);
  await app.send({ type: "SAVE_CLIP", destination: "txt", clip });
  assert.equal(md.text(), "Existing Markdown\n");
  assert.ok(txt.text().startsWith("Answer Clipper\n\n“Keep this sentence"));
  const previousText = txt.text();
  await app.send({ type: "SAVE_CLIP", destination: "markdown", clip: { ...clip, id: "clip-2" } });
  assert.equal(txt.text(), previousText);
  assert.match(md.text(), /> Keep this sentence 🙂\n\nA useful thought/);
  assert.equal(app.downloads.length, 0);
});

test("Google is selectable per annotation and never writes to a local file instead", async () => {
  const document = { title: "Chosen Google document" };
  const app = setup({ saveDestination: "markdown", googleConnected: true, googleDocument: document });
  app.handles.set("markdown", fakeFile("Notes.md"));
  const result = await app.send({ type: "SAVE_CLIP", destination: "google", clip });
  assert.equal(result.savedTo, "google");
  assert.equal(app.cloudWrites[0].document, document);
  assert.equal(app.storage.saveDestination, "google");
  assert.equal(app.handles.get("markdown").text(), "");
  app.state.cloudError = new Error("Offline");
  const failed = await app.send({ type: "SAVE_CLIP", destination: "google", clip });
  assert.equal(failed.googleWriteFailed, true);
  assert.equal(app.clips.size, 1);
  assert.match(failed.message, /local inbox.*Offline/);
});

test("missing Google setup retains the clip and reports a cloud failure", async () => {
  const app = setup();
  const result = await app.send({ type: "SAVE_CLIP", destination: "google", clip });
  assert.equal(result.googleWriteFailed, true);
  assert.equal(app.clips.size, 1);
  assert.equal(app.cloudWrites.length, 0);
  assert.equal(app.downloads.length, 0);
});

test("inbox-only saving and TXT batch export preserve all notes", async () => {
  const app = setup();
  await app.send({ type: "SAVE_CLIP", destination: "inbox", clip });
  await app.send({ type: "SAVE_CLIP", destination: "inbox", clip: { ...clip, id: "clip-2" } });
  assert.equal(app.downloads.length, 0);
  const result = await app.send({ type: "EXPORT_INBOX", format: "txt" });
  assert.equal(result.count, 2);
  assert.match(app.downloads[0].filename, /\.txt$/);
  assert.match(decodeURIComponent(app.downloads[0].url), /Answer Clipper\n\n“Keep this sentence/);
  assert.equal(app.clips.size, 2);
});

test("invalid destinations and export formats are rejected without side effects", async () => {
  const app = setup();
  await assert.rejects(app.send({ type: "SAVE_CLIP", destination: "pdf", clip }), /Invalid save destination/);
  await assert.rejects(app.send({ type: "EXPORT_INBOX", format: "html" }), /Invalid export format/);
  assert.equal(app.clips.size, 0);
  assert.equal(app.downloads.length, 0);
});

test("legacy defaults and file permission failures do not lose notes or break settings", async () => {
  const app = setup({ saveDestination: "local" });
  assert.equal((await app.send({ type: "GET_STATUS" })).saveDestination, "inbox");
  const file = fakeFile("Legacy.md");
  app.handles.set("markdown", file);
  assert.equal((await app.send({ type: "GET_STATUS" })).saveDestination, "markdown");
  assert.equal((await app.send({ type: "SAVE_CLIP", clip })).savedTo, "default");
  file.queryPermission = async () => { throw new Error("Permission unavailable"); };
  assert.equal((await app.send({ type: "GET_STATUS" })).files.markdown.permission, "denied");
  assert.equal((await app.send({ type: "SAVE_CLIP", destination: "markdown", clip })).fileWriteFailed, true);
  assert.equal(app.clips.size, 1);
});
