(()=>{
const{PR,TEAMS,DICE,sub,tick,gtime,bant,stat,init}=CC,$=s=>document.querySelector(s),R=Math.round,L=n=>R(n).toLocaleString('de-DE');
let cur=4,to=4,dv=PR[4].b;const prev={};

function line(cv,pts,big){   // Canvas-Linienchart: big = Zeitachse+Raster, sonst Sparkline
  const d=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(cv.width!=w*d||cv.height!=h*d){cv.width=w*d;cv.height=h*d}
  if(pts.length<2)pts=[pts[0],[pts[0][0]+1,pts[0][1]]];
  const g=cv.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  const px=big?70:4,py=big?18:4,vs=pts.map(p=>p[1]);let lo=Math.min(...vs),hi=Math.max(...vs);if(hi==lo){hi+=1;lo-=1}const m=(hi-lo)*.12;lo-=m;hi+=m;
  const t0=pts[0][0],t1=pts[pts.length-1][0],n=pts.length-1;
  const X=(p,i)=>px+(big?(p[0]-t0)/Math.max(1,t1-t0):i/n)*(w-px-6),Y=v=>h-py-(v-lo)/(hi-lo)*(h-2*py);
  if(big){g.font='14px monospace';g.fillStyle='#7f93bf';g.strokeStyle='#1b2c5a';g.lineWidth=1;
    for(let i=0;i<4;i++){const v=lo+(hi-lo)*i/3,y=Y(v);g.beginPath();g.moveTo(px,y);g.lineTo(w,y);g.stroke();g.fillText(R(v),2,y+4)}}
  const col=vs[n]>=vs[0]?'#39ff14':'#ff2a4d';
  g.beginPath();pts.forEach((p,i)=>{const x=X(p,i),y=Y(p[1]);i?g.lineTo(x,y):g.moveTo(x,y)});
  g.shadowColor=col;g.shadowBlur=big?14:6;g.strokeStyle=col;g.lineWidth=big?3.5:2;g.lineJoin='round';g.stroke();g.shadowBlur=0;
  g.lineTo(X(pts[n],n),h-py);g.lineTo(X(pts[0],0),h-py);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,col+'44');gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fill();
  g.beginPath();g.arc(X(pts[n],n),Y(pts[n][1]),big?6:3,0,7);g.fillStyle=col;g.fill();
}

function go(i){   // sanfter Wechsel des Fokus-Charts (Fade)
  if(i==to)return;to=i;const c=$('#mc');c.classList.add('out');
  setTimeout(()=>{cur=i;dv=CC.S.pr[PR[i].id].c;$('#mt').textContent=PR[i].n;document.querySelectorAll('.pk').forEach((e,k)=>e.classList.toggle('on',k==i));c.classList.remove('out')},350);
}
function frame(){   // Preis wird weich zum Zielwert getweent
  const s=CC.S,id=PR[cur].id,c=s.pr[id].c;dv+=(c-dv)*.12;if(Math.abs(c-dv)<.05)dv=c;
  const h=s.hist[id].slice(-80);h[h.length-1]=[h[h.length-1][0],dv];h.push([Date.now(),dv]);
  line($('#mc'),h,1);$('#px').textContent=L(dv)+' CC';requestAnimationFrame(frame);
}
function rP(s){
  $('#pc').innerHTML=PR.map((p,i)=>{
    const r=s.pr[p.id],d=(r.c/p.b-1)*100,t=r.c>r.p?'up':r.c<r.p?'dn':'',f=prev[p.id]!=null&&prev[p.id]!=r.c?(r.c>prev[p.id]?'fu':'fd'):'';prev[p.id]=r.c;
    return`<div class="card pk${i==cur?' on':''}"><b>${p.n}</b><div class="p ${t} ${f}">${L(r.c)} CC</div><div class="${d>=0?'up':'dn'}">${t=='dn'?'▼':t=='up'?'▲':'■'} ${d>0?'+':''}${d.toLocaleString('de-DE',{maximumFractionDigits:1})} %</div><div class="sp"><canvas></canvas></div></div>`}).join('');
  document.querySelectorAll('.pk canvas').forEach((c,i)=>line(c,s.hist[PR[i].id].slice(-10),0));
}
const rT=s=>$('#pt').innerHTML=TEAMS.map(t=>{const[k,x]=stat(t);return`<div class="tm s-${k}"><span>TEAM ${t.toUpperCase()}<small>HACKER-LEVEL ${s.lv[t]} · W${DICE[s.lv[t]]}</small></span><b>${x}</b></div>`}).join('');
const rH=s=>{$('#gt').textContent=gtime(s);$('#gt').className=s.gt.lim&&CC.ge(s.gt)>=s.gt.lim*6e4?'dn':'';$('#wc').textContent=new Date().toLocaleTimeString('de-DE')};
const rN=s=>{const t=bant(s);$('#bn').classList.toggle('on',!!t);if($('#bt').textContent!=t)$('#bt').textContent=t};

$('#mt').textContent=PR[4].n;
sub(s=>{rP(s);rT(s);rH(s);rN(s);if(!s.ch.auto&&s.ch.i!=to)go(s.ch.i)});
setInterval(()=>{tick();const s=CC.S;rT(s);rH(s);rN(s)},500);
setInterval(()=>{if(CC.S.ch.auto)go((to+1)%PR.length)},15000);   // Auto-Rotation alle 15 s
addEventListener('resize',()=>rP(CC.S));
addEventListener('keydown',e=>{if(e.key=='f')document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()});
init();frame();
})();
