(()=>{
const{PR,PM,DICE,PAT,SH,sub,craft,patent,shield,levelUp,raid,fw,trade,quote,pats,mmss,beat,init,bal,fmt,rb,rs,LVC}=CC,$=s=>document.querySelector(s),R=Math.round;
const op=a=>a.map(p=>`<option value="${p.id}">${p.n}</option>`).join('');
$('#fp').innerHTML=op(PR.filter(p=>p.rc));$('#pp').innerHTML=op(PR);$('#bp').innerHTML=op(PR);
let hb=()=>{},st=localStorage.cc_st||'1';$('#stn').value=st;$('#nm').value=localStorage.cc_name||'';
const res=(id,r)=>{const e=$(id);e.hidden=false;e.className='res '+(r&&r.ok?'ok':'no');e.textContent=r?r.txt:''};
const show=()=>{for(let i=1;i<5;i++)$('#s'+i).hidden=st!=i};
const nm=t=>CC.nm(CC.S,t),esc=CC.esc;
let sig='';   // Team-Auswahl live aus dem Spielstand: Teams, die der Admin hinzufügt/umbenennt/löschen, erscheinen sofort in beiden Dropdowns
function lab(){const tl=CC.S.tl,g=tl.map(t=>t+'\u0001'+nm(t)).join('\u0002');if(g===sig)return;sig=g;
  const k1=$('#tm').value||localStorage.cc_tm,k2=$('#vt').value,html=tl.map(t=>`<option value="${esc(t)}">${esc(nm(t))}</option>`).join('');
  $('#tm').innerHTML=html;$('#vt').innerHTML=html;
  const me=tl.includes(k1)?k1:tl[0];$('#tm').value=me;
  $('#vt').value=tl.includes(k2)&&k2!==me?k2:(tl.find(t=>t!==me)||me);   // Opfer-Vorauswahl: ein anderes Team
  localStorage.cc_tm=me}
function render(){lab();
  const s=CC.S,t=$('#tm').value,n=Date.now();if(!t)return;
  $('#rc').textContent='Rezept: '+Object.entries(PM[$('#fp').value].rc).map(([c,k])=>`${k}× ${PM[c].n}`).join(' + ');
  const B=bal(s,t),L=s.lv[t];$('#bal').textContent='💰 '+fmt(B)+' CC';
  $('#lv').textContent=`Level ${L} · W${DICE[L]}`;
  const lt=L>=DICE.length-1?'🏆 Maximales Level erreicht':`⬆ Level-Up (+1 Level) – ${LVC[L]} CC`;if($('#lu').textContent!==lt)$('#lu').textContent=lt;
  const st2=`🔒 Cybersecurity-Lizenz kaufen – ${SH.cost} CC (10 Min)`;if($('#sb').textContent!==st2)$('#sb').textContent=st2;
  $('#shs').textContent=s.sh[t]>n?`🔒 Schild aktiv (${mmss(s.sh[t]-n)})`:'Kein Schild aktiv.';
  const p=$('#pp').value;$('#pc').textContent=`Patentpreis ${PAT[p]} CC · Marktkurs ${R(s.pr[p].c)} CC`;const pt2=`📜 Patent erwerben – ${PAT[p]} CC (8 Min Monopol)`;if($('#pb').textContent!==pt2)$('#pb').textContent=pt2;
  $('#pl').textContent=pats(s).map(x=>`📜 ${PM[x.id].n}: ${nm(x.t)} (${mmss(x.u-n)})`).join('\n');
  const b=$('#bp').value,q=Math.max(1,Math.floor(+$('#bq').value||1)),m=s.pr[b].c,fz=CC.frozen(s,b),bu=quote(1,q,b,m,fz),se=quote(-1,q,b,m,fz),pt=s.pat[b],lock=pt&&pt.u>n&&pt.t!=t;
  const cb=rb(bu.t),gs=rs(se.t);
  $('#bv').textContent=`Kurs ${R(m)} CC${fz?' ❄ eingefroren':''}\nKauf ${q}×: −${fmt(cb)} CC (Kurs → ${R(bu.m)}) → Guthaben danach ${fmt(B-cb)} CC\nVerkauf ${q}×: +${fmt(gs)} CC (Kurs → ${R(se.m)}, inkl. 8 % Spread) → Guthaben danach ${fmt(B+gs)} CC`+(lock?`\n📜 Verkauf gesperrt: Patent von ${nm(pt.t)} (${mmss(pt.u-n)})`:'');
  $('#bw').textContent=cb>B?`⚠ Nicht genügend CC-Coins! Kauf kostet ${fmt(cb)} CC, Guthaben ${fmt(B)} CC.`:'';
  $('#bs').disabled=!!lock;
}
$('#nm').oninput=e=>{localStorage.cc_name=e.target.value;hb()};
$('#tm').onchange=e=>{localStorage.cc_tm=e.target.value;render()};
$('#stn').onchange=e=>{st=localStorage.cc_st=e.target.value;show();hb()};
['fp','pp','bp','bq'].forEach(i=>$('#'+i).oninput=render);
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const t=$('#tm').value,i=b.id;
  if(i=='mk')res('#r1',await craft(t,$('#fp').value));
  if(i=='lu')res('#r2',await levelUp(t));
  if(i=='sb')res('#r2',await shield(t));
  if(i=='rd')res('#r2',await raid(t,$('#vt').value));
  if(i=='fw')res('#r2',await fw($('#vt').value));
  if(i=='pb')res('#r3',await patent(t,$('#pp').value));
  if(i=='bb'||i=='bs')res('#r4',await trade(i=='bb'?1:-1,+$('#bq').value,t,$('#bp').value));
  render();
});
show();sub(render);setInterval(render,1000);
init().then(()=>{hb=beat(()=>['','Fabrik','Hacker-Akademie','Patentamt','Hauptbörse'][st])});
})();
