# 使用资源

## 准备源文件与图表

先阅读原论文，包括双栏顺序、页内图表边界和附录。Markdown、HTML、图片及核验截图放在本次任务专用临时目录；输出目录仅保存最终 PDF。使用通用文件名，例如 `figure-04.png`、`table-02.png`。以下路径和页码仅展示语法，实际调用必须来自当前文档。

Python 依赖：`pypdf`、`pdfplumber`、`Pillow`，区域渲染还需要 pdfplumber 的渲染依赖。使用环境已有依赖，缺失时只补需要的包。

```text
python scripts/pdf_asset.py list paper.pdf --page 7
python scripts/pdf_asset.py image paper.pdf --page 7 --key /Im4 --output assets/figure-04.png
python scripts/pdf_asset.py crop paper.pdf --page 3 --bbox 313 399 513 683 --dpi 400 --output assets/table-02.png
```

页码从 1 开始。`--bbox` 单位为 PDF 点，顺序为 `x0 top x1 bottom`，原点为页面左上角。列表结果包含原始像素尺寸与页面位置，便于区分单图与复合图；不要自动把所有图片对象都当作论文插图。`image` 保留原始分辨率，但可能不包含 PDF 层面的叠加文字、透明遮罩或变换；导出后必须和页面对照，无法完整保真时改用整个区域渲染。

## 编写译稿与构建 HTML

`pdf_asset.py` 提取图片或截图时，在图片旁生成同名 `.layout.json`，记录原页码、区域坐标及 `width_pt`（原稿显示宽度，单位为 PDF 点，72 点 = 1 英寸）。同一图像在原稿出现多次时，用 `--bbox` 指定本次使用的位置。使用其他提取工具时也须保存该记录，例如 `figure-04.layout.json` 内容为 `{"source_page":8,"source_bbox_pt":[166,160,443,306],"width_pt":277}`。构建器自动读取并内嵌尺寸；像素数据仍按原分辨率保留。仅在可读性检查后需要放大时，添加 `display_width_pt` 覆盖显示宽度，保留原始 `width_pt` 供核对。缺失尺寸的旧图片暂按 100 mm 保守显示并输出警告；正式交付前应补齐原稿尺寸，不能将回退尺寸当成已核验的原尺寸。

标题、正文和图注写入 Markdown。只编入论文原有内容及其翻译，不添加译文范围提示框、译者备注或其他制作与阅读说明；必要的交付说明留在聊天消息中。图表用相对路径插入，不把截图数据转写成 Markdown 表格：

```markdown
# 当前论文的中文题目

## 3 实验结果

中文正文……

**表 2：数据集统计。**

![表 2 英文原表截图](assets/table-02.png)
```

构建器依赖 Node 的 `marked`。如果正常模块解析可用，省略 `--marked-module`；否则将当前环境提供的 `marked` 模块路径作为参数传入。它只内嵌本地 PNG/JPEG/WebP/GIF 图片，遇到不存在的图片或远程图片会报错，不默默交付缺图文件。

```text
node scripts/build_html.cjs --input tmp/paper-zh.md --output tmp/paper-zh.html --title "论文中文译稿" --marked-module PATH_TO_MARKED
```

HTML 包含全部图片、CSS 和查看器脚本，无需外部图片文件即可阅读；Markdown 副本仍依赖旁边的图片目录。长公式需要另行适配数学排版并验证，不能将未正确渲染的 LaTeX 当作已完成公式。

## 导出留存用 PDF

### 字体与颜色

先从原稿文字属性和页面截图核对正文字体、颜色、标题及强调样式。默认 `assets/paper.css` 使用黑色衬线正文，不添加标题横线；这只是回退样式，不代表已匹配原稿。为当前论文编写可信的本地 `source-style.css`，构建时追加 `--style-css tmp/source-style.css`，例如：

```css
:root {
  --paper-font: "Times New Roman", "SimSun", serif;
  --paper-heading-font: "Times New Roman", "SimSun", serif;
  --paper-color: #000000;
  --paper-heading-color: #000000;
  --paper-link-color: #0000ff;
  --paper-body-size: 10.5pt;
  --paper-title-size: 18pt;
  --paper-h2-size: 12pt;
  --paper-h3-size: 11pt;
}
```

上面只是配置示例，按原稿实测值修改。用 Markdown 粗体／斜体保留对应强调。局部彩色修订文字不能仅靠全局变量表示：在构建后的 HTML 中，对经过核对的对应译文加受控样式类，再在本地样式中定义颜色并验证 PDF。构建器继续将原始 Markdown 内 HTML 当作文本，不为保留样式执行论文中的 HTML 或脚本。样式文件由制作流程编写，不直接执行论文附带的代码。检查实际嵌入字体与渲染颜色，不能仅凭 CSS 声称字体匹配。

复用已核验的 HTML，并使用当前环境提供的 Playwright 和 Chromium/Edge。可通过 `--playwright-module` 指定模块目录，`--browser-path` 指定浏览器程序；不要把当前机器的路径固化到技能脚本。若当前环境有 PDF 技能，遵循其创建记录与渲染检查要求。

```text
node scripts/export_pdf.cjs --input tmp/paper-zh.html --output output/paper-zh.pdf --title "论文中文译稿" --playwright-module PATH_TO_PLAYWRIGHT --browser-path PATH_TO_CHROMIUM
```

脚本等待字体与图片加载，去掉侧栏与弹窗，展开图表，组合图注与图片，再以 A4 导出带书签和页码的 PDF。正文仍为文本，原图表保持图像。该脚本面向本技能生成的 `main`、`.figure` 与 `.equation` 阅读版结构；其他结构应先检查再适配。图表特殊尺寸或超长图注仍需检查实际分页，必要时局部调整。

用 PDF 文本提取检查正文、附录和页数，用渲染页检查图注归属、孤立标题、公式、表格小字及页面边界。确认字体已嵌入、全部图片保留。核验通过后仅交付 PDF，清理本次生成的临时文件，不创建 ZIP；清理前核实绝对路径确属本次临时目录，保留原始材料和此前已有文件。

## 验证

默认以最终 PDF 的完整性和渲染检查为准。仅当用户另行要求 HTML 时，检查网页最宽表格、最密集图表、窄屏排版及图片缩放控件。截图不会增加位图源的实际信息；只有实看可读才能交付。
