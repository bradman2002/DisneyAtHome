/* ===== RENDER: aerial map (default) or the Main Street view ===== */
const cv=$('#cv'),cx=cv.getContext('2d');let cw=1,ch=1,dpr=1;
const cam={x:P_.hub[0],y:P_.hub[1]-30,m:1.7,tx:P_.hub[0],ty:P_.hub[1]-30,tm:1.7};
const SHIRT=['#ff6b6b','#ffd166','#4ecdc4','#6a9cff','#f78fe0','#ffffff'];
const VIEW={fwWaits:false,layer:'wait',lands:new Set(Object.keys(LANDS)),hideClosed:false,guests:true,labels:true};
let BUB=[]; // callouts drawn this frame (screen-space hit boxes)
const GB=[[],[],[],[],[],[]]; // this frame's guest dots, by shirt colour
// the Crowds layer: a soft glow wherever people are gathered, green where it is easy going through to red where it is packed
function crowdHeat(){for(let j=0;j<DH;j++)for(let i=0;i<DW;i++){const n=DENS[j*DW+i];if(n<7)continue;const u=Math.min(1,n/75),x=(i+.5)*DCELL,y=(j+.5)*DCELL,r=DCELL*1.3,g=cx.createRadialGradient(x,y,0,x,y,r),h=120-120*u;
  g.addColorStop(0,`hsla(${h},95%,50%,${.22+.4*u})`);g.addColorStop(1,`hsla(${h},95%,50%,0)`);cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2)}}
/* On phones the visible height changes whenever the browser's address bar slides in or out. Re-sizing the whole scene
   each time made the view (and the castle) jump, so when only the height changes by a bar's worth, the canvas keeps
   its taller size and the bottom edge is simply tucked under the bar. Real changes (rotating, resizing) still apply. */
let stableW=0,stableH=0;
function resize(){const r=cv.parentElement.getBoundingClientRect(),touch=matchMedia('(pointer:coarse)').matches;
 if(touch&&Math.abs(r.width-stableW)<1&&r.height<=stableH&&stableH-r.height<170)return;
 stableW=r.width;stableH=r.height;dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);cv.style.height=r.height+'px';cw=r.width;ch=r.height;svLayout()}
// zoom 1 = the whole park (a VW×VH window); the map is bigger than that now, so zoom runs below 1 to take in the lagoon and resorts.
// Portrait screens start closer in, like a phone map.
const VW=1000,VH=940;
const baseZ=()=>{const fit=Math.min(cw/VW,ch/VH);return cw<ch?Math.max(fit,Math.min(cw/VW*1.7,ch/VH)):fit};
const minM=()=>Math.min(1,Math.min(cw/W,ch/H)/baseZ()); // furthest out: the whole map on screen (Magic Kingdom and Epcot)
const fitM=r=>Math.min(1,Math.min(cw/(r[2]-r[0]),ch/(r[3]-r[1]))/baseZ()); // the zoom that just fits a region
const zf=()=>baseZ()*cam.m;
/* the tethered balloon over Disney Springs: up and down on a ten-minute cycle while it's flying (8:30 am to 11 pm), lit at night */
function dsBalloon(z){const b=P_.dsballoon;if(!b)return;const hw=cw/2/z+200,hh=ch/2/z+300;if(Math.abs(b[0]-cam.x)>hw||b[1]-cam.y>hh||cam.y-b[1]>hh+150)return;
 const h=T/3600,on=h>8.5&&h<23,ph=(T%600)/600,up=on?(ph<.25?ph/.25:ph<.75?1:(1-ph)/.25):0,k=up*up*(3-2*up),alt=4+k*118,r=11,x=b[0]+Math.sin(T/40)*1.5*k,y=b[1]-alt,c=cx;
 c.fillStyle='rgba(20,40,30,.2)';c.beginPath();c.ellipse(b[0]+alt*.35,b[1]+1,r*.9,r*.4,0,0,7);c.fill(); /* its shadow, cast off to one side */
 c.strokeStyle='rgba(60,60,60,.7)';c.lineWidth=.35;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(x,y+r*1.25);c.stroke();
 c.fillStyle='#8a8f96';c.beginPath();c.ellipse(b[0],b[1],3.5,1.6,0,0,7);c.fill();
 const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#e8eef3');g.addColorStop(1,'#a9b6c2');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();
 c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();c.fillStyle='rgba(40,120,200,.85)';c.fillRect(x-r,y-r*.18,r*2,r*.36);c.fillStyle='rgba(230,90,60,.85)';c.fillRect(x-r,y+r*.3,r*2,r*.2);c.restore();
 c.strokeStyle='rgba(70,80,90,.6)';c.lineWidth=.25;for(const dx of[-.6,0,.6]){c.beginPath();c.moveTo(x+dx*r,y+Math.sqrt(1-dx*dx)*r*.9);c.lineTo(x+dx*r*.45,y+r*1.25);c.stroke()}
 c.fillStyle='#3d4650';c.beginPath();c.ellipse(x,y+r*1.3,r*.5,r*.14,0,0,7);c.fill();
 if(nf>.05&&on){c.globalCompositeOperation='lighter';const l=c.createRadialGradient(x,y,0,x,y,r*2.4);l.addColorStop(0,'rgba(255,230,170,'+(.55*nf)+')');l.addColorStop(1,'rgba(255,230,170,0)');c.fillStyle=l;c.beginPath();c.arc(x,y,r*2.4,0,7);c.fill();c.globalCompositeOperation='source-over'}}

/* map point → screen, exactly in step with the map, so callouts and pins glide with it */
const toS=(x,y)=>{const z=zf();return[(x-cam.x)*z+cw/2,(y-cam.y)*z+ch/2]};
const toW=(sx,sy)=>{const z=zf();return[(sx-cw/2)/z+cam.x,(sy-ch/2)/z+cam.y]};
function clampCam(){const z=zf(),hw=cw/2/z,hh=ch/2/z;for(const k of['x','tx']){cam[k]=hw*2>=W?W/2:Math.max(hw,Math.min(W-hw,cam[k]))}for(const k of['y','ty']){cam[k]=hh*2>=H?H/2:Math.max(hh,Math.min(H-hh,cam[k]))}}
/* glow sprite */
const GLOW=(()=>{const g=document.createElement('canvas');g.width=g.height=64;const x=g.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,225,160,.95)');r.addColorStop(.35,'rgba(255,200,120,.35)');r.addColorStop(1,'rgba(255,190,110,0)');x.fillStyle=r;x.fillRect(0,0,64,64);return g})();
/* Spaceship Earth after dark: a slow wash of colour drifting across the ball, and small white lights all over it that
   twinkle on and off (as the real one does), drawn each frame over the night tint. a: how dark it is (0..1) */
const SSE_SP=(()=>{const r=seeded(4242),o=[];for(let i=0;i<150;i++){const th=r()*6.283,ph=Math.acos(1-r()),sx=Math.sin(ph)*Math.cos(th),sy=Math.sin(ph)*Math.sin(th);
 o.push({sx,sy,f:Math.cos(ph),w:.5+r()*1.6,p:r()*6.283,s:.7+r()*.6})}return o})();
function sseNight(now,a,z){const S=SSE_AT;if(!S||a<.05)return;const{x,yc,R}=S;if(Math.abs(x-cam.x)>cw/2/z+R||Math.abs(yc-cam.y)>ch/2/z+R)return;const t=now/1000,c=cx;
 c.save();c.beginPath();c.arc(x,yc,R,0,7);c.clip();
 const hu=250+Math.sin(t*.11)*40,gx=x+Math.cos(t*.07)*R*.5,gy=yc+Math.sin(t*.09)*R*.4,g=c.createRadialGradient(gx,gy,0,gx,gy,R*1.3);
 g.addColorStop(0,`hsla(${hu},80%,62%,${.1*a})`);g.addColorStop(1,`hsla(${hu+50},80%,55%,0)`);c.fillStyle=g;c.fillRect(x-R,yc-R,R*2,R*2);c.restore();
 const d=Math.min(.9,Math.max(.35,1.1/z)); /* each light at least about a pixel across, however far out */
 for(const q of SSE_SP){const v=Math.pow(Math.max(0,Math.sin(t*q.w+q.p)),14);if(v<.03)continue;const px=x+q.sx*R*.97,py=yc+q.sy*R*.97,k=v*a*(.35+.65*q.f),r=d*q.s*(1+v*1.4);
  c.globalAlpha=k*.5*Math.min(1,z/2.5);c.drawImage(SSE_GLOW,px-r*2.5,py-r*2.5,r*5,r*5);c.globalAlpha=k;c.fillStyle='#fff';c.fillRect(px-r*.5,py-r*.5,r,r)}
 c.globalAlpha=1}
const SSE_GLOW=(()=>{const g=document.createElement('canvas');g.width=g.height=32;const x=g.getContext('2d'),r=x.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(235,240,255,.9)');r.addColorStop(.3,'rgba(190,210,255,.3)');r.addColorStop(1,'rgba(160,190,255,0)');x.fillStyle=r;x.fillRect(0,0,32,32);return g})();
/* ---------- frame ---------- */
function frame(rdt){
 if(BGSEEK){BGSEEK.to=Math.min(86399,BGSEEK.to+rdt*speed);bgSeekTick(30)}else if(playing){let rem=rdt*speed,n=0;while(rem>1e-6&&n<14){const d=Math.min(rem,10);step(d);rem-=d;n++}}
 if(typeof TV!=='undefined'&&TV.on)tvTick(rdt);liveTick();lighting();
 paradeSync();pageantSync();welcomeSync();anthemSync();kissSync();lumSync();fmSync();if(DL){wocSync();clSync()}tolSync();
 if(typeof RIDE!=='undefined'&&RIDE.on){rideFrame(rdt);BUB=[];return} /* riding in a monorail's front cab (ride.js) */
 if(SV.on){drawStreet(rdt);BUB=[];return}
 {const k=typeof TV!=='undefined'&&TV.on?.035:.18;cam.x+=(cam.tx-cam.x)*k;cam.y+=(cam.ty-cam.y)*k;cam.m+=(cam.tm-cam.m)*k; /* TV mode glides between shots */
  if(Math.abs(cam.tm-cam.m)<cam.m*.0015)cam.m=cam.tm;if(Math.abs(cam.tx-cam.x)<.04)cam.x=cam.tx;if(Math.abs(cam.ty-cam.y)<.04)cam.y=cam.ty} /* then settle exactly, rather than creeping closer by ever-smaller amounts (which kept the picture shimmering) */
 if(follow){const o=vehPos(follow);if(o){cam.tx=o[0];cam.ty=o[1]}}clampCam();
 heaSync();
 const z=zf(),now=performance.now();
 cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#9fc46e';cx.fillRect(0,0,cv.width,cv.height);
 cx.setTransform(dpr*z,0,0,dpr*z,dpr*(cw/2-cam.x*z),dpr*(ch/2-cam.y*z)); /* not snapped to whole pixels: a slow pan then glides instead of stepping */
 detailTick(z);const vis=d=>d.base&&z*dpr>MAP.mss*1.15&&d.x<cam.x+cw/2/z&&d.x+d.w>cam.x-cw/2/z&&d.y<cam.y+ch/2/z&&d.y+d.h>cam.y-ch/2/z; // sharper close-up layers, once painted
 const tv=d=>d.base&&d.x<cam.x+cw/2/z&&d.x+d.w>cam.x-cw/2/z&&d.y<cam.y+ch/2/z&&d.y+d.h>cam.y-ch/2/z;for(const L of MAP.tiles)if(tv(L))cx.drawImage(L.base,L.x,L.y,L.w,L.h); /* the land between the parks, under them */
 for(const L of MAP.layers)if(L.base)cx.drawImage(L.base,L.x,L.y,L.w,L.h);for(const d of MAP.detail)if(vis(d))cx.drawImage(d.base,d.x,d.y,d.w,d.h);
 drawLive(now);
 if(MAP.castleImg){const[bx,by,bw,bh]=MAP.castleBox;cx.drawImage(CASTLE_IMG&&CASTLE_IMG.naturalWidth?CASTLE_IMG:MAP.castle,bx,by,bw,bh)} /* the castle again on top, from the original image so it lines up exactly with the one in the background */ // keep rides behind the castle hidden
 // daylight → sunset → night
 cx.globalCompositeOperation='multiply';const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),col=mix(mix([255,255,255],[255,214,170],gf),[60,74,135],nf);
 cx.fillStyle=`rgb(${col.map(Math.round)})`;cx.fillRect(0,0,W,H);
 cx.globalCompositeOperation='lighter';const la=Math.min(1,nf*1.3+gf*.15);
 if(la>.02){cx.globalAlpha=la;const dv=MAP.detail.filter(vis);cx.save();if(dv.length){cx.beginPath();cx.rect(0,0,W,H);for(const d of dv)cx.rect(d.x,d.y,d.w,d.h);cx.clip('evenodd')}for(const L of MAP.tiles)if(tv(L))cx.drawImage(L.glow,L.x,L.y,L.w,L.h);for(const L of MAP.layers)if(L.glow)cx.drawImage(L.glow,L.x,L.y,L.w,L.h);cx.restore();{const done=[];for(let i=dv.length-1;i>=0;i--){const d=dv[i];cx.save();for(const o of done){cx.beginPath();cx.rect(d.x-1,d.y-1,d.w+2,d.h+2);cx.rect(o.x,o.y,o.w,o.h);cx.clip('evenodd')}cx.drawImage(d.glow,d.x,d.y,d.w,d.h);cx.restore();done.push(d)}} /* close-up layers overlap (the park's and a sharper patch round the castle): each spot takes the light of the one drawn on top only, or the lights add up and the castle glares */cx.globalAlpha=la*.32;if(!OCC.R)occBuild();for(const[x,y]of OCC.L||MAP.lamps)cx.drawImage(GLOW,x-4,y-7,8,8);
  // castle uplighting
  cx.globalAlpha=la*.55;const[ux,uy]=MAP.castleAt,g=cx.createRadialGradient(ux,uy-10,4,ux,uy-40,82);g.addColorStop(0,'rgba(170,140,255,.9)');g.addColorStop(1,'rgba(120,120,255,0)');cx.fillStyle=g;cx.fillRect(ux-83,uy-123,166,166)} /* the whole outer circle (centre uy-40, radius 82), so no square edge shows */
 sseNight(now,la,z);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 drawPageant(now,1);lumDraw(now);fmDraw(now);if(DL){wocDraw(now);clDraw(now)}tolDraw(now);drawSkyliner(true);for(const b of RBOAT)drawRiverboat(b,true);dlSnow(now);dsBalloon(z); // the water pageant's lights, and Luminous on World Showcase Lagoon
 {const g=geyserNow();if(g>0&&nf>.3){const[x0,y0]=P_.geyser;cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,nf)*g*.55;const lg=cx.createLinearGradient(0,y0,0,y0-30);lg.addColorStop(0,'rgba(255,210,150,1)');lg.addColorStop(1,'rgba(255,210,150,0)');cx.fillStyle=lg;cx.fillRect(x0-3.5,y0-30,7,30);cx.restore()}} /* the geyser is floodlit at night */
 if(nf>.35){cx.globalAlpha=Math.min(.9,nf);drawParadeMap(now);cx.globalAlpha=1} // a parade after dark is lit up: draw it again over the night tint
 // castle projections during Happily Ever After
 const st=showClock();
 if(st!==null&&st<CHOREO.end+5&&nf>.3){const[bx,by,bw,bh]=MAP.castleBox;const P=MAP.proj||(MAP.proj=document.createElement('canvas'));P.width=MAP.castle.width;P.height=MAP.castle.height;const pc=P.getContext('2d');
  pc.drawImage(MAP.castle,0,0);pc.setTransform(MAP.castleMSS,0,0,MAP.castleMSS,0,0);drawProjection(pc,bw,bh,Math.max(0,st));cx.globalAlpha=Math.min(MAP.castleImg?.55:.85,Math.max(0,st)/4,(CHOREO.end+5-st)/5);cx.drawImage(P,bx,by,bw,bh);cx.globalAlpha=1}
 // fireworks + smoke (screen space)
 cx.setTransform(dpr,0,0,dpr,0,0);lumTick();fmTick();heaFrame(rdt);
 {const u=tinkU(st);if(u!==null){const[ux,uy]=MAP.castleAt,[sx,sy]=toS(ux+u*250,uy-18+u*72);drawTink(cx,sx,sy-(1-u)*MAP.castleBox[3]*.93*z,z*4.4,.4)}} // Tinker Bell, from the top of the castle toward Tomorrowland
 for(const s of HEA.smoke){const a=Math.min(1,s.l/s.m)*.08,lit=.25+SV.fl*.7,c2=`${150*lit+40|0},${140*lit+40|0},${170*lit+50|0}`,g=cx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`rgba(${c2},${a})`);g.addColorStop(1,`rgba(${c2},0)`);cx.fillStyle=g;cx.fillRect(s.x-s.r,s.y-s.r,s.r*2,s.r*2)}
 cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalCompositeOperation='lighter';cx.drawImage(HEA.fwC,0,0);if(SV.fl>0){cx.fillStyle=`hsla(${SV.flH},80%,60%,${SV.fl*.07*nf})`;cx.fillRect(0,0,cv.width,cv.height)}cx.restore();
 drawOverlays(z,now)}
