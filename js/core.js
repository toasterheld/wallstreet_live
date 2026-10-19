// Kern: Zustand, Sync (Firebase-Transaktionen oder Lokal), Marktmathematik, Events, Spiellogik
(()=>{
const C=window.CC_CONFIG||{},FB=window.firebaseConfig||{},LS='cc_boerse_v3',R=Math.round;
const SLIP=C.slip||.015,SPREAD=C.spread||.08,PAT=C.patent||{},SH={cost:C.shieldCost||300,min:10},PMIN=8;
const PR=[['si','Silizium',40],['cu','Kupfer',35],['en','Energie / Strom',50],['se','Seltene Erden',110],
  ['chip','Microchip',150,{si:2,en:1}],['coil','Kupfer-Spule',120,{cu:2,en:1}],
  ['mb','Mainboard',450,{chip:1,coil:2}],['gpu','High-End GPU',600,{chip:2,se:1}],['ai','AI-Supercomputer',1800,{mb:1,gpu:1,en:2}]
].map(([id,n,b,rc])=>({id,n,b,rc:rc||null}));
const PM=Object.fromEntries(PR.map(p=>[p.id,p])),DICE=C.dice||[2,4,6,8,12];
const CAP=C.startCap==null?500:C.startCap,LVC=C.levelCost||[100,200,300,400],PAIN=C.painMoney==null?50:C.painMoney,MAXT=C.maxTeams||16;
const EVL=C.events||[],EVD=Object.fromEntries(EVL.map(e=>[e.id,e]));
// Teams sind dynamisch: s.tl = geordnete Liste der Team-IDs, alle Team-Daten hängen als Maps (bal, tm, sh, lv, nm) an dieser ID.
// Es gibt KEIN digitales Inventar – Waren wandern physisch über Produktkarten, das System kennt nur Geld, Preise, Patente, Level und Schilde.
const START_TEAMS=['Alpha','Bravo','Charlie','Delta','Echo'];
const addMaps=(s,t,cap)=>{s.bal[t]=cap;s.tm[t]={k:'ok',u:0};s.sh[t]=0;s.lv[t]=0;s.nm[t]={n:'',m:''}};
const fresh=(cap,tl)=>{cap=cap==null?CAP:cap;tl=(tl||START_TEAMS).slice();
  const s={bal:{},tm:{},sh:{},lv:{},nm:{},tl,nx:tl.length+1,cap,rk:1,pr:Object.fromEntries(PR.map(p=>[p.id,{c:p.b,p:p.b}])),hist:Object.fromEntries(PR.map(p=>[p.id,[[Date.now(),p.b]]])),
  pat:{},ev:{},evd:{},bn:'',gt:{lim:60,el:0,run:0},ch:{i:PR.length-1,auto:true},sfx:{n:0,k:'',t:0},lg:[]};
  tl.forEach(t=>addMaps(s,t,cap));return s};
// Gespeicherten Spielstand einlesen: alte Stände (ohne Teamliste, mit Inventar) werden automatisch migriert
const norm=s=>{delete s.inv;if(!Array.isArray(s.tl)||!s.tl.length)s.tl=START_TEAMS.slice();
  for(const m of['bal','tm','sh','lv','nm'])if(!s[m]||typeof s[m]!='object')s[m]={};
  for(const t of s.tl)if(s.bal[t]==null||!s.tm[t]||s.sh[t]==null||s.lv[t]==null||!s.nm[t]){const o={bal:{},tm:{},sh:{},lv:{},nm:{}};addMaps(o,t,s.cap==null?CAP:s.cap);
    for(const m in o)if(s[m][t]==null)s[m][t]=o[m][t]}
  if(!(s.nx>0))s.nx=s.tl.length+1;return s};
const parse=v=>{const j=typeof v=='string'?JSON.parse(v):(v||{});
  if(!Array.isArray(j.tl)||!j.tl.length){const k=Object.keys(j.lv||j.bal||{});if(k.length)j.tl=k;else delete j.tl}
  return norm(Object.assign(fresh(),j))};
const has=(s,t)=>Array.isArray(s.tl)&&s.tl.includes(t);
const NOTEAM=()=>N('Dieses Team existiert nicht mehr (im Admin gelöscht). Bitte ein anderes Team wählen.');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const Y=t=>({ok:1,txt:t}),N=t=>({ok:0,txt:t});
// Konten: Guthaben nie unter 0, ganze CC. Kauf wird aufgerundet, Verkauf abgerundet (Rundreise bleibt Verlust).
const NOFUNDS='Nicht genügend CC-Coins!';
const rb=t=>Math.ceil(t-1e-6),rs=t=>Math.floor(t+1e-6);
const bal=(s,t)=>Math.max(0,Math.floor(Number(s.bal&&s.bal[t])||0));
const fmt=n=>Math.round(n).toLocaleString('de-DE');
const nof=(s,t,c)=>N(`${NOFUNDS} Preis ${fmt(c)} CC, Guthaben ${fmt(bal(s,t))} CC.`);
// Rangliste: nach Guthaben (absteigend), bei Gleichstand bleibt die Reihenfolge der Teamliste. Ohne Ranglisten-Modus: feste Reihenfolge.
const ranking=s=>{const l=s.tl.slice();if(s.rk)l.sort((a,b)=>bal(s,b)-bal(s,a)||s.tl.indexOf(a)-s.tl.indexOf(b));return l};
// Anzeigename eines Teams (frei editierbar) und Mitgliederliste
const nm=(s,t)=>{const x=s.nm&&s.nm[t],n=x&&typeof x.n=='string'?x.n.trim():'';return n||'Team '+t};
const members=(s,t)=>{const x=s.nm&&s.nm[t];return x&&x.m?String(x.m).split(/[,;\n]+/).map(a=>a.trim()).filter(Boolean):[]};

let S=fresh(),TR={},subs=[],bc=null,ref=null,loaded=false;
const pub=()=>subs.forEach(f=>f(S)),conn=t=>document.querySelectorAll('.cn').forEach(e=>e.textContent=t);
const ld=()=>{try{const j=JSON.parse(localStorage.getItem(LS));if(j&&j.pr)S=parse(j)}catch(e){}try{TR=JSON.parse(localStorage.getItem(LS+'t'))||{}}catch(e){TR={}}};

// Jede Aktion = EINE atomare Transaktion auf dem gesamten Spielstand (Firebase retried bei Konflikten automatisch)
function act(fn){
  if(ref){let out;
    return ref.child('state').transaction(cur=>{const s=parse(cur||'{}');out=fn(s);const j=JSON.stringify(s);return j===cur?undefined:j})
      .then(()=>out).catch(e=>{conn('🔴 '+e.message);return N('Fehler: '+e.message)});
  }
  ld();const out=fn(S);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}bc&&bc.postMessage(1);pub();return Promise.resolve(out);
}
async function init(){
  if(FB.databaseURL){
    const L=u=>new Promise((ok,no)=>{const e=document.createElement('script');e.src=u;e.onload=ok;e.onerror=no;document.head.append(e)}),b='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
    try{await L(b+'app-compat.js');await L(b+'database-compat.js')}catch(e){return conn('🔴 Firebase-SDK nicht ladbar – Internet?')}
    firebase.initializeApp(FB);const db=firebase.database();ref=db.ref('cc3');
    ref.child('state').on('value',sn=>{const v=sn.val();loaded=true;if(v){S=parse(v);pub()}else act(()=>0)});   // leer → Startzustand anlegen
    ref.child('tr').on('value',sn=>{TR=sn.val()||{};pub()});
    db.ref('.info/connected').on('value',sn=>conn(sn.val()?'🟢 Live-Sync (Firebase)':'🔴 getrennt – verbinde neu …'));
  }else{
    ld();loaded=true;conn('💾 Lokal-Modus (nur Tabs auf diesem Gerät)');
    if('BroadcastChannel' in window){bc=new BroadcastChannel(LS);bc.onmessage=()=>{ld();pub()}}
    addEventListener('storage',e=>{if(e.key&&e.key.startsWith(LS)){ld();pub()}});pub();
  }
}

/* ---------- Marktmathematik ---------- */
const lg=(s,t)=>{s.lg.unshift(new Date().toLocaleTimeString('de-DE')+'  '+t);s.lg.length=Math.min(s.lg.length,30)};
// Sound-Signal für das Admin-Board: Zähler + Art (trade | alarm | glitch). Der Admin spielt den Ton, sobald sich der Zähler ändert.
const sfx=(s,k)=>{s.sfx={n:((s.sfx&&s.sfx.n)||0)+1,k,t:Date.now()}};
const lim=(id,v)=>Math.min(PM[id].b*4,Math.max(PM[id].b*.2,v));   // Grenzen 20 %–400 % vom Basispreis
const frozen=(s,id)=>{const n=Date.now();return Object.values(s.ev||{}).some(e=>e.u>n&&e.fz&&e.fz.includes(id))};   // Stromausfall: Preis eingefroren
function setP(s,id,v,force){if(!force&&frozen(s,id))return;const r=s.pr[id],n=Math.round(lim(id,v)*100)/100;if(n!=r.c){r.p=r.c;r.c=n;const h=s.hist[id];h.push([Date.now(),n]);if(h.length>60)h.shift()}}
// Kaskade: Komponenten folgen der relativen Preisänderung des Produkts mit 10–15 % (rekursiv durchs Rezept)
function casc(s,id,rel){const rc=PM[id].rc;if(rc)for(const c in rc){const r=rel*(.10+Math.random()*.05);setP(s,c,s.pr[c].c*(1+r));casc(s,c,r)}}
// Slippage pro Stück: Kauf zahlt Stückpreis m (danach +1,5 %), Verkauf erlöst 92 % von m (danach −1,5 %) → Rundreise immer Verlust. Eingefroren: Kurs bleibt, Spread bleibt.
function quote(dir,q,id,m,fz){let t=0;for(let k=0;k<q;k++){t+=dir>0?m:m*(1-SPREAD);if(!fz)m=lim(id,m*(dir>0?1+SLIP:1-SLIP))}return{t,m}}

/* ---------- Events: Laufzeit, Normalisierung, Einmal-Nutzung ---------- */
// Beim Start wird der tatsächlich angewendete Faktor je Produkt gespeichert; beim Ende wird genau dieser Faktor wieder herausgerechnet
// (Handelsbewegungen währenddessen bleiben erhalten).
const trig=id=>act(s=>{
  const d=EVD[id];if(!d)return N('Unbekanntes Event.');
  if(s.evd[id])return N(`${d.n} wurde in dieser Spielrunde bereits genutzt.`);
  const e={u:Date.now()+Math.round(d.min*6e4),f:{}};
  if(d.mul)for(const k in d.mul)for(const pid of k=='*'?PR.map(p=>p.id):[k]){const b=s.pr[pid].c;setP(s,pid,b*d.mul[k],true);e.f[pid]=(e.f[pid]||1)*(s.pr[pid].c/b)}
  if(d.fz)e.fz=d.fz.slice();
  if(d.pat)s.pat={};
  s.ev[id]=e;s.evd[id]=1;sfx(s,'alarm');lg(s,`${d.ic} EVENT: ${d.n}`);
  return Y(`✔ ${d.n} ausgelöst${d.inst?'':' ('+d.min+' Min)'}.`)});
function endEv(s,k,why){const e=s.ev[k];if(!e)return;for(const id in e.f||{})setP(s,id,s.pr[id].c/e.f[id],true);delete s.ev[k];lg(s,`⏱ ${EVD[k]?EVD[k].n:k} beendet (${why}) – Preise normalisieren sich`)}
const stopEv=k=>act(s=>{if(!s.ev[k])return N('Event läuft nicht.');endEv(s,k,'vorzeitig');return Y('✔ Event beendet, Preise normalisiert.')});
const tick=()=>{const n=Date.now();if(Object.values(S.ev||{}).some(e=>e.u<=n))act(s=>{const t=Date.now();for(const k of Object.keys(s.ev))if(s.ev[k].u<=t)endEv(s,k,'abgelaufen')})};   // idempotent: ein zweiter Client findet nichts mehr zu tun

/* ---------- Aktionen (alle liefern {ok,txt}) ---------- */
const mmss=ms=>{ms=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(ms/60)).padStart(2,'0')+':'+String(ms%60).padStart(2,'0')};
const patOf=(s,id,t)=>{const p=s.pat[id];return p&&p.u>Date.now()&&p.t!=t?p:null};   // fremdes aktives Patent?
function trade(dir,q,team,id){
  q=Math.floor(q);if(!(q>0)||q>500)return Promise.resolve(N('Menge 1–500 eingeben.'));
  return act(s=>{
    if(!has(s,team))return NOTEAM();
    const p=patOf(s,id,team);if(dir<0&&p)return N(`📜 Verkauf gesperrt: ${nm(s,p.t)} hält das Patent auf ${PM[id].n} (${mmss(p.u-Date.now())}).`);
    const fz=frozen(s,id),o=s.pr[id].c,{t,m}=quote(dir,q,id,o,fz),c=dir>0?rb(t):rs(t);
    if(dir>0&&bal(s,team)<c)return nof(s,team,c);                                    // Prüfung VOR jeder Änderung
    setP(s,id,m);casc(s,id,s.pr[id].c/o-1);
    s.bal[team]=bal(s,team)-dir*c;                                                    // Kauf: abziehen, Verkauf (inkl. Slippage/Spread): gutschreiben
    lg(s,`${nm(s,team)}: ${dir>0?'KAUF':'VERKAUF'} ${q}× ${PM[id].n} für ${c} CC → Kurs ${R(s.pr[id].c)}`);sfx(s,'trade');
    return Y(`✔ ${dir>0?'Bezahlt':'Gutgeschrieben'}: ${fmt(c)} CC · Guthaben ${fmt(s.bal[team])} CC · ${fz?'❄ Kurs eingefroren bei '+R(o):'Kurs '+R(o)+' → '+R(s.pr[id].c)}`)});
}
const craft=(t,id)=>act(s=>{
  if(!has(s,t))return NOTEAM();
  const p=PM[id],rc=p.rc,pt=patOf(s,id,t);
  if(!rc)return N('Rohstoffe können nicht hergestellt werden.');
  if(pt)return N(`📜 Gesperrt: ${nm(s,pt.t)} hält das Patent auf ${p.n} (${mmss(pt.u-Date.now())}).`);
  setP(s,id,s.pr[id].c*.97);for(const c in rc)setP(s,c,s.pr[c].c*1.02);   // Angebot ↑ → Produkt −3 %, Nachfrage ↑ → Zutaten +2 %
  lg(s,`🛠 ${nm(s,t)}: ${p.n} hergestellt`);return Y(`✔ Crafting protokolliert: ${p.n} (${nm(s,t)}). Markt: ${p.n} −3 %, Zutaten +2 %. Die Produktkarte übergibst du physisch.`)});
