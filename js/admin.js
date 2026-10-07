(()=>{
const{PR,PM,TEAMS,DICE,act,sub,lg,tick,gtime,bant,stat,esc,EV,mmss,init}=CC,$=s=>document.querySelector(s),Q=s=>document.querySelectorAll(s),R=Math.round;
$('#tt').innerHTML=TEAMS.map(t=>`<option value="${t}">Team ${t}</option>`).join('');
$('#tp').innerHTML=PR.map(p=>`<option value="${p.id}">${p.n}</option>`).join('');
$('#cb').innerHTML=PR.map((p,i)=>`<button data-ch="${i}">${p.n}</button>`).join('');
$('#at').innerHTML=TEAMS.map(t=>`<div class="trow"><div><b>Team ${t}</b><br><span class="st" data-t="${t}"></span></div><div class="bt">
<button class="b-o" data-a="fw" data-t="${t}">🛡️ Firewall (5 Min)</button><button class="b-r" data-a="hk" data-t="${t}">💀 Gesperrt/Gehackt (3 Min)</button><button class="b-g" data-a="ok" data-t="${t}">↺ Reset</button></div></div>`).join('');

let nt;const note=t=>{$('#fb').textContent=t;clearTimeout(nt);nt=setTimeout(()=>$('#fb').innerHTML='&nbsp;',4000)};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset,i=b.id;
  if(d.a)act(s=>{s.tm[d.t]={k:d.a,u:d.a=='ok'?0:Date.now()+(d.a=='fw'?3e5:18e4)};lg(s,`Team ${d.t}: ${{fw:'Firewall 5 Min',hk:'gehackt/gesperrt 3 Min',ok:'Status Reset'}[d.a]}`)});
  if(d.ev)act(s=>{const[x,f]=EV[d.ev];s.bn=x;s.bk=d.ev;f(s);lg(s,'EVENT: '+x)});
  if(d.ch)act(s=>{s.ch.i=+d.ch;s.ch.auto=false});
  if(i=='ar')act(s=>{s.ch.auto=!s.ch.auto});
  if(i=='buy'||i=='sell')CC.trade(i=='buy'?1:-1,+$('#tq').value,$('#tt').value,$('#tp').value).then(r=>note(r.txt));
  if(i=='cust'){const t=$('#ct').value.trim();if(t){act(s=>{s.bn=t;s.bk='c';lg(s,'EILMELDUNG: '+t)});$('#ct').value=''}}
  if(i=='clr')act(s=>{s.bn='';s.bk='';s.fr=0});
  if(i=='gs')act(s=>{if(!s.gt.run)s.gt.run=Date.now()});
  if(i=='gp')act(s=>{if(s.gt.run){s.gt.el+=Date.now()-s.gt.run;s.gt.run=0}});
  if(i=='gr')act(s=>{s.gt.el=0;s.gt.run=0});
  if(i=='rst'&&confirm('Alle Preise, Level, Teams, Eilmeldungen und die Spielzeit zurücksetzen?'))act(s=>{Object.assign(s,CC.fresh());lg(s,'Alles zurückgesetzt')});
});
$('#tl').addEventListener('change',()=>act(s=>{s.gt.lim=Math.max(0,+$('#tl').value||0)}));
$('#ct').addEventListener('keydown',e=>{if(e.key=='Enter')$('#cust').click()});

function render(s){
  $('#ap').innerHTML='<tr><th>PRODUKT</th><th class="ra">PREIS</th><th>TREND</th></tr>'+PR.map(p=>{const r=s.pr[p.id],c=r.c>r.p?'up':r.c<r.p?'dn':'';return`<tr><td>${p.n}</td><td class="ra ${c}"><b>${R(r.c)} CC</b></td><td>${c=='up'?'📈':c=='dn'?'📉':'➖'}</td></tr>`}).join('');
  $('#lg').innerHTML=s.lg.map(l=>`<div>${esc(l)}</div>`).join('');
  Q('.st').forEach(e=>{const t=e.dataset.t,[k,x]=stat(t);e.innerHTML=`<b class="s-${k}">${x.join(' · ')}</b> · Level ${s.lv[t]} [W${DICE[s.lv[t]]}]`});
  $('#agt').textContent=gtime(s);if(document.activeElement!==$('#tl'))$('#tl').value=s.gt.lim;
  $('#cur').textContent=bant(s)?'Aktiv: '+bant(s):'Keine Eilmeldung aktiv.';
  $('#ar').textContent='Chart Auto-Rotate: '+(s.ch.auto?'AN':'AUS');$('#ar').className=s.ch.auto?'b-g':'b-r';
  Q('[data-ch]').forEach(b=>b.classList.toggle('on',!s.ch.auto&&+b.dataset.ch==s.ch.i));
  const n=Date.now(),tr=Object.values(CC.TR).filter(x=>n-x.t<3e4);
  $('#pl').innerHTML=CC.pats(s).map(x=>`<div>📜 ${PM[x.id].n}: Team ${x.t} (${mmss(x.u-n)})</div>`).join('')||'<span class="mut">Keine aktiven Patente.</span>';
  $('#tl2').innerHTML=tr.length?tr.map(x=>`<div>🟢 ${esc(x.n)} · ${esc(x.st)}</div>`).join(''):'<span class="mut">Keine Terminals online.</span>';
}
sub(render);setInterval(()=>{tick();render(CC.S)},500);init();
})();
