(()=>{
const{PR,TEAMS,DICE,EVL,EVD,act,sub,lg,sfx,tick,gtime,bant,stat,esc,nm,mmss,init}=CC,$=s=>document.querySelector(s),Q=s=>document.querySelectorAll(s),R=Math.round;

/* ---------- Sound (Web Audio API – alles synthetisch, keine Dateien) ---------- */
let ac=null,on=localStorage.cc_snd!=='0';
const ctx=()=>{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A()}if(ac.state==='suspended')ac.resume();return ac};
function tone(f,t0,d,type,g,f2){const o=ac.createOscillator(),v=ac.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+d);
  v.gain.setValueAtTime(.0001,t0);v.gain.exponentialRampToValueAtTime(g,t0+.012);v.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(v);v.connect(ac.destination);o.start(t0);o.stop(t0+d+.03)}
function noise(t0,d,fc,g){const n=Math.max(1,Math.floor(ac.sampleRate*d)),b=ac.createBuffer(1,n,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=Math.random()*2-1;
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),v=ac.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=fc;f.Q.value=2;
  v.gain.setValueAtTime(g,t0);v.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(f);f.connect(v);v.connect(ac.destination);s.start(t0)}
const SFX={
  trade(){const t=ac.currentTime;tone(880,t,.55,'sine',.2);tone(1320,t+.09,.6,'sine',.15);tone(1760,t+.18,.7,'triangle',.08)},   // Börsen-Glocke
  alarm(){const t=ac.currentTime;for(let i=0;i<4;i++)tone(600,t+i*.5,.48,'sawtooth',.13,950)},                                      // Warn-Sirene (2 s)
  glitch(){const t=ac.currentTime;for(let i=0;i<8;i++){const s=t+i*.055+Math.random()*.02;noise(s,.05,800+Math.random()*3500,.3);tone(200+Math.random()*1800,s,.04,'square',.06)}tone(110,t+.32,.35,'sawtooth',.1,45)},   // Cyber-Glitch
  tick(){tone(1100,ac.currentTime,.06,'square',.09)}                                                                                // Ticking
};
const play=(k,force)=>{if((on||force)&&ac&&ac.state==='running'&&SFX[k])try{SFX[k]()}catch(e){}};
const ready=()=>{const a=ctx();return a?(a.state==='running'?Promise.resolve():a.resume()):Promise.reject()};
const lab=()=>{const b=$('#snd');b.textContent=on?'🔊 Sound Effekte: AN':'🔇 Sound Effekte: AUS';b.className=on?'b-g':'b-r'};
$('#snd').onclick=()=>{on=!on;localStorage.cc_snd=on?'1':'0';if(on)ctx();lab()};
$('#sndt').onclick=()=>ready().then(()=>[['trade',0],['tick',900],['glitch',1400],['alarm',2300]].forEach(([k,ms])=>setTimeout(()=>play(k,1),ms))).catch(()=>{});
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>{if(on)ctx()},{passive:true}));   // Browser erlauben Ton erst nach einem Klick
// Töne entstehen aus dem Zustand: Aktionen von JEDEM Gerät (Terminals!) erhöhen sfx.n → der Admin spielt den passenden Ton
let seen=null;
function chk(s){if(!CC.loaded)return;const n=(s.sfx&&s.sfx.n)||0;if(seen===null){seen=n;return}if(n!==seen){seen=n;play(s.sfx.k)}}
// Ticking in den letzten 10 Sekunden jedes laufenden Events
let lastR=0;
setInterval(()=>{const n=Date.now(),rs=Object.entries(CC.S.ev||{}).filter(([k,e])=>EVD[k]&&!EVD[k].inst&&e.u>n).map(([,e])=>Math.ceil((e.u-n)/1000)).filter(r=>r>=1&&r<=10);
  if(rs.length){const r=Math.min(...rs);if(r!==lastR){lastR=r;play('tick')}}else lastR=0},200);

