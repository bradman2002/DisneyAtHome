/* ===== CARS LAND NEON LIGHTING (Disneyland Resort only) =====
   Every evening at sunset (to the nearest five minutes) Radiator Springs lights up its neon, the way it does in the park:
   "Sh-Boom" plays and the signs come on along Route 66 first and then outward, within half a minute, each flickering to life, the
   Cozy Cone's cones and Flo's included. Once lit, the neon stays on until California Adventure closes. The song is the
   owner's own copy, audio/sh-boom.mp3 (never committed; or the copy kept by Load audio folder), played in time with the
   ceremony while the map is looking at Cars Land; the ceremony is as long as the song. It is a pure function of the clock
   (like Tree of Life Awakenings), not an EV event, so no crowd gathers; "Watch the next one" in Entertainment jumps to the next one at once. */
const CLN={file:'audio/sh-boom.mp3',a:{audio:new Audio(),ready:false,src:'folder',name:'audio/sh-boom.mp3'},len:146,force:null,B:null,liveKey:null};
if(DL){const A=CLN.a,a=A.audio;a.preload='auto';a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{if(isFinite(a.duration)&&a.duration>30)CLN.len=a.duration});
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('shboom');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 setTimeout(()=>loadTrack(a,CLN.file),0)}
/* tonight's ceremony: sunset, to the nearest five minutes (or a start asked for by hand) */
const clStart=()=>CLN.force!==null?CLN.force:Math.round(sunset*12)/12*3600;
function clClock(){if(!DL||typeof ECLOSE==='undefined')return null;const s0=clStart(),st=T-s0;if(st<0||st>CLN.len+6||s0>ECLOSE*3600)return null;return st}
const clLive=()=>clClock()!==null;
const clPlaying=()=>!CLN.a.audio.paused;
/* the neon: lit from the ceremony until closing (fully lit after it, nothing before it) */
const clLitAll=()=>{if(!DL)return false;const s0=clStart();return T>=s0+CLN.len&&T<ECLOSE*3600+1800};
/* Radiator Springs' buildings (Cars Land's, not its rockwork or the ride's show building), in order down the street */
function clBuildings(){if(CLN.B)return CLN.B;CLN.B=[];if(!DL||!OSM.lands.cl)return CLN.B;const L=OSM.lands.cl,S2=OSM.S*.78,out=[];
 for(const q of OSM.buildings){if(q.p.length<3)continue;const b=bbox(q.p),x=(b[0]+b[2])/2,y=(b[1]+b[3])/2,a=(b[2]-b[0])*(b[3]-b[1]);if(a<20||a>2500||!ptIn(x,y,L)||(typeof dlIsRange==='function'&&dlIsRange(q))||AT.some(t=>t.osm===q.n&&q.n!=='Luigi’s Rollickin’ Roadsters'))continue;out.push({q,b,x,y,h:(q.h||6)*S2})}
 if(!out.length)return CLN.B;const mx=out.reduce((s,o)=>s+o.x,0)/out.length,my=out.reduce((s,o)=>s+o.y,0)/out.length;let sxx=0,syy=0,sxy=0;for(const o of out){sxx+=(o.x-mx)**2;syy+=(o.y-my)**2;sxy+=(o.x-mx)*(o.y-my)}
 const an=.5*Math.atan2(2*sxy,sxx-syy),ux=Math.cos(an),uy=Math.sin(an);for(const o of out)o.k=(o.x-mx)*ux+(o.y-my)*uy;
 /* Route 66, Radiator Springs' main street: the widest walkways in Cars Land. The neon starts on the buildings along it and works
    outward, so each building is ranked by how far it stands from the street (then along it) */
 const wp=OSM.paths.filter(p=>!p.a&&p.p.some(([x,y])=>ptIn(x,y,L))),maxW=Math.max(0,...wp.map(p=>p.w)),street=[];for(const p of wp)if(p.w>=maxW*.75)for(const q of p.p)if(ptIn(q[0],q[1],L))street.push(q);
 for(const o of out){let d=1e9;for(const q of street)d=Math.min(d,Math.hypot(o.x-q[0],o.y-q[1]));o.d=street.length?d:Math.abs(-(o.x-mx)*uy+(o.y-my)*ux)}
 out.sort((a,b)=>(a.d-b.d)||(a.k-b.k));CLN.street=street;
 const NEON=['#ff4fa0','#3fe8ff','#7dff6a','#ff4040','#ffb030','#c27bff','#ffe94a'];out.forEach((o,i)=>{o.i=i;o.col=NEON[hsh(Math.round(o.x*7+o.y*13))%NEON.length];o.col2=NEON[(hsh(Math.round(o.x*3+o.y*5))+3)%NEON.length];
  o.cone=typeof dlIsCone==='function'?dlIsCone(o.q):/Cozy Cone/i.test(o.q.n||'');o.walls=[];const P=o.q.p,n=P.length;let A=0;for(let j=0;j<n;j++){const p=P[j],r=P[(j+1)%n];A+=p[0]*r[1]-r[0]*p[1]}const sg=A>0?1:-1;
  for(let j=0;j<n;j++){const p=P[j],r=P[(j+1)%n],dx=r[0]-p[0],dy=r[1]-p[1],Lw=Math.hypot(dx,dy);if(Lw<1.5)continue;if(-dx/Lw*sg>.02)o.walls.push([p,r,Lw])}}); /* the walls facing the map's view */
 CLN.B=out;CLN.ctr=[mx,my];return out}
