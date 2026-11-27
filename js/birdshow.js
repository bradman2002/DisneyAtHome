/* ===== FEATHERED FRIENDS IN FLIGHT!: Animal Kingdom's bird show at the Caravan Stage (Asia) =====
   (owner, 26 Nov 2026: "can you add the bird release show to animal kingdom"). The stage is the OpenStreetMap theatre whose old name
   is "Flights of Wonder" (way 295918978; it has no name now, so its spot is written here, plus OSM.dx). Show times come from
   Animal Kingdom's live feed (LIVE.shows.bird) while Live, otherwise the usual 10:45, 11:45, 1:45, 2:45 and 3:45. Each show is
   25 minutes: a hawk, a kookaburra, a seriema running the stage, an owl, a crowned crane, a vulture skimming the seats, and a
   finale where a flock of macaws is let go to circle out over the audience and come home. A pure function of the clock, like
   Tree of Life Awakenings (no EV event); the seats fill through the attraction of the same name in sim.js.
   Optional soundtrack: the owner's own audio/feathered-friends.mp3 (never committed), played near the stage in time with the show. */
const BIRD={D:1500,def:['10:45','11:45','13:45','14:45','15:45'].map(s=>{const[h,m]=s.split(':');return h*3600+m*60}),geo:null,
 file:'audio/feathered-friends.mp3',a:{audio:new Audio(),ready:false,src:'file',name:'audio/feathered-friends.mp3'}};
{const A=BIRD.a,a=A.audio;a.preload='auto';a.loop=false;a.addEventListener('canplay',()=>{A.ready=true});a.addEventListener('error',()=>{A.ready=false;A.src='none'});
 if(OSM.ak)setTimeout(()=>loadTrack(a,BIRD.file),0)}
const birdTimes=()=>(typeof LIVE!=='undefined'&&LIVE.follow&&LIVE.shows&&LIVE.shows.bird&&LIVE.shows.bird.length?LIVE.shows.bird:BIRD.def);
/* seconds into the show now on, or null */
function birdClock(){if(!OSM.ak||typeof AOPEN==='undefined'||T<AOPEN*3600||T>ACLOSE*3600)return null;for(const t0 of birdTimes())if(T>=t0&&T<t0+BIRD.D)return T-t0;return null}
const birdLive=()=>birdClock()!==null;
const birdTV=()=>{const s=birdClock();return s!==null&&(s<240||s>BIRD.D-270)}; /* TV mode cuts to the opening and the macaw release, not all 25 minutes */
const birdNext=()=>birdTimes().find(t=>t>T);
/* the stage: its centre S, u = toward the seats, v = across */
function birdGeo(){if(BIRD.geo)return BIRD.geo;const S=[2263.5-2210+(OSM.dx||0),7287.1];let u=[0,1];
 const p=POS['Caravan Stage'];if(p&&OSM.nodes[p.nd]){const n=OSM.nodes[p.nd],d=Math.hypot(n[0]-S[0],n[1]-S[1])||1;u=[(n[0]-S[0])/d,(n[1]-S[1])/d]}
 return BIRD.geo={S,u,v:[-u[1],u[0]]}}
const birdPt=(a,b)=>{const G=birdGeo();return[G.S[0]+G.u[0]*a+G.v[0]*b,G.S[1]+G.u[1]*a+G.v[1]*b]};
/* the running order: [start s, length s, bird, flight] */
const BIRD_ACTS=[[50,170,'hawk','swoop'],[240,150,'kooka','perch'],[400,150,'seriema','walk'],[560,150,'owl','perch'],[720,170,'crane','circle'],[900,170,'vulture','skim'],[1080,160,'hawk','swoop'],[1250,230,'macaw','release']];
const BIRD_COL={hawk:['#7a5634','#c9a77a',2.4],kooka:['#8a6a48','#e9e2d2',1.3],seriema:['#9a8a72','#d8cdb6',1.6],owl:['#b08a5a','#e8d6b0',1.7],crane:['#7d8088','#f2f2f2',2.6],vulture:['#26221f','#e9e4dc',3.4],macaw:['#d8302a','#2a6ad8',2]};
/* where a bird is s seconds into its act: [along, across, height] */
function birdPos(kind,s,i){const ease=f=>f*f*(3-2*f),hop=(a,b,f,h)=>[a[0]+(b[0]-a[0])*ease(f),a[1]+(b[1]-a[1])*ease(f),Math.sin(f*Math.PI)*h];
 if(kind==='perch'){const c=s%14,back=[-3,-4],front=[4,3];if(c<3)return hop(back,front,c/3,3);if(c<7)return[front[0],front[1],1.2];if(c<10)return hop(front,back,(c-7)/3,3);return[back[0],back[1],2]}
 if(kind==='walk'){const c=(s%16)/16,x=Math.sin(c*6.283)*6;return[1+Math.cos(c*12.566)*.8,x,0]}
 if(kind==='swoop'){const c=s%24;if(c<4)return[-2,-2,2];const f=(c-4)/20,a=f*6.283;return[10+Math.sin(a)*12,Math.sin(a*2)*9,4+Math.sin(f*Math.PI)*6]}
 if(kind==='circle'){const c=s%30;if(c<6)return[2,0,0];const a=(c-6)/24*6.283;return[9+Math.cos(a-Math.PI)*8+8,Math.sin(a)*10,3+Math.sin(a/2)*3]}
 if(kind==='skim'){const c=s%20;if(c<5)return[-3,3,1.5];const f=(c-5)/15;return[-3+Math.sin(f*Math.PI)*22,3-f*6+Math.sin(f*6.283)*4,1.5+Math.sin(f*Math.PI)*2.2]}
 /* release: the flock leaves the stage one by one, circles wide over the seats and the path, and comes home */
 const go=i*2.2,f=Math.max(0,Math.min(1,(s-15-go)/190)),a=f*6.283*2+i*.6,r=Math.sin(f*Math.PI)*(16+i%4*3);
 return f<=0?[-3,(i-5)*.8,1.5]:[8+Math.cos(a)*r,Math.sin(a)*r,1.5+Math.sin(f*Math.PI)*(9+i%3*2)]}
