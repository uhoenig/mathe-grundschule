/* MatheFreunde: lokale Einzelkind-App, unabhängig von mathe-abi. */
(() => {
  'use strict';
  const A=window.MF_ANIMALS,L=window.MF_LEARNING,R=window.MF_REVIEW,H=window.MF_HELP,S=window.MF_SPEECH,KEY='mathe-grundschule.progress.v1';
  const main=document.querySelector('#main');
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow='<span aria-hidden="true">→</span>';
  const icons={dots:'⠿',plus:'+',minus:'−',compare:'≶',trail:'↝',shapes:'△',groups:'×',share:'÷',clock:'◷',coin:'€',blocks:'▥',ruler:'↔',fraction:'◒'};
  const fresh=()=>({app:'mathe-grundschule',version:2,grade:1,world:'farm',history:{},topics:{},collected:[],rounds:0,active:null,lastRound:null});
  const worlds=new Set(A.worlds.map(w=>w.id));
  let state=fresh(),lastRaw=null,storageError='',broken=false,conflict=false,pendingImport=null;
  const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  function validate(raw) {
    if(!raw||raw.app!=='mathe-grundschule'||![1,2].includes(raw.version)||!int(raw.grade,1,4)||!worlds.has(raw.world)||!int(raw.rounds,0,1000000))throw Error('Das ist kein unterstützter MatheFreunde-Lernstand.');
    const out=fresh();out.grade=raw.grade;out.world=raw.world;out.rounds=raw.rounds;
    if(!raw.history||typeof raw.history!=='object'||Array.isArray(raw.history)||!raw.topics||typeof raw.topics!=='object'||Array.isArray(raw.topics))throw Error('Der Lernstand ist unvollständig.');
    for(const [id,h]of Object.entries(raw.history)) {
      if(!Object.hasOwn(L.bank,id)||!h||!int(h.attempts,1,1000000)||!int(h.firstCorrect,0,h.attempts)||typeof h.needsReview!=='boolean'||!int(h.lastAt,0,9007199254740991))throw Error('Ungültiger Aufgabenfortschritt.');
      const base={attempts:h.attempts,firstCorrect:h.firstCorrect,needsReview:h.needsReview,lastAt:h.lastAt};
      if(raw.version===2&&(!int(h.stage,0,5)||!int(h.dueAt,0,9007199254740991)||!int(h.successfulReviews,0,h.attempts)))throw Error('Ungültiger Wiederholungstermin.');
      out.history[id]=raw.version===1?R.migrate(base):{...base,stage:h.stage,dueAt:h.dueAt,successfulReviews:h.successfulReviews};
    }
    for(const [id,t]of Object.entries(raw.topics)) {
      if(!Object.hasOwn(L.topicById,id)||!t||!int(t.rounds,1,1000000)||!int(t.stars,1,3))throw Error('Ungültiger Themenfortschritt.');
      out.topics[id]={rounds:t.rounds,stars:t.stars};
    }
    if(!Array.isArray(raw.collected)||new Set(raw.collected).size!==raw.collected.length||raw.collected.some(id=>!A.animals.some(a=>a.id===id)))throw Error('Ungültiges Tieralbum.');
    out.collected=[...raw.collected];
    if(raw.active) {
      const a=raw.active;
      if(typeof a.id!=='string'||a.id.length>100||!Object.hasOwn(L.topicById,a.topic)||!worlds.has(a.world)||!Array.isArray(a.ids)||a.ids.length!==5||new Set(a.ids).size!==5||a.ids.some(id=>!Object.hasOwn(L.bank,id)||(raw.version===2&&a.mode==='daily'?L.topicById[L.bank[id].topic].grade>a.grade:L.bank[id].topic!==a.topic))||!int(a.index,0,4)||!Array.isArray(a.answers)||a.answers.length!==5)throw Error('Die gespeicherte Runde ist ungültig.');
      if(raw.version===2&&(!['daily','free'].includes(a.mode)||!int(a.grade,1,4)||L.topicById[a.topic].grade!==a.grade))throw Error('Ungültige Rundenauswahl.');
      const answers=a.answers.map((v,i)=>{
        if(!v||!Array.isArray(v.wrong)||new Set(v.wrong).size!==v.wrong.length||v.wrong.some(n=>!int(n,0,2)||n===L.bank[a.ids[i]].correct)||typeof v.solved!=='boolean'||typeof v.assisted!=='boolean'||typeof v.hint!=='boolean'||(i<a.index&&!v.solved)||(i>a.index&&(v.solved||v.wrong.length||v.hint||v.assisted))||(v.assisted&&!v.solved))throw Error('Die gespeicherten Antworten sind ungültig.');
        const helpLevel=raw.version===1?(v.hint?1:0):v.helpLevel,marks=raw.version===1?[]:v.marks;
        if(!int(helpLevel,0,2)||!Array.isArray(marks)||new Set(marks).size!==marks.length||marks.some(n=>!int(n,0,(L.bank[a.ids[i]].visual?.n||0)-1)))throw Error('Ungültige Lernhilfe.');
        return {wrong:[...v.wrong],solved:v.solved,assisted:v.assisted,hint:v.hint,helpLevel,marks:[...marks]};
      });
      out.active={id:a.id,topic:a.topic,world:a.world,ids:[...a.ids],index:a.index,answers,mode:raw.version===1?'free':a.mode,grade:raw.version===1?L.topicById[a.topic].grade:a.grade};
    }
    if(raw.lastRound) {
      const s=raw.lastRound;
      if(!Object.hasOwn(L.topicById,s.topic)||!int(s.firstCorrect,0,5)||!int(s.stars,1,3)||!(s.reward===null||out.collected.includes(s.reward))||!worlds.has(s.world))throw Error('Der Rundenabschluss ist ungültig.');
      if(raw.version===2&&(!['daily','free'].includes(s.mode)||!int(s.grade,1,4)))throw Error('Ungültiger Rundenbericht.');
      out.lastRound={topic:s.topic,firstCorrect:s.firstCorrect,stars:s.stars,reward:s.reward,world:s.world,mode:raw.version===1?'free':s.mode,grade:raw.version===1?L.topicById[s.topic].grade:s.grade};
    }
    return out;
  }
  try {lastRaw=localStorage.getItem(KEY);if(lastRaw!==null)state=validate(JSON.parse(lastRaw));}
  catch(e) {if(lastRaw!==null)broken=true;else storageError='Dein Browser kann gerade nicht speichern. Dein Fortschritt bleibt vorerst nur bis zum Schließen dieser Seite. Bitte sichere ihn unter „Für Erwachsene“.';}
  function persist(candidate=state,transaction=false) {
    if(conflict)return false;
    try {
      const current=localStorage.getItem(KEY);
      if(current!==lastRaw){conflict=true;render();return false;}
      const raw=JSON.stringify(candidate);localStorage.setItem(KEY,raw);lastRaw=raw;storageError='';
      if(transaction)state=candidate;
      return true;
    } catch(e) {storageError='Speichern klappt gerade nicht. Deine Antworten bleiben in dieser Sitzung. Bitte sichere deinen Lernstand unter „Für Erwachsene“, bevor du die Seite schließt.';return false;}
  }
  function notice() {return storageError?`<aside class="storage-notice" role="alert">${esc(storageError)} <button data-action="retry-save">Erneut speichern</button> <a href="#settings">Lernstand sichern</a></aside>`:'';}
  function toast(message) {const el=document.querySelector('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true;},3500);}
  const world=id=>A.worlds.find(w=>w.id===(id||state.world));
  const starRow=n=>`<span class="stars" aria-label="${n} von 3 Sternen">${[1,2,3].map(i=>`<span class="${i<=n?'earned':''}" aria-hidden="true">★</span>`).join('')}</span>`;
  function modal(title,body) {document.querySelector('#dialog-content').innerHTML=`<button class="dialog-close" data-action="close-dialog" aria-label="Schließen">×</button><h2>${title}</h2>${body}`;const d=document.querySelector('#dialog');if(!d.open)d.showModal();}
  const close=()=>document.querySelector('#dialog').close();
  function go(page) {if(location.hash===`#${page}`)render();else location.hash=page;}
  function adventure() {
    const w=world(),topics=L.topics.filter(t=>t.grade===state.grade),finished=topics.filter(t=>state.topics[t.id]).length;
    const plan=R.plan(state.grade,state.history);
    const mix=[plan.reviews?`${plan.reviews} wiederholen`:'',plan.newCount?`${plan.newCount} neu entdecken`:'',plan.practice?`${plan.practice} weiterüben`:''].filter(Boolean).join(' · ');
    const active=state.active,activeTopic=active&&L.topicById[active.topic];
    return `<section class="welcome-row"><div><span class="eyebrow">DEIN KLEINES LERNABENTEUER</span><h1>Hallo, Tierfreund<span class="accent-dot">!</span></h1><p>Schön, dass du da bist. Was entdecken wir heute?</p></div><div class="grade-choice"><span>Ich lerne in</span><div role="group" aria-label="Klassenstufe auswählen">${[1,2,3,4].map(n=>`<button data-action="grade" data-grade="${n}" aria-pressed="${n===state.grade}">Klasse ${n}</button>`).join('')}</div></div></section>
    <section class="hero"><div class="hero-copy"><span class="hero-tag"><i></i> MIT DEINEN TIERFREUNDEN</span><h2>Dein Abenteuer<br><span>für heute.</span></h2><p>Fünf kleine Aufgaben mit ${esc(w.buddy)}. Ganz in deinem Tempo.</p><div class="daily-mix"><span aria-hidden="true">↻</span> ${mix}</div><button class="button primary" data-action="${active?'resume':'start'}" data-topic="daily">${active?'Mein Abenteuer fortsetzen':'Mein Abenteuer starten'} ${arrow}</button><span class="hero-note"><span aria-hidden="true">♡</span> Tipps sind willkommen. Wir lernen zusammen.</span></div><div class="hero-art"><img src="assets/learning-friends.webp" alt="Ein freundlicher Dino, ein Pony, ein Schweinchen und ein Löwenkind spielen gemeinsam auf einer Wiese." fetchpriority="high" width="1672" height="941"><span class="art-spark spark-one" aria-hidden="true">✧</span><span class="art-spark spark-two" aria-hidden="true">✦</span><div class="art-note"><span aria-hidden="true">✦</span><div>Jedes Abenteuer zählt.<small>Zusammen wachsen wir!</small></div></div></div></section>
    ${active?`<section class="resume-strip"><span class="resume-icon" aria-hidden="true">↝</span><div><strong>Dein Abenteuer wartet auf dich.</strong><span>Klasse ${active.grade} · ${active.mode==='daily'?'Mein Tagesabenteuer':esc(activeTopic.name)} · Aufgabe ${active.index+1} von 5</span></div><button class="button small" data-action="resume">Weitermachen ${arrow}</button></section>`:''}
    <section class="world-section" aria-labelledby="world-heading"><div class="section-heading"><div><span class="eyebrow">WOHIN SOLL’S GEHEN?</span><h2 id="world-heading">Wähle deine Tierwelt</h2></div><span class="quiet">Deine Welt. Deine Lieblingsfreunde.</span></div><div class="world-grid" role="group" aria-label="Tierwelt auswählen">${A.worlds.map((v,i)=>`<button class="world-card ${v.id===state.world?'selected':''}" style="--world-color:${v.color}" data-action="world" data-world="${v.id}" aria-pressed="${v.id===state.world}"><span class="world-art">${A.svg(v.animal)}</span><span class="world-text"><strong>${v.name}</strong><small>${['Mit Pippa & Freunden','Mit Flocke & Freunden','Mit Leo & Freunden','Mit Momo & Freunden'][i]}</small></span><span class="world-check" aria-hidden="true">${v.id===state.world?'✓':'↗'}</span></button>`).join('')}</div></section>
    <section class="path-section" aria-labelledby="path-heading"><div class="section-heading"><div><span class="eyebrow">SCHRITT FÜR SCHRITT</span><h2 id="path-heading">Dein Lernpfad <span class="class-label">Klasse ${state.grade}</span></h2></div><span class="path-count">${finished} von ${topics.length} entdeckt <span class="mini-progress"><i style="width:${finished/topics.length*100}%"></i></span></span></div><div class="topic-grid">${topics.map((t,i)=>{const p=state.topics[t.id],status=R.status(t.id,state.history);return `<button class="topic-card ${p?'visited':''}" data-action="start" data-topic="${t.id}"><span class="topic-top"><span class="topic-symbol symbol-${t.icon}" aria-hidden="true">${icons[t.icon]}</span><span class="topic-step">${String(i+1).padStart(2,'0')}</span></span><strong>${t.name}</strong><span class="topic-description">${t.description}</span><span class="learning-status status-${status.kind}">${status.label}</span><span class="topic-bottom">${p?starRow(p.stars):'<span>In Ruhe ausprobieren</span>'}<span class="topic-arrow" aria-hidden="true">→</span></span></button>`;}).join('')}</div></section>
    <section class="album-teaser"><div class="teaser-art">${A.svg(w.animal)}</div><div><span class="eyebrow">PLATZ FÜR NEUE FREUNDE</span><h2>${state.collected.length<12?'Ein Abenteuer. Ein neuer Tierfreund.':'Dein Tiergarten wächst weiter.'}</h2><p>${state.collected.length<12?'Nach jeder Runde zieht ein Tier in dein Album ein.':'Blumen, Bäume und gemütliche Plätze: Deine Freunde freuen sich über jedes Abenteuer.'}</p></div><a class="button secondary" href="#album">Mein Tieralbum <span class="pill">${state.collected.length}/12</span> ${arrow}</a></section>`;
  }
  function shapeSVG(shape) {const shapes={circle:'<circle cx="100" cy="75" r="55"/>',triangle:'<path d="m100 15 70 115H30Z"/>',square:'<rect x="45" y="20" width="110" height="110" rx="3"/>',rectangle:'<rect x="20" y="40" width="160" height="80" rx="3"/>'};return `<svg viewBox="0 0 200 150" class="shape-visual" aria-label="Eine geometrische Form" role="img" fill="#b9d1bc" stroke="#54725c" stroke-width="3">${shapes[shape]}</svg>`;}
  function visual(q,w) {
    const v=q.visual;if(!v)return '';
    if(v.type==='count'){const marks=state.active?.answers[state.active.index].marks||[];return `<div class="count-visual" aria-label="Tiere antippen und zählen">${Array.from({length:v.n},(_,i)=>`<button class="count-token ${marks.includes(i)?'marked':''}" data-action="mark-animal" data-mark="${i}" aria-label="Tier ${i+1} markieren" aria-pressed="${marks.includes(i)}">${A.svg(w.animal,'count-animal')}<span aria-hidden="true">✓</span></button>`).join('')}</div>`;}
    if(v.type==='addition')return `<div class="addition-visual" aria-label="Zwei Mengen zum Zusammenzählen"><div>${Array.from({length:v.a},()=>'<i></i>').join('')}</div><b aria-hidden="true">+</b><div>${Array.from({length:v.b},()=>'<i></i>').join('')}</div></div>`;
    if(v.type==='groups')return `<div class="group-visual" role="img" aria-label="${v.groups} Gruppen mit je ${v.each} Punkten">${Array.from({length:v.groups},()=>`<div class="dot-group">${Array.from({length:v.each},()=>'<i></i>').join('')}</div>`).join('')}</div>`;
    if(v.type==='shape')return shapeSVG(v.shape);
    if(v.type==='coins')return `<div class="coins-visual">${v.values.map(n=>`<span>${n}<small>Cent</small></span>`).join('<b>+</b>')}</div>`;
    if(v.type==='clock') {const minute=v.minute*6,hour=(v.hour%12)*30+v.minute*.5;return `<svg viewBox="0 0 220 220" class="clock-visual" role="img" aria-label="Analoge Uhr"><circle cx="110" cy="110" r="99" fill="#fffdf7" stroke="#d6b76d" stroke-width="8"/>${Array.from({length:12},(_,i)=>{const angle=(i+1)*Math.PI/6;return `<text x="${110+78*Math.sin(angle)}" y="${116-78*Math.cos(angle)}" text-anchor="middle" fill="#3e5143" font-size="18" font-family="sans-serif">${i+1}</text>`;}).join('')}<path d="M110 110V61" stroke="#3e5143" stroke-width="7" stroke-linecap="round" transform="rotate(${hour} 110 110)"/><path d="M110 110V38" stroke="#c88e58" stroke-width="5" stroke-linecap="round" transform="rotate(${minute} 110 110)"/><circle cx="110" cy="110" r="6" fill="#3e5143"/></svg>`;}
    if(v.type==='fraction')return `<div class="fraction-visual" style="--parts:${v.b}" role="img" aria-label="${v.b} gleich große Teile, davon ${v.a} grün">${Array.from({length:v.b},(_,i)=>`<span class="${i<v.a?'filled':''}"></span>`).join('')}</div>`;
    if(v.type==='rectangle')return `<div class="rectangle-visual"><span class="rect-top">${v.a} cm</span><span class="rect-side">${v.b} cm</span><div style="--cols:${v.a};--rows:${v.b};aspect-ratio:${v.a}/${v.b}">${v.area?Array.from({length:v.a*v.b},()=>'<i></i>').join(''):''}</div></div>`;
    return '';
  }
  function readButton(kind,label) {return `<button class="read-button" data-action="read" data-read="${kind}" ${S.available()?'':'disabled'} title="${S.available()?'Mit der Stimme deines Geräts vorlesen':'Keine lokale deutsche Stimme auf diesem Gerät verfügbar'}"><span aria-hidden="true">◖))</span> ${label}</button>${!S.available()&&kind==='question'?'<span class="speech-unavailable">Vorlesen ist auf diesem Gerät nicht verfügbar.</span>':''}`;}
  function helpPicture(q) {
    if(['add','sub'].includes(q.kind)&&q.a<=20&&q.b<=20&&(q.kind==='sub'||q.a+q.b<=20)){
      const total=q.kind==='add'?q.a+q.b:q.a;
      return `<div class="math-picture"><span>${q.kind==='add'?'Grüne und goldene Punkte gehören zusammen.':'Die gestrichelten Punkte nehmen wir weg.'}</span><div class="ten-frames" role="img" aria-label="${q.kind==='add'?`${q.a} Punkte und ${q.b} weitere Punkte`:`${q.a} Punkte, davon ${q.b} durchgestrichen`}">${Array.from({length:Math.ceil(total/10)},(_,row)=>`<div class="ten-frame">${Array.from({length:10},(_,i)=>{const n=row*10+i;return `<i class="${n>=total?'empty':q.kind==='sub'&&n>=q.a-q.b?'removed':q.kind==='add'&&n>=q.a?'added':''}"></i>`;}).join('')}</div>`).join('')}</div></div>`;
    }
    return '';
  }
  function garden() {
    const extras=Math.max(0,state.rounds-12);
    if(!extras)return '';
    return `<section class="garden-panel"><div><span class="eyebrow">GEMEINSAM WEITERWACHSEN</span><h2>Dein kleiner Tiergarten</h2><p>${extras} Gartenfreude${extras===1?'':'n'} entdeckt. Nach jeder weiteren Runde wächst dein Garten.</p></div><div class="garden-items">${R.decorations.map((d,i)=>{const count=extras>i?1+Math.floor((extras-i-1)/R.decorations.length):0;return `<div class="garden-item ${count?'unlocked':''}"><span aria-hidden="true">${count?d.icon:'?'}</span><strong>${count?d.name:'Noch eine Überraschung'}</strong>${count?`<small>${count} × entdeckt</small>`:''}</div>`;}).join('')}</div></section>`;
  }
  function quiz() {
    const a=state.active;if(!a){go('adventure');return '';}
    const q=L.bank[a.ids[a.index]],answer=a.answers[a.index],w=world(a.world),t=L.topicById[q.topic];
    const feedback=answer.solved?`<div class="feedback success" role="status" tabindex="-1"><span class="feedback-mark" aria-hidden="true">✓</span><div><strong>${answer.assisted?'Zusammen haben wir’s geschafft!':answer.wrong.length?'Prima, du hast weitergedacht!':'Das hast du richtig gut gemacht!'}</strong><p>${esc(q.explanation)}</p></div></div>`:answer.wrong.length?`<div class="feedback encouragement" role="status"><span aria-hidden="true">♡</span><div><strong>Noch ein kleiner Versuch.</strong><p>${esc(q.hint)}</p></div></div>`:answer.hint?`<div class="feedback encouragement" role="status"><span aria-hidden="true">✦</span><div><strong>Ein Tipp für dich</strong><p>${esc(q.hint)}</p></div></div>`:'';
    return `<div class="quiz-shell"><div class="quiz-top"><a href="#adventure" class="back-link">← Pause machen</a><span>${a.mode==='daily'?'Tagesabenteuer · ':''}Klasse ${t.grade} · ${esc(t.name)}</span><span class="quiz-counter">${a.index+1}<small> / 5</small></span></div><div class="quiz-progress" role="progressbar" aria-label="Aufgaben geschafft" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${a.index+(answer.solved?1:0)}">${a.answers.map((v,i)=>`<span class="${v.solved?'done':i===a.index?'current':''}"></span>`).join('')}</div><div class="buddy-line">${A.svg(w.animal,'buddy-art')}<p><strong>${esc(w.buddy)} begleitet dich.</strong><span>${answer.solved?'Wir sind ein tolles Team!':'Lass dir Zeit. Wir schaffen das zusammen.'}</span></p></div><section class="question-panel"><span class="eyebrow">DEIN ${a.index+1}. KLEINER SCHRITT</span><h1 class="question-title" tabindex="-1">${esc(q.prompt)}</h1><div class="reading-tools">${readButton('question','Aufgabe vorlesen')}</div>${visual(q,w)}${answer.helpLevel>=2&&!answer.solved?helpPicture(q):''}<div class="answers" role="group" aria-label="Wähle eine Antwort">${q.options.map((option,i)=>`<button class="answer ${option.length>6?'long':''} ${answer.solved&&i===q.correct?'correct':''} ${answer.wrong.includes(i)?'tried':''}" data-action="answer" data-answer="${i}" ${answer.solved||answer.wrong.includes(i)?'disabled':''}><span class="answer-letter" aria-hidden="true">${answer.solved&&i===q.correct?'✓':answer.wrong.includes(i)?'↻':['A','B','C'][i]}</span><span>${esc(option)}</span></button>`).join('')}</div>${feedback}${answer.helpLevel>=2&&!answer.solved?`<section class="worked-help" aria-label="Schritt für Schritt"><strong>Schauen wir gemeinsam hin.</strong><ol>${H.steps(q).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>${readButton('help','Schritte vorlesen')}</section>`:''}${answer.solved?`<div class="solution-reading">${readButton('solution','Erklärung vorlesen')}</div>`:''}<div class="question-actions">${answer.solved?`<span class="reassurance">${a.index===4?'Dein Tierfreund wartet schon.':'Ein kleiner Schritt weiter.'}</span><button class="button primary" data-action="next">${a.index===4?'Runde geschafft!':'Nächste Aufgabe'} ${arrow}</button>`:`<button class="text-button" data-action="hint">${answer.helpLevel>=2?'Schritte noch einmal ansehen':answer.helpLevel===1?'Zeig mir den nächsten Schritt':'Ich brauche einen Tipp'} <span aria-hidden="true">✧</span></button><button class="text-button" data-action="explain">Zeig mir, wie’s geht ${arrow}</button>`}</div></section><p class="quiz-footer">Kein Zeitdruck. Kein Stress. Nur du und deine Neugier.</p></div>`;
  }
  function album() {
    return `${garden()}<section class="page-heading"><span class="eyebrow">DEINE KLEINE TIERFAMILIE</span><h1>Hallo, neue Freunde<span class="accent-dot">!</span></h1><p>Jede abgeschlossene Runde bringt einen Tierfreund in dein Album.</p></section><div class="album-summary"><span class="large-heart" aria-hidden="true">♡</span><div><strong>${state.collected.length} von 12 Tierfreunden entdeckt</strong><p>${state.collected.length===12?'Alle sind da! Deine Freunde freuen sich auf weitere Abenteuer mit dir.':'Deine Freunde warten auf dich. Du musst nicht alles richtig machen, um sie zu entdecken.'}</p></div><a href="#adventure" class="button primary">Weiter entdecken ${arrow}</a></div>${A.worlds.map(w=>`<section class="album-world"><div class="section-heading"><h2>${w.name}</h2><span class="quiet">${state.collected.filter(id=>A.animals.find(a=>a.id===id).world===w.id).length} von 3 Freunden</span></div><div class="album-grid">${A.animals.filter(a=>a.world===w.id).map(an=>{const found=state.collected.includes(an.id);return `<article class="album-card ${found?'collected':'undiscovered'}" style="--world-color:${w.color}"><div class="album-animal">${found?A.svg(an.id):'<span class="egg" aria-hidden="true">?</span>'}</div><span class="eyebrow">${found?'DEIN TIERFREUND':'WER SICH HIER VERSTECKT?'}</span><h3>${found?an.name:'Noch ein kleiner Freund'}</h3><p>${found?'Schön, dass wir zusammen lernen!':'Schließe eine Runde ab und entdecke ein Tier.'}</p>${found?'<span class="collected-tag">♡ Im Team</span>':''}</article>`;}).join('')}</div></section>`).join('')}`;
  }
  function result() {
    const r=state.lastRound;if(!r){go('adventure');return '';}
    const t=L.topicById[r.topic],decoration=R.decoration(state.rounds),an=A.animals.find(a=>a.id===r.reward),w=world(r.world);
    return `<section class="result-panel"><span class="eyebrow">FÜNF KLEINE SCHRITTE. EIN GROSSES LÄCHELN.</span><h1>Du bist ein Stück gewachsen!</h1><p>Du hast dich mit „${r.mode==='daily'?'Dein Tagesabenteuer':esc(t.name)}“ beschäftigt. Darauf kannst du stolz sein.</p><div class="result-stars">${starRow(r.stars)}</div><div class="new-friend" style="--world-color:${w.color}">${an?A.svg(an.id):`<span class="decoration-reward" aria-hidden="true">${decoration?.icon||'✿'}</span>`}<span class="reward-spark" aria-hidden="true">✦</span></div><span class="eyebrow">${an?'EIN NEUER FREUND FÜR DEIN ALBUM':'ETWAS SCHÖNES FÜR DEINEN TIERGARTEN'}</span><h2>${an?`Hallo, ${an.name}!`:decoration?.name||'Schön, dass du weiterlernst!'}</h2><p>${an?'Dieser Tierfreund gehört jetzt zu deinem Team.':decoration?.description||'Dein Tiergarten wächst mit dir.'}</p><div class="result-insight"><span aria-hidden="true">♡</span> ${r.firstCorrect===5?'Alle fünf Aufgaben gleich beim ersten Versuch gelöst. Toll mitgedacht!':'Du hast alle fünf Aufgaben geschafft – auch mit Tipps und Ausprobieren. So geht Lernen!'}</div><div class="button-row"><button class="button primary" data-action="again" data-topic="${r.mode==='daily'?'daily':t.id}">Noch ein kleines Abenteuer ${arrow}</button><a href="#album" class="button secondary">Mein Tieralbum</a></div><a href="#adventure" class="back-link">Zurück zu meinen Abenteuern</a></section>`;
  }
  function settings() {
    return `<section class="page-heading"><span class="eyebrow">FÜR ERWACHSENE</span><h1>Ein guter Platz zum Lernen.</h1><p>Ein Kind, ein Browser, viele kleine Entdeckungen.</p></section><div class="settings-grid"><section class="settings-card"><span class="setting-icon" aria-hidden="true">↗</span><h2>Lernstand sichern</h2><p>Fortschritt, Tieralbum und eine laufende Runde als Datei herunterladen. Damit lässt sich der Stand auch auf ein anderes Gerät übertragen.</p><button class="button primary" data-action="export">Sicherung herunterladen</button></section><section class="settings-card"><span class="setting-icon" aria-hidden="true">↙</span><h2>Lernstand wiederherstellen</h2><p>Eine Sicherung von MatheFreunde auswählen. Der aktuelle Stand wird erst nach Prüfung und deiner Bestätigung ersetzt.</p><button class="button secondary" data-action="import">Sicherung auswählen</button><input id="import-file" type="file" accept="application/json,.json" hidden></section><section class="settings-card"><h2>So wird gelernt</h2><p>24 Themen für Klasse 1–4, jeweils mit 20 Aufgabenvarianten. Eine Runde enthält fünf Aufgaben. Das Tagesabenteuer mischt bis zu drei fällige Wiederholungen mit neuen Aufgaben aus der gewählten Klasse. Wiederholungen können auch aus bereits geübten niedrigeren Klassen stammen.</p><p>Alle Klassen und Themen sind frei zugänglich. Wiederholt wird nach 1, 3, 7, 14, 30 und 60 Tagen. Bei Hilfebedarf folgt die nächste Wiederholung am Folgetag. Frühes Zusatzüben verlängert keinen Termin. Sterne belohnen gelöste Aufgaben; das Anfordern von Tipps kostet keine Sterne. Nach zwölf Tieren wächst der Tiergarten weiter. Es gibt keinen Zeitdruck und keine Rangliste.</p><p>Dieses erste Grundlagenpaket ergänzt Unterricht und gemeinsames Lernen. Es bildet nicht den gesamten Grundschullehrplan ab.</p></section><section class="settings-card"><h2>Vorlesen & Datenschutz</h2><p>Vorlesen verwendet ausschließlich eine lokale deutsche Stimme dieses Geräts. Ist keine vorhanden, bleiben alle Aufgaben als Text bedienbar. Es werden keine Texte an einen externen Sprachdienst gesendet.</p><p>Antworten und Einstellungen werden ausschließlich im lokalen Speicher dieses Browsers gespeichert. Es gibt keine Anmeldung, keine automatische Synchronisierung und keine eigenen Analyse- oder Trackingdienste.</p><p>Privates Surfen oder gelöschte Browserdaten können den Lernstand entfernen. Regelmäßige Sicherungen helfen. Die Sicherungsdatei enthält Lerndaten.</p><p>Beim Laden über GitHub Pages verarbeitet GitHub Verbindungsdaten. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">Datenschutzhinweise von GitHub ↗</a></p></section></div><section class="reset-card"><div><h2>Ganz von vorn anfangen</h2><p>Fortschritt und Album auf diesem Browser zurücksetzen.</p></div><button class="button danger" data-action="reset">Lernstand zurücksetzen</button></section>`;
  }
  function recovery() {return `<section class="recovery-panel"><span class="eyebrow">DEIN LERNSTAND BLEIBT GESCHÜTZT</span><h1>${conflict?'Die Seite ist noch in einem anderen Tab offen.':'Der Lernstand konnte nicht gelesen werden.'}</h1><p>${conflict?'In einem anderen Tab wurde weitergelernt. Lade den aktuellen Stand, bevor du hier weitermachst. Du kannst diesen Sitzungsstand vorher sichern.':'Die gespeicherten Daten wurden nicht verändert. Sichere sie zuerst. Danach kannst du eine gültige Sicherung laden oder neu anfangen.'}</p><div class="button-row"><button class="button primary" data-action="${conflict?'reload':'export-raw'}">${conflict?'Aktuellen Stand laden':'Gespeicherte Daten sichern'}</button><button class="button secondary" data-action="${conflict?'export':'import'}">${conflict?'Diesen Sitzungsstand sichern':'Sicherung laden'}</button>${!conflict?'<button class="button danger" data-action="reset">Neu anfangen</button>':''}</div><input id="import-file" type="file" accept="application/json,.json" hidden></section>`;}
  function render(focus=false) {
    S.stop();
    document.body.dataset.world=state.active&&location.hash==='#quiz'?state.active.world:state.world;
    const routes={adventure,quiz,album,result,settings};let page=location.hash.slice(1)||'adventure';if(!Object.hasOwn(routes,page))page='adventure';
    document.body.classList.toggle('is-quiz',page==='quiz');
    document.querySelectorAll('[data-nav]').forEach(el=>{const selected=el.dataset.nav===(['quiz','result'].includes(page)?'adventure':page);if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    document.querySelector('#album-count').textContent=state.collected.length;
    main.innerHTML=(broken||conflict)?recovery():notice()+routes[page]();
    document.title=`${({adventure:'Mein Abenteuer',quiz:'Zusammen lernen',album:'Mein Tieralbum',result:'Runde geschafft',settings:'Für Erwachsene'})[page]} · MatheFreunde`;
    if(focus){const target=main.querySelector('.question-title,h1')||main;target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  }
  function begin(topicId,force=false) {
    const daily=topicId==='daily',plan=daily?R.plan(state.grade,state.history):null;
    if(!daily&&!Object.hasOwn(L.topicById,topicId))return;
    if(state.active&&!force){modal('Dein Abenteuer läuft noch.',`<p>Du kannst deine Runde weitermachen oder eine neue beginnen. Bereits gelöste Aufgaben bleiben gespeichert.</p><div class="button-row"><button class="button primary" data-action="resume">Runde weitermachen</button><button class="button secondary" data-action="replace-round" data-topic="${topicId}">Neue Runde beginnen</button></div>`);return;}
    state.active={id:globalThis.crypto?.randomUUID?.()||`round-${Date.now()}-${Math.random()}`,topic:daily?plan.topic:topicId,mode:daily?'daily':'free',grade:daily?state.grade:L.topicById[topicId].grade,world:state.world,ids:daily?plan.ids:R.topicQueue(topicId,state.history),index:0,answers:Array.from({length:5},()=>({wrong:[],solved:false,assisted:false,hint:false,helpLevel:0,marks:[]}))};
    persist();go('quiz');
  }
  function solve(assisted=false) {
    const a=state.active;if(!a)return;const q=L.bank[a.ids[a.index]],v=a.answers[a.index];if(v.solved)return;
    v.solved=true;v.assisted=assisted;
    const independent=!v.wrong.length&&!v.hint&&!assisted;
    state.history[q.id]=R.update(state.history[q.id],independent);
    persist();render();main.querySelector('.feedback')?.focus({preventScroll:true});
  }
  function finish() {
    const a=state.active;if(!a||!a.answers.every(v=>v.solved))return;
    const firstCorrect=a.answers.filter(v=>!v.wrong.length&&!v.assisted).length,stars=firstCorrect===5?3:firstCorrect>=3?2:1;
    for(const topic of new Set(a.ids.map(id=>L.bank[id].topic))){const old=state.topics[topic]||{rounds:0,stars:0};state.topics[topic]={rounds:old.rounds+1,stars:Math.max(old.stars,stars)};}
    const available=A.animals.filter(an=>!state.collected.includes(an.id)),reward=(available.find(an=>an.world===a.world)||available[0])?.id||null;
    if(reward)state.collected.push(reward);state.rounds++;state.lastRound={topic:a.topic,mode:a.mode,grade:a.grade,world:a.world,firstCorrect,stars,reward};state.active=null;
    persist();go('result');
  }
  function download(data,filename,raw=false) {const url=URL.createObjectURL(new Blob([raw?data:JSON.stringify(data,null,2)],{type:'application/json'})),el=document.createElement('a');el.href=url;el.download=filename;document.body.append(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
    if((broken||conflict)&&!['export','export-raw','import','reset','confirm-reset','close-dialog','reload','confirm-import'].includes(action))return;
    if(action==='grade'){state.grade=Number(b.dataset.grade);persist();render();}
    if(action==='world'){state.world=b.dataset.world;persist();render();toast(`${world().buddy} freut sich auf dich!`);}
    if(action==='start'||action==='again')begin(b.dataset.topic);
    if(action==='replace-round'){close();begin(b.dataset.topic,true);}
    if(action==='resume'){close();go('quiz');}
    if(action==='answer'){
      const a=state.active;if(!a)return;const q=L.bank[a.ids[a.index]],v=a.answers[a.index],n=Number(b.dataset.answer);if(v.solved||v.wrong.includes(n))return;
      if(n===q.correct)solve();else{v.wrong.push(n);v.hint=true;v.helpLevel=Math.max(1,v.helpLevel);persist();render();main.querySelector('.answers .answer:not(:disabled)')?.focus({preventScroll:true});}
    }
    if(action==='hint'){const a=state.active;if(a&&!a.answers[a.index].solved){a.answers[a.index].hint=true;a.answers[a.index].helpLevel=Math.min(2,a.answers[a.index].helpLevel+1);persist();render();}}
    if(action==='mark-animal'){const a=state.active;if(!a)return;const v=a.answers[a.index],n=Number(b.dataset.mark);v.marks=v.marks.includes(n)?v.marks.filter(x=>x!==n):[...v.marks,n];persist();b.classList.toggle('marked',v.marks.includes(n));b.setAttribute('aria-pressed',String(v.marks.includes(n)));}
    if(action==='read'){const a=state.active;if(!a)return;const q=L.bank[a.ids[a.index]],text=b.dataset.read==='solution'?q.explanation:b.dataset.read==='help'?H.steps(q).join(' '):q.prompt+' '+q.options.map((option,i)=>`Antwort ${['A','B','C'][i]} lautet ${option}.`).join(' ');if(!S.read(text))toast('Auf diesem Gerät ist keine lokale deutsche Stimme verfügbar.');}
    if(action==='explain')solve(true);
    if(action==='next'){const a=state.active;if(!a||!a.answers[a.index].solved)return;if(a.index===4)finish();else{a.index++;persist();render(true);}}
    if(action==='close-dialog')close();
    if(action==='export')download({...state,exportedAt:new Date().toISOString()},`MatheFreunde-Lernstand-${new Date().toISOString().slice(0,10)}.json`);
    if(action==='export-raw')download(lastRaw||'',`MatheFreunde-Originalstand.json`,true);
    if(action==='import')document.querySelector('#import-file')?.click();
    if(action==='confirm-import'&&pendingImport){if(persist(pendingImport,true)){pendingImport=null;broken=false;close();go('adventure');toast('Dein Lernstand ist wieder da.');}else toast('Wiederherstellen fehlgeschlagen. Der bisherige Stand bleibt erhalten.');}
    if(action==='reset')modal('Wirklich von vorn anfangen?',`<p>Dein Tieralbum und dein Lernfortschritt werden auf diesem Browser gelöscht. Sichere deinen Stand, wenn du ihn behalten möchtest.</p><div class="button-row"><button class="button secondary" data-action="${broken?'export-raw':'export'}">Erst sichern</button><button class="button primary" data-action="close-dialog">Behalten</button><button class="button danger" data-action="confirm-reset">Ja, neu anfangen</button></div>`);
    if(action==='confirm-reset'){if(persist(fresh(),true)){broken=false;close();go('adventure');toast('Ein neues Abenteuer beginnt.');}else toast('Zurücksetzen fehlgeschlagen. Der bisherige Stand bleibt erhalten.');}
    if(action==='retry-save'){if(persist())toast('Dein Lernstand ist gespeichert.');render();}
    if(action==='reload')location.reload();
  });
  document.addEventListener('change',async event=>{
    if(event.target.id!=='import-file')return;const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{if(file.size>2*1024*1024)throw Error('Die Datei ist zu groß. Bitte wähle eine MatheFreunde-Sicherung bis 2 MB.');pendingImport=validate(JSON.parse(await file.text()));modal('Diesen Lernstand laden?',`<p>Die Sicherung enthält ${pendingImport.rounds} abgeschlossene Runden und ${pendingImport.collected.length} Tierfreunde. Sie ersetzt deinen aktuellen Stand.</p><div class="button-row"><button class="button secondary" data-action="export">Bisherigen Stand sichern</button><button class="button secondary" data-action="close-dialog">Abbrechen</button><button class="button primary" data-action="confirm-import">Lernstand laden</button></div>`);}
    catch(e){pendingImport=null;toast(e instanceof SyntaxError?'Die Datei enthält kein gültiges JSON. Dein Stand bleibt erhalten.':e.message);}
  });
  window.addEventListener('mf-voices',()=>{document.querySelectorAll('[data-action="read"]').forEach(b=>{b.disabled=!S.available();b.title=S.available()?'Mit der Stimme deines Geräts vorlesen':'Keine lokale deutsche Stimme auf diesem Gerät verfügbar';});document.querySelectorAll('.speech-unavailable').forEach(el=>{el.hidden=S.available();});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)S.stop();else if(!state.active&&!broken&&!conflict)render();});
  setInterval(()=>{if(!document.hidden&&!state.active&&!broken&&!conflict&&(!location.hash||location.hash==='#adventure'))render();},60000);
  window.addEventListener('hashchange',()=>render(true));
  window.addEventListener('storage',event=>{if((event.key===KEY||event.key===null)&&event.newValue!==lastRaw){conflict=true;close();render(true);}});
  render();
})();
