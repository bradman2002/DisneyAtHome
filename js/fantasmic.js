/* ===== FANTASMIC! — Hollywood Studios' nighttime show in the Hollywood Hills Amphitheater =====
   The amphitheater's seats face a round lagoon with an island stage (its mountain) in the middle, all from the map data.
   The show runs about 29 minutes, at today's real show times when live (8:00 and 9:30 PM most nights), otherwise an
   hour before the park closes. It is a fixed running order of scenes, not cues from music: Sorcerer Mickey on the
   mountain, the mist screens lit with each scene's colours, dancing fountains, the villains' green fire, the dragon
   setting the lagoon alight, the Steamboat Willie riverboat circling the island with the characters aboard, and a
   fireworks finale from the mountain (through the shared fireworks engine, heaFrame in street.js).
   The owner's own soundtrack, audio/fantasmic.mp3 (never committed; or the copy kept by Load audio folder), plays in
   time with it when it is there, heard when the map is looking at the amphitheater, and the show lasts as long as it.
   Hollywood Studios' guests fill the seats beforehand (spot0 'fmic' in sim.js). */
const FM={file:'audio/fantasmic.mp3',a:{audio:new Audio(),ready:false,src:'folder',name:'audio/fantasmic.mp3'},G:null,ci:0,lastSt:-9,cues:null,liveKey:null};
{const A=FM.a,a=A.audio,ev=()=>EV.find(e=>e.id==='fmic');a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,e=ev();if(d&&isFinite(d)&&e&&!e.userDur)e.dur=d/60});
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('fantasmic');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 if(OSM.hs)setTimeout(()=>loadTrack(a,FM.file),0)}
const fmEv=()=>EV.find(e=>e.id==='fmic');
function fmClock(){const ev=fmEv();if(!ev||ev.key==null||(ev.ph!=='live'&&ev.ph!=='done'))return null;return T-ev.key}
const fmLive=()=>{const ev=fmEv();return!!ev&&ev.ph==='live'};
const fmPlaying=()=>!FM.a.audio.paused;
const fmLen=()=>{const ev=fmEv();return(ev?ev.dur:29)*60};
/* the show's places, from the map: the lagoon round the island, the island and its mountain (the stage building), the
   seats (the side of the lagoon away from the island, toward the amphitheater), the mist screens in front of the island */
function fmGeo(){if(FM.G!==null)return FM.G;FM.G=false;const st=OSM.buildings.find(q=>q.n==='Fantasmic'&&q.p.length>2);if(!st)return false;
 const sb=bbox(st.p),sc=[(sb[0]+sb[2])/2,(sb[1]+sb[3])/2],lag=OSM.areas.filter(a=>a.k==='water'&&ptIn(sc[0],sc[1],a.o)).sort((p,q)=>bbox(p.o)[2]-bbox(p.o)[0]-(bbox(q.o)[2]-bbox(q.o)[0]))[0];if(!lag)return false;
 const lb=bbox(lag.o),lc=[(lb[0]+lb[2])/2,(lb[1]+lb[3])/2],isl=(lag.i||[]).find(h=>ptIn(sc[0],sc[1],h))||[[sb[0]-6,sb[1]],[sb[2]+6,sb[1]],[sb[2]+6,sb[3]],[sb[0]-6,sb[3]]],ib=bbox(isl);
 /* the audience: the seating's aisles fan out from the lagoon, so the walkways just outside its shore lie on the seats' side */
 const R0=Math.max(lb[2]-lb[0],lb[3]-lb[1])/2;let ax=0,ay=0,n=0;for(const p of OSM.paths){if(p.a)continue;for(const q of p.p){const d=Math.hypot(q[0]-lc[0],q[1]-lc[1]);if(d<R0+3||d>R0+60)continue;ax+=q[0];ay+=q[1];n++}}
 let u=n?[ax/n-lc[0],ay/n-lc[1]]:[-1,0];const ul=Math.hypot(...u)||1;u=[u[0]/ul,u[1]/ul];const v=[-u[1],u[0]];
 const reach=Math.max(lb[2]-lb[0],lb[3]-lb[1])/2,front=[sc[0]+u[0]*((ib[2]-ib[0])/2+6),sc[1]+u[1]*((ib[3]-ib[1])/2+6)];
 const screens=[[front[0]+u[0]*5,front[1]+u[1]*5+8]]; /* one wide mist screen between the island and the seats (drawn facing the map's viewer) */
 const jets=[];for(let i=0;i<14;i++){const t=(i/13-.5)*1.7,r=reach*.72;jets.push([lc[0]+u[0]*r*Math.cos(t)+v[0]*r*Math.sin(t),lc[1]+u[1]*r*Math.cos(t)+v[1]*r*Math.sin(t)])}
 const seats=[];for(let i=0;i<N.length;i++){const[x,y]=N[i],d=Math.hypot(x-lc[0],y-lc[1]);if(d>reach+4&&d<reach+90&&((x-lc[0])*u[0]+(y-lc[1])*u[1])>d*.15)seats.push(i)}
 /* the seats: rows between the lagoon's shore and the amphitheater's back walkway, in the half facing the island */
 const shore=a=>{let r=4;while(r<120&&ptIn(lc[0]+Math.cos(a)*r,lc[1]+Math.sin(a)*r,lag.o))r+=1.5;return r};
 FM.G={shore,sc,sb,lag,lc,isl,ib,u,v,reach,front,screens,jets,seats,peak:[sc[0],sc[1]-(st.h||18)*OSM.S*.78],hh:(st.h||18)*OSM.S*.78};return FM.G}