const patent=(t,id)=>act(s=>{if(!has(s,t))return NOTEAM();const n=Date.now(),p=s.pat[id];
  if(p&&p.u>n)return N(`📜 ${PM[id].n} ist bereits patentiert (${nm(s,p.t)}, noch ${mmss(p.u-n)}).`);
  const c=PAT[id]||0;if(bal(s,t)<c)return nof(s,t,c);
  s.bal[t]=bal(s,t)-c;s.pat[id]={t,u:n+PMIN*6e4};lg(s,`📜 ${nm(s,t)}: Patent auf ${PM[id].n} (−${c} CC)`);return Y(`✔ Patent erworben – ${c} CC abgebucht, Guthaben ${fmt(s.bal[t])} CC. ${PMIN} Min Monopol.`)});
const shield=t=>act(s=>{if(!has(s,t))return NOTEAM();const n=Date.now();
  if(s.sh[t]>n)return N(`🔒 Schild läuft noch (${mmss(s.sh[t]-n)}).`);
  if(bal(s,t)<SH.cost)return nof(s,t,SH.cost);
  s.bal[t]=bal(s,t)-SH.cost;s.sh[t]=n+SH.min*6e4;lg(s,`🔒 ${nm(s,t)}: Cybersecurity-Lizenz (−${SH.cost} CC)`);return Y(`✔ Schild aktiv (${SH.min} Min) – ${SH.cost} CC abgebucht, Guthaben ${fmt(s.bal[t])} CC.`)});
