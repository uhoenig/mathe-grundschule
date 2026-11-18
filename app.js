/* MatheFreunde: lokale Einzelkind-App, unabhängig von mathe-abi. */
(() => {
  'use strict';
  const A=window.MF_ANIMALS,L=window.MF_LEARNING,KEY='mathe-grundschule.progress.v1';
  const main=document.querySelector('#main');
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow='<span aria-hidden="true">→</span>';
  const icons={dots:'⠿',plus:'+',minus:'−',compare:'≶',trail:'↝',shapes:'△',groups:'×',share:'÷',clock:'◷',coin:'€',blocks:'▥',ruler:'↔',fraction:'◒'};
  const fresh=()=>({app:'mathe-grundschule',version:1,grade:1,world:'farm',history:{},topics:{},collected:[],rounds:0,active:null,lastRound:null});
  const worlds=new Set(A.worlds.map(w=>w.id));
  let state=fresh(),lastRaw=null,storageError='',broken=false,conflict=false,pendingImport=null;
  const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  function validate(raw) {
    if(!raw||raw.app!=='mathe-grundschule'||raw.version!==1||!int(raw.grade,1,4)||!worlds.has(raw.world)||!int(raw.rounds,0,1000000))throw Error('Das ist kein unterstützter MatheFreunde-Lernstand.');
    const out=fresh();out.grade=raw.grade;out.world=raw.world;out.rounds=raw.rounds;
    if(!raw.history||typeof raw.history!=='object'||Array.isArray(raw.history)||!raw.topics||typeof raw.topics!=='object'||Array.isArray(raw.topics))throw Error('Der Lernstand ist unvollständig.');
    for(const [id,h]of Object.entries(raw.history)) {
      if(!Object.hasOwn(L.bank,id)||!h||!int(h.attempts,1,1000000)||!int(h.firstCorrect,0,h.attempts)||typeof h.needsReview!=='boolean'||!int(h.lastAt,0,9007199254740991))throw Error('Ungültiger Aufgabenfortschritt.');
      out.history[id]={attempts:h.attempts,firstCorrect:h.firstCorrect,needsReview:h.needsReview,lastAt:h.lastAt};
    }
    for(const [id,t]of Object.entries(raw.topics)) {
      if(!Object.hasOwn(L.topicById,id)||!t||!int(t.rounds,1,1000000)||!int(t.stars,1,3))throw Error('Ungültiger Themenfortschritt.');
      out.topics[id]={rounds:t.rounds,stars:t.stars};
    }
    if(!Array.isArray(raw.collected)||new Set(raw.collected).size!==raw.collected.length||raw.collected.some(id=>!A.animals.some(a=>a.id===id)))throw Error('Ungültiges Tieralbum.');
    out.collected=[...raw.collected];
    if(raw.active) {
      const a=raw.active;
      if(typeof a.id!=='string'||a.id.length>100||!Object.hasOwn(L.topicById,a.topic)||!worlds.has(a.world)||!Array.isArray(a.ids)||a.ids.length!==5||new Set(a.ids).size!==5||a.ids.some(id=>!Object.hasOwn(L.bank,id)||L.bank[id].topic!==a.topic)||!int(a.index,0,4)||!Array.isArray(a.answers)||a.answers.length!==5)throw Error('Die gespeicherte Runde ist ungültig.');
      const answers=a.answers.map((v,i)=>{
        if(!v||!Array.isArray(v.wrong)||new Set(v.wrong).size!==v.wrong.length||v.wrong.some(n=>!int(n,0,2)||n===L.bank[a.ids[i]].correct)||typeof v.solved!=='boolean'||typeof v.assisted!=='boolean'||typeof v.hint!=='boolean'||(i<a.index&&!v.solved)||(i>a.index&&(v.solved||v.wrong.length||v.hint||v.assisted))||(v.assisted&&!v.solved))throw Error('Die gespeicherten Antworten sind ungültig.');
        return {wrong:[...v.wrong],solved:v.solved,assisted:v.assisted,hint:v.hint};
      });
      out.active={id:a.id,topic:a.topic,world:a.world,ids:[...a.ids],index:a.index,answers};
    }
    if(raw.lastRound) {
      const s=raw.lastRound;
      if(!Object.hasOwn(L.topicById,s.topic)||!int(s.firstCorrect,0,5)||!int(s.stars,1,3)||!(s.reward===null||out.collected.includes(s.reward))||!worlds.has(s.world))throw Error('Der Rundenabschluss ist ungültig.');
      out.lastRound={topic:s.topic,firstCorrect:s.firstCorrect,stars:s.stars,reward:s.reward,world:s.world};
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
    const next=topics.find(t=>!state.topics[t.id])||topics.reduce((a,b)=>(state.topics[a.id]?.stars||0)<=(state.topics[b.id]?.stars||0)?a:b);
    const active=state.active,activeTopic=active&&L.topicById[active.topic];
    return `<section class="welcome-row"><div><span class="eyebrow">DEIN KLEINES LERNABENTEUER</span><h1>Hallo, Tierfreund<span class="accent-dot">!</span></h1><p>Schön, dass du da bist. Was entdecken wir heute?</p></div><div class="grade-choice"><span>Ich lerne in</span><div role="group" aria-label="Klassenstufe auswählen">${[1,2,3,4].map(n=>`<button data-action="grade" data-grade="${n}" aria-pressed="${n===state.grade}">Klasse ${n}</button>`).join('')}</div></div></section>
    <section class="hero"><div class="hero-copy"><span class="hero-tag"><i></i> MIT DEINEN TIERFREUNDEN</span><h2>Kleine Schritte.<br>Große <span>Abenteuer.</span></h2><p>Entdecke Mathe mit ${esc(w.buddy)} und deinen Tierfreunden. Fünf kleine Aufgaben. Ganz in deinem Tempo.</p><button class="button primary" data-action="${active?'resume':'start'}" data-topic="${next.id}">${active?'Weiter geht’s':'Los geht’s!'} ${arrow}</button><span class="hero-note"><span aria-hidden="true">♡</span> Du darfst ausprobieren. Fehler helfen beim Lernen.</span></div><div class="hero-art"><img src="assets/learning-friends.webp" alt="Ein freundlicher Dino, ein Pony, ein Schweinchen und ein Löwenkind spielen gemeinsam auf einer Wiese." fetchpriority="high" width="1536" height="1024"><span class="art-spark spark-one" aria-hidden="true">✧</span><span class="art-spark spark-two" aria-hidden="true">✦</span><div class="art-note"><span aria-hidden="true">✦</span><div>Jedes Abenteuer zählt.<small>Zusammen wachsen wir!</small></div></div></div></section>
    ${active?`<section class="resume-strip"><span class="resume-icon" aria-hidden="true">↝</span><div><strong>Dein Abenteuer wartet auf dich.</strong><span>Klasse ${activeTopic.grade} · ${esc(activeTopic.name)} · Aufgabe ${active.index+1} von 5</span></div><button class="button small" data-action="resume">Weitermachen ${arrow}</button></section>`:''}
    <section class="world-section" aria-labelledby="world-heading"><div class="section-heading"><div><span class="eyebrow">WOHIN SOLL’S GEHEN?</span><h2 id="world-heading">Wähle deine Tierwelt</h2></div><span class="quiet">Deine Welt. Deine Lieblingsfreunde.</span></div><div class="world-grid" role="group" aria-label="Tierwelt auswählen">${A.worlds.map((v,i)=>`<button class="world-card ${v.id===state.world?'selected':''}" style="--world-color:${v.color}" data-action="world" data-world="${v.id}" aria-pressed="${v.id===state.world}"><span class="world-art">${A.svg(v.animal)}</span><span class="world-text"><strong>${v.name}</strong><small>${['Mit Pippa & Freunden','Mit Flocke & Freunden','Mit Leo & Freunden','Mit Momo & Freunden'][i]}</small></span><span class="world-check" aria-hidden="true">${v.id===state.world?'✓':'↗'}</span></button>`).join('')}</div></section>
    <section class="path-section" aria-labelledby="path-heading"><div class="section-heading"><div><span class="eyebrow">SCHRITT FÜR SCHRITT</span><h2 id="path-heading">Dein Lernpfad <span class="class-label">Klasse ${state.grade}</span></h2></div><span class="path-count">${finished} von ${topics.length} entdeckt <span class="mini-progress"><i style="width:${finished/topics.length*100}%"></i></span></span></div><div class="topic-grid">${topics.map((t,i)=>{const p=state.topics[t.id];return `<button class="topic-card ${p?'visited':''}" data-action="start" data-topic="${t.id}"><span class="topic-top"><span class="topic-symbol symbol-${t.icon}" aria-hidden="true">${icons[t.icon]}</span><span class="topic-step">${String(i+1).padStart(2,'0')}</span></span><strong>${t.name}</strong><span class="topic-description">${t.description}</span><span class="topic-bottom">${p?starRow(p.stars):'<span>5 kleine Aufgaben</span>'}<span class="topic-arrow" aria-hidden="true">→</span></span></button>`;}).join('')}</div></section>
    <section class="album-teaser"><div class="teaser-art">${A.svg(w.animal)}</div><div><span class="eyebrow">PLATZ FÜR NEUE FREUNDE</span><h2>Ein Abenteuer. Ein neuer Tierfreund.</h2><p>Nach jeder Runde zieht ein Tier in dein Album ein. Wer wartet wohl auf dich?</p></div><a class="button secondary" href="#album">Mein Tieralbum <span class="pill">${state.collected.length}/12</span> ${arrow}</a></section>`;
  }
  function shapeSVG(shape) {const shapes={circle:'<circle cx="100" cy="75" r="55"/>',triangle:'<path d="m100 15 70 115H30Z"/>',square:'<rect x="45" y="20" width="110" height="110" rx="3"/>',rectangle:'<rect x="20" y="40" width="160" height="80" rx="3"/>'};return `<svg viewBox="0 0 200 150" class="shape-visual" aria-label="Eine geometrische Form" role="img" fill="#b9d1bc" stroke="#54725c" stroke-width="3">${shapes[shape]}</svg>`;}
  function visual(q,w) {
    const v=q.visual;if(!v)return '';
    if(v.type==='count')return `<div class="count-visual" aria-label="Zählbild">${Array.from({length:v.n},()=>A.svg(w.animal,'count-animal')).join('')}</div>`;
    if(v.type==='addition')return `<div class="addition-visual" aria-label="Zwei Mengen zum Zusammenzählen"><div>${Array.from({length:v.a},()=>'<i></i>').join('')}</div><b aria-hidden="true">+</b><div>${Array.from({length:v.b},()=>'<i></i>').join('')}</div></div>`;
    if(v.type==='groups')return `<div class="group-visual" role="img" aria-label="${v.groups} Gruppen mit je ${v.each} Punkten">${Array.from({length:v.groups},()=>`<div class="dot-group">${Array.from({length:v.each},()=>'<i></i>').join('')}</div>`).join('')}</div>`;
    if(v.type==='shape')return shapeSVG(v.shape);
    if(v.type==='coins')return `<div class="coins-visual">${v.values.map(n=>`<span>${n}<small>Cent</small></span>`).join('<b>+</b>')}</div>`;
    if(v.type==='clock') {const minute=v.minute*6,hour=(v.hour%12)*30+v.minute*.5;return `<svg viewBox="0 0 220 220" class="clock-visual" role="img" aria-label="Analoge Uhr"><circle cx="110" cy="110" r="99" fill="#fffdf7" stroke="#d6b76d" stroke-width="8"/>${Array.from({length:12},(_,i)=>{const angle=(i+1)*Math.PI/6;return `<text x="${110+78*Math.sin(angle)}" y="${116-78*Math.cos(angle)}" text-anchor="middle" fill="#3e5143" font-size="18" font-family="sans-serif">${i+1}</text>`;}).join('')}<path d="M110 110V61" stroke="#3e5143" stroke-width="7" stroke-linecap="round" transform="rotate(${hour} 110 110)"/><path d="M110 110V38" stroke="#c88e58" stroke-width="5" stroke-linecap="round" transform="rotate(${minute} 110 110)"/><circle cx="110" cy="110" r="6" fill="#3e5143"/></svg>`;}
    if(v.type==='fraction')return `<div class="fraction-visual" style="--parts:${v.b}" role="img" aria-label="${v.b} gleich große Teile, davon ${v.a} grün">${Array.from({length:v.b},(_,i)=>`<span class="${i<v.a?'filled':''}"></span>`).join('')}</div>`;
    if(v.type==='rectangle')return `<div class="rectangle-visual"><span class="rect-top">${v.a} cm</span><span class="rect-side">${v.b} cm</span><div style="--cols:${v.a};--rows:${v.b};aspect-ratio:${v.a}/${v.b}">${v.area?Array.from({length:v.a*v.b},()=>'<i></i>').join(''):''}</div></div>`;
    return '';
  }
  function quiz() {
    const a=state.active;if(!a){go('adventure');return '';}
    const q=L.bank[a.ids[a.index]],answer=a.answers[a.index],w=world(a.world),t=L.topicById[a.topic];
    const feedback=answer.solved?`<div class="feedback success" role="status" tabindex="-1"><span class="feedback-mark" aria-hidden="true">✓</span><div><strong>${answer.assisted?'Zusammen haben wir’s geschafft!':answer.wrong.length?'Prima, du hast weitergedacht!':'Das hast du richtig gut gemacht!'}</strong><p>${esc(q.explanation)}</p></div></div>`:answer.wrong.length?`<div class="feedback encouragement" role="status"><span aria-hidden="true">♡</span><div><strong>Noch ein kleiner Versuch.</strong><p>${esc(q.hint)}</p></div></div>`:answer.hint?`<div class="feedback encouragement" role="status"><span aria-hidden="true">✦</span><div><strong>Ein Tipp für dich</strong><p>${esc(q.hint)}</p></div></div>`:'';
    return `<div class="quiz-shell"><div class="quiz-top"><a href="#adventure" class="back-link">← Pause machen</a><span>Klasse ${t.grade} · ${esc(t.name)}</span><span class="quiz-counter">${a.index+1}<small> / 5</small></span></div><div class="quiz-progress" role="progressbar" aria-label="Aufgaben geschafft" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${a.index+(answer.solved?1:0)}">${a.answers.map((v,i)=>`<span class="${v.solved?'done':i===a.index?'current':''}"></span>`).join('')}</div><div class="buddy-line">${A.svg(w.animal,'buddy-art')}<p><strong>${esc(w.buddy)} begleitet dich.</strong><span>${answer.solved?'Wir sind ein tolles Team!':'Lass dir Zeit. Wir schaffen das zusammen.'}</span></p></div><section class="question-panel"><span class="eyebrow">DEIN ${a.index+1}. KLEINER SCHRITT</span><h1 class="question-title" tabindex="-1">${esc(q.prompt)}</h1>${visual(q,w)}<div class="answers" role="group" aria-label="Wähle eine Antwort">${q.options.map((option,i)=>`<button class="answer ${option.length>6?'long':''} ${answer.solved&&i===q.correct?'correct':''} ${answer.wrong.includes(i)?'tried':''}" data-action="answer" data-answer="${i}" ${answer.solved||answer.wrong.includes(i)?'disabled':''}><span class="answer-letter" aria-hidden="true">${answer.solved&&i===q.correct?'✓':answer.wrong.includes(i)?'↻':['A','B','C'][i]}</span><span>${esc(option)}</span></button>`).join('')}</div>${feedback}<div class="question-actions">${answer.solved?`<span class="reassurance">${a.index===4?'Dein Tierfreund wartet schon.':'Ein kleiner Schritt weiter.'}</span><button class="button primary" data-action="next">${a.index===4?'Runde geschafft!':'Nächste Aufgabe'} ${arrow}</button>`:`<button class="text-button" data-action="hint">${answer.hint?'Tipp noch einmal ansehen':'Ich brauche einen Tipp'} <span aria-hidden="true">✧</span></button><button class="text-button" data-action="explain">Zeig mir, wie’s geht ${arrow}</button>`}</div></section><p class="quiz-footer">Kein Zeitdruck. Kein Stress. Nur du und deine Neugier.</p></div>`;
  }
  function album() {
    return `<section class="page-heading"><span class="eyebrow">DEINE KLEINE TIERFAMILIE</span><h1>Hallo, neue Freunde<span class="accent-dot">!</span></h1><p>Jede abgeschlossene Runde bringt einen Tierfreund in dein Album.</p></section><div class="album-summary"><span class="large-heart" aria-hidden="true">♡</span><div><strong>${state.collected.length} von 12 Tierfreunden entdeckt</strong><p>${state.collected.length===12?'Alle sind da! Deine Freunde freuen sich auf weitere Abenteuer mit dir.':'Deine Freunde warten auf dich. Du musst nicht alles richtig machen, um sie zu entdecken.'}</p></div><a href="#adventure" class="button primary">Weiter entdecken ${arrow}</a></div>${A.worlds.map(w=>`<section class="album-world"><div class="section-heading"><h2>${w.name}</h2><span class="quiet">${state.collected.filter(id=>A.animals.find(a=>a.id===id).world===w.id).length} von 3 Freunden</span></div><div class="album-grid">${A.animals.filter(a=>a.world===w.id).map(an=>{const found=state.collected.includes(an.id);return `<article class="album-card ${found?'collected':'undiscovered'}" style="--world-color:${w.color}"><div class="album-animal">${found?A.svg(an.id):'<span class="egg" aria-hidden="true">?</span>'}</div><span class="eyebrow">${found?'DEIN TIERFREUND':'WER SICH HIER VERSTECKT?'}</span><h3>${found?an.name:'Noch ein kleiner Freund'}</h3><p>${found?'Schön, dass wir zusammen lernen!':'Schließe eine Runde ab und entdecke ein Tier.'}</p>${found?'<span class="collected-tag">♡ Im Team</span>':''}</article>`;}).join('')}</div></section>`).join('')}`;
  }
  function result() {
    const r=state.lastRound;if(!r){go('adventure');return '';}
    const t=L.topicById[r.topic],an=A.animals.find(a=>a.id===r.reward),w=world(r.world);
    return `<section class="result-panel"><span class="eyebrow">FÜNF KLEINE SCHRITTE. EIN GROSSES LÄCHELN.</span><h1>Du bist ein Stück gewachsen!</h1><p>Du hast dich mit „${esc(t.name)}“ beschäftigt. Darauf kannst du stolz sein.</p><div class="result-stars">${starRow(r.stars)}</div><div class="new-friend" style="--world-color:${w.color}">${A.svg(an?.id||w.animal)}<span class="reward-spark" aria-hidden="true">✦</span></div><span class="eyebrow">${an?'EIN NEUER FREUND FÜR DEIN ALBUM':'DEINE TIERFREUNDE FREUEN SICH'}</span><h2>${an?`Hallo, ${an.name}!`:'Schön, dass du weiterlernst!'}</h2><p>${an?'Dieser Tierfreund gehört jetzt zu deinem Team.':'Du hast schon alle zwölf Tiere entdeckt. Zusammen könnt ihr noch viel lernen!'}</p><div class="result-insight"><span aria-hidden="true">♡</span> ${r.firstCorrect===5?'Alle fünf Aufgaben gleich beim ersten Versuch gelöst. Toll mitgedacht!':'Du hast alle fünf Aufgaben geschafft – auch mit Tipps und Ausprobieren. So geht Lernen!'}</div><div class="button-row"><button class="button primary" data-action="again" data-topic="${t.id}">Noch ein kleines Abenteuer ${arrow}</button><a href="#album" class="button secondary">Mein Tieralbum</a></div><a href="#adventure" class="back-link">Zurück zu meinen Abenteuern</a></section>`;
  }
  function settings() {
    return `<section class="page-heading"><span class="eyebrow">FÜR ERWACHSENE</span><h1>Ein guter Platz zum Lernen.</h1><p>Ein Kind, ein Browser, viele kleine Entdeckungen.</p></section><div class="settings-grid"><section class="settings-card"><span class="setting-icon" aria-hidden="true">↗</span><h2>Lernstand sichern</h2><p>Fortschritt, Tieralbum und eine laufende Runde als Datei herunterladen. Damit lässt sich der Stand auch auf ein anderes Gerät übertragen.</p><button class="button primary" data-action="export">Sicherung herunterladen</button></section><section class="settings-card"><span class="setting-icon" aria-hidden="true">↙</span><h2>Lernstand wiederherstellen</h2><p>Eine Sicherung von MatheFreunde auswählen. Der aktuelle Stand wird erst nach Prüfung und deiner Bestätigung ersetzt.</p><button class="button secondary" data-action="import">Sicherung auswählen</button><input id="import-file" type="file" accept="application/json,.json" hidden></section><section class="settings-card"><h2>So wird gelernt</h2><p>24 Themen für Klasse 1–4, jeweils mit 20 Aufgabenvarianten. Eine Runde enthält fünf Aufgaben. Schwierigkeiten tauchen in späteren Runden bevorzugt wieder auf.</p><p>Alle Klassen und Themen sind frei zugänglich. Sterne zeigen den bisherigen Rundenerfolg. Ein Tier gibt es auch mit Hilfestellung. Es gibt keinen Zeitdruck und keine Rangliste.</p><p>Dieses erste Grundlagenpaket ergänzt Unterricht und gemeinsames Lernen. Es bildet nicht den gesamten Grundschullehrplan ab.</p></section><section class="settings-card"><h2>Speicherung & Datenschutz</h2><p>Antworten und Einstellungen werden ausschließlich im lokalen Speicher dieses Browsers gespeichert. Es gibt keine Anmeldung, keine automatische Synchronisierung und keine eigenen Analyse- oder Trackingdienste.</p><p>Privates Surfen oder gelöschte Browserdaten können den Lernstand entfernen. Regelmäßige Sicherungen helfen. Die Sicherungsdatei enthält Lerndaten.</p><p>Beim Laden über GitHub Pages verarbeitet GitHub Verbindungsdaten. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">Datenschutzhinweise von GitHub ↗</a></p></section></div><section class="reset-card"><div><h2>Ganz von vorn anfangen</h2><p>Fortschritt und Album auf diesem Browser zurücksetzen.</p></div><button class="button danger" data-action="reset">Lernstand zurücksetzen</button></section>`;
  }
  function recovery() {return `<section class="recovery-panel"><span class="eyebrow">DEIN LERNSTAND BLEIBT GESCHÜTZT</span><h1>${conflict?'Die Seite ist noch in einem anderen Tab offen.':'Der Lernstand konnte nicht gelesen werden.'}</h1><p>${conflict?'In einem anderen Tab wurde weitergelernt. Lade den aktuellen Stand, bevor du hier weitermachst. Du kannst diesen Sitzungsstand vorher sichern.':'Die gespeicherten Daten wurden nicht verändert. Sichere sie zuerst. Danach kannst du eine gültige Sicherung laden oder neu anfangen.'}</p><div class="button-row"><button class="button primary" data-action="${conflict?'reload':'export-raw'}">${conflict?'Aktuellen Stand laden':'Gespeicherte Daten sichern'}</button><button class="button secondary" data-action="${conflict?'export':'import'}">${conflict?'Diesen Sitzungsstand sichern':'Sicherung laden'}</button>${!conflict?'<button class="button danger" data-action="reset">Neu anfangen</button>':''}</div><input id="import-file" type="file" accept="application/json,.json" hidden></section>`;}
  function render(focus=false) {
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
    if(!Object.hasOwn(L.topicById,topicId))return;
    if(state.active&&!force){modal('Dein Abenteuer läuft noch.',`<p>Du kannst deine Runde weitermachen oder eine neue beginnen. Bereits gelöste Aufgaben bleiben gespeichert.</p><div class="button-row"><button class="button primary" data-action="resume">Runde weitermachen</button><button class="button secondary" data-action="replace-round" data-topic="${topicId}">Neue Runde beginnen</button></div>`);return;}
    state.active={id:globalThis.crypto?.randomUUID?.()||`round-${Date.now()}-${Math.random()}`,topic:topicId,world:state.world,ids:L.queue(topicId,state.history),index:0,answers:Array.from({length:5},()=>({wrong:[],solved:false,assisted:false,hint:false}))};
    persist();go('quiz');
  }
  function solve(assisted=false) {
    const a=state.active;if(!a)return;const q=L.bank[a.ids[a.index]],v=a.answers[a.index];if(v.solved)return;
    v.solved=true;v.assisted=assisted;
    const first=!v.wrong.length&&!v.hint&&!assisted,h=state.history[q.id]||{attempts:0,firstCorrect:0,needsReview:false,lastAt:0};
    state.history[q.id]={attempts:h.attempts+1,firstCorrect:h.firstCorrect+(first?1:0),needsReview:!first,lastAt:Date.now()};
    persist();render();main.querySelector('.feedback')?.focus({preventScroll:true});
  }
  function finish() {
    const a=state.active;if(!a||!a.answers.every(v=>v.solved))return;
    const firstCorrect=a.answers.filter(v=>!v.wrong.length&&!v.hint&&!v.assisted).length,stars=firstCorrect===5?3:firstCorrect>=3?2:1;
    const old=state.topics[a.topic]||{rounds:0,stars:0};state.topics[a.topic]={rounds:old.rounds+1,stars:Math.max(old.stars,stars)};
    const available=A.animals.filter(an=>!state.collected.includes(an.id)),reward=(available.find(an=>an.world===a.world)||available[0])?.id||null;
    if(reward)state.collected.push(reward);state.rounds++;state.lastRound={topic:a.topic,world:a.world,firstCorrect,stars,reward};state.active=null;
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
      if(n===q.correct)solve();else{v.wrong.push(n);v.hint=true;persist();render();main.querySelector('.answers .answer:not(:disabled)')?.focus({preventScroll:true});}
    }
    if(action==='hint'){const a=state.active;if(a&&!a.answers[a.index].solved){a.answers[a.index].hint=true;persist();render();}}
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
  window.addEventListener('hashchange',()=>render(true));
  window.addEventListener('storage',event=>{if((event.key===KEY||event.key===null)&&event.newValue!==lastRaw){conflict=true;close();render(true);}});
  render();
})();
