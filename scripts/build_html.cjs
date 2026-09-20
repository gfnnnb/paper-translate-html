const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL,fileURLToPath} = require('node:url');
const usage = 'node scripts/build_html.cjs --input FILE --output FILE [--title TEXT] [--marked-module PATH]';
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main(){
 const options={},args=process.argv.slice(2);
 if(args.length===1&&args[0]==='--help'){console.log(usage);return;}
 for(let i=0;i<args.length;i+=2){
  if(!['--input','--output','--title','--marked-module'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error(usage);
  options[args[i].slice(2)]=args[i+1];
 }
 if(!options.input||!options.output)throw Error(usage);
 const input=path.resolve(options.input),output=path.resolve(options.output);
 if(input===output)throw Error('Output must differ from input');
 const modulePath=options['marked-module']?require.resolve(path.resolve(options['marked-module'])):require.resolve('marked');
 const {Marked}=await import(pathToFileURL(modulePath).href);
 const assets=path.resolve(__dirname,'../assets');
 let count=0,index=0;const toc=[];
 const parser=new Marked({gfm:true});
 parser.use({renderer:{
  // Display manuscript HTML as text instead of executing it.
  html({text}){return escape(text);},
  image({href,text}){
   if(/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)&&!href.startsWith('file:'))throw Error('Use a local source image: '+href);
   const local=href.startsWith('file:')?fileURLToPath(href):path.resolve(path.dirname(input),decodeURIComponent(href));
   const type={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[path.extname(local).toLowerCase()];
   if(!type)throw Error('Unsupported image format: '+local);
   const data=fs.readFileSync(local).toString('base64');count++;
   const label=escape(text||'原图');
   return '<span class="figure"><span class="figure-label">'+label+' · 点击图片放大</span><img src="data:'+type+';base64,'+data+'" alt="'+label+'"></span>';
  },
  link({href,tokens}){
   const text=this.parser.parseInline(tokens);
   if(/^(?:javascript|vbscript|data|file):/i.test(href.replace(/[\s\u0000-\u001f]/g,'')))return text;
   return '<a href="'+escape(href)+'" rel="noreferrer">'+text+'</a>';
  },
  heading({depth,tokens}){
   const title=this.parser.parseInline(tokens),id='section-'+(++index);
   if(depth===2)toc.push('<a href="#'+id+'">'+title.replace(/<[^>]*>/g,'')+'</a>');
   return '<h'+depth+' id="'+id+'">'+title+'</h'+depth+'>';
  }
 }});
 const content=parser.parse(fs.readFileSync(input,'utf8'));
 const title=escape(options.title||'论文中文译稿');
 const css=fs.readFileSync(path.join(assets,'reader.css'),'utf8')+'\n'+fs.readFileSync(path.join(assets,'image_viewer.css'),'utf8');
 const script=fs.readFileSync(path.join(assets,'image_viewer.js'),'utf8');
 const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+css+'</style></head><body><nav aria-label="章节目录"><strong>论文中文译稿</strong>'+toc.join('')+'</nav><main>'+content+'</main><script>'+script+'</script></body></html>';
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html,'utf8');
 console.log(JSON.stringify({output,embeddedImages:count,bytes:Buffer.byteLength(html)}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});