/* fireworks positions in the aerial view: bursts above and behind the castle */
function mapShell(q){const[t,kind,c0,alt]=q,z=zf(),[ux,uy]=MAP.castleAt,mx=ux+c0*120,by=uy-75,my=kind==='mine'?by:kind==='comet'?by-(14+alt*50):by-(36+alt*105);
 const b=toS(kind==='comet'?ux+c0*84+(Math.random()-.5)*20:mx,by),e=toS(mx,my);return{b,e,k:z*1.45,m:b[1]-20*z}}
/* ---------- Disneyland's riverboats ----------
   The Mark Twain (a white sternwheeler) and the Sailing Ship Columbia (a three-masted ship) go round Tom Sawyer Island on the
   Rivers of America, on the real route in the map data, from Frontierland Landing. Each trip is a 12-minute sail then 3 minutes
   at the landing; the Columbia runs half a trip behind so the two keep apart. A pure function of the clock (like the pageant),
   only while the ride is running (live status when Live is on); otherwise the Mark Twain waits at the landing and the Columbia
   is moored in Fowler's Harbor. Drawn bigger than life like the parade floats. */
const RBOAT=(()=>{if(!DL||!OSM.routes.riverboat||OSM.routes.riverboat.length<4)return[];let p=OSM.routes.riverboat.slice();if(Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1])<1)p.pop();
 const dk=POS['Mark Twain Riverboat']?POS['Mark Twain Riverboat'].c:p[0];let k=0,bd=1e18;p.forEach((q,i)=>{const d=(q[0]-dk[0])**2+(q[1]-dk[1])**2;if(d<bd){bd=d;k=i}});p=p.slice(k).concat(p.slice(0,k+1)); /* start and end at the landing */
 const P=mkPath(p);return[{k:'twain',a:AT.find(a=>a.osm==='Mark Twain Riverboat'),P,off:0},{k:'col',a:AT.find(a=>a.osm==='Sailing Ship Columbia'),P,off:.5}].filter(b=>b.a)})();
const RB_SAIL=720,RB_DOCK=180;
/* the Columbia moored in Fowler's Harbor: lying along the harbor's long axis (its water outline), bow toward its mouth on the river */
let COLDOCK;function colDock(){if(COLDOCK!==undefined)return COLDOCK;const f=P_.fowler;if(!f)return COLDOCK=null;
 const H=OSM.areas.filter(a=>a.k==='water'&&a.o.length>2&&ptIn(f[0],f[1],a.o)).sort((p,q)=>p.o.length-q.o.length)[0];let an=-Math.PI/2,x=f[0],y=f[1];
 if(H){let mx=0,my=0;for(const q of H.o){mx+=q[0];my+=q[1]}mx/=H.o.length;my/=H.o.length;let sxx=0,syy=0,sxy=0;for(const q of H.o){const dx=q[0]-mx,dy=q[1]-my;sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy}
  an=.5*Math.atan2(2*sxy,sxx-syy);const ux=Math.cos(an),uy=Math.sin(an);let lo=1e9,hi=-1e9,pl,ph;for(const q of H.o){const t=(q[0]-mx)*ux+(q[1]-my)*uy;if(t<lo){lo=t;pl=q}if(t>hi){hi=t;ph=q}}
  const O=OSM.areas.filter(a=>a.k==='water'&&a!==H&&a.o.length>2),gap=e=>{let m=1e9;for(const a of O){if(ptIn(e[0],e[1],a.o))return 0;for(const q of a.o)m=Math.min(m,Math.hypot(q[0]-e[0],q[1]-e[1]))}return m}; /* the mouth is the end that meets the river */
  if(gap(pl)<gap(ph))an+=Math.PI;x=mx+ux*(lo+hi)/2;y=my+uy*(lo+hi)/2}
 return COLDOCK={x,y,an,mv:0}}
function rbPos(b){{const fo=typeof fmBoatPos==='function'&&fmBoatPos(b);if(fo)return fo}const run=LIVENOW&&b.a.live?b.a.live.st==='OPERATING':aStat(b.a)!=='Closed',cyc=RB_SAIL+RB_DOCK;
 if(!run){if(b.k==='col')return colDock();const q=b.P.at(0),q2=b.P.at(6);return{x:q[0],y:q[1],an:Math.atan2(q2[1]-q[1],q2[0]-q[0]),mv:0}}
 const t=((T+b.off*cyc)%cyc+cyc)%cyc;if(t>=RB_SAIL){const q=b.P.at(0),q2=b.P.at(6);return{x:q[0],y:q[1],an:Math.atan2(q2[1]-q[1],q2[0]-q[0]),mv:0}}
 const u=t/RB_SAIL,e=u<.06?u*u/.12:u>.94?1-(1-u)*(1-u)/.12:u-.03, /* ease away from the landing and back into it */d=e/(1-.06)*b.P.L;const q=b.P.at(Math.min(b.P.L-.01,d));return{x:q[0],y:q[1],an:q[2],mv:1}}