if(OSM.hs){const g=fmGeo();if(g)EVPOS.fmic=g.lc}
// how much the map is looking at the amphitheater
function fmNear(){const G=fmGeo();if(SV.on||!G)return 0;return Math.max(0,Math.min(1,prox(G.lc[0],G.lc[1],320)*1.7-.08))}
/* the running order, as fractions of the show: [start, name, two hues] */
const FM_HUES={pre:[230,250],intro:[265,215],imagine:[300,45],adventure:[195,150],villains:[120,285],dragon:[25,10],mickey:[210,55],finale:[45,0],end:[55,210]};
/* with the owner's soundtrack (CHOREO_FM, in choreo-fantasmic.js, made from it): the scenes start where the music changes,
   the fountains and lights follow its loudness and beats, and the finale's fireworks go up on its beats. The first 85 s
   is the pre-show announcement, with the lagoon dark. Without it (or with a different recording), the running order below
   is spread over the show's length. */
const fmCh=()=>typeof CHOREO_FM!=='undefined'&&Math.abs(fmLen()-CHOREO_FM.len)<20?CHOREO_FM:null;
function fmAt(st){const C=fmCh();if(C){let k='pre';for(const[t,n]of C.scenes)if(st>=t)k=n;return[k,FM_HUES[k]]}const[,k,h]=fmScene(Math.max(0,st)/fmLen());return[k,h]}
function fmEnv(st){const C=fmCh();if(!C)return .7;return C.env[Math.max(0,Math.min(C.env.length-1,Math.floor(st*2)))]}
function fmBeat(st){const C=fmCh();if(!C)return 0;const B=C.beats;let lo=0,hi=B.length-1;if(hi<0||B[0]>st)return 0;while(lo<hi){const m=(lo+hi+1)>>1;if(B[m]<=st)lo=m;else hi=m-1}return Math.max(0,1-(st-B[lo])/.45)} /* 1 on a beat, fading over half a second */
const FM_SCENES=[[0,'intro',[265,215]],[.05,'imagine',[300,45]],[.25,'adventure',[195,150]],[.42,'villains',[120,285]],[.6,'dragon',[25,10]],[.72,'mickey',[210,55]],[.8,'finale',[45,0]],[.97,'end',[55,210]]];
const fmScene=f=>{let s=FM_SCENES[0];for(const q of FM_SCENES)if(f>=q[0])s=q;return s};
function fmStart(){const ev=fmEv();if(!ev)return;if(ev.ph==='live'){fmLook();closeSheet();return}ev.on=true;const s=Math.ceil(T)+3;(ev.force||(ev.force=[])).push(s);ev.t=[...new Set([...ev.t,s])].sort((a,b)=>a-b);
 if(!AU.ready)auInit();FM.liveKey=null;speed=1;playing=true;fmLook();closeSheet();sync();
 if(!FM.a.ready)toast('Add audio/fantasmic.mp3 (or include it in Load audio folder) to hear the show');FM.a.audio.play().then(()=>FM.a.audio.pause()).catch(()=>{})}
