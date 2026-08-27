"use strict";

const count = document.getElementById("count");
const file = document.getElementById("file");
const message = document.getElementById("message");

document.getElementById("settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("export").addEventListener("click", async () => {
  const result = await chrome.runtime.sendMessage({ type: "EXPORT_INBOX" });
  message.textContent = result.ok ? `正在导出 ${result.count} 条批注` : result.error;
});

chrome.runtime.sendMessage({ type: "GET_STATUS" }).then((status) => {
  count.textContent = `${status.count || 0} 条`;
  file.textContent = status.hasDefaultFile ? status.defaultFileName : "未设置";
  file.title = file.textContent;
});
