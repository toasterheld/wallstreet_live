// Gemeinsamer Kern: Zustand, Sync (Firebase-REST/SSE oder Lokal), Spiellogik
(()=>{
const C=window.CC_CONFIG||{},DB=(C.firebaseUrl||'').replace(/\/$/,''),LS='cc_boerse_v2',PF=(C.priceFactor||1)/100,R=Math.round;
const PR=[['chip','Microchip',150],['cu','Kupfer-Spule',120],['mb','Mainboard',450],['gpu','High-End GPU',600],['ai','AI-Supercomputer',1800]].map(([id,n,b])=>({id,n,b}));
const PM=Object.fromEntries(PR.map(p=>[p.id,p])),TEAMS=['Alpha','Bravo','Charlie','Delta','Echo'],DICE=C.dice||[2,4,6,8,12];
const byTeam=f=>Object.fromEntries(TEAMS.map(t=>[t,f()]));
const fresh=()=>({pr:Object.fromEntries(PR.map(p=>[p.id,{c:p.b,p:p.b}])),hist:Object.fromEntries(PR.map(p=>[p.id,[[Date.now(),p.b]]])),
  tm:byTeam(()=>({k:'ok',u:0})),lv:byTeam(()=>0),inv:byTeam(()=>({})),bn:'',bk:'',fr:0,gt:{lim:60,el:0,run:0},ch:{i:4,auto:true},lg:[]});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let S=fresh(),subs=[],bc=null;
const pub=()=>subs.forEach(f=>f(S)),strs=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,JSON.stringify(v)]));
const conn=t=>document.querySelectorAll('.cn').forEach(e=>e.textContent=t);
function save(ch){   // Firebase: nur geänderte Top-Level-Keys (als JSON-Strings) patchen
  if(DB)fetch(DB+'/cc.json',{method:'PATCH',body:JSON.stringify(ch)}).catch(()=>{});
  else{try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}bc&&bc.postMessage(1)}
}
function act(fn){const b=strs(S);fn(S);const a=strs(S),ch={};for(const k in a)if(a[k]!==b[k])ch[k]=a[k];save(ch);pub()}
function init(){
  if(DB){
    const es=new EventSource(DB+'/cc.json'),set=(k,v)=>{v==null?delete S[k]:S[k]=JSON.parse(v)};
    const on=e=>{const{path,data}=JSON.parse(e.data);
      if(path=='/'){if(data==null)save(strs(S));else for(const k in data)set(k,data[k])}else set(path.slice(1),data);pub()};
    es.addEventListener('put',on);es.addEventListener('patch',on);
    es.onopen=()=>conn('🟢 Live-Sync (Firebase)');es.onerror=()=>conn('🔴 Verbindung getrennt – versuche erneut …');
  }else{
    const ld=()=>{try{const j=JSON.parse(localStorage.getItem(LS));if(j&&j.pr)S=Object.assign(fresh(),j)}catch(e){}};
    ld();conn('💾 Lokal-Modus (nur Tabs auf diesem Gerät)');
    bc='BroadcastChannel' in window?new BroadcastChannel(LS):null;if(bc)bc.onmessage=()=>{ld();pub()};
    addEventListener('storage',e=>{if(e.key==LS){ld();pub()}});
  }
}

/* ---------- Spiellogik ---------- */
const lg=(s,t)=>{s.lg.unshift(new Date().toLocaleTimeString('de-DE')+'  '+t);s.lg.length=Math.min(s.lg.length,30)};
function setP(s,id,v){const p=PM[id],r=s.pr[id],n=Math.round(Math.min(p.b*4,Math.max(p.b*.2,v))*100)/100;   // Grenzen 20 %–400 %
  if(n!=r.c){r.p=r.c;r.c=n;const h=s.hist[id];h.push([Date.now(),n]);if(h.length>80)h.shift()}}