/* draw one riverboat; lit=true draws only its lights (after the night tint) */
function drawRiverboat(b,lit){const s=rbPos(b);if(!s)return;const{x,y,an}=s,ca=Math.cos(an),sa=Math.sin(an),L=b.k==='twain'?17:16,Wd=b.k==='twain'?5.2:4.2,
  pt=(u,v,h)=>[x+ca*u-sa*v,y+sa*u+ca*v-(h||0)], /* u along the boat, v across it, h up (screen up, for the 3/4 view) */
  quad=(u0,u1,w,h,col)=>{cx.fillStyle=col;cx.beginPath();cx.moveTo(...pt(u0,-w,h));cx.lineTo(...pt(u1,-w,h));cx.lineTo(...pt(u1,w,h));cx.lineTo(...pt(u0,w,h));cx.closePath();cx.fill()};
 if(lit){if(nf<.25)return;cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle=`rgba(255,205,120,${.75*nf})`;
   if(b.k==='twain')for(const h of[2.2,4.4])for(let u=-L*.7;u<=L*.7;u+=2.2)for(const v of[-Wd*.8,Wd*.8]){const[px,py]=pt(u,v,h);cx.fillRect(px-.5,py-.5,1,1)}
   else for(const u of[-L*.6,-L*.1,L*.4]){const[px,py]=pt(u,0,1.5);cx.beginPath();cx.arc(px,py,.9,0,7);cx.fill()}cx.restore();return}
 cx.save();cx.fillStyle='rgba(20,40,60,.22)';cx.beginPath();cx.ellipse(x+2,y+1.5,L*1.05,Wd*1.2,an,0,7);cx.fill();
 if(s.mv){cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=1;for(const v of[-1,1]){cx.beginPath();cx.moveTo(...pt(-L*.9,v*Wd*.8));cx.lineTo(...pt(-L*1.7,v*Wd*1.9));cx.stroke()}}
 if(b.k==='twain'){ /* white sternwheeler: hull, three decks, pilot house, two black stacks, red paddlewheel at the stern */
  cx.fillStyle='#fbfaf5';cx.beginPath();cx.moveTo(...pt(-L,-Wd));cx.lineTo(...pt(L*.75,-Wd));cx.lineTo(...pt(L,0));cx.lineTo(...pt(L*.75,Wd));cx.lineTo(...pt(-L,Wd));cx.closePath();cx.fill();
  quad(-L-3,-L,Wd*.75,0,'#b8322a');cx.strokeStyle='#7a1f1a';cx.lineWidth=.4;for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(...pt(-L-3+i,-Wd*.75,1.2));cx.lineTo(...pt(-L-3+i,Wd*.75,1.2));cx.stroke()}
  const deck=(u0,u1,w,h0,h,top)=>{for(const v of[-w,w]){cx.fillStyle='#d6cfbf';cx.beginPath();cx.moveTo(...pt(u0,v,h0));cx.lineTo(...pt(u1,v,h0));cx.lineTo(...pt(u1,v,h));cx.lineTo(...pt(u0,v,h));cx.closePath();cx.fill();
    cx.fillStyle='#5a5a66';for(let u=u0+1;u<u1-.6;u+=1.6){const[a1,b1]=pt(u,v,h0+.5);cx.fillRect(a1-.3,b1-(h-h0)*.6,.6,(h-h0)*.45)}} /* the deck's side, with its windows */
   for(const[a2,b2]of[[u0,u0],[u1,u1]]){cx.fillStyle='#e6e0d2';cx.beginPath();cx.moveTo(...pt(a2,-w,h0));cx.lineTo(...pt(b2,w,h0));cx.lineTo(...pt(b2,w,h));cx.lineTo(...pt(a2,-w,h));cx.closePath();cx.fill()}
   quad(u0,u1,w,h,top)};
  deck(-L*.9,L*.6,Wd*.95,0,2.2,'#f4f1e8');deck(-L*.75,L*.45,Wd*.85,2.2,4.4,'#fbfaf5');deck(-L*.2,L*.2,Wd*.45,4.4,6.6,'#f1ede2');
  cx.strokeStyle='#c9b98a';cx.lineWidth=.35;for(const h of[2.2,4.4]){cx.beginPath();cx.moveTo(...pt(-L*.85,-Wd*.92,h));cx.lineTo(...pt(L*.55,-Wd*.92,h));cx.lineTo(...pt(L*.55,Wd*.92,h));cx.stroke()}
  cx.fillStyle='#1d1d22';for(const v of[-Wd*.55,Wd*.55]){const[bx,by]=pt(L*.35,v,4.4);cx.fillRect(bx-.7,by-9,1.4,9);cx.fillRect(bx-1.2,by-9.6,2.4,1)}}
 else{ /* the Columbia: dark wooden hull with a white stripe, deck, three masts with square sails, rigging */
  cx.fillStyle='#5a3a22';cx.beginPath();cx.moveTo(...pt(-L,-Wd));cx.lineTo(...pt(L*.7,-Wd));cx.lineTo(...pt(L*1.15,0));cx.lineTo(...pt(L*.7,Wd));cx.lineTo(...pt(-L,Wd));cx.closePath();cx.fill();
  quad(-L*.95,L*.65,Wd*.8,.8,'#b08a5a');cx.strokeStyle='#f1ead8';cx.lineWidth=.5;cx.beginPath();cx.moveTo(...pt(-L,-Wd,.4));cx.lineTo(...pt(L*.7,-Wd,.4));cx.stroke();
  const masts=[-L*.55,-L*.05,L*.4].map(u=>pt(u,0,.8));cx.strokeStyle='rgba(60,45,30,.8)';cx.lineWidth=.3;cx.beginPath();cx.moveTo(...pt(L*1.15,0,1));cx.lineTo(masts[2][0],masts[2][1]-15);cx.lineTo(masts[1][0],masts[1][1]-17);cx.lineTo(masts[0][0],masts[0][1]-15);cx.lineTo(...pt(-L,0,1));cx.stroke();
  [-L*.55,-L*.05,L*.4].forEach((mu,i)=>{const hh=i===1?17:15,[mx,my]=pt(mu,0,.8);cx.fillStyle='#4a3020';cx.fillRect(mx-.35,my-hh,.7,hh);
   for(const[f,w]of[[.75,3.6],[.5,4.2],[.25,4.6]]){const h0=.8+hh*f-2.6; /* square sails on yards across the hull, so they turn with the ship */
    cx.fillStyle='#f6f1e4';cx.beginPath();cx.moveTo(...pt(mu,-w,h0));cx.lineTo(...pt(mu,w,h0));cx.lineTo(...pt(mu+.6,w,h0+3.2));cx.lineTo(...pt(mu+.6,-w,h0+3.2));cx.closePath();cx.fill();
    cx.strokeStyle='rgba(150,135,110,.7)';cx.lineWidth=.25;cx.stroke()}
   cx.fillStyle='#c0392b';cx.fillRect(mx-.1,my-hh-2,1.8,1)})}
 cx.restore()}
/* Disneyland: snow falls on Main Street, U.S.A. as Believe… In Holiday Magic ends (from two minutes before the end until five after),
   between Town Square and the hub; flakes drift down from about 30 m and light up a little in the street lights */
function dlSnow(now){if(!DL)return;const ev=fireEv();if(!ev||ev.key==null||ev.on===false)return;const t=T-(ev.key+CHOREO.end);if(t<-120||t>300)return;
 const k=t<0?(t+120)/120:t>240?(300-t)/60:1,n=Math.round(260*k),mx=P_.mainst[0],y0=P_.hub[1]+10,y1=P_.townsq[1]+10,sec=now/1000;
 cx.save();cx.fillStyle='rgba(255,255,255,.92)';for(let i=0;i<n;i++){const h1=(Math.sin(i*12.9898)*43758.5453)%1,h2=(Math.sin(i*78.233)*12345.678)%1,a=Math.abs(h1),b=Math.abs(h2),
  gx=mx+(a-.5)*80+Math.sin(sec*.8+i)*2,gy=y0+b*(y1-y0),hh=30-((sec*2.4+b*30+a*7)%30);cx.beginPath();cx.arc(gx,gy-hh,.45+a*.35,0,7);cx.fill()}cx.restore()}
/* ---------- moving things on the map ---------- */
const SPIN=AT.filter(a=>a.k==='spin');
const LAGOON=FER.at(FER.L*.5).slice(0,2).map((v,i)=>v+(i?0:-170)); // label spot on open water, west of the ferry lane
const BAYLAKE=P_.disc?[P_.disc[0]-10,P_.disc[1]+190]:null; // label spot on open water, south of Discovery Island
/* the line the TRON lightcycles follow: down the middle of the canopy's outline, end to end */
const TRONP=(()=>{const{cv}=tronParts();if(!cv)return null;
 const b=bbox(cv.p),pts=[];for(let X=b[0]+5;X<=b[2]-5;X+=4){const ys=[];const p=cv.p;for(let i=0;i<p.length;i++){const a=p[i],c2=p[(i+1)%p.length];if((a[0]-X)*(c2[0]-X)<=0&&a[0]!==c2[0])ys.push(a[1]+(c2[1]-a[1])*(X-a[0])/(c2[0]-a[0]))}if(ys.length>=2)pts.push([X,(Math.min(...ys)+Math.max(...ys))/2])}
 return pts.length>3?mkPath(pts):null})();
const SMB=(()=>{const d=SMDOME();if(!d)return null;const p=new Path2D();domePath(p,d[0],d[1],d[2]*.97);return p})(),SMCTX=document.createElement('canvas').getContext('2d');
const PMP=mkPath(OSM.routes.pm),RACEP=mkPath(OSM.routes.race),TRAMP=mkPath(OSM.routes.tram);
// Jungle Cruise: boats follow the river, a little inside its outer bank
const JCP=OSM.routes.jungle&&OSM.routes.jungle.length>3?mkPath(OSM.routes.jungle):(()=>{const a=OSM.areas.find(q=>q.k==='water'&&q.n==='Jungle Cruise');if(!a)return null;const[cx0,cy0]=polyC(a.o);return mkPath([...a.o,a.o[0]].map(([x,y])=>[x+(cx0-x)*.14,y+(cy0-y)*.14]))})();
/* Where each ride's queue is drawn: along its real queue path when the map data has one by the entrance, otherwise back
   along the walkway from the entrance. Two abreast. */
/* ===== WHAT THE BUILDINGS HIDE =====
   Guests and queues are drawn after the map, so without this they would show through every building. The mask marks every
   spot of the parks that a building covers in the map's 3/4 view: inside its outline, or on the ground behind it (north of it)
   up to its drawn height, plus the castle picture's own shape. Built once per park region from every building, a few
   heights at a time (fill the outlines, then smear them upward by doubling shifts), at half a unit per pixel at Walt Disney
   World (its parks are big) and one at Disneyland. occ(x,y) says whether that spot is hidden. */
const OCC={R:null};
function occBuild(){OCC.R=[];const S2=OSM.S*.78,K=DL?1:.5,regs=(OSM.regions||[]).slice(0,OSM.nparks||1);
 const blds=OSM.buildings.filter(q=>q.p.length>2&&!(q.k==='roof'&&(q.h||0)<=5)&&q.n!=='Space Mountain');
 for(const r of regs){const x0=Math.floor(r[0]),y0=Math.floor(r[1]),W=Math.ceil((r[2]-x0)*K),H=Math.ceil((r[3]-y0)*K);if(W<2||H<2||W*H>2.6e7)continue;
  const m=document.createElement('canvas');m.width=W;m.height=H;const mc=m.getContext('2d'),t=document.createElement('canvas');t.width=W;t.height=H;const tc=t.getContext('2d'),u=document.createElement('canvas');u.width=W;u.height=H;const uc=u.getContext('2d');
  const buckets=new Map();for(const q of blds){const b=bbox(q.p);if(b[2]<r[0]||b[0]>r[2]||b[3]<r[1]||b[1]>r[3]+80)continue;const hh=q._dh!=null?q._dh:(q.h||4)*S2,k=Math.max(1,Math.ceil(hh*K/2)*2);(buckets.get(k)||buckets.set(k,[]).get(k)).push(q)}
  for(const[hk,list]of buckets){tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,W,H);tc.setTransform(K,0,0,K,-x0*K,-y0*K);tc.fillStyle='#000';tc.beginPath();for(const q of list){q.p.forEach(([x,y],i)=>i?tc.lineTo(x,y):tc.moveTo(x,y));tc.closePath()}tc.fill();
   tc.setTransform(1,0,0,1,0,0);let cov=1;while(cov<=hk){const sh=Math.min(cov,hk+1-cov);uc.clearRect(0,0,W,H);uc.drawImage(t,0,0);tc.drawImage(u,0,-sh);cov+=sh} /* now covers every upward shift 0..height */
   mc.drawImage(t,0,0)}
  if(MAP.castleBox&&(MAP.castle||(typeof CASTLE_IMG!=='undefined'&&CASTLE_IMG))){const[bx,by,bw,bh]=MAP.castleBox,img=MAP.castleImg&&CASTLE_IMG&&CASTLE_IMG.naturalWidth?CASTLE_IMG:MAP.castle,front=MAP.castleAt?MAP.castleAt[1]:by+bh;
   mc.save();mc.setTransform(K,0,0,K,-x0*K,-y0*K);mc.beginPath();mc.rect(bx,by,bw,front-by);mc.clip();mc.drawImage(img,bx,by,bw,bh);mc.restore()} /* the castle's silhouette, down to its front */
  const d=mc.getImageData(0,0,W,H).data,a=new Uint8Array(W*H);for(let i=0;i<W*H;i++)a[i]=d[i*4+3]>100?1:0;OCC.R.push({x0,y0,W,H,K,a})}
 OCC.L=(MAP.lamps||[]).filter(([x,y])=>!occ(x,y-.5))} /* the lamps whose night glow isn't behind a building */
