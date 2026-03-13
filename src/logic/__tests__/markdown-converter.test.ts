import { describe, it, expect, beforeEach } from "vitest";
import { convertToMarkdown } from "../markdown-converter";

beforeEach(() => {
  // window.location.href をテスト用URLに設定
  Object.defineProperty(window, "location", {
    value: { href: "https://example.com/page" },
    writable: true,
  });
});

function setBody(html: string) {
  document.body.innerHTML = html;
}

// -------- convertToMarkdown(raw: true) --------

describe("convertToMarkdown(raw)", () => {
  it("見出しとテキストを変換する", () => {
    setBody("<main><h1>タイトル</h1><p>本文テキスト</p></main>");
    const result = convertToMarkdown(false);
    expect(result).toContain("# タイトル");
    expect(result).toContain("本文テキスト");
  });

  it("script / style / nav / header / footer / aside を除去する", () => {
    setBody(`
      <header>ヘッダー</header>
      <nav>ナビ</nav>
      <main><p>メインコンテンツ</p></main>
      <aside>サイドバー</aside>
      <footer>フッター</footer>
      <script>alert('x')</script>
      <style>body{}</style>
    `);
    const result = convertToMarkdown(false);
    expect(result).toContain("メインコンテンツ");
    expect(result).not.toContain("ヘッダー");
    expect(result).not.toContain("ナビ");
    expect(result).not.toContain("サイドバー");
    expect(result).not.toContain("フッター");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("body{}");
  });

  it("相対URLのリンクを絶対URLに変換する", () => {
    setBody('<main><a href="/about">About</a></main>');
    const result = convertToMarkdown(false);
    expect(result).toContain("[About](https://example.com/about)");
  });

  it("相対URLの画像を絶対URLに変換する", () => {
    setBody('<main><img src="/images/photo.png" alt="写真"></main>');
    const result = convertToMarkdown(false);
    expect(result).toContain("![写真](https://example.com/images/photo.png)");
  });

  it("セル内の連続スペースを1つにまとめる", () => {
    setBody(`
      <main>
        <table>
          <thead><tr><th>列A</th></tr></thead>
          <tbody><tr><td><span>foo  bar</span></td></tr></tbody>
        </table>
      </main>
    `);
    const result = convertToMarkdown(false);
    expect(result).not.toMatch(/foo {2,}bar/);
    expect(result).toContain("foo bar");
  });

  it("既にtheadがあるテーブルはそのまま変換する", () => {
    setBody(`
      <main>
        <table>
          <thead><tr><th>列A</th><th>列B</th></tr></thead>
          <tbody><tr><td>1</td><td>2</td></tr></tbody>
        </table>
      </main>
    `);
    const result = convertToMarkdown(false);
    expect(result).toContain("列A");
    expect(result).toContain("列B");
    expect(result).toContain("1");
  });

  it("theadが複数あるテーブルは余分なtheadを削除して変換する", () => {
    setBody(`
      <main>
        <table>
          <thead><tr><th>列A</th><th>列B</th></tr></thead>
          <thead><tr><th>補助A</th><th>補助B</th></tr></thead>
          <tbody><tr><td>1</td><td>2</td></tr></tbody>
        </table>
      </main>
    `);
    const result = convertToMarkdown(false);
    // 最初のtheadの内容は残る
    expect(result).toContain("列A");
    expect(result).toContain("列B");
    expect(result).toContain("1");
    // 余分なtheadの内容は削除される
    expect(result).not.toContain("補助A");
    expect(result).not.toContain("補助B");
    // GFMセパレータ行が1行だけ含まれることを確認
    const separators = result.match(/^\|(?:[ :]*-+[ :]*\|)+$/mg) ?? [];
    expect(separators).toHaveLength(1);
  });

  it("theadがないテーブルに空のheaderを挿入して変換する", () => {
    setBody(`
      <main>
        <table>
          <tbody><tr><td>A</td><td>B</td></tr></tbody>
        </table>
      </main>
    `);
    const result = convertToMarkdown(false);
    // GFMテーブルのseparator行が含まれることを確認
    expect(result).toMatch(/\|.*\|/);
    expect(result).toContain("A");
  });

  it("コードブロックをfenced形式で変換する", () => {
    setBody("<main><pre><code>const x = 1;</code></pre></main>");
    const result = convertToMarkdown(false);
    expect(result).toContain("```");
    expect(result).toContain("const x = 1;");
  });

  it("リストを変換する", () => {
    setBody("<main><ul><li>項目1</li><li>項目2</li></ul></main>");
    const result = convertToMarkdown(false);
    expect(result).toMatch(/^-\s+項目1$/m);
    expect(result).toMatch(/^-\s+項目2$/m);
  });
});

// -------- convertToMarkdown (Readability使用) --------

describe("convertToMarkdown", () => {
  it("Readabilityが抽出したコンテンツを変換する", () => {
    // Readabilityが動作するのに十分なHTMLを設定
    document.title = "テスト記事";
    setBody(`
      <html>
        <head><title>テスト記事</title></head>
        <body>
          <article>
            <h1>記事タイトル</h1>
            <p>これは記事の本文です。十分な長さのコンテンツが必要です。テスト用のダミーテキストを追加します。</p>
            <p>さらに追加のパラグラフ。Readabilityはある程度の量のコンテンツを必要とします。</p>
          </article>
        </body>
      </html>
    `);
    const result = convertToMarkdown();
    expect(result).toContain("記事タイトル");
  });

  it("Readabilityが失敗した場合はRawフォールバックを使用する", () => {
    // Readabilityが抽出できない最小限のHTML
    setBody("<p>シンプルなコンテンツ</p>");
    const result = convertToMarkdown();
    expect(result).toContain("シンプルなコンテンツ");
  });
});
