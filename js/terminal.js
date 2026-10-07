(()=>{
const{PR,PM,TEAMS,DICE,act,sub,lg,raid,craft,beat,init}=CC,$=s=>document.querySelector(s);
const opt=TEAMS.map(t=>`<option>${t}</option>`).join('');
['ht','at','vt','ft'].forEach(i=>$('#'+i).innerHTML=opt);$('#vt').selectedIndex=1;
$('#fp').innerHTML=PR.map(p=>`<button data-p="${p.id}">${p.n}</button>`).join('');
let sel='chip',st=localStorage.cc_st||'h';$('#stn').value=st;$('#nm').value=localStorage.cc_name||'';
const res=(id,ok,t)=>{const e=$(id);e.hidden=false;e.className='res '+(ok?'ok':'no');e.textContent=t};
function show(){$('#s-h').hidden=st!='h';$('#s-f').hidden=st!='f';document.querySelectorAll('[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p==sel))}
function render(s){
  const t=$('#ht').value,f=$('#ft').value,i=s.inv[f]||{},l=Object.keys(i).filter(k=>i[k]).map(k=>`${i[k]}× ${PM[k].n}`);
  $('#lv').textContent=`Level ${s.lv[t]} · W${DICE[s.lv[t]]}`;
  $('#iv').textContent=`Konto Team ${f}: ${l.length?l.join(', '):'noch leer'}`;
}
$('#nm').oninput=e=>localStorage.cc_name=e.target.value;
$('#stn').onchange=e=>{st=localStorage.cc_st=e.target.value;show()};
$('#ht').onchange=$('#ft').onchange=()=>render(CC.S);
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.p){sel=b.dataset.p;show()}
  if(b.id=='lu'){const t=$('#ht').value;act(s=>{if(s.lv[t]<DICE.length-1){s.lv[t]++;lg(s,`🎓 Team ${t}: Level ${s.lv[t]} [W${DICE[s.lv[t]]}] freigeschaltet`)}})}
  if(b.id=='rd'){const a=$('#at').value,v=$('#vt').value,r=a==v?{ok:0,txt:'Angreifer und Opfer müssen verschiedene Teams sein.'}:raid(a,v);res('#rs',r.ok,r.txt)}
  if(b.id=='mk'){const t=$('#ft').value;craft(t,sel);res('#fr',1,`✔ ${PM[sel].n} im Konto von Team ${t} verbucht.`)}
});
show();sub(render);init();beat(()=>st=='h'?'Hacker-Akademie':'Fabrik');
})();