// Hacker-Akademie: Level-Up kostet LVC[aktuelles Level]
const levelUp=t=>act(s=>{if(!has(s,t))return NOTEAM();const L=s.lv[t];
  if(L>=DICE.length-1)return N('Maximales Level erreicht.');
  const c=LVC[L]||0;if(bal(s,t)<c)return nof(s,t,c);
  s.bal[t]=bal(s,t)-c;s.lv[t]=L+1;lg(s,`🎓 ${nm(s,t)}: Level ${L+1} [W${DICE[L+1]}] (−${c} CC)`);
  return Y(`✔ Level ${L+1} – W${DICE[L+1]} freigeschaltet. ${c} CC abgebucht, Guthaben ${fmt(s.bal[t])} CC.`)});
const fw=t=>act(s=>{if(!has(s,t))return NOTEAM();s.tm[t]={k:'fw',u:Date.now()+3e5};sfx(s,'glitch');lg(s,`🛡️ Firewall 5 Min für ${nm(s,t)}`);return Y(`✔ Firewall für ${nm(s,t)} läuft (5 Min).`)});
const ri=n=>1+Math.floor(Math.random()*n);
const raid=(a,v)=>act(s=>{if(!has(s,a)||!has(s,v))return NOTEAM();const n=Date.now(),na=nm(s,a),nv=nm(s,v);
  if(a==v)return N('Angreifer und Opfer müssen verschiedene Teams sein.');
  if(s.tm[v].u>n)return N(`🛡️ ${nv} hat bereits Firewall/Sperre – kein Angriff möglich.`);
  const A=DICE[s.lv[a]],V=DICE[s.lv[v]],x=ri(A),y=ri(V),w=x>y,sh=s.sh[v]>n;   // Gleichstand = Abwehr
  let m=`${na} (W${A}): ${x}  vs.  ${nv} (W${V}): ${y}\n`,ok=0;
  if(!w)m+='✖ ANGRIFF ABGEWEHRT';
  else if(sh)m+=`🔒 Angriff gelang, aber das Cybersecurity-Schild von ${nv} verhindert den Rohstoffverlust – ${na} geht leer aus!`;
  else{ok=1;m+=`✔ ANGRIFF ERFOLGREICH – ${na} darf Rohstoffe von ${nv} nehmen. 5-Min-Firewall für ${nv} läuft!`;s.tm[v]={k:'fw',u:n+3e5};sfx(s,'glitch');
    const pm=Math.min(PAIN,bal(s,v));                                                  // Schmerzensgeld: Umbuchung Opfer → Angreifer (höchstens das vorhandene Guthaben)
    s.bal[v]=bal(s,v)-pm;s.bal[a]=bal(s,a)+pm;
    m+=`\n💸 ${nv} zahlt ${pm} CC Schmerzensgeld an ${na}`+(pm<PAIN?` (mehr hatte das Team nicht).`:'.');lg(s,`💸 ${nv} → ${na}: ${pm} CC Schmerzensgeld`)}
  lg(s,`⚡ ${na} → ${nv}: ${ok?'Erfolg':w?'vom Schild geblockt':'abgewehrt'} (${x} vs ${y})`);return{ok,txt:m}});