function occ(x,y){if(!OCC.R)return false;for(const m of OCC.R){const i=((x-m.x0)*m.K)|0,j=((y-m.y0)*m.K)|0;if(i>=0&&j>=0&&i<m.W&&j<m.H)return m.a[j*m.W+i]===1}return false}
const QLINE=AT.map(a=>{let best=null,bd=40*40;for(const p of OSM.paths){if(!p.q||p.a||p.p.length<2)continue;for(const e of[0,p.p.length-1]){const d=(p.p[e][0]-a.dx)**2+(p.p[e][1]-a.dy)**2;if(d<bd){bd=d;best=e?p.p.slice().reverse():p.p}}}
 if(best){const L=mkPath(best);if(L.L>12)return L}
 const pts=[N[a.nd]];let prev=-1,cur=a.nd;for(let h=0;h<4;h++){const nx=ADJ[cur].filter(([v])=>v!==prev).sort((p,q)=>q[1]-p[1])[0];if(!nx)break;prev=cur;cur=nx[0];pts.push(N[cur])}
 return mkPath(pts.length>1?pts:[N[a.nd],[N[a.nd][0]+20,N[a.nd][1]]])});
/* the Town Square flagpole and its flag; drawn after the guests so the crowd at its foot doesn't hide it */
function drawFlag(now){const fp=P_.flagpole||[P_.townsq[0],P_.townsq[1]-6],x=fp[0],y=fp[1],up=flagUp(); /* the Town Square flagpole: the flag flies all day and comes down during the anthem at the Flag Retreat */
   cx.fillStyle='rgba(30,40,30,.25)';cx.fillRect(x+.4,y,5,.8);cx.fillStyle='#e9e9ee';cx.fillRect(x-.3,y-26,.6,26);cx.fillStyle='#f2c444';cx.beginPath();cx.arc(x,y-26.4,.8,0,7);cx.fill();
   if(up>0){const fy=y-26+(1-up)*20,wv=Math.sin(now/260)*.6;cx.fillStyle='#c8323a';cx.beginPath();cx.moveTo(x+.3,fy);cx.lineTo(x+8,fy+.6+wv);cx.lineTo(x+8,fy+4.6+wv);cx.lineTo(x+.3,fy+4);cx.fill();cx.fillStyle='#fff';cx.fillRect(x+.3,fy+1.2,7.4,.8);cx.fillRect(x+.3,fy+2.8,7.4,.8);cx.fillStyle='#2f4f9a';cx.fillRect(x+.3,fy,3.2,2)}}
/* Kilimanjaro Safaris' trucks: open-sided safari trucks under striped canvas, driving the one-way road through the savannas
   (OSM.routes.safari) a minute or so apart, about 22 minutes round; they stand still while the ride is down and are put away
   when it's closed */
const SAFP=OSM.routes&&OSM.routes.safari?mkPath(OSM.routes.safari):null,SAF={d:0,t:null},SAFA=AT.find(a=>a.osm==='Kilimanjaro Safaris');
function drawSafari(){if(!SAFP||!SAFA||SAFP.L<50)return;const st=aStat(SAFA);if(st==='Closed'){SAF.t=null;return}
 const v=SAFP.L/1320,dT=SAF.t===null?1e9:T-SAF.t;SAF.t=T;if(Math.abs(dT)>120)SAF.d=T*v;else if(st!=='Temporarily down'&&st!=='Delayed')SAF.d+=dT*v;
 const z=zf(),hw=cw/2/z+20,hh=ch/2/z+20,n=20,c=cx;
 for(let i=0;i<n;i++){const d=((SAF.d+i*SAFP.L/n)%SAFP.L+SAFP.L)%SAFP.L,[x,y,an]=SAFP.at(d);if(Math.abs(x-cam.x)>hw||Math.abs(y-cam.y)>hh)continue;
  c.save();c.translate(x,y);c.rotate(an);c.scale(1.6,1.6);c.fillStyle='rgba(30,30,20,.25)';c.fillRect(-4.2,-1.2,9,3.4);
  c.fillStyle='#b89a5e';c.fillRect(-4.5,-1.6,9,3.2);c.fillStyle='#6f6a48';c.fillRect(3,-1.5,1.5,3);
  c.fillStyle='#efe4c8';c.fillRect(-4.3,-1.75,7.2,3.5);c.fillStyle='#8a5a32';for(let k=-4;k<2.9;k+=1.4)c.fillRect(k,-1.75,.6,3.5);
  c.restore()}}
/* Kilimanjaro Safaris' animals: herds placed beside the truck road (OSM.routes.safari) in the order the ride meets them -
   forest antelope, hippos, crocodiles, giraffes, zebras, ostriches, rhinos, elephants, flamingos, lions, cheetahs - each
   wandering slowly round its own spot and grazing */
const SAFZ=[['ant',.05,4],['hippo',.12,3],['croc',.19,3],['giraffe',.28,4],['zebra',.34,6],['ant',.4,7],['ostrich',.46,3],
 ['rhino',.52,2],['elephant',.59,4],['flamingo',.66,12],['lion',.73,3],['cheetah',.8,2],['giraffe',.87,3],['zebra',.93,5]];
const SAFAN=(()=>{if(!SAFP||SAFP.L<50)return[];let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647,pts=[];
 for(let d=0;d<SAFP.L;d+=8)pts.push(SAFP.at(d));const clear=(x,y)=>pts.every(p=>(p[0]-x)**2+(p[1]-y)**2>110),out=[];
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts)x0=Math.min(x0,p[0]),y0=Math.min(y0,p[1]),x1=Math.max(x1,p[0]),y1=Math.max(y1,p[1]);
 const near=OSM.areas.filter(a=>(a.k==='water'||a.k==='forest')&&a.o.some(q=>q[0]>x0-80&&q[0]<x1+80&&q[1]>y0-80&&q[1]<y1+80)),
  inP=(o,x,y)=>{let r=false;for(let i=0,j=o.length-1;i<o.length;j=i++){const[a,b]=o[i],[c,d]=o[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)r=!r}return r},
  kind=(x,y)=>{let f=0;for(const a of near)if(inP(a.o,x,y)){if(a.k==='water')return 'w';f=1}return f?'f':''};
 for(const[k,f,n]of SAFZ){const wet=k==='hippo'||k==='flamingo'||k==='croc';let hx=null,hy=0;
  for(let tr=0;tr<80&&hx===null;tr++){const[x,y,an]=SAFP.at((((f+(rnd()-.5)*(wet?.14:.04))%1+1)%1)*SAFP.L),
   s=rnd()<.5?1:-1,o=(wet?6:16)+rnd()*(wet?45:20),px=x-Math.sin(an)*o*s,py=y+Math.cos(an)*o*s;
   if(clear(px,py)&&(wet?kind(px,py)==='w':tr>50||kind(px,py)===''))hx=px,hy=py}
  if(hx===null)continue;
  for(let i=0;i<n;i++)for(let tr=0;tr<12;tr++){const a=rnd()*6.283,r=rnd()*(k==='flamingo'?7:9),x=hx+Math.cos(a)*r,y=hy+Math.sin(a)*r*.6,w=kind(x,y)==='w';
   if(wet===w&&clear(x,y)){out.push({k,x,y,ph:rnd()*99,sp:.5+rnd()});break}}}
 return out.sort((a,b)=>a.y-b.y)})();
function safAnimal(c,k,g){const E=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill()},
  L=(x0,y0,x1,y1,w,col)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()};c.lineCap='round';
 if(k==='giraffe'){const s='#d9a441';for(const lx of[-2,-1.2,1.4,2.2])L(lx,-4.4,lx,0,.55,s);E(0,-5,3,1.5,s);L(2.2,-5.6,4.2,-11.5+g,1.1,s);
  E(4.9,-11.7+g,1.1,.6,s);c.fillStyle='#8a5a2b';for(const[a,b]of[[-1.6,-5.2],[0,-5.5],[1.4,-4.8],[-.6,-4.5],[3,-7.6],[3.6,-9.4]])c.fillRect(a,b,.7,.6)}
 else if(k==='zebra'){for(const lx of[-1.6,-1,1.2,1.8])L(lx,-2,lx,0,.45,'#eee');E(0,-2.5,2.4,1.1,'#f2f2ee');E(2.6,-3+g*.6,.9,.6,'#f2f2ee');
  c.fillStyle='#222';for(let x=-2;x<2.4;x+=.8)c.fillRect(x,-3.4,.32,1.8)}
 else if(k==='ant'){for(const lx of[-1.4,-.9,1,1.5])L(lx,-1.8,lx,0,.35,'#9a6436');E(0,-2.2,2,.9,'#b27a45');E(0,-1.8,1.5,.4,'#efe2cc');
  E(2.2,-2.8+g*.6,.7,.5,'#b27a45');L(2.2,-3.2+g*.6,1.8,-4.4+g*.6,.25,'#3a2a1a')}
 else if(k==='elephant'){for(const lx of[-2.2,-1,1.2,2.2])L(lx,-2,lx,0,1.1,'#7e7a76');E(0,-3.2,3.3,2.1,'#8d8a86');E(3.3,-3.8,1.5,1.4,'#8d8a86');
  E(2.6,-3.6,1.1,1.5,'#7a7672');L(4.4,-3.4,4.7+g*.3,-.6,.7,'#8d8a86');L(4.2,-3,5,-2.6,.3,'#f3efe2')}
 else if(k==='rhino'){for(const lx of[-1.8,-.8,1,1.8])L(lx,-1.2,lx,0,.8,'#878078');E(0,-1.9,2.8,1.3,'#9a948a');E(3,-1.8+g*.4,1.2,.8,'#9a948a');
  L(3.8,-2.2,4.3,-3.1,.45,'#e8e2d4')}
 else if(k==='lion'||k==='cheetah'){const s=k==='lion'?'#c99a4f':'#d8b064';for(const lx of[-1.4,-.8,1,1.5])L(lx,-1,lx,0,.4,s);E(0,-1.5,2.1,.8,s);
  L(-2,-1.6,-3,-.6,.25,s);if(k==='lion')E(2.1,-2,1.15,1.15,'#7a4a20');else{c.fillStyle='#3a2a1a';for(const[a,b]of[[-1,-1.8],[0,-1.4],[.9,-1.9],[-.4,-2]])c.fillRect(a,b,.3,.3)}
  E(2.4,-2,.7,.6,s)}
 else if(k==='ostrich'){L(-.4,-2,-.6,0,.3,'#d9b49a');L(.4,-2,.6,0,.3,'#d9b49a');E(0,-2.6,1.4,1,'#2b2724');E(-1,-2.8,.5,.5,'#f0ece4');
  L(.9,-3,1.4,-5.4+g,.3,'#d9b49a');E(1.6,-5.5+g,.4,.3,'#d9b49a')}
 else if(k==='flamingo'){L(0,-1.6,0,0,.18,'#e07a8a');E(0,-2,.8,.5,'#f08a9a');L(.6,-2.2,.9,-3.4+g*.5,.2,'#f08a9a');E(1.1,-3.4+g*.5,.3,.2,'#f08a9a')}
 else if(k==='hippo'){E(0,-.6,2.6,1.1,'#6e6266');E(2.4,-.7,1.1,.8,'#7a6c70');E(2.8,-1.3,.25,.2,'#3a3236');c.fillStyle='rgba(120,170,190,.85)';c.fillRect(-3,-.2,6.6,.8)}
 else if(k==='croc'){E(0,-.3,3,.5,'#55603a');L(2.6,-.3,4.8,-.2,.6,'#55603a');L(-2.6,-.3,-4.6,0,.5,'#55603a')}}
