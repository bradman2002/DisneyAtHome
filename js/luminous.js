/* ===== LUMINOUS: THE SYMPHONY OF US — EPCOT's nighttime show on World Showcase Lagoon =====
   It starts at EPCOT's closing time (today's real show time when live). The soundtrack (the owner's own copy,
   audio/luminous.mp3, never committed; or the copy kept by Load audio folder) is the show's clock, like the Magic
   Kingdom's fireworks: fireworks go up from barges around the lagoon on the music's beats (CHOREO_LUM, made from the
   soundtrack by tools/fireworks_from_audio.py), and the barges' fountains and coloured lights rise and fall with its
   loudness, in each section's colours. The shells use the same fireworks engine (heaFrame in street.js).
   EPCOT's guests gather along the World Showcase promenade to watch (see spot0 'lum' in sim.js).
   Both nighttime shows can run at once (9 PM): you hear the one the map is looking at. */
const LUM={file:'audio/luminous.mp3',a:{audio:new Audio(),ready:false,src:'folder',name:'audio/luminous.mp3'},ci:0,lastSt:-9,B:null};
{const A=LUM.a,a=A.audio,ev=()=>EV.find(e=>e.id==='lum');a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,e=ev();if(d&&isFinite(d)&&e&&!e.userDur)e.dur=d/60}); /* the show is as long as its music */
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('luminous');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 setTimeout(()=>loadTrack(a,LUM.file),0)}
if(typeof EPCOT!=='undefined'&&EPCOT)EVPOS.lum=EPCOT.c;
const lumEv=()=>EV.find(e=>e.id==='lum');
function lumClock(){const ev=lumEv();if(!ev||ev.key==null||(ev.ph!=='live'&&ev.ph!=='done'))return null;return T-ev.key}
const lumLive=()=>{const ev=lumEv();return!!ev&&ev.ph==='live'};
const lumPlaying=()=>!LUM.a.audio.paused;
// how much the map is looking at the lagoon: 1 there, nothing back at the Magic Kingdom or on Main Street
function lumNear(){if(SV.on||!EVPOS.lum)return 0;const[x,y]=EVPOS.lum;return Math.max(0,Math.min(1,prox(x,y,520)*1.7-.08))}
/* the barges: a ring out on the lagoon (part way from the middle to each shore) plus one in the middle; and launch
   points just off the shore all the way round (LUM.S), so the sky fills around the whole lagoon */
function lumBarges(){if(LUM.B)return LUM.B;LUM.B=[];LUM.S=[];if(typeof EPCOT==='undefined'||!EPCOT)return LUM.B;const[cx0,cy0]=EPCOT.c,w=OSM.areas.filter(a=>a.k==='water'&&ptIn(cx0,cy0,a.o)).sort((p,q)=>q.o.length-p.o.length)[0];if(!w)return LUM.B;
 const edge=an=>{let r=10;while(r<400&&ptIn(cx0+Math.cos(an)*r,cy0+Math.sin(an)*r,w.o))r+=3;return r};
 const wet=(x,y)=>ptIn(x,y,w.o)&&!(w.i||[]).some(q=>ptIn(x,y,q)),isl=OSM.areas.filter(a=>a.k!=='water'&&a.o.length>2&&ptIn(a.o[0][0],a.o[0][1],w.o)); /* open water: not on one of the lagoon's islands */
 const n=12;for(let i=0;i<n;i++){const an=i/n*6.283+.26,r=edge(an),f=[.62,.54,.7,.46,.78].find(f=>{const x=cx0+Math.cos(an)*r*f,y=cy0+Math.sin(an)*r*f;return wet(x,y)&&!isl.some(a=>{const b=bbox(a.o);return x>b[0]-9&&x<b[2]+9&&y>b[1]-9&&y<b[3]+9})})||.62;LUM.B.push([cx0+Math.cos(an)*r*f,cy0+Math.sin(an)*r*f])}
 for(let i=0;i<20;i++){const an=i/20*6.283,r=edge(an);LUM.S.push([cx0+Math.cos(an)*(r-14),cy0+Math.sin(an)*(r-14)])}
 LUM.B.sort((p,q)=>p[0]-q[0]);LUM.B.splice(Math.floor(n/2),0,[cx0,cy0]);LUM.S.sort((p,q)=>p[0]-q[0]);LUM.hit=LUM.B.map(()=>-99);LUM.fl=[];LUM.fire=[];return LUM.B} /* left to right, so a cue's x (-1..1) picks a spot across the lagoon */
const lumEnv=st=>CHOREO_LUM.env[Math.max(0,Math.min(CHOREO_LUM.env.length-1,Math.floor(st*2)))]||0;
function lumSec(st){const S=CHOREO_LUM.sec;let i=0;while(i<S.length-2&&st>=S[i+1])i++;return i}
/* Start it now, whatever the time: an extra showtime a few seconds from now (kept through live updates in `ev.force`,
   and dropped again once it has played or the clock is taken back before it). The map flies to the lagoon. */
