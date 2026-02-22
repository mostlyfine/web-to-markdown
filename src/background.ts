import { downloadMarkdown } from "./logic/file-downloader";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const tabId = tab.id;

  // content.ts を動的注入
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content.js"],
    });
  } catch (err) {
    // 既に注入済み、またはCSP違反の場合はそのまま続行
    console.warn("Script injection warning:", err);
  }

  // content.ts へ変換リクエストを送信
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_MARKDOWN",
    });

    if (response?.markdown) {
      downloadMarkdown(response.title ?? "page", response.markdown);
    }
  } catch (err) {
    console.error("Failed to get markdown:", err);
  }
});