function drawSafariAnimals(){if(!SAFAN.length)return;const z=zf(),hw=cw/2/z+30,hh=ch/2/z+30,c=cx,sc=1.5;
 for(const a of SAFAN){if(Math.abs(a.x-cam.x)>hw||Math.abs(a.y-cam.y)>hh)continue;
  const tt=T/(30/a.sp)+a.ph,mv=a.k==='lion'||a.k==='cheetah'||a.k==='croc'||a.k==='hippo'?.4:2.2,x=a.x+Math.sin(tt)*mv,y=a.y+Math.sin(tt*.7)*mv*.4,
   f=Math.cos(tt)>=0?1:-1,g=Math.max(0,Math.sin(tt*2.3+a.ph))*(a.k==='giraffe'?4:2.2);
  c.save();c.translate(x,y);c.scale(sc*f,sc);if(a.k!=='hippo'&&a.k!=='croc'){c.fillStyle='rgba(30,30,20,.22)';c.beginPath();c.ellipse(0,0,2.6,.7,0,0,6.283);c.fill()}safAnimal(c,a.k,g);c.restore()}}
/* the Friendship boats pass under the bridges: every walkway, road or bridge deck the boats' routes cross (away from their
   docks) is worked out once and repainted over the boats, matching the map's own colours */
/* Walkways that cross the Tomorrowland Speedway go over it on footbridges, but the map paints the track over them, so the
   cars seemed to drive across the path (owner, 26 Nov 2026). The crossings are found once; each one's piece of walkway is
   repainted over the track (with a shadow and edge so it reads as a bridge) and the cars are hidden while under it. */
let RACEX=null;
function raceBridges(){if(RACEX)return RACEX;RACEX=[];if(!RACEP||!RACEP.L)return RACEX;const smp=[];for(let d=0;d<RACEP.L;d+=1)smp.push(RACEP.at(d));const rb=bbox(smp.map(q=>[q[0],q[1]]));
 const X=(a,b,c_,d_)=>{const r=[b[0]-a[0],b[1]-a[1]],s_=[d_[0]-c_[0],d_[1]-c_[1]],den=r[0]*s_[1]-r[1]*s_[0];if(!den)return null;const t=((c_[0]-a[0])*s_[1]-(c_[1]-a[1])*s_[0])/den,u=((c_[0]-a[0])*r[1]-(c_[1]-a[1])*r[0])/den;return t>=0&&t<=1&&u>=0&&u<=1?[a[0]+t*r[0],a[1]+t*r[1]]:null};
 for(const q of OSM.paths){if(q.a)continue;const pl=q.p;for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1];if(Math.max(a[0],b[0])<rb[0]-5||Math.min(a[0],b[0])>rb[2]+5||Math.max(a[1],b[1])<rb[1]-5||Math.min(a[1],b[1])>rb[3]+5)continue;
   for(let j=0;j<smp.length-1;j++){const h=X(a,b,smp[j],smp[j+1]);if(!h)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,d0=Math.min(12,Math.hypot(h[0]-a[0],h[1]-a[1])),d1=Math.min(12,Math.hypot(b[0]-h[0],b[1]-h[1]));
    RACEX.push({h,a:[h[0]-ux*d0,h[1]-uy*d0],b:[h[0]+ux*d1,h[1]+uy*d1],w:q.w,col:q.q?'#e3d6c8':'#ede1d6'});break}}}
 return RACEX}
function raceBridgeDraw(RX){if(!RX.length)return;const c=cx;c.save();c.lineCap='butt';for(const q of RX){c.strokeStyle='rgba(30,30,40,.25)';c.lineWidth=q.w+1.6;c.beginPath();c.moveTo(q.a[0]+.8,q.a[1]+1.2);c.lineTo(q.b[0]+.8,q.b[1]+1.2);c.stroke();
  c.strokeStyle='#b9a68d';c.lineWidth=q.w+1.2;c.beginPath();c.moveTo(...q.a);c.lineTo(...q.b);c.stroke();c.strokeStyle=q.col;c.lineWidth=q.w;c.beginPath();c.moveTo(...q.a);c.lineTo(...q.b);c.stroke()}c.restore()}
let FSX=null;
function fsBridges(){if(!FSX){FSX={p:[],a:[]};const RW={road1:8.5,road2:6.5,road3:3.8};
  for(const R of BOATR.filter(R=>R.fs)){const smp=[];for(let d=0;d<R.p.L;d+=3)smp.push(R.p.at(d));const rb=bbox(smp.map(q=>[q[0],q[1]])),dock=(x,y)=>R.st.some(d=>{const q=R.p.at(Math.min(d,R.p.L-.01));return Math.hypot(q[0]-x,q[1]-y)<30});
   const X=(a,b,c_,d_)=>{const r=[b[0]-a[0],b[1]-a[1]],s_=[d_[0]-c_[0],d_[1]-c_[1]],den=r[0]*s_[1]-r[1]*s_[0];if(!den)return null;const t=((c_[0]-a[0])*s_[1]-(c_[1]-a[1])*s_[0])/den,u=((c_[0]-a[0])*r[1]-(c_[1]-a[1])*r[0])/den;return t>=0&&t<=1&&u>=0&&u<=1?[a[0]+t*r[0],a[1]+t*r[1]]:null};
   const test=(pl,w,col,edge)=>{for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1];if(Math.max(a[0],b[0])<rb[0]||Math.min(a[0],b[0])>rb[2]||Math.max(a[1],b[1])<rb[1]||Math.min(a[1],b[1])>rb[3])continue;
     for(let j=0;j<smp.length-1;j++){const h=X(a,b,smp[j],smp[j+1]);if(!h||dock(h[0],h[1]))continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,d0=Math.min(14,Math.hypot(h[0]-a[0],h[1]-a[1])),d1=Math.min(14,Math.hypot(b[0]-h[0],b[1]-h[1]));
      FSX.p.push({a:[h[0]-ux*d0,h[1]-uy*d0],b:[h[0]+ux*d1,h[1]+uy*d1],w,col,edge});break}}};
   for(const q of OSM.paths)if(!q.a)test(q.p,q.w,q.q?'#e3d6c8':'#ede1d6','#cdbcae');
   for(const l of OSM.lines)if(RW[l.k])for(const pl of l.p)test(pl,RW[l.k],l.k==='road3'?'#c3c5cb':'#b3b7c0','rgba(90,96,104,.9)');
   for(const a of OSM.areas)if(a.k==='bridge'){const b=bbox(a.o);if(smp.some(q=>q[0]>b[0]-3&&q[0]<b[2]+3&&q[1]>b[1]-3&&q[1]<b[3]+3&&!dock(q[0],q[1])))FSX.a.push(a)}}}
 const z=zf(),hw=cw/2/z+30,hh=ch/2/z+30,c=cx,on=([x,y])=>Math.abs(x-cam.x)<hw&&Math.abs(y-cam.y)<hh;c.lineCap='butt';
 for(const pass of[0,1])for(const q of FSX.p)if(on(q.a)){c.strokeStyle=pass?q.col:q.edge;c.lineWidth=q.w+(pass?0:1.2);c.beginPath();c.moveTo(...q.a);c.lineTo(...q.b);c.stroke()}
 for(const a of FSX.a)if(on(a.o[0])){c.beginPath();a.o.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle='#dccbb4';c.fill();c.strokeStyle='#b9a68d';c.lineWidth=.6;c.stroke()}
 c.lineCap='round'}
/* the Disney Skyliner's cabins: on each line they go out along one cable and back along the other, about 55 m apart at
   about 5 m/s, hanging under the cable; white with a coloured band, lit inside after dark. They run from an hour before
   EPCOT and Hollywood Studios open until an hour after they close, and are put away the rest of the time */
const SKYP=OSM.skyliner?OSM.skyliner.lines.map(L=>({o:mkPath(skyOff(L.p,3)),r:mkPath(skyOff(L.p,-3).reverse())})):[],SKYCOL=['#e9573f','#3b8fd9','#f2c230','#6cbf5c','#a66ad9','#ff8fb1','#2bb3b1'];
const skyOpen=()=>T>=(Math.min(EOPEN,HOPEN)-1)*3600&&T<(Math.max(ECLOSE,HCLOSE)+1)*3600;
function drawSkyliner(glow){if(!SKYP.length||!skyOpen()||(glow&&nf<.35))return;const z=zf(),hw=cw/2/z+20,hh=ch/2/z+40,E=SKY_E(),c=cx,v=5*OSM.S,gap=55,lit=nf>.35;let k=0;
 for(const L of SKYP)for(const P of[L.o,L.r]){const n=Math.max(1,Math.floor(P.L/gap)),g=P.L/n;
  for(let i=0;i<n;i++,k++){const d=((T*v+i*g)%P.L+P.L)%P.L;if(d<6||d>P.L-6)continue;const[x,y]=P.at(d);if(Math.abs(x-cam.x)>hw||Math.abs(y-E-cam.y)>hh)continue;
   const yy=y-E;if(glow){c.fillStyle=`rgba(255,220,140,${.85*Math.min(1,nf)})`;c.fillRect(x-1.4,yy+2.1,2.8,1.1);continue} /* after the night tint: the lit cabins glow */
   c.fillStyle='rgba(30,40,40,.16)';c.fillRect(x-1.2,y-.4,3.4,1.2);c.strokeStyle='#5d636b';c.lineWidth=.35;c.beginPath();c.moveTo(x,yy);c.lineTo(x,yy+1.6);c.stroke();
   c.fillStyle='#f6f6f2';c.beginPath();c.roundRect(x-1.9,yy+1.5,3.8,3.4,.9);c.fill();c.fillStyle=SKYCOL[k%SKYCOL.length];c.fillRect(x-1.9,yy+3.7,3.8,.9);
   c.fillStyle=lit?'#ffe6a0':'#3d4a5c';c.fillRect(x-1.4,yy+2.1,2.8,1.1)}}}
