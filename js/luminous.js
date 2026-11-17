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
/* the barges: a ring out on the lagoon (part way from the middle to each shore) plus one in the middle */
function lumBarges(){if(LUM.B)return LUM.B;LUM.B=[];if(typeof EPCOT==='undefined'||!EPCOT)return LUM.B;const[cx0,cy0]=EPCOT.c,w=OSM.areas.filter(a=>a.k==='water'&&ptIn(cx0,cy0,a.o)).sort((p,q)=>q.o.length-p.o.length)[0];if(!w)return LUM.B;
 const n=12;for(let i=0;i<n;i++){const an=i/n*6.283+.26;let r=10;while(r<400&&ptIn(cx0+Math.cos(an)*r,cy0+Math.sin(an)*r,w.o))r+=4;LUM.B.push([cx0+Math.cos(an)*r*.62,cy0+Math.sin(an)*r*.62])}
 LUM.B.sort((p,q)=>p[0]-q[0]);LUM.B.splice(Math.floor(n/2),0,[cx0,cy0]);return LUM.B} /* left to right, so a cue's x (-1..1) picks a barge across the lagoon */
const lumEnv=st=>CHOREO_LUM.env[Math.max(0,Math.min(CHOREO_LUM.env.length-1,Math.floor(st*2)))]||0;
function lumSec(st){const S=CHOREO_LUM.sec;let i=0;while(i<S.length-2&&st>=S[i+1])i++;return i}
/* soundtrack: the show's clock (unless Happily Ever After is playing too, which then keeps the time; this one just follows) */
function lumSync(){const ev=lumEv(),A=LUM.a,a=A.audio;if(!ev)return;const st=lumClock(),live=ev.ph==='live';
 if(live&&LUM.liveKey!==ev.key){LUM.liveKey=ev.key;if(A.ready&&HEA.auto&&speed!==1&&!FF&&lumNear()>.15){speed=1;sync();toast('Luminous is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=live&&A.ready&&playing&&speed===1&&!FF&&st!==null&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.1*lumNear());
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}
 else if(!HEA.audio.paused){if(Math.abs(a.currentTime-st)>.6)a.currentTime=Math.max(0,st)}
 else syncTrack(LUM.a,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})}
/* on the water (map coordinates, after the night tint): the barges, their fountains and the light they throw */
function lumDraw(now){const st=lumClock();if(st===null||typeof CHOREO_LUM==='undefined'||st>CHOREO_LUM.end+12||SV.on)return;const B=lumBarges();if(!B.length)return;
 const e=lumEnv(Math.max(0,st)),pal=CHOREO_LUM.pal[lumSec(Math.max(0,st))]||[200,45],t=now/1000,fade=Math.max(0,Math.min(1,(st+4)/6,(CHOREO_LUM.end+12-st)/12)),night=Math.max(.35,nf);
 cx.save();
 for(const[x,y]of B){cx.fillStyle='rgba(20,24,32,.85)';cx.beginPath();cx.roundRect(x-5,y-2.2,10,4.4,1.5);cx.fill()} /* the barges */
 cx.globalCompositeOperation='lighter';
 {const[lx,ly]=EPCOT.c,R=190,g=cx.createRadialGradient(lx,ly,8,lx,ly,R);g.addColorStop(0,hsl(pal[0],80,55,.2*e*fade*night));g.addColorStop(.6,hsl(pal[1],80,50,.1*e*fade*night));g.addColorStop(1,hsl(pal[1],80,50,0));cx.fillStyle=g;cx.fillRect(lx-R,ly-R,R*2,R*2)} /* colour on the lagoon */
 B.forEach(([x,y],i)=>{const h=pal[i%2],mid=i===Math.floor(B.length/2),pulse=.5+.5*Math.sin(t*2.1+i*1.7+st*.6),H=(mid?18:10)+(mid?48:34)*e*(.5+.5*pulse);
  const wg=cx.createRadialGradient(x,y,0,x,y,18);wg.addColorStop(0,hsl(h,90,62,.55*fade*night));wg.addColorStop(1,hsl(h,90,60,0));cx.fillStyle=wg;cx.fillRect(x-18,y-18,36,36); /* its light on the water */
  for(const k of mid?[-3,0,3]:[0]){const hh=H*fade*(k?.75:1),fg=cx.createLinearGradient(0,y,0,y-hh);fg.addColorStop(0,hsl(h,70,78,.9*night));fg.addColorStop(.7,hsl(h,70,82,.35*night));fg.addColorStop(1,hsl(h,70,85,0));cx.fillStyle=fg;
   cx.beginPath();cx.moveTo(x+k-3.2,y);cx.quadraticCurveTo(x+k-1.6,y-hh*.6,x+k+Math.sin(t*1.3+i)*.8,y-hh);cx.quadraticCurveTo(x+k+1.6,y-hh*.6,x+k+3.2,y);cx.fill()}}); /* the fountains */
 if(e>.55&&fade>.5){const[lx,ly]=B[Math.floor(B.length/2)];cx.lineCap='round';for(let k=0;k<6;k++){const an=t*.5+k*1.047,L=150*e;cx.strokeStyle=hsl(pal[k%2],90,65,.18*(e-.5)*2*night);cx.lineWidth=1.6;cx.beginPath();cx.moveTo(lx,ly-20);cx.lineTo(lx+Math.cos(an)*L,ly-20+Math.sin(an)*L*.55);cx.stroke()}} /* light beams sweeping out from the middle in the big moments */
 cx.restore()}
/* fireworks: launch the cues that are due, from the barges (screen space; the sparks are then handled by heaFrame) */
function lumShell(q){const[,kind,c0,alt]=q,B=lumBarges(),i=Math.max(0,Math.min(B.length-1,Math.round((c0+1)/2*(B.length-1)))),[bx,by]=B[i],z=zf(),
  my=kind==='mine'?by:kind==='comet'?by-(14+alt*50):by-(40+alt*110);const b=toS(bx+(Math.random()-.5)*4,by),e=toS(bx+(Math.random()-.5)*14,my);return{b,e,k:z*1.45,m:b[1]-20*z}}
function lumLaunch(q){const[,kind,,alt,h,sz]=q,P=lumShell(q),rise=kind==='comet'||kind==='mine'?.9+alt*.8:1.3+alt*1.3;
 if(kind==='mine'){burst({kind,h,sz,k:P.k},P.b[0],P.m);return}
 HEA.rk.push({kind,h,sz,k:P.k,x0:P.b[0],y0:P.b[1],x1:P.e[0],y1:P.e[1],rise,t:0})}
function lumTick(){const st=lumClock();if(st===null||typeof CHOREO_LUM==='undefined'||SV.on||!lumBarges().length){LUM.lastSt=-9;return}const C=CHOREO_LUM.cues;
 if(st>CHOREO_LUM.end+5){LUM.lastSt=st;return}
 if(st<LUM.lastSt-.5||st>LUM.lastSt+6){LUM.ci=0;while(LUM.ci<C.length&&cueLaunch(C[LUM.ci])<st)LUM.ci++}
 let n=0;while(LUM.ci<C.length&&cueLaunch(C[LUM.ci])<=st){const q=C[LUM.ci++];if(speed<=5||q[5]>1||n<3){lumLaunch(q);n++}}
 LUM.lastSt=st}
