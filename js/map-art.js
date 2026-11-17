/* ===== AERIAL MAP ART =====
   A painted, 3/4 bird's-eye illustration of the park and the resort area around Seven Seas Lagoon, built into cached canvases:
   MAP.base  – ground, water, roads, paths, trees and buildings (daylight colours), the whole map at a modest resolution
   MAP.glow  – lit windows and lamps, added on top at night
   MAP.detail – sharper copies of the busy places (the park, each resort, the Ticket Center, EPCOT), painted when you zoom in near one
                and let go after a while away (detailTick)
                and drawn over the base when you zoom in. paintMap() makes every layer from the same data, so they line up.
   MAP.castle – the castle on its own (used as a mask for show projections)
   Coordinates are the simulator's map units (W×H). "Up" on screen is north; buildings show their roof
   and south face, the way theme-park guide maps are drawn. */
/* castle illustration (images/castle.png); loaded before the map is built, with the drawn castle as a fallback */
let CASTLE_IMG=null;
function loadCastleImage(){return new Promise(res=>{const i=new Image();i.onload=()=>{CASTLE_IMG=i;res()};i.onerror=()=>{console.warn('images/castle.png not found; using the drawn castle');res()};i.src='images/castle.png'})}
let MSS=3; // pixels per map unit in the close-up layers (2 on phones)
const MAP={};
function seeded(seed){let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647}}
const tone=(col,a)=>{let r,g,b;if(col[0]==='#'){const n=parseInt(col.slice(1),16);r=n>>16;g=n>>8&255;b=n&255}else{[r,g,b]=col.match(/[\d.]+/g).map(Number)}const t=a<0?0:255,p=Math.abs(a);return`rgb(${Math.round(r+(t-r)*p)},${Math.round(g+(t-g)*p)},${Math.round(b+(t-b)*p)})`};
const PAL={grass:'#94c45c',grass2:'#7fb04e',path:'#ede1d6',pathEdge:'#cbbcae',road:'#a9adb6',water:'#86cde0',waterEdge:'#5fb3cd',waterDeep:'#6fbfd6',
 tree:['#4f8f3f','#5b9b45','#3f7d37','#6aa74c','#477f3a'],trunk:'#6b4a30'};
/* ---------- painterly helpers ---------- */
function vnoise(seed){const h=(x,y)=>{let n=x*374761393+y*668265263+seed*144665;n=(n^(n>>>13))*1274126177;return((n^(n>>>16))>>>0)/4294967295};
 const sm=t=>t*t*(3-2*t);return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf}}
const NZ=vnoise(7),NZ2=vnoise(19);const fbm=(x,y)=>NZ(x/90,y/90)*.6+NZ(x/34,y/34)*.3+NZ2(x/12,y/12)*.1;
/* soft blur that works in every browser: shrink, then scale back up with smoothing */
function softBlur(src,f){const w=Math.max(1,src.width/f|0),h=Math.max(1,src.height/f|0),t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,w,h);
 const o=document.createElement('canvas');o.width=src.width;o.height=src.height;const y=o.getContext('2d');y.imageSmoothingQuality='high';y.drawImage(t,0,0,src.width,src.height);return o}
/* pre-lit tree-crown sprites (light from the upper left), a few colour families */
const CROWN=(()=>{const fam=[['#a9d46c','#62a03e','#3d7a32'],['#9cca64','#57943a','#356f2e'],['#97c774','#4f9246','#33683a'],['#b5d872','#76a63e','#4b7a2c'],['#8bc068','#448a3e','#2c5f30']];
 return fam.map(([hi,mid,lo],k)=>{const S=48,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),r=seeded(31+k);
  const ball=(bx,by,br)=>{const g=x.createRadialGradient(bx-br*.4,by-br*.45,br*.1,bx,by,br);g.addColorStop(0,hi);g.addColorStop(.55,mid);g.addColorStop(1,lo);x.fillStyle=g;x.beginPath();x.arc(bx,by,br,0,7);x.fill()};
  ball(24,25,17);for(let i=0;i<11;i++){const a=r()*6.283,d=5+r()*9;ball(24+Math.cos(a)*d,25+Math.sin(a)*d*.85-2,4.5+r()*4.5)}ball(19,18,6);return c})})();
const PINE=(()=>{const c=document.createElement('canvas');c.width=32;c.height=48;const x=c.getContext('2d');for(let i=0;i<3;i++){const y0=12+i*10,w=7+i*3.5;const g=x.createLinearGradient(16-w,0,16+w,0);g.addColorStop(0,'#6fa64a');g.addColorStop(.5,'#3c7a35');g.addColorStop(1,'#1f4f25');
  x.fillStyle=g;x.beginPath();x.moveTo(16,y0-10);x.lineTo(16+w,y0+8);x.lineTo(16-w,y0+8);x.closePath();x.fill()}x.fillStyle='#5b3d26';x.fillRect(14.5,40,3,6);return c})();
/* ---------- primitives ---------- */
function shadow(c,pts,dx,dy){c.fillStyle='rgba(30,50,20,.10)';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x+dx,y+dy):c.moveTo(x+dx,y+dy));c.closePath();c.fill()}
function poly(c,pts,fill){c.fillStyle=fill;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
/* Box building: plan footprint x0..x1 / y0..y1, height h (map units). o = {wall, roof, roofType, win, door, trim, dormers, glowWin} */
function building(c,e,x0,y0,x1,y1,h,o){const w=x1-x0,d=y1-y0,sk=o.sk??.32,dx=d*sk,sx=sk<0?x0:x1,rt=o.roofType||'gable',rh=o.rh??Math.min(d*.5,h*.7);
 const R=(x,y)=>[x+(y1-y)*sk,y-h]; // roof-plane point above plan (x,y)
 // south face (lit), with base shading
 const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,tone(o.wall,.12));g.addColorStop(1,tone(o.wall,-.04));c.fillStyle=g;c.fillRect(x0,y1-h,w,h);
 const ao=c.createLinearGradient(0,y1-h*.35,0,y1);ao.addColorStop(0,'rgba(0,0,0,0)');ao.addColorStop(1,'rgba(30,20,40,.22)');c.fillStyle=ao;c.fillRect(x0,y1-h*.35,w,h*.35);
 // east face (shade)
 poly(c,[[sx,y1],[sx,y1-h],[sx+dx,y0-h],[sx+dx,y0]],tone(o.wall,o.sideLit?-.08:-.28));
 if(o.sideLit){// a street-facing facade: shop windows, awning, upper windows along the side
  const n=Math.max(2,Math.round(d/2.6)),P=(t,v)=>[sx+dx*t,y1-v-d*t];
  for(let i=0;i<n;i++){const t0=(i+.2)/n,t1=(i+.8)/n;for(const[v0,v1,col]of[[.6,h*.32,'#cfe3ee'],[h*.48,h*.62,'#4f6f96'],[h*.72,h*.86,'#4f6f96']]){if(v1>h-.6)continue;poly(c,[P(t0,v0),P(t1,v0),P(t1,v1),P(t0,v1)],col);
    if(e&&o.glowWin!==false){e.fillStyle='rgba(255,205,130,.95)';e.beginPath();[P(t0,v0),P(t1,v0),P(t1,v1),P(t0,v1)].forEach(([x,y],k)=>k?e.lineTo(x,y):e.moveTo(x,y));e.fill()}}}
  if(o.awn){const m=Math.max(3,Math.round(d/1.1)),out=sk<0?1.4:-1.4;for(let i=0;i<m;i++){const t0=i/m,t1=(i+1)/m,a0=P(t0,h*.36),a1=P(t1,h*.36);poly(c,[a0,a1,[a1[0]+out,a1[1]+1.3],[a0[0]+out,a0[1]+1.3]],i%2?'#fff':o.awn)}}
  c.fillStyle=o.trim||'#fff';c.beginPath();const t0=P(0,h-.5),t1=P(1,h-.5);c.moveTo(...t0);c.lineTo(...t1);c.lineTo(t1[0],t1[1]+.6);c.lineTo(t0[0],t0[1]+.6);c.fill()}
 if(o.trim){c.fillStyle=o.trim;c.fillRect(x0,y1-h,w,Math.max(.6,h*.07));c.fillRect(x0,y1-Math.max(.9,h*.13),w,Math.max(.45,h*.04))}
 // windows: south face + a few on the east face
 const rows=Math.max(1,Math.round(h/5)),cols=Math.max(1,Math.round(w/3.6));
 for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const ww=Math.min(1.5,w/cols*.42),wh=Math.min(2.4,h/rows*.46),wx=x0+(k+.5)*w/cols-ww/2,wy=y1-h+h*(r+.3)/rows;
  c.fillStyle=tone(o.win||'#4f6f96',.0);c.fillRect(wx,wy,ww,wh);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(wx,wy,ww*.45,wh*.4);c.fillStyle=o.trim||'#fff';c.fillRect(wx-.2,wy+wh,ww+.4,.35);
  if(e&&o.glowWin!==false){e.fillStyle='rgba(255,200,120,.9)';e.fillRect(wx,wy,ww,wh)}}
 if(!o.sideLit)for(let r=0;r<rows;r++)for(let k=1;k<Math.max(2,d/4);k++){const t=k/Math.max(2,d/4),wx=sx+dx*t,wy=y1-h+h*(r+.32)/rows-d*t;c.fillStyle=tone(o.win||'#4f6f96',-.3);c.beginPath();c.moveTo(wx-.3,wy);c.lineTo(wx+.5,wy-.6);c.lineTo(wx+.5,wy+1.4);c.lineTo(wx-.3,wy+2);c.fill()}
 if(o.door){c.fillStyle=o.door;c.fillRect(x0+w/2-1.2,y1-Math.min(3.2,h*.5),2.4,Math.min(3.2,h*.5))}
 if(o.awn){const n=Math.max(2,Math.round(w/1.4));for(let i=0;i<n;i++){c.fillStyle=i%2?'#fff':o.awn;c.beginPath();c.moveTo(x0+i*w/n,y1-h*.42);c.lineTo(x0+(i+1)*w/n,y1-h*.42);c.lineTo(x0+(i+1)*w/n+.2,y1-h*.3);c.lineTo(x0+i*w/n+.2,y1-h*.3);c.fill()}}
 // roof
 const p00=R(x0,y0),p10=R(x1,y0),p11=R(x1,y1),p01=R(x0,y1);
 const shingles=(pts,col,n)=>{poly(c,pts,col);c.save();c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=.35;
  const[ax,ay]=pts[0],[bx,by]=pts[3];for(let i=1;i<n;i++){const t=i/n;c.beginPath();c.moveTo(ax+(bx-ax)*t-20,ay+(by-ay)*t);c.lineTo(ax+(bx-ax)*t+w+20,ay+(by-ay)*t);c.stroke()}c.restore()};
 if(rt==='flat'){poly(c,[p01,p11,p10,p00],tone(o.roof,.05));poly(c,[[p01[0]+.8,p01[1]-.6],[p11[0]-.8,p11[1]-.6],[p10[0]-.8,p10[1]+.6],[p00[0]+.8,p00[1]+.6]],tone(o.roof,-.06));c.fillStyle=tone(o.roof,.35);c.fillRect(p01[0],p01[1]-.5,w,.6)}
 else if(rt==='gable'||rt==='hip'){const m0=R(x0,(y0+y1)/2),m1=R(x1,(y0+y1)/2),up=rh*.8,ins=rt==='hip'?Math.min(w*.28,d*.5):0;
  const r0=[m0[0]+ins,m0[1]-up],r1=[m1[0]-ins,m1[1]-up];
  shingles([p00,p10,r1,r0],tone(o.roof,.22),5);shingles([r0,r1,p11,p01],o.roof,5);
  if(rt==='hip'){poly(c,[p01,p00,r0],tone(o.roof,.1));poly(c,[p11,p10,r1],tone(o.roof,-.25))}else{poly(c,sk<0?[p01,p00,r0]:[p11,p10,r1],tone(o.wall,-.3))}
  c.strokeStyle=tone(o.roof,.45);c.lineWidth=.45;c.beginPath();c.moveTo(...r0);c.lineTo(...r1);c.stroke()}
 else if(rt==='mansard'){poly(c,[p01,p11,p10,p00],tone(o.roof,-.05));const q=(p,dx2,dy2)=>[p[0]+dx2,p[1]+dy2];const i0=q(p01,1.6,-2.2),i1=q(p11,-1.6,-2.2),i2=q(p10,-1.6,1.4),i3=q(p00,1.6,1.4);
  poly(c,[p01,p11,i1,i0],o.roof);poly(c,[i0,i1,i2,i3],tone(o.roof,.3));for(let x=x0+2;x<x1-1;x+=3){c.fillStyle='#f6f1e6';c.fillRect(x-.8,p01[1]-2.1,1.6,1.8);c.fillStyle='#4f6f96';c.fillRect(x-.45,p01[1]-1.8,.9,1)}}
 if(o.dome){const cxm=(p00[0]+p10[0])/2,cy=(p00[1]+p01[1])/2;c.fillStyle=o.trim||'#fff';c.fillRect(cxm-2,cy-3,4,3.4);const dg=c.createRadialGradient(cxm-1,cy-6,.3,cxm,cy-4,3.6);dg.addColorStop(0,tone(o.dome,.4));dg.addColorStop(1,tone(o.dome,-.2));c.fillStyle=dg;c.beginPath();c.ellipse(cxm,cy-3,2.8,3.6,0,Math.PI,0);c.fill();c.fillStyle='#e8b84a';c.fillRect(cxm-.25,cy-8.2,.5,1.8)}
 if(o.flag){const[fx,fy]=p00;c.strokeStyle='#eee';c.lineWidth=.4;c.beginPath();c.moveTo(fx+1,fy);c.lineTo(fx+1,fy-5);c.stroke();poly(c,[[fx+1,fy-5],[fx+4,fy-4.3],[fx+1,fy-3.6]],o.flag)}}
