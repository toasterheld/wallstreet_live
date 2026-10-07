(()=>{
const{PR,PM,TEAMS,DICE,PAT,SH,act,sub,lg,craft,patent,shield,raid,fw,trade,quote,pats,mmss,beat,init}=CC,$=s=>document.querySelector(s),R=Math.round;
const ot=TEAMS.map(t=>`<option value="${t}">Team ${t}</option>`).join(''),op=a=>a.map(p=>`<option value="${p.id}">${p.n}</option>`).join('');
$('#tm').innerHTML=ot;$('#vt').innerHTML=ot;$('#vt').selectedIndex=1;
$('#fp').innerHTML=op(PR.filter(p=>p.rc));$('#pp').innerHTML=op(PR);$('#bp').innerHTML=op(PR);
let hb=()=>{},st=localStorage.cc_st||'1';$('#stn').value=st;$('#nm').value=localStorage.cc_name||'';$('#tm').value=localStorage.cc_tm||TEAMS[0];
const res=(id,r)=>{const e=$(id);e.hidden=false;e.className='res '+(r&&r.ok?'ok':'no');e.textContent=r?r.txt:''};
const show=()=>{for(let i=1;i<5;i++)$('#s'+i).hidden=st!=i};
const nm=t=>CC.nm(CC.S,t);
function lab(){['tm','vt'].forEach(i=>document.querySelectorAll('#'+i+' option').forEach(o=>{const x=nm(o.value);if(o.textContent!==x)o.textContent=x}))}   // Teamnamen aus dem Admin
function render(){lab();
  const s=CC.S,t=$('#tm').value,n=Date.now(),i=s.inv[t]||{},l=Object.keys(i).filter(k=>i[k]).map(k=>`${i[k]}× ${PM[k].n}`);
  $('#rc').textContent='Rezept: '+Object.entries(PM[$('#fp').value].rc).map(([c,k])=>`${k}× ${PM[c].n}`).join(' + ');
  $('#iv').textContent=`Konto ${nm(t)}: ${l.length?l.join(', '):'leer'}`;
  $('#lv').textContent=`Level ${s.lv[t]} · W${DICE[s.lv[t]]}`;
  $('#shs').textContent=s.sh[t]>n?`🔒 Schild aktiv (${mmss(s.sh[t]-n)})`:'Kein Schild aktiv.';
  const p=$('#pp').value;$('#pc').textContent=`Patentpreis ${PAT[p]} CC · Marktkurs ${R(s.pr[p].c)} CC`;
  $('#pl').textContent=pats(s).map(x=>`📜 ${PM[x.id].n}: ${nm(x.t)} (${mmss(x.u-n)})`).join('\n');
  const b=$('#bp').value,q=Math.max(1,Math.floor(+$('#bq').value||1)),m=s.pr[b].c,fz=CC.frozen(s,b),bu=quote(1,q,b,m,fz),se=quote(-1,q,b,m,fz),pt=s.pat[b],lock=pt&&pt.u>n&&pt.t!=t;
  $('#bv').textContent=`Kurs ${R(m)} CC${fz?' ❄ eingefroren':''}\nKauf ${q}×: ${R(bu.t)} CC (Kurs → ${R(bu.m)})\nVerkauf ${q}×: ${R(se.t)} CC (Kurs → ${R(se.m)}, inkl. 8 % Spread)`+(lock?`\n📜 Verkauf gesperrt: Patent von ${nm(pt.t)} (${mmss(pt.u-n)})`:'');
  $('#bs').disabled=!!lock;
}
$('#nm').oninput=e=>{localStorage.cc_name=e.target.value;hb()};
$('#tm').onchange=e=>{localStorage.cc_tm=e.target.value;render()};
$('#stn').onchange=e=>{st=localStorage.cc_st=e.target.value;show();hb()};
['fp','pp','bp','bq'].forEach(i=>$('#'+i).oninput=render);
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;const t=$('#tm').value,i=b.id;
  if(i=='mk')res('#r1',await craft(t,$('#fp').value));
  if(i=='lu')res('#r2',await act(s=>{if(s.lv[t]>=DICE.length-1)return{ok:0,txt:'Maximales Level erreicht.'};s.lv[t]++;lg(s,`🎓 Team ${t}: Level ${s.lv[t]} [W${DICE[s.lv[t]]}]`);return{ok:1,txt:`✔ Level ${s.lv[t]} – W${DICE[s.lv[t]]} freigeschaltet.`}}));
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
