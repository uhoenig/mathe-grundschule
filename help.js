/* Kleine Rechenschritte statt einer bloßen Wiederholung des Ergebnisses. */
(() => {
  'use strict';
  function steps(q) {
    const {a,b}=q,n=window.MF_LEARNING.number;
    if(q.kind==='add') {
      const jump=10-a%10;
      if(a%10&&b>=jump)return [`Bis zum nächsten Zehner fehlen ${jump}.`,`${n(a)} + ${jump} = ${n(a+jump)}.`,`Von ${n(b)} bleiben noch ${n(b-jump)} übrig. Rechne diese dazu.`];
      const tens=Math.floor(b/10)*10,ones=b%10;
      return tens?[`Zerlege ${n(b)} in ${n(tens)} und ${ones}.`,`${n(a)} + ${n(tens)} = ${n(a+tens)}.`,`Jetzt fehlen noch ${ones} Einer.`]:[`Starte bei ${n(a)}.`,`Gehe ${b} kleine Schritte vorwärts.`,`Jeder Schritt macht die Zahl um eins größer.`];
    }
    if(q.kind==='sub') {const tens=Math.floor(b/10)*10,ones=b%10;return tens?[`Zerlege ${n(b)} in ${n(tens)} und ${ones}.`,`${n(a)} − ${n(tens)} = ${n(a-tens)}.`,`Nimm jetzt noch ${ones} Einer weg.`]:[`Starte bei ${n(a)}.`,`Gehe ${b} Schritte rückwärts.`,`Am Ende siehst du, wie viel übrig bleibt.`];}
    if(q.kind==='mul')return [`Du brauchst ${a} gleich große Gruppen.`,`In jede Gruppe kommen ${b}.`,a>10?`Zerlege ${a} in ${Math.floor(a/10)*10} und ${a%10}. Rechne beide Teile mal ${b} und zähle zusammen.`:`Zähle in ${b}er-Schritten, bis du ${a} Gruppen gezählt hast.`];
    if(q.kind==='div')return [`Verteile ${n(a)} auf ${b} Gruppen.`,`In jeder Gruppe muss gleich viel liegen.`,`Prüfe mit der Malaufgabe: ${b} · ? = ${n(a)}.`];
    if(q.kind==='sequence')return [`Vergleiche ${a} und ${a+b}.`,`Der Abstand ist ${b}.`,`Gehe von ${a+3*b} noch einmal ${b} weiter.`];
    if(q.kind==='compare')return [`Vergleiche zuerst die Zehner, dann die Einer.`,`Die offene Seite von < oder > zeigt zur größeren Zahl.`,`Sind beide Zahlen gleich groß, wähle =.`];
    if(q.kind==='count')return ['Tippe ein Tier an: Es bekommt einen kleinen Haken.','Zähle bei jedem Haken eins weiter.','Wenn alle Tiere markiert sind, hast du keines vergessen.'];
    if(q.kind==='place'||q.kind==='large-place')return q.kind==='place'?[`${a} Hunderter sind ${a*100}.`,`${b} Zehner sind ${b*10}.`,`Zähle noch ${q.c} Einer dazu.`]:[`${a} Hunderttausender sind ${n(a*100000)}.`,`${b} Zehntausender sind ${n(b*10000)}.`,`Zähle noch ${n(q.c*1000)} dazu.`];
    if(q.kind==='money')return [`Der erste Preis ist ${a} Cent.`,`Dazu kommen ${b} Cent.`,`Rechne ${a} + ${b}. Die Einheit bleibt Cent.`];
    if(q.kind==='fraction')return [`Zähle alle ${b} Teile: Diese Zahl steht unten.`,`Zähle nur die grünen Teile: Diese Zahl steht oben.`,`Lies den Bruch als „grüne Teile von allen Teilen“.`];
    if(q.kind==='area')return [`Eine Reihe hat ${a} Kästchen.`,`Es gibt ${b} gleich große Reihen.`,`Rechne ${a} · ${b}. Die Einheit ist Quadratzentimeter.`];
    if(q.kind==='perimeter')return [`Zum Rand gehören vier Seiten.`,`Die Seiten sind ${a}, ${b}, ${a} und ${b} cm lang.`,`Zähle alle vier Längen zusammen.`];
    if(q.kind==='clock')return ['Schau zuerst auf den langen Minutenzeiger.','Auf der 12 bedeutet er null Minuten, auf der 6 dreißig Minuten.','Der kurze Zeiger zeigt die Stunde oder steht schon auf dem Weg zur nächsten.'];
    if(q.kind==='measure')return ['Ein Meter besteht aus 100 Zentimetern.',q.unit==='m-to-cm'?'Für jeden Meter brauchst du 100 Zentimeter.':'Fasse immer 100 Zentimeter zu einem Meter zusammen.','Prüfe, welche Einheit in der Antwort gefragt ist.'];
    return [q.hint];
  }
  window.MF_HELP=Object.freeze({steps});
})();