function drawLive(now){const t=now/1000,h=T/3600,open=T>=OPEN*3600&&T<CLOSE*3600;drawSafariAnimals();drawSafari();
 // spinning rides
 for(const a of SPIN){const run=aStat(a)==='Operating'&&a.ri.length>0,ang=run?t*1.4:0;for(let i=0;i<8;i++){const q=ang+i/8*6.283,x=a.x+Math.cos(q)*12,y=a.y+Math.sin(q)*5.5-(run?4:0);
   cx.fillStyle=['#ff6b8a','#ffd34d','#4ecdc4','#7b6cff'][i%4];cx.beginPath();cx.ellipse(x,y,2.3,1.6,0,0,7);cx.fill()}
  cx.fillStyle='#f0c040';cx.fillRect(a.x-.6,a.y-12,1.2,12);for(let i=0;i<8;i++){cx.fillStyle=i%2?'#e84a6a':'#fff';cx.beginPath();cx.moveTo(a.x,a.y-15);cx.arc(a.x,a.y-12,7,Math.PI+i/8*Math.PI,Math.PI+(i+1)/8*Math.PI);cx.fill()}}
 // PeopleMover trains and Speedway cars on their real tracks
 for(let i=0;i<6;i++){const[x,y,an]=PMP.at(((t*9+i*PMP.L/6)%PMP.L));if(SMB&&SMCTX.isPointInPath(SMB,x,y))continue; /* indoors through Space Mountain */cx.save();cx.translate(x,y);cx.rotate(an);cx.fillStyle='#e8eef5';cx.fillRect(-3,-1.3,6,2.6);cx.fillStyle='#4f84b2';cx.fillRect(-3,-.3,6,.7);cx.restore()}
 const RX=raceBridges();if(open)for(let i=0;i<6;i++){const[x,y,an]=RACEP.at(((t*14+i*RACEP.L/6)%RACEP.L));if(RX.some(q=>Math.hypot(q.h[0]-x,q.h[1]-y)<q.w/2+2.2))continue; /* under a footbridge */cx.save();cx.translate(x,y);cx.rotate(an);cx.fillStyle=['#e84a3c','#f2c14e','#4f84b2','#3fa060','#ff8fc8','#fff'][i];cx.fillRect(-1.6,-1,3.2,2);cx.restore()}
 raceBridgeDraw(RX);
 // Jungle Cruise launches circling the river
 if(open&&JCP)for(let i=0;i<3;i++){const[x,y,an]=JCP.at(((t*4+i*JCP.L/3)%JCP.L));cx.save();cx.translate(x,y);cx.rotate(an);cx.fillStyle='#e9dcc0';cx.fillRect(-4,-1.8,8,3.6);cx.fillStyle='#3f7a4f';cx.fillRect(-4,-2.6,8,1.2);cx.restore()}
 // horse-drawn streetcar on Main Street (daytime)
 if(h>9&&h<14.5&&TRAMP.L>10&&!paradeBusy()){const u=(T%480)/480,d=(u<.5?u*2:(1-u)*2)*TRAMP.L,[x,y,an]=TRAMP.at(d);cx.save();cx.translate(x,y);cx.rotate(an);cx.fillStyle='#8a4b2a';cx.fillRect(-4,-1.6,6,3.2);cx.fillStyle='#e8d7a8';cx.fillRect(-4,-1.9,6,.6);cx.fillStyle='#d9c3a0';cx.fillRect(2.5,-.8,3.2,1.6);cx.restore()}
 // Fire Rock Geyser: a column of white water out of the rocks, drifting off as spray, lit warm at night
 {const g=geyserNow();if(g>0){const[x0,y0]=P_.geyser,H=29*g,R=seeded(Math.floor(now/40));cx.save();
   const cg=cx.createLinearGradient(0,y0,0,y0-H);cg.addColorStop(0,'rgba(255,255,255,.95)');cg.addColorStop(.7,'rgba(240,248,255,.75)');cg.addColorStop(1,'rgba(240,248,255,0)');
   cx.fillStyle=cg;cx.beginPath();cx.moveTo(x0-2.2,y0);cx.quadraticCurveTo(x0-1,y0-H*.5,x0-1.6+Math.sin(now/300)*.6,y0-H);cx.lineTo(x0+1.8+Math.sin(now/300)*.6,y0-H);cx.quadraticCurveTo(x0+1.2,y0-H*.5,x0+2.2,y0);cx.fill();
   for(let i=0;i<70*g;i++){const u=R(),h=u*H,sp=(R()-.5)*(2.5+u*9),dr=u*u*5;cx.fillStyle=`rgba(255,255,255,${.55*(1-u)+.15})`;cx.beginPath();cx.arc(x0+sp+dr,y0-h+R()*2,.35+u*1.3,0,7);cx.fill()} /* spray, blown a little east */
   cx.fillStyle='rgba(255,255,255,.35)';cx.beginPath();cx.ellipse(x0+1,y0+.5,4+3*g,1.6+g,0,0,7);cx.fill(); /* splash at the base */
   cx.restore()}}
 // TRON's lightcycles: a train of blue and orange cycles launches under the canopy every minute or so
 {const a=AT.find(x=>x.k==='tron');if(TRONP&&a&&aStat(a)==='Operating'&&a.ri.length){const u=(t%70)/6;if(u<1){const e2=u*u*(3-2*u);cx.save();cx.globalCompositeOperation=nf>.3?'lighter':'source-over';
   for(let i=0;i<7;i++){const d=e2*(TRONP.L+40)-i*4.2;if(d<0||d>TRONP.L)continue;const[x,y,an]=TRONP.at(d);cx.save();cx.translate(x,y-1);cx.rotate(an);cx.fillStyle=i%2?'#ff9a3c':'#4fd2ff';cx.fillRect(-1.6,-.7,3.2,1.4);cx.fillStyle=i%2?'rgba(255,154,60,.35)':'rgba(79,210,255,.35)';cx.fillRect(-7,-.35,5.4,.7);cx.restore()}cx.restore()}}}
 // queues outside attractions
 for(const a of AT){const n=Math.min(90,a.q.length);if(!n)continue;const L=QLINE[a.i];cx.fillStyle='#ffffff';for(let i=0;i<n;i++){const[x,y,an]=L.at(Math.min(L.L-.01,1+(i>>1)*1.7)),o=i%2?.9:-.9;if(occ(x,y))continue; /* indoors or behind a building */cx.fillRect(x-Math.sin(an)*o-.75,y+Math.cos(an)*o-.75,1.5,1.5)}}
 // Walt Disney World Railroad train
 for(let i=0;i<5;i++){const[x,y,an]=RR.at((RRT-i*9+RR.L)%RR.L);cx.save();cx.translate(x,y);cx.rotate(an);cx.fillStyle=i?'#8a3b2c':'#2b2b2b';cx.fillRect(-4,-2.2,8,4.4);if(!i){cx.fillStyle='#f0c040';cx.fillRect(1.5,-1.6,2,3.2);cx.fillStyle='rgba(240,240,240,.7)';cx.beginPath();cx.arc(-5,-3,2,0,7);cx.fill()}else{cx.fillStyle='#f2e2c4';cx.fillRect(-3.4,-1.6,6.8,1)}cx.restore()}
 // monorail trains: six cars following the beam, hidden where the line runs inside the Contemporary
 const MI=OSM.monoIn;
 for(const m of MONO){for(let k=0;k<6;k++){const[mx,my,ma]=monoXY(m,22.5-k*9);if(MI&&mx>MI[0]&&mx<MI[2]&&my>MI[1]&&my<MI[3])continue;if(DL&&typeof dlInGCH==='function'&&dlInGCH(mx,my))continue; /* inside the Grand Californian, or behind it */cx.save();cx.translate(mx,my);cx.rotate(ma);
   cx.fillStyle='#fff';cx.beginPath();cx.roundRect(-4.7,-3,9.4,6,k===0?[1.2,3,3,1.2]:k===5?[3,1.2,1.2,3]:1.2);cx.fill();cx.fillStyle=m.col;cx.fillRect(-4.7,.5,9.4,1.5);
   cx.fillStyle='#223';if(k===0)cx.fillRect(1.6,-2.2,2.4,3.2);else if(k===5)cx.fillRect(-4,-2.2,2.4,3.2);else cx.fillRect(-3.2,-2,6.4,1.5);cx.restore()}}
 drawSkyliner(); drawPageant(now,0);
 for(const b of RBOAT)drawRiverboat(b,false); /* Disneyland's riverboats */
 // resort launches
 if(h>8.5&&h<23)for(const b of LAUNCH){const R=BOATR[b.r];let[x,y,an]=R.p.at(Math.min(b.x,R.p.L-.01));if(!R.loop){const o=b.dir*5*Math.sin(Math.PI*b.x/R.p.L);x-=Math.sin(an)*o;y+=Math.cos(an)*o} /* boats going opposite ways keep to their own side */cx.save();cx.translate(x,y);cx.rotate(an+(b.dir<0&&!R.loop?Math.PI:0));if(b.tm<=0){cx.fillStyle='rgba(255,255,255,.5)';cx.beginPath();cx.moveTo(-6,0);cx.lineTo(-18,-3);cx.lineTo(-18,3);cx.fill()}
   if(R.fs){ /* a Friendship boat: a long white catamaran-style hull, a teal canopy with a white roof stripe, windows down each side */
    if(b.tm<=0){cx.fillStyle='rgba(255,255,255,.45)';cx.beginPath();cx.moveTo(-10,0);cx.lineTo(-30,-5);cx.lineTo(-30,5);cx.fill()}
    cx.fillStyle='rgba(20,50,70,.22)';cx.beginPath();cx.roundRect(-10.5,-3.4,22,7.6,3);cx.fill();
    cx.fillStyle='#fbfaf6';cx.beginPath();cx.moveTo(-11,-4);cx.lineTo(7,-4);cx.quadraticCurveTo(12.5,-3,13,0);cx.quadraticCurveTo(12.5,3,7,4);cx.lineTo(-11,4);cx.closePath();cx.fill();
    cx.fillStyle=R.col;cx.beginPath();cx.roundRect(-9,-3.3,15,6.6,1.6);cx.fill();cx.fillStyle='#e8f4f6';cx.fillRect(-8,-.6,13,1.2);
    cx.fillStyle='#24384a';for(let i=0;i<5;i++){cx.fillRect(-8+i*2.8,-3.9,1.8,.7);cx.fillRect(-8+i*2.8,3.2,1.8,.7)}cx.restore();continue}
   cx.fillStyle='#fbf8f0';cx.beginPath();cx.moveTo(-7,-2.6);cx.lineTo(5,-2.6);cx.lineTo(8,0);cx.lineTo(5,2.6);cx.lineTo(-7,2.6);cx.fill();cx.fillStyle=R.col;cx.fillRect(-5,-2.6,9,5.2);cx.fillStyle='#f4e7b8';cx.fillRect(-4,-1.6,7,3.2);cx.restore()}
 for(const f of FERRY){const[x,y,an]=ferXY(f);cx.save();cx.translate(x,y);cx.rotate(an+(f.dir<0?Math.PI:0));if(f.st==='run'){cx.fillStyle='rgba(255,255,255,.55)';cx.beginPath();cx.moveTo(-16,0);cx.lineTo(-44,-6);cx.lineTo(-44,6);cx.fill()}
  cx.fillStyle='#fbf8f0';cx.beginPath();cx.moveTo(-18,-6);cx.lineTo(14,-6);cx.lineTo(20,0);cx.lineTo(14,6);cx.lineTo(-18,6);cx.fill();cx.fillStyle='#3a7bd5';cx.fillRect(-18,3,32,2);cx.fillStyle='#fff';cx.fillRect(-10,-4,18,7);cx.fillStyle='#c9463d';cx.fillRect(-3,-7,3,5);cx.restore()}
 fsBridges();
 for(const b of BUS){const[bx,by2,ba]=busXY(b);cx.save();cx.translate(bx,by2);cx.rotate(ba);cx.fillStyle='#fff';cx.fillRect(-8,-2.6,16,5.2);cx.fillStyle='#3a7bd5';cx.fillRect(-8,1,16,1.2);cx.fillStyle='#9fd0ff';for(let i=0;i<4;i++)cx.fillRect(-6.5+i*3.4,-1.8,2.4,1.6);cx.restore()}
 {const w=EV.find(e=>e.id==='welcome'),fl=EV.find(e=>e.id==='flag');
  if(w&&w.ph==='live'){const s=OSM.S*2.1;WELCOME_CAST.forEach((who,i)=>drawChar(cx,s,(P_.stage[0]+(i-(WELCOME_CAST.length-1)/2)*7)/s,(P_.stage[1]+2)/s,who,t)); // the welcome show: the characters on the castle stage,
   if(w.p>.9&&w._pop!==w.key){w._pop=w.key;for(let i=0;i<7;i++)launch([0,i%2?'peony':'chrys',(i-3)/3.4,.35+Math.random()*.4,[45,200,330,120][i%4],.8])}} // and a burst of daytime fireworks as the park opens
  if(fl&&fl.ph==='live'){const fp=P_.flagpole||P_.townsq;for(let i=0;i<6;i++){cx.fillStyle=i%2?'#c0392b':'#f4f0e6';cx.fillRect(fp[0]-13+i*4.4,fp[1]+9+Math.sin(now/180+i)*.8,2.4,3)}}} /* the band, in front of the flagpole */
 if(EV[2].ph==='live')for(let i=0;i<6;i++){cx.fillStyle=i%2?'#c0392b':'#f4f0e6';cx.fillRect(P_.townsq[0]-13+i*4.4,P_.townsq[1]+Math.sin(now/180+i)*.8,2.4,3)}
 // guests
 const CF=MAP.castleFoot||[0,0,0,0],inCastle=g=>g.x>CF[0]&&g.x<CF[2]&&g.y>CF[1]&&g.y<CF[3]; // walking through the castle passage: hidden inside it
 /* Every member of every party in view. Walking: the leader in front and the rest in pairs behind, along the way they
    are heading. Stopped: a loose knot. Zoomed far out, one dot per party is enough. */
 if(VIEW.layer==='crowds')crowdHeat();
 if(VIEW.guests){const z=zf(),x0=cam.x-cw/2/z-8,x1=cam.x+cw/2/z+8,y0=cam.y-ch/2/z-8,y1=cam.y+ch/2/z+8,lod=z*dpr<1.15;for(const b of GB)b.length=0;
  if(!OCC.R)occBuild();
  for(const g of guests){if(g.st===1||g.st===2||g.st===3||g.x<x0||g.x>x1||g.y<y0||g.y>y1||inCastle(g)||occ(g.x,g.y))continue; /* inside or behind a building */
   if(lod){GB[g.col].push(g.x,g.y);continue}
   const mv=g.st===0,s=g.seed;for(let k=0;k<g.n;k++){let px=g.x,py=g.y;
    if(k&&mv){const back=(k+1>>1)*1.55,side=(k&1?1:-1)*1.05+((s>>k*3&7)-3.5)*.12;px-=g.hx*back+g.hy*side;py-=g.hy*back-g.hx*side}
    else if(k){const a=(s>>k*2)%628/100+k*2.1,r=1.3+(s>>k&3)*.35;px+=Math.cos(a)*r;py+=Math.sin(a)*r*.8}
    GB[(g.col+k*((s&3)+1))%6].push(px,py)}}
  const d=lod?Math.max(2.2,2/z):1.7;
  if(!lod){cx.fillStyle='rgba(30,40,30,.25)';for(const b of GB)for(let i=0;i<b.length;i+=2)cx.fillRect(b[i]-.35,b[i+1]+.45,d+.5,.8)}
  for(let c=0;c<6;c++){cx.fillStyle=SHIRT[c];const b=GB[c];for(let i=0;i<b.length;i+=2)cx.fillRect(b[i]-d/2,b[i+1]-d/2-.6,d,d)}}
 drawFlag(now);
 // parade: floats and performers on the real route, above the crowd
 drawParadeMap(now)}
