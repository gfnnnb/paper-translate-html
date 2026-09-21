// Optional documentation tooling: npm install --no-save playwright
// Then: npx playwright install chromium && node scripts/capture_preview.cjs
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const docs=path.join(root,'docs');
const uri=b=>'data:image/png;base64,'+b.toString('base64');
async function main(){
 const browser=await chromium.launch({headless:true,...(process.env.PREVIEW_BROWSER_CHANNEL?{channel:process.env.PREVIEW_BROWSER_CHANNEL}:{})});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1140},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'examples/demo-zh.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 assert.deepEqual(await page.locator('.figure img').evaluateAll(imgs=>imgs.map(i=>[i.complete,i.naturalWidth])),[[true,1600],[true,1800]]);
 const reading=await page.screenshot();
 await page.locator('h2').filter({hasText:'2. 示例结果'}).evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 const table=await page.screenshot();
 await page.setViewportSize({width:1440,height:800});
 await page.locator('.figure img').last().click();
 await page.getByRole('button',{name:'原始尺寸',exact:true}).click();
 assert.equal(await page.locator('.viewer-viewport img').evaluate(i=>i.getBoundingClientRect().width),1800);
 assert.ok(await page.locator('.viewer-viewport').evaluate(e=>e.scrollWidth>e.clientWidth));
 await page.getByRole('button',{name:'缩小',exact:true}).click();
 assert.ok(await page.locator('.viewer-viewport img').evaluate(i=>i.getBoundingClientRect().width)<1800);
 await page.getByRole('button',{name:'放大',exact:true}).click();
 await page.getByRole('button',{name:'适合窗口',exact:true}).click();
 const zoom=await page.screenshot();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.ok(await page.locator('nav').isVisible());
 const mobile=await page.screenshot();
 await page.locator('.figure img').first().click();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
 assert.deepEqual(errors,[]);
 const canvas=await browser.newPage({viewport:{width:1600,height:1360},deviceScaleFactor:1});
 const style=`*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;background:#eaf0e6;color:#193e31}.sheet{padding:60px 70px;height:100vh;overflow:hidden;background:radial-gradient(ellipse at 92% 0%,#d2dfbc,transparent 52%),#edf1e7}.eyebrow{font-size:15px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#4c715b}.heading{display:flex;justify-content:space-between;align-items:center;margin:18px 0 12px}h1{font-size:60px;line-height:1.08;letter-spacing:-2px;font-weight:600;margin:0}p{font-size:23px;color:#5a7264;line-height:1.6;margin:16px 0 30px}.pill{border:1px solid #b6c6ae;border-radius:30px;padding:11px 20px;font-size:16px}.frame{background:#fffefa;border:1px solid #c5d1bf;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px #213f2920}.bar{height:42px;display:flex;align-items:center;gap:7px;padding:0 18px;background:#f8f9f4;border-bottom:1px solid #e2e7db}.dot{width:8px;height:8px;border-radius:50%;background:#c8d1c0}.bar span{margin-left:14px;color:#809077;font-size:12px;letter-spacing:1px}.frame img{display:block;width:100%}.footer{display:flex;justify-content:space-between;margin-top:22px;color:#688060;font-size:14px;letter-spacing:.4px}.dark{background:radial-gradient(ellipse at 95% 0%,#315444,transparent 60%),#132f27;color:#eff4e8}.dark .eyebrow,.dark p{color:#bbcab0}.dark .pill{border-color:#587258}.dark .footer{color:#b1c2a9}.row{display:grid;grid-template-columns:1fr 316px;gap:38px;align-items:start}.phone{border:8px solid #31493c;border-radius:30px;overflow:hidden;background:white;box-shadow:0 22px 60px #122b2330}.phone img{width:100%;display:block}.caption{font-size:15px;color:#647c61;margin:18px 0 0}.badge{font-size:15px;color:#c6d9aa;margin-top:24px;letter-spacing:1px}`;
 const frame=(b,label)=>'<div class="frame"><div class="bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span>'+label+'</span></div><img src="'+uri(b)+'"></div>';
 async function render(name,body,height){
  await canvas.setViewportSize({width:1600,height});
  await canvas.setContent('<!doctype html><html lang="en"><meta charset="utf-8"><style>'+style+'</style><body>'+body+'</body></html>');
  await canvas.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await canvas.screenshot({path:path.join(docs,name)});
 }
 fs.mkdirSync(docs,{recursive:true});
 await render('preview-reading.png','<section class="sheet dark"><div class="eyebrow">paper-translate-html / A Codex skill</div><div class="heading"><h1>Less friction.<br>Closer reading.</h1><span class="pill">English papers → Chinese readers</span></div><p>Complete translations. Original visuals. One offline HTML file.</p>'+frame(reading,'PAPER READER / TRANSLATED TEXT')+'<div class="footer"><span>Original demonstration · Fictional content</span><span>Faithful text / Clear structure / Local delivery</span></div></section>',1580);
 await render('preview-table.png','<section class="sheet"><div class="eyebrow">01 / Preserve the details</div><div class="heading"><h1>Translate the text.<br>Keep the evidence in view.</h1></div><p>Original English figures and tables, alongside the Chinese translation.</p>'+frame(table,'ORIGINAL TABLE / EMBEDDED WITHOUT RESIZING THE SOURCE')+'<div class="footer"><span>Illustrative data only · Not research results</span><span>Click any figure to explore</span></div></section>',1580);
 await render('preview-zoom.png','<section class="sheet"><div class="eyebrow">02 / Read at your own scale</div><div class="heading"><h1>Small labels. Big clarity.</h1><span class="pill">Desktop + mobile</span></div><p>Inspect figures at their original size. Keep reading on a narrow screen.</p><div class="row"><div>'+frame(zoom,'IMAGE VIEWER / FIT · ORIGINAL SIZE · ZOOM')+'<p class="caption">Embedded source image: 1800 × 770 px.<br>Zoom changes the view, not the underlying image data.</p></div><div class="phone"><img src="'+uri(mobile)+'"></div></div><div class="footer"><span>Actual demo screenshots · English presentation, Chinese translation</span><span>No network needed to read</span></div></section>',1120);
 // Keep a standalone mobile capture for users who want a closer look.
 fs.writeFileSync(path.join(docs,'preview-mobile.png'),mobile);
 console.log('PASS: image loading, original pixels, zoom, scrolling, Escape, mobile navigation and close; previews saved.');
 } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
