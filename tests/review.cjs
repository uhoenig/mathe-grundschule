'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{},Intl};for(const f of ['learning.js','review.js','help.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
const R=ctx.window.MF_REVIEW,L=ctx.window.MF_LEARNING,H=ctx.window.MF_HELP,t=Date.parse('2026-11-20T10:00:00Z');
let h=R.update(null,true,t);assert.equal(h.dueAt,t+R.DAY);assert.equal(h.stage,0);assert.equal(h.successfulReviews,1);
const early=R.update(h,true,t+3600000);assert.equal(early.dueAt,h.dueAt);assert.equal(early.stage,0);assert.equal(early.successfulReviews,1);
for(const days of [3,7,14,30,60,60]){const now=h.dueAt;h=R.update(h,true,now);assert.equal(h.dueAt,now+days*R.DAY);}
const failed=R.update(h,false,t);assert.equal(failed.dueAt,t+R.DAY);assert.equal(failed.stage,0);assert.equal(failed.successfulReviews,0);assert.equal(failed.needsReview,true);
const repaired=R.update(failed,true,failed.dueAt);assert.equal(repaired.dueAt,failed.dueAt+R.DAY);assert.equal(repaired.stage,0);
const known=R.migrate({attempts:5,firstCorrect:4,lastAt:t,needsReview:false});assert.equal(known.dueAt,t+R.DAY);assert.equal(known.successfulReviews,0);
const ids=['g1-count:0','g1-add:0','g1-subtract:0','g2-clock:0'],history=Object.fromEntries(ids.map(id=>[id,R.update(null,false,t-2*R.DAY)]));
const plan=R.plan(1,history,t);assert.equal(plan.reviews,3);assert.equal(plan.newCount,2);assert.equal(plan.ids.length,5);assert.equal(new Set(plan.ids).size,5);assert.ok(ids.slice(0,3).every(id=>plan.ids.includes(id)));assert.ok(!plan.ids.includes('g2-clock:0'));
assert.equal(R.plan(1,history,t-2*R.DAY).reviews,0);
const full=Object.fromEntries(Object.values(L.bank).filter(q=>L.topicById[q.topic].grade===1).map(q=>[q.id,R.update(null,true,t)]));
const practice=R.plan(1,full,t);assert.equal(practice.practice,5);assert.equal(practice.newCount,0);assert.equal(practice.reviews,0);
assert.equal(R.status('g1-add',{},t).label,'Neu entdecken');
const secure=Object.fromEntries([0,1,2].map(i=>{let h=R.update(null,true,t);h=R.update(h,true,h.dueAt);h=R.update(h,true,h.dueAt);return [`g1-add:${i}`,h];}));
assert.equal(R.status('g1-add',secure,t+4*R.DAY).label,'Über Tage gefestigt');assert.equal(R.status('g1-add',secure,t+12*R.DAY).kind,'due');
assert.equal(R.decoration(12),null);assert.equal(R.decoration(13).name,'Ein Blumenbeet');assert.equal(R.decoration(19).name,'Ein Blumenbeet');
for(const q of Object.values(L.bank)){const steps=H.steps(q);assert.ok(steps.length>=1);assert.ok(steps.every(s=>typeof s==='string'&&!s.includes('undefined')));}
console.log('OK Wiederholungen: 1/3/7/14/30/60 Tage, Fehler, frühes Üben, Migration ohne erfundene Sicherheit, Klassenfilter, Themenmix und Garten.');
// Sprachfunktionen wählen ausschließlich lokale deutsche Stimmen.
let used=null,canceled=0;const local={lang:'de-DE',localService:true},cloud={lang:'de-DE',localService:false};
ctx.window.addEventListener=()=>{};ctx.window.speechSynthesis={getVoices:()=>[cloud,local],cancel:()=>canceled++,speak:u=>{used=u;},addEventListener:()=>{}};ctx.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','speech.js'),'utf8'),ctx);
const S=ctx.window.MF_SPEECH;assert.equal(S.available(),true);assert.equal(S.read('12 + 3 = ?'),true);assert.equal(used.voice,local);assert.ok(used.text.includes('plus'));assert.ok(canceled>0);assert.ok(S.spoken('12:30 Uhr').includes('12 Uhr 30'));assert.ok(!S.spoken('12:30 Uhr').includes('geteilt'));assert.ok(S.spoken('1/2').includes('1 von 2'));
ctx.window.speechSynthesis.getVoices=()=>[cloud];assert.equal(S.available(),false);used=null;assert.equal(S.read('Hallo'),false);assert.equal(used,null);
console.log('OK Vorlesen: lokale deutsche Stimme, keine Cloud-Ausweichstimme, mathematische Zeichen und Uhrzeiten.');
