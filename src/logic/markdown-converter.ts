import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export function convertToMarkdown(): string {
  const baseUrl = window.location.href;

  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  turndown.use(gfm);

  // 相対URLを絶対URLに変換するカスタムルール
  turndown.addRule("absoluteLinks", {
    filter: "a",
    replacement(content, node) {
      const el = node as HTMLAnchorElement;
      const href = resolveUrl(el.getAttribute("href") ?? "", baseUrl);
      const title = el.title ? ` "${el.title}"` : "";
      return `[${content}](${href}${title})`;
    },
  });

  turndown.addRule("absoluteImages", {
    filter: "img",
    replacement(_content, node) {
      const el = node as HTMLImageElement;
      const src = resolveUrl(el.getAttribute("src") ?? "", baseUrl);
      const alt = el.alt ?? "";
      const title = el.title ? ` "${el.title}"` : "";
      return `![${alt}](${src}${title})`;
    },
  });

  // Readabilityでメインコンテンツを抽出
  const docClone = document.cloneNode(true) as Document;
  const reader = new Readability(docClone);
  const article = reader.parse();

  if (article?.content) {
    return turndown.turndown(article.content);
  }

  // フォールバック: 不要な要素を除去してbodyを変換
  const bodyClone = document.body.cloneNode(true) as HTMLElement;
  const removeSelectors = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
  ];
  for (const selector of removeSelectors) {
    bodyClone.querySelectorAll(selector).forEach((el) => el.remove());
  }

  return turndown.turndown(bodyClone.innerHTML);
}