function tree(c,x,y,r,col,kind){
 c.fillStyle='rgba(25,45,20,.25)';c.beginPath();c.ellipse(x+r*.55,y+r*.25,r*1.05,r*.6,0,0,7);c.fill();
 if(kind==='pine'){c.fillStyle=tone(col,-.2);poly(c,[[x-r*.85,y],[x,y-r*2.4],[x+r*.85,y]],tone(col,-.15));poly(c,[[x-r*.7,y-r*.6],[x,y-r*2.6],[x+r*.2,y-r*.6]],tone(col,.1));return}
 if(kind==='palm'){c.strokeStyle='#8a6a45';c.lineWidth=r*.22;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+r*.3,y-r,x+r*.1,y-r*1.8);c.stroke();
  for(let i=0;i<7;i++){const a=i/7*6.283,ex=x+r*.1+Math.cos(a)*r*1.1,ey=y-r*1.8+Math.sin(a)*r*.6;c.strokeStyle=i%2?'#4f9a3c':'#3f8530';c.lineWidth=r*.28;c.beginPath();c.moveTo(x+r*.1,y-r*1.8);c.quadraticCurveTo((x+ex)/2,y-r*2.3,ex,ey);c.stroke()}return}
 c.fillStyle=tone(col,-.18);c.beginPath();c.arc(x,y-r*.7,r,0,7);c.fill();
 c.fillStyle=col;c.beginPath();c.arc(x-r*.12,y-r*.85,r*.86,0,7);c.fill();
 c.fillStyle=tone(col,.2);c.beginPath();c.arc(x-r*.35,y-r*1.15,r*.45,0,7);c.fill()}
function flowerBed(c,x,y,rx,ry,seed){const r=seeded(seed);c.fillStyle='#7cb85a';c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
 for(let i=0;i<rx*ry*.5;i++){const a=r()*6.283,q=Math.sqrt(r());c.fillStyle=['#ff5e7e','#ffd34d','#ff8fc8','#ffffff','#e84a3c','#b06ae8'][r()*6|0];c.fillRect(x+Math.cos(a)*rx*q*.9,y+Math.sin(a)*ry*q*.9,.9,.9)}}
/* ---------- Cinderella Castle (front elevation, metres; u across, v up) ----------
   Massing follows the real castle: a wide rusticated stone base with a pointed-arch passage and round corner
   bastions, a crenellated second tier, then clusters of slender turrets stepping up to one tall central spire. */
const CST={ // [u, v0 base, width, wall height, cone height, layer 0 back → 4 front]
 towers:[[-9,24,4.6,20,11,0],[9,24,4.6,20,11,0],[-4,40,3,9,8,0],[4,40,3,9,8,0],
  [-15,18,4.2,16,10,1],[15,18,4.2,16,10,1],[-21,9,5.6,18,11,1],[21,9,5.6,18,11,1],
  [-6,30,3.2,10,8.5,2],[6,30,3.2,10,8.5,2],[-17.5,16,2.6,12,9,2],[17.5,16,2.6,12,9,2],[-11.5,12,2.2,9,6.5,3],[11.5,12,2.2,9,6.5,3],
  [-27,0,7,14,8,4],[27,0,7,14,8,4],[-7,8,2.6,9,7,4],[7,8,2.6,9,7,4]],
 walls:[[-28,0,28,10,'base'],[-21,9,21,19,'tier'],[-13,18,13,30,'tier'],[-7,28,7,38,'tier']]};
function castleArt(c,e,ox,oy,k,sy){const P=(u,v)=>[ox+u*k,oy-v*k*sy];
 const WALL1='#f5d9df',WALL2='#d3a9b6',STONE1='#e4ddd6',STONE2='#b9b0a8',GOLD='#f2c444',RF1='#7aa2f2',RF2='#2c55cf',RF3='#18338f';
 c.save();c.lineJoin='round';
 // rocky base and moat wall
 const rk=c.createLinearGradient(0,oy-6,0,oy+7);rk.addColorStop(0,'#cfc5b6');rk.addColorStop(1,'#8f8576');c.fillStyle=rk;c.beginPath();c.moveTo(...P(-34,-2));c.quadraticCurveTo(...P(-26,4),...P(0,3));c.quadraticCurveTo(...P(26,4),...P(34,-2));c.quadraticCurveTo(...P(0,-6),...P(-34,-2));c.fill();
 const gwin=(u,v,w,h,lit)=>{const[x,y]=P(u-w/2,v),ww=w*k,hh=h*k*sy;const path=ctx=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-hh*.62);ctx.quadraticCurveTo(x,y-hh*.9,x+ww/2,y-hh);ctx.quadraticCurveTo(x+ww,y-hh*.9,x+ww,y-hh*.62);ctx.lineTo(x+ww,y);ctx.closePath()};
  c.fillStyle='#34407a';path(c);c.fill();if(e&&lit!==false){e.fillStyle='rgba(255,205,125,.95)';path(e);e.fill()}};
 const crenel=(u0,u1,v,col)=>{c.fillStyle=col;const n=Math.max(3,Math.round((u1-u0)/1.3));for(let i=0;i<n;i+=2){const a=u0+(u1-u0)*i/n,b=u0+(u1-u0)*(i+1)/n,[x,y]=P(a,v+1);c.fillRect(x,y,(b-a)*k,k*sy)}};
 const tower=([u,v0,w,h,rh])=>{const[x,y]=P(u-w/2,v0+h),g=c.createLinearGradient(x,0,x+w*k,0);g.addColorStop(0,'#fff8f8');g.addColorStop(.5,WALL1);g.addColorStop(1,WALL2);
  c.fillStyle=g;c.fillRect(x,y,w*k,h*k*sy);
  // corbelled gold band under the roof
  c.fillStyle=GOLD;c.fillRect(x-.25*k,y,(w+.5)*k,Math.max(.35,.45*k*sy));c.fillStyle='rgba(120,90,40,.35)';c.fillRect(x-.25*k,y+.45*k*sy,(w+.5)*k,Math.max(.2,.2*k*sy));
  for(let v=v0+2.4;v<v0+h-2.6;v+=4.4)gwin(u,v,Math.min(1.1,w*.24),2.2);
  if(rh>0){const rg=c.createLinearGradient(x,0,x+w*k,0);rg.addColorStop(0,RF1);rg.addColorStop(.42,RF2);rg.addColorStop(1,RF3);c.fillStyle=rg;c.beginPath();
   c.moveTo(...P(u-w/2-.45,v0+h));c.quadraticCurveTo(...P(u-w*.12,v0+h+rh*.35),...P(u,v0+h+rh));c.quadraticCurveTo(...P(u+w*.12,v0+h+rh*.35),...P(u+w/2+.45,v0+h));c.closePath();c.fill();
   c.fillStyle=GOLD;c.fillRect(...P(u-w*.2,v0+h+rh*.42),w*.4*k,Math.max(.3,.35*k*sy)); // gold roof band
   c.strokeStyle=GOLD;c.lineWidth=Math.max(.35,.22*k);c.beginPath();c.moveTo(...P(u,v0+h+rh));c.lineTo(...P(u,v0+h+rh+2.2));c.stroke();c.fillStyle=GOLD;c.beginPath();c.arc(...P(u,v0+h+rh+1.2),Math.max(.35,.32*k),0,7);c.fill()}};
 const wall=([u0,v0,u1,v1,kind])=>{const[x,y]=P(u0,v1),g=c.createLinearGradient(x,0,x+(u1-u0)*k,0);
  if(kind==='base'){g.addColorStop(0,STONE1);g.addColorStop(.6,'#efe9e2');g.addColorStop(1,STONE2);c.fillStyle=g;c.beginPath();c.moveTo(...P(u0-2,v0));c.lineTo(...P(u0,v1));c.lineTo(...P(u1,v1));c.lineTo(...P(u1+2,v0));c.closePath();c.fill();
   c.strokeStyle='rgba(110,100,95,.35)';c.lineWidth=Math.max(.25,.12*k);for(let v=v0+1.2;v<v1;v+=1.3){c.beginPath();c.moveTo(...P(u0-1.6,v));c.lineTo(...P(u1+1.6,v));c.stroke()}
   crenel(u0,u1,v1,STONE2)}
  else{g.addColorStop(0,'#fff6f6');g.addColorStop(.55,WALL1);g.addColorStop(1,WALL2);c.fillStyle=g;c.fillRect(x,y,(u1-u0)*k,(v1-v0)*k*sy);crenel(u0,u1,v1,WALL2);
   c.fillStyle=GOLD;c.fillRect(x,y+1*k*sy,(u1-u0)*k,Math.max(.3,.3*k*sy));for(let u=u0+2.4;u<u1-1.6;u+=3.2)if(Math.abs(u)>2.2)gwin(u,v0+2,1,3)}};
 // back towers, keep, upper tiers
 for(const t of CST.towers)if(t[5]===0)tower(t);
 wall(CST.walls[3]);
 // the keep: tall central tower with an octagonal lantern and the main spire
 tower([0,34,7.4,14,0]);tower([0,48,5,5.5,17]);gwin(0,40,2,5);
 for(const t of CST.towers)if(t[5]===1)tower(t);
 wall(CST.walls[2]);gwin(0,20,3.6,7.5); // great window
 for(const t of CST.towers)if(t[5]===2)tower(t);
 wall(CST.walls[1]);
 for(const t of CST.towers)if(t[5]===3)tower(t);
 wall(CST.walls[0]);
 // pointed-arch passage with gold trim
 const[gx,gy]=P(-4.2,0);const pw=8.4*k,ph=8.6*k*sy;c.fillStyle='#2e2933';c.beginPath();c.moveTo(gx,gy);c.lineTo(gx,gy-ph*.55);c.quadraticCurveTo(gx,gy-ph*.92,gx+pw/2,gy-ph);c.quadraticCurveTo(gx+pw,gy-ph*.92,gx+pw,gy-ph*.55);c.lineTo(gx+pw,gy);c.fill();
 c.strokeStyle=GOLD;c.lineWidth=Math.max(.5,.35*k);c.stroke();
 if(e){e.fillStyle='rgba(255,190,110,.6)';e.fillRect(gx+pw*.2,gy-ph*.5,pw*.6,ph*.5)}
 for(const t of CST.towers)if(t[5]===4)tower(t);
 c.restore()}
