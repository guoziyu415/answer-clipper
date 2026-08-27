"use strict";

importScripts("lib/markdown.js");

const DB_NAME = "answer-clipper-files";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const DEFAULT_HANDLE_KEY = "default-markdown";
const INBOX_KEY = "inbox";
const MAX_LOCAL_CLIPS = 500;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ installedAt: new Date().toISOString() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: friendlyError(error) }));
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "SAVE_CLIP":
      return saveClip(message.clip, message.destination);
    case "EXPORT_INBOX":
      return exportInbox();
    case "GET_STATUS":
      return getStatus();
    case "OPEN_OPTIONS":
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    case "DEFAULT_FILE_CHANGED":
      return getStatus();
    default:
      return { ok: false, error: "未知操作" };
  }
}

async function saveClip(rawClip, destination = "default") {
  const clip = AnswerClipperMarkdown.normalizeClip(rawClip);
  const entry = AnswerClipperMarkdown.formatEntry(clip);
  await saveToLocalInbox(clip);

  if (destination === "download") {
    await downloadMarkdown(entry, createEntryFilename(clip), true);
    return { ok: true, savedLocally: true, savedTo: "download" };
  }

  const handle = await getFileHandle();
  if (!handle) {
    return {
      ok: true,
      savedLocally: true,
      savedTo: "inbox",
      needsFile: true,
      message: "已保存到插件本地收件箱。连接默认 MD 文件后可直接写入文件。"
    };
  }

  const permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    return {
      ok: true,
      savedLocally: true,
      savedTo: "inbox",
      needsPermission: true,
      message: "已保存到插件本地收件箱。请重新授权默认 MD 文件。"
    };
  }

  await appendToFile(handle, entry);
  return { ok: true, savedLocally: true, savedTo: "default", fileName: handle.name };
}

async function saveToLocalInbox(clip) {
  const stored = await chrome.storage.local.get(INBOX_KEY);
  const inbox = Array.isArray(stored[INBOX_KEY]) ? stored[INBOX_KEY] : [];
  inbox.push(clip);
  if (inbox.length > MAX_LOCAL_CLIPS) inbox.splice(0, inbox.length - MAX_LOCAL_CLIPS);
  await chrome.storage.local.set({ [INBOX_KEY]: inbox });
}

async function getStatus() {
  const [{ inbox = [], defaultFileName = "" }, handle] = await Promise.all([
    chrome.storage.local.get([INBOX_KEY, "defaultFileName"]),
    getFileHandle()
  ]);

  let filePermission = "none";
  if (handle) filePermission = await handle.queryPermission({ mode: "readwrite" });

  return {
    ok: true,
    count: Array.isArray(inbox) ? inbox.length : 0,
    defaultFileName: handle?.name || defaultFileName,
    hasDefaultFile: Boolean(handle),
    filePermission
  };
}

async function exportInbox() {
  const { inbox = [] } = await chrome.storage.local.get(INBOX_KEY);
  if (!Array.isArray(inbox) || !inbox.length) {
    return { ok: false, error: "本地收件箱还是空的" };
  }
  const markdown = AnswerClipperMarkdown.formatDocument(inbox);
  await downloadMarkdown(markdown, `AnswerClipper-Inbox-${dateStamp()}.md`, true);
  return { ok: true, count: inbox.length };
}

async function appendToFile(handle, text) {
  const file = await handle.getFile();
  const writable = await handle.createWritable({ keepExistingData: true });
  try {
    if (file.size === 0) {
      await writable.write("# Answer Clipper\n\n");
    } else {
      await writable.seek(file.size);
    }
    await writable.write(text);
  } finally {
    await writable.close();
  }
}

async function downloadMarkdown(markdown, filename, saveAs) {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
  await chrome.downloads.download({ url, filename, saveAs, conflictAction: "uniquify" });
}

function createEntryFilename(clip) {
  const title = (clip.annotation.split(/\r?\n/).find(Boolean) || clip.kind)
    .replace(/[\\/:*?"<>|]/g, "-")
    .slice(0, 36);
  return `AnswerClipper-${dateStamp()}-${title}.md`;
}

function dateStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFileHandle() {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(DEFAULT_HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

function friendlyError(error) {
  if (error?.name === "NotAllowedError") return "没有文件写入权限，请重新连接默认文件";
  if (error?.message) return error.message;
  return "保存失败，请重试";
}
