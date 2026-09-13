"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { formatDocument, formatEntry, formatTextDocument, formatTextEntry, getNoteContent, normalizeClip, normalizeTags } = require("../lib/markdown.js");

test("formats a compact note with the quote, one annotation, and a titled source link", () => {
  const markdown = formatEntry({
    quote: "First line\nSecond line",
    annotation: "My takeaway",
    kind: "Thought",
    tags: "plugin, #ChatGPT plugin",
    pageTitle: "Example chat",
    pageUrl: "https://chatgpt.com/c/123",
    createdAt: "2026-08-14T00:00:00+09:00"
  });

  assert.ok(markdown.startsWith("> First line\n> Second line\n\nMy takeaway\n\n"));
  assert.equal(markdown.split("My takeaway").length - 1, 1);
  assert.ok(markdown.includes("[Example chat](<https://chatgpt.com/c/123>)"));
  assert.doesNotMatch(markdown, /Category:|Tags:|Time:|Source:|Link:|Annotation:|^## /m);
});

test("quote-only notes do not invent a title or an empty annotation field", () => {
  const markdown = formatEntry({ quote: "Important content", kind: "Highlight" });
  assert.equal(markdown, "> Important content\n\n---\n\n");
});

test("rejects an empty quote", () => {
  assert.throws(() => normalizeClip({ quote: "  " }), /no selected text/);
});

test("normalizes and de-duplicates tags", () => {
  assert.deepEqual(normalizeTags("test, #test new-tag"), ["#test", "#new-tag"]);
});

test("preserves legacy categories during the English migration", () => {
  assert.equal(normalizeClip({ quote: "Legacy", kind: "\u91CD\u70B9" }).kind, "Highlight");
});

test("preserves HTTP, HTTPS, and local document source URLs", () => {
  for (const pageUrl of ["https://example.org/article", "http://localhost:8080/notes", "file:///tmp/reading.html"]) {
    assert.equal(normalizeClip({ quote: "text", pageUrl }).pageUrl, pageUrl);
  }
});

test("omits unsupported source URLs and embedded credentials", () => {
  for (const pageUrl of ["javascript:alert(1)", "data:text/html,test", "chrome://settings", "not a URL"]) {
    assert.equal(normalizeClip({ quote: "text", pageUrl }).pageUrl, "");
  }
  assert.equal(normalizeClip({ quote: "text", pageUrl: "https://user:secret@example.org/article" }).pageUrl, "https://example.org/article");
});

test("formats an export document", () => {
  const document = formatDocument([{ quote: "A", kind: "Thought" }, { quote: "B", kind: "Question" }]);
  assert.ok(document.startsWith("# AnyAnnotate\n\n"));
  assert.equal((document.match(/^---$/gm) || []).length, 2);
});

test("TXT exports use quotation marks and a short source title without field labels", () => {
  const clip = { quote: "First line\nSecond line 🙂", annotation: "My takeaway", kind: "Question",
    tags: "reading", pageTitle: "A page", pageUrl: "https://example.org/notes", createdAt: "2026-09-07T10:00:00Z" };
  const text = formatTextEntry(clip);
  assert.ok(text.startsWith("“First line\nSecond line 🙂”\n\nMy takeaway\n"));
  assert.ok(text.includes("— A page\n"));
  assert.doesNotMatch(text, /Category:|Tags:|Source:|Link:|Time:|Annotation:|https:\/\//);
  assert.doesNotMatch(text, /\*\*|^> |^## /m);
  const document = formatTextDocument([clip, { quote: "Another quote" }]);
  assert.ok(document.startsWith("AnyAnnotate\n\n"));
  assert.equal((document.match(/^--------------------$/gm) || []).length, 2);
  assert.doesNotMatch(formatTextEntry({ quote: "Just a quote" }), /Annotation:/);
});

test("hiding metadata never removes it from the saved clip or changes the source URL", () => {
  const pageUrl = "https://www.google.com/search?q=test&tracking=keep-this-exact-link";
  const clip = normalizeClip({ quote: "Keep this", annotation: "test", pageTitle: "Search results", pageUrl,
    kind: "Question", tags: "test", createdAt: "2026-09-07T11:06:16.710Z" });
  const before = structuredClone(clip);
  for (const format of [formatEntry, formatTextEntry]) {
    assert.doesNotMatch(format(clip), /Category:|Tags:|Time:|Question|2026-09-07/);
  }
  assert.deepEqual(clip, before);
  assert.ok(formatEntry(clip).includes(`[Search results](<${pageUrl}>)`));
});

test("source labels are short, single-line, and escaped for Markdown", () => {
  const clip = { quote: "A quote", pageTitle: "A [link] *title*\nwith <html>", pageUrl: "https://example.org/a(b)?q=1&x=2" };
  assert.ok(formatEntry(clip).includes("[A \\[link\\] \\*title\\* with \\<html\\>](<https://example.org/a(b)?q=1&x=2>)"));
  assert.equal(getNoteContent({ ...clip, pageTitle: "🙂".repeat(100) }).source.label, "🙂".repeat(79) + "…");
  assert.equal(getNoteContent({ ...clip, pageTitle: "https://example.org/a?long=params" }).source.label, "example.org");
  assert.equal(getNoteContent({ quote: "Local quote", pageUrl: "file:///tmp/notes.html" }).source.label, "Local document");
});