function lumStart(){const ev=lumEv();if(!ev)return;if(ev.ph==='live'){lumLook();closeSheet();return}ev.on=true;const s=Math.ceil(T)+3;(ev.force||(ev.force=[])).push(s);ev.t=[...new Set([...ev.t,s])].sort((a,b)=>a-b);
 if(!AU.ready)auInit();LUM.liveKey=null;speed=1;playing=true;lumLook();closeSheet();sync();
 if(!LUM.a.ready)toast('Add audio/luminous.mp3 (or include it in Load audio folder) to hear the show');LUM.a.audio.play().then(()=>LUM.a.audio.pause()).catch(()=>{})} /* the tap unlocks its player */
function lumLook(){if(SV.on)setView(false);follow=null;sel=null;cam.x=cam.tx=EVPOS.lum[0];cam.y=cam.ty=EVPOS.lum[1]-50;cam.tm=Math.max(1.35,Math.min(cam.tm,2.2));cam.m=cam.tm}
function lumForceTidy(ev){if(!ev.force||!ev.force.length)return;for(const s of ev.force.slice())if(T>s+ev.dur*60+120||T<s-120){ev.force.splice(ev.force.indexOf(s),1);const i=ev.t.indexOf(s);if(i>=0&&ev.t.length>1)ev.t.splice(i,1)}}
/* soundtrack: the show's clock (unless Happily Ever After is playing too, which then keeps the time; this one just follows) */
function lumSync(){const ev=lumEv(),A=LUM.a,a=A.audio;if(!ev)return;lumForceTidy(ev);const st=lumClock(),live=ev.ph==='live';
 if(live&&LUM.liveKey!==ev.key){LUM.liveKey=ev.key;if(A.ready&&HEA.auto&&speed!==1&&!FF&&lumNear()>.15){speed=1;sync();toast('Luminous is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=live&&A.ready&&playing&&speed===1&&!FF&&st!==null&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.1*lumNear());
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}
 else if(!HEA.audio.paused){if(Math.abs(a.currentTime-st)>.6)a.currentTime=Math.max(0,st)}
 else syncTrack(LUM.a,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})}
/* On the water (map coordinates, drawn after the night tint, added as light). Each barge carries a fan of water jets:
   arcs of spray that rise and fall with the music, lit in the section's colours, with mist at their feet and their
   reflection trailing across the water. The jets follow a pattern that changes with each section of the music (a chase
   round the ring, sweeping fans, everything pulsing together, tall columns trading places), and a barge whose shell has
   just gone up kicks higher. Bursts overhead flash on the lagoon, big moments throw flame from the barges, and
   searchlights rake the sky from the shore. By day all of it is fainter. */
function lumJet(x,y,H,a,h,al,w,t,seed){if(H<1)return;const lean=H*.16*Math.sin(a),top=y-H,fx=x+lean*1.6; /* one jet: a column of spray leaning a little, its top falling away */
 const g=cx.createLinearGradient(0,y,0,top);g.addColorStop(0,hsl(h,80,72,.32*al));g.addColorStop(.8,hsl(h,75,78,.2*al));g.addColorStop(1,hsl(h,70,85,0));
 cx.strokeStyle=g;cx.lineWidth=w*3.4;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+lean*.4,y-H*.6,fx,top);cx.stroke(); /* the soft body of spray */
 const c=cx.createLinearGradient(0,y,0,top);c.addColorStop(0,hsl(h,40,95,.85*al));c.addColorStop(.7,hsl(h,50,90,.5*al));c.addColorStop(1,hsl(h,50,92,0));
 cx.strokeStyle=c;cx.lineWidth=w*.8;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+lean*.4,y-H*.6,fx,top+H*.04);cx.stroke(); /* the bright core */
 cx.fillStyle=hsl(h,50,93,.55*al);for(let k=0;k<10;k++){const u=(k*.1+t*.7+seed)%1,sp=(Math.sin(seed*5+k*2.3))*(1.5+H*.06*u); /* droplets drifting off the top and falling back */
  cx.fillRect(fx+sp+lean*u*.6-.45,top+H*.12*u+H*.55*u*u-.45,.9,.9)}}
