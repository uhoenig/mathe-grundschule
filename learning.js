/* Stabile Aufgabenvarianten. Zahlen und Lösung werden gemeinsam erzeugt;
   die fachlichen Regeln werden in tests/learning.cjs unabhängig nachgerechnet. */
(() => {
  'use strict';
  const integer = (r,min,max) => min + Math.floor(r()*(max-min+1));
  const number = n => new Intl.NumberFormat('de-DE').format(n);
  function random(seed) { let n=seed>>>0; return () => {n=(Math.imul(n,1664525)+1013904223)>>>0; return n/4294967296;}; }
  function shuffle(items,r) { const out=[...items]; for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; }
  const calculation = (kind,a,b) => {
    const signs={add:'+',sub:'−',mul:'·',div:':'};
    const answer={add:()=>a+b,sub:()=>a-b,mul:()=>a*b,div:()=>a/b}[kind]();
    const hint={add:a+b<10?'Zähle von der ersten Zahl aus weiter. Nimm die Punkte oder deine Finger zu Hilfe.':'Zerlege die zweite Zahl. Rechne erst bis zum nächsten Zehner.',sub:a<=20?'Zähle von der ersten Zahl rückwärts. Gehe so viele Schritte zurück, wie die zweite Zahl sagt.':'Gehe in kleinen Schritten zurück. Du darfst die zweite Zahl zerlegen.',mul:'Malnehmen heißt: gleich große Gruppen zusammenzählen.',div:'Teilen heißt: in gleich große Gruppen aufteilen.'}[kind];
    const explanation={add:`Zähle ${number(b)} zu ${number(a)} dazu.`,sub:`Nimm ${number(b)} von ${number(a)} weg.`,mul:`${a} Gruppen mit je ${b} ergeben ${number(answer)}.`,div:`${number(a)} auf ${b} gleiche Gruppen verteilt: In jede Gruppe kommen ${number(answer)}.`}[kind];
    return {kind,a,b,answer,prompt:`${number(a)} ${signs[kind]} ${number(b)} = ?`,hint,explanation:`${explanation} ${number(a)} ${signs[kind]} ${number(b)} = ${number(answer)}.`,visual:(a<=10&&b<=10&&kind==='add')?{type:'addition',a,b}:kind==='mul'&&a<=5&&b<=10?{type:'groups',groups:a,each:b}:kind==='div'&&b<=5&&a<=30?{type:'groups',groups:b,each:answer}:null};
  };
  const definitions = [
    [1,'count','Zählen & entdecken','Zahlen und Mengen bis 20','dots',(r,i)=>{const n=i+1;return {kind:'count',a:n,answer:n,prompt:'Wie viele Tiere siehst du?',hint:'Tippe beim Zählen mit dem Finger auf jedes Tier. Zähle jedes nur einmal.',explanation:`Wenn du jedes Tier einmal zählst, kommst du auf ${n}.`,visual:{type:'count',n}};}],
    [1,'add','Zusammen wird’s mehr','Plusrechnen bis 20','plus',r=>{const a=integer(r,1,12),b=integer(r,1,20-a);return calculation('add',a,b);}],
    [1,'subtract','Was bleibt übrig?','Minusrechnen bis 20','minus',r=>{const a=integer(r,3,20),b=integer(r,1,a);return calculation('sub',a,b);}],
    [1,'compare','Groß oder klein?','Zahlen vergleichen','compare',r=>{const a=integer(r,0,20),b=integer(r,0,20);return {kind:'compare',a,b,answer:a>b?'>':a<b?'<':'=',candidates:['<','=','>'],prompt:`${a}  ?  ${b}`,hint:'Der offene Schnabel zeigt zur größeren Zahl. Gleich große Zahlen bekommen ein Gleichzeichen.',explanation:a===b?`${a} und ${b} sind gleich groß: ${a} = ${b}.`:`${Math.max(a,b)} ist größer als ${Math.min(a,b)}. Deshalb gilt: ${a} ${a>b?'>':'<'} ${b}.`};}],
    [1,'patterns','Zahlen auf der Spur','Zahlenreihen fortsetzen','trail',r=>{const a=integer(r,0,8),b=integer(r,1,2);return {kind:'sequence',a,b,answer:a+4*b,prompt:`${a}, ${a+b}, ${a+2*b}, ${a+3*b}, …`,hint:`Wie viel kommt von einer Zahl zur nächsten dazu? Vergleiche die ersten beiden Zahlen.`,explanation:`Es kommen immer ${b} dazu. Nach ${a+3*b} kommt ${a+4*b}.`};}],
    [1,'shapes','Formen finden','Kreis, Dreieck und Viereck','shapes',(r,i)=>{const shape=['circle','triangle','square','rectangle'][i%4],names={circle:'Kreis',triangle:'Dreieck',square:'Quadrat',rectangle:'Rechteck'};return {kind:'shape',shape,answer:names[shape],candidates:Object.values(names),prompt:'Wie heißt diese Form?',hint:shape==='circle'?'Diese Form ist rund und hat keine Ecken.':shape==='triangle'?'Zähle die Ecken: Es sind drei.':shape==='square'?'Diese Form hat vier Ecken und vier gleich lange Seiten.':'Diese Form hat vier rechte Winkel. Gegenüberliegende Seiten sind gleich lang.',explanation:`Das ist ein ${names[shape]}. ${shape==='circle'?'Ein Kreis hat keine Ecken.':shape==='triangle'?'Ein Dreieck hat drei Ecken.':shape==='square'?'Ein Quadrat hat vier gleich lange Seiten.':'Bei diesem Rechteck sind zwei Seiten länger als die beiden anderen.'}`,visual:{type:'shape',shape}};}],
    [2,'add','Plus bis hundert','Mit Zehnern und Einern rechnen','plus',r=>{const a=integer(r,12,75),b=integer(r,7,100-a);return calculation('add',a,b);}],
    [2,'subtract','Minus bis hundert','Schritt für Schritt zurück','minus',r=>{const a=integer(r,30,100),b=integer(r,11,a-1);return calculation('sub',a,b);}],
    [2,'multiply','Erste Mal-Abenteuer','Die 2er-, 5er- und 10er-Reihe','groups',r=>calculation('mul',integer(r,1,10),[2,5,10][integer(r,0,2)])],
    [2,'divide','Fair verteilen','Teilen ohne Rest','share',r=>{const b=[2,5,10][integer(r,0,2)],n=integer(r,1,10);return calculation('div',b*n,b);}],
    [2,'clock','Wie spät ist es?','Ganze und halbe Stunden','clock',(r,i)=>{const a=integer(r,1,12),b=i%2?30:0;const fmt=m=>`${m}:00 Uhr`;return {kind:'clock',a,b,answer:`${a}:${b===0?'00':'30'} Uhr`,candidates:[`${a}:00 Uhr`,`${a}:30 Uhr`,`${a===12?1:a+1}:${b===0?'00':'30'} Uhr`,fmt(a===1?12:a-1)],prompt:'Welche Uhrzeit zeigt die Uhr?',hint:'Der lange Zeiger zeigt die Minuten. Steht er auf der 12, ist es eine volle Stunde. Auf der 6 ist es eine halbe Stunde.',explanation:`Der lange Zeiger zeigt ${b===0?'auf die 12: null Minuten':'auf die 6: dreißig Minuten'}. Der kurze Zeiger steht ${b===0?`auf der ${a}`:`zwischen ${a} und ${a===12?1:a+1}`}. Es ist ${a}:${b===0?'00':'30'} Uhr.`,visual:{type:'clock',hour:a,minute:b}};}],
    [2,'money','Kleine Einkaufstour','Mit Cent rechnen','coin',r=>{const a=integer(r,1,10)*5,b=integer(r,1,10)*5;return {kind:'money',a,b,answer:a+b,suffix:' ct',prompt:`Ein Apfel kostet ${a} ct. Eine Birne kostet ${b} ct. Was kosten beide zusammen?`,hint:'Addiere die beiden Preise. Beide sind in Cent angegeben.',explanation:`${a} ct + ${b} ct = ${a+b} ct. Zusammen kosten sie ${a+b} Cent.`,visual:{type:'coins',values:[a,b]}};}],
    [3,'place','Zahlen bis tausend','Hunderter, Zehner, Einer','blocks',r=>{const a=integer(r,1,9),b=integer(r,0,9),c=integer(r,0,9);return {kind:'place',a,b,c,answer:a*100+b*10+c,prompt:`${a} Hunderter, ${b} Zehner und ${c} Einer. Welche Zahl ist das?`,hint:'Ein Hunderter ist 100. Ein Zehner ist 10. Ein Einer ist 1.',explanation:`${a} · 100 + ${b} · 10 + ${c} = ${a*100+b*10+c}.`,candidates:[a*100+b*10+c,a*100+c*10+b,b*100+a*10+c,a*100+b+c]};}],
    [3,'add','Große Plus-Schritte','Plusrechnen bis 1000','plus',r=>{const a=integer(r,101,750),b=integer(r,23,1000-a);return calculation('add',a,b);}],
    [3,'subtract','Große Minus-Schritte','Minusrechnen bis 1000','minus',r=>{const a=integer(r,300,1000),b=integer(r,101,a-1);return calculation('sub',a,b);}],
    [3,'multiply','Das kleine Einmaleins','Alle Reihen von 1 bis 10','groups',r=>calculation('mul',integer(r,2,10),integer(r,2,10))],
    [3,'divide','Teilen macht Freude','Die Umkehrung vom Malnehmen','share',r=>{const b=integer(r,2,10);return calculation('div',b*integer(r,2,10),b);}],
    [3,'length','Messen & vergleichen','Meter und Zentimeter','ruler',(r,i)=>{const a=integer(r,1,9);return i%2?{kind:'measure',a,unit:'cm-to-m',answer:a,prompt:`${a*100} cm sind wie viele Meter?`,suffix:' m',hint:'100 Zentimeter sind genau 1 Meter.',explanation:`${a*100} : 100 = ${a}. Also sind ${a*100} cm genau ${a} m.`}:{kind:'measure',a,unit:'m-to-cm',answer:a*100,prompt:`${a} m sind wie viele Zentimeter?`,suffix:' cm',hint:'Jeder Meter besteht aus 100 Zentimetern.',explanation:`${a} · 100 = ${a*100}. Also sind ${a} m genau ${a*100} cm.`};}],
    [4,'place','Richtig große Zahlen','Stellenwerte bis zur Million','blocks',r=>{const a=integer(r,1,9),b=integer(r,0,9),c=integer(r,0,9);return {kind:'large-place',a,b,c,answer:a*100000+b*10000+c*1000,prompt:`${a} Hunderttausender, ${b} Zehntausender und ${c} Tausender. Welche Zahl ist das?`,hint:'Schreibe jede Ziffer an ihren Platz. Hinten stehen drei Nullen.',explanation:`${a} · 100.000 + ${b} · 10.000 + ${c} · 1.000 = ${number(a*100000+b*10000+c*1000)}.`,candidates:[a*100000+b*10000+c*1000,a*10000+b*1000+c*100,a*100000+c*10000+b*1000,a*1000+b*100+c*10]};}],
    [4,'calculate','Rechnen mit Köpfchen','Plus und Minus bis 10.000','plus',(r,i)=>{const a=integer(r,2000,7000),b=integer(r,101,2000);return calculation(i%2?'sub':'add',a,b);}],
    [4,'multiply','Malnehmen mit Plan','Zweistellige Zahlen malnehmen','groups',r=>calculation('mul',integer(r,12,89),integer(r,2,9))],
    [4,'divide','Große Zahlen teilen','Schrittweise teilen ohne Rest','share',r=>{const b=integer(r,2,9);return calculation('div',b*integer(r,12,99),b);}],
    [4,'fractions','Ein Ganzes, viele Teile','Erste Brüche entdecken','fraction',(r,i)=>{const b=[2,3,4,6,8][i%5],a=integer(r,1,b-1);return {kind:'fraction',a,b,answer:`${a}/${b}`,candidates:[`${a}/${b}`,`${b}/${a}`,`${a+1}/${b}`,`${a}/${b+1}`],prompt:'Welcher Bruchteil ist grün gefärbt?',hint:'Unten steht die Anzahl aller gleich großen Teile. Oben steht die Anzahl der grünen Teile.',explanation:`${a} von ${b} gleich großen Teilen sind grün. Das schreibt man ${a}/${b}.`,visual:{type:'fraction',a,b}};}],
    [4,'geometry','Rundherum & mittendrin','Umfang und Fläche von Rechtecken','shapes',(r,i)=>{const a=integer(r,2,9),b=integer(r,2,9),area=i%2===0;return {kind:area?'area':'perimeter',a,b,answer:area?a*b:2*(a+b),suffix:area?' cm²':' cm',prompt:area?'Wie groß ist die Fläche des Rechtecks?':'Wie lang ist der Umfang des Rechtecks?',hint:area?'Für die Fläche rechnest du Länge mal Breite.':'Der Umfang ist der ganze Rand. Zähle alle vier Seiten zusammen.',explanation:area?`${a} cm · ${b} cm = ${a*b} cm². Die Fläche besteht aus ${a*b} Quadraten von je 1 cm².`:`${a} cm + ${b} cm + ${a} cm + ${b} cm = ${2*(a+b)} cm.`,visual:{type:'rectangle',a,b,area}};}]
  ];
  const topics=definitions.map(([grade,id,name,description,icon,make],index)=>({id:`g${grade}-${id}`,grade,name,description,icon,index,make}));
  const topicById=Object.fromEntries(topics.map(t=>[t.id,t]));
  function question(topicId,variant) {
    const t=topicById[topicId]; if(!t||!Number.isInteger(variant)||variant<0||variant>=20)throw Error('Unbekannte Aufgabe.');
    const r=random((t.index+1)*10000+variant*97+41),q=t.make(r,variant);
    const display=v=>typeof v==='number'?number(v)+(q.suffix||''):String(v);
    let candidates=[q.answer,...(q.candidates||[])];
    if(typeof q.answer==='number')candidates.push(q.answer+1,Math.max(0,q.answer-1),q.answer+10,Math.max(0,q.answer-10));
    const unique=[...new Set(candidates.map(display))].filter(v=>v!==display(q.answer));
    const options=shuffle([display(q.answer),...shuffle(unique,r).slice(0,2)],r);
    if(options.length!==3)throw Error('Eine Aufgabe braucht drei verschiedene Antworten.');
    return {...q,id:`${t.id}:${variant}`,topic:topicId,variant,options,correct:options.indexOf(display(q.answer))};
  }
  const bank=Object.fromEntries(topics.flatMap(t=>Array.from({length:20},(_,i)=>{const q=question(t.id,i);return [q.id,q];})));
  function queue(topicId,history={},seed=Date.now()) {
    const pool=Object.values(bank).filter(q=>q.topic===topicId),r=random(seed);
    const rank=q=>{const h=history[q.id];return !h?1:h.needsReview?0:2;};
    return shuffle(pool,r).sort((a,b)=>rank(a)-rank(b)||(history[a.id]?.lastAt||0)-(history[b.id]?.lastAt||0)).slice(0,5).map(q=>q.id);
  }
  window.MF_LEARNING=Object.freeze({topics,topicById,bank,queue,question,number});
})();
