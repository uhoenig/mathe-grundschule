'use strict';
const {open,saved,solve,finish,exportData,upload,L,KEY,base,root,pw,executablePath}=require('./grundschule-browser.cjs'),assert=require('node:assert/strict'),path=require('node:path');
const animals=['pig','cow','sheep','pony','foal','rabbit','lion','elephant','giraffe','dino','triceratops','stegosaurus'];
const blank=()=>({app:'mathe-grundschule',version:1,grade:1,world:'dino',rounds:0,collected:[],topics:{},history:{},active:null,lastRound:null});
(async()=>{const browser=await pw.chromium.launch({headless:true,executablePath});const errors=[];try{
  const fixture=blank(),old=Date.now()-2*86400000;
  fixture.rounds=12;fixture.collected=animals;fixture.history=Object.fromEntries(['g1-count:0','g1-add:0','g1-subtract:0'].map(id=>[id,{attempts:2,firstCorrect:1,needsReview:true,lastAt:old}]));
  fixture.topics={'g1-count':{rounds:1,stars:2}};
  const {page:p}=await open(browser,fixture,{speechMock:true});p.on('pageerror',e=>errors.push(e.message));
  assert.deepEqual(await saved(p),fixture,'Altstand wird beim Öffnen nicht überschrieben');
  assert.ok((await p.locator('.daily-mix').innerText()).includes('3 wiederholen'));
  await p.locator('.hero [data-action="start"]').click();await p.locator('.question-title').waitFor();
  let state=await saved(p);assert.equal(state.version,2);assert.equal(state.active.mode,'daily');assert.equal(new Set(state.active.ids.map(id=>L.bank[id].topic)).size,3);assert.equal(state.collected.length,12);
  await p.locator('[data-read="question"]').click();assert.equal(await p.evaluate(()=>spokenTexts.length),1);assert.equal(await p.evaluate(()=>spokenTexts[0].local),true);
  await p.locator('[data-action="mark-animal"]').first().click();assert.equal(await p.locator('.count-token.marked').count(),1);await p.reload();await p.locator('.count-token.marked').waitFor();
  await p.locator('[data-action="hint"]').click();await p.locator('[data-action="hint"]').click();assert.equal(await p.locator('.worked-help').count(),1);await p.locator('[data-read="help"]').click();assert.equal(await p.evaluate(()=>spokenTexts.length),1);
  await solve(p);state=await saved(p);const first=state.active.ids[0];assert.equal(state.history[first].needsReview,true);assert.ok(state.history[first].dueAt>Date.now()+23*3600000);
  await p.locator('[data-read="solution"]').click();assert.equal(await p.evaluate(()=>spokenTexts.length),2);
  await finish(p);state=await saved(p);assert.equal(state.rounds,13);assert.equal(state.lastRound.stars,3,'Tipps kosten keine Sterne');assert.equal(state.lastRound.reward,null);assert.ok((await p.locator('.result-panel h2').innerText()).includes('Blumenbeet'));
  await p.goto(base+'#album');await p.locator('.garden-panel').waitFor();assert.equal(await p.locator('.garden-item.unlocked').count(),1);await p.reload();await p.locator('.garden-panel').waitFor();assert.equal((await saved(p)).rounds,13);
  await p.goto(base+'#settings');const exported=JSON.parse(await exportData(p));const second=await open(browser);await second.page.goto(base+'#settings');await upload(second.page,exported);await second.page.locator('[data-action="confirm-import"]').click();await second.page.locator('.hero').waitFor();assert.deepEqual((await saved(second.page)).history,exported.history);
  console.log('OK Altstand unverändert geladen, V2-Migration, themenübergreifende Tagesrunde, persistente Zählmarken, gestufte Hilfen, Vorlesen mit lokaler Stimme, volle Sterne trotz Tipps und Gartenbelohnung.');
  const ongoing=blank();ongoing.active={id:'alte-runde',topic:'g1-count',world:'farm',index:1,ids:[0,1,2,3,4].map(i=>'g1-count:'+i),answers:[{wrong:[],solved:true,hint:false,assisted:false},...Array.from({length:4},(_,i)=>({wrong:[],solved:false,hint:i===0,assisted:false}))]};
  const legacy=await open(browser,ongoing);legacy.page.on('pageerror',e=>errors.push(e.message));await legacy.page.goto(base+'#quiz');await legacy.page.locator('.question-title').waitFor();assert.deepEqual(await saved(legacy.page),ongoing);await legacy.page.locator('[data-action="hint"]').click();await legacy.page.locator('.worked-help').waitFor();assert.equal((await saved(legacy.page)).active.mode,'free');assert.equal((await saved(legacy.page)).active.answers[1].helpLevel,2);
  const bad={...exported,history:{...exported.history,[first]:{...exported.history[first],dueAt:'morgen'}}};await legacy.page.goto(base+'#settings');const before=await saved(legacy.page);await upload(legacy.page,bad);await legacy.page.locator('#toast').waitFor({state:'visible'});assert.deepEqual(await saved(legacy.page),before);
  // Ein reifer Wiederholungsstand muss nach dem Laden denselben Termin behalten.
  const mature=structuredClone(exported);mature.active=null;mature.history[first].needsReview=false;mature.history[first].stage=3;mature.history[first].successfulReviews=4;mature.history[first].attempts=Math.max(4,mature.history[first].attempts);mature.history[first].dueAt=Date.now()+14*86400000;
  const grown=await open(browser,mature);await grown.page.locator('.topic-card[data-topic="g1-count"]').click();await grown.page.locator('.question-title').waitFor();const a=(await saved(grown.page)).active;assert.ok(!a.ids.includes(first),'Nicht fällige bekannte Aufgabe verdrängt keine neuen Aufgaben');
  // Mathematikbild mit Zehnerübergang und unterbrochene Hilfe bleiben bedienbar.
  await grown.page.goto(base+'#adventure');await grown.page.locator('.topic-card[data-topic="g1-add"]').click();await grown.page.locator('[data-action="replace-round"]').click();await grown.page.locator('.question-title').waitFor();await grown.page.locator('[data-action="hint"]').click();await grown.page.locator('[data-action="hint"]').click();await grown.page.locator('.ten-frames').waitFor();
  for(const width of [320,390,768,1440]){await grown.page.setViewportSize({width,height:1000});assert.ok(await grown.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await grown.page.screenshot({path:path.join(root,'tests/guided-help.png'),fullPage:true});
  await grown.page.goto(base+'#adventure');await grown.page.screenshot({path:path.join(root,'tests/guided-home.png'),fullPage:true});
  await p.goto(base+'#album');await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(root,'tests/guided-garden.png'),fullPage:true});
  const fresh=await open(browser);await fresh.page.setViewportSize({width:320,height:700});await fresh.page.screenshot({path:path.join(root,'tests/guided-mobile.png'),fullPage:false});const button=await fresh.page.locator('.hero .button').boundingBox();assert.ok(button.y+button.height<=700,'Startknopf im ersten Bildschirm');
  assert.deepEqual(errors,[]);console.log('OK alte laufende Runde übernommen, ungültige Termine abgewiesen, frühes Üben, Zehnerbilder, responsive Hilfen und Startknopf auf 320 Pixeln sichtbar.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
