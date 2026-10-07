// Kern: Zustand, Sync (Firebase-Transaktionen oder Lokal), Marktmathematik, Spiellogik
(()=>{
const C=window.CC_CONFIG||{},FB=window.firebaseConfig||{},LS='cc_boerse_v3',R=Math.round;
const SLIP=C.slip||.015,SPREAD=C.spread||.08,PAT=C.patent||{},SH={cost:C.shieldCost||300,min:10},PMIN=8;
const PR=[['si','Silizium',40],['cu','Kupfer',35],['en','Energie / Strom',50],['se','Seltene Erden',110],
  ['chip','Microchip',150,{si:2,en:1}],['coil','Kupfer-Spule',120,{cu:2,en:1}],
  ['mb','Mainboard',450,{chip:1,coil:2}],['gpu','High-End GPU',600,{chip:2,se:1}],['ai','AI-Supercomputer',1800,{mb:1,gpu:1,en:2}]
].map(([id,n,b,rc])=>({id,n,b,rc:rc||null}));
const PM=Object.fromEntries(PR.map(p=>[p.id,p])),TEAMS=['Alpha','Bravo','Charlie','Delta','Echo'],DICE=C.dice||[2,4,6,8,12];
const byTeam=f=>Object.fromEntries(TEAMS.map(t=>[t,f()]));
const fresh=()=>({pr:Object.fromEntries(PR.map(p=>[p.id,{c:p.b,p:p.b}])),hist:Object.fromEntries(PR.map(p=>[p.id,[[Date.now(),p.b]]])),
  tm:byTeam(()=>({k:'ok',u:0})),sh:byTeam(()=>0),lv:byTeam(()=>0),inv:byTeam(()=>({})),pat:{},bn:'',bk:'',fr:0,gt:{lim:60,el:0,run:0},ch:{i:PR.length-1,auto:true},lg:[]});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const Y=t=>({ok:1,txt:t}),N=t=>({ok:0,txt:t});

let S=fresh(),TR={},subs=[],bc=null,ref=null;
const pub=()=>subs.forEach(f=>f(S)),conn=t=>document.querySelectorAll('.cn').forEach(e=>e.textContent=t);
const ld=()=>{try{const j=JSON.parse(localStorage.getItem(LS));if(j&&j.pr)S=Object.assign(fresh(),j)}catch(e){}try{TR=JSON.parse(localStorage.getItem(LS+'t'))||{}}catch(e){}};

// Jede Aktion = EINE atomare Transaktion auf dem gesamten Spielstand (Firebase retried bei Konflikten automatisch)
function act(fn){
  if(ref){let out;
    return ref.child('state').transaction(cur=>{const s=Object.assign(fresh(),cur?JSON.parse(cur):{});out=fn(s);const j=JSON.stringify(s);return j===cur?undefined:j})
      .then(()=>out).catch(e=>{conn('🔴 '+e.message);return N('Fehler: '+e.message)});
  }
  ld();const out=fn(S);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}bc&&bc.postMessage(1);pub();return Promise.resolve(out);
}
async function init(){
  if(FB.databaseURL){
    const L=u=>new Promise((ok,no)=>{const e=document.createElement('script');e.src=u;e.onload=ok;e.onerror=no;document.head.append(e)}),b='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
    try{await L(b+'app-compat.js');await L(b+'database-compat.js')}catch(e){return conn('🔴 Firebase-SDK nicht ladbar – Internet?')}
    firebase.initializeApp(FB);const db=firebase.database();ref=db.ref('cc3');
    ref.child('state').on('value',sn=>{const v=sn.val();if(v){S=Object.assign(fresh(),JSON.parse(v));pub()}else act(()=>0)});   // leer → Startzustand anlegen
    ref.child('tr').on('value',sn=>{TR=sn.val()||{};pub()});
    db.ref('.info/connected').on('value',sn=>conn(sn.val()?'🟢 Live-Sync (Firebase)':'🔴 getrennt – verbinde neu …'));
  }else{
    ld();conn('💾 Lokal-Modus (nur Tabs auf diesem Gerät)');
    if('BroadcastChannel' in window){bc=new BroadcastChannel(LS);bc.onmessage=()=>{ld();pub()}}
    addEventListener('storage',e=>{if(e.key&&e.key.startsWith(LS)){ld();pub()}});pub();
  }
}

/* ---------- Marktmathematik ---------- */
const lg=(s,t)=>{s.lg.unshift(new Date().toLocaleTimeString('de-DE')+'  '+t);s.lg.length=Math.min(s.lg.length,30)};
const lim=(id,v)=>Math.min(PM[id].b*4,Math.max(PM[id].b*.2,v));   // Grenzen 20 %–400 % vom Basispreis
function setP(s,id,v){const r=s.pr[id],n=Math.round(lim(id,v)*100)/100;if(n!=r.c){r.p=r.c;r.c=n;const h=s.hist[id];h.push([Date.now(),n]);if(h.length>60)h.shift()}}
const mul=(s,ids,f)=>ids.forEach(id=>setP(s,id,s.pr[id].c*f));
// Kaskade: Komponenten folgen der relativen Preisänderung des Produkts mit 10–15 % (rekursiv durchs Rezept)
function casc(s,id,rel){const rc=PM[id].rc;if(rc)for(const c in rc){const r=rel*(.10+Math.random()*.05);setP(s,c,s.pr[c].c*(1+r));casc(s,c,r)}}
// Slippage pro Stück: Kauf zahlt Stückpreis m (danach +1,5 %), Verkauf erlöst 92 % von m (danach −1,5 %) → Rundreise immer Verlust
function quote(dir,q,id,m){let t=0;for(let k=0;k<q;k++){t+=dir>0?m:m*(1-SPREAD);m=lim(id,m*(dir>0?1+SLIP:1-SLIP))}return{t,m}}
const EV={
  chip:['⚠️ CHIP-KRISE: Microchip-Preise +30 %!',s=>mul(s,['chip'],1.3)],
  pow:['⚡ STROMAUSFALL: Kurse eingefroren – Handel pausiert!',s=>{s.fr=Date.now()+6e4}],
  crash:['📉 WALL STREET CRASH: Alle Preise −25 %!',s=>mul(s,PR.map(p=>p.id),.75)],
  ai:['🚀 AI-BOOM: AI-Supercomputer +50 %!',s=>mul(s,['ai'],1.5)]};

/* ---------- Aktionen (alle liefern {ok,txt}) ---------- */
const patOf=(s,id,t)=>{const p=s.pat[id];return p&&p.u>Date.now()&&p.t!=t?p:null};   // fremdes aktives Patent?
function trade(dir,q,team,id){
  q=Math.floor(q);if(!(q>0)||q>500)return Promise.resolve(N('Menge 1–500 eingeben.'));
  return act(s=>{
    if(s.fr>Date.now())return N('⚡ Kurse eingefroren – Handel pausiert.');
    const p=patOf(s,id,team);if(dir<0&&p)return N(`📜 Verkauf gesperrt: Team ${p.t} hält das Patent auf ${PM[id].n} (${mmss(p.u-Date.now())}).`);
    const o=s.pr[id].c,{t,m}=quote(dir,q,id,o),i=s.inv[team];
    setP(s,id,m);i[id]=Math.max(0,(i[id]||0)+dir*q);casc(s,id,s.pr[id].c/o-1);
    lg(s,`${team}: ${dir>0?'KAUF':'VERKAUF'} ${q}× ${PM[id].n} für ${R(t)} CC → Kurs ${R(s.pr[id].c)}`);
    return Y(`✔ ${dir>0?'Kosten':'Erlös'}: ${R(t)} CC · Kurs ${R(o)} → ${R(s.pr[id].c)}`)});
}
const craft=(t,id)=>act(s=>{
  const p=PM[id],rc=p.rc,pt=patOf(s,id,t);
  if(!rc)return N('Rohstoffe können nicht hergestellt werden.');
  if(pt)return N(`📜 Gesperrt: Team ${pt.t} hält das Patent auf ${p.n} (${mmss(pt.u-Date.now())}).`);
  const i=s.inv[t];for(const c in rc)i[c]=Math.max(0,(i[c]||0)-rc[c]);i[id]=(i[id]||0)+1;
  setP(s,id,s.pr[id].c*.97);for(const c in rc)setP(s,c,s.pr[c].c*1.02);   // Angebot ↑ → Produkt −3 %, Nachfrage ↑ → Zutaten +2 %
  lg(s,`🛠 Team ${t}: ${p.n} hergestellt`);return Y(`✔ ${p.n} im Konto von Team ${t} verbucht. Markt: ${p.n} −3 %, Zutaten +2 %.`)});
const patent=(t,id)=>act(s=>{const n=Date.now(),p=s.pat[id];
  if(p&&p.u>n)return N(`📜 ${PM[id].n} ist bereits patentiert (Team ${p.t}, noch ${mmss(p.u-n)}).`);
  s.pat[id]={t,u:n+PMIN*6e4};lg(s,`📜 Team ${t}: Patent auf ${PM[id].n}`);return Y(`✔ Patent erworben – ${PAT[id]} CC kassieren. ${PMIN} Min Monopol.`)});
const shield=t=>act(s=>{const n=Date.now();
  if(s.sh[t]>n)return N(`🔒 Schild läuft noch (${mmss(s.sh[t]-n)}).`);
  s.sh[t]=n+SH.min*6e4;lg(s,`🔒 Team ${t}: Cybersecurity-Lizenz`);return Y(`✔ Schild aktiv (${SH.min} Min) – ${SH.cost} CC kassieren.`)});
const fw=t=>act(s=>{s.tm[t]={k:'fw',u:Date.now()+3e5};lg(s,`🛡️ Firewall 5 Min für Team ${t}`);return Y(`✔ Firewall für Team ${t} läuft (5 Min).`)});
const ri=n=>1+Math.floor(Math.random()*n);
const raid=(a,v)=>act(s=>{const n=Date.now();
  if(a==v)return N('Angreifer und Opfer müssen verschiedene Teams sein.');
  if(s.tm[v].u>n)return N(`🛡️ Team ${v} hat bereits Firewall/Sperre – kein Angriff möglich.`);
  const A=DICE[s.lv[a]],V=DICE[s.lv[v]],x=ri(A),y=ri(V),w=x>y,sh=s.sh[v]>n;   // Gleichstand = Abwehr
  let m=`Team ${a} (W${A}): ${x}  vs.  Team ${v} (W${V}): ${y}\n`,ok=0;
  if(!w)m+='✖ ANGRIFF ABGEWEHRT';
  else if(sh)m+=`🔒 Angriff gelang, aber das Cybersecurity-Schild von ${v} verhindert den Rohstoffverlust – ${a} geht leer aus!`;
  else{ok=1;m+=`✔ ANGRIFF ERFOLGREICH – ${a} darf Rohstoffe von ${v} nehmen. 5-Min-Firewall für ${v} läuft!`;s.tm[v]={k:'fw',u:n+3e5}}
  lg(s,`⚡ ${a} → ${v}: ${ok?'Erfolg':w?'vom Schild geblockt':'abgewehrt'} (${x} vs ${y})`);return{ok,txt:m}});

/* ---------- Helfer ---------- */
const ge=g=>g.el+(g.run?Date.now()-g.run:0);
const mmss=ms=>{ms=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(ms/60)).padStart(2,'0')+':'+String(ms%60).padStart(2,'0')};
const gtime=s=>mmss(s.gt.lim?s.gt.lim*6e4-ge(s.gt):ge(s.gt));
const bant=s=>s.bn?s.bn+(s.fr>Date.now()?' – noch '+mmss(s.fr-Date.now()):''):'';
const stat=t=>{const x=S.tm[t],n=Date.now(),a=[];let k='ok';
  if(x.u>n){k=x.k;a.push(x.k=='fw'?`🛡️ FIREWALL (${mmss(x.u-n)})`:`💀 GEHACKT (${mmss(x.u-n)})`)}
  if(S.sh[t]>n){if(k=='ok')k='sh';a.push(`🔒 CYBERSEC SHIELD (${mmss(S.sh[t]-n)})`)}
  return[k,a.length?a:['🟢 ANGRIFFSBEREIT']]};
