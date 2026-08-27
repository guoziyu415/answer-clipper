"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { formatDocument, formatEntry, normalizeClip, normalizeTags } = require("../lib/markdown.js");

test("formats a complete annotated clip", () => {
  const markdown = formatEntry({
    quote: "第一行\n第二行",
    annotation: "这是我的理解",
    kind: "想法",
    tags: "插件, #ChatGPT 插件",
    pageTitle: "Example chat",
    pageUrl: "https://chatgpt.com/c/123",
    createdAt: "2026-08-14T00:00:00+09:00"
  });

  assert.match(markdown, /^## 这是我的理解/m);
  assert.match(markdown, /> 第一行\n> 第二行/);
  assert.match(markdown, /\*\*标签：\*\* #插件 #ChatGPT/);
  assert.match(markdown, /https:\/\/chatgpt\.com\/c\/123/);
});

test("uses kind as title when annotation is empty", () => {
  const markdown = formatEntry({ quote: "重点内容", kind: "重点" });
  assert.match(markdown, /^## 重点/m);
  assert.doesNotMatch(markdown, /\*\*批注：\*\*/);
});

test("rejects an empty quote", () => {
  assert.throws(() => normalizeClip({ quote: "  " }), /没有可保存/);
});

test("normalizes and de-duplicates tags", () => {
  assert.deepEqual(normalizeTags("测试, #测试 新标签"), ["#测试", "#新标签"]);
});

test("ignores non-https source URLs", () => {
  assert.equal(normalizeClip({ quote: "text", pageUrl: "javascript:alert(1)" }).pageUrl, "");
});

test("formats an export document", () => {
  const document = formatDocument([{ quote: "A", kind: "想法" }, { quote: "B", kind: "问题" }]);
  assert.ok(document.startsWith("# Answer Clipper\n\n"));
  assert.equal((document.match(/^## /gm) || []).length, 2);
});