/* ---------- Aufbau (einmalig – Buttons werden nie neu gerendert, damit keine Klicks verloren gehen) ---------- */
$('#tt').innerHTML=TEAMS.map(t=>`<option value="${t}">Team ${t}</option>`).join('');
$('#tp').innerHTML=PR.map(p=>`<option value="${p.id}">${p.n}</option>`).join('');
$('#cb').innerHTML=PR.map((p,i)=>`<button data-ch="${i}">${p.n}</button>`).join('');
$('#evg').innerHTML=EVL.map(e=>`<button class="b-o" data-ev="${e.id}"><span>${e.ic} ${esc(e.n)}</span><small>${esc(e.txt)} · ${e.inst?'Einmal-Ereignis':e.min+' Min'}</small></button>`).join('');
$('#ael').innerHTML=EVL.map(e=>`<div class="ae" data-ae="${e.id}" hidden><span>⏱ ${e.ic} <b>${esc(e.n)}</b> – ${e.inst?'Meldung noch':'noch'} <b class="cd up"></b></span><button class="b-r" data-end="${e.id}">⏹ beenden</button></div>`).join('')+'<div class="mut" id="ae0">Kein Event aktiv.</div>';
$('#at').innerHTML=TEAMS.map(t=>`<div class="trow"><div class="th"><b>${t}</b><input class="tin" data-t="${t}" data-f="n" maxlength="24" placeholder="Teamname, z. B. Cyber-Hawks" aria-label="Teamname ${t}"></div>
<input class="tmi" data-t="${t}" data-f="m" maxlength="140" placeholder="Mitglieder: Jan, Alex, Sarah, Tom, Mia" aria-label="Mitglieder ${t}"><div class="stl"><span class="st" data-t="${t}"></span></div><div class="bt">
<button class="b-o" data-a="fw" data-t="${t}">🛡️ Firewall&nbsp;(5&nbsp;Min)</button><button class="b-r" data-a="hk" data-t="${t}">💀 Gesperrt/<wbr>Gehackt&nbsp;(3&nbsp;Min)</button><button class="b-g" data-a="ok" data-t="${t}">↺ Reset</button></div></div>`).join('');

let nt;const note=t=>{$('#fb').textContent=t;clearTimeout(nt);nt=setTimeout(()=>$('#fb').innerHTML='&nbsp;',4000)};
let et;const evm=t=>{$('#evm').textContent=t;clearTimeout(et);et=setTimeout(()=>$('#evm').innerHTML='&nbsp;',5000)};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset,i=b.id;
  if(d.a)act(s=>{s.tm[d.t]={k:d.a,u:d.a=='ok'?0:Date.now()+(d.a=='fw'?3e5:18e4)};if(d.a!='ok')sfx(s,'glitch');lg(s,`${nm(s,d.t)}: ${{fw:'Firewall 5 Min',hk:'gehackt/gesperrt 3 Min',ok:'Status Reset'}[d.a]}`)});
  if(d.ev)CC.trig(d.ev).then(r=>evm(r.txt));
  if(d.end)CC.stopEv(d.end).then(r=>evm(r.txt));
  if(d.ch)act(s=>{s.ch.i=+d.ch;s.ch.auto=false});
  if(i=='ar')act(s=>{s.ch.auto=!s.ch.auto});
  if(i=='buy'||i=='sell')CC.trade(i=='buy'?1:-1,+$('#tq').value,$('#tt').value,$('#tp').value).then(r=>note(r.txt));
  if(i=='cust'){const t=$('#ct').value.trim();if(t){act(s=>{s.bn=t;sfx(s,'alarm');lg(s,'EILMELDUNG: '+t)});$('#ct').value=''}}
  if(i=='clr')act(s=>{s.bn=''});
  if(i=='gs')act(s=>{if(!s.gt.run)s.gt.run=Date.now()});
  if(i=='gp')act(s=>{if(s.gt.run){s.gt.el+=Date.now()-s.gt.run;s.gt.run=0}});
  if(i=='gr')act(s=>{s.gt.el=0;s.gt.run=0});
  if(i=='rst'&&confirm('Neue Spielrunde starten?\n\nPreise, Level, Lager, Patente, Events (alle wieder freigeschaltet) und Spielzeit werden zurückgesetzt. Teamnamen und Mitglieder bleiben erhalten.'))
    act(s=>{const keep=s.nm,sf=s.sfx;Object.assign(s,CC.fresh(),{nm:keep,sfx:sf});lg(s,'Neue Spielrunde gestartet')});
});
$('#at').addEventListener('change',e=>{const i=e.target.closest('[data-f]');if(i)CC.setTeam(i.dataset.t,i.dataset.f,i.value)});   // Name/Mitglieder speichern beim Verlassen des Feldes
$('#tl').addEventListener('change',()=>act(s=>{s.gt.lim=Math.max(0,+$('#tl').value||0)}));
$('#ct').addEventListener('keydown',e=>{if(e.key=='Enter')$('#cust').click()});

