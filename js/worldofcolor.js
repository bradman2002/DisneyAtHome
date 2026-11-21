/* ===== WORLD OF COLOR — Disney California Adventure's nighttime show on Paradise Bay (Disneyland Resort only) =====
   The fountain platform rises out of the bay just off Paradise Gardens Park, where the audience stands along the shore.
   Rows of fountains dance in each scene's colours, a wide wall of mist behind them carries the projected pictures, flame
   bursts from the front row at the big moments, searchlights and lasers sweep over the bay, and the Pixar Pal-A-Round
   across the water lights up with it. On holiday-season nights it is the Season of Light version, in winter colours.
   It runs at today's real show times when live, otherwise at 9 PM. The show follows a fixed running order of scenes over
   its length; the owner's own soundtrack, audio/world-of-color.mp3 (never committed; or the copy kept by Load audio
   folder), plays in time with it when it is there, heard when the map is looking at the bay, and the show is as long as it.
   California Adventure's guests gather along the shore beforehand (spot0 'woc' in sim.js). */
const WOC={file:'audio/world-of-color.mp3',a:{audio:new Audio(),ready:false,src:'folder',name:'audio/world-of-color.mp3'},G:null,liveKey:null};
if(DL){const A=WOC.a,a=A.audio,ev=()=>EV.find(e=>e.id==='woc');a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,e=ev();if(d&&isFinite(d)&&e&&!e.userDur)e.dur=d/60});
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('woc');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 setTimeout(()=>loadTrack(a,WOC.file),0)}
const wocEv=()=>EV.find(e=>e.id==='woc');
function wocClock(){const ev=wocEv();if(!ev||ev.key==null||(ev.ph!=='live'&&ev.ph!=='done'))return null;return T-ev.key}
const wocLive=()=>{const ev=wocEv();return!!ev&&ev.ph==='live'};
const wocPlaying=()=>!WOC.a.audio.paused;
const wocLen=()=>{const ev=wocEv();return(ev?ev.dur:22)*60};
/* the holiday version on holiday-season dates */
function wocHoliday(){const m=/^\d{4}-(\d{2})-(\d{2})/.exec(typeof dateStr==='string'?dateStr:'');if(!m)return false;const md=+m[1]*100+ +m[2];return md>=1115||md<=106}
/* the show's places, from the map: the bay's open water, a grid of fountains off the Paradise Gardens shore (as far into
   the bay as the open water allows), the mist wall behind it and the audience's side (north, toward Paradise Gardens) */
function wocGeo(){if(WOC.G!==null)return WOC.G;WOC.G=false;if(!DL)return false;const bay=OSM.areas.find(a=>a.k==='water'&&a.n==='Paradise Bay');if(!bay)return false;
 const wet=(x,y)=>ptIn(x,y,bay.o)&&!(bay.i||[]).some(h=>ptIn(x,y,h)),open=(x,y,m)=>wet(x,y)&&wet(x+m,y)&&wet(x-m,y)&&wet(x,y+m)&&wet(x,y-m);
 const bb=bbox(bay.o),u=[0,-1],v=[1,0];
 /* the field: the widest band of open water across the bay's northern half */
 let best=null;for(let y=bb[1]+20;y<bb[1]+(bb[3]-bb[1])*.65;y+=3){let run=0,x0=0,bx=null;for(let x=bb[0];x<=bb[2];x+=3){if(open(x,y,6)&&open(x,y+24,6)){if(!run)x0=x;run++;if(!bx||run>bx[1])bx=[x0,run]}else run=0}if(bx&&(!best||bx[1]>best[2]))best=[y,bx[0],bx[1]]}
 if(!best)return false;const[fy,fx0,fn]=best,w=Math.min(fn*3,120),x0=fx0+(fn*3-w)/2,x1=x0+w,y0=fy,y1=fy+24,c=[(x0+x1)/2,(y0+y1)/2];
 const jets=[];for(let r=0;r<4;r++){const y=y0+3+r*6,n=Math.round(w/(r===0?6:8));for(let i=0;i<=n;i++){const x=x0+4+(w-8)*i/n;if(wet(x,y))jets.push({x,y,r,i,n,k:(x-c[0])/(w/2)})}}
 jets.sort((p,q)=>p.y-q.y); /* north first: the map is seen from the south, so the rows farther south are drawn over them */
 const shore=x=>{let y=y0;while(y>bb[1]&&wet(x,y))y-=1.5;return y};
 const pal=P_.palaround||null;
 WOC.G={bay,wet,u,v,x0,x1,y0,y1,c,w,jets,shore,pal,screen:[c[0],y1+5]};return WOC.G}
