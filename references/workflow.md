# 使用资源

## 准备源文件与图表

先阅读原论文，包括双栏顺序、页内图表边界和附录。Markdown 放在输出目录，图片放在相邻子目录。使用通用文件名，例如 `figure-04.png`、`table-02.png`。以下路径和页码仅展示语法，实际调用必须来自当前文档。

Python 依赖：`pypdf`、`pdfplumber`、`Pillow`，区域渲染还需要 pdfplumber 的渲染依赖。使用环境已有依赖，缺失时只补需要的包。

```text
python scripts/pdf_asset.py list paper.pdf --page 7
python scripts/pdf_asset.py image paper.pdf --page 7 --key /Im4 --output assets/figure-04.png
python scripts/pdf_asset.py crop paper.pdf --page 3 --bbox 313 399 513 683 --dpi 400 --output assets/table-02.png
```

页码从 1 开始。`--bbox` 单位为 PDF 点，顺序为 `x0 top x1 bottom`，原点为页面左上角。列表结果包含原始像素尺寸与页面位置，便于区分单图与复合图；不要自动把所有图片对象都当作论文插图。`image` 保留原始分辨率，但可能不包含 PDF 层面的叠加文字、透明遮罩或变换；导出后必须和页面对照，无法完整保真时改用整个区域渲染。

## 编写译稿与构建 HTML

标题、正文和图注写入 Markdown。图表用相对路径插入，不把截图数据转写成 Markdown 表格：

```markdown
# 当前论文的中文题目

## 3 实验结果

中文正文……

**表 2：数据集统计。**

![表 2 英文原表截图](assets/table-02.png)
```

构建器依赖 Node 的 `marked`。如果正常模块解析可用，省略 `--marked-module`；否则将当前环境提供的 `marked` 模块路径作为参数传入。它只内嵌本地 PNG/JPEG/WebP/GIF 图片，遇到不存在的图片或远程图片会报错，不默默交付缺图文件。

```text
node scripts/build_html.cjs --input output/paper-zh.md --output output/paper-zh.html --title "论文中文译稿" --marked-module PATH_TO_MARKED
```

HTML 包含全部图片、CSS 和查看器脚本，无需外部图片文件即可阅读；Markdown 副本仍依赖旁边的图片目录。长公式需要另行适配数学排版并验证，不能将未正确渲染的 LaTeX 当作已完成公式。

## 验证

用可用浏览器打开最终 HTML，检查正文、最宽表格、最密集图表和手机宽度。点击图像，检查“适合窗口”“原始尺寸”、加减缩放和 Esc 关闭，原始尺寸时应等于图片自然像素宽度。截图不会增加位图源的实际信息；只有实看可读才能交付。

安装依赖可使用仓库根目录的 npm install 和 python -m pip install -r requirements.txt。构建器将 Markdown 中的原始 HTML 作为文本显示；请使用 Markdown 图片语法。可先运行 npm run demo 查看原创演示，再运行 npm test 验证构建器。