/* ---------- screen-space overlays: land labels, callouts, pins ---------- */
const BUB_TOP={tree:34,track:-40,pm:10,round:24,mtn:44,mtn2:30,mtn3:34,dome:44,house:40,clock:30,fort:38,hut:22,spin:20,tron:22,box:28};
function bubble(x,y,big,small,o){o=o||{};const c=cx,w=o.w||Math.max(52,c.measureText?0:0),h=o.small?34:46;
 c.font='800 20px "Nunito Sans",Figtree,system-ui,sans-serif';const bw=Math.max(o.minW||50,c.measureText(big).width+18),bh=small?44:30;
 const x0=x-bw/2,y0=y-bh-7;c.save();c.shadowColor='rgba(20,30,60,.28)';c.shadowBlur=8;c.shadowOffsetY=2;c.fillStyle=o.sel?'#e9f1ff':'#fff';c.beginPath();c.roundRect(x0,y0,bw,bh,9);c.moveTo(x-6,y0+bh-.5);c.lineTo(x,y);c.lineTo(x+6,y0+bh-.5);c.fill();c.restore();
 if(o.sel){c.strokeStyle='#1a8fd6';c.lineWidth=2;c.beginPath();c.roundRect(x0,y0,bw,bh,9);c.stroke()}
 c.fillStyle=o.dim?'#8a92a6':'#1e2b4f';c.textAlign='center';c.textBaseline='alphabetic';c.font=`800 ${o.bigSize||20}px "Nunito Sans",Figtree,system-ui,sans-serif`;c.fillText(big,x,y0+(small?22:21));
 if(small){c.font='500 11px "Nunito Sans",Figtree,system-ui,sans-serif';c.fillStyle='#59627a';c.fillText(small,x,y0+37)}
 return[x0,y0,x0+bw,y0+bh]}
function pin(x,y,icon,o){const c=cx;c.save();c.shadowColor='rgba(20,30,60,.3)';c.shadowBlur=7;c.shadowOffsetY=2;c.fillStyle=o&&o.sel?'#e9f1ff':'#fff';c.beginPath();c.arc(x,y-24,15,Math.PI*.8,Math.PI*.2);c.lineTo(x,y);c.closePath();c.fill();c.restore();
 c.fillStyle='#1e2b4f';c.save();c.translate(x,y-24);ICON[icon](c);c.restore();return[x-15,y-40,x+15,y]}