function render(s){
  $('#ap').innerHTML='<tr><th>PRODUKT</th><th class="ra">PREIS</th><th>TREND</th></tr>'+PR.map(p=>{const r=s.pr[p.id],c=r.c>r.p?'up':r.c<r.p?'dn':'';return`<tr><td>${p.n}${CC.frozen(s,p.id)?' ❄':''}</td><td class="ra ${c}"><b>${R(r.c)} CC</b></td><td>${c=='up'?'📈':c=='dn'?'📉':'➖'}</td></tr>`}).join('');
  $('#lg').innerHTML=s.lg.map(l=>`<div>${esc(l)}</div>`).join('');
  Q('.st').forEach(e=>{const t=e.dataset.t,[k,x]=stat(t);e.innerHTML=`<b class="s-${k}">${x.join(' · ')}</b> · Level ${s.lv[t]} [W${DICE[s.lv[t]]}]`});
  Q('.tin,.tmi').forEach(e=>{if(document.activeElement!==e){const v=(s.nm[e.dataset.t]||{})[e.dataset.f]||'';if(e.value!==v)e.value=v}});
  Q('#tt option').forEach(o=>{const x=nm(s,o.value);if(o.textContent!==x)o.textContent=x});
  $('#agt').textContent=gtime(s);if(document.activeElement!==$('#tl'))$('#tl').value=s.gt.lim;
  const n=Date.now();let k=0;
  Q('[data-ae]').forEach(r=>{const e=s.ev[r.dataset.ae],a=!!(e&&e.u>n&&EVD[r.dataset.ae]);r.hidden=!a;if(a){k++;r.querySelector('.cd').textContent=mmss(e.u-n)}});
  $('#ae0').hidden=k>0;
  Q('[data-ev]').forEach(b=>{b.disabled=!!s.evd[b.dataset.ev]});   // Einmal-Nutzung: ausgegraut für den Rest der Spielrunde
  $('#cur').textContent=s.bn?'Freitext-Eilmeldung aktiv: '+s.bn:'';
  $('#ar').textContent='Chart Auto-Rotate: '+(s.ch.auto?'AN':'AUS');$('#ar').className=s.ch.auto?'b-g':'b-r';
  Q('[data-ch]').forEach(b=>b.classList.toggle('on',!s.ch.auto&&+b.dataset.ch==s.ch.i));
  const tr=Object.values(CC.TR).filter(x=>n-x.t<3e4);
  $('#pl').innerHTML=CC.pats(s).map(x=>`<div>📜 ${PR.find(p=>p.id==x.id).n}: ${esc(nm(s,x.t))} (${mmss(x.u-n)})</div>`).join('')||'<span class="mut">Keine aktiven Patente.</span>';
  $('#tl2').innerHTML=tr.length?tr.map(x=>`<div>🟢 ${esc(x.n)} · ${esc(x.st)}</div>`).join(''):'<span class="mut">Keine Terminals online.</span>';
  $('#snh').textContent=on&&(!ac||ac.state!=='running')?'⚠ Ton noch gesperrt – einmal auf die Seite klicken':'';
  chk(s);
}
lab();sub(render);setInterval(()=>{tick();render(CC.S)},500);init();
})();
