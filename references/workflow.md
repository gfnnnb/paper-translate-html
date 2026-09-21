# Workflow Guide

## Prepare the Source and Visual Assets

Read the source paper first, including two-column reading order, visual boundaries, and appendices. Place the Markdown file in the output directory with images in a neighboring subdirectory. Use names such as `figure-04.png` and `table-02.png`. The paths, page numbers, and coordinates below illustrate syntax; select values from the actual document.

Install dependencies from the repository root with `npm install` and `python -m pip install -r requirements.txt`, or reuse compatible environment packages. PDF processing uses `pypdf`, `pdfplumber`, and `Pillow`, including pdfplumber's rendering dependencies.

```text
python scripts/pdf_asset.py list paper.pdf --page 7
python scripts/pdf_asset.py image paper.pdf --page 7 --key /Im4 --output assets/figure-04.png
python scripts/pdf_asset.py crop paper.pdf --page 3 --bbox 313 399 513 683 --dpi 400 --output assets/table-02.png
```

Pages are numbered from 1. Bounding boxes use PDF points in `x0 top x1 bottom` order, with the origin at the page's top-left corner. The listing includes original pixel dimensions and placement information. Not every image object is a complete paper figure.

Image extraction preserves original resolution but may omit page-level text overlays, masks, or transformations. Compare each export with the source page; render the complete region when extraction does not preserve the full visual.

## Write the Translation and Build HTML

Write translated headings, text, and captions in Markdown. Use relative paths for images instead of transcribing captured tables. In the example below, replace the English placeholders with the translated content:

```markdown
# Translated paper title

## 3. Results

Translated body text...

**Table 2. Dataset statistics.**

![Original English Table 2](assets/table-02.png)
```

The builder uses Node.js and `marked`. Omit `--marked-module` when normal module resolution works; otherwise pass the module path supplied by your environment. It embeds local PNG, JPEG, WebP, and GIF images and fails on missing or remote images.

```text
node scripts/build_html.cjs --input output/paper-zh.md --output output/paper-zh.html --title "Chinese Paper Translation"
```

With a custom dependency location:

```text
node scripts/build_html.cjs --input output/paper-zh.md --output output/paper-zh.html --marked-module PATH_TO_MARKED
```

The HTML embeds images, styles, and viewer scripts. The Markdown copy still depends on its neighboring image directory. Raw HTML in Markdown is displayed as text; use Markdown image syntax.

Complex equations need separately configured and verified math rendering. Unrendered LaTeX is not a finished equation.

## Verify the Result

Open the HTML in a browser. Inspect the body text, widest table, densest figure, and narrow-screen layout. Click an image and test fit-to-window, original size, zoom controls, scrolling, and Escape to close. At original size, its displayed width should equal its natural pixel width.

Higher-resolution rendering cannot add information to a low-resolution bitmap. Verify actual readability before delivery.

Run `npm run demo` to build the original demonstration and `npm test` to check the builder.