if(DL){const g=wocGeo();if(g)EVPOS.woc=g.c}
function wocNear(){const G=wocGeo();if(SV.on||!G)return 0;return Math.max(0,Math.min(1,prox(G.c[0],G.c[1],320)*1.7-.08))}
/* the running order, as fractions of the show: [start, kind, two hues]. The kinds decide what the mist wall shows */
const WOC_SCENES=[[0,'pre',[220,250]],[.03,'intro',[200,300]],[.12,'sea',[190,170]],[.26,'sky',[45,210]],[.38,'heart',[330,280]],[.5,'fire',[20,45]],[.62,'ice',[195,260]],[.76,'rainbow',[0,180]],[.9,'finale',[50,300]],[.985,'end',[210,50]]];
const WOC_XMAS=[[0,'pre',[220,250]],[.03,'intro',[210,50]],[.12,'snow',[200,220]],[.26,'jingle',[0,130]],[.38,'toys',[45,350]],[.5,'candles',[35,20]],[.62,'ice',[195,260]],[.76,'rainbow',[350,130]],[.9,'finale',[50,0]],[.985,'end',[210,50]]];
function wocAt(st){const S=wocHoliday()?WOC_XMAS:WOC_SCENES,f=Math.max(0,st)/wocLen();let s=S[0];for(const q of S)if(f>=q[0])s=q;return s}
/* Start it now, whatever the time (like Luminous and Fantasmic!): an extra showtime a few seconds from now */
function wocStart(){const ev=wocEv();if(!ev)return;if(ev.ph==='live'){wocLook();closeSheet();return}ev.on=true;const s=Math.ceil(T)+3;(ev.force||(ev.force=[])).push(s);ev.t=[...new Set([...ev.t,s])].sort((a,b)=>a-b);
 if(!AU.ready)auInit();WOC.liveKey=null;speed=1;playing=true;wocLook();closeSheet();sync();
 if(!WOC.a.ready)toast('Add '+WOC.file+' (or include it in Load audio folder) to hear the show');WOC.a.audio.play().then(()=>WOC.a.audio.pause()).catch(()=>{})}