// Teamname / Mitglieder (f = 'n' | 'm')
const setTeam=(t,f,v)=>act(s=>{if(!has(s,t))return NOTEAM();s.nm[t][f]=String(v).slice(0,f=='n'?24:140);return Y('✔ gespeichert')});

// Admin: Konten
const adjBal=(t,d)=>act(s=>{if(!has(s,t))return NOTEAM();const o=bal(s,t),n=Math.max(0,o+d);s.bal[t]=n;lg(s,`💰 Spielleitung: ${nm(s,t)} ${d>0?'+':''}${d} CC (${o} → ${n})`);return Y(`✔ ${nm(s,t)}: ${fmt(n)} CC`+(o+d<0?' (nicht unter 0)':''))});
const setBal=(t,v)=>act(s=>{if(!has(s,t))return NOTEAM();const x=String(v).trim()===''?NaN:Math.floor(Number(v));if(!(x>=0)||x>1e9)return N('Bitte einen Betrag ≥ 0 eingeben.');
  const o=bal(s,t);s.bal[t]=x;lg(s,`💰 Spielleitung: ${nm(s,t)} auf ${x} CC gesetzt (vorher ${o})`);return Y(`✔ ${nm(s,t)}: ${fmt(x)} CC`)});
const resetBal=()=>act(s=>{for(const t of s.tl)s.bal[t]=Math.max(0,Math.floor(s.cap));lg(s,`💰 Alle Konten auf Startkapital ${s.cap} CC gesetzt`);return Y(`✔ Alle Konten: ${fmt(s.cap)} CC`)});
const setCap=v=>act(s=>{const x=String(v).trim()===''?NaN:Math.floor(Number(v));if(!(x>=0)||x>1e7)return N('Startkapital: Betrag ≥ 0 eingeben.');s.cap=x;return Y(`✔ Startkapital: ${fmt(x)} CC (gilt ab dem nächsten Reset)`)});
const setRank=on=>act(s=>{s.rk=on?1:0;return Y(on?'Rangliste nach Guthaben':'Feste Reihenfolge')});
// Teams hinzufügen / löschen (Admin). Startguthaben = aktuelles Startkapital (Standard 500 CC).
const addTeam=()=>act(s=>{
  if(s.tl.length>=MAXT)return N(`Maximal ${MAXT} Teams möglich.`);
  let id;do{id=String(s.nx++)}while(s.tl.includes(id));
  const c=Math.max(0,Math.floor(Number(s.cap)||0));addMaps(s,id,c);s.tl.push(id);
  lg(s,`➕ Neues Team: ${nm(s,id)} (Startguthaben ${c} CC)`);return Y(`✔ ${nm(s,id)} hinzugefügt – Startguthaben ${fmt(c)} CC.`)});
