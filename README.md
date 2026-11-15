# Paragraph Reader

[English](#english) | [中文](#中文)

## English

Paragraph Reader is a personal Zotero plugin based on BiRead. The current version is **0.1.5**. It adds stacked bilingual paragraphs by default, click-to-translate and translation visibility toggles, adjustable reading width, and custom API endpoint, key, model, and connection settings inside the reader.

**[Download v0.1.5](https://github.com/zyyu1/zotero-paragraph-reader/releases/tag/v0.1.5)** and select the `.xpi` file.

In Zotero, open **Tools → Plugins**, use the gear menu to select **Install Plugin From File**, and choose the downloaded XPI. Open a PDF, click **段落阅读 (Paragraph Reader) → API 设置 (API Settings)**, and save your provider settings. You can then click a paragraph to translate it or choose full-document translation. The current translation workflow is English to Simplified Chinese; the reader interface is primarily in Chinese. See the [Chinese installation, API, and annotation guide](docs/PERSONAL_READER_ZH.md) for details.

This version uses its own add-on ID, preference namespace, and cache directory. It extends [BiRead](https://github.com/WWeiyiWang/BiRead), which is based on windingwind's zotero-pdf-translate. The reference commit is `abace0025e513da77f55467583a719a8cb4005a9`. Upstream copyright notices and the AGPL-3.0-or-later license are retained.

### Features

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

### Paragraph Reader · 段落阅读

这是基于 BiRead 的个人 Zotero 插件，当前版本 **0.1.5**。新增默认上下段落对照、点击段落翻译与译文显隐、阅读宽度设置，以及阅读器内的自定义 API 地址、密钥、模型和连接测试。

**[下载 v0.1.5 安装包](https://github.com/zyyu1/zotero-paragraph-reader/releases/tag/v0.1.5)**（选择 `.xpi` 文件）。

请先阅读 [个人版安装、API 与标注使用说明](docs/PERSONAL_READER_ZH.md)。打开 PDF 后点击 **段落阅读 → API 设置**，保存配置后选择翻译单段或全文。

本版本采用独立 ID、配置前缀和缓存目录。基于 [BiRead](https://github.com/WWeiyiWang/BiRead) 扩展，其上游为 windingwind 的 zotero-pdf-translate。参考提交：`abace0025e513da77f55467583a719a8cb4005a9`。保留原项目版权和 AGPL-3.0-or-later 许可证。

## 功能

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