function fmLook(){const G=fmGeo();if(!G)return;if(SV.on)setView(false);follow=null;sel=null;cam.x=cam.tx=G.lc[0];cam.y=cam.ty=G.lc[1]-25;cam.tm=Math.max(2.4,Math.min(cam.tm,3.4));cam.m=cam.tm}
function fmForceTidy(ev){if(!ev.force||!ev.force.length)return;for(const s of ev.force.slice())if(T>s+ev.dur*60+120||T<s-120){ev.force.splice(ev.force.indexOf(s),1);const i=ev.t.indexOf(s);if(i>=0&&ev.t.length>1)ev.t.splice(i,1)}}
/* the soundtrack follows the show's clock (nothing else keeps time at the Studios) */
function fmSync(){const ev=fmEv(),A=FM.a,a=A.audio;if(!ev)return;fmForceTidy(ev);const st=fmClock(),live=ev.ph==='live';
 if(live&&FM.liveKey!==ev.key){FM.liveKey=ev.key;if(A.ready&&HEA.auto&&speed!==1&&!FF&&fmNear()>.15){speed=1;sync();toast('Fantasmic! is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=live&&A.ready&&playing&&speed===1&&!FF&&st!==null&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.1*fmNear());
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}
 else if(Math.abs(a.currentTime-st)>.6)a.currentTime=Math.max(0,st)}
/* the finale's fireworks, made once: a steady rise to a big last minute, from the mountain and along the island */
function fmCues(){if(FM.cues)return FM.cues;const C=fmCh();if(C){FM.cues=C.cues;return FM.cues}const L=fmLen(),r=seeded(1955),K=['peony','chrys','willow','ring','crossette','strobe','comet','mine'],out=[];
 for(let t=L*.8;t<L*.985;){const f=(t-L*.8)/(L*.185),gap=1.6-1.25*f;const k=K[r()*K.length|0];out.push([t,k,(r()-.5)*2,.25+r()*.7,[45,0,210,300,120][r()*5|0]+r()*20,.7+r()*.6+f*.4]);if(f>.85&&r()<.5)out.push([t+.1,'peony',(r()-.5)*2,.5+r()*.5,45,1.3]);t+=gap*(.5+r())}
 FM.cues=out;return out}
function fmLaunch(q){const G=fmGeo(),[t,kind,c0,alt,h,sz]=q,z=zf(),bx=G.sc[0]+G.v[0]*c0*26,by=G.sc[1]+G.v[1]*c0*26-(kind==='mine'?G.hh:0),b=toS(bx,by-G.hh*.4),my=kind==='mine'?by:kind==='comet'?by-(14+alt*40):by-(40+alt*95),e=toS(bx+(Math.random()-.5)*12,my),rise=kind==='comet'||kind==='mine'?.9+alt*.8:1.3+alt*1.3;
 if(kind==='mine'){burst({kind,h,sz,k:z*1.25},b[0],b[1]-18*z);return}
 HEA.rk.push({kind,h,sz,k:z*1.25,x0:b[0],y0:b[1],x1:e[0],y1:e[1],rise,t:0})}
function fmTick(){const st=fmClock(),G=fmGeo();if(st===null||!G||SV.on||st>fmLen()+5){FM.lastSt=-9;return}const C=fmCues();
 if(st<FM.lastSt-.5||st>FM.lastSt+6){FM.ci=0;while(FM.ci<C.length&&cueLaunch(C[FM.ci])<st)FM.ci++}
 let n=0;while(FM.ci<C.length&&cueLaunch(C[FM.ci])<=st){const q=C[FM.ci++];if(speed<=5||n<3){fmLaunch(q);n++}}FM.lastSt=st}
/* drawing (map units, over the night tint) */
function fmMist(x,y,w,h,h1,h2,t,al,kind){const g=cx.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,hsl(h1,85,60,0));g.addColorStop(.2,hsl(h1,85,62,.5*al));g.addColorStop(.5,hsl((h1+h2)/2,80,70,.6*al));g.addColorStop(.8,hsl(h2,85,62,.5*al));g.addColorStop(1,hsl(h2,85,60,0));
 cx.fillStyle=g;cx.beginPath();cx.moveTo(x-w,y);for(let i=0;i<=12;i++){const k=i/12;cx.lineTo(x-w+2*w*k,y-h-Math.sin(k*7+t*1.7)*h*.08-Math.sin(k*3.1)*h*.15)}cx.lineTo(x+w,y);cx.closePath();cx.fill();
 /* what is projected on it: stars and swirls, waves, green flames, a fire glow, or bursts of sparkle */
 cx.save();cx.globalAlpha=al;const S=seeded((x*7|0)+(kind.length*13));
 if(kind==='imagine'||kind==='intro'||kind==='end'){for(let i=0;i<14;i++){const a=t*.6+i*.45,r=h*.12+i*h*.025;cx.fillStyle=hsl((h1+i*25)%360,90,80,.7);cx.beginPath();cx.arc(x+Math.cos(a)*r*1.4,y-h*.5+Math.sin(a)*r*.8,.6+S()*.9,0,7);cx.fill()}}
 else if(kind==='adventure'){cx.strokeStyle=hsl(h1,80,82,.6);cx.lineWidth=.6;for(let j=0;j<3;j++){cx.beginPath();for(let i=0;i<=16;i++){const k=i/16;cx.lineTo(x-w*.8+1.6*w*k,y-h*(.3+j*.18)+Math.sin(k*9+t*2+j)*1.4)}cx.stroke()}}
 else if(kind==='villains'||kind==='dragon'){for(let i=0;i<9;i++){const fx=x-w*.7+i*w*.175,fh=h*(.25+.3*Math.abs(Math.sin(t*3+i*1.3)));const fg=cx.createLinearGradient(0,y-h*.15,0,y-h*.15-fh);fg.addColorStop(0,hsl(h1,95,60,.8));fg.addColorStop(1,hsl(h2,95,70,0));cx.fillStyle=fg;cx.beginPath();cx.moveTo(fx-1.6,y-h*.15);cx.quadraticCurveTo(fx,y-h*.15-fh*1.2,fx+1.6,y-h*.15);cx.fill()}}
 else{for(let i=0;i<10;i++){const a=i*.63+t,r=(t*9+i*3)%(h*.45);cx.fillStyle=hsl(h1,90,85,.8*(1-r/(h*.45)));cx.beginPath();cx.arc(x+Math.cos(a)*r,y-h*.5+Math.sin(a)*r*.7,.7,0,7);cx.fill()}}
 cx.restore()}
function fmFire(x,y,s,t,seed){const f=.6+.4*Math.sin(t*9+seed);const g=cx.createLinearGradient(0,y,0,y-s*2.4*f);g.addColorStop(0,'rgba(255,200,90,.95)');g.addColorStop(.5,'rgba(255,110,30,.7)');g.addColorStop(1,'rgba(255,60,10,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(x-s*.5,y);cx.quadraticCurveTo(x-s*.3,y-s*1.4*f,x+Math.sin(t*5+seed)*s*.3,y-s*2.4*f);cx.quadraticCurveTo(x+s*.3,y-s*1.4*f,x+s*.5,y);cx.fill()}
/* the dragon on the mountain: dark wings and neck against the fire, glowing green eye, breathing flame toward the seats */
function fmDragon(G,t,al,breath){const[x,y]=G.peak,k=1.9;cx.save();cx.globalAlpha=al;cx.fillStyle='#1d1626';
 cx.beginPath();cx.moveTo(x-k*9,y+k*4);cx.lineTo(x-k*4,y-k*7);cx.lineTo(x-k*2,y+k*1);cx.lineTo(x+k*2,y-k*8);cx.lineTo(x+k*5,y+k*3);cx.closePath();cx.fill(); /* wings */
 cx.lineWidth=k*1.6;cx.strokeStyle='#241a30';cx.lineCap='round';const hx=x+G.u[0]*k*6,hy=y-k*6;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+G.u[0]*k*1,y-k*8,hx,hy);cx.stroke();
 cx.fillStyle='#2a1f38';cx.beginPath();cx.ellipse(hx,hy,k*2,k*1.1,0,0,7);cx.fill();cx.fillStyle='#7dff5a';cx.beginPath();cx.arc(hx-k*.4,hy-k*.3,k*.35,0,7);cx.fill();
 cx.globalCompositeOperation='lighter';if(breath>0){const ex=hx+G.u[0]*G.reach*.6,ey=hy+k*10;const g=cx.createLinearGradient(hx,hy,ex,ey);g.addColorStop(0,'rgba(255,230,140,.95)');g.addColorStop(.4,'rgba(255,120,30,.8)');g.addColorStop(1,'rgba(255,60,10,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(hx,hy);cx.lineTo(ex-G.v[0]*8*breath,ey-G.v[1]*8*breath-6*breath);cx.lineTo(ex+G.v[0]*8*breath,ey+G.v[1]*8*breath+4);cx.closePath();cx.fill()}
 cx.restore()}
/* Steamboat Willie's riverboat: white hull, two red stacks, strings of lights, the characters waving from the deck */
function fmBoat(G,a,t,al){const ib=G.ib,rx=(ib[2]-ib[0])/2+11,ry=(ib[3]-ib[1])/2+10,cx0=(ib[0]+ib[2])/2,cy0=(ib[1]+ib[3])/2,x=cx0+Math.cos(a)*rx,y=cy0+Math.sin(a)*ry,L=13;cx.save();cx.globalAlpha=al;
 cx.fillStyle='rgba(255,220,160,.25)';cx.beginPath();cx.ellipse(x,y+1,L*.8,2.5,0,0,7);cx.fill();
 cx.fillStyle='#f4f0e6';cx.beginPath();cx.moveTo(x-L*.6,y-1);cx.lineTo(x+L*.6,y-1);cx.lineTo(x+L*.45,y+1.5);cx.lineTo(x-L*.5,y+1.5);cx.closePath();cx.fill();
 cx.fillStyle='#e9e2d0';cx.fillRect(x-L*.4,y-4.5,L*.75,3.5);cx.fillStyle='#c0302a';cx.fillRect(x-L*.15,y-9,1.3,4.6);cx.fillRect(x+L*.05,y-9,1.3,4.6);
 cx.fillStyle='#ffe9a0';for(let i=0;i<9;i++)cx.fillRect(x-L*.55+i*L*.14,y-1.6,.5,.5);
 if(typeof drawChar==='function'){const s=OSM.S*2.2;cx.save();for(const[w,dx]of[['mickey',-3],['minnie',-1],['donald',1.2],['goofy',3.4]])drawChar(cx,s,(x+dx)/s,(y-4.5)/s,w,t);cx.restore()}
 cx.restore()}
function fmDraw(now){const st=fmClock(),G=fmGeo();if(st===null||!G||SV.on)return;const L=fmLen();if(st>L+10)return;const f=Math.max(0,st)/L,[kind,[h1,h2]]=fmAt(st),t=now/1000,env=fmEnv(st),beat=fmBeat(st),pre=kind==='pre',on=Math.min(1,st/6,(L+8-st)/8)*(pre?.25:1),A=on*Math.max(.35,nf)*(fmCh()?.55+.6*env:1);
 if(A<=0)return;if(pre){cx.save();cx.globalCompositeOperation='lighter';const g=cx.createRadialGradient(G.sc[0],G.sc[1],1,G.sc[0],G.sc[1],G.reach*.8);g.addColorStop(0,'rgba(120,130,255,.25)');g.addColorStop(1,'rgba(120,130,255,0)');cx.fillStyle=g;cx.beginPath();cx.arc(G.sc[0],G.sc[1],G.reach*.8,0,7);cx.fill();cx.restore();return} /* the announcement: just a glow on the island */
 cx.save();cx.globalCompositeOperation='lighter';
 /* the lagoon lit in the scene's colours, and searchlights up from the island */
 {const g=cx.createRadialGradient(G.lc[0],G.lc[1],2,G.lc[0],G.lc[1],G.reach);g.addColorStop(0,hsl(h1,80,55,.35*A));g.addColorStop(1,hsl(h2,80,50,0));cx.fillStyle=g;cx.beginPath();cx.arc(G.lc[0],G.lc[1],G.reach,0,7);cx.fill()}
 for(let i=0;i<4;i++){const a=-Math.PI/2+Math.sin(t*.5+i*1.7)*.6,x0=G.sc[0]+(i-1.5)*6,y0=G.sc[1],len=G.reach*2.4,g=cx.createLinearGradient(x0,y0,x0+Math.cos(a)*len,y0+Math.sin(a)*len);g.addColorStop(0,hsl(i%2?h1:h2,60,85,.35*A));g.addColorStop(1,hsl(h1,60,85,0));cx.fillStyle=g;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(x0+Math.cos(a-.05)*len,y0+Math.sin(a-.05)*len);cx.lineTo(x0+Math.cos(a+.05)*len,y0+Math.sin(a+.05)*len);cx.closePath();cx.fill()}
 /* fountains along the front of the lagoon */
 for(let i=0;i<G.jets.length;i++){const[x,y]=G.jets[i],mode=Math.floor(st/20)%3,amp=mode===0?.5+.5*Math.sin(t*2.2+i*.6):mode===1?(Math.floor(t*2+i)%2?1:.35):.4+.6*Math.abs(Math.sin(t*1.3+i*.25)),H=(kind==='finale'||kind==='end'?26:16)*(fmCh()?Math.max(.25,Math.min(1.25,amp*.5+env*.6+beat*.35)):amp)*on;lumJet(x,y,H,Math.sin(t+i)*.6,i%2?h1:h2,A,1.1,t,i)}
 /* the mist screens, lit by the projectors */
 if(kind!=='end'||f<.99)for(let i=0;i<G.screens.length;i++){const[x,y]=G.screens[i];fmMist(x,y,15,28,h1,h2,t+i,A*.85*(kind==='finale'?.6:1),kind)}
 /* the lagoon on fire: flames across the front, after the dragon's breath */
 if(kind==='dragon'){const C=fmCh(),d0=C?1101:L*.6,d1=C?1241:L*.72,k=Math.max(0,Math.min(1,(st-d0)/40,(d1-st)/10));for(let i=0;i<26;i++){const a=(i/25-.5)*2.2,r=G.reach*(.45+.35*((i*7)%5)/5),x=G.lc[0]+G.u[0]*r*Math.cos(a)+G.v[0]*r*Math.sin(a),y=G.lc[1]+G.u[1]*r*Math.cos(a)+G.v[1]*r*Math.sin(a);fmFire(x,y,(3.8+((i*13)%7)*.6)*k,t,i)}}
 cx.restore();
 /* figures on the island: the dragon, Sorcerer Mickey on the peak, the riverboat in the finale */
 if(kind==='dragon')fmDragon(G,t,on,Math.max(0,Math.sin(t*1.4)));
 if((kind==='intro'||kind==='mickey'||kind==='end')&&typeof drawChar==='function'){const s=OSM.S*3,[px,py]=G.peak;cx.save();cx.globalAlpha=on;
  const g=cx.createRadialGradient(px,py-3,1,px,py-3,12);g.addColorStop(0,'rgba(255,255,230,.6)');g.addColorStop(1,'rgba(255,255,230,0)');cx.fillStyle=g;cx.beginPath();cx.arc(px,py-3,12,0,7);cx.fill();
  drawChar(cx,s,px/s,py/s,'mickey',t);cx.fillStyle='#2f4fb8';cx.beginPath();cx.moveTo(px-2.4,py-6.4);cx.lineTo(px+.4,py-12.5);cx.lineTo(px+2.2,py-6.4);cx.closePath();cx.fill();cx.fillStyle='#f6e8a8';cx.beginPath();cx.arc(px-.4,py-8.4,.45,0,7);cx.arc(px+.9,py-10.2,.35,0,7);cx.fill();cx.restore()}
 if(kind==='finale'){const C=fmCh(),t0=C?C.scenes.find(q=>q[1]==='finale')[0]:L*.8,a=(st-t0)/40*Math.PI*2;fmBoat(G,a,t,on)}}
