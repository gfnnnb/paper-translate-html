# paper-translate-html

一个用于翻译英文论文的 Codex Skill。提供论文 PDF 后，助手会翻译全文，保留原图表，生成可搜索、可复制的中文 PDF，也支持带目录和图片缩放功能的离线 HTML。

这套流程尽量减少翻译之外的重复工作：图片直接从原稿提取，复合图和表格按完整区域截图，排版和导出交给本地脚本。译稿完成后，修改字体、图片大小或分页都可以复用已有内容，不需要重新翻译或逐页生成图片。实际耗时取决于论文长度、扫描质量、图表复杂度和所用模型。

翻译由 Codex 完成，无需另配翻译 API。默认只保存最终 PDF，文件中不添加翻译说明、译者备注等额外内容。

## 翻译与排版

默认翻译所提供文件的正文和附录，保留章节编号、公式、数值和参考文献。正文与图注译为中文，图表内部的英文和颜色保持原样；高清图片保留原始分辨率，方便放大查看。

中文正文采用单栏排版，图片大小单独控制。例如，原稿中一张很窄的示意图，放进译文后仍按原来的宽度显示，不会自动撑满整页。超出正文宽度的大图按比例缩小。

字体、标题、粗体、斜体和颜色尽量跟随原稿，包括修订标记及链接的颜色。中文使用本机可用、风格接近的字体，例如用宋体搭配 Times。译文会自然分页，不要求与原稿逐页对应。

PDF 带有页码和章节书签。导出后检查内容是否完整、字体是否嵌入，以及图表小字、分页和页面边界是否正常。

## 安装

将仓库克隆到 Codex 的 skills 目录。若配置了 `CODEX_HOME`，使用其 `skills` 子目录；已有同名 Skill 时先备份或克隆到其他目录。

Windows PowerShell：

```powershell
git clone https://github.com/gfnnnb/paper-translate-html.git "$HOME/.codex/skills/paper-translate-html"
cd "$HOME/.codex/skills/paper-translate-html"
npm install
python -m pip install -r requirements.txt
npx playwright install chromium
```

macOS / Linux：

```bash
git clone https://github.com/gfnnnb/paper-translate-html.git ~/.codex/skills/paper-translate-html
cd ~/.codex/skills/paper-translate-html
npm install
python -m pip install -r requirements.txt
npx playwright install chromium
```

需要 Node.js 20+、Python 3.10+。可使用 Python 虚拟环境，或复用助手环境已有的依赖。已有兼容 Chromium／Edge 时可通过 `--browser-path` 指定，无需重复下载浏览器。安装后开启新的 Codex 会话。

## 使用

上传论文 PDF，然后告诉助手：

```text
使用 $paper-translate-html 完整翻译这篇论文，交付中文 PDF。
保留高清英文原图表，图片按原稿尺寸排版，字体和颜色尽量与原文一致。
```

也可明确要求 HTML 阅读版、指定章节或可编辑 Markdown；用户指定的范围和格式优先。

基本制作流程：

```bash
# 先由助手核对原文、提取图表并完成译稿
node scripts/build_html.cjs --input tmp/paper-zh.md --output tmp/paper-zh.html --style-css tmp/source-style.css
node scripts/export_pdf.cjs --input tmp/paper-zh.html --output output/paper-zh.pdf
npm test
```

`source-style.css` 由助手根据原稿编写，可省略以使用黑色衬线回退样式。图表提取脚本自动生成 `.layout.json` 保存原稿显示尺寸，构建和导出时沿用。完整参数及检查方法见 [工作流](references/workflow.md)。

## 阅读示例

下面的截图来自早期 HTML 阅读器，可以查看目录、原图表和图片放大的效果。PDF 的字体与排版会根据论文调整。演示文字和图表为仓库原创，数据均为虚构。

![早期 HTML 阅读器示例](docs/preview-reading.png)

[英文示例](examples/source-en.md) · [中文译稿](examples/demo-zh.md) · [HTML 演示](examples/demo-zh.html)

下载 HTML 文件后用浏览器打开；GitHub 文件页面显示的是源码。运行 `npm run demo` 可使用当前模板重新生成演示。重新生成预览截图可运行 `node scripts/capture_preview.cjs`。

## 使用限制

- 扫描版 PDF 需要额外 OCR 和复核，本仓库不内置 OCR。
- 复杂 LaTeX 公式需要另行配置并核验数学渲染，不能直接交付未渲染代码。
- 放大不能恢复低清原图缺失的细节。字体匹配受本机字体可用性限制。
- 术语、数值、内容完整性和局部强调仍需复核，脚本只负责提取与排版。
- 原始 Markdown 内的 HTML 显示为文本，远程或缺失图片会使构建失败。

## 许可

代码、文档及原创示例采用 [MIT License](LICENSE)。用户提供的论文、图表及其他第三方材料不包含在该许可中；再分发译文时须遵守相应授权。