const ICON={
 star:c=>{c.beginPath();for(let i=0;i<10;i++){const r=i%2?3.6:8.4,a=-Math.PI/2+i*Math.PI/5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.fill()},
 fork:c=>{c.fillRect(-4.5,-7,1.2,14);c.fillRect(-6.4,-7,1,5);c.fillRect(-2.6,-7,1,5);c.fillRect(-6.4,-3,4.8,1.2);c.beginPath();c.ellipse(4,-2.5,2.2,4.5,0,0,7);c.fill();c.fillRect(3.4,0,1.2,7)},
 bag:c=>{c.fillRect(-6,-3,12,10);c.strokeStyle='#1e2b4f';c.lineWidth=1.6;c.beginPath();c.arc(0,-3,3.6,Math.PI,0);c.stroke()},
 train:c=>{c.beginPath();c.roundRect(-7,-7,14,11,3);c.fill();c.fillStyle='#fff';c.fillRect(-5,-5,10,4);c.fillStyle='#1e2b4f';c.fillRect(-6,5,3,2);c.fillRect(3,5,3,2)},
 boat:c=>{c.beginPath();c.moveTo(-8,1);c.lineTo(8,1);c.lineTo(5,6);c.lineTo(-5,6);c.fill();c.fillRect(-4,-5,8,5);c.fillRect(-1,-8,2,3)},
 bus:c=>{c.beginPath();c.roundRect(-8,-6,16,11,2);c.fill();c.fillStyle='#fff';c.fillRect(-6,-4,12,4);c.fillStyle='#1e2b4f';c.fillRect(-6,5,3,2);c.fillRect(3,5,3,2)}};
function drawOverlays(z,now){BUB=[];const c=cx;c.setTransform(dpr,0,0,dpr,0,0);const taken=[];const fits=r=>!taken.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1]);
 const place=(r,item,force)=>{if(force||fits(r)){taken.push(r);BUB.push({r,item});return true}return false};
 // land name pills
 if(VIEW.labels){c.font='700 12px "Nunito Sans",Figtree,system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
  const busy=VIEW.layer==='crowds'?k=>{let m=0;for(const g of guests)if((g.st===0||g.st===4||g.st===5)&&Math.hypot(g.x-LANDS[k][1],g.y-LANDS[k][2])<120)m++;return' · ~'+(m*K).toLocaleString()}:null; /* Crowds layer: how many people are out and about in each land */
  for(const k in LANDS){if(k==='hub')continue;const[n0,x,y]=LANDS[k],n=busy?n0+busy(k):n0,[sx,sy]=toS(x,y);const tw=c.measureText(n).width+18;
   c.fillStyle='rgba(40,46,66,.66)';c.beginPath();c.roundRect(sx-tw/2,sy-11,tw,22,11);c.fill();c.fillStyle='#fff';c.fillText(n,sx,sy+.5)}
  // resorts and the Ticket Center (teal pills), and the lagoon's name on the water
  if(VIEW.layer!=='transport')for(const k in RESORTS){if(k==='mk')continue;const n=z<.9?RESORTS[k].n.replace('Disney’s ','').replace(/ Resort.*/,'').replace('Transportation and Ticket Center','Ticket Center'):RESORTS[k].n.replace('Disney’s ',''),[sx,sy]=toS(RESORTS[k].c[0],RESORTS[k].c[1]-22);const tw=c.measureText(n).width+18;
   c.fillStyle=sel&&sel.k==='r'&&sel.i===k?'rgba(26,143,214,.92)':'rgba(18,96,110,.8)';c.beginPath();c.roundRect(sx-tw/2,sy-11,tw,22,11);c.fill();c.fillStyle='#fff';c.fillText(n,sx,sy+.5)}
  if(OSM.hs&&P_.hsbooth){const[ex,ey]=toS(P_.hsbooth[0]+30,P_.hsbooth[1]-40);if(ex>-200&&ex<cw+200&&ey>-60&&ey<ch+60){c.font='800 15px "Nunito Sans",Figtree,system-ui,sans-serif';const L='HOLLYWOOD STUDIOS',tw=c.measureText(L).width+26;c.fillStyle='rgba(150,40,50,.82)';c.beginPath();c.roundRect(ex-tw/2,ey-13,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText(L,ex,ey+.5)}} /* the park's name over its entrance */
  if(DL){const pill=(L,x,y,col,f)=>{const[ex,ey]=toS(x,y);if(ex<-200||ex>cw+200||ey<-60||ey>ch+60)return;c.font=f;const tw=c.measureText(L).width+26;c.fillStyle=col;c.beginPath();c.roundRect(ex-tw/2,ey-13,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText(L,ex,ey+.5)},F1='800 15px "Nunito Sans",Figtree,system-ui,sans-serif';
   /* each park's name over its gate (on the Esplanade side), and Downtown Disney */
   pill('DISNEYLAND',P_.gatexy[0],P_.gatexy[1]-30,'rgba(170,50,70,.85)',F1);pill('CALIFORNIA ADVENTURE',P_.epgatexy[0],P_.epgatexy[1]+34,'rgba(40,90,150,.85)',F1);
   if(P_.dd&&z>.3)pill('DOWNTOWN DISNEY',P_.dd[0],P_.dd[1]-30,'rgba(30,110,120,.85)','800 13px "Nunito Sans",Figtree,system-ui,sans-serif');c.font='700 12px "Nunito Sans",Figtree,system-ui,sans-serif'}
  if(P_.ds){const pill=(L,x,y,col,f)=>{const[ex,ey]=toS(x,y);if(ex<-200||ex>cw+200||ey<-60||ey>ch+60)return;c.font=f;const tw=c.measureText(L).width+26;c.fillStyle=col;c.beginPath();c.roundRect(ex-tw/2,ey-13,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText(L,ex,ey+.5)};
   pill('DISNEY SPRINGS',P_.ds[0],P_.ds[1]-60,'rgba(30,110,120,.85)','800 15px "Nunito Sans",Figtree,system-ui,sans-serif'); /* the shopping district, and the water park next door */
   if(P_.typhoon&&z>.25)pill('Typhoon Lagoon',P_.typhoon[0],P_.typhoon[1]-40,'rgba(18,96,110,.8)','700 12px "Nunito Sans",Figtree,system-ui,sans-serif')}
  if(OSM.ak&&P_.akbooth){const pill=(L,x,y,col,f)=>{const[ex,ey]=toS(x,y);if(ex<-200||ex>cw+200||ey<-60||ey>ch+60)return;c.font=f;const tw=c.measureText(L).width+26;c.fillStyle=col;c.beginPath();c.roundRect(ex-tw/2,ey-13,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText(L,ex,ey+.5)};
   pill('ANIMAL KINGDOM',P_.akbooth[0],P_.akbooth[1]-50,'rgba(46,110,58,.85)','800 15px "Nunito Sans",Figtree,system-ui,sans-serif'); /* the park's name over its entrance, and its resorts and water park round about */
   if(z>.25)for(const[k,L]of[['akl','Animal Kingdom Lodge'],['kidani','Kidani Village'],['csr','Coronado Springs'],['blizzard','Blizzard Beach'],['asports','All-Star Sports'],['amusic','All-Star Music'],['amovies','All-Star Movies']])if(P_[k])pill(L,P_[k][0],P_[k][1]-40,'rgba(18,96,110,.8)','700 12px "Nunito Sans",Figtree,system-ui,sans-serif')}
  if(EPCOT){const[ex,ey]=toS(EPCOT.sse[0],EPCOT.sse[1]-75);if(ex>-200&&ex<cw+200&&ey>-60&&ey<ch+60){c.font='800 15px "Nunito Sans",Figtree,system-ui,sans-serif';const tw=c.measureText('EPCOT').width+26;c.fillStyle='rgba(60,40,110,.8)';c.beginPath();c.roundRect(ex-tw/2,ey-13,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText('EPCOT',ex,ey+.5)}
   c.font='700 12px "Nunito Sans",Figtree,system-ui,sans-serif';if(z>.9)for(const p of EPCOT.pav){const[sx,sy]=toS(p.x,p.y-30);if(sx<-80||sx>cw+80||sy<-20||sy>ch+20)continue;const tw=c.measureText(p.n).width+18;c.fillStyle='rgba(40,46,66,.66)';c.beginPath();c.roundRect(sx-tw/2,sy-11,tw,22,11);c.fill();c.fillStyle='#fff';c.fillText(p.n,sx,sy+.5)}}
  c.font='italic 700 '+Math.max(12,Math.min(22,z*26))+'px "Nunito Sans",Figtree,system-ui,sans-serif';c.strokeStyle='rgba(30,90,120,.45)';c.lineWidth=3;
  for(const[n,p]of[...(DL?[['Rivers of America',P_.rivers&&z>.7?[P_.rivers[0]-20,P_.rivers[1]+40]:null],['Paradise Bay',P_.pbay&&z>.7&&!wocLive()?P_.pbay:null]]:[]),['Seven Seas Lagoon',LAGOON],['Bay Lake',BAYLAKE],['Discovery Island',P_.disc&&z>.7?[P_.disc[0],P_.disc[1]]:null],['World Showcase Lagoon',EPCOT&&!lumLive()?EPCOT.c:null]]){if(!p)continue;const[sx,sy]=toS(...p);c.fillStyle='rgba(255,255,255,.85)';c.strokeText(n,sx,sy);c.fillText(n,sx,sy)}}
 const isSel=(k,i)=>sel&&sel.k===k&&sel.i===i;
 if(document.body.classList.contains('idle')&&!(typeof TV!=='undefined'&&TV.on))return; /* full screen with controls faded: no callouts over the show */
 if(VIEW.layer==='wait'&&!VIEW.fwWaits&&fireEv()&&fireEv().ph==='live'){} // wait times stay out of the way during the fireworks (Filter turns them back on)
 else if(VIEW.layer==='wait'){const list=AT.filter(a=>VIEW.lands.has(a.l)).map(a=>{const s=aStat(a),ok=s==='Operating'||s==='Last riders';return{a,s,ok}}).filter(o=>!(VIEW.hideClosed&&!o.ok));
  list.sort((p,q)=>(isSel('a',q.a.i)-isSel('a',p.a.i))||(q.a.pop-p.a.pop));
  for(const{a,s,ok}of list){const[sx,sy]=toS(a.x,a.y-(BUB_TOP[a.k]||20));if(sx<-40||sx>cw+40||sy<-10||sy>ch+60)continue;
   const big=ok?String(a.wt):s==='Closed'?'Closed':s==='Delayed'?'Delayed':'Down',small=ok?'Min Wait':null;
   c.font='800 20px "Nunito Sans",Figtree,system-ui,sans-serif';const bw=Math.max(50,c.measureText(big).width+18),bh=small?44:30,r=[sx-bw/2,sy-bh-7,sx+bw/2,sy];
   if(place(r,{k:'a',i:a.i},isSel('a',a.i)))bubble(sx,sy,big,small,{sel:isSel('a',a.i),dim:!ok,bigSize:ok?20:13})}}
 else if(VIEW.layer==='shows'){const tvNow=typeof TV!=='undefined'&&TV.on; /* in TV mode the camera is already on whatever is on now, so its pin would only sit in the middle of the picture */
  for(const ev of EV){const p=EVPOS[ev.id];if(!p||(tvNow&&ev.ph==='live'))continue;const[sx,sy]=toS(p[0],p[1]-(ev.id==='fire'?60:6));const r=pin(sx,sy,'star',{sel:isSel('e',ev.id)});place(r,{k:'e',i:ev.id},true);
   const txt=ev.on===false?'Off':ev.ph==='live'?'Now':ev.ph==='gather'?'Soon':ev.nx!=null?fmt(ev.nx):'Done';c.font='800 12px "Nunito Sans",Figtree,system-ui,sans-serif';const tw=c.measureText(txt).width+12;
   c.fillStyle=ev.ph==='live'?'#1a8fd6':'#1e2b4f';c.beginPath();c.roundRect(sx-tw/2,sy+3,tw,18,9);c.fill();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,sx,sy+12.5)}
  {const p=tvNow&&ewpShow()?null:ewpCentre()||(EWP.legs&&EWP.on&&ewpNext()?EWP.spot[ewpNext().k]:null);if(p){const[sx,sy]=toS(p[0],p[1]-8),r=pin(sx,sy,'star',{sel:isSel('w',0)});place(r,{k:'w',i:0},true);const s=ewpShow(),n=ewpNext(),txt=s?'Now':n?fmt(n.t):'Done';c.font='800 12px "Nunito Sans",Figtree,system-ui,sans-serif';const tw=c.measureText(txt).width+12;
    c.fillStyle=s?'#1a8fd6':'#1e2b4f';c.beginPath();c.roundRect(sx-tw/2,sy+3,tw,18,9);c.fill();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,sx,sy+12.5)}}}
 else if(VIEW.layer==='dining'){for(const v of VN){if(!VIEW.lands.has(v.l||landOf(v.x,v.y))&&!(v.y>P_.hub[1]-10&&v.y<P_.townsq[1]-46))continue;const[sx,sy]=toS(v.x,v.y-10);const r=pin(sx,sy,v.k==='eat'?'fork':'bag',{sel:isSel('v',v.i)});place(r,{k:'v',i:v.i},true);
   if(z>1.6){c.font='700 11px "Nunito Sans",Figtree,system-ui,sans-serif';c.fillStyle='#1e2b4f';c.textAlign='center';c.strokeStyle='#fff';c.lineWidth=3;c.strokeText(v.n,sx,sy+12);c.fillText(v.n,sx,sy+12)}}}
 else if(VIEW.layer==='transport'){const eta=k=>{const e=monoEta(k)[0];return!e?'—':e.t<1?'Boarding':e.t<60?'Arriving':Math.round(e.t/60)+' min'};
  const dock=k=>boatsAt(RESORTS[k].boat).some(([R,b])=>b.tm>0&&Math.hypot(R.p.at(Math.min(b.x,R.p.L-.01))[0]-RESORTS[k].boat[0],R.p.at(Math.min(b.x,R.p.L-.01))[1]-RESORTS[k].boat[1])<70)?'Boat docked':'Boat on the way';
  const items=DL?Object.keys(RESORTS).filter(k=>MLINE.dl.stops.includes(k)).map(k=>['train',RESORTS[k].c,{k:'r',i:k},()=>eta(k)]):[...Object.keys(RESORTS).map(k=>RESORTS[k].boat?['boat',RESORTS[k].boat,{k:'r',i:k},()=>dock(k)]:['train',RESORTS[k].c,{k:'r',i:k},()=>eta(k)]),['boat',FER.p[0],{k:'f',i:0},()=>FERRY.some(f=>f.st==='dwell'&&f.p===0)?'Docked':'Crossing'],['boat',FER.p[FER.p.length-1],{k:'f',i:1},()=>FERRY.some(f=>f.st==='dwell'&&f.p===1)?'Docked':'Crossing'],['bus',P_.busstation,{k:'b',i:0},()=>BUS.some(b=>b.st==='dwell')?'Loading':'Next soon']];
  for(const[ic,[x,y],it,f]of items){const[sx,sy]=toS(x,y);const r=pin(sx,sy,ic,{});place(r,it,true);const txt=f();c.font='800 12px "Nunito Sans",Figtree,system-ui,sans-serif';const tw=c.measureText(txt).width+12;c.fillStyle='#1e2b4f';c.beginPath();c.roundRect(sx-tw/2,sy+3,tw,18,9);c.fill();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,sx,sy+12.5);
   if(it.k==='r'){const n=RESORTS[it.i].n.replace('Disney’s ','').replace(/ Resort.*/,'').replace('Transportation and Ticket Center','Ticket Center').replace(' Station','');c.font='700 11px "Nunito Sans",Figtree,system-ui,sans-serif';c.strokeStyle='rgba(20,30,50,.75)';c.lineWidth=3;c.strokeText(n,sx,sy+31);c.fillStyle='#fff';c.fillText(n,sx,sy+31)}}}
 // selection ring on the map
 if(sel&&(sel.k==='l'||sel.k==='m'||sel.k==='f'||sel.k==='r'||sel.k==='w'||sel.k==='g')){const p=selPos(sel);if(p){const[sx,sy]=toS(p[0],p[1]);c.strokeStyle='#1a8fd6';c.lineWidth=2.5;c.beginPath();c.arc(sx,sy,18+2*Math.sin(now/250),0,7);c.stroke()}}}
function vehPos(s){if(s.k==='g')return s.g.st===7?null:[s.g.x,s.g.y];if(s.k==='w')return ewpCentre()||(EWP.spot&&EWP.spot[(ewpNext()||EWP.shows[0]).k])||null;if(s.k==='parade'){const u=paradeUnits();return u.length?[u[0].x,u[0].y]:PR.at(0).slice(0,2)}if(s.k==='m')return monoXY(MONO[s.i]).slice(0,2);if(s.k==='f')return ferXY(FERRY[s.i]).slice(0,2);return null}
function selPos(s){if(s.k==='a')return[AT[s.i].x,AT[s.i].y];if(s.k==='v')return[VN[s.i].x,VN[s.i].y];if(s.k==='l')return[LANDS[s.i][1],LANDS[s.i][2]];if(s.k==='r')return RESORTS[s.i].c;if(s.k==='e')return EVPOS[s.i];return vehPos(s)}