/* when each building's neon comes on: from the main street outward, all of it within the song's first half minute */
const CL_RUN=26;const clOnAt=o=>{const n=CLN.B.length||1;return 3+o.i/(n-1||1)*CL_RUN};
/* how fully the map is watching the lighting (0..1): everything else musical is muted by this much (setVol, audio.js) */
function clFocus(){if(clClock()===null)return 0;return Math.max(0,Math.min(1,(clNear()-.05)/.15))}
function clNear(){const B=clBuildings();if(SV.on||!B.length)return 0;return Math.max(0,Math.min(1,prox(CLN.ctr[0],CLN.ctr[1],260)*1.7-.08))}
/* "Watch it": jump to the next ceremony (a few seconds before it starts), tomorrow's if tonight's is over, and look at Cars Land */
function clStartNow(){if(!DL)return;CLN.force=null;if(typeof liveUnfollow==='function')liveUnfollow();
 if(T>clStart()+CLN.len){const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+1);dateStr=d.toISOString().slice(0,10);reset(7*3600)} /* tonight's has been: tomorrow's (its own sunset) */
 const s0=clStart();if(T<s0-8)seek(s0-8,false);CLN.liveKey=null;if(!AU.ready)auInit();speed=1;playing=true;clLook();closeSheet();sync();
 if(!CLN.a.ready)toast('Add '+CLN.file+' (or include it in Load audio folder) to hear the ceremony');CLN.a.audio.play().then(()=>CLN.a.audio.pause()).catch(()=>{})}
