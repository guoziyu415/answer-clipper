"use strict";

const count = document.getElementById("count");
const file = document.getElementById("file");
const message = document.getElementById("message");
const clear = document.getElementById("clear");
const googleExport = document.getElementById("google-export");
googleExport.addEventListener("click", async () => {
  googleExport.disabled = true;
  message.textContent = "Appending annotations to Google Docs…";
  try {
    const result = await chrome.runtime.sendMessage({ type: "GOOGLE_EXPORT" });
    message.textContent = result.ok ? `Added ${result.exported}; ${result.skipped} already present.` : result.error;
  } catch {
    message.textContent = "Export failed. Your local notes are safe. Retry from Settings.";
  } finally {
    googleExport.disabled = false;
  }
});

document.getElementById("settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("export").addEventListener("click", async () => {
  const result = await chrome.runtime.sendMessage({ type: "EXPORT_INBOX", format: document.getElementById("export-format").value });
  message.textContent = result.ok ? `Exporting ${result.count} annotations` : result.error;
});

clear.addEventListener("click", async () => {
  const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  if (!status.count) {
    message.textContent = "The local inbox is already empty";
    return;
  }
  if (!confirm(`Permanently remove ${status.count} annotations from the local inbox?`)) return;
  const result = await chrome.runtime.sendMessage({ type: "CLEAR_INBOX" });
  message.textContent = result.ok ? "Local inbox cleared" : result.error;
  if (result.ok) await refresh();
});

async function refresh() {
  const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  const total = status.count || 0;
  count.textContent = `${total} ${total === 1 ? "clip" : "clips"}`;
  const destination = status.saveDestination;
  file.textContent = destination === "google"
    ? `Google Docs: ${status.google.document?.title || "Choose a document in Settings"}`
    : destination === "inbox" ? "Local inbox (export later)"
    : status.files[destination]?.name || (destination === "txt" ? "TXT — choose location on Save" : "Markdown — choose location on Save");
  googleExport.hidden = !(status.google.connected && status.google.document);
  file.title = file.textContent;
}

void refresh();