function turret(c,e,x,y){const w=5,h=9;c.fillStyle='rgba(30,40,30,.18)';c.beginPath();c.ellipse(x+3,y+1,4,2,0,0,7);c.fill();
 const g=c.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,'#fff3f4');g.addColorStop(.6,'#f1d3d8');g.addColorStop(1,'#c9a3ab');c.fillStyle=g;c.fillRect(x-w/2,y-h,w,h);c.fillStyle='#f0c040';c.fillRect(x-w/2,y-h,w,.6);
 c.fillStyle='#2e3f72';c.fillRect(x-.5,y-h+2.5,1,2);if(e){e.fillStyle='rgba(255,205,120,.95)';e.fillRect(x-.5,y-h+2.5,1,2)}
 const rg=c.createLinearGradient(x-w/2,0,x+w/2,0);rg.addColorStop(0,'#6f9cf0');rg.addColorStop(.45,'#2f5ad0');rg.addColorStop(1,'#1a3a96');c.fillStyle=rg;c.beginPath();c.moveTo(x-w/2-.6,y-h);c.quadraticCurveTo(x-1,y-h-4,x,y-h-9);c.quadraticCurveTo(x+1,y-h-4,x+w/2+.6,y-h);c.fill();
 c.fillStyle='#f0c040';c.fillRect(x-.25,y-h-10.5,.5,1.6)}
/* ---------- land lookup from the real land boundaries ---------- */
function landOf(x,y){for(const k in OSM.lands)if(ptIn(x,y,OSM.lands[k]))return k;let b='ms',d0=1e9;for(const k in LANDS){if(k==='hub')continue;const d=Math.hypot(LANDS[k][1]-x,LANDS[k][2]-y);if(d<d0){d0=d;b=k}}return d0<140?b:null}
// buildings outside the park take their look from the nearest resort
function resortOf(x,y){let b=null,d0=330;for(const k in RESORTS){if(k==='mk')continue;const c=RESORTS[k].c,d=Math.hypot(c[0]-x,c[1]-y);if(d<d0){d0=d;b=k}}return b}
const LANDSTYLE={ // [walls], [roofs]
 cont:[['#f3f0e8','#e9e5db','#f7f5ef'],['#d6d2c6','#c4c9cf','#b8bcc0']],
 poly:[['#c9a878','#b8905e','#d8bd90','#e6d3ae'],['#7a5a3a','#8f624e','#6b4a30','#94703f']],
 gf:[['#fbf8f2','#f6f1e7','#ffffff'],['#c0463a','#b53f36','#cc5548']],
 ttc:[['#ece4d4','#e0d8c6'],['#5f8f8a','#7a9aa8','#b8603a']],
 wl:[['#8a5a3a','#9a6a45','#7a4f32','#a87a52'],['#3f6b4a','#4a7a55','#35593f']],   // log lodge, green roofs
 fw:[['#a9825a','#b8905e','#8a6a45'],['#6b4a30','#7a5a3a','#4a6a45']],             // cabins and the settlement
 ms:[['#f2dcc4','#f6e7b4','#cfe2d1','#e9c7c9','#c9dceb','#efd3a8','#d9c8e6','#f4efe3'],['#b5463f','#3d6aa8','#3f7a4f','#7b4a8c','#c98a2c','#4b5d73','#9b3b3b']],
 adv:[['#ead6ae','#e2c79a','#f0e2c4','#d9bf8f'],['#b8603a','#c9a45c','#a9523a','#8f6a3a']],
 fr:[['#b98352','#a06a42','#c8955f','#d2b48a'],['#6f4a2f','#8a5a3a','#5d4a3a','#7a3f2f']],
 lib:[['#b9563f','#efe8da','#a84a3a','#e6dccb','#4f6b8a'],['#566070','#3d4a5c','#6a5a4a','#4a4f58']],
 fan:[['#f4e8d6','#f1dcc8','#e8d9ef','#f6efe0'],['#6a4fb0','#3f6ad0','#b33a4a','#2f7a6a','#8a4fb0']],
 tom:[['#e4ebf3','#d6e0ec','#eef2f7'],['#9fbfe0','#c7d3e2','#7fa2c9','#b7c4d6']],
 none:[['#d9d6cf','#cfccc4'],['#9aa0a6','#8d939a','#a8aaa6']]};
const hsh=i=>{i=(i*2654435761)>>>0;return(i^(i>>>15))>>>0};
function poly4(c,pts,fill){c.fillStyle=fill;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function bbox(p){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const[x,y]of p){if(x<a)a=x;if(y<b)b=y;if(x>c)c=x;if(y>d)d=y}return[a,b,c,d]}
function pathOf(c,p,close){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath()}
function areaPath(c,a){c.beginPath();for(const ring of[a.o,...(a.i||[])]){ring.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}}
/* oblique extrusion of a real building footprint: roof lifted by its height, south-facing walls visible */
function extrude(c,e,poly,hh,wall,roof,o){o=o||{};const n=poly.length;let A=0;for(let i=0;i<n;i++){const p=poly[i],q=poly[(i+1)%n];A+=p[0]*q[1]-q[0]*p[1]}const sgn=A>0?1:-1;
 const walls=[];for(let i=0;i<n;i++){const p=poly[i],q=poly[(i+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1,nx=dy/L*sgn,ny=-dx/L*sgn;if(ny>0.02)walls.push([p,q,nx,ny,L])}
 walls.sort((u,v)=>Math.max(u[0][1],u[1][1])-Math.max(v[0][1],v[1][1]));
 for(const[p,q,nx,ny,L]of walls){const sh=.06-nx*.22-(1-ny)*.08;poly4(c,[p,q,[q[0],q[1]-hh],[p[0],p[1]-hh]],tone(wall,sh));
  if(L>3&&hh>3&&!o.noWin){const rows=Math.max(1,Math.floor(hh/3.6)),cols=Math.max(1,Math.floor(L/3.1));for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const t0=(k+.3)/cols,t1=(k+.7)/cols,v0=hh*(r+.32)/rows,v1=hh*(r+.68)/rows;
    const pts=[[p[0]+(q[0]-p[0])*t0,p[1]+(q[1]-p[1])*t0-v0],[p[0]+(q[0]-p[0])*t1,p[1]+(q[1]-p[1])*t1-v0],[p[0]+(q[0]-p[0])*t1,p[1]+(q[1]-p[1])*t1-v1],[p[0]+(q[0]-p[0])*t0,p[1]+(q[1]-p[1])*t0-v1]];
    poly4(c,pts,tone(o.win||'#4f6f96',sh*.5));if(e&&!o.noGlow&&(hsh(k*7+r*13+(p[0]|0))%10)<7)poly4(e,pts,'rgba(255,200,120,.9)')}}
  c.strokeStyle=tone(roof,-.35);c.lineWidth=.35;c.beginPath();c.moveTo(p[0],p[1]-hh);c.lineTo(q[0],q[1]-hh);c.stroke()}
 const top=poly.map(([x,y])=>[x,y-hh]);const bb=bbox(top);
 const g=c.createLinearGradient(bb[0],bb[1],bb[2],bb[3]);g.addColorStop(0,tone(roof,.18));g.addColorStop(1,tone(roof,-.12));poly4(c,top,g);
 c.save();c.beginPath();top.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.strokeStyle=tone(roof,.32);c.lineWidth=.9;c.stroke();
 if(o.ridge!==false){c.strokeStyle='rgba(0,0,0,.05)';c.lineWidth=.3;for(let y=bb[1]+3.4;y<bb[3];y+=3.4){c.beginPath();c.moveTo(bb[0],y);c.lineTo(bb[2],y);c.stroke()}}
 c.restore()}
// Main Street blocks are single footprints in the data; paint them as rows of individual storefront roofs
function storefronts(c,poly,hh,bb,seed){const top=poly.map(([x,y])=>[x,y-hh]),pal=LANDSTYLE.ms[1],R2=seeded(seed);c.save();pathOf(c,top,1);c.clip();
 const vertical=(bb[3]-bb[1])>(bb[2]-bb[0]);let p=vertical?bb[1]:bb[0];const end=vertical?bb[3]:bb[2];
 while(p<end){const w=5+R2()*6,col=tone(pal[(R2()*pal.length)|0],.22);c.fillStyle=col;if(vertical)c.fillRect(bb[0]-1,p-hh,bb[2]-bb[0]+2,w);else c.fillRect(p,bb[1]-hh-1,w,bb[3]-bb[1]+2);
  c.fillStyle='rgba(255,255,255,.35)';if(vertical)c.fillRect(bb[0]-1,p-hh,bb[2]-bb[0]+2,.5);else c.fillRect(p,bb[1]-hh-1,.5,bb[3]-bb[1]+2);
  // dormers and a few domes/cupolas
  if(R2()<.35){const cx_=vertical?(bb[0]+bb[2])/2:p+w/2,cy_=vertical?p+w/2-hh:(bb[1]+bb[3])/2-hh;c.fillStyle='#f6f1e6';c.fillRect(cx_-1,cy_-1.2,2,2);c.fillStyle='#4f6f96';c.fillRect(cx_-.5,cy_-.8,1,1)}
  p+=w}
 c.restore();c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.7;pathOf(c,top,1);c.stroke()}
/* The Contemporary's tower: an A-frame. Sloping east and west sides lined with balconies, a narrow flat roof, and a
   glass end wall facing south, where the monorail goes in. Drawn on the tower's real footprint (bb) at height hh. */
function aframe(c,e,bb,hh){const[x0,y0,x1,y1]=bb,ins=(x1-x0)*.3,L=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const SW=[x0,y1],SE=[x1,y1],NW=[x0,y0],NE=[x1,y0],tSW=[x0+ins,y1-hh],tSE=[x1-ins,y1-hh],tNW=[x0+ins,y0-hh],tNE=[x1-ins,y0-hh];
 const slope=(a,b,ta,tb,col,line)=>{poly4(c,[a,b,tb,ta],col);const n=13;for(let i=1;i<n;i++){const p=L(a,ta,i/n),q=L(b,tb,i/n);c.strokeStyle=line;c.lineWidth=.9;c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke();
   if(e){const m=Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/4);for(let k=0;k<m;k++)if(hsh(i*37+k*11)%10<6){const u=L(p,q,(k+.3)/m),v=L(p,q,(k+.7)/m);e.strokeStyle='rgba(255,205,130,.9)';e.lineWidth=.9;e.beginPath();e.moveTo(...u);e.lineTo(...v);e.stroke()}}}};
 slope(NW,SW,tNW,tSW,'#f6f3ec','#7f8fa6');slope(NE,SE,tNE,tSE,'#d5d1c7','#66758c');
 const g=c.createLinearGradient(tNW[0],0,tNE[0],0);g.addColorStop(0,'#ecebe6');g.addColorStop(1,'#c9cbcd');poly4(c,[tNW,tNE,tSE,tSW],g);
 // south end: glass in a white frame
 poly4(c,[SW,SE,tSE,tSW],'#f4f1ea');const in2=(p,q,t)=>L(p,q,t),a=in2(SW,SE,.1),b=in2(SW,SE,.9),ta=in2(tSW,tSE,.1),tb=in2(tSW,tSE,.9),g2=c.createLinearGradient(0,y1-hh,0,y1);g2.addColorStop(0,'#9fc3dc');g2.addColorStop(1,'#5f86a8');
 const A=L(a,ta,.04),B=L(b,tb,.04),TA=L(a,ta,.95),TB=L(b,tb,.95);poly4(c,[A,B,TB,TA],g2);if(e)poly4(e,[A,B,TB,TA],'rgba(255,214,150,.55)');
 c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.5;for(let i=1;i<10;i++){const p=L(A,TA,i/10),q=L(B,TB,i/10);c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke()}for(let i=1;i<6;i++){const p=L(A,B,i/6),q=L(TA,TB,i/6);c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke()}
 const mx=(x0+x1)/2;c.fillStyle='#2c3644';c.fillRect(mx-6,y1-13,12,6)} // where the monorail beams pass through
/* TRON Lightcycle / Run: the show building is a big dark box, and out front the coaster runs under its famous canopy:
   a long, wavy, translucent shell of panels held up on slim supports, pale silver-blue by day and edged in blue and
   orange light at night. Both are drawn on their real OpenStreetMap outlines. */
const TRON_LIFT=7;
// the TRON show building and its canopy (the largest open roof just in front of it), from the map data
function tronParts(){const b=OSM.buildings.find(q=>/TRON/.test(q.n)&&q.k!=='roof');if(!b)return{};const T=bbox(b.p);let cv=null,best=0;
 for(const q of OSM.buildings){if(q.k!=='roof'||q.p.length<3)continue;const r=bbox(q.p),x=(r[0]+r[2])/2,y=(r[1]+r[3])/2,ar=(r[2]-r[0])*(r[3]-r[1]);if(x>T[0]-120&&x<T[2]&&y>T[1]+40&&y<T[3]+50&&ar>best){best=ar;cv=q}}return{b,cv}}