function lumDraw(now){const st=lumClock();if(st===null||typeof CHOREO_LUM==='undefined'||st>CHOREO_LUM.end+12||SV.on)return;const B=lumBarges();if(!B.length)return;
 const s0=Math.max(0,st),e=lumEnv(s0),si=lumSec(s0),pal=CHOREO_LUM.pal[si]||[200,45],t=now/1000,fade=Math.max(0,Math.min(1,(st+4)/6,(CHOREO_LUM.end+12-st)/12)),night=Math.max(.3,nf),A=fade*night,
  mode=si%4,mid=Math.floor(B.length/2),[lx,ly]=EPCOT.c;
 cx.save();
 /* the barges themselves, with a ring of light round each deck */
 B.forEach(([x,y],i)=>{const big=i===mid;cx.fillStyle='rgba(16,20,28,.9)';cx.beginPath();cx.roundRect(x-(big?9:6),y-(big?3.5:2.6),big?18:12,big?7:5.2,2);cx.fill()});
 cx.globalCompositeOperation='lighter';
 /* colour washed across the lagoon, breathing with the music */
 {const R=210,g=cx.createRadialGradient(lx,ly,6,lx,ly,R);g.addColorStop(0,hsl(pal[0],85,55,.26*e*A));g.addColorStop(.55,hsl(pal[1],85,50,.13*e*A));g.addColorStop(1,hsl(pal[1],80,50,0));cx.fillStyle=g;cx.fillRect(lx-R,ly-R,R*2,R*2)}
 /* bursts overhead flash on the water below them */
 for(let k=LUM.fl.length-1;k>=0;k--){const f=LUM.fl[k],age=st-f.t;if(age<0)continue;if(age>2.2||age<-1){LUM.fl.splice(k,1);continue}const a=Math.exp(-age*2)*f.sz*.5*A,R=26+40*f.sz;
  const g=cx.createRadialGradient(f.x,f.y,0,f.x,f.y,R);g.addColorStop(0,hsl(f.h,90,70,a));g.addColorStop(1,hsl(f.h,90,60,0));cx.fillStyle=g;cx.fillRect(f.x-R,f.y-R,R*2,R*2)}
 /* searchlights from the shore in the big moments */
 if(e>.5)for(let k=0;k<LUM.S.length;k+=3){const[x,y]=LUM.S[k],an=Math.sin(t*.7+k*.9)*.55,L=170+60*e,wd=.06,a=(e-.5)*2*.22*A;
  const g=cx.createLinearGradient(x,y,x+Math.sin(an)*L,y-Math.cos(an)*L);g.addColorStop(0,hsl(pal[k%2],70,85,a));g.addColorStop(1,hsl(pal[k%2],70,85,0));cx.fillStyle=g;
  cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.sin(an-wd)*L,y-Math.cos(an-wd)*L);cx.lineTo(x+Math.sin(an+wd)*L,y-Math.cos(an+wd)*L);cx.closePath();cx.fill()}
 /* each barge: light on the water, its reflection, the jets and the mist */
 cx.lineCap='round';
 B.forEach(([x,y],i)=>{const big=i===mid,h=pal[(i+si)%2]+Math.sin(t*.4+i)*12,hit=Math.exp(-Math.max(0,st-LUM.hit[i])*2.5);
  let k=1;if(mode===0)k=.35+.65*Math.max(0,Math.sin(t*3-i*.75));else if(mode===2)k=.45+.55*(.5+.5*Math.sin(t*5.2))*e+.2;else if(mode===3)k=(Math.floor(t*1.6)+i)%2?1:.35;
  const H=((big?22:12)+(big?62:42)*e*k+28*hit)*fade;
  const wg=cx.createRadialGradient(x,y,0,x,y,22+H*.4);wg.addColorStop(0,hsl(h,90,65,.5*A));wg.addColorStop(1,hsl(h,90,60,0));cx.fillStyle=wg;cx.fillRect(x-60,y-60,120,120); /* light on the water */
  {const rl=H*.55,rg=cx.createLinearGradient(0,y,0,y+rl);rg.addColorStop(0,hsl(h,80,72,.2*A));rg.addColorStop(1,hsl(h,80,70,0));cx.fillStyle=rg;cx.beginPath();for(let q=0;q<=8;q++){const yy=y+1+rl*q/8,ww=(2.4+Math.sin(t*2.6+q*1.9+i)*1.2)*(1+q*.08);q?cx.lineTo(x+ww,yy):cx.moveTo(x+ww,yy)}for(let q=8;q>=0;q--){const yy=y+1+rl*q/8,ww=(2.4+Math.sin(t*2.2+q*1.3+i*2)*1.2)*(1+q*.08);cx.lineTo(x-ww,yy)}cx.closePath();cx.fill()} /* reflection, wavering on the ripples */
  const fan=mode===1?[-.6,0,.6].map(v=>v+Math.sin(t*1.4+i*.5)*.7):big?[-.9,-.45,0,.45,.9]:[-.6,0,.6];
  for(const a0 of fan){const a=mode===1?a0:a0+Math.sin(t*.9+i)*.12;lumJet(x,y,H*(1-Math.abs(a)*.22),a,h,A,big?2.4:1.8,t,i*7.3+a*3)}
  const mg=cx.createRadialGradient(x,y-H*.2,0,x,y-H*.2,14+H*.35);mg.addColorStop(0,hsl(h,40,90,.22*A*Math.min(1,H/30)));mg.addColorStop(1,hsl(h,40,90,0));cx.fillStyle=mg;cx.fillRect(x-60,y-H*.2-60,120,120); /* mist */
  cx.fillStyle=hsl((t*40+i*30)%360,90,70,.8*A);for(let q=0;q<8;q++){const an=q/8*6.283+t;cx.fillRect(x+Math.cos(an)*(big?8:5.5)-.5,y+Math.sin(an)*(big?3.2:2.4)-.5,1,1)}}); /* deck lights */
 /* flame from the barges on the biggest beats */
 for(let k=LUM.fire.length-1;k>=0;k--){const f=LUM.fire[k],age=st-f.t;if(age>.9||age<-1){LUM.fire.splice(k,1);continue}if(age<0)continue;const[x,y]=B[f.i],u=age/.9,H=(30+25*f.sz)*Math.sin(Math.PI*Math.min(1,u*1.6))*(1-u*.4),a=(1-u)*A;
  const g=cx.createLinearGradient(0,y,0,y-H);g.addColorStop(0,`rgba(255,240,180,${a})`);g.addColorStop(.35,`rgba(255,160,40,${.85*a})`);g.addColorStop(1,'rgba(200,40,10,0)');cx.fillStyle=g;
  cx.beginPath();cx.moveTo(x-3.5,y);cx.quadraticCurveTo(x-6,y-H*.5,x+Math.sin(t*20)*1.5,y-H);cx.quadraticCurveTo(x+6,y-H*.5,x+3.5,y);cx.fill();
  const og=cx.createRadialGradient(x,y-H*.3,0,x,y-H*.3,40);og.addColorStop(0,`rgba(255,150,50,${.35*a})`);og.addColorStop(1,'rgba(255,120,30,0)');cx.fillStyle=og;cx.fillRect(x-40,y-H*.3-40,80,80)}
 cx.restore()}
