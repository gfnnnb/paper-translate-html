const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/build_html.cjs');
function build(markdown,check){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'paper-reader-'));
 try{
  fs.writeFileSync(path.join(dir,'input.md'),markdown);
  const image=fs.readFileSync(path.resolve(__dirname,'../examples/assets/workflow.png'));
  fs.writeFileSync(path.join(dir,'figure & detail.png'),image);
  const result=spawnSync(process.execPath,[script,'--input',path.join(dir,'input.md'),'--output',path.join(dir,'result.html')],{encoding:'utf8'});
  check(result,fs.existsSync(path.join(dir,'result.html'))?fs.readFileSync(path.join(dir,'result.html'),'utf8'):'',image);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('preserves source image bytes and chapter navigation',()=>{
 build('# 示例\n\n## 方法\n\n![原图](figure%20%26%20detail.png)',(r,html,image)=>{
  assert.equal(r.status,0,r.stderr);assert.ok(html.includes(image.toString('base64')));
  assert.ok(html.includes('href="#section-2"'));assert.equal(JSON.parse(r.stdout).embeddedImages,1);
 });
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