const pats=s=>Object.entries(s.pat).filter(([,p])=>p.u>Date.now()).map(([id,p])=>({id,t:p.t,u:p.u}));
const tick=()=>{const n=Date.now();if(S.fr&&S.fr<=n)act(s=>{if(s.fr&&s.fr<=n){s.fr=0;if(s.bk=='pow'){s.bn='';s.bk=''}}})};   // Stromausfall endet automatisch
function beat(fn){   // Terminal-Heartbeat (eigener Knoten pro Gerät, verschwindet beim Trennen)
  const id=localStorage.cc_tid||(localStorage.cc_tid=Math.random().toString(36).slice(2,7));
  const f=()=>{const v={n:localStorage.cc_name||'Betreuer',st:fn(),t:Date.now()};
    if(ref)ref.child('tr/'+id).set(v);
    else{try{TR=JSON.parse(localStorage.getItem(LS+'t'))||{}}catch(e){TR={}}TR[id]=v;localStorage.setItem(LS+'t',JSON.stringify(TR));bc&&bc.postMessage(1);pub()}};
  f();setInterval(f,10000);if(ref)ref.child('tr/'+id).onDisconnect().remove();
  return f;
}
window.CC={PR,PM,TEAMS,DICE,PAT,SH,fresh,esc,act,init,sub:f=>{subs.push(f);f(S)},lg,EV,trade,craft,patent,shield,fw,raid,quote,ge,mmss,gtime,bant,stat,pats,tick,beat,get S(){return S},get TR(){return TR}};
})();
