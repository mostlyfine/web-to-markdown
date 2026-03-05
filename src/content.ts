import { convertToMarkdown } from "./logic/markdown-converter";

// 重複実行防止フラグ
declare global {
  interface Window {
    markdownConverterInitialized?: boolean;
  }
}

if (!window.markdownConverterInitialized) {
  window.markdownConverterInitialized = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_MARKDOWN") {
      const markdown = convertToMarkdown();
      sendResponse({ title: document.title, markdown });
    } else if (message.type === "GET_MARKDOWN_RAW") {
      const markdown = convertToMarkdown(false);
      sendResponse({ title: document.title, markdown });
    }
    return true;
  });
}
