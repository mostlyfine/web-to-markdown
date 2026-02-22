function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

export function downloadMarkdown(title: string, content: string): void {
  const filename = sanitizeFilename(title) + ".md";

  // Base64エンコードしてdata: URLを使用 (MV3 Service Worker対応)
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/markdown;base64,${base64}`;

  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false,
  });
}
