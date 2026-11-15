// node test/annotation-dom.mjs <playwright-module-directory>
import { build } from "esbuild";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const built = await build({
  stdin: {
    contents: `export {BilingualView} from './src/bilingual/ui/bilingualView'; export {AnnotationControls} from './src/bilingual/ui/annotationControls'; export {PageLayout} from './src/bilingual/ui/pageLayout';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  globalName: "Audit",
  plugins: [
    {
      name: "host",
      setup(b) {
        b.onResolve(
          { filter: /utils\/prefs|alignment\/installLocalModel/ },
          (a) => ({ path: a.path, namespace: "stub" }),
        );
        b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({
          contents: a.path.includes("prefs")
            ? "export const getPref=()=>undefined;export const setPref=()=>{};"
            : "export const ensureLocalModel=async()=>{};export const installLocalModel=async()=>{};",
        }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1250, height: 950 },
  });
  await page.route("**/*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("https://biread.test/");
  await page.addScriptTag({ content: built.outputFiles[0].text });
  const result = await page.evaluate(async () => {
    const check = (value, label) => {
      if (!value) throw Error(label);
    };
    const files = new Map(),
      items = new Map(),
      painted = new Map();
    let serial = 0;
    window._globalThis = window;
    window.PathUtils = { join: (...p) => p.join("/") };
    window.IOUtils = {
      exists: async (p) => files.has(p),
      readJSON: async (p) => structuredClone(files.get(p)),
      writeJSON: async (p, v) => files.set(p, structuredClone(v)),
      makeDirectory: async () => {},
    };
    window.Components = { utils: { cloneInto: (v) => v } };
    const integration = {
      identity: "annotation-dom",
      item: {
        id: 1,
        libraryID: 1,
        isEditable: () => true,
        getAnnotations: () => [...items.values()],
      },
      win: window,
      reader: {
        setAnnotations: async (list) =>
          list.forEach((i) =>
            painted.set(i.key, JSON.parse(i.annotationPosition)),
          ),
        unsetAnnotations: async (keys) =>
          keys.forEach((k) => painted.delete(k)),
        navigate: async ({ annotationID }) =>
          check(
            painted.has(annotationID),
            "Native mark must exist before navigation",
          ),
      },
    };
    window.Zotero = {
      DataDirectory: { dir: "test" },
      getMainWindow: () => window,
      Prefs: { get: () => undefined },
      logError: (e) => {
        throw e;
      },
      Notifier: {
        registerObserver: () => "observer",
        unregisterObserver: () => {},
      },
      DataObjectUtilities: { generateKey: () => "KEY" + ++serial },
      Items: { getByLibraryAndKey: (_, key) => items.get(key) },
      Annotations: {
        saveFromJSON: async (_, a) => {
          const item = {
            key: a.key,
            parentID: 1,
            annotationType: a.type,
            annotationColor: a.color,
            annotationComment: a.comment,
            annotationText: a.text,
            annotationPosition: JSON.stringify(a.position),
            isAnnotation: () => true,
            isEditable: () => true,
            saveTx: async () => {},
          };
          items.set(a.key, item);
          return item;
        },
      },
    };
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(integration.identity),
        ),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    files.set(`test/paragraph-reader-v1/glossary-${hash}.json`, {
      energy: "能量",
      stable: "稳定",
    });
    const token = "$BIREAD_MATH_p1-g2$";
    const block = {
      id: "sample",
      kind: "paragraph",
      pageIndex: 0,
      pageLabel: "1",
      pageHeight: 800,
      pageBox: [0, 0, 600, 800],
      fontSize: 12,
      source: `The formula ${token} preserves energy and remains stable.`,
      translation: `公式 ${token} 保持能量并保持稳定。`,
      inlineMath: [{ id: "math", token, rect: [90, 690, 115, 710] }],
      anchors: [],
      segments: [],
      links: [
        {
          label: "[12]",
          targetPageIndex: 3,
          targetPoint: [50, 600],
          preview: "12. Author. Study.",
        },
      ],
    };
    block.anchors = Array.from({ length: block.source.length }, (_, i) => ({
      start: i,
      end: i + 1,
      charIndex: i,
      pageIndex: 0,
      rect: [30 + i * 5, 700, 35 + i * 5, 712],
    }));
    block.segments = [
      {
        id: "s",
        sourceStart: 0,
        sourceEnd: block.source.length,
        source: block.source,
        translationStart: 0,
        translationEnd: block.translation.length,
      },
    ];
    const ui = new Audit.BilingualView(
      document,
      () => {},
      () => {},
    );
    ui.showBlocks([block]);
    let visited;
    ui.onReference = (link) => {
      visited = link;
    };
    const reference = ui.root.querySelector(".bi-reference-links");
    check(
      reference && reference.textContent.includes("12. Author. Study."),
      "Reference preview missing",
    );
    reference.querySelector("button").click();
    check(
      visited.targetPageIndex === 3 && visited.targetPoint[1] === 600,
      "Reference destination lost",
    );
    check(
      !reference.closest(".bi-text"),
      "Reference controls must not alter text-selection offsets",
    );
    let controls = new Audit.AnnotationControls(ui, integration, () => [block]);
    await controls.bridge.start();
    const cell = (side) => ui.root.querySelector(`[data-side=${side}]`);
    const select = (side, phrase) => {
      const walker = document.createTreeWalker(
        cell(side),
        NodeFilter.SHOW_TEXT,
      );
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const at = node.textContent.indexOf(phrase);
        if (at < 0) continue;
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + phrase.length);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        return;
      }
      throw Error("Selection phrase missing " + phrase);
    };
    const palette = (label) =>
      ui.settings.querySelector(`select[aria-label="${label}"]`);
    check(
      palette("高亮颜色").value === "#ffd400",
      "Highlight must default to yellow",
    );
    check(
      palette("下划线颜色").value === "#000000",
      "Underline must default to black",
    );
    check(
      palette("标注颜色").value === "#808080",
      "Comment must default to gray",
    );
    for (const label of ["高亮颜色", "下划线颜色", "标注颜色"]) {
      const options = [...palette(label).options].map((option) => option.value);
      check(
        options.includes("#808080") && options.includes("#000000"),
        "Gray/black missing from palette",
      );
    }
    const originalCreate = controls.create;
    const calls = [];
    controls.create = async (...args) => calls.push(args);
    const toolbarButton = (label) =>
      [...ui.modeRow.querySelectorAll("button")].find(
        (button) => button.textContent === label,
      );
    toolbarButton("高亮").click();
    toolbarButton("划线").click();
    select("source", "stable");
    cell("source").dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    const commentAction = [
      ...document.querySelectorAll('[role="menuitem"]'),
    ].find((button) => button.textContent === "批注");
    check(commentAction, "Comment action missing");
    commentAction.click();
    check(
      calls[0][0] === "#ffd400" &&
        calls[1][0] === "#000000" &&
        calls[2][0] === "#808080" &&
        calls[2][3] === true,
      "Actions must use independent defaults",
    );
    palette("高亮颜色").value = "#000000";
    toolbarButton("高亮").click();
    toolbarButton("划线").click();
    check(
      calls[3][0] === "#000000" &&
        calls[4][0] === "#000000" &&
        palette("标注颜色").value === "#808080",
      "Custom color must not change other tool defaults",
    );
    controls.create = originalCreate;
    select("translation", "能量");
    const expected = block.translation.indexOf("能量");
    check(
      ui.selection().start === expected,
      "Pending formula shifts selection",
    );
    ui.update(block, []);
    check(
      ui.selection().start === expected && getSelection().toString() === "能量",
      "Refresh destroys selection",
    );
    ui.showImage(
      {
        id: "image",
        captionID: "math",
        pageIndex: 0,
        rect: block.inlineMath[0].rect,
        src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
      },
      [block],
    );
    check(
      ui.selection().start === expected && getSelection().toString() === "能量",
      "Image loading destroys selection",
    );
    await controls.create("#000000", "underline");
    const first = [...items.values()][0];
    check(
      first?.annotationText === "energy" &&
        first.annotationType === "underline" &&
        first.annotationColor === "#000000",
      "Chinese underline not written to PDF",
    );
    check(
      cell("source").querySelector("mark")?.textContent === "energy",
      "English underline missing",
    );
    check(
      cell("translation").querySelector("mark")?.textContent === "能量",
      "Chinese underline missing",
    );
    select("source", "stable");
    await controls.bridge.refresh();
    check(
      getSelection().toString() === "stable",
      "Notifier destroys selection beside math",
    );
    await controls.create("#ffd400", "highlight");
    check(cell("translation").textContent.includes("稳定"), "Translation lost");
    check(
      [...cell("translation").querySelectorAll("mark")].some(
        (m) => m.textContent === "稳定",
      ),
      "English highlight not linked to Chinese",
    );
    check(painted.size === 2, "Both PDF marks must be painted");
    const layout = new Audit.PageLayout(ui, () => [block]);
    ui.root.dataset.readingMode = "compare";
    ui.setContinuousReading(false);
    layout.set(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    check(
      [...cell("translation").querySelectorAll("mark")].length === 2,
      "Compare mode lost marks",
    );
    select("translation", "稳定");
    check(
      ui.selection().start === block.translation.indexOf("稳定"),
      "Compare mode selected wrong offsets",
    );
    layout.set(false);
    layout.dispose();
    controls.dispose();
    controls = new Audit.AnnotationControls(ui, integration, () => [block]);
    await controls.bridge.start();
    check(
      controls.bridge.mappings(block).length === 2,
      "Reopened mappings missing",
    );
    check(
      cell("translation").querySelectorAll("mark").length === 2,
      "Reopened highlights missing",
    );
    select("source", "formula");
    await controls.create("#808080", "highlight", undefined, true);
    check(
      [...items.values()].some((item) => item.annotationColor === "#808080"),
      "Gray comment mark not persisted",
    );
    check(
      ui.inspector.querySelector('select[aria-label="Annotation colour"]')
        .value === "#808080",
      "Annotation editor must retain gray",
    );
    controls.dispose();
    ui.dispose();
    return {
      passed: [
        "pending-formula offsets",
        "selection survives refresh",
        "selection survives image load",
        "Chinese underline → English and PDF",
        "English highlight → Chinese and PDF",
        "PDF comparison mode",
        "reopen persistence",
        "reference preview and exact destination",
        "independent yellow/black/gray defaults and palettes",
        "black underline and gray comment persistence",
      ],
      canonicalAnnotations: items.size,
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