/* fireworks: launch the cues that are due, from the barges (screen space; the sparks are then handled by heaFrame) */
function lumShell(q){const[,kind,c0,alt,,sz]=q,B=lumBarges(),low=kind==='mine'||kind==='comet',shore=!low&&(Math.round(c0*100)+Math.round(alt*10))%2===0, /* about half the aerial shells go up from round the shore */
  L=shore?LUM.S:B,i=Math.max(0,Math.min(L.length-1,Math.round((c0+1)/2*(L.length-1)))),[bx,by]=L[i],z=zf(),
  my=kind==='mine'?by:kind==='comet'?by-(16+alt*55):by-(48+alt*125);const b=toS(bx+(Math.random()-.5)*4,by),e=toS(bx+(Math.random()-.5)*16,my);return{b,e,k:z*1.45,m:b[1]-20*z,x:bx,y:by,bi:shore?-1:i}}
function lumLaunch(q){const[t,kind,,alt,h,sz]=q,P=lumShell(q),rise=kind==='comet'||kind==='mine'?.9+alt*.8:1.3+alt*1.3;
 if(P.bi>=0)LUM.hit[P.bi]=t-rise;if(kind!=='comet')LUM.fl.push({x:P.x,y:P.y,h,sz,t:kind==='mine'?t-rise:t}); /* the barge kicks up its jets as it fires; the burst will flash on the water */
 if(sz>1.2&&P.bi>=0&&LUM.fire.length<6)LUM.fire.push({i:P.bi,t:t-rise,sz});
 if(kind==='mine'){burst({kind,h,sz,k:P.k},P.b[0],P.m);return}
 HEA.rk.push({kind,h,sz,k:P.k,x0:P.b[0],y0:P.b[1],x1:P.e[0],y1:P.e[1],rise,t:0})}
function lumTick(){const st=lumClock();if(st===null||typeof CHOREO_LUM==='undefined'||SV.on||!lumBarges().length){LUM.lastSt=-9;return}const C=CHOREO_LUM.cues;
 if(st>CHOREO_LUM.end+5){LUM.lastSt=st;return}
 if(st<LUM.lastSt-.5||st>LUM.lastSt+6){LUM.ci=0;while(LUM.ci<C.length&&cueLaunch(C[LUM.ci])<st)LUM.ci++}
 let n=0;while(LUM.ci<C.length&&cueLaunch(C[LUM.ci])<=st){const q=C[LUM.ci++];if(speed<=5||q[5]>1||n<3){lumLaunch(q);n++;if(q[5]>.9&&q[1]!=='mine'&&Math.abs(q[2])>.15&&speed<=5)lumLaunch([q[0],q[1],-q[2],q[3],q[4]+(q[0]*7|0)%30,q[5]])}} /* bigger shells go up in mirrored pairs across the lagoon */
 LUM.lastSt=st}
