(function answerClipperContentScript() {
  "use strict";

  if (window.top !== window || document.getElementById("answer-clipper-root")) return;

  const host = document.createElement("div");
  host.id = "answer-clipper-root";
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);

  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      :host { color-scheme: light dark; }
      * { box-sizing: border-box; }
      button, textarea, input, select { font: inherit; }
      .hidden { display: none !important; }
      #bubble {
        position: fixed; z-index: 2; border: 1px solid rgba(127,127,127,.25); border-radius: 999px;
        padding: 7px 12px; color: #fff; background: #18181b; box-shadow: 0 8px 28px rgba(0,0,0,.22);
        font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; cursor: pointer;
      }
      #bubble:hover { background: #27272a; transform: translateY(-1px); }
      #overlay {
        position: fixed; inset: 0; z-index: 3; display: grid; place-items: center; padding: 20px;
        background: rgba(0,0,0,.42); backdrop-filter: blur(2px);
        font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #dialog {
        width: min(560px, calc(100vw - 32px)); max-height: min(720px, calc(100vh - 32px)); overflow: auto;
        border-radius: 16px; padding: 20px; color: #18181b; background: #fff;
        box-shadow: 0 24px 80px rgba(0,0,0,.32);
      }
      h2 { margin: 0 0 14px; font-size: 18px; }
      label { display: block; margin: 12px 0 6px; font-weight: 650; }
      #quote { max-height: 132px; overflow: auto; white-space: pre-wrap; border-radius: 10px; padding: 10px 12px; background: #f4f4f5; color: #3f3f46; }
      textarea { width: 100%; min-height: 110px; resize: vertical; border: 1px solid #d4d4d8; border-radius: 10px; padding: 10px; color: #18181b; background: #fff; outline: none; }
      textarea:focus, input:focus, select:focus { border-color: #71717a; box-shadow: 0 0 0 3px rgba(113,113,122,.13); }
      .row { display: grid; grid-template-columns: 145px 1fr; gap: 10px; }
      input, select { width: 100%; height: 38px; border: 1px solid #d4d4d8; border-radius: 9px; padding: 0 9px; color: #18181b; background: #fff; outline: none; }
      #destination { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: #f4f4f5; }
      #destination-text { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #52525b; font-size: 12px; }
      .link-button { border: 0; padding: 3px; color: #2563eb; background: transparent; cursor: pointer; font-weight: 600; }
      #error { margin-top: 10px; color: #b91c1c; font-size: 13px; }
      .actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 18px; }
      .button { border: 1px solid #d4d4d8; border-radius: 9px; padding: 8px 12px; color: #27272a; background: #fff; cursor: pointer; font-weight: 600; }
      .button:hover { background: #f4f4f5; }
      .primary { border-color: #18181b; color: #fff; background: #18181b; }
      .primary:hover { background: #27272a; }
      .button:disabled { opacity: .55; cursor: wait; }
      #toast { position: fixed; left: 50%; bottom: 28px; z-index: 5; transform: translateX(-50%); max-width: min(520px, calc(100vw - 32px)); border-radius: 10px; padding: 10px 14px; color: #fff; background: #18181b; box-shadow: 0 10px 36px rgba(0,0,0,.3); font: 13px/1.4 -apple-system, sans-serif; }
      @media (prefers-color-scheme: dark) {
        #dialog { color: #f4f4f5; background: #18181b; }
        #quote, #destination { color: #d4d4d8; background: #27272a; }
        textarea, input, select { border-color: #52525b; color: #f4f4f5; background: #27272a; }
        .button { border-color: #52525b; color: #f4f4f5; background: #27272a; }
        .primary { border-color: #f4f4f5; color: #18181b; background: #f4f4f5; }
      }
    </style>
    <button id="bubble" class="hidden" type="button" aria-label="给选中文字添加批注">批注</button>
    <div id="overlay" class="hidden">
      <section id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">添加批注</h2>
        <label>选中的内容</label>
        <div id="quote"></div>
        <label for="annotation">批注</label>
        <textarea id="annotation" placeholder="写下你的想法、问题或待验证内容……"></textarea>
        <div class="row">
          <div>
            <label for="kind">类型</label>
            <select id="kind">
              <option>想法</option><option>问题</option><option>待验证</option><option>重点</option>
            </select>
          </div>
          <div>
            <label for="tags">标签</label>
            <input id="tags" placeholder="插件, ChatGPT" />
          </div>
        </div>
        <div id="destination">
          <span aria-hidden="true">📄</span>
          <span id="destination-text">正在读取保存设置…</span>
          <button id="configure" class="link-button" type="button">设置</button>
        </div>
        <div id="error" class="hidden" role="alert"></div>
        <div class="actions">
          <button id="cancel" class="button" type="button">取消</button>
          <button id="download" class="button" type="button">另存为 MD…</button>
          <button id="save" class="button primary" type="button">保存</button>
        </div>
      </section>
    </div>
    <div id="toast" class="hidden" role="status"></div>
  `;

  const ui = Object.fromEntries([
    "bubble", "overlay", "quote", "annotation", "kind", "tags", "destination-text",
    "configure", "error", "cancel", "download", "save", "toast"
  ].map((id) => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), root.getElementById(id)]));

  let captured = null;
  let toastTimer = null;

  document.addEventListener("mouseup", () => setTimeout(updateSelection, 10), true);
  document.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.key === "Shift") setTimeout(updateSelection, 10);
  }, true);
  document.addEventListener("mousedown", (event) => {
    if (!event.composedPath().includes(host)) hideBubble();
  }, true);
  window.addEventListener("scroll", hideBubble, { passive: true, capture: true });
  window.addEventListener("resize", hideBubble, { passive: true });

  ui.bubble.addEventListener("click", openDialog);
  ui.cancel.addEventListener("click", closeDialog);
  ui.overlay.addEventListener("mousedown", (event) => {
    if (event.target === ui.overlay) closeDialog();
  });
  ui.configure.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });
  ui.save.addEventListener("click", () => submit("default"));
  ui.download.addEventListener("click", () => submit("download"));
  ui.annotation.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit("default");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.overlay.classList.contains("hidden")) closeDialog();
  }, true);

  function updateSelection() {
    if (!ui.overlay.classList.contains("hidden")) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (!text || text.length > 50_000 || selection.rangeCount === 0) {
      hideBubble();
      return;
    }
    if (selection.anchorNode && host.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0);
    const rect = lastUsefulRect(range);
    if (!rect || (!rect.width && !rect.height)) {
      hideBubble();
      return;
    }

    captured = {
      quote: text,
      pageTitle: document.title.replace(/\s*[|–-]\s*ChatGPT\s*$/i, "").trim() || "ChatGPT",
      pageUrl: location.href,
      createdAt: new Date().toISOString()
    };
    positionBubble(rect);
  }

  function lastUsefulRect(range) {
    const rects = [...range.getClientRects()].filter((rect) => rect.width || rect.height);
    return rects.at(-1) || range.getBoundingClientRect();
  }

  function positionBubble(rect) {
    ui.bubble.classList.remove("hidden");
    const width = 58;
    const height = 34;
    const left = Math.min(Math.max(8, rect.right + 8), window.innerWidth - width - 8);
    const below = rect.bottom + 8;
    const top = below + height < window.innerHeight ? below : Math.max(8, rect.top - height - 8);
    ui.bubble.style.left = `${left}px`;
    ui.bubble.style.top = `${top}px`;
  }

  function hideBubble() {
    ui.bubble.classList.add("hidden");
  }

  async function openDialog() {
    if (!captured) return;
    hideBubble();
    ui.quote.textContent = captured.quote;
    ui.annotation.value = "";
    ui.tags.value = "";
    ui.kind.value = "想法";
    setError("");
    ui.overlay.classList.remove("hidden");
    ui.annotation.focus();
    await refreshDestination();
  }

  function closeDialog() {
    ui.overlay.classList.add("hidden");
    setBusy(false);
  }

  async function refreshDestination() {
    try {
      const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
      if (status.hasDefaultFile && status.filePermission === "granted") {
        ui.destinationText.textContent = `默认文件：${status.defaultFileName}`;
      } else if (status.hasDefaultFile) {
        ui.destinationText.textContent = `需要重新授权：${status.defaultFileName}`;
      } else {
        ui.destinationText.textContent = "未连接文件；保存时先进入插件本地收件箱";
      }
    } catch {
      ui.destinationText.textContent = "无法读取保存设置";
    }
  }

  async function submit(destination) {
    if (!captured) return;
    setBusy(true);
    setError("");
    try {
      const result = await chrome.runtime.sendMessage({
        type: "SAVE_CLIP",
        destination,
        clip: {
          ...captured,
          annotation: ui.annotation.value,
          kind: ui.kind.value,
          tags: ui.tags.value
        }
      });
      if (!result?.ok) throw new Error(result?.error || "保存失败");
      closeDialog();
      if (result.savedTo === "default") {
        showToast(`已保存到 ${result.fileName}`);
      } else if (result.savedTo === "download") {
        showToast("已保存到本地收件箱，并打开 MD 另存为");
      } else {
        showToast(result.message || "已保存到插件本地收件箱");
      }
    } catch (error) {
      setError(error.message || "保存失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  function setBusy(busy) {
    ui.save.disabled = busy;
    ui.download.disabled = busy;
  }

  function setError(message) {
    ui.error.textContent = message;
    ui.error.classList.toggle("hidden", !message);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.remove("hidden");
    toastTimer = setTimeout(() => ui.toast.classList.add("hidden"), 3200);
  }
})();