function tronCanopy(c,e,p,bb){const top=p.map(([x,y])=>[x,y-TRON_LIFT]),path=(ctx,pts)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()};
 poly4(c,p,'rgba(20,30,50,.24)'); /* its shade on the ground */
 c.strokeStyle='#59616e';c.lineWidth=.55;for(let i=0;i<p.length;i+=7){const[x,y]=p[i];if(y<(bb[1]+bb[3])/2-6)continue;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-TRON_LIFT);c.stroke()} /* supports along the front */
 const g=c.createLinearGradient(bb[0],bb[1]-TRON_LIFT,bb[2],bb[3]-TRON_LIFT);g.addColorStop(0,'rgba(226,236,246,.93)');g.addColorStop(.45,'rgba(160,184,212,.9)');g.addColorStop(.7,'rgba(214,226,240,.92)');g.addColorStop(1,'rgba(150,172,200,.9)');
 c.save();path(c,top);c.fillStyle=g;c.fill();c.clip();
 c.strokeStyle='rgba(55,75,105,.38)';c.lineWidth=.4;for(let x=bb[0]-30;x<bb[2]+10;x+=3.4){c.beginPath();c.moveTo(x,bb[1]-TRON_LIFT-4);c.quadraticCurveTo(x+9,(bb[1]+bb[3])/2-TRON_LIFT,x+16,bb[3]-TRON_LIFT+4);c.stroke()} /* the panel ribs, sweeping across */
 c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=2.2;for(const k of[.3,.62]){c.beginPath();for(let x=bb[0];x<=bb[2];x+=4){const y=bb[1]+(bb[3]-bb[1])*k+Math.sin(x/9)*4-TRON_LIFT;x===bb[0]?c.moveTo(x,y):c.lineTo(x,y)}c.stroke()} /* sheen */
 c.restore();c.strokeStyle='#4e6a8a';c.lineWidth=.7;path(c,top);c.stroke();
 if(e){e.lineJoin='round';e.strokeStyle='rgba(70,200,255,1)';e.lineWidth=1.3;path(e,top);e.stroke();
  e.save();path(e,top);e.clip();e.strokeStyle='rgba(70,160,255,.35)';e.lineWidth=.5;for(let x=bb[0]-30;x<bb[2]+10;x+=6.8){e.beginPath();e.moveTo(x,bb[1]-TRON_LIFT-4);e.quadraticCurveTo(x+9,(bb[1]+bb[3])/2-TRON_LIFT,x+16,bb[3]-TRON_LIFT+4);e.stroke()}e.restore();
  e.strokeStyle='rgba(255,140,50,.95)';e.lineWidth=1;e.beginPath();const n=top.length;for(let i=Math.floor(n*.55);i<Math.floor(n*.8);i++)i===Math.floor(n*.55)?e.moveTo(...top[i]):e.lineTo(...top[i]);e.stroke()}}
function tronBuilding(c,e,q,hh){extrude(c,e,q.p,hh,'#323a48','#252c38',{noWin:true,noGlow:true,ridge:false});if(e){const top=q.p.map(([x,y])=>[x,y-hh]);e.strokeStyle='rgba(70,200,255,.85)';e.lineWidth=.8;e.beginPath();top.forEach(([x,y],i)=>i?e.lineTo(x,y):e.moveTo(x,y));e.closePath();e.stroke()}}
function tent(c,x,y,r,h,col){c.fillStyle='rgba(30,50,20,.22)';c.beginPath();c.ellipse(x+r*.4,y+1,r*1.1,r*.45,0,0,7);c.fill();const n=10;for(let i=0;i<n;i++)poly4(c,[[x,y-h],[x-r+i*2*r/n,y],[x-r+(i+1)*2*r/n,y]],i%2?col:'#fff');c.fillStyle='#f0c040';c.fillRect(x-.3,y-h-3,.6,3)}
function spaceDome(c,e,x,y,R){c.fillStyle='rgba(30,50,20,.22)';c.beginPath();c.ellipse(x+R*.3,y+R*.25,R*1.05,R*.55,0,0,7);c.fill();c.fillStyle='#d9dee6';c.beginPath();c.ellipse(x,y+R*.15,R,R*.5,0,0,7);c.fill();
 const g=c.createLinearGradient(x-R,0,x+R,0);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#e8edf3');g.addColorStop(1,'#b3bdcb');c.fillStyle=g;c.beginPath();c.moveTo(x-R,y+R*.15);c.quadraticCurveTo(x-R*.45,y-R*.85,x,y-R*1.05);c.quadraticCurveTo(x+R*.45,y-R*.85,x+R,y+R*.15);c.closePath();c.fill();
 c.strokeStyle='#9aa5b4';c.lineWidth=.5;for(let i=-6;i<=6;i++){c.beginPath();c.moveTo(x+i*R/6.5,y+R*.15+Math.abs(i)*.3);c.quadraticCurveTo(x+i*R/16,y-R*.6,x,y-R*1.05);c.stroke()}
 e.fillStyle='rgba(140,200,255,.8)';for(let i=-5;i<=5;i+=2)e.fillRect(x+i*R/6-.4,y+R*.1,.8,2)}
/* ---------- EPCOT ----------
   Its own look: Future World's white and silver show buildings, each World Showcase pavilion in its country's colours
   (found from the pavilion buildings' names in the map data), and Spaceship Earth as a faceted silver sphere. */
const EP_PAV=[['mexico','Mexico',/^Mexico Pavilion$/],['norway','Norway',/^Norway Pavilion$/],['china','China',/^China Pavilion$/],['germany','Germany',/^Germany Pavilion$/],
 ['italy','Italy',/^Tutto Italia|^Via Napoli/],['usa','The American Adventure',/^The American Adventure$/],['japan','Japan',/^Japan Pavilion$/],['morocco','Morocco',/^Restaurant Marrakesh$|^Spice Road Table$/],
 ['france','France',/^Impressions de France|^Souvenirs de France$/],['uk','United Kingdom',/^Rose & Crown/],['canada','Canada',/^Canada Far and Wide$/]];
const EPCOT=(()=>{if(!EPR||!OSM.epcot)return null;const pav=[];
 for(const[k,n,re]of EP_PAV){const bs=OSM.buildings.filter(b=>re.test(b.n)&&b.p.length>2);if(!bs.length)continue;let x=0,y=0;for(const b of bs){const r=bbox(b.p);x+=(r[0]+r[2])/2;y+=(r[1]+r[3])/2}pav.push({k,n,x:x/bs.length,y:y/bs.length})}
 let lag=OSM.places.epcot,best=0;for(const w of OSM.areas){if(w.k!=='water'||!(w.o[0][0]>EPR[0]&&w.o[0][1]>EPR[1]))continue;let A=0,X=0,Y=0;w.o.forEach(([x0,y0],i)=>{const[x1,y1]=w.o[(i+1)%w.o.length],f=x0*y1-x1*y0;A+=f;X+=(x0+x1)*f;Y+=(y0+y1)*f});if(Math.abs(A)>best){best=Math.abs(A);lag=[X/3/A,Y/3/A]}} /* World Showcase Lagoon: the biggest body of water in Epcot, labelled at its middle */
 return{pav,c:lag,sse:OSM.places.sse}})();
Object.assign(LANDSTYLE,{
 ep_fw:[['#eef1f5','#e2e7ee','#f6f7f9','#d9e0e8'],['#c3ccd7','#d8dfe7','#aab8c7','#e6ebf0']],
 ep_mexico:[['#d9a066','#e2b47e','#c98a4b'],['#8d5a3a','#a8693f']],ep_norway:[['#a5523a','#d8c9a8','#8a4a35'],['#3c4a3a','#4a3a2e']],
 ep_china:[['#c23b2b','#e6d2a8','#b23328'],['#2f6b5a','#d9a441','#2a5a4c']],ep_germany:[['#efe3c8','#d9b98a','#f2e6cf','#e8cfa6'],['#9b3d2b','#7a3a2a','#a8523a']],
 ep_italy:[['#e8c9a0','#d7a77b','#efd9b8'],['#b4553a','#a8483a']],ep_usa:[['#c8724f','#b9633f','#e9dfcf'],['#5b6b7a','#4f5a66']],
 ep_japan:[['#efe8dc','#e6dccb','#d8cbb5'],['#3b4148','#a8372d','#454b52']],ep_morocco:[['#e8d5b0','#d9c19a','#efe2c6'],['#3e8a7a','#4a9a88']],
 ep_france:[['#e6dccb','#efe6d6','#ddd0bb'],['#4f5966','#5a6470']],ep_uk:[['#d8cbb0','#8a5a45','#e6dccb','#7a4f3c'],['#5a5e66','#4a4e56','#6a4a3a']],
 ep_canada:[['#9a6a4a','#c9b79a','#8a5a3a'],['#4f6b4f','#3f5a45','#6a4a3a']]});
// which Epcot style a point takes: the nearest pavilion, Future World inside the park, or plain backstage grey outside it
function epLand(x,y){if(!EPCOT||x<EPR[0]||y<EPR[1]||x>EPR[2]||y>EPR[3])return null;if(!ptIn(x,y,OSM.epcot))return'none';
 let b=null,d0=95;for(const p of EPCOT.pav){const d=Math.hypot(p.x-x,p.y-y);if(d<d0){d0=d;b=p.k}}return b?'ep_'+b:'ep_fw'}
// Spaceship Earth: a silver geodesic sphere on its legs; at night its facets light up
function spaceshipEarth(c,e,x,y,R,S2){const yc=y-R*.25-R*S2*1.05;
 c.fillStyle='rgba(30,50,40,.25)';c.beginPath();c.ellipse(x+R*.7,y+R*.25,R*1.1,R*.55,0,0,7);c.fill();
 c.strokeStyle='#6d7682';c.lineWidth=R*.12;for(const dx of[-.45,.45,0]){c.beginPath();c.moveTo(x+dx*R,y+(dx?0:R*.25));c.lineTo(x+dx*R*.5,yc+R*.6);c.stroke()}
 const g=c.createRadialGradient(x-R*.4,yc-R*.45,R*.05,x,yc,R);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#d4dae2');g.addColorStop(.85,'#8f9aa8');g.addColorStop(1,'#727d8c');
 c.fillStyle=g;c.beginPath();c.arc(x,yc,R,0,7);c.fill();
 c.save();c.beginPath();c.arc(x,yc,R,0,7);c.clip();const s=R/6.5;c.strokeStyle='rgba(80,92,110,.32)';c.lineWidth=Math.max(.2,R*.012);
 for(const a of[0,Math.PI/3,-Math.PI/3]){const ca=Math.cos(a),sa=Math.sin(a);for(let k=-8;k<=8;k++){const ox=-sa*k*s,oy=ca*k*s;c.beginPath();c.moveTo(x+ox-ca*R*1.2,yc+oy-sa*R*1.2);c.lineTo(x+ox+ca*R*1.2,yc+oy+sa*R*1.2);c.stroke()}}
 c.restore();c.strokeStyle='#66717f';c.lineWidth=Math.max(.3,R*.02);c.beginPath();c.arc(x,yc,R,0,7);c.stroke();
 if(e){const h=e.createRadialGradient(x,yc,R*.2,x,yc,R*1.25);h.addColorStop(0,'rgba(150,110,255,.55)');h.addColorStop(.75,'rgba(80,140,255,.35)');h.addColorStop(1,'rgba(80,140,255,0)');e.fillStyle=h;e.beginPath();e.arc(x,yc,R*1.25,0,7);e.fill();
  e.fillStyle='rgba(235,240,255,.95)';const R2=seeded(77);for(let i=0;i<90;i++){const a=R2()*6.283,r=Math.sqrt(R2())*R*.95;e.fillRect(x+Math.cos(a)*r-.3,yc+Math.sin(a)*r-.3,.6,.6)}}}