const delTeam=t=>act(s=>{
  if(!has(s,t))return N('Dieses Team gibt es nicht mehr.');
  if(s.tl.length<=1)return N('Das letzte Team kann nicht gelöscht werden.');
  const name=nm(s,t);s.tl=s.tl.filter(x=>x!==t);for(const m of['bal','tm','sh','lv','nm'])delete s[m][t];
  for(const id in s.pat)if(s.pat[id].t===t)delete s.pat[id];                       // Patente des Teams enden mit dem Team
  lg(s,`🗑 Team gelöscht: ${name}`);return Y(`✔ ${name} gelöscht.`)});

/* ---------- Helfer ---------- */
const ge=g=>g.el+(g.run?Date.now()-g.run:0);
const gtime=s=>mmss(s.gt.lim?s.gt.lim*6e4-ge(s.gt):ge(s.gt));
// Ticker: aktive Events mit Countdown + optionale Freitext-Eilmeldung
const bant=s=>{const n=Date.now(),a=[];
  for(const k in s.ev||{}){const e=s.ev[k],d=EVD[k];if(d&&e.u>n)a.push(`${d.ic} ${d.n.toUpperCase()}: ${d.txt}`+(d.inst?'':` – noch ${mmss(e.u-n)}`))}
  if(s.bn)a.push('📢 '+s.bn);return a.join('   ◆   ')};
