// Export an existing local paper reader without altering its source HTML.
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i].startsWith('--') || !process.argv[i + 1]) throw Error('Expected --key VALUE');
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async () => {
  if (!args.input || !args.output) throw Error('Use --input FILE.html --output FILE.pdf [--playwright-module PATH] [--browser-path PATH] [--title TEXT]');
  const input = path.resolve(args.input), output = path.resolve(args.output);
  if (input === output || path.extname(output).toLowerCase() !== '.pdf') throw Error('Output must be a separate PDF');
  const {chromium} = require(args['playwright-module'] ? path.resolve(args['playwright-module']) : 'playwright');
  const browser = await chromium.launch({headless:true, ...(args['browser-path'] ? {executablePath:args['browser-path']} : {})});
  try {
    const page = await browser.newPage();
    // Export only self-contained/local reader resources.
    await page.route(/^https?:\/\//, route => route.abort());
    await page.goto(pathToFileURL(input).href, {waitUntil:'load'});
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('main img')].map(img => img.decode()));
      document.querySelectorAll('nav,.mobile-toc,dialog,.tools,.reader-header,.figure-label').forEach(e => e.remove());
      document.querySelectorAll('p > .figure').forEach(fig => {
        const p=fig.parentElement;
        if(p.childNodes.length===1) p.replaceWith(fig);
      });
      document.querySelectorAll('span.figure').forEach(fig => {
        const div=document.createElement('div');div.className=fig.className;
        div.append(...fig.childNodes);fig.replaceWith(div);
      });
      document.querySelectorAll('details.figure').forEach(d => {
        const div = document.createElement('div'); div.className = d.className;
        [...d.childNodes].forEach(n => div.append(n)); d.replaceWith(div);
      });
      document.querySelectorAll('.figure summary').forEach(s => s.remove());
      document.querySelectorAll('main p').forEach(p => { if (!p.textContent.trim() && !p.querySelector('img')) p.remove(); });
      // Keep the source image and its Chinese caption on the same page.
      document.querySelectorAll('.figure:not(.equation)').forEach(fig => {
        const previous = fig.previousElementSibling, next = fig.nextElementSibling;
        const isCaption = p => p?.tagName === 'P' && /^(图|表)\s*\d+\s*[:：]/.test(p.textContent.trim());
        if (isCaption(next) && /^图/.test(next.textContent.trim())) fig.append(next);
        if (isCaption(previous) && /^表/.test(previous.textContent.trim())) fig.prepend(previous);
      });
      // Keep algorithm label, inputs and pseudocode together.
      document.querySelectorAll('pre').forEach(pre => {
        const input = pre.previousElementSibling, label = input?.previousElementSibling;
        if (input?.tagName === 'P' && /^输入/.test(input.textContent.trim()) && label?.tagName === 'P' && /^算法\s*\d/.test(label.textContent.trim())) {
          const group=document.createElement('div');group.className='algorithm';label.before(group);group.append(label,input,pre);
        }
      });
    });
    await page.addStyleTag({content:`
      @page {size:A4; margin:18mm 18mm 18mm 18mm}
      html,body {background:white!important;color:var(--paper-color,#000);font-size:var(--paper-body-size,10.5pt)!important;line-height:1.65!important}
      main {margin:0!important;padding:0!important;border:0!important;border-radius:0!important;max-width:none!important;overflow-wrap:anywhere}
      h1 {font-size:var(--paper-title-size,22pt)!important;line-height:1.45;margin:0 0 7mm}
      h2 {font-size:var(--paper-h2-size,15pt)!important;line-height:1.5;margin:8mm 0 4mm;padding-bottom:2mm}
      h3 {font-size:var(--paper-h3-size,12pt)!important;margin:6mm 0 3mm} h4 {font-size:var(--paper-h4-size,10.5pt)!important;margin:5mm 0 2mm}
      h1,h2,h3,h4 {break-after:avoid;page-break-after:avoid}
      p {margin:3mm 0;orphans:3;widows:3} li {margin:1.5mm 0}
      blockquote {font-size:9pt!important;margin:5mm 0;padding:3mm 4mm;break-inside:avoid}
      .figure {margin:4mm 0!important;padding:0!important;border:0!important;background:white!important;break-inside:avoid;page-break-inside:avoid}
      .figure img {display:block;width:var(--figure-width,100mm)!important;max-width:100%!important;max-height:170mm!important;height:auto!important;margin:2mm auto!important;object-fit:contain}
      .figure p {font-size:9pt;line-height:1.5;margin:2mm 0}
      .equation img {max-height:none!important}
      .equation {margin:3mm 0!important}
      .algorithm {break-inside:avoid} pre {font-size:8.5pt!important;line-height:1.55!important;padding:4mm;break-inside:avoid;white-space:pre-wrap}
      a {text-decoration:none} .mobile-toc,nav,dialog,.tools {display:none!important}
      * {-webkit-print-color-adjust:exact;print-color-adjust:exact}
    `});
    await page.emulateMedia({media:'print'});
    const title = escape(args.title || '论文中文译稿');
    fs.mkdirSync(path.dirname(output),{recursive:true});
    await page.pdf({path:output,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,
      headerTemplate:`<div style="font-size:8px;color:#69787d;width:100%;margin:0 18mm;">${title}</div>`,
      footerTemplate:'<div style="font-size:8px;color:#69787d;text-align:center;width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      tagged:true,outline:true});
    console.log(JSON.stringify({output,bytes:fs.statSync(output).size}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