// the Mexico pavilion's stepped pyramid
function stepPyramid(c,e,bb,hh){const cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2,w=Math.min(bb[2]-bb[0],bb[3]-bb[1])*.38;
 for(let i=0;i<5;i++){const s=w*(1-i*.17),top=cy_+s*.3-hh*(.4+i*.32),y0=cy_+s*.3-hh*(i*.32);poly4(c,[[cx_-s,y0],[cx_+s,y0],[cx_+s,top],[cx_-s,top]],i%2?'#c98a4b':'#b97a3e');poly4(c,[[cx_-s,top],[cx_+s,top],[cx_+s*.92,top-s*.55],[cx_-s*.92,top-s*.55]],i%2?'#e2b47e':'#d9a066')}
 if(e){e.fillStyle='rgba(255,190,110,.6)';e.fillRect(cx_-w*.6,cy_-hh*.2,w*1.2,1)}}
/* ---------- the build: everything from OpenStreetMap ---------- */
function buildMap(){
 const phone=Math.min(screen.width,screen.height)<700,P=OSM.places,box=(x0,y0,x1,y1,k)=>({x:Math.max(0,x0),y:Math.max(0,y0),w:Math.min(W,x1)-Math.max(0,x0),h:Math.min(H,y1)-Math.max(0,y0),k,base:null,glow:null});
 MSS=phone?2:3;const R0=REGIONS[0];MAP.mss=Math.min(MSS,Math.sqrt((phone?8e6:16e6)/((R0[2]-R0[0])*(R0[3]-R0[1]))));
 /* one layer per region at the same sharpness (Magic Kingdom first, then Epcot); the blank land between them isn't painted */
 MAP.layers=PARKR.map(R=>{const L={x:Math.max(0,R[0]),y:Math.max(0,R[1])};L.w=Math.min(W,R[2])-L.x;L.h=Math.min(H,R[3])-L.y;return Object.assign(L,paintMap(L.x,L.y,L.w,L.h,MAP.mss))});
 if(FULL)for(const L of MAP.layers)for(const q of[L.base,L.glow]){const c=q.getContext('2d'),s=q.width/L.w,F=50*s;c.globalCompositeOperation='destination-out'; /* fade each park's edges into the land around it */
  const side=(x0,y0,x1,y1,gx0,gy0,gx1,gy1)=>{const g=c.createLinearGradient(gx0,gy0,gx1,gy1);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x0,y0,x1-x0,y1-y0)};
  if(L.x>0)side(0,0,F,q.height,0,0,F,0);if(L.y>0)side(0,0,q.width,F,0,0,0,F);if(L.x+L.w<W-1)side(q.width-F,0,q.width,q.height,q.width,0,q.width-F,0);if(L.y+L.h<H-1)side(0,q.height-F,q.width,q.height,0,q.height,0,q.height-F);c.globalCompositeOperation='source-over'}
 MAP.base=MAP.layers[0].base;MAP.glow=MAP.layers[0].glow;
 /* the land between the parks: tiles, painted when they come into view and let go after a while away (detailTick) */
 MAP.tiles=[];if(FULL){const TS=1100,k=MAP.mss*.6;for(let y=0;y<H;y+=TS)for(let x=0;x<W;x+=TS){const w=Math.min(TS,W-x),h=Math.min(TS,H-y);if(PARKR.some(R=>x>=R[0]&&y>=R[1]&&x+w<=R[2]&&y+h<=R[3]))continue;MAP.tiles.push({x,y,w,h,k,base:null,glow:null})}}
 // close-up layers: the park (the railroad loop plus the entrance), then each stop on the monorail loop
 const rr=bbox(OSM.routes.rail);
 MAP.detail=[box(rr[0]-70,rr[1]-60,rr[2]+70,P.monostation[1]+90,MSS),box(P.cont[0]-230,P.cont[1]-230,P.cont[0]+300,P.cont[1]+200,MSS-.5),box(P.ttc[0]-230,P.ttc[1]-190,P.ttc[0]+250,P.ttc[1]+200,MSS-.5),
  box(P.poly[0]-260,P.poly[1]-280,P.poly[0]+260,P.poly[1]+190,MSS-.5),box(P.gf[0]-200,P.gf[1]-280,P.gf[0]+300,P.gf[1]+230,MSS-.5)];
 if(P.epcot&&OSM.epcot){const e=bbox(OSM.epcot);MAP.detail.push(box(e[0]-40,e[1]-40,e[2]+40,e[3]+40,MSS-.5))} /* Epcot close up */
 if(P.wl)MAP.detail.push(box(P.wl[0]-230,P.wl[1]-260,P.wl[0]+260,P.wl[1]+200,MSS-.5));if(P.fw)MAP.detail.push(box(P.fw[0]-220,P.fw[1]-130,P.fw[0]+230,P.fw[1]+330,MSS-.5));
 setTimeout(()=>{const d=MAP.detail[0];if(!d.base)Object.assign(d,paintMap(d.x,d.y,d.w,d.h,d.k))},400)} /* the park itself is wanted almost at once */
/* Close-up layers are painted only when you zoom in near one, and let go again after a while away, so only the ones
   in use take memory (each is tens of MB). Checked a few times a second; one is painted at a time. */
function detailTick(z){const now=performance.now();if(now-(MAP.dtAt||0)<300)return;MAP.dtAt=now;
 const want=z*dpr>MAP.mss*1.15||cam.tm*baseZ()*dpr>MAP.mss*1.15,views=[[cam.x,cam.y],[cam.tx,cam.ty]],hw=cw/2/z*1.6+150,hh=ch/2/z*1.6+150;
 for(const d of MAP.detail){const near=want&&views.some(([x,y])=>d.x<x+hw&&d.x+d.w>x-hw&&d.y<y+hh&&d.y+d.h>y-hh);
  if(near)d.seen=now;
  if(near&&!d.base&&!MAP.dtBusy){MAP.dtBusy=true;setTimeout(()=>{if(!d.base)Object.assign(d,paintMap(d.x,d.y,d.w,d.h,d.k));d.seen=performance.now();MAP.dtBusy=false},0)}
  else if(d.base&&!near&&now-(d.seen||0)>90e3&&d!==MAP.detail[0]){for(const k of['base','glow']){d[k].width=d[k].height=0;d[k]=null}}}
 const vw=cw/2/z+60,vh=ch/2/z+60;
 for(const d of MAP.tiles||[]){const near=views.some(([x,y])=>d.x<x+vw&&d.x+d.w>x-vw&&d.y<y+vh&&d.y+d.h>y-vh);if(near)d.seen=now;
  if(near&&!d.base&&!MAP.dtBusy){MAP.dtBusy=true;setTimeout(()=>{if(!d.base)Object.assign(d,paintMap(d.x,d.y,d.w,d.h,d.k));d.seen=performance.now();MAP.dtBusy=false},0)}
  else if(d.base&&!near&&now-(d.seen||0)>90e3){for(const k of['base','glow']){d[k].width=d[k].height=0;d[k]=null}}}} /* away for 90 s: let it go (the park's own stays) */
/* Paint the rectangle (rx,ry,rw,rh) of the map at `mss` pixels per map unit. Every call walks the same data in the same
   order with the same random seed, so a close-up layer is the same picture as the base, just sharper. */
/* Working masks (where trees may grow, the forests, the soft shadows) are kept at a reduced scale HS on a big map, so
   they stay a sensible size in memory (full size would be well over 100 MB each once Epcot is on the map). */
const HS=Math.min(1,Math.sqrt(8e6/(W*H)));
// the parts of the map that have content: Magic Kingdom and its resorts, and Epcot (the land between is left blank for now)
const REGIONS=OSM.regions||[[0,0,W,H]],inRegion=(x,y)=>REGIONS.some(r=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3]);
/* With the land between the parks filled in, OSM.regions has a third entry (the whole map). The two park areas are still
   painted as before; the land between is painted as tiles when it comes into view, and its forests are a canopy texture
   rather than one tree at a time (there are square kilometres of them). */
const PARKR=REGIONS.slice(0,2),FULL=REGIONS.length>2,inParkR=(x,y,m=0)=>PARKR.some(r=>x>=r[0]-m&&y>=r[1]-m&&x<=r[2]+m&&y<=r[3]+m);
function canopy(c){if(!MAP._canopy){const U=120,K=4,t=document.createElement('canvas');t.width=t.height=U*K;const x=t.getContext('2d');x.scale(K,K);x.fillStyle='#2a5a28';x.fillRect(0,0,U,U);const r=seeded(99),pts=[];
  for(let i=0;i<1700;i++)pts.push([r()*U,r()*U,3+r()*2.4,(r()*CROWN.length)|0]);pts.sort((p,q)=>p[1]-q[1]);
  const all=[];for(const[px,py,rd,v]of pts)for(const ox of[-U,0,U])for(const oy of[-U,0,U]){const X=px+ox,Y=py+oy;if(X>-8&&X<U+8&&Y>-8&&Y<U+8)all.push([X,Y,rd,v])}
  x.fillStyle='rgba(20,45,20,.22)';for(const[X,Y,rd]of all){x.beginPath();x.ellipse(X+rd*.6,Y-rd*.4,rd*1.2,rd*.85,0,0,7);x.fill()} /* the shadows first, then the tree tops nearest-last, so it tiles without seams */
  all.sort((p,q)=>p[1]-q[1]);for(const[X,Y,rd,v]of all)x.drawImage(CROWN[v],X-rd*1.25,Y-rd*2.2,rd*2.5,rd*2.5)
  MAP._canopy=t}
 const p=c.createPattern(MAP._canopy,'repeat');p.setTransform(new DOMMatrix().scale(1/4));return p}
