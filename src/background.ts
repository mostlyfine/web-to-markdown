import { downloadMarkdown } from "./logic/file-downloader";

async function savePageAsMarkdown(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content.js"],
    });
  } catch (err) {
    console.warn("Script injection warning:", err);
  }

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
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-as-markdown",
    title: chrome.i18n.getMessage("contextMenuTitle"),
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-as-markdown" && tab?.id) {
    savePageAsMarkdown(tab.id);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) savePageAsMarkdown(tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-as-markdown") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) savePageAsMarkdown(tab.id);
});