function wocLook(){const G=wocGeo();if(!G)return;if(SV.on)setView(false);follow=null;sel=null;cam.x=cam.tx=G.c[0];cam.y=cam.ty=G.c[1]-10;cam.tm=Math.max(2.2,Math.min(cam.tm,3.2));cam.m=cam.tm}
function wocForceTidy(ev){if(!ev.force||!ev.force.length)return;for(const s of ev.force.slice())if(T>s+ev.dur*60+120||T<s-120){ev.force.splice(ev.force.indexOf(s),1);const i=ev.t.indexOf(s);if(i>=0&&ev.t.length>1)ev.t.splice(i,1)}}
/* the soundtrack follows the show's clock */
function wocSync(){const ev=wocEv(),A=WOC.a,a=A.audio;if(!ev)return;wocForceTidy(ev);const st=wocClock(),live=ev.ph==='live';
 if(live&&WOC.liveKey!==ev.key){WOC.liveKey=ev.key;if(A.ready&&HEA.auto&&speed!==1&&!FF&&wocNear()>.15){speed=1;sync();toast('World of Color is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=live&&A.ready&&playing&&speed===1&&!FF&&st!==null&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.1*wocNear());
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}
 else if(Math.abs(a.currentTime-st)>.6)a.currentTime=Math.max(0,st)}
/* what the mist wall shows: (x,y) the wall's foot, w its half-width, h its height */
function wocWall(x,y,w,h,h1,h2,t,al,kind,f){const g=cx.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,hsl(h1,85,60,0));g.addColorStop(.15,hsl(h1,85,62,.42*al));g.addColorStop(.5,hsl((h1+h2)/2,80,70,.55*al));g.addColorStop(.85,hsl(h2,85,62,.42*al));g.addColorStop(1,hsl(h2,85,60,0));
 cx.fillStyle=g;cx.beginPath();cx.moveTo(x-w,y);for(let i=0;i<=16;i++){const k=i/16;cx.lineTo(x-w+2*w*k,y-h-Math.sin(k*8+t*1.5)*h*.06-Math.sin(k*3.14)*h*.12)}cx.lineTo(x+w,y);cx.closePath();cx.fill();
 cx.save();cx.globalAlpha=al;const S=seeded(kind.length*31+7);
 if(kind==='sea'){for(let i=0;i<7;i++){const fx=x-w+((t*6+i*w*.3)%(2*w)),fy=y-h*(.25+.5*S());cx.fillStyle=hsl(i%2?25:50,95,65,.8);cx.beginPath();cx.ellipse(fx,fy,2.2,1.2,0,0,7);cx.fill();cx.beginPath();cx.moveTo(fx-2,fy);cx.lineTo(fx-3.6,fy-1.2);cx.lineTo(fx-3.6,fy+1.2);cx.fill()} /* fish swimming across */
  cx.strokeStyle=hsl(h1,80,85,.5);cx.lineWidth=.6;for(let j=0;j<3;j++){cx.beginPath();for(let i=0;i<=20;i++){const k=i/20;cx.lineTo(x-w*.9+1.8*w*k,y-h*(.15+j*.1)+Math.sin(k*10+t*2+j)*1)}cx.stroke()}}
 else if(kind==='sky'||kind==='snow'){for(let i=0;i<40;i++){const px=x-w*.9+S()*w*1.8,py=y-h*.1-((S()*h+t*(kind==='snow'?4:1.5))%(h*.85));cx.fillStyle=kind==='snow'?'rgba(255,255,255,.85)':hsl(h1,90,85,.8);cx.beginPath();cx.arc(px,py,kind==='snow'?.7:.5,0,7);cx.fill()}
  if(kind==='sky'){cx.strokeStyle='rgba(255,240,200,.6)';cx.lineWidth=.8;const bx=x-w*.6+((t*5)%(w*1.2)),by=y-h*.6+Math.sin(t)*2;cx.beginPath();cx.ellipse(bx,by,3,1.5,0,0,7);cx.stroke()}} /* a balloon drifting through the stars */
 else if(kind==='heart'||kind==='toys'){for(let i=0;i<6;i++){const a=t*.5+i*1.05,px=x+Math.cos(a)*w*.5,py=y-h*.5+Math.sin(a*1.3)*h*.2,s=2+1.2*Math.sin(t*2+i);cx.fillStyle=hsl((h1+i*40)%360,90,70,.85);
   if(kind==='heart'){cx.beginPath();cx.moveTo(px,py+s);cx.bezierCurveTo(px-s*1.6,py-s*.2,px-s*.6,py-s*1.4,px,py-s*.5);cx.bezierCurveTo(px+s*.6,py-s*1.4,px+s*1.6,py-s*.2,px,py+s);cx.fill()}
   else{cx.fillRect(px-s,py-s,s*2,s*2);cx.fillStyle=hsl((h1+i*40+180)%360,90,80,.9);cx.fillRect(px-.4,py-s,.8,s*2);cx.fillRect(px-s,py-.4,s*2,.8)}}} /* hearts / wrapped presents */
 else if(kind==='fire'||kind==='candles'){for(let i=0;i<11;i++){const fx=x-w*.75+i*w*.15,fh=h*(kind==='candles'?.2:.3)*(.7+.5*Math.abs(Math.sin(t*3+i*1.3)));if(kind==='candles'){cx.fillStyle='rgba(250,245,235,.7)';cx.fillRect(fx-.6,y-h*.15,1.2,h*.12)}
   const fg=cx.createLinearGradient(0,y-h*(kind==='candles'?.27:.15),0,y-h*.15-fh);fg.addColorStop(0,hsl(h1,95,60,.85));fg.addColorStop(1,hsl(h2,95,70,0));cx.fillStyle=fg;const by=y-h*(kind==='candles'?.27:.15);cx.beginPath();cx.moveTo(fx-1.4,by);cx.quadraticCurveTo(fx,by-fh*1.3,fx+1.4,by);cx.fill()}}
 else if(kind==='ice'){cx.strokeStyle='rgba(225,245,255,.8)';cx.lineWidth=.5;for(let i=0;i<5;i++){const px=x-w*.7+i*w*.35,py=y-h*(.4+.15*Math.sin(t+i)),r=3+1.5*Math.sin(t*.8+i),a0=t*.3+i;for(let k=0;k<6;k++){const a=a0+k*Math.PI/3;cx.beginPath();cx.moveTo(px,py);cx.lineTo(px+Math.cos(a)*r,py+Math.sin(a)*r);cx.stroke()}}} /* snowflakes forming */
 else if(kind==='jingle'){for(let i=0;i<14;i++){const px=x-w*.85+i*w*.13,py=y-h*.55+Math.sin(i*.9)*h*.12;cx.fillStyle=hsl(i%3===0?0:i%3===1?130:48,90,62,.6+.4*Math.abs(Math.sin(t*4+i)));cx.beginPath();cx.arc(px,py,1,0,7);cx.fill()}cx.strokeStyle='rgba(60,120,60,.5)';cx.lineWidth=.4;cx.beginPath();for(let i=0;i<=14;i++)cx.lineTo(x-w*.85+i*w*.13,y-h*.55+Math.sin(i*.9)*h*.12);cx.stroke()} /* a string of Christmas lights */
 else if(kind==='rainbow'){for(let j=0;j<6;j++){cx.strokeStyle=hsl(j*55,90,65,.55);cx.lineWidth=1.2;cx.beginPath();cx.arc(x,y-h*.1,h*(.75-j*.07),Math.PI*1.08,Math.PI*1.92);cx.stroke()}}
 else{for(let i=0;i<18;i++){const a=i*.35+t*.8,r=(t*8+i*2.3)%(h*.5);cx.fillStyle=hsl((h1+i*20)%360,90,85,.8*(1-r/(h*.5)));cx.beginPath();cx.arc(x+Math.cos(a)*r*1.6,y-h*.5+Math.sin(a)*r*.7,.7,0,7);cx.fill()}} /* sparkle swirl */
 cx.restore()}
function wocDraw(now){const st=wocClock(),G=wocGeo();if(st===null||!G||SV.on)return;const L=wocLen();if(st>L+10)return;
 const f=Math.max(0,st)/L,[,kind,[h1,h2]]=wocAt(st),t=now/1000,pre=kind==='pre',on=Math.min(1,Math.max(0,st)/5,(L+8-st)/8)*(pre?.2:1),A=on*Math.max(.35,nf);if(A<=0)return;
 /* an underlying pulse: each scene builds and swells, with a beat */
 const sc=(()=>{const S=wocHoliday()?WOC_XMAS:WOC_SCENES;let i=0;while(i<S.length-1&&f>=S[i+1][0])i++;const a=S[i][0],b=(S[i+1]||[1])[0];return[(f-a)/Math.max(1e-6,b-a),i]})(),sw=.45+.55*Math.sin(Math.PI*Math.min(1,sc[0]*1.15)),beat=Math.max(0,Math.sin(t*Math.PI*2*.9))**6,mode=sc[1]%4,big=kind==='finale';
 cx.save();cx.globalCompositeOperation='lighter';
 /* the bay lit in the scene's colours */
 {const R=G.w*.9,g=cx.createRadialGradient(G.c[0],G.c[1],2,G.c[0],G.c[1],R);g.addColorStop(0,hsl(h1,85,55,.3*A*sw));g.addColorStop(.6,hsl(h2,85,50,.14*A*sw));g.addColorStop(1,hsl(h2,80,50,0));cx.fillStyle=g;cx.beginPath();cx.arc(G.c[0],G.c[1],R,0,7);cx.fill()}
 if(pre){cx.restore();return}
 /* the Pal-A-Round across the bay: its wheel lit in the show's colours, chasing round */
 if(G.pal){const[px,py]=G.pal,R=22,cy=py-R-4,rot=t*.25;cx.lineWidth=.5;cx.strokeStyle=hsl(h1,90,70,.55*A);cx.beginPath();cx.arc(px,cy,R,0,7);cx.stroke();
  for(let i=0;i<16;i++){const a=rot+i/16*6.283,x=px+Math.cos(a)*R,y=cy+Math.sin(a)*R;cx.strokeStyle=hsl(h2,80,70,.25*A);cx.beginPath();cx.moveTo(px,cy);cx.lineTo(x,y);cx.stroke();cx.fillStyle=hsl((i%2?h1:h2)+((t*60+i*20)%40),90,70,(.5+.5*Math.max(0,Math.sin(t*4-i*.8)))*A);cx.beginPath();cx.arc(x,y,.9,0,7);cx.fill()}}
 /* searchlights from the field's corners, lasers in the bright scenes */
 for(let i=0;i<6;i++){const x=G.x0+(G.x1-G.x0)*i/5,y=G.y1,a=-Math.PI/2+Math.sin(t*.6+i*1.1)*.5,len=110+40*sw,g=cx.createLinearGradient(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);g.addColorStop(0,hsl(i%2?h1:h2,60,85,.3*A*sw));g.addColorStop(1,hsl(h1,60,85,0));cx.fillStyle=g;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(a-.04)*len,y+Math.sin(a-.04)*len);cx.lineTo(x+Math.cos(a+.04)*len,y+Math.sin(a+.04)*len);cx.closePath();cx.fill()}
 if(kind==='rainbow'||kind==='finale'||kind==='intro'){cx.lineWidth=.35;for(let i=0;i<10;i++){const a=-Math.PI/2+Math.sin(t*1.3+i*.7)*1.1,x=G.c[0],y=G.y1+2,len=140;cx.strokeStyle=hsl(kind==='rainbow'?i*36:i%2?h1:h2,100,65,.5*A);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);cx.stroke()}}
 cx.restore();
 /* the mist wall at the back of the field, with the scene's pictures on it */
 cx.save();cx.globalCompositeOperation='lighter';if(f<.99)wocWall(G.screen[0],G.screen[1],G.w*.48,30+6*sw,h1,h2,t,A*.85*(big?.7:1),kind,f);
 /* the fountains, back rows first. Each scene has its own pattern: a wave running across, rows rising in turn, everything
    pulsing together, or a fan sweeping from side to side; the finale throws them all high */
 cx.lineCap='round';
 for(const j of G.jets){let k;if(mode===0)k=.35+.65*Math.max(0,Math.sin(t*2.6-j.k*4));else if(mode===1)k=(Math.floor(t*1.2)%4)===j.r?1:.3;else if(mode===2)k=.4+.6*beat;else k=.35+.65*Math.max(0,Math.cos(j.k*3-Math.sin(t*.9)*3));
  const H=(big?44:j.r===0?10:22+8*(3-j.r))*k*sw*on,hh=((j.i%2?h1:h2)+Math.sin(t*.4+j.k)*12+360)%360,lean=mode===3?Math.sin(t*.9)*.7:j.r===0?0:j.k*.25;lumJet(j.x,j.y,H,lean,hh,A*.6,j.r===0?1:1.4,t,j.i+j.r*13)}
 /* flame from the front row at the big moments */
 if(kind==='fire'||kind==='finale'||kind==='candles'){const fl=Math.max(0,Math.sin(t*1.7))**8;if(fl>.05)for(let i=0;i<7;i++){const x=G.x0+10+(G.w-20)*i/6,y=G.y0+2,H=(18+10*fl)*fl,a=fl*A;const g=cx.createLinearGradient(0,y,0,y-H);g.addColorStop(0,`rgba(255,240,180,${a})`);g.addColorStop(.35,`rgba(255,160,40,${.85*a})`);g.addColorStop(1,'rgba(200,40,10,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(x-2.4,y);cx.quadraticCurveTo(x-4,y-H*.5,x,y-H);cx.quadraticCurveTo(x+4,y-H*.5,x+2.4,y);cx.fill()}}
 cx.restore()}