const GLOWK=.5;
function paintMap(rx,ry,rw,rh,mss){
 const base=document.createElement('canvas'),glow=document.createElement('canvas'),blk=document.createElement('canvas');
 base.width=Math.round(rw*mss);base.height=Math.round(rh*mss);glow.width=Math.round(rw*mss*GLOWK);glow.height=Math.round(rh*mss*GLOWK); /* the night lights are soft glows: half the sharpness is plenty and saves the memory */if(!MAP.crowns){blk.width=Math.ceil(W*HS);blk.height=Math.ceil(H*HS)}else blk.width=blk.height=1; /* the tree mask is only needed the first time */
 const c=base.getContext('2d'),e=glow.getContext('2d'),b=blk.getContext('2d');b.scale(HS,HS);c.scale(mss,mss);e.scale(mss*GLOWK,mss*GLOWK);for(const q of[c,e])q.translate(-rx,-ry);c.lineJoin=c.lineCap='round';
 /* After the first paint (which also builds the whole-map masks), only what reaches this rectangle is drawn: a close-up
    is a small patch of a big map, and walking everything made each one take seconds and freeze the page. */
 const cull=!!MAP.crowns,MG=70,vis=bb=>!cull||bb[2]>rx-MG&&bb[0]<rx+rw+MG&&bb[3]>ry-MG&&bb[1]<ry+rh+MG*1.6,bbOf=o=>o._bb||(o._bb=bbox(o)),lp=l=>l.p.filter(q=>vis(bbOf(q)));
 const RA_=rw*rh/94e4; /* this rectangle's size relative to the park alone: sets how many sparkles and speckles */
 const r=seeded(4242),S2=OSM.S*.78,AREA=W*H/94e4; // S2: height foreshortening for the 3/4 view; AREA: map size relative to the park alone
 /* painterly grass */
 {let g=MAP._grass;if(!g){const gs=Math.min(.5,HS*.6),gw=W*gs|0,gh=H*gs|0;g=MAP._grass=document.createElement('canvas');g.width=gw;g.height=gh;const gx=g.getContext('2d'),im=gx.createImageData(gw,gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const n=fbm(x/gs,y/gs),i=(y*gw+x)*4;im.data[i]=118+n*60;im.data[i+1]=170+n*48;im.data[i+2]=72+n*22;im.data[i+3]=255}gx.putImageData(im,0,0)}c.imageSmoothingQuality='high';c.drawImage(g,0,0,W,H)}
 const A=OSM.areas,by=k=>A.filter(a=>a.k===k&&a.o.length>2&&vis(bbOf(a.o)));
 b.fillStyle='#000';b.strokeStyle='#000';b.lineCap=b.lineJoin='round'; // mask of where trees may not grow
 /* lawns, scrub, sand, parking, construction */
 for(const a of by('grass')){areaPath(c,a);c.fillStyle='#a6d36c';c.fill('evenodd');c.strokeStyle='rgba(60,110,40,.35)';c.lineWidth=.8;c.stroke()}
 for(const a of by('scrub')){areaPath(c,a);c.fillStyle='#8db560';c.fill('evenodd')}
 for(const a of by('sand')){areaPath(c,a);c.fillStyle='#eddcaa';c.fill('evenodd');areaPath(b,a);b.fill('evenodd')}
 for(const a of by('parking')){areaPath(c,a);c.fillStyle='#b4b8bf';c.fill('evenodd');areaPath(b,a);b.fill('evenodd')}
 for(const a of by('construction')){areaPath(c,a);c.fillStyle='#c9a77c';c.fill('evenodd');c.save();areaPath(c,a);c.clip('evenodd');const bb=bbox(a.o);
  for(let i=0;i<500;i++){c.fillStyle=r()<.5?'rgba(120,90,50,.25)':'rgba(255,240,210,.2)';c.beginPath();c.ellipse(bb[0]+r()*(bb[2]-bb[0]),bb[1]+r()*(bb[3]-bb[1]),1+r()*4,.6+r()*2,r()*3,0,7);c.fill()}
  c.strokeStyle='rgba(110,80,50,.35)';c.lineWidth=1.4;for(let i=0;i<30;i++){const x=bb[0]+r()*(bb[2]-bb[0]),y=bb[1]+r()*(bb[3]-bb[1]);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+16,y+8*(r()-.5),x+32,y+r()*8);c.stroke()}c.restore();
  c.strokeStyle='#5f6b62';c.lineWidth=1.2;c.setLineDash([3,1.5]);areaPath(c,a);c.stroke();c.setLineDash([]);areaPath(b,a);b.fill('evenodd');MAP.construction=a}
 /* forest floor */
 const forest=by('forest');for(const a of forest){areaPath(c,a);c.fillStyle='#4a8238';c.fill('evenodd')}
 if(FULL&&forest.length&&PARKR.some(R=>!(rx>=R[0]&&ry>=R[1]&&rx+rw<=R[2]&&ry+rh<=R[3]))){c.save();c.beginPath();c.rect(rx,ry,rw,rh);for(const R of PARKR)c.rect(R[0],R[1],R[2]-R[0],R[3]-R[1]);c.clip('evenodd'); /* outside the parks: a canopy of tree tops */
  const pat=canopy(c);for(const a of forest){areaPath(c,a);c.fillStyle=pat;c.fill('evenodd')}c.restore()}
 /* water: bank shadow, pale rim, turquoise, deeper centre */
 const water=by('water');
 for(const a of water){areaPath(c,a);c.strokeStyle='rgba(60,95,45,.35)';c.lineWidth=5;c.stroke();areaPath(b,a);b.fill('evenodd');b.lineWidth=6;b.stroke()}
 for(const a of water){c.save();areaPath(c,a);c.clip('evenodd');areaPath(c,a);c.fillStyle='#4fb3d0';c.fill('evenodd');
  for(const[w,col]of[[26,'#5cbcd6'],[14,'#6fcbe0'],[7,'#9fe0e8'],[2.4,'#d8f3f2']]){c.strokeStyle=col;c.lineWidth=w;areaPath(c,a);c.stroke()}c.restore()}
 for(const l of OSM.lines.filter(l=>l.k==='stream'))for(const p of lp(l)){c.strokeStyle='#8fd8e6';c.lineWidth=3;pathOf(c,p);c.stroke()}
 const onWater=(x,y)=>water.some(a=>{const q=bbOf(a.o);return x>=q[0]&&x<=q[2]&&y>=q[1]&&y<=q[3]&&ptIn(x,y,a.o)&&!(a.i||[]).some(h=>ptIn(x,y,h))});
 c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=.5;for(let i=0;i<1500*RA_;i++){const x=rx+r()*rw,y=ry+r()*rh;if(!onWater(x,y))continue;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+2,y-1,x+4,y);c.stroke()}
 /* roads (real alignments): resort drives, service roads; bus loops */
 {const RW={road1:8.5,road2:6.5,road3:3.8},roads=OSM.lines.filter(l=>RW[l.k]).sort((p,q)=>RW[p.k]-RW[q.k]);
  for(const pass of[0,1])for(const l of roads)for(const p of lp(l)){c.strokeStyle=pass?(l.k==='road3'?'#c3c5cb':'#b3b7c0'):'rgba(90,96,104,.55)';c.lineWidth=RW[l.k]+(pass?0:1.3);pathOf(c,p);c.stroke();if(!pass){b.lineWidth=RW[l.k]+5;pathOf(b,p);b.stroke()}}
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.45;c.setLineDash([3,3.5]);for(const l of roads)if(l.k!=='road3')for(const p of lp(l)){pathOf(c,p);c.stroke()}c.setLineDash([])}
 /* paved plazas and walkways */
 const PAVE='#ede1d6',EDGE='#cdbcae';
 for(const a of by('ped')){areaPath(c,a);c.strokeStyle=EDGE;c.lineWidth=1.4;c.stroke();c.fillStyle=PAVE;c.fill('evenodd');areaPath(b,a);b.fill('evenodd')}
 for(const p of OSM.paths.filter(p=>p.a&&vis(bbOf(p.p)))){c.fillStyle=PAVE;pathOf(c,p.p,1);c.fill();pathOf(b,p.p,1);b.fill()}
 const paths=OSM.paths.filter(p=>!p.a&&vis(bbOf(p.p)));
 for(const pass of[0,1])for(const p of paths){c.strokeStyle=pass?(p.q?'#e3d6c8':PAVE):EDGE;c.lineWidth=p.w+(pass?0:1.2);pathOf(c,p.p);c.stroke();if(!pass){b.lineWidth=p.w+6;pathOf(b,p.p);b.stroke()}}
 for(let i=0;i<5000*RA_;i++){const x=rx+r()*rw,y=ry+r()*rh;c.fillStyle=r()<.5?'rgba(170,140,120,.10)':'rgba(255,255,255,.12)';c.fillRect(x,y,.6,.6)}
 /* gardens: lawn beds with flower borders */
 for(const a of by('garden')){areaPath(c,a);c.fillStyle='#93c862';c.fill('evenodd');c.save();areaPath(c,a);c.clip('evenodd');c.strokeStyle='#5f9e45';c.lineWidth=1.6;areaPath(c,a);c.stroke();
  const L=a.o.length;for(let i=0;i<L;i++){const p=a.o[i],q=a.o[(i+1)%L],d=Math.hypot(q[0]-p[0],q[1]-p[1]);for(let t=0;t<d;t+=1.1){const x=p[0]+(q[0]-p[0])*t/d,y=p[1]+(q[1]-p[1])*t/d;c.fillStyle=['#e8455f','#f6c445','#ff8fc8','#ffffff','#e84a3c','#b06ae8'][hsh(i*31+(t*7|0))%6];c.beginPath();c.arc(x,y,.75,0,7);c.fill()}}c.restore();areaPath(b,a);b.fill('evenodd')}
 for(const a of[...by('bridge'),...by('pier')]){areaPath(c,a);c.fillStyle=a.k==='pier'?'#b98e5e':'#dccbb4';c.fill();c.strokeStyle=a.k==='pier'?'#8a6a45':'#b9a68d';c.lineWidth=.6;c.stroke()}
 for(const l of OSM.lines.filter(l=>l.k==='pier'))for(const p of lp(l)){c.strokeStyle='#b98e5e';c.lineWidth=2.5;pathOf(c,p);c.stroke()}
 for(const l of OSM.lines.filter(l=>l.k==='hedge'))for(const p of lp(l)){c.strokeStyle='#3f7a35';c.lineWidth=2.2;pathOf(c,p);c.stroke();b.lineWidth=4;pathOf(b,p);b.stroke()}
 /* railroad (real alignment), streetcar tracks, Speedway */
 const rail=OSM.routes.rail;c.strokeStyle='#8a7357';c.lineWidth=3.6;pathOf(c,rail);c.stroke();
 {const R_=mkPath(rail);c.strokeStyle='#5d4a36';c.lineWidth=.6;for(let d=0;d<R_.L;d+=2.4){const[x,y,a]=R_.at(d),nx=-Math.sin(a)*2.1,ny=Math.cos(a)*2.1;c.beginPath();c.moveTo(x-nx,y-ny);c.lineTo(x+nx,y+ny);c.stroke()}
  c.strokeStyle='#cfc8bc';c.lineWidth=.45;for(const off of[-1,1]){c.beginPath();for(let d=0;d<R_.L;d+=3){const[x,y,a]=R_.at(d);const px=x-Math.sin(a)*off,py=y+Math.cos(a)*off;d?c.lineTo(px,py):c.moveTo(px,py)}c.stroke()}}
 b.lineWidth=10;pathOf(b,rail);b.stroke();
 for(const l of OSM.lines.filter(l=>l.k==='rail'))for(const p of lp(l)){c.strokeStyle='#8a7357';c.lineWidth=3;pathOf(c,p);c.stroke()}
 {const T_=mkPath(OSM.routes.tram);c.strokeStyle='#8b8e94';c.lineWidth=.35;for(const off of[-.7,.7]){c.beginPath();for(let d=0;d<T_.L;d+=2){const[x,y,a]=T_.at(d);d?c.lineTo(x-Math.sin(a)*off,y+Math.cos(a)*off):c.moveTo(x-Math.sin(a)*off,y+Math.cos(a)*off)}c.stroke()}}
 const race=OSM.lines.filter(l=>l.k==='race');
 for(const[col,w]of[['rgba(30,40,30,.25)',7],['#5d636d',5],['#ffffff',.4]]){c.strokeStyle=col;c.lineWidth=w;if(w<1)c.setLineDash([2,2]);for(const l of race)for(const p of lp(l)){pathOf(c,p);c.stroke()}c.setLineDash([])}
 for(const l of race)for(const p of lp(l)){b.lineWidth=9;pathOf(b,p);b.stroke()}
 /* buildings, rockwork and trees, painted north-to-south so nearer things overlap farther ones */
 const{b:tronB,cv:tronCv}=tronParts();
 const B=[],late=[],castleB=OSM.buildings.find(q=>q.n==='Cinderella Castle');
 for(const q of OSM.buildings){if(q.p.length<3)continue;const bb=bbOf(q.p);if(!cull)b.fillRect(bb[0]-1,bb[1]-q.h*S2-1,bb[2]-bb[0]+2,bb[3]-bb[1]+q.h*S2+2);if(!vis(bb))continue;
  const cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2,land=epLand(cx_,cy_)||landOf(cx_,cy_)||resortOf(cx_,cy_)||'none',st=LANDSTYLE[land]||LANDSTYLE.none,hs=hsh(Math.round(cx_*31+cy_*17));
  if(q===castleB||(castleB&&ptIn(cx_,cy_,castleB.p))||q.n==='Space Mountain')continue;
  let wall=st[0][hs%st[0].length],roof=q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length],hh=q.h*S2;
  if(q.n==='Disney’s Contemporary Resort'||q.n==="Disney's Contemporary Resort"){late.push(()=>aframe(c,e,bb,hh));continue} // painted after the monorail beams, which run behind and through it
  if(q.k==='tent'){B.push({y:bb[3],f:()=>tent(c,cx_,bb[3],(bb[2]-bb[0])/2,hh+4,['#d65a8a','#5a8ad6','#e2a321','#7b4fc0'][hs%4])});continue}
  if(land.startsWith('ep')&&q.n==='Spaceship Earth'){B.push({y:bb[3],f:()=>spaceshipEarth(c,e,cx_,(bb[1]+bb[3])/2,(bb[2]-bb[0])/2,S2)});continue}
  if(land==='ep_mexico'&&q.n==='Mexico Pavilion'){B.push({y:bb[3],f:()=>{extrude(c,e,q.p,4,'#d9a066','#8d5a3a',{noWin:true});stepPyramid(c,e,bb,hh)}});continue}
  if(tronB&&q===tronB){B.push({y:bb[3],f:()=>tronBuilding(c,e,q,hh)});continue}
  if(tronCv&&q===tronCv){const qq=q;B.push({y:bb[3]+2,f:()=>tronCanopy(c,e,qq.p,bb)});continue} /* the TRON canopy */
  if(q.k==='roof'){roof=tone(roof,.25);hh=Math.min(hh,3.4)}
  if(/Rapunzel/.test(q.n)){B.push({y:bb[3],f:()=>{extrude(c,e,q.p,26,'#e9d8c6','#7b4fc0',{noWin:true});c.fillStyle='#7b4fc0';c.beginPath();c.moveTo(bb[0]-1,bb[1]-26);c.lineTo(cx_,bb[1]-38);c.lineTo(bb[2]+1,bb[1]-26);c.fill()}});continue}
  if(/train_station/.test(q.k||'')){wall='#c9563f';roof='#9e2f2f'}
  if(land.startsWith('ep')&&/^Project Tomorrow/.test(q.n))hh=Math.min(hh,6*S2); /* Spaceship Earth's low post-show building, not a tower */
  const qq=q,big=land.startsWith('ep')&&(bb[2]-bb[0])*(bb[3]-bb[1])>1500;B.push({y:bb[3],f:()=>{extrude(c,e,qq.p,hh,wall,roof,{noGlow:land==='none',ridge:land!=='ms'&&land!=='ep_fw',noWin:big||land==='ep_fw'});if(land==='ms'&&(bb[2]-bb[0])*(bb[3]-bb[1])>120)storefronts(c,qq.p,hh,bb,hs)}})}
 // rockwork: the real rock areas (Big Thunder, Tiana's, Seven Dwarfs, the Beast's hill) raised into spires
 for(const a of by('rock')){const bb=bbox(a.o),land=landOf((bb[0]+bb[2])/2,(bb[1]+bb[3])/2),col=land==='fr'?['#c9683a','#dd8a4e','#a54b2a']:land==='adv'?['#b9a27a','#d1bd94','#93805c']:['#9c9a92','#b9b6ac','#7f7c74'];b.fillRect(bb[0],bb[1]-20,bb[2]-bb[0],bb[3]-bb[1]+20);
  B.push({y:bb[3],f:()=>{areaPath(c,a);c.fillStyle=col[2];c.fill('evenodd');const R2=seeded(bb[0]*7+bb[1]|0),sp=[];
   const big=Math.min(1,Math.sqrt((bb[2]-bb[0])*(bb[3]-bb[1]))/45);for(let i=0;i<Math.max(3,(bb[2]-bb[0])*(bb[3]-bb[1])/110);i++){const x=bb[0]+R2()*(bb[2]-bb[0]),y=bb[1]+R2()*(bb[3]-bb[1]);if(ptIn(x,y,a.o))sp.push([x,y,(3+R2()*14)*(.35+.65*big),(2+R2()*4)*(.5+.5*big)])}
   sp.sort((u,v)=>u[1]-v[1]);for(const[x,y,h,w]of sp){poly4(c,[[x-w,y],[x-w*.6,y-h*.6],[x-w*.2,y-h],[x+w*.3,y-h*.85],[x+w*.7,y-h*.4],[x+w,y]],col[0]);poly4(c,[[x-w*.2,y-h],[x+w*.3,y-h*.85],[x+w*.1,y-h*.2],[x-w*.4,y-h*.5]],col[1])}}})}
 // Cinderella Castle on its real footprint
 if(castleB){const bb=bbox(castleB.p),k=Math.max((bb[2]-bb[0])/66,58*OSM.S/66)*1.25,cx_=(bb[0]+bb[2])/2,oy=bb[3]-2;MAP.castleAt=[cx_,oy,k];MAP.castleFoot=bb;
  const img=CASTLE_IMG&&CASTLE_IMG.naturalWidth?CASTLE_IMG:null;
  if(img){ // the illustrated castle image, standing on the castle's real footprint (bottom centre = the front gate)
   const w=66*k*1.3,h=w*img.naturalHeight/img.naturalWidth,x0=cx_-w/2,y0=oy-h+2;MAP.castleImg=true;
   B.push({y:bb[3],f:()=>{c.drawImage(img,x0,y0,w,h);e.save();e.globalAlpha=.32;e.drawImage(img,x0,y0,w,h);e.restore()}}); // the glow copy makes it read as floodlit at night
   if(!(MAP.castleMSS>=mss)){const cc=document.createElement('canvas');cc.width=Math.ceil(w*mss);cc.height=Math.ceil(h*mss);cc.getContext('2d').drawImage(img,0,0,cc.width,cc.height);
    MAP.castle=cc;MAP.castleBox=[x0,y0,w,h];MAP.castleMSS=mss}}
  else{B.push({y:bb[3],f:()=>castleArt(c,e,cx_,oy,k,.9)});
   if(!(MAP.castleMSS>=mss)){const cw_=74*k,ch_=80*k,cc=document.createElement('canvas');cc.width=Math.ceil(cw_*mss);cc.height=Math.ceil(ch_*mss);const ccx=cc.getContext('2d');ccx.scale(mss,mss);castleArt(ccx,null,cw_/2,ch_-4,k,.9);
    MAP.castle=cc;MAP.castleBox=[cx_-cw_/2,oy-ch_+4,cw_,ch_];MAP.castleMSS=mss}}}
 // Space Mountain on its real footprint
 {const q=OSM.buildings.find(q=>q.n==='Space Mountain');if(q){const bb=bbox(q.p),rx=(bb[2]-bb[0])/2;B.push({y:bb[3],f:()=>spaceDome(c,e,(bb[0]+bb[2])/2,(bb[1]+bb[3])/2,rx)})}}
 // details OpenStreetMap doesn't model: flume mountain, mine mountain, treehouse, TRON canopy
 for(const a of AT){if(!['mtn2','mtn3','tree'].includes(a.k)&&!(a.k==='tron'&&!tronB)||!vis([a.x-40,a.y-40,a.x+40,a.y+40]))continue; /* TRON has its own art on its real outlines, when the map data has them */const f=attractionArt(c,e,a);if(!f)continue;const S=a.k==='tron'?1.6:1.25;
  B.push({y:a.y+12,f:()=>{for(const ctx of[c,e]){ctx.save();ctx.translate(a.x,a.y);ctx.scale(S,S);ctx.translate(-a.x,-a.y)}f();c.restore();e.restore()}})}
 /* trees: every mapped tree, plus canopy filling the real forests (worked out once, reused by the close-up layers) */
 if(!MAP.crowns){const BW=blk.width,BH=blk.height,bd=b.getImageData(0,0,BW,BH).data,free=(x,y)=>{if(!(x>1&&y>1&&x<W-1&&y<H-1)||!inRegion(x,y))return false;return bd[((y*HS|0)*BW+(x*HS|0))*4+3]<10};
  const fm=document.createElement('canvas');fm.width=BW;fm.height=BH;{const f=fm.getContext('2d');f.scale(HS,HS);f.fillStyle='#000';for(const a of forest){areaPath(f,a);f.fill('evenodd')}}
  const fmd=fm.getContext('2d').getImageData(0,0,BW,BH).data,inForest=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&fmd[((y*HS|0)*BW+(x*HS|0))*4+3]>10;
  const PALM={adv:.6,poly:.55,gf:.25,cont:.2,ttc:.3},kind=(x,y,f)=>{const l=landOf(x,y)||resortOf(x,y),q=r();return q<(PALM[l]||0)*f?'palm':(l==='fr'||l==='lib'||l==='wl'||l==='fw'||(!l&&f<1))&&q<(l==='wl'||l==='fw'?.55:f<1?.22:.3)?'pine':'crown'};
  MAP.crowns=[];
  for(const[x,y]of OSM.trees)if(!onWater(x,y))MAP.crowns.push([x,y,2.8+r()*1.6,kind(x,y,1),(r()*CROWN.length)|0,inForest(x,y)]);
  for(let y=3;y<H;y+=3.6)for(let x=3+((y/3.6|0)%2)*1.8;x<W;x+=3.6){const jx=x+(r()-.5)*2,jy=y+(r()-.5)*2;if(FULL&&!inParkR(jx,jy)){const d=Math.min(...PARKR.map(R=>Math.hypot(Math.max(R[0]-jx,0,jx-R[2]),Math.max(R[1]-jy,0,jy-R[3]))));if(d>70||r()<d/70)continue} /* between the parks: the canopy texture instead; the park's own trees thin out over it for a little way, so the two blend */if(!free(jx,jy)||!free(jx,jy-3))continue;
   const inF=inForest(jx,jy);if(!inF&&r()>.012)continue;MAP.crowns.push([jx,jy,inF?3+r()*2.4:3+r()*1.6,kind(jx,jy,.75),(r()*CROWN.length)|0,inF])}
  /* soft shadows (light from the upper left) */
  const sh=document.createElement('canvas');sh.width=BW;sh.height=BH;const sx=sh.getContext('2d');sx.scale(HS,HS);sx.fillStyle='#000';
  for(const[x,y,rd]of MAP.crowns){sx.beginPath();sx.ellipse(x+rd*.9,y+rd*.5,rd*1.2,rd*.85,0,0,7);sx.fill()}
  for(const q of OSM.buildings){if(q.p.length<3)continue;const hh=q.h*S2;for(let t=0;t<=1;t+=.25){sx.beginPath();q.p.forEach(([x,y],i)=>i?sx.lineTo(x+hh*.55*t,y+hh*.12*t):sx.moveTo(x+hh*.55*t,y+hh*.12*t));sx.closePath();sx.fill()}}
  MAP._shadow=softBlur(softBlur(sh,Math.max(1.5,4*HS)),Math.max(1.2,2*HS))}
 c.save();c.globalAlpha=.34;c.drawImage(MAP._shadow,0,0,W,H);c.restore();
 const seen=(x,y)=>x>rx-10&&x<rx+rw+10&&y>ry-4&&y<ry+rh+22;
 c.fillStyle='#2a5a28';for(const[x,y,rd,k,v,inF]of MAP.crowns)if(k==='crown'&&inF&&seen(x,y)){c.beginPath();c.arc(x+rd*.2,y-rd*.5,rd*1.12,0,7);c.fill()}
 for(const[x,y,rd,k,v]of MAP.crowns)if(seen(x,y))B.push({y,f:k==='crown'?()=>c.drawImage(CROWN[v],x-rd*1.25,y-rd*2.2,rd*2.5,rd*2.5):k==='pine'?()=>c.drawImage(PINE,x-rd*.9,y-rd*2.9,rd*1.8,rd*2.9):()=>tree(c,x,y,rd*1.1,'#4f9a3c','palm')});
 B.sort((p,q)=>p.y-q.y).forEach(o=>o.f());
 /* elevated tracks over everything: PeopleMover and monorail beams */
 const beam=(p,w,col)=>{c.strokeStyle='rgba(30,40,40,.18)';c.lineWidth=w+2;c.save();c.translate(2,2);pathOf(c,p);c.stroke();c.restore();c.strokeStyle=tone(col,-.25);c.lineWidth=w+.8;pathOf(c,p);c.stroke();c.strokeStyle=col;c.lineWidth=w;pathOf(c,p);c.stroke()};
 beam(OSM.routes.pm,2.4,'#dfe5ec');for(const p of OSM.monoLines)beam(p,2.6,'#f1f3f6');late.forEach(f=>f());
 /* real street lamps */
 MAP.lamps=OSM.lamps;for(const[x,y]of MAP.lamps){c.fillStyle='rgba(70,80,75,.55)';c.fillRect(x-.18,y-2.6,.36,2.6);c.fillStyle='#fffaf0';c.beginPath();c.arc(x,y-2.9,.5,0,7);c.fill()}
 return{base,glow}}
