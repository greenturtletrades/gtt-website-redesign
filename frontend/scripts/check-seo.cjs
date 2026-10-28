const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 const {transformWithEsbuild}=await import('vite');
 {
 const root=path.resolve(__dirname,'..'), name=path.basename(path.dirname(root)), config=require(path.join(root,'seo.config.json'));
 const elements=[];
 class Element {constructor(tag){this.tag=tag;this.attrs={};}setAttribute(k,v){this.attrs[k]=v;}remove(){elements.splice(elements.indexOf(this),1);}}
 const document={title:'',head:{appendChild:e=>elements.push(e),querySelector:s=>elements.find(e=>{const m=s.match(/^(meta|link)\[(name|property|rel)="([^"]+)"\]$/);return m&&e.tag===m[1]&&e.attrs[m[2]]===m[3];}),querySelectorAll:s=>elements.filter(e=>e.tag==='meta'&&e.attrs.name==='keywords')},createElement:t=>new Element(t),getElementById:id=>elements.find(e=>e.id===id)};
 const script=new Element('script');script.id='gtt-structured-data';elements.push(script);
 const modules={};
 for(const name of ['routes','content','structuredData','metadata']){
 const file=path.join(root,'src/seo',name+'.ts');
 const src=fs.readFileSync(file,'utf8').replace(/import\.meta\.env/g,'({})');
 const compiled=await transformWithEsbuild(src,file,{loader:'ts',format:'cjs'});
 const module={exports:{}};
 vm.runInNewContext(compiled.code,{module,exports:module.exports,require:p=>p.endsWith('.json')?require(path.resolve(root,'src/seo',p)):modules[p.replace('./','')],document,URL,console});modules[name]=module.exports;
 }
 for(const [route,meta] of Object.entries(config.routes)){
 const html=fs.readFileSync(path.join(root,'build',route.slice(1),'index.html'),'utf8');const head=html.match(/<head>([\s\S]*?)<\/head>/)[1];
 assert.equal((head.match(/rel="canonical"/g)||[]).length,1,route);
 assert(head.includes(`href="${config.siteUrl+route}"`),route);
 assert.equal((head.match(/type="application\/ld\+json"/g)||[]).length,1,route);
 const encode=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 assert(head.includes('<title>'+encode(meta.title)+'</title>'),route+' initial title');
 assert(head.includes('name="description" content="'+encode(meta.description)+'"'),route+' initial description');
 const graph=JSON.parse(head.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
 assert.equal(graph['@graph'].filter(n=>n['@type']==='Organization').length,1);
 assert.equal(graph['@graph'].find(n=>n['@type']==='Organization').description,config.organization.description);
 assert.equal(graph['@graph'].find(n=>n['@id']===config.siteUrl+route+'#webpage').description,meta.description);
 assert(!JSON.stringify(graph).includes('SearchAction'));
 assert(!head.includes('name="keywords"'));
 if(config.omitLegacyFaqSchemaRoutes.includes(route)) assert(!graph['@graph'].some(node=>node['@type']==='FAQPage'),route+' obsolete company FAQ');
 const view=modules.routes.getViewFromPath(route);modules.metadata.applySeoMetadata(view);
 assert.equal(document.title,meta.title,route+' runtime title');
 assert.equal(document.head.querySelector('meta[name="description"]').attrs.content,meta.description,route+' runtime description');
 assert.equal(document.head.querySelector('link[rel="canonical"]').attrs.href,config.siteUrl+route);
 assert.equal(document.head.querySelector('meta[name="robots"]').attrs.content,meta.robots||'index, follow');
 assert.equal(elements.filter(e=>e.tag==='script').length,1,'runtime schema duplicated');
 const runtime=JSON.parse(script.textContent);
 assert.deepEqual(runtime,graph,route+' initial/runtime schema mismatch');
 if(config.omitLegacyFaqSchemaRoutes.includes(route)) assert(!runtime['@graph'].some(node=>node['@type']==='FAQPage'),route+' runtime obsolete company FAQ');assert.equal(runtime['@graph'][0].description,config.organization.description);
 }
 const visible=require('../seo-content.json').pages;
 for(const page of visible.filter(page=>config.routes[page.route])) {
   const html=fs.readFileSync(path.join(root,'build',page.route.slice(1),'index.html'),'utf8');
   const encode=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
   for(const text of [page.intro,...page.sections.map(section=>section.body),...page.faqs.map(faq=>faq.answer)]) assert(html.includes(encode(text)),page.route+' initial/visible copy mismatch');
   const graph=JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
   const faq=graph['@graph'].find(node=>node['@type']==='FAQPage');assert(faq,page.route+' missing matching FAQ schema');
   assert.deepEqual(faq.mainEntity.map(item=>item.acceptedAnswer.text),page.faqs.map(item=>item.answer));
 }
 const summary=require('./generate-ai-summary.cjs').buildAiSummary();
 assert.equal(fs.readFileSync(path.join(root,'public/llms.txt'),'utf8'),summary);
 assert.equal(fs.readFileSync(path.join(root,'build/llms.txt'),'utf8'),summary);
 assert(summary.includes(config.organization.description));
 assert(summary.includes('professional clients only'));
 assert(summary.includes('in development'));
 const robots=fs.readFileSync(path.join(root,'build/robots.txt'),'utf8');
 assert.match(robots,/User-agent: \*\s+Allow: \//);
 const sitemap=fs.readFileSync(path.join(root,'build/sitemap.xml'),'utf8');
 for(const route of config.indexableRoutes) assert(sitemap.includes(`<loc>${config.siteUrl+route}</loc>`));
 for(const [route,m] of Object.entries(config.routes)) if(m.robots?.includes('noindex')) assert(!sitemap.includes(`<loc>${config.siteUrl+route}</loc>`));
 console.log(name+': '+Object.keys(config.routes).length+' route metadata checks passed; runtime navigation, schema replacement, sitemap checks passed.');
 }
})().catch(e=>{console.error(e);process.exit(1)});
