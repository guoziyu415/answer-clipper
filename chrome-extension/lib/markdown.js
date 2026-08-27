(function exposeMarkdown(root) {
  "use strict";

  const KINDS = new Set(["想法", "问题", "待验证", "重点"]);

  function normalizeClip(input) {
    if (!input || typeof input !== "object") {
      throw new TypeError("批注内容无效");
    }

    const quote = cleanText(input.quote, 50_000);
    if (!quote) {
      throw new TypeError("没有可保存的选中文字");
    }

    return {
      id: typeof input.id === "string" && input.id ? input.id : createId(),
      quote,
      annotation: cleanText(input.annotation, 20_000),
      kind: KINDS.has(input.kind) ? input.kind : "想法",
      tags: normalizeTags(input.tags),
      pageTitle: cleanText(input.pageTitle, 500),
      pageUrl: normalizeUrl(input.pageUrl),
      createdAt: normalizeDate(input.createdAt)
    };
  }

  function formatEntry(rawClip) {
    const clip = normalizeClip(rawClip);
    const title = firstMeaningfulLine(clip.annotation) || clip.kind;
    const quote = clip.quote
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join("\n");

    const lines = [
      `## ${escapeHeading(title).slice(0, 80)}`,
      "",
      quote,
      ""
    ];

    if (clip.annotation) {
      lines.push("**批注：**  ", clip.annotation, "");
    }

    lines.push(`**类型：** ${clip.kind}  `);
    if (clip.tags.length) {
      lines.push(`**标签：** ${clip.tags.join(" ")}  `);
    }
    if (clip.pageTitle) {
      lines.push(`**来源：** ${clip.pageTitle}  `);
    }
    if (clip.pageUrl) {
      lines.push(`**链接：** ${clip.pageUrl}  `);
    }
    lines.push(`**时间：** ${formatTimestamp(clip.createdAt)}`, "", "---", "", "");

    return lines.join("\n");
  }

  function formatDocument(clips) {
    const entries = Array.isArray(clips) ? clips.map(formatEntry).join("") : "";
    return `# Answer Clipper\n\n${entries}`;
  }

  function normalizeTags(tags) {
    const values = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
        ? tags.split(/[,，\s]+/)
        : [];

    return [...new Set(values
      .map((tag) => cleanText(tag, 100).replace(/^#+/, ""))
      .filter(Boolean)
      .map((tag) => `#${tag}`))]
      .slice(0, 30);
  }

  function cleanText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
  }

  function normalizeUrl(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function normalizeDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function firstMeaningfulLine(value) {
    return value.split(/\r?\n/).find((line) => line.trim())?.trim() || "";
  }

  function escapeHeading(value) {
    return value.replace(/^\s*#+\s*/, "").replace(/[\r\n]+/g, " ");
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    const parts = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
  }

  function createId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const api = { formatDocument, formatEntry, normalizeClip, normalizeTags };
  root.AnswerClipperMarkdown = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : globalThis);
