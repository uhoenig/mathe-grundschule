/* Zeitlich geplante Wiederholung. Frühzeitiges Üben verschiebt keine Fälligkeit. */
(() => {
  'use strict';
  const DAY=86400000,intervals=Object.freeze([1,3,7,14,30,60]);
  function migrate(h) {return {...h,stage:0,dueAt:h.lastAt+DAY,successfulReviews:0};}
  function update(previous,independent,now=Date.now()) {
    const h=previous||{attempts:0,firstCorrect:0,needsReview:false,lastAt:0,stage:0,dueAt:0,successfulReviews:0};
    const next={...h,attempts:h.attempts+1,firstCorrect:h.firstCorrect+(independent?1:0),lastAt:now};
    if(!independent)return {...next,needsReview:true,stage:0,successfulReviews:0,dueAt:now+DAY};
    if(previous&&now<h.dueAt)return {...next,needsReview:h.needsReview};
    const stage=previous&&!h.needsReview?Math.min(h.stage+1,intervals.length-1):0;
    return {...next,needsReview:false,stage,successfulReviews:h.successfulReviews+1,dueAt:now+intervals[stage]*DAY};
  }
  function ranked(pool,history,now) {
    const rank=q=>!history[q.id]?1:history[q.id].dueAt<=now?0:2;
    return [...pool].sort((a,b)=>rank(a)-rank(b)||(history[a.id]?.dueAt||0)-(history[b.id]?.dueAt||0)||a.variant-b.variant);
  }
  function topicQueue(topic,history,now=Date.now()) {return ranked(Object.values(window.MF_LEARNING.bank).filter(q=>q.topic===topic),history,now).slice(0,5).map(q=>q.id);}
  function plan(grade,history,now=Date.now()) {
    const L=window.MF_LEARNING,pool=Object.values(L.bank).filter(q=>L.topicById[q.topic].grade<=grade);
    const due=ranked(pool.filter(q=>history[q.id]&&history[q.id].dueAt<=now),history,now);
    const topics=L.topics.filter(t=>t.grade===grade);
    const count=t=>Object.keys(history).filter(id=>L.bank[id]?.topic===t.id).length;
    const next=topics.find(t=>count(t)<5)||[...topics].sort((a,b)=>count(a)-count(b))[0];
    const unseen=pool.filter(q=>!history[q.id]&&L.topicById[q.topic].grade===grade).sort((a,b)=>(a.topic===next.id?0:1)-(b.topic===next.id?0:1)||L.topicById[a.topic].index-L.topicById[b.topic].index||a.variant-b.variant);
    const selected=due.slice(0,unseen.length?3:5);
    selected.push(...unseen.slice(0,5-selected.length));
    if(selected.length<5){const taken=new Set(selected.map(q=>q.id));selected.push(...ranked(pool.filter(q=>!taken.has(q.id)),history,now).slice(0,5-selected.length));}
    const ids=selected.map(q=>q.id),reviews=selected.filter(q=>history[q.id]?.dueAt<=now).length,newCount=selected.filter(q=>!history[q.id]).length;
    return {ids,topic:next.id,reviews,newCount,practice:5-reviews-newCount,dueCount:due.length,nextDue:Math.min(...pool.filter(q=>history[q.id]?.dueAt>now).map(q=>history[q.id].dueAt))};
  }
  function status(topic,history,now=Date.now()) {
    const entries=Object.entries(history).filter(([id])=>window.MF_LEARNING.bank[id]?.topic===topic).map(([,h])=>h);
    const secure=entries.filter(h=>h.successfulReviews>=3&&!h.needsReview).length,due=entries.filter(h=>h.dueAt<=now).length;
    return {label:due?'Heute auffrischen':secure>=3?'Über Tage gefestigt':entries.length>=5?'Schon geübt':entries.length?'Kennengelernt':'Neu entdecken',kind:due?'due':secure>=3?'secure':entries.length?'learning':'new',secure,due};
  }
  const decorations=Object.freeze([
    {name:'Ein Blumenbeet',icon:'✿',description:'Ein bunter Platz für deine Tierfreunde.'},
    {name:'Ein kleiner Baum',icon:'♧',description:'Hier können sich deine Freunde ausruhen.'},
    {name:'Ein gemütliches Häuschen',icon:'⌂',description:'Ein Zuhause für dein Abenteuerteam.'},
    {name:'Ein Schmetterling',icon:'ʚɞ',description:'Ein neuer Besucher in deinem Tiergarten.'},
    {name:'Ein kleiner Teich',icon:'≈',description:'Ein schöner Platz zum Planschen.'},
    {name:'Ein Sonnenschirm',icon:'☂',description:'Ein schattiges Plätzchen für alle.'}
  ]);
  const decoration=rounds=>rounds>12?decorations[(rounds-13)%decorations.length]:null;
  window.MF_REVIEW=Object.freeze({DAY,intervals,migrate,update,plan,topicQueue,status,decorations,decoration});
})();
