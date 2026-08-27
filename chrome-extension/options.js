"use strict";

const DB_NAME = "answer-clipper-files";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const DEFAULT_HANDLE_KEY = "default-markdown";

const elements = {
  fileName: document.getElementById("file-name"),
  permission: document.getElementById("permission"),
  choose: document.getElementById("choose"),
  authorize: document.getElementById("authorize"),
  disconnect: document.getElementById("disconnect"),
  count: document.getElementById("count"),
  export: document.getElementById("export"),
  message: document.getElementById("message")
};

elements.choose.addEventListener("click", chooseFile);
elements.authorize.addEventListener("click", authorizeFile);
elements.disconnect.addEventListener("click", disconnectFile);
elements.export.addEventListener("click", exportInbox);
refresh();

async function chooseFile() {
  if (!("showSaveFilePicker" in window)) {
    showMessage("当前浏览器不支持连接默认文件，请使用“导出全部”或单条“另存为 MD”。", true);
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "AnswerClipper-Inbox.md",
      types: [{ description: "Markdown 文件", accept: { "text/markdown": [".md", ".markdown"] } }]
    });
    await ensureHeader(handle);
    await putHandle(handle);
    await chrome.storage.local.set({ defaultFileName: handle.name });
    await chrome.runtime.sendMessage({ type: "DEFAULT_FILE_CHANGED" });
    showMessage(`已连接 ${handle.name}`);
    await refresh();
  } catch (error) {
    if (error.name !== "AbortError") showMessage(error.message || "选择文件失败", true);
  }
}

async function authorizeFile() {
  const handle = await getHandle();
  if (!handle) return;
  const permission = await handle.requestPermission({ mode: "readwrite" });
  showMessage(permission === "granted" ? "文件权限已恢复" : "未获得文件写入权限", permission !== "granted");
  await refresh();
}

async function disconnectFile() {
  if (!confirm("断开默认文件？已写入文件和本地收件箱的批注不会被删除。")) return;
  await deleteHandle();
  await chrome.storage.local.remove("defaultFileName");
  showMessage("已断开默认文件");
  await refresh();
}

async function exportInbox() {
  const result = await chrome.runtime.sendMessage({ type: "EXPORT_INBOX" });
  showMessage(result.ok ? `正在导出 ${result.count} 条批注` : result.error, !result.ok);
}

async function refresh() {
  const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  elements.count.textContent = String(status.count || 0);
  elements.fileName.textContent = status.hasDefaultFile ? status.defaultFileName : "尚未连接文件";
  elements.permission.textContent = permissionLabel(status.filePermission);
  elements.permission.dataset.state = status.filePermission;
  elements.authorize.classList.toggle("hidden", !status.hasDefaultFile || status.filePermission === "granted");
  elements.disconnect.classList.toggle("hidden", !status.hasDefaultFile);
}

function permissionLabel(permission) {
  if (permission === "granted") return "可写入";
  if (permission === "prompt") return "需授权";
  if (permission === "denied") return "已拒绝";
  return "未设置";
}

async function ensureHeader(handle) {
  const file = await handle.getFile();
  if (file.size > 0) return;
  const writable = await handle.createWritable();
  try {
    await writable.write("# Answer Clipper\n\n");
  } finally {
    await writable.close();
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = operation(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

function getHandle() { return runTransaction("readonly", (store) => store.get(DEFAULT_HANDLE_KEY)); }
function putHandle(handle) { return runTransaction("readwrite", (store) => store.put(handle, DEFAULT_HANDLE_KEY)); }
function deleteHandle() { return runTransaction("readwrite", (store) => store.delete(DEFAULT_HANDLE_KEY)); }

function showMessage(message, isError = false) {
  elements.message.textContent = message;
  elements.message.classList.remove("hidden");
  elements.message.classList.toggle("error", isError);
  setTimeout(() => elements.message.classList.add("hidden"), 3600);
}
