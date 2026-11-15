// Usage: node test/personal-reader-dom.mjs <absolute-playwright-module-path>
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const built = await build({
  stdin: {
    contents: `export { BilingualView } from './src/bilingual/ui/bilingualView'; export { showApiSettings } from './src/bilingual/ui/apiSettings';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  globalName: "ReaderTest",
  plugins: [
    {
      name: "prefs",
      setup(b) {
        b.onResolve({ filter: /utils\/prefs$|^\.\/prefs$/ }, (a) => ({
          path: a.path,
          namespace: "mock",
        }));
        b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: `export const getPref=k=>window.prefs[k]; export const setPref=(k,v)=>window.prefs[k]=v; export const getPrefJSON=k=>JSON.parse(window.prefs[k]||'{}');`,
        }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 960 },
  });
  page.on("pageerror", (error) => console.error(error.message));
  await page.goto("about:blank");
  await page.evaluate(() => {
    window.prefs = {};
  });
  await page.addScriptTag({ content: built.outputFiles[0].text });
  await page.evaluate(() => {
    window.ui = new ReaderTest.BilingualView(
      document,
      () => {},
      () => {},
    );
    window.blocks = [
      {
        id: "title",
        kind: "title",
        pageIndex: 0,
        pageLabel: "1",
        source: "Reading papers, paragraph by paragraph",
        translation: "逐段阅读学术论文",
        segments: [],
      },
      {
        id: "p1",
        kind: "paragraph",
        pageIndex: 0,
        pageLabel: "1",
        source:
          "A clear reading order matters. This paragraph combines the original text with its translation while keeping the source location available for annotations.",
        translation:
          "清晰的阅读顺序很重要。本段将原文与译文对应展示，同时保留原始位置，便于高亮与批注。",
        segments: [],
      },
      {
        id: "p2",
        kind: "paragraph",
        pageIndex: 0,
        pageLabel: "1",
        source:
          "Translate only the paragraph you need, or continue through the entire document. A failed request leaves previous translations in place.",
        segments: [],
      },
    ];
    ui.showBlocks(blocks);
    window.translated = [];
    ui.onTranslateBlock = async (block) => {
      translated.push(block.id);
      block.translation = "仅翻译选中的段落。请求失败时会保留已有译文。";
      ui.update(block, []);
    };
    ui.primary.append(
      ui.button("API 设置", () =>
        ReaderTest.showApiSettings(
          ui,
          () => !window.busy,
          () => {
            window.saved = true;
          },
        ),
      ),
    );
    ui.status.textContent = "重排已就绪 · 单段翻译与 Zotero 标注关联";
  });
  assert.equal(
    await page.locator("#zpt-bilingual").getAttribute("data-layout"),
    "stacked",
  );
  const geometry = await page
    .locator('[data-block-id="p1"]')
    .evaluate((row) => {
      const a = row.querySelector(".bi-source").getBoundingClientRect();
      const b = row.querySelector(".bi-translation").getBoundingClientRect();
      return {
        stacked: b.top >= a.bottom,
        width: row.getBoundingClientRect().width,
      };
    });
  assert.equal(geometry.stacked, true);
  assert.ok(geometry.width <= 960);
  assert.equal(await page.locator(".pr-translate-block").count(), 0);
  const paragraph = page.locator('[data-block-id="p2"] .bi-source');
  const translation = page.locator('[data-block-id="p2"] .bi-translation');
  assert.equal(await translation.isVisible(), false);
  // A double-click selecting text must not request a translation.
  await paragraph.dblclick();
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => translated), []);
  await page.evaluate(() => document.getSelection().removeAllRanges());
  await paragraph.click();
  await page.waitForFunction(() => translated.length === 1);
  assert.deepEqual(await page.evaluate(() => translated), ["p2"]);
  assert.equal(await translation.isVisible(), true);
  await paragraph.click();
  await translation.waitFor({ state: "hidden" });
  await paragraph.click();
  await translation.waitFor({ state: "visible" });
  assert.deepEqual(await page.evaluate(() => translated), ["p2"]);
  // Existing highlighted text is an annotation control, not a toggle target.
  await paragraph.evaluate((cell) => {
    const mark = document.createElement("mark");
    mark.textContent = "Highlight";
    cell.append(mark);
  });
  await paragraph.locator("mark").click();
  await page.waitForTimeout(400);
  assert.equal(await translation.isVisible(), true);
  // Selecting a range and clicking must preserve the visible translation.
  await paragraph.evaluate((cell) => {
    const range = document.createRange();
    range.setStart(cell.firstChild, 0);
    range.setEnd(cell.firstChild, 8);
    document.getSelection().addRange(range);
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
  await page.waitForTimeout(400);
  assert.equal(await translation.isVisible(), true);
  await page.evaluate(() => document.getSelection().removeAllRanges());
  await paragraph.focus();
  await page.keyboard.press("Enter");
  await translation.waitFor({ state: "hidden" });
  // Annotation refreshes must not reopen a deliberately collapsed translation.
  await page.evaluate(() => ui.update(blocks[2], []));
  assert.equal(await translation.isVisible(), false);
  await page.keyboard.press("Enter");
  await translation.waitFor({ state: "visible" });
  assert.deepEqual(await page.evaluate(() => translated), ["p2"]);
  await page.getByRole("button", { name: "API 设置", exact: true }).click();
  await page
    .getByRole("textbox", { name: "API 地址", exact: true })
    .fill("https://test.example/v1");
  await page.getByLabel("API 密钥", { exact: true }).fill("test-only-key");
  await page
    .getByRole("textbox", { name: "模型名称", exact: true })
    .fill("test-model");
  await page.evaluate(() => {
    window.Zotero = {
      HTTP: {
        request: async () => ({
          response: { choices: [{ message: { content: "你好" } }] },
        }),
      },
    };
  });
  await page.getByRole("button", { name: "测试连接", exact: true }).click();
  await page
    .getByText("连接成功，模型返回了文本。点击保存后生效。", { exact: true })
    .waitFor();
  assert.equal(await page.evaluate(() => prefs.translateSource), undefined);
  await page.evaluate(() => {
    window.busy = true;
  });
  await page.getByRole("button", { name: "保存并使用", exact: true }).click();
  assert.equal(await page.evaluate(() => prefs.translateSource), undefined);
  await page.evaluate(() => {
    window.busy = false;
  });
  await page.getByRole("button", { name: "保存并使用", exact: true }).click();
  assert.equal(await page.evaluate(() => prefs.translateSource), "customgpt1");
  assert.equal(
    await page.evaluate(() => prefs["customGPT1.endPoint"]),
    "https://test.example/v1/chat/completions",
  );
  assert.equal(
    await page.getByLabel("API 密钥", { exact: true }).getAttribute("type"),
    "password",
  );
  await page.getByLabel("API 密钥", { exact: true }).fill("");
  await mkdir("build", { recursive: true });
  await page.screenshot({ path: "build/paragraph-reader-preview.png" });
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "显示设置", exact: true }).click();
  await page.getByLabel("段落布局", { exact: true }).selectOption("columns");
  assert.equal(
    await page.locator('[data-block-id="p1"]').evaluate((row) => {
      const a = row.querySelector(".bi-source").getBoundingClientRect();
      const b = row.querySelector(".bi-translation").getBoundingClientRect();
      return Math.abs(a.top - b.top) < 1 && b.left >= a.right;
    }),
    true,
  );
  await page.setViewportSize({ width: 600, height: 800 });
  assert.equal(
    await page.locator('[data-block-id="p1"]').evaluate((row) => {
      const a = row.querySelector(".bi-source").getBoundingClientRect();
      const b = row.querySelector(".bi-translation").getBoundingClientRect();
      return b.top >= a.bottom;
    }),
    true,
  );
  console.log(
    "Passed: stacked/columns/responsive reflow, selected paragraph only, draft API test, save while idle, secret masking.",
  );
} finally {
  await browser.close();
}
