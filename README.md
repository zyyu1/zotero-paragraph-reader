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

Zotero Reflow Translator 是一款 Zotero PDF 重排翻译插件。它通过连接自定义 API，在 Zotero 内提供 PDF 重排阅读、全文翻译和段落翻译。

当前版本：**v0.1.10**

**[下载 ZoteroReflowTranslator-0.1.10.xpi](https://github.com/zyyu1/zotero-reflow-translator/releases/download/v0.1.10/ZoteroReflowTranslator-0.1.10.xpi)**

### 主要功能

#### PDF 重排与翻译

- 在 Zotero 内按段落重新排列 PDF 正文。
- 支持上下对照和左右对照布局。
- 支持全文翻译，也可以点击单个段落进行翻译。
- 点击已翻译段落可隐藏中文，再次点击可恢复，不会重复调用 API。
- 支持字号、行距和阅读宽度调整。

#### 自定义 API

- 自定义 API 地址、密钥和模型名称。
- 兼容 Chat Completions 格式的翻译服务。
- 提供连接测试，保存配置后即可翻译。
- 译文保存在本地缓存中，重新打开文献时优先读取缓存。

#### 高亮、下划线与批注

- 左键选中文字并松开鼠标，直接显示“高亮、下划线、批注”菜单。
- 高亮默认黄色，下划线默认黑色，批注默认灰色。
- 左键点击已有标记，可直接删除或编辑批注。
- 支持将双语标注关联至原 PDF；无法可靠匹配时可手动重新绑定词组。
- 删除确认支持“以后不再询问”，并可在阅读设置中恢复。

#### 插件兼容

- 使用独立的 PDF 重排阅读视图。
- 不在 Zotero 右侧信息栏添加重复翻译面板，避免与 Translate for Zotero 冲突。

### 安装

1. 下载上方 `.xpi` 安装包。
2. 在 Zotero 中打开 **工具 → 插件**。
3. 点击右上角齿轮，选择 **从文件安装插件**。
4. 选择下载的安装包，然后完全退出并重新启动 Zotero。

从旧版本覆盖安装时，插件 ID、API 设置、偏好配置和翻译缓存都会保留。

### 快速使用

1. 在 Zotero 中打开一篇 PDF。
2. 打开 **PDF 重排翻译 → API 设置**。
3. 填写 API 地址、密钥和模型，然后测试并保存。
4. 进入重排阅读视图，点击段落翻译单段，或选择全文翻译。

翻译会消耗所配置服务的 API 额度。已有缓存的译文、译文显隐、高亮、下划线和批注不会重复消耗翻译 API。

更完整的配置与标注说明请参阅[中文使用说明](docs/PERSONAL_READER_ZH.md)。

### 开发与构建

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

### 来源与许可证

本项目基于 [BiRead](https://github.com/WWeiyiWang/BiRead) 扩展，其上游为 windingwind 的 zotero-pdf-translate。参考提交为 `abace0025e513da77f55467583a719a8cb4005a9`。

项目保留上游版权声明并采用 AGPL-3.0-or-later 许可证，详见 [LICENSE](LICENSE)。参考项目原说明见 [BiRead README](docs/development/BIREAD_REFERENCE_README.md)。
