# Paragraph Reader 0.1.2 使用说明

个人 Zotero 插件，基于 BiRead 扩展。提供 Zotero 内的段落重排阅读、自定义翻译 API，以及与原 PDF 关联的高亮和批注。当前翻译流程为英文 → 简体中文。

## 安装与使用

1. Zotero → 工具 → 插件 → 齿轮菜单 → 从文件安装插件。
2. 选择 `biread/build/ParagraphReader-0.1.2.xpi`。
3. 打开包含可选文字的 PDF，点击阅读器工具栏的 **段落阅读**。
4. 首次打开仅解析、重排和恢复本机译文缓存，不自动翻译全文。
5. 点击 **API 设置**，填写地址、密钥、模型，点击 **测试连接**，然后 **保存并使用**。
6. 直接点击原文段落翻译整段；再次点击隐藏中文，再点恢复显示已有译文（不重复请求 API）。也可选择 **翻译全文 / 继续**。选中文字、双击选词、点击高亮或链接不会触发翻译。

默认上下显示原文和译文。阅读设置中可以切换左右对照、调整阅读宽度、字号与行距；也可切回原 PDF 或 PDF 对照模式。本次开发未添加 PDF 导出功能。

## 自定义 API

支持 **Chat Completions 兼容协议**。可填基础地址（例如 `https://your-provider.example/v1`）或完整接口地址。模型填写服务商实际提供的模型 ID；本地免密服务可不填密钥。

- 测试连接使用当前输入内容，只发送固定的 `Hello` 测试句，不发送论文，也不保存配置。
- 保存后启用独立的 `customgpt1` 配置。翻译进行中需先暂停，等待当前请求结束后再保存。
- API 测试超时为 20 秒，翻译请求超时为 90 秒。可设置 1–3 路全文翻译并发。
- 段落翻译要求模型遵循指令返回带分句 ID 的 JSON；连接测试成功仅代表接口可返回文本。
- 翻译缓存按文档、段落、接口、模型及相关术语区分。点击段落会复用缓存；隐藏译文不删除译文或批注。失败后可再次点击段落重试。
- 密钥沿用上游的本机 Zotero 偏好设置存储方式，界面以密码框显示，没有额外加密层。分享调试文件前请检查内容。

## 高亮与批注

- 在重排原文中选中文字，使用高亮、划线或批注工具，会保存为原 PDF 对应的 Zotero 原生标注。
- 译文选区沿用 BiRead 的词组匹配与手动绑定机制。可靠匹配后与原文关联；无法可靠匹配时保留本地译文标记，并明确提示未同步原 PDF。
- 可通过标注中的 **绑定 / 重新关联词组** 手动确认对应范围。
- 原 PDF 中的标注更改通过 Zotero 通知同步到重排视图；重译后的旧译文偏移不会被盲目复用。
- 原生标注可随 Zotero 自身同步；本地译文标记、译文缓存和精确词组映射不承诺跨设备同步。

## 验证与范围

- TypeScript 检查通过，格式检查通过，ESLint 无错误（上游 `tabpanel.ts` 留有一条注释警告）。
- 7 项新增 API、单段翻译和缓存测试，以及 185 项上游测试通过。
- Edge 浏览器模拟环境验证上下／左右／窄屏布局、段落点击与译文显隐、API 草稿测试与保存行为。
- 浏览器模拟环境验证中英文标注、原 PDF 关联、批注重开与选区保持。
- **Zotero 10.0.8**：独立配置目录、合成 PDF、本地模拟 API；实际验证插件启动、工具栏、重排视图、HTTP 连接测试、段落翻译、原生高亮和批注保存。

尚未使用真实服务密钥测试外部服务。复杂双栏论文、图表和公式的重排仍取决于上游解析器的启发式识别；扫描 PDF 暂无 OCR。未全面验证清单声明的所有 Zotero 版本。BiRead 与原版 Translate for Zotero 的阅读器事件可能重叠，实际使用建议只启用其中一个翻译阅读插件。

## 开发与复现

在 `biread/` 中运行（Node.js 22+）：

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint:check
npm run test:personal
npm run test:bilingual
npm run build
```

浏览器测试需要 Playwright 与 Edge：

```sh
node test/personal-reader-dom.mjs <Playwright 模块的绝对路径>
node test/annotation-dom.mjs <Playwright 模块的绝对路径>
```

真实 Zotero 隔离测试：

```sh
node scripts/create-test-pdf.mjs
node scripts/test-personal-zotero.mjs <zotero.exe 的绝对路径>
```

测试运行器使用 `.scaffold/test/` 下的专用配置和文献库、生成的示例 PDF，以及 `127.0.0.1:23190` 上的模拟服务。不要将测试配置指向日常文献库。首次运行可能下载上游测试工具所需的 Chai/Mocha。

## 来源与独立身份

- 基础版本：BiRead `0.1.28-beta.5`，提交 `abace0025e513da77f55467583a719a8cb4005a9`。
- BiRead 的上游是 windingwind 的 zotero-pdf-translate。
- 插件 ID：`paragraph-reader@yexun.local`；偏好前缀：`extensions.zotero.ParagraphReader`。
- 缓存目录：Zotero 数据目录下的 `paragraph-reader-v1/`。
- 个人版本仓库：https://github.com/zyyu1/zotero-paragraph-reader 。安装包见该仓库 Releases。
- 安装清单使用保留的 `.invalid` 更新域名满足 Zotero 校验；关闭后台更新，只手动安装新版本。
- 保留上游版权和 **AGPL-3.0-or-later** 许可证，见根目录 `LICENSE`。