const mul=(s,ids,f)=>ids.forEach(id=>setP(s,id,s.pr[id].c*f));
const EV={
  chip:['⚠️ CHIP-KRISE: Microchip-Preise +30 %!',s=>mul(s,['chip'],1.3)],
  pow:['⚡ STROMAUSFALL: Kurse eingefroren – Handel pausiert!',s=>{s.fr=Date.now()+6e4}],
  crash:['📉 WALL STREET CRASH: Alle Preise −25 %!',s=>mul(s,PR.map(p=>p.id),.75)],
  ai:['🚀 AI-BOOM: AI-Supercomputer +50 %!',s=>mul(s,['ai'],1.5)]};
function trade(dir,q,team,id){
  if(!(q>0))return'Bitte eine Menge ≥ 1 eingeben.';
  if(S.fr>Date.now())return'⚡ Kurse eingefroren – Handel pausiert.';
  const p=PM[id],o=S.pr[id].c;
  act(s=>{setP(s,id,s.pr[id].c+dir*q*p.b*PF);lg(s,`${team}: ${dir>0?'KAUF':'VERKAUF'} ${q}× ${p.n} → ${R(s.pr[id].c)} CC`)});
  return`✔ ${p.n}: ${R(o)} → ${R(S.pr[id].c)} CC`;
}
function raid(a,v){   // Angreifer würfelt mit seinem Level-Würfel gegen den Level-Würfel des Opfers; Gleichstand = Abwehr
  let o;
  act(s=>{const n=Date.now();
    if(s.tm[v].u>n){o={ok:0,txt:`🛡️ Team ${v} ist bereits geschützt/gesperrt – kein Angriff möglich.`};return}
    const A=DICE[s.lv[a]],V=DICE[s.lv[v]],x=1+Math.floor(Math.random()*A),y=1+Math.floor(Math.random()*V),w=x>y;
    if(w)s.tm[v]={k:'fw',u:n+3e5};
    o={ok:w,txt:`Team ${a} (W${A}): ${x}  vs.  Team ${v} (W${V}): ${y}\n${w?'✔ ANGRIFF ERFOLGREICH – 5-Min-Firewall für '+v+' läuft auf dem Beamer!':'✖ ANGRIFF ABGEWEHRT'}`};
    lg(s,`⚡ ${a} → ${v}: ${w?'Erfolg':'abgewehrt'} (${x} vs ${y})`)});
  return o;
}
function craft(t,id){act(s=>{const i=s.inv[t];i[id]=(i[id]||0)+1;lg(s,`🛠 Team ${t}: ${PM[id].n} hergestellt`)})}

/* ---------- Helfer ---------- */
const ge=g=>g.el+(g.run?Date.now()-g.run:0);
const mmss=ms=>{ms=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(ms/60)).padStart(2,'0')+':'+String(ms%60).padStart(2,'0')};
const gtime=s=>mmss(s.gt.lim?s.gt.lim*6e4-ge(s.gt):ge(s.gt));
const bant=s=>s.bn?s.bn+(s.fr>Date.now()?' – noch '+mmss(s.fr-Date.now()):''):'';
const stat=t=>{const x=S.tm[t],n=Date.now(),k=x.u>n?x.k:'ok';return[k,k=='ok'?'🟢 ANGRIFFSBEREIT':k=='fw'?'🛡️ FIREWALL: '+mmss(x.u-n):'💀 GEHACKT: '+mmss(x.u-n)]};
const tick=()=>{const n=Date.now();if(S.fr&&S.fr<=n)act(s=>{s.fr=0;if(s.bk=='pow'){s.bn='';s.bk=''}})};   // Stromausfall endet automatisch
function beat(fn){   // Terminal-Heartbeat: eigener Key pro Gerät → keine Überschreib-Konflikte
  const id=localStorage.cc_tid||(localStorage.cc_tid=Math.random().toString(36).slice(2,7)),f=()=>act(s=>{s['tr_'+id]={n:localStorage.cc_name||'Betreuer',st:fn(),t:Date.now()}});
  f();setInterval(f,10000);
}
window.CC={PR,PM,TEAMS,DICE,fresh,esc,act,init,sub:f=>{subs.push(f);f(S)},lg,setP,EV,trade,raid,craft,ge,mmss,gtime,bant,stat,tick,beat,get S(){return S}};
})();