const stat=t=>{const x=S.tm[t]||{k:'ok',u:0},n=Date.now(),a=[];let k='ok';
  if(x.u>n){k=x.k;a.push(x.k=='fw'?`🛡️ FIREWALL (${mmss(x.u-n)})`:`💀 GEHACKT (${mmss(x.u-n)})`)}
  if((S.sh[t]||0)>n){if(k=='ok')k='sh';a.push(`🔒 CYBERSEC SHIELD (${mmss(S.sh[t]-n)})`)}
  return[k,a.length?a:['🟢 ANGRIFFSBEREIT']]};
const pats=s=>Object.entries(s.pat).filter(([,p])=>p.u>Date.now()).map(([id,p])=>({id,t:p.t,u:p.u}));
function beat(fn){   // Terminal-Heartbeat (eigener Knoten pro Gerät, verschwindet beim Trennen)
  const id=localStorage.cc_tid||(localStorage.cc_tid=Math.random().toString(36).slice(2,7));
  const f=()=>{const v={n:localStorage.cc_name||'Betreuer',st:fn(),t:Date.now()};
    if(ref)ref.child('tr/'+id).set(v);
    else{try{TR=JSON.parse(localStorage.getItem(LS+'t'))||{}}catch(e){TR={}}TR[id]=v;localStorage.setItem(LS+'t',JSON.stringify(TR));bc&&bc.postMessage(1);pub()}};
  f();setInterval(f,10000);if(ref)ref.child('tr/'+id).onDisconnect().remove();
  return f;
}
window.CC={PR,PM,DICE,MAXT,PAT,SH,EVL,EVD,fresh,esc,act,init,sub:f=>{subs.push(f);f(S)},lg,sfx,nm,members,frozen,trade,craft,patent,shield,levelUp,fw,raid,quote,adjBal,setBal,resetBal,setCap,setRank,rb,rs,bal,fmt,ranking,addTeam,delTeam,LVC,PAIN,NOFUNDS,trig,stopEv,setTeam,ge,mmss,gtime,bant,stat,pats,tick,beat,
  get S(){return S},get TR(){return TR},get loaded(){return loaded}};
})();
