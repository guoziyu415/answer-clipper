(function exposeDatabase(root) {
  "use strict";

  const DB_NAME = "answer-clipper-files";
  const DB_VERSION = 2;
  const HANDLE_STORE = "handles";
  const CLIP_STORE = "clips";
  function handleKey(format = "markdown") {
    if (!["markdown", "txt"].includes(format)) throw new Error("Invalid file format.");
    return format === "txt" ? "default-txt" : "default-markdown";
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(HANDLE_STORE)) {
          database.createObjectStore(HANDLE_STORE);
        }
        if (!database.objectStoreNames.contains(CLIP_STORE)) {
          const clips = database.createObjectStore(CLIP_STORE, { keyPath: "id" });
          clips.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function runRequest(storeName, mode, operation) {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = operation(transaction.objectStore(storeName));
        let result;
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  function putClip(clip) {
    return runRequest(CLIP_STORE, "readwrite", (store) => store.put(clip));
  }

  async function putClips(clips) {
    if (!Array.isArray(clips) || clips.length === 0) return;
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(CLIP_STORE, "readwrite");
        const store = transaction.objectStore(CLIP_STORE);
        for (const clip of clips) store.put(clip);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  function getClips() {
    return runRequest(CLIP_STORE, "readonly", (store) => store.getAll());
  }

  function countClips() {
    return runRequest(CLIP_STORE, "readonly", (store) => store.count());
  }

  function clearClips() {
    return runRequest(CLIP_STORE, "readwrite", (store) => store.clear());
  }

  function getFileHandle(format) {
    return runRequest(HANDLE_STORE, "readonly", (store) => store.get(handleKey(format)));
  }

  function putFileHandle(handle, format) {
    return runRequest(HANDLE_STORE, "readwrite", (store) => store.put(handle, handleKey(format)));
  }

  function deleteFileHandle(format) {
    return runRequest(HANDLE_STORE, "readwrite", (store) => store.delete(handleKey(format)));
  }

  const api = {
    clearClips,
    countClips,
    deleteFileHandle,
    getClips,
    getFileHandle,
    putClip,
    putClips,
    putFileHandle,
  };
  root.AnswerClipperDatabase = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : globalThis);
