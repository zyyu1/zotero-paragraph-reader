# Zotero Reflow Translator

[English](#english) | [中文](#中文)

## English

Zotero Reflow Translator connects to custom APIs for PDF reflow reading, full-document translation, and paragraph translation. The current version is **0.1.10**. It also supports stacked bilingual text, translation visibility toggles, adjustable reading width, and linked annotations.

**[Download v0.1.10](https://github.com/zyyu1/zotero-reflow-translator/releases/tag/v0.1.10)** and select the `.xpi` file.

In Zotero, open **Tools → Plugins**, use the gear menu to select **Install Plugin From File**, and choose the downloaded XPI. Open a PDF, click **PDF 重排翻译 (Zotero Reflow Translator) → API 设置 (API Settings)**, and save your provider settings. You can then click a paragraph to translate it or choose full-document translation. The current translation workflow is English to Simplified Chinese; the reader interface is primarily in Chinese. See the [Chinese installation, API, and annotation guide](docs/PERSONAL_READER_ZH.md) for details.

This version uses its own add-on ID, preference namespace, and cache directory. It extends [BiRead](https://github.com/WWeiyiWang/BiRead), which is based on windingwind's zotero-pdf-translate. The reference commit is `abace0025e513da77f55467583a719a8cb4005a9`. Upstream copyright notices and the AGPL-3.0-or-later license are retained.

### Features

- Uses the dedicated reflow reader without adding a duplicate translation panel to Zotero's right item pane, avoiding conflicts with Translate for Zotero.

- Fix paragraph clicks after text selection; clicking a paragraph in source-only mode reveals its Chinese translation.

- Select text with the left mouse button to immediately open highlight, underline, and comment actions.

- Select the do-not-ask-again checkbox when confirming deletion to skip future deletion dialogs. Restore confirmation from Reading Settings at any time.

- Left-click an existing highlight, underline, or comment mark to open Delete and Edit Comment actions beside it.

- Gray and black annotation colors, with independent defaults: yellow highlights, black underlines, and gray comment marks.

- Paragraph reflow inside Zotero with stacked or side-by-side bilingual text and adjustable font size, line spacing, and reading width.
- Click a paragraph to translate it, click again to hide the Chinese translation, and click once more to restore it without another API request.
- Highlights and comments linked to the source PDF, with manual phrase binding when the translation cannot be matched reliably.
- Custom Chat Completions-compatible API endpoint, key, and model, with a connection test.

### Build

Use Node.js 22+ and run these commands from `biread/`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint:check
npm run test:personal
npm run test:bilingual
npm run build
```

The installation package is generated in `biread/build/`. Updates currently require manual installation.

### Attribution and license

This project retains the upstream AGPL-3.0-or-later license and copyright notices. See [LICENSE](LICENSE) and the archived [BiRead README](docs/development/BIREAD_REFERENCE_README.md).

---

## 中文

修复选中文字后段落点击被拦截的问题；“仅外文”模式下点击段落也会显示该段中文，再次点击可隐藏。

左键选中文字并松开鼠标，即可直接选择高亮、下划线或批注，无需右键。

### Zotero Reflow Translator · PDF 重排翻译

Zotero Reflow Translator 是一款通过连接自定义 API，在 Zotero 内实现 PDF 重排阅读、全文翻译和段落翻译的插件，当前版本 **0.1.10**。同时支持中英对照、译文显隐、阅读宽度调整和双语关联标注。

**[下载 v0.1.10 安装包](https://github.com/zyyu1/zotero-reflow-translator/releases/tag/v0.1.10)**（选择 `.xpi` 文件）。

请先阅读 [个人版安装、API 与标注使用说明](docs/PERSONAL_READER_ZH.md)。打开 PDF 后点击 **段落阅读 → API 设置**，保存配置后选择翻译单段或全文。

本版本采用独立 ID、配置前缀和缓存目录。基于 [BiRead](https://github.com/WWeiyiWang/BiRead) 扩展，其上游为 windingwind 的 zotero-pdf-translate。参考提交：`abace0025e513da77f55467583a719a8cb4005a9`。保留原项目版权和 AGPL-3.0-or-later 许可证。

## 功能

- 使用独立的 PDF 重排阅读视图，不再向 Zotero 右侧信息栏添加重复的翻译面板，避免与 Translate for Zotero 冲突。

- 删除确认弹窗支持“以后删除标注不再询问”；勾选并确认后永久记住，可在阅读设置中恢复删除确认。

- 左键点击已有高亮、下划线或批注标记，即可在旁边弹出“删除”和“编辑批注”。

- 增加灰色和黑色；高亮默认黄色，下划线默认黑色，标注（批注）默认灰色，各自独立记忆选择。

- Zotero 内上下／左右段落重排阅读，支持字号、行距及阅读宽度调整。
- 点击段落翻译整段，再点隐藏中文，再点恢复已有译文，不重复调用 API。
- 高亮和批注关联原 PDF；译文匹配不确定时可手动绑定。
- 自定义 Chat Completions 兼容 API 地址、密钥与模型，支持连接测试。

## 构建

在 `biread/` 目录使用 Node.js 22+：

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint:check
npm run test:personal
npm run test:bilingual
npm run build
```

安装包生成于 `biread/build/`。版本更新目前采用手动安装。

## 来源和许可证

保留上游的 AGPL-3.0-or-later 许可证与版权声明，见 [LICENSE](LICENSE)。参考项目原说明见 [BiRead README](docs/development/BIREAD_REFERENCE_README.md)。
