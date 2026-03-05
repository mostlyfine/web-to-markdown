import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function normalizeTables(container: Document | HTMLElement): void {
  const doc = container instanceof Document ? container : container.ownerDocument ?? document;

  container.querySelectorAll("table").forEach((table) => {
    // テーブル内のセルからHTMLタグを除去してテキストのみを残す
    table.querySelectorAll("td, th").forEach((cell) => {
      if (cell.children.length > 0) {
        const tmp = doc.createElement("div");
        tmp.innerHTML = cell.innerHTML.replace(/<[^>]+>/g, "\n");
        let text = (tmp.textContent ?? "")
          .split("\n")
          .map((line) => line.trim().replace(/ {2,}/g, " "))
          .filter((line) => line.length > 0)
          .join("\n");
        cell.textContent = text.replace(/\n+/g, "<br>");
      }
    });

    // 事前に空のtheadを挿入してデータ行を保持する
    if (!table.querySelector("thead")) {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const colCount = firstRow.querySelectorAll("td, th").length;
        const thead = doc.createElement("thead");
        const headerRow = doc.createElement("tr");
        for (let i = 0; i < colCount; i++) {
          headerRow.appendChild(doc.createElement("th"));
        }
        thead.appendChild(headerRow);
        table.insertBefore(thead, table.firstChild);
      }
    }
  });
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function buildTurndownService(): TurndownService {
  const baseUrl = window.location.href;

  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  turndown.use(gfm);

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

  return turndown;
}

export function convertToMarkdown(useReadability: boolean = true): string {
  const turndown = buildTurndownService();

  if (useReadability) {
    // Readabilityでメインコンテンツを抽出
    const docClone = document.cloneNode(true) as Document;
    normalizeTables(docClone);
    const reader = new Readability(docClone);
    const article = reader.parse();

    if (article?.content) {
      return turndown.turndown(article.content);
    }
  }

  // 不要な要素を除去してbodyを変換
  const bodyClone = document.body.cloneNode(true) as HTMLElement;
  normalizeTables(bodyClone);
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