function clLook(){const B=clBuildings();if(!B.length)return;if(SV.on)setView(false);follow=null;sel=null;cam.x=cam.tx=CLN.ctr[0];cam.y=cam.ty=CLN.ctr[1]-8;cam.tm=Math.max(3,Math.min(cam.tm,4));cam.m=cam.tm}
/* the song follows the ceremony's clock */
function clSync(){if(!DL)return;const A=CLN.a,a=A.audio,st=clClock(),near=clNear();
 if(CLN.force!==null&&(T>CLN.force+CLN.len+120||T<CLN.force-120))CLN.force=null; /* a ceremony started by hand is over (or the clock went back before it) */
 if(st!==null&&st<5&&CLN.liveKey!==Math.round(T-st)){CLN.liveKey=Math.round(T-st);if(A.ready&&HEA.auto&&speed!==1&&!FF&&near>.15){speed=1;sync();toast('The Cars Land neon lighting is starting — speed set to 1×')}}
 const want=st!==null&&A.ready&&playing&&speed===1&&!FF&&near>.02&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.05*near);
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}else syncTrack(A,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})}
/* drawn after the night tint, as added light: neon tubes along each building's roofline and a sign on its front */
function clDraw(now){if(!DL||SV.on||nf<.08)return;const B=clBuildings();if(!B.length)return;const st=clClock(),all=clLitAll();if(st===null&&!all)return;
 const z=zf();if(Math.abs(CLN.ctr[0]-cam.x)>cw/2/z+220||Math.abs(CLN.ctr[1]-cam.y)>ch/2/z+220)return;const t=now/1000,A=Math.min(1,.55+nf*1.2),N=Math.max(0,Math.min(1,(nf-.3)/.5)); /* neon reads bright even at dusk; N: how dark it is, for the night's extra glow */
 cx.save();cx.globalCompositeOperation='lighter';cx.lineCap='round';
 for(const o of B){let k=1;if(st!==null){const on=clOnAt(o),d=st-on;if(d<0)continue;if(d<1.6)k=(hsh(Math.floor(t*14)+o.i*31)%3?1:.15)*(d<.25?.4:1)} /* flickering to life */
  /* a neon tube: a wide soft bloom (much stronger after dark), a coloured glow, the bright tube, and a white-hot core */
  const tube=(pts,col,w)=>{cx.beginPath();pts.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.strokeStyle=col;
   cx.globalAlpha=(.06+.1*N)*A*k;cx.lineWidth=w*(5+5*N);cx.stroke();cx.globalAlpha=(.22+.18*N)*A*k;cx.lineWidth=w*(3+.8*N);cx.stroke();
   cx.globalAlpha=A*k;cx.lineWidth=w*(1.2+.5*N);cx.stroke();cx.strokeStyle='#fff';cx.globalAlpha=(.3+.35*N)*A*k;cx.lineWidth=w*(.4+.12*N);cx.stroke()};
  /* after dark the neon throws its colour onto the ground and walls round the building */
  if(N>0){const R_=9+Math.min(10,(o.b[2]-o.b[0])*.4),g=cx.createRadialGradient(o.x,o.b[3],0,o.x,o.b[3],R_);g.addColorStop(0,o.col);g.addColorStop(.5,o.col2);g.addColorStop(1,'rgba(0,0,0,0)');cx.globalAlpha=.22*N*A*k;cx.fillStyle=g;cx.beginPath();cx.ellipse(o.x,o.b[3],R_,R_*.6,0,0,7);cx.fill(); /* its colour on the ground */
   const hy=o.b[1]-o.h*.5,H_=R_*.7,h2=cx.createRadialGradient(o.x,hy,0,o.x,hy,H_);h2.addColorStop(0,o.col);h2.addColorStop(1,'rgba(0,0,0,0)');cx.globalAlpha=.1*N*A*k;cx.fillStyle=h2;cx.beginPath();cx.arc(o.x,hy,H_,0,7);cx.fill()} /* and a halo in the air round its signs */
  if(o.cone){const g=dlConeGeo(o.q),x=g.x,y=g.y,h=g.H,w=g.r*.95;tube([[x-w,y],[x,y-h],[x+w,y]],'#ffb030',.55);tube([[x-w*.5,y-h*.5],[x+w*.5,y-h*.5]],'#ff4fa0',.45);continue} /* a Cozy Cone, outlined */
  for(const[p,r,Lw]of o.walls){tube([[p[0],p[1]-o.h+.3],[r[0],r[1]-o.h+.3]],o.col,.45); /* along the roofline */
   if(Lw>5){const m=[(p[0]+r[0])/2,(p[1]+r[1])/2],sw=Math.min(4.5,Lw*.3),sh=Math.min(2.2,o.h*.28),yy=m[1]-o.h*.62;cx.globalAlpha=.25*A*k;cx.fillStyle=o.col2;cx.fillRect(m[0]-sw-.6,yy-sh-.6,sw*2+1.2,sh*2+1.2); /* a neon sign on the front */
    tube([[m[0]-sw,yy-sh],[m[0]+sw,yy-sh],[m[0]+sw,yy+sh],[m[0]-sw,yy+sh],[m[0]-sw,yy-sh]],o.col2,.4);cx.globalAlpha=.9*A*k;cx.fillStyle=o.col2;for(let i=0;i<4;i++)cx.fillRect(m[0]-sw*.7+i*sw*.45,yy-.5,sw*.28,1)}}}
 cx.restore()}
