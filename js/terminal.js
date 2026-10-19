(()=>{
const{PR,PM,DICE,PAT,SH,sub,craft,patent,shield,levelUp,reportAttack,fw,trade,quote,pats,mmss,beat,init,bal,fmt,rb,rs,LVC}=CC,$=s=>document.querySelector(s),R=Math.round;
const op=a=>a.map(p=>`<option value="${p.id}">${p.n}</option>`).join('');
$('#bk').innerHTML=[2,3].map(l=>`<option value="${l}"></option>`).join('');$('#fp').innerHTML=op(PR.filter(p=>p.rc));$('#pp').innerHTML=op(PR);$('#bp').innerHTML=op(PR);
let hb=()=>{},st=localStorage.cc_st||'1';$('#stn').value=st;$('#nm').value=localStorage.cc_name||'';
const res=(id,r)=>{const e=$(id);e.hidden=false;e.className='res '+(r&&r.ok?'ok':'no');e.textContent=r?r.txt:''};
const show=()=>{for(let i=1;i<6;i++)$('#s'+i).hidden=st!=i};
const nm=t=>CC.nm(CC.S,t),esc=CC.esc;
let sig='';   // Team-Auswahl live aus dem Spielstand: Teams, die der Admin hinzufügt/umbenennt/löschen, erscheinen sofort in beiden Dropdowns
function lab(){const tl=CC.S.tl,g=tl.map(t=>t+'\u0001'+nm(t)).join('\u0002');if(g===sig)return;sig=g;
  const k1=$('#tm').value||localStorage.cc_tm,html=tl.map(t=>`<option value="${esc(t)}">${esc(nm(t))}</option>`).join('');
  $('#tm').innerHTML=html;
  const me=tl.includes(k1)?k1:tl[0];$('#tm').value=me;
  localStorage.cc_tm=me}
function render(){lab();
  const s=CC.S,t=$('#tm').value,n=Date.now();if(!t)return;
  $('#rc').textContent='Rezept: '+Object.entries(PM[$('#fp').value].rc).map(([c,k])=>`${k}× ${PM[c].n}`).join(' + ');
  const B=bal(s,t),L=s.lv[t];$('#bal').textContent='💰 '+fmt(B)+' CC';
  $('#lv').textContent=`Level ${L} · W${DICE[L]}`;
  const lt=L>=DICE.length-1?'🏆 Maximales Level erreicht':`⬆ Level-Up (+1 Level) – ${LVC[L]} CC`;if($('#lu').textContent!==lt)$('#lu').textContent=lt;
  const st2=`🔒 Cybersecurity-Lizenz kaufen – ${SH.cost} CC (10 Min)`;if($('#sb').textContent!==st2)$('#sb').textContent=st2;
  const sh=s.sh[t]>n;$('#shs').textContent=sh?`🔒 Schild aktiv (${mmss(s.sh[t]-n)})`:'Kein Schild aktiv.';
  $('#ah').textContent=`Geschädigtes Team: ${nm(t)} (oben gewählt). Gewürfelt wird manuell auf dem Feld, hier wird nur der Schaden gebucht.`+(sh?'\n🔒 Hinweis: Dieses Team hat ein aktives Schild – laut Regel verliert es nichts.':'');
  $('#rl').disabled=!sh;if(!sh)$('#rl').checked=false;
  const p=$('#pp').value;$('#pc').textContent=`Patentpreis ${PAT[p]} CC · Marktkurs ${R(s.pr[p].c)} CC`;const pt2=`📜 Patent erwerben – ${PAT[p]} CC (8 Min Monopol)`;if($('#pb').textContent!==pt2)$('#pb').textContent=pt2;
  $('#pl').textContent=pats(s).map(x=>`📜 ${PM[x.id].n}: ${nm(x.t)} (${mmss(x.u-n)})`).join('\n');
  const b=$('#bp').value,q=Math.max(1,Math.floor(+$('#bq').value||1)),m=s.pr[b].c,fz=CC.frozen(s,b),bu=quote(1,q,b,m,fz),se=quote(-1,q,b,m,fz),pt=s.pat[b],lock=pt&&pt.u>n&&pt.t!=t;
  const cb=rb(bu.t),gs=rs(se.t);
  $('#bv').textContent=`Kurs ${R(m)} CC${fz?' ❄ eingefroren':''}\nKauf ${q}×: −${fmt(cb)} CC (Kurs → ${R(bu.m)}) → Guthaben danach ${fmt(B-cb)} CC\nVerkauf ${q}×: +${fmt(gs)} CC (Kurs → ${R(se.m)}, inkl. 8 % Spread) → Guthaben danach ${fmt(B+gs)} CC`+(lock?`\n📜 Verkauf gesperrt: Patent von ${nm(pt.t)} (${mmss(pt.u-n)})`:'');
  $('#bw').textContent=cb>B?`⚠ Nicht genügend CC-Coins! Kauf kostet ${fmt(cb)} CC, Guthaben ${fmt(B)} CC.`:'';
  $('#bs').disabled=!!lock;
  const bl=+$('#bk').value,bc=s.bpc[bl],own=s.bp[t]||{};   // Blueprint-Händler
  [2,3].forEach(l=>{const o=$('#bk').options[l-2],x=`Level ${l} Blueprint (${CC.BPN[l]}) – ${fmt(s.bpc[l])} CC${own[l]?' ✔ gekauft':''}`;if(o.textContent!==x)o.textContent=x});
  $('#bki').textContent=`Käufer: ${nm(t)} · Guthaben ${fmt(B)} CC`;
  $('#bko').textContent=own[bl]?`✔ ${nm(t)} besitzt Level ${bl} bereits.`:`Kauf: −${fmt(bc)} CC → Guthaben danach ${fmt(B-bc)} CC`;
  $('#bkw').textContent=!own[bl]&&B<bc?`⚠ Unzureichendes Guthaben! Preis ${fmt(bc)} CC, Guthaben ${fmt(B)} CC.`:'';
  $('#bkb').disabled=!!own[bl];
}
$('#nm').oninput=e=>{localStorage.cc_name=e.target.value;hb()};
$('#tm').onchange=e=>{localStorage.cc_tm=e.target.value;render()};
$('#stn').onchange=e=>{st=localStorage.cc_st=e.target.value;show();hb()};
['fp','pp','bp','bq','bk'].forEach(i=>$('#'+i).oninput=render);
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const t=$('#tm').value,i=b.id;
  if(i=='mk')res('#r1',await craft(t,$('#fp').value));
  if(i=='lu')res('#r2',await levelUp(t));
  if(i=='sb')res('#r2',await shield(t));
  if(i=='rp'){const r=await reportAttack(t,{ransom:$('#rn').value,shield:$('#rl').checked,fw:$('#rf').checked});res('#r2',r);if(r.ok){$('#rn').value=CC.PAIN;$('#rl').checked=false}}
  if(i=='fw')res('#r2',await fw(t));
  if(i=='pb')res('#r3',await patent(t,$('#pp').value));
  if(i=='bkb')res('#r5',await CC.buyBp(t,$('#bk').value));
  if(i=='bb'||i=='bs')res('#r4',await trade(i=='bb'?1:-1,+$('#bq').value,t,$('#bp').value));
  render();
});
$('#rn').value=CC.PAIN;
show();sub(render);setInterval(render,1000);
init().then(()=>{hb=beat(()=>['','Fabrik','Hacker-Akademie','Patentamt','Hauptbörse','Blueprint-Händler'][st])});
})();