/* one bird, at map point (x,y) and height h, flapping */
function birdDraw1(c,x,y,h,k,flap,dir,sc){const[b,w,sz]=BIRD_COL[k],s=sz*sc;
 c.fillStyle='rgba(25,30,20,.22)';c.beginPath();c.ellipse(x+h*.45,y+h*.25,s*.9,s*.3,0,0,6.283);c.fill(); /* its shadow, down and to the right of the sun */
 c.save();c.translate(x,y-h);c.rotate(dir);
 if(h<.3){c.fillStyle=b;c.beginPath();c.ellipse(0,0,s*.6,s*.28,0,0,6.283);c.fill();c.fillStyle=w;c.beginPath();c.arc(s*.55,-s*.1,s*.18,0,6.283);c.fill();c.restore();return} /* on the ground */
 const fy=Math.sin(flap)*s*.9;c.fillStyle=w;
 for(const sg of[-1,1]){c.beginPath();c.moveTo(-s*.15,0);c.quadraticCurveTo(-s*.1,sg*(s*.6+fy*.3),-s*.35,sg*(s*1.1+fy*.4));c.lineTo(s*.2,sg*s*.15);c.closePath();c.fill()}
 if(k==='macaw'){c.fillStyle='#f2c22a';for(const sg of[-1,1]){c.beginPath();c.arc(-s*.05,sg*s*.4,s*.12,0,6.283);c.fill()}}
 c.fillStyle=b;c.beginPath();c.ellipse(0,0,s*.55,s*.2,0,0,6.283);c.fill();c.beginPath();c.moveTo(-s*.5,0);c.lineTo(-s*.95,-s*.18);c.lineTo(-s*.95,s*.18);c.closePath();c.fill();
 if(k==='crane'){c.fillStyle='#e0b030';c.beginPath();c.arc(s*.6,0,s*.12,0,6.283);c.fill()}
 c.restore()}
/* drawn with the other live things on the map (daylight show) */
function birdDrawAll(now){const st=birdClock();if(st===null||SV.on)return;const z=zf(),G=birdGeo();if(z<1.2||Math.abs(G.S[0]-cam.x)>cw/2/z+60||Math.abs(G.S[1]-cam.y)>ch/2/z+60)return;
 const c=cx,sc=2.3,t=now/1000;
 for(const[s0,len,k,fl]of BIRD_ACTS){if(st<s0||st>s0+len)continue;const s=st-s0,n=fl==='release'?10:1;
  for(let i=0;i<n;i++){const k2=fl==='release'?'macaw':k,p=birdPos(fl,s,i),q=birdPos(fl,s+.15,i),[x,y]=birdPt(p[0],p[1]),[x2,y2]=birdPt(q[0],q[1]);
   const dir=Math.atan2(y2-y-(q[2]-p[2]),x2-x),glide=k==='vulture'||k==='hawk'&&p[2]>5;
   birdDraw1(c,x,y,p[2],k2,glide?Math.sin(t*1.5+i)*.25+.6:t*(k==='kooka'||k==='macaw'?16:11)+i*1.7,dir,sc)}}}
/* the optional soundtrack, in time with the show while the map is near the stage */
function birdNear(){if(SV.on)return 0;const G=birdGeo();return Math.max(0,Math.min(1,prox(G.S[0],G.S[1],160)*1.8-.1))}
const birdPlaying=()=>!BIRD.a.audio.paused;
function birdSync(){const A=BIRD.a,a=A.audio,st=birdClock(),near=birdNear(),want=st!==null&&A.ready&&playing&&speed===1&&!FF&&near>.02&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}setVol(a,(AU.mute?0:AU.v.master)*near);
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}else syncTrack(A,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})}
