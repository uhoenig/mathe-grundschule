'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');}
const root=path.resolve(__dirname,'..'),ctx={window:{},Intl};
vm.runInNewContext(fs.readFileSync(path.join(root,'learning.js'),'utf8'),ctx);
const L=ctx.window.MF_LEARNING,KEY='mathe-grundschule.progress.v1',base='https://grundschule.test/mathe-grundschule/';
const allowed=new Set(['index.html','style.css','app.js','learning.js','animals.js','review.js','help.js','speech.js','assets/favicon.svg','assets/learning-friends.webp']);
const executablePath=fs.existsSync(pw.chromium.executablePath())?undefined:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const errors=[];
async function open(browser,raw=null,options={}) {
  const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true}),requests=[];
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());requests.push(url.href);
    if(url.origin!=='https://grundschule.test'||!url.pathname.startsWith('/mathe-grundschule/'))return route.abort();
    const file=url.pathname.slice('/mathe-grundschule/'.length)||'index.html';
    if(file==='bootstrap')return route.fulfill({body:'<!doctype html>'});
    if(!allowed.has(file))return route.abort();
    return route.fulfill({body:fs.readFileSync(path.join(root,file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':'text/html'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'bootstrap');
  await page.evaluate(({KEY,raw})=>{localStorage.setItem('mathequest.v1','abi-stand-bitte-behalten');if(raw!==null)localStorage.setItem(KEY,typeof raw==='string'?raw:JSON.stringify(raw));},{KEY,raw});
  if(options.writeError)await context.addInitScript(({KEY})=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===KEY&&window.failWrites!==false)throw new DOMException('Test','QuotaExceededError');return set.call(this,k,v);};},{KEY});
  if(options.speechMock)await context.addInitScript(()=>{window.spokenTexts=[];window.cancelCount=0;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'Deutsch lokal',lang:'de-DE',localService:true},{name:'Deutsch Cloud',lang:'de-DE',localService:false}],cancel:()=>window.cancelCount++,speak:u=>window.spokenTexts.push({text:u.text,local:u.voice.localService}),addEventListener:()=>{}}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};});
  await page.goto(base);await page.locator('main h1').waitFor();return {page,context,requests};
}
const saved=p=>p.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);
async function solve(p,{wrong=false,hint=false,explain=false}={}) {
  const a=(await saved(p)).active,q=L.bank[a.ids[a.index]];
  if(wrong)await p.locator(`[data-answer="${(q.correct+1)%3}"]`).click();
  if(hint)await p.locator('[data-action="hint"]').click();
  await p.locator(explain?'[data-action="explain"]':`[data-answer="${q.correct}"]`).click();await p.locator('.feedback.success').waitFor();
}
async function finish(p) {
  for(let i=0;i<5;i++) {const a=(await saved(p)).active;if(!a.answers[a.index].solved)await solve(p);await p.locator('[data-action="next"]').click();if(i<4)await p.locator('.question-title').waitFor();}
  await p.locator('.result-panel').waitFor();
}
async function exportData(p){const pending=p.waitForEvent('download');await p.locator('[data-action="export"]').first().click();const d=await pending,s=await d.createReadStream(),chunks=[];for await(const c of s)chunks.push(c);return Buffer.concat(chunks).toString('utf8');}
async function upload(p,raw){await p.locator('#import-file').setInputFiles({name:'lernstand.json',mimeType:'application/json',buffer:Buffer.from(typeof raw==='string'?raw:JSON.stringify(raw))});}
if(require.main===module)(async()=>{const browser=await pw.chromium.launch({headless:true,executablePath});try{
  const {page:p,context,requests}=await open(browser);
  assert.equal(await p.locator('.world-card').count(),4);assert.equal(await p.locator('.topic-card').count(),6);
  assert.equal(await p.locator('.hero-art img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
  for(const [width,height]of [[1440,1100],[768,1024],[390,844],[320,700]]){
    await p.setViewportSize({width,height});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Überlauf '+width);
    await p.screenshot({path:path.join(root,`tests/home-${width}.png`),fullPage:true});
  }
  await p.setViewportSize({width:1440,height:1100});
  for(const grade of [2,3,4,1]){await p.locator(`[data-grade="${grade}"]`).click();assert.equal((await saved(p)).grade,grade);assert.equal(await p.locator('.topic-card').count(),6);}
  await p.locator('[data-world="dino"]').click();assert.equal((await saved(p)).world,'dino');
  await p.locator('.hero [data-action="start"]').click();await p.locator('.question-title').waitFor();
  const original=(await saved(p)).active;assert.equal(original.ids.length,5);
  await solve(p,{wrong:true});assert.equal((await saved(p)).active.answers[0].wrong.length,1);
  await p.reload();await p.locator('.feedback.success').waitFor();assert.equal((await saved(p)).active.id,original.id);
  assert.equal(await p.locator('.answer:disabled').count(),3);
  await p.locator('[data-action="next"]').click();await p.locator('.question-title').waitFor();
  await p.locator('.back-link').first().click();await p.locator('.resume-strip').waitFor();
  await p.locator('[data-grade="4"]').click();await p.locator('[data-world="farm"]').click();
  await p.locator('[data-action="resume"]').first().click();await p.locator('.question-title').waitFor();
  assert.equal((await saved(p)).active.world,'dino');assert.equal(await p.locator('body').getAttribute('data-world'),'dino');
  await solve(p,{explain:true});
  for(let i=1;i<5;i++){const a=(await saved(p)).active;if(!a.answers[a.index].solved)await solve(p);await p.locator('[data-action="next"]').click();}
  await p.locator('.result-panel').waitFor();let state=await saved(p);assert.equal(state.rounds,1);assert.equal(state.collected.length,1);assert.equal(state.collected[0],'dino');assert.equal(state.lastRound.stars,2);
  await p.reload();await p.locator('.result-panel').waitFor();assert.equal((await saved(p)).rounds,1);
  assert.equal(await p.evaluate(()=>localStorage.getItem('mathequest.v1')),'abi-stand-bitte-behalten');
  await p.goto(base+'#album');await p.locator('.album-grid').first().waitFor();assert.equal(await p.locator('.album-card').count(),12);assert.equal(await p.locator('.album-card.collected').count(),1);
  await p.screenshot({path:path.join(root,'tests/album.png'),fullPage:true});
  await p.goto(base+'#adventure');await p.locator('.topic-card').first().click();await p.locator('.question-title').waitFor();
  for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:1000});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.screenshot({path:path.join(root,'tests/quiz.png'),fullPage:true});
  await p.goto(base+'#settings');await p.locator('.settings-grid').waitFor();const exported=JSON.parse(await exportData(p));
  const second=await open(browser);await second.page.goto(base+'#settings');await second.page.locator('.settings-grid').waitFor();await upload(second.page,exported);await second.page.locator('[data-action="confirm-import"]').waitFor();assert.equal(await saved(second.page),null);await second.page.locator('[data-action="confirm-import"]').click();await second.page.locator('.hero').waitFor();
  assert.deepEqual((await saved(second.page)).active,exported.active);assert.deepEqual((await saved(second.page)).collected,exported.collected);
  await second.page.goto(base+'#settings');await second.page.locator('.settings-grid').waitFor();const before=await saved(second.page);await upload(second.page,{...exported,grade:9});await second.page.locator('#toast').waitFor({state:'visible'});assert.deepEqual(await saved(second.page),before);
  await second.page.locator('[data-action="reset"]').click();await second.page.locator('[data-action="close-dialog"]').first().click();assert.deepEqual(await saved(second.page),before);
  await second.page.locator('[data-action="reset"]').click();await second.page.locator('[data-action="confirm-reset"]').click();await second.page.locator('.hero').waitFor();assert.equal((await saved(second.page)).rounds,0);assert.equal(await second.page.evaluate(()=>localStorage.getItem('mathequest.v1')),'abi-stand-bitte-behalten');
  console.log('OK Klassen/Welten, responsive Ansichten, Tipps, zweite Versuche, Pause, Reload, Belohnung, Export/Import und Reset; Abi-Speicher unverändert.');
  const damaged=await open(browser,'{kaputt');assert.equal(await damaged.page.locator('.recovery-panel').count(),1);assert.equal(await damaged.page.evaluate(KEY=>localStorage.getItem(KEY),KEY),'{kaputt');
  await upload(damaged.page,exported);await damaged.page.locator('[data-action="confirm-import"]').click();await damaged.page.locator('.hero').waitFor();assert.equal((await saved(damaged.page)).rounds,1);
  const failed=await open(browser,null,{writeError:true});await failed.page.locator('[data-grade="2"]').click();await failed.page.locator('.storage-notice').waitFor();assert.equal(await saved(failed.page),null);await failed.page.goto(base+'#settings');await failed.page.locator('.settings-grid').waitFor();const memory=JSON.parse(await exportData(failed.page));assert.equal(memory.grade,2);await failed.page.evaluate(()=>window.failWrites=false);await failed.page.locator('[data-action="retry-save"]').click();assert.equal((await saved(failed.page)).grade,2);
  const other=await context.newPage();await other.goto(base);await other.locator('.hero').waitFor();await other.locator('[data-grade="2"]').click();await p.locator('.recovery-panel').waitFor();assert.ok((await p.locator('.recovery-panel').innerText()).includes('anderen Tab'));
  assert.ok(requests.every(url=>url.startsWith(base)));assert.deepEqual(errors,[]);
  console.log('OK beschädigte Daten geschützt, Wiederherstellung, Speicherfehler mit Sitzungs-Export, erneutes Speichern und Konfliktschutz zwischen Tabs.');
  // Jede Themenfamilie, alle grafischen Aufgaben und zwölf verschiedene Belohnungen.
  const all=await open(browser);
  for(const topic of L.topics){await all.page.goto(base+'#adventure');await all.page.locator('.hero').waitFor();await all.page.locator(`[data-grade="${topic.grade}"]`).click();await all.page.locator(`.topic-card[data-topic="${topic.id}"]`).click();await all.page.locator('.question-title').waitFor();for(const width of [320,768]){await all.page.setViewportSize({width,height:1000});const fits=await all.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);if(!fits){await all.page.screenshot({path:path.join(root,'tests/overflow.png'),fullPage:true});console.log(JSON.stringify(await all.page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+1||e.left< -1))));}assert.ok(fits,topic.id);}await finish(all.page);}
  const completed=await saved(all.page);assert.equal(completed.rounds,24);assert.equal(completed.collected.length,12);assert.equal(new Set(completed.collected).size,12);assert.equal(Object.keys(completed.topics).length,24);assert.ok(Object.values(completed.topics).every(t=>t.stars===3));
  assert.deepEqual(errors,[]);console.log('OK alle 24 Themen im Browser durchgespielt, 120 Aufgaben beantwortet, alle zwölf Tiere gesammelt und keine Laufzeitfehler.');
  const offline=await browser.newContext({offline:true}),file=await offline.newPage();file.on('pageerror',e=>errors.push(e.message));await file.goto('file://'+path.join(root,'index.html'));await file.locator('.hero').waitFor();await file.locator('.hero [data-action="start"]').click();await file.locator('.question-title').waitFor();await file.locator('[data-action="explain"]').click();await file.locator('.feedback.success').waitFor();assert.deepEqual(errors,[]);await offline.close();
  console.log('OK GitHub-Pages-Unterpfad und direkter Offline-Dateistart. Alle Browserprüfungen bestanden.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

module.exports={open,saved,solve,finish,upload,exportData,L,KEY,base,root,pw,executablePath};
