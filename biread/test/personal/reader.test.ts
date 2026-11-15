import { pdfIntegration } from "../../src/bilingual/reader/pdfIntegration";
import { extractDocument } from "../../src/bilingual/parser/pdfTextExtractor";
import { AnnotationBridge } from "../../src/bilingual/annotations/zoteroAnnotationBridge";
import { translateProgressively } from "../../src/bilingual/translation/batching";
import { translationContext } from "../../src/bilingual/translation/providers";
import { setPref } from "../../src/utils/prefs";
import { setServiceSecret } from "../../src/utils/secret";
import {
  testCustomApi,
  validateCustomApi,
} from "../../src/bilingual/translation/customApi";

describe("Personal reader in isolated Zotero", function () {
  this.timeout(90000);
  it("starts, reflows a PDF, translates a paragraph and persists a native highlight", async function () {
    const running = (Zotero as any).ParagraphReader;
    assert.isOk(running, "independent plugin instance started");
    (globalThis as any).addon = running;
    (globalThis as any)._globalThis = Zotero.getMainWindow();
    const fixture = Zotero.Prefs.get(
      "paragraph-reader.test.fixture",
      true,
    ) as string;
    const attachment = await Zotero.Attachments.importFromFile({
      file: fixture,
    });
    const reader: any = await Zotero.Reader.open(attachment.id);
    const integration = await pdfIntegration(reader);
    const document = await extractDocument(
      integration.pdf,
      integration.identity,
      integration.fingerprint,
      () => {},
      () => false,
    );
    assert.isAbove(document.blocks.length, 1);
    const block = document.blocks.find((b) =>
      b.source.includes("Soil samples"),
    )!;
    assert.isOk(block, "source text extracted with positions");
    assert.isAbove(block.anchors.length, 0);
    const toolbar = reader._iframeWindow.document;
    const button = Array.from(toolbar.querySelectorAll("button")).find(
      (b: any) => b.textContent === "段落阅读",
    ) as HTMLButtonElement;
    assert.isOk(button, "reader toolbar registered");
    button.click();
    let frame: HTMLIFrameElement | null = null;
    for (let n = 0; n < 100; n++) {
      frame = integration.win.document.querySelector("#zpt-bilingual-frame");
      if (frame?.contentDocument?.querySelector("[data-paragraph-toggle]"))
        break;
      await Zotero.Promise.delay(100);
    }
    assert.isOk(
      frame?.contentDocument?.querySelector("[data-paragraph-toggle]"),
      "reflow UI rendered",
    );
    assert.equal(
      frame!
        .contentDocument!.querySelector("#zpt-bilingual")
        ?.getAttribute("data-layout"),
      "stacked",
    );
    setPref("translateSource", "customgpt1");
    const api = validateCustomApi({
      endpoint: "http://127.0.0.1:23190/paragraph/v1",
      model: "fixture-model",
      key: "fixture-key",
    });
    await testCustomApi(api);
    setPref("customGPT1.endPoint", api.endpoint);
    setPref("customGPT1.model", api.model);
    setPref("customGPT1.stream", false);
    setPref("customGPT1.apiFormat", "openai");
    setServiceSecret("customgpt1", api.key);
    const cell = frame!.contentDocument!.querySelector(
      `[data-block-id="${block.id}"] .bi-source`,
    ) as HTMLElement;
    const translatedCell = frame!.contentDocument!.querySelector(
      `[data-block-id="${block.id}"] .bi-translation`,
    ) as HTMLElement;
    cell.click();
    for (
      let n = 0;
      n < 100 && !translatedCell.textContent?.includes("土壤样本");
      n++
    )
      await Zotero.Promise.delay(100);
    assert.include(
      translatedCell.textContent!,
      "土壤样本",
      "click translated the paragraph",
    );
    cell.click();
    await Zotero.Promise.delay(400);
    assert.isTrue(translatedCell.classList.contains("pr-translation-hidden"));
    cell.click();
    await Zotero.Promise.delay(400);
    assert.isFalse(translatedCell.classList.contains("pr-translation-hidden"));
    const bridge = new AnnotationBridge(
      integration,
      () => [block],
      () => {},
    );
    try {
      await translateProgressively(
        [block],
        integration.identity,
        translationContext({}, "academic"),
        attachment.id,
        () => {},
        () => false,
      );
      assert.include(block.translation!, "土壤样本");
      await bridge.start();
      const start = block.source.indexOf("Soil samples");
      const key = await bridge.create(
        block,
        "source",
        start,
        start + "Soil samples".length,
        "#ffd400",
        "highlight",
      );
      assert.isFalse(
        bridge.isLocal(key),
        "source selection became Zotero annotation",
      );
      await bridge.comment(key, "Paragraph Reader integration test");
      const annotation = bridge.details(key);
      assert.isOk(annotation);
      assert.equal(
        annotation && annotation.annotationComment,
        "Paragraph Reader integration test",
      );
      assert.isAbove(attachment.getAnnotations().length, 0);
    } finally {
      bridge.dispose();
      reader.close();
    }
  });
});
