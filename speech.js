/* Nur lokale deutsche Gerätestimmen: keine externen Sprachdienste. */
(() => {
  'use strict';
  const synth=window.speechSynthesis;
  const voice=()=>synth?.getVoices().find(v=>v.localService&&/^de([_-]|$)/i.test(v.lang));
  const stop=()=>synth?.cancel();
  const spoken=text=>text.replace(/(\d{1,2}):(\d{2}) Uhr/g,(_,h,m)=>`${h} Uhr${m==='00'?'':` ${m}`}`).replace(/(\d+)\/(\d+)/g,'$1 von $2 Teilen').replace(/(\d)\.(?=\d{3}(\D|$))/g,'$1').replace(/cm²/g,' Quadratzentimeter ').replace(/\bcm\b/g,' Zentimeter ').replace(/\bct\b/g,' Cent ').replace(/\+/g,' plus ').replace(/−/g,' minus ').replace(/·/g,' mal ').replace(/:/g,' geteilt durch ').replace(/=/g,' gleich ').replace(/>/g,' größer als ').replace(/</g,' kleiner als ').replace(/\?/g,' welche Antwort passt? ');
  function read(text) {const selected=voice();if(!selected)return false;stop();const utterance=new SpeechSynthesisUtterance(spoken(text));utterance.voice=selected;utterance.lang='de-DE';utterance.rate=.88;synth.speak(utterance);return true;}
  synth?.addEventListener('voiceschanged',()=>window.dispatchEvent(new Event('mf-voices')));
  window.addEventListener('pagehide',stop);
  window.MF_SPEECH=Object.freeze({available:()=>!!voice(),read,stop,spoken});
})();
