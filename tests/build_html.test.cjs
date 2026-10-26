const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/build_html.cjs');
function build(markdown,check,prepare=()=>[]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'paper-reader-'));
 try{
  fs.writeFileSync(path.join(dir,'input.md'),markdown);
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1EAAAAASUVORK5CYII=','base64');
  fs.writeFileSync(path.join(dir,'figure & detail.png'),image);
  const extra=prepare(dir);
  const result=spawnSync(process.execPath,[script,'--input',path.join(dir,'input.md'),'--output',path.join(dir,'result.html'),...extra],{encoding:'utf8'});
  check(result,fs.existsSync(path.join(dir,'result.html'))?fs.readFileSync(path.join(dir,'result.html'),'utf8'):'',image);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('preserves source image bytes and chapter navigation',()=>{
 build('# 示例\n\n## 方法\n\n![原图](figure%20%26%20detail.png)',(r,html,image)=>{
  assert.equal(r.status,0,r.stderr);assert.ok(html.includes(image.toString('base64')));
  assert.ok(html.includes('href="#section-2"'));assert.equal(JSON.parse(r.stdout).embeddedImages,1);
 });
});
test('uses source width independently of image pixels and accepts a reviewed override',()=>{
 for(const layout of [{width_pt:104},{width_pt:104,display_width_pt:130}]){
  build('![图](figure%20%26%20detail.png)',(r,html)=>{
   assert.equal(r.status,0,r.stderr);
   assert.ok(html.includes('--figure-width:'+(layout.display_width_pt??104)+'pt'));
  },dir=>{fs.writeFileSync(path.join(dir,'figure & detail.layout.json'),JSON.stringify(layout));return [];});
 }
});
test('rejects invalid display widths',()=>{
 for(const width of [0,-1,'100%;color:red']){
  build('![图](figure%20%26%20detail.png)',(r,html)=>{assert.notEqual(r.status,0);assert.equal(html,'');},dir=>{
   fs.writeFileSync(path.join(dir,'figure & detail.layout.json'),JSON.stringify({width_pt:width}));return [];
  });
 }
});
test('embeds source typography and rejects stylesheet HTML breakout',()=>{
 for(const invalid of [false,true]){
  const css=invalid?'</style><script>alert(1)</script>':':root{--paper-color:#ec008c;--paper-font:Arial, sans-serif}';
  build('# 标题\n\n**强调** 与 *斜体*',(r,html)=>{
   if(invalid){assert.notEqual(r.status,0);assert.equal(html,'');}
   else {assert.equal(r.status,0,r.stderr);assert.ok(html.includes(css));assert.ok(html.includes('<strong>强调</strong>'));assert.ok(html.includes('<em>斜体</em>'));}
  },dir=>{const file=path.join(dir,'source.css');fs.writeFileSync(file,css);return ['--style-css',file];});
 }
});
test('missing and remote images fail without output',()=>{
 for(const src of ['missing.png','https://example.com/image.png']){
  build('![图]('+src+')',(r,html)=>{assert.notEqual(r.status,0);assert.equal(html,'');});
 }
});
test('manuscript HTML is inert and script links are removed',()=>{
 build('<script>alert("paper")</script>\n\n[unsafe](javascript:alert%281%29)',(r,html)=>{
  assert.equal(r.status,0,r.stderr);assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert("paper")</script>'));assert.ok(!html.includes('href="javascript:'));
 });
});