/* ---------- attraction illustrations ---------- */
function attractionArt(c,e,a){const x=a.x,y=a.y,L=SC[a.l];
 switch(a.k){
  case'box':return()=>{const st={tom:{wall:'#e4ebf3',roof:'#9fbfe0',roofType:'flat',trim:'#7aa6d6',win:'#3d6fa8'},fan:{wall:'#f4e8d6',roof:'#6a4fb0',roofType:'gable',trim:'#fff',win:'#4f6f96'},
   lib:{wall:'#c25c48',roof:'#566070',roofType:'gable',trim:'#f4ece0',win:'#3b4a66'},fr:{wall:'#b98352',roof:'#6f4a2f',roofType:'gable',trim:'#e8d2a8',win:'#3b2a22'},adv:{wall:'#e2c89a',roof:'#c9a45c',roofType:'hip',trim:'#8a6a3a'},ms:{wall:'#f2dcc4',roof:'#b5463f',roofType:'mansard',trim:'#fff'}}[a.l]||{wall:L[0],roof:L[1]};
   building(c,e,x-15,y-9,x+15,y+9,11,Object.assign({door:'#4a3a3a'},st));
   if(a.l==='tom'){for(const dx of[-12,12]){const g=c.createLinearGradient(x+dx-1,0,x+dx+1,0);g.addColorStop(0,'#fff');g.addColorStop(1,'#a9b9cc');c.fillStyle=g;c.beginPath();c.moveTo(x+dx-1.4,y-20);c.lineTo(x+dx,y-31);c.lineTo(x+dx+1.4,y-20);c.fill()}
    c.strokeStyle='#5fa8e8';c.lineWidth=.8;c.beginPath();c.ellipse(x+3,y-22,10,3,0,0,7);c.stroke();if(e){e.strokeStyle='rgba(110,190,255,1)';e.lineWidth=.8;e.beginPath();e.ellipse(x+3,y-22,10,3,0,0,7);e.stroke()}}
   if(a.l==='fan'){for(const dx of[-11,13]){c.fillStyle='#f4e8d6';c.fillRect(x+dx-1.6,y-24,3.2,8);c.fillStyle='#6a4fb0';c.beginPath();c.moveTo(x+dx-2.2,y-24);c.lineTo(x+dx,y-31);c.lineTo(x+dx+2.2,y-24);c.fill();c.fillStyle='#f0c040';c.fillRect(x+dx-.2,y-32.5,.4,1.6)}
    c.strokeStyle='rgba(90,60,40,.55)';c.lineWidth=.45;for(let i=0;i<6;i++){c.beginPath();c.moveTo(x-14+i*5.6,y+9);c.lineTo(x-14+i*5.6,y-2);c.stroke()}}};
  case'hut':return()=>{building(c,e,x-14,y-8,x+14,y+8,7,{wall:'#e2c89a',roof:'#c9a45c',roofType:'hip',rh:8,trim:'#8a6a3a',door:'#5a3a2a'});c.strokeStyle='rgba(120,90,40,.5)';c.lineWidth=.4;for(let i=0;i<10;i++){c.beginPath();c.moveTo(x-12+i*2.6,y-15);c.lineTo(x-13+i*2.7,y-1);c.stroke()}
   for(const dx of[-17,17]){c.fillStyle='#6b4a30';c.fillRect(x+dx-.3,y+2,.6,6);c.fillStyle='#ffb347';c.beginPath();c.arc(x+dx,y+1.6,1,0,7);c.fill();e.fillStyle='rgba(255,160,60,1)';e.beginPath();e.arc(x+dx,y+1.6,1.4,0,7);e.fill()}};
  case'fort':return()=>{building(c,e,x-18,y-10,x+16,y+10,10,{wall:'#efe6d8',roof:'#c0623b',roofType:'hip',trim:'#d8c8ab',door:'#5a3a2a'});building(c,e,x+12,y-4,x+22,y+8,18,{wall:'#e8dcc8',roof:'#b0532f',roofType:'hip',trim:'#d8c8ab'});
   c.strokeStyle='#ddd';c.lineWidth=.4;c.beginPath();c.moveTo(x+17,y-22);c.lineTo(x+17,y-29);c.stroke();poly(c,[[x+17,y-29],[x+22,y-28],[x+17,y-27]],'#222')};
  case'spin':return()=>{c.fillStyle='rgba(30,50,20,.22)';c.beginPath();c.ellipse(x+3,y+2,17,8,0,0,7);c.fill();c.fillStyle='#e8dcc6';c.beginPath();c.ellipse(x,y,16,7.5,0,0,7);c.fill();c.strokeStyle='#cbb894';c.lineWidth=.6;c.stroke()};
  case'mtn':return()=>{const R=seeded(11);for(let k=0;k<7;k++){const px=x-20+k*6.5+R()*3,h=14+R()*16;const col=['#c0582f','#d4733e','#a9472a'][k%3];c.fillStyle='rgba(30,50,20,.2)';c.beginPath();c.ellipse(px+4,y+3,7,3,0,0,7);c.fill();
    poly(c,[[px-6,y+3],[px-3.5,y-h*.6],[px-1.5,y-h],[px+1.5,y-h*.9],[px+4,y-h*.45],[px+6,y+3]],col);poly(c,[[px-1.5,y-h],[px+1.5,y-h*.9],[px+.5,y-h*.2],[px-1,y-h*.4]],tone(col,.2))}
   c.strokeStyle='#6b4a30';c.lineWidth=1;c.beginPath();c.moveTo(x-22,y+5);c.bezierCurveTo(x-10,y-10,x+5,y+12,x+22,y-2);c.stroke();c.strokeStyle='#c9b38a';c.lineWidth=.4;c.stroke()};
  case'mtn2':return()=>{c.fillStyle='rgba(30,50,20,.2)';c.beginPath();c.ellipse(x+4,y+3,22,7,0,0,7);c.fill();poly(c,[[x-22,y+4],[x-12,y-12],[x-2,y-18],[x+8,y-10],[x+20,y+4]],'#8a7a5a');poly(c,[[x-2,y-18],[x+8,y-10],[x+2,y-4]],'#a8987a');
   c.fillStyle='#7fb3c9';c.fillRect(x-1,y-14,3,16);c.fillStyle='#fff';c.fillRect(x-.2,y-12,.8,13);tree(c,x-14,y+2,4,'#4f8f3f');tree(c,x+14,y+2,4,'#3f7d37');
   c.strokeStyle='#7fc4d8';c.lineWidth=2;c.beginPath();c.moveTo(x+1,y+3);c.bezierCurveTo(x+14,y+12,x+24,y+2,x+26,y-6);c.stroke()};
  case'mtn3':return()=>{c.fillStyle='rgba(30,50,20,.2)';c.beginPath();c.ellipse(x+4,y+3,22,7,0,0,7);c.fill();poly(c,[[x-22,y+4],[x-14,y-10],[x-4,y-20],[x+6,y-14],[x+12,y-22],[x+22,y+4]],'#8d8f86');poly(c,[[x-4,y-20],[x+6,y-14],[x,y-6]],'#aaaca2');
   for(const[dx,dy]of[[-15,-1],[-7,-8],[14,-6],[6,2]])tree(c,x+dx,y+dy,3.5,'#3f7d37','pine');c.strokeStyle='#6b4a30';c.lineWidth=1.1;c.beginPath();c.moveTo(x-24,y+6);c.bezierCurveTo(x-6,y-6,x+8,y+10,x+24,y);c.stroke()};
  case'house':return()=>{building(c,e,x-17,y-10,x+17,y+10,15,{wall:'#a3473c',roof:'#3d4250',roofType:'mansard',trim:'#efe6d8',door:'#2a2228',win:'#3b3f52'});building(c,e,x-4,y-14,x+4,y-8,22,{wall:'#a3473c',roof:'#3d4250',roofType:'hip',trim:'#efe6d8'});
   for(const dx of[-24,22])tree(c,x+dx,y+8,4.5,'#3f6b36','pine')};
  case'clock':return()=>{building(c,e,x-22,y-8,x+22,y+8,12,{wall:'#fbfbf6',roof:'#f2d56b',roofType:'flat',trim:'#f0c040',door:'#6a8ad6'});
   for(let i=0;i<9;i++){const px=x-20+i*5,h=6+(i%3)*4;poly(c,[[px-1.8,y-12],[px,y-12-h],[px+1.8,y-12]],i%2?'#f0c040':'#fff')}
   c.fillStyle='#fff';c.beginPath();c.arc(x,y-8,3.6,0,7);c.fill();c.strokeStyle='#d6a020';c.lineWidth=.6;c.stroke();c.strokeStyle='#333';c.lineWidth=.35;c.beginPath();c.moveTo(x,y-8);c.lineTo(x,y-10.4);c.moveTo(x,y-8);c.lineTo(x+1.6,y-8);c.stroke()};
  case'dome':return()=>{c.fillStyle='rgba(30,50,20,.22)';c.beginPath();c.ellipse(x+6,y+4,26,9,0,0,7);c.fill();c.fillStyle='#d9dee6';c.beginPath();c.ellipse(x,y+2,24,8,0,0,7);c.fill();
   const g=c.createLinearGradient(x-22,0,x+22,0);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#e8edf3');g.addColorStop(1,'#b9c2cf');c.fillStyle=g;c.beginPath();c.moveTo(x-22,y+2);c.quadraticCurveTo(x-10,y-24,x,y-30);c.quadraticCurveTo(x+10,y-24,x+22,y+2);c.closePath();c.fill();
   c.strokeStyle='#9aa5b4';c.lineWidth=.5;for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(x+i*5,y+2);c.quadraticCurveTo(x+i*2,y-18,x,y-30);c.stroke()}
   e.fillStyle='rgba(140,200,255,.8)';for(let i=-4;i<=4;i+=2){e.fillRect(x+i*5-.4,y,.8,2)}};
  case'tron':return()=>{c.fillStyle='rgba(30,50,20,.2)';c.beginPath();c.ellipse(x+4,y+4,26,7,0,0,7);c.fill();
   for(const[ctx,col,lw]of[[c,'#2c3e63',0],[e,'rgba(80,200,255,1)',1]]){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-26,y+4);ctx.bezierCurveTo(x-18,y-12,x-6,y-4,x,y-10);ctx.bezierCurveTo(x+8,y-16,x+18,y-6,x+26,y+4);
    if(lw){ctx.strokeStyle=col;ctx.lineWidth=.8;ctx.stroke()}else{ctx.closePath();ctx.fill()}}
   c.strokeStyle='#7fd6ff';c.lineWidth=.6;c.beginPath();c.moveTo(x-24,y+3);c.bezierCurveTo(x-16,y-10,x-6,y-2,x,y-8);c.bezierCurveTo(x+8,y-14,x+18,y-5,x+24,y+3);c.stroke()};
  case'tree':return()=>{c.fillStyle='rgba(30,50,20,.25)';c.beginPath();c.ellipse(x+5,y+3,15,6,0,0,7);c.fill();c.fillStyle='#6b4a30';c.fillRect(x-2,y-14,4,16);
   for(const[dx,dy,r2]of[[-8,-18,8],[8,-20,8],[0,-26,9],[-4,-14,7],[6,-12,7]])c.drawImage(CROWN[2],x+dx-r2,y+dy-r2,r2*2,r2*2);c.fillStyle='#8a5a32';c.fillRect(x-6,y-16,12,3);c.fillRect(x-1,y-24,8,2.4)};
  case'track':return()=>{const P=MAP.speedway;
   c.lineCap='round';c.lineJoin='round';for(const[col,w]of[['rgba(30,40,30,.25)',11],['#5d636d',8],['#ffffff',.5]]){c.strokeStyle=col;c.lineWidth=w;if(w<1)c.setLineDash([2,2]);c.beginPath();P.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();c.setLineDash([])}
   building(c,e,x-10,y+50,x+10,y+60,6,{wall:'#e8eef5',roof:'#d23a3a',roofType:'flat',trim:'#fff'})};
  case'pm':return null;
  case'round':return()=>{c.fillStyle='rgba(30,50,20,.22)';c.beginPath();c.ellipse(x+5,y+3,24,10,0,0,7);c.fill();const g=c.createLinearGradient(x-22,0,x+22,0);g.addColorStop(0,'#eef3fa');g.addColorStop(1,'#9fb3cc');c.fillStyle=g;c.fillRect(x-22,y-10,44,10);
   c.fillStyle=g;c.beginPath();c.ellipse(x,y,22,8,0,0,Math.PI);c.fill();c.fillStyle='#7f9fd0';c.beginPath();c.ellipse(x,y-10,22,8,0,0,7);c.fill();c.fillStyle='#b9cdea';c.beginPath();c.ellipse(x,y-10,12,4.4,0,0,7);c.fill();
   for(let i=-3;i<=3;i++){c.fillStyle='#3d6fa8';c.fillRect(x+i*6-1.2,y-7,2.4,4);if(e){e.fillStyle='rgba(140,200,255,.9)';e.fillRect(x+i*6-1.2,y-7,2.4,4)}}};
  default:return()=>building(c,e,x-12,y-8,x+12,y+8,10,{wall:L[0],roof:L[1],roofType:'gable',trim:'#fff'})}}
