# paper-translate-html

**论文全文翻译，原图原表保留，打开 HTML 就能读。**

一个面向 Codex 的论文翻译 Skill。把英文论文整理成清晰的中文阅读页，少一些复制粘贴，多一些专注阅读。

- **完整翻译**：默认覆盖正文与附录，保留章节、编号与学术含义。
- **图表保真**：保留英文原图原表，优先提取原始图片，复合图表高清截图。
- **阅读顺手**：章节导航、窄屏排版、点击放大与原始尺寸查看。
- **交付简单**：正文、图片和样式打包进一个 HTML，生成后可离线阅读。

翻译由 AI 助手完成，脚本负责提取图表和构建页面；本项目不是独立翻译模型，也无需单独配置翻译服务 API。

## 效果展示

以下使用仓库内原创的中英文演示材料，数据均为虚构，不代表真实论文或性能评测。

### 1 · 中文正文，清楚好读

![中文正文与章节目录](docs/preview-reading.png)

### 2 · 英文原图原表，细节保留

![保留高清英文表格](docs/preview-table.png)

### 3 · 点击放大，也适合窄屏阅读

![图片查看器](docs/preview-zoom.png)

<img src="docs/preview-mobile.png" width="320" alt="窄屏阅读效果">

下载 [演示 HTML](examples/demo-zh.html) 后在浏览器中打开即可体验。GitHub 文件页面展示的是源码。也可以查看 [英文原文](examples/source-en.md) 和 [中文译稿](examples/demo-zh.md)。

## 安装

将本仓库克隆到 Codex 的 skills 目录。若配置了 `CODEX_HOME`，使用其下的 `skills` 目录；否则使用以下默认位置。

Windows PowerShell：

```powershell
git clone https://github.com/gfnnnb/paper-translate-html.git "$HOME/.codex/skills/paper-translate-html"
cd "$HOME/.codex/skills/paper-translate-html"
npm install
python -m pip install -r requirements.txt
```

macOS / Linux：

```bash
git clone https://github.com/gfnnnb/paper-translate-html.git ~/.codex/skills/paper-translate-html
cd ~/.codex/skills/paper-translate-html
npm install
python -m pip install -r requirements.txt
```

已有同名 skill 时，请先备份或选择其他克隆目录。Python 依赖建议装入虚拟环境。需要 Node.js 20+ 和 Python 3.10+；仅查看生成的 HTML 不需要安装依赖。若助手环境已有相应运行时和依赖，可直接复用。重新打开 Codex 会话后调用 skill。

## 使用

向助手提供 PDF，并输入：

```text
使用 $paper-translate-html 完整翻译这篇论文，生成中文 HTML 阅读版。
保留高清英文原图和原表，支持点击放大。
```

也可以明确指定“只翻译方法部分”或“同时提供 Markdown”。本次请求的范围优先于默认全文翻译。

想先试一下页面构建：

```bash
npm run demo
npm test
```

打开 `examples/demo-zh.html` 即可。图表提取和自定义构建命令见 [工作流程](references/workflow.md)。

## 已知边界

- 扫描 PDF 需要额外 OCR 与核对，当前脚本不含 OCR。
- 普通 Unicode 公式可直接显示；复杂 LaTeX 公式需要额外配置数学排版并验证，当前构建器不自动渲染。
- 原图本身模糊时，放大不能恢复细节；嵌入大量高清图也会增大 HTML 体积。
- 原稿中的 HTML 作为文本显示。构建器拒绝远程图片和缺失图片，避免交付依赖外网或缺图的页面。
- AI 译稿仍需核对术语、数值和复杂版面。完整性检查是工作流程要求，不是脚本自动保证。

## 许可

项目代码、文档及原创演示使用 [MIT License](LICENSE)。该许可不涵盖用户提供的论文、图表或第三方材料；分享译稿前请确认相应权限。

