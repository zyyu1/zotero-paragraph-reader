# Paragraph Reader · 段落阅读

这是基于 BiRead 的个人 Zotero 插件，当前版本 **0.1.2**。新增默认上下段落对照、点击段落翻译与译文显隐、阅读宽度设置，以及阅读器内的自定义 API 地址、密钥、模型和连接测试。

**[下载 v0.1.2 安装包](https://github.com/zyyu1/zotero-paragraph-reader/releases/tag/v0.1.2)**（选择 `.xpi` 文件）。

请先阅读 [个人版安装、API 与标注使用说明](docs/PERSONAL_READER_ZH.md)。打开 PDF 后点击 **段落阅读 → API 设置**，保存配置后选择翻译单段或全文。

本版本采用独立 ID、配置前缀和缓存目录。基于 [BiRead](https://github.com/WWeiyiWang/BiRead) 扩展，其上游为 windingwind 的 zotero-pdf-translate。参考提交：`abace0025e513da77f55467583a719a8cb4005a9`。保留原项目版权和 AGPL-3.0-or-later 许可证。

## 功能

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
