/* Main Street street-level view + Happily Ever After show engine (shared by both views). */
/* ===== STREET VIEW: Main Street, U.S.A. looking toward the castle =====
   A painted, cartoon-realistic perspective scene. World units are metres: x = across the street
   (+ right), y = up, z = distance from the camera (standing near Town Square, looking north).
   Guests come from the live simulation and are mapped from map coordinates into this scene. */
const SV={on:false,f:1,hz:.6,pan:0,tilt:0,zoom:1,dirty:true,C:{},nfB:-1,gfB:-1,fl:0,flH:40,t0:performance.now()};
const EYE=6.5,CZ=300,STREET=11; // eye height, castle front distance, half-width building line
function svProj(x,y,z){const k=SV.f/z;return[cw/2+(x-SV.pan)*k,SV.hy-(y-EYE)*k]}
function svLayout(){SV.f=Math.max(cw*.85,ch*1.5)*SV.zoom;SV.hy=ch*(SV.hz+SV.tilt);SV.dirty=true}
/* ---------- deterministic randomness for the static scene ---------- */
function rnd(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000}}
const shade=(hex,a)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,p=Math.abs(a);r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);return`rgb(${r},${g},${b})`};
/* ---------- Main Street building blocks ---------- */
/* The real Main Street, U.S.A., building by building, from Town Square (near the camera) to the hub.
   West side (left): the Emporium runs most of the first block, then the old Center Street (now enclosed), Fashion &
   Apparel, and Casey's Corner on the hub corner. East side (right): the Confectionery on the Town Square corner, the
   Cinema with its marquee, Uptown Jewelers, Center Street (an open side street), Crystal Arts, the Bakery, the Plaza
   Ice Cream Parlor and the Plaza Restaurant. Lengths are metres along the street; colours follow the real facades.
   [sign, length, height, storeys, wall, trim, awning, roof, extras] */
const STREET_BLDG={
 '-1':[['EMPORIUM',30,13.5,3,'#f3ead3','#ffffff',['#2a6a3d','#fff'],'mansard',{corner0:1,cupola:1,bay:1,mroof:'#4f6b5a',flag:1}],
  ['EMPORIUM',22,11,2,'#b5574a','#f3ead3',['#c8323a','#fff'],'gable',{brick:1,arch:1}],
  ['HARMONY BARBER SHOP',10,9,2,'#cfe3d3','#ffffff',['#1f4f9a','#fff'],'flat',{pole:1}],
  ['EMPORIUM GALLERY',30,13.5,3,'#e9dcc0','#2f4f6f',['#1f4f9a','#fff'],'mansard',{bay:1,arch:1,mroof:'#5d6b7d',flag:1}],
  ['CENTER STREET',9,7.5,2,'#f1efe6','#355e3b',['#2a6a3d','#fff'],'flat',{}],
  ['FASHION & APPAREL',28,12.5,3,'#f3d3c4','#ffffff',['#7b3f8c','#fff'],'mansard',{bay:1,mroof:'#6a5a7a'}],
  ['ATHLETIC CLUB',20,10.5,2,'#c9dbe8','#ffffff',['#2d8a8a','#fff'],'gable',{arch:1,flag:1}],
  ["CASEY'S CORNER",29,13,3,'#f6efdc','#b3262e',['#c8323a','#fff'],'mansard',{corner:1,cupola:1,mroof:'#7a2f2f',flag:1}]],
 '1':[['CONFECTIONERY',30,13.5,3,'#f6d5dc','#ffffff',['#e88aa8','#fff'],'mansard',{corner0:1,cupola:1,bay:1,mroof:'#7a5a6a',flag:1}],
  ['MAIN STREET CINEMA',16,12,2,'#e8c6a0','#6b2f2f',['#c8323a','#fff'],'flat',{marquee:1}],
  ['UPTOWN JEWELERS',26,13.5,3,'#c9dbe8','#ffffff',['#1f4f9a','#fff'],'mansard',{bay:1,arch:1,mroof:'#5d6b7d'}],
  [null,9,0,0,'','',null,'gap',{}],
  ['CRYSTAL ARTS',18,10.5,2,'#efe2c6','#355e3b',['#2a6a3d','#fff'],'gable',{arch:1}],
  ['MAIN STREET BAKERY',26,12.5,3,'#f6e6a8','#ffffff',['#e2a321','#fff'],'mansard',{bay:1,mroof:'#6b5a3a',flag:1}],
  ['ICE CREAM PARLOR',18,10,2,'#f3d3c4','#ffffff',['#e88aa8','#fff'],'flat',{arch:1}],
  ['THE PLAZA RESTAURANT',35,12,3,'#f4f1e8','#2f4f6f',['#1f4f9a','#fff'],'mansard',{corner:1,cupola:1,mroof:'#4f6b7a',flag:1}]]};
function makeBlocks(){const B=[];for(const s of[-1,1]){let z=20;const L=STREET_BLDG[s];L.forEach(([sign,len,h,st,wall,trim,awn,roof,x],i)=>{const z1=i===L.length-1?198:z+len;
   if(roof!=='gap')B.push(Object.assign({s,z0:z,z1,h,st,wall,trim,awn,roof,sign},x));else B.push({s,z0:z,z1,gap:1});z=z1})}return B}
const BLOCKS=makeBlocks();
/* ---------- hub trees, lamps ---------- */
const TREES=(()=>{const r=rnd(77),T=[];for(let i=0;i<46;i++){const s=r()<.5?-1:1;T.push({x:s*(13+r()*36),z:204+r()*68,h:7+r()*6,rad:3.2+r()*2.6,c:['#3d7a3a','#4a8a3f','#356b33','#5a9446'][r()*4|0]})}
 for(let z=26;z<196;z+=30)for(const s of[-1,1])T.push({x:s*9.3,z:z+8,h:5.5,rad:1.8,c:'#4a8a3f',small:1});return T})();
const LAMPS=(()=>{const L=[];for(let z=22;z<200;z+=11)for(const s of[-1,1])L.push({x:s*8.3,z});
 for(let a=0;a<12;a++){const t=a/12*6.283;L.push({x:Math.cos(t)*22,z:245+Math.sin(t)*22})}return L})();
/* ---------- castle geometry (front elevation, metres) ---------- */
const CAST={
 towers:[ // u (centre), v0 base, w width, h wall height, roof height, layer (0 back → 3 front)
  [-25,8,5,16,9,0],[25,8,5,16,9,0],[-17,14,4,20,10,0],[17,14,4,20,10,0],[-10,22,4.2,17,9,1],[10,22,4.2,17,9,1],
  [-6.5,30,3.4,12,8,1],[6.5,30,3.4,12,8,1],[0,30,8.5,13,0,1],[0,43,6,7,13.5,2],[-13,10,6,22,11,2],[13,10,6,22,11,2],
  [-21,6,3.2,12,6.5,2],[21,6,3.2,12,6.5,2],[-3.6,40,2.4,6,6,3],[3.6,40,2.4,6,6,3],[-30,4,4,10,6,3],[30,4,4,10,6,3],[-8.5,15,3,10,6,3],[8.5,15,3,10,6,3]],
 wall:[[-34,0,34,8],[-20,8,20,22],[-11,22,11,30]],
};
const ROOF='#3d6fc4',ROOF2='#22488f',STONE='#ece3d6',STONE2='#d6c9b8',GOLD='#e8b84a';
function drawCastle(c,k,ox,oy,night){ // draws into context c, k px per metre, origin at castle centre base
 const P=(u,v)=>[ox+u*k,oy-v*k];
 c.save();c.lineJoin='round';
 // rock base & moat bank
 c.fillStyle='#bdb3a2';c.beginPath();c.moveTo(...P(-40,0));c.lineTo(...P(-36,4));c.lineTo(...P(36,4));c.lineTo(...P(40,0));c.closePath();c.fill();
 const wallG=(u0,u1,v0,v1)=>{const g=c.createLinearGradient(...P(u0,0),...P(u1,0));g.addColorStop(0,STONE);g.addColorStop(.5,'#f4ece0');g.addColorStop(1,STONE2);return g};
 const crenel=(u0,u1,v)=>{c.fillStyle=STONE2;const n=Math.max(2,Math.round((u1-u0)/1.6));for(let i=0;i<n;i+=2){const a=u0+(u1-u0)*i/n,b=u0+(u1-u0)*(i+1)/n;c.fillRect(...P(a,v+1.1),(b-a)*k,1.1*k)}};
 const win=(u,v,w,h)=>{c.fillStyle=night?'#ffcf73':'#2b3a63';c.beginPath();const[x,y]=P(u-w/2,v);c.moveTo(x,y);c.lineTo(x,y-h*k*.7);c.arc(x+w*k/2,y-h*k*.7,w*k/2,Math.PI,0);c.lineTo(x+w*k,y);c.closePath();c.fill()};
 const tower=(t)=>{const[u,v0,w,h,rh]=t;const g=c.createLinearGradient(...P(u-w/2,0),...P(u+w/2,0));g.addColorStop(0,'#f6efe4');g.addColorStop(.55,STONE);g.addColorStop(1,'#bfb09c');
  c.fillStyle=g;c.fillRect(...P(u-w/2,v0+h),w*k,h*k);
  // gold band and windows
  c.fillStyle=GOLD;c.fillRect(...P(u-w/2,v0+h),w*k,Math.max(1,.35*k));
  for(let v=v0+2.5;v<v0+h-2;v+=4.2)win(u,v,Math.min(1,w*.22),1.8);
  if(rh>0){const rg=c.createLinearGradient(...P(u-w/2,0),...P(u+w/2,0));rg.addColorStop(0,'#6a97e0');rg.addColorStop(.45,ROOF);rg.addColorStop(1,ROOF2);
   c.fillStyle=rg;c.beginPath();c.moveTo(...P(u-w/2-.5,v0+h));c.quadraticCurveTo(...P(u-w*.18,v0+h+rh*.45),...P(u,v0+h+rh));c.quadraticCurveTo(...P(u+w*.18,v0+h+rh*.45),...P(u+w/2+.5,v0+h));c.closePath();c.fill();
   // roof banding
   c.strokeStyle='rgba(20,40,90,.35)';c.lineWidth=Math.max(.5,.12*k);for(let i=1;i<4;i++){const f=i/4;c.beginPath();c.moveTo(...P(u-(w/2+.5)*(1-f*.8),v0+h+rh*f*.55));c.lineTo(...P(u+(w/2+.5)*(1-f*.8),v0+h+rh*f*.55));c.stroke()}
   // finial
   c.strokeStyle=GOLD;c.lineWidth=Math.max(1,.25*k);c.beginPath();c.moveTo(...P(u,v0+h+rh));c.lineTo(...P(u,v0+h+rh+1.6));c.stroke();c.fillStyle=GOLD;c.beginPath();c.arc(...P(u,v0+h+rh+1.7),Math.max(1,.3*k),0,7);c.fill()}
  else crenel(u-w/2,u+w/2,v0+h)};
 // back towers
 for(const t of CAST.towers)if(t[5]===0)tower(t);
 // main walls
 CAST.wall.forEach(([u0,v0,u1,v1],i)=>{c.fillStyle=wallG(u0,u1);c.fillRect(...P(u0,v1),(u1-u0)*k,(v1-v0)*k);crenel(u0,u1,v1);
  c.fillStyle=GOLD;c.fillRect(...P(u0,v1),(u1-u0)*k,Math.max(1,.3*k));
  for(let u=u0+3;u<u1-2;u+=4.5)if(Math.abs(u)>4.5||i>0)win(u,v0+2,1.2,i===2?3.2:2.4)});
 for(const t of CAST.towers)if(t[5]===1)tower(t);
 // great window in the keep
 c.fillStyle=night?'#ffd98f':'#3a4d80';c.beginPath();const gx=P(-1.6,32);c.moveTo(...gx);c.lineTo(gx[0],gx[1]-5*k);c.arc(gx[0]+1.6*k,gx[1]-5*k,1.6*k,Math.PI,0);c.lineTo(gx[0]+3.2*k,gx[1]);c.fill();
 for(const t of CAST.towers)if(t[5]===2)tower(t);
 for(const t of CAST.towers)if(t[5]===3)tower(t);
 // gateway arch
 c.fillStyle='#2a2730';c.beginPath();const a=P(-3.2,0);c.moveTo(...a);c.lineTo(a[0],a[1]-5*k);c.arc(a[0]+3.2*k,a[1]-5*k,3.2*k,Math.PI,0);c.lineTo(a[0]+6.4*k,a[1]);c.fill();
 c.strokeStyle=GOLD;c.lineWidth=Math.max(1,.3*k);c.beginPath();c.arc(a[0]+3.2*k,a[1]-5*k,3.6*k,Math.PI,0);c.stroke();
 // spire tip
 c.strokeStyle=GOLD;c.lineWidth=Math.max(1,.3*k);c.beginPath();c.moveTo(...P(0,63.5));c.lineTo(...P(0,66.5));c.stroke();
 c.restore()}
/* ---------- static scene (ground, hub, buildings) cached per camera ---------- */
function quad(c,pts,fill){c.fillStyle=fill;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill()}
const fq=(x0,y0,z0,x1,y1,z1)=>[svProj(x0,y0,z0),svProj(x1,y0,z1),svProj(x1,y1,z1),svProj(x0,y1,z0)]; // facade-plane quad (x fixed or z fixed)
function wallQ(x,za,zb,ya,yb){return[svProj(x,ya,za),svProj(x,ya,zb),svProj(x,yb,zb),svProj(x,yb,za)]}
function endQ(z,xa,xb,ya,yb){return[svProj(xa,ya,z),svProj(xb,ya,z),svProj(xb,yb,z),svProj(xa,yb,z)]}
function groundQ(xa,xb,za,zb){return[svProj(xa,0,za),svProj(xb,0,za),svProj(xb,0,zb),svProj(xa,0,zb)]}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return c}
function buildStatic(){const W2=cw*dpr,H2=ch*dpr;const C=SV.C;SV.flags=[];SV.twinkle=[];
 C.ground=mkCanvas(W2,H2);C.front=mkCanvas(W2,H2);C.glow=mkCanvas(W2,H2);
 const g=C.ground.getContext('2d'),f=C.front.getContext('2d'),e=C.glow.getContext('2d');for(const c of[g,f,e])c.setTransform(dpr,0,0,dpr,0,0);
 /* ground */
 g.fillStyle='#8fae6a';g.fillRect(0,SV.hy-2,cw,ch);
 // distant tree line behind the castle
 {const r=rnd(31);for(let x=-420;x<420;x+=9){const z=470+r()*60,p=svProj(x,0,z),k=SV.f/z,h=(8+r()*9)*k;g.fillStyle=r()<.5?'#3f6b3c':'#4d7b46';g.beginPath();g.ellipse(p[0],p[1]-h*.5,6*k,h*.6,0,0,7);g.fill()}}
 // hub plaza & lawns
 quad(g,groundQ(-70,70,198,288),'#d9cdb4');
 for(const s of[-1,1]){quad(g,groundQ(s*12,s*58,206,272),'#6fa152');quad(g,groundQ(s*14,s*55,212,266),'#7db35c')}
 // flower beds (ring)
 for(let a=0;a<24;a++){const t=a/24*6.283,x=Math.cos(t)*30,z=240+Math.sin(t)*16;const p=svProj(x,0,z),k=SV.f/z;g.fillStyle=['#e84a6a','#f2c14e','#f7f7f7','#b04ad8'][a%4];g.beginPath();g.ellipse(p[0],p[1],2.4*k,.6*k,0,0,7);g.fill()}
 // castle forecourt & moat
 quad(g,groundQ(-60,60,282,296),'#5a8fb0');quad(g,groundQ(-60,60,286,296),'#4b7fa3');
 quad(g,groundQ(-5,5,278,300),'#cdbfa6');
 // Main Street paving, sidewalks, curbs, trolley rails
 quad(g,groundQ(-STREET,STREET,4,200),'#d8c7ae');
 quad(g,groundQ(-7.5,7.5,4,200),'#b5524a');
 for(let z=10;z<200;z+=2.2){const k=Math.min(1,(z-8)/40);g.strokeStyle=`rgba(80,20,20,${.12*(1-k*.6)})`;g.lineWidth=.6;g.beginPath();g.moveTo(...svProj(-7.5,0,z));g.lineTo(...svProj(7.5,0,z));g.stroke()}
 for(const s of[-1,1]){quad(g,groundQ(s*7.5,s*7.8,4,200),'#efe6d4');
  for(const xr of[.75,-.75]){g.strokeStyle='#5f5a56';g.lineWidth=1;g.beginPath();g.moveTo(...svProj(xr+s*.0,0,5));g.lineTo(...svProj(xr,0,200));g.stroke()}}
 // crosswalk near hub
 for(let i=-7;i<7.5;i+=1.4)quad(g,groundQ(i,i+.7,192,196),'#f4eee2');
 /* hub trees (back) */
 const tr=[...TREES].sort((a,b)=>b.z-a.z);
 /* buildings: far → near */
 const bl=[...BLOCKS].sort((a,b)=>b.z0-a.z0);
 SV.bulbs=[];SV.wins=[];
 for(const b of bl){const x=b.s*STREET,xb=b.s*(STREET+22);
  if(b.gap){const xe=b.s*(STREET+22);quad(g,groundQ(x,xe,b.z0,b.z1),'#d8c7ae'); /* Center Street: a short side street, closed off at the end by the backs of the next buildings */
   quad(f,wallQ(xe,b.z0-1,b.z1+1,0,9.5),'#d9c7a8');quad(f,wallQ(xe,b.z0-1,b.z1+1,8.9,9.5),'#f3ead3');for(let z=b.z0+.8;z<b.z1-.6;z+=2.2)for(const y of[1.2,5])quad(f,wallQ(xe,z,z+1.1,y,y+2),'#7d97b3');continue}
  // end wall facing the camera (visible above lower neighbours)
  /* the end wall facing the camera, run right up into the roof, so a taller building behind a shorter one is solid, not a hollow front */
  {const top=b.roof==='mansard'?b.h+3.25:b.h+.25,ps=[svProj(x,0,b.z0),svProj(x,b.h,b.z0),svProj(b.s*(STREET-.5),b.h+.25,b.z0)];if(b.roof==='mansard')ps.push(svProj(b.s*(STREET+2),top,b.z0));ps.push(svProj(xb,top,b.z0),svProj(xb,0,b.z0));quad(f,ps,shade(b.wall,-.25));
   if(b.roof==='mansard')quad(f,[svProj(b.s*(STREET-.5),b.h+.25,b.z0),svProj(b.s*(STREET+2),top,b.z0),svProj(xb,top,b.z0),svProj(xb,top-.4,b.z0),svProj(b.s*(STREET+2.1),top-.4,b.z0),svProj(b.s*(STREET-.3),b.h+.25,b.z0)],shade(b.mroof||'#5d6b7d',-.15))}
  // facade
  const fc=wallQ(x,b.z0,b.z1,0,b.h);quad(f,fc,b.wall);
  if(b.brick){f.save();f.beginPath();f.moveTo(...fc[0]);fc.slice(1).forEach(p=>f.lineTo(...p));f.closePath();f.clip();f.strokeStyle='rgba(120,40,30,.25)';f.lineWidth=.5;for(let y=.4;y<b.h;y+=.45){f.beginPath();f.moveTo(...svProj(x,y,b.z0));f.lineTo(...svProj(x,y,b.z1));f.stroke()}f.restore()}
  // ground floor storefront
  const sh=3.6;quad(f,wallQ(x,b.z0+.3,b.z1-.3,.35,sh-.3),shade(b.trim,-.1));
  const nw=Math.max(1,Math.round((b.z1-b.z0)/3.2));
  for(let i=0;i<nw;i++){const za=b.z0+.6+i*(b.z1-b.z0-1.2)/nw,zb=za+(b.z1-b.z0-1.2)/nw-.4;quad(f,wallQ(x,za,zb,.7,sh-.6),i===(nw>>1)?'#3b2a22':'#9fc3d8');SV.wins.push([x,za,zb,.7,sh-.6,1])}
  // sign band
  quad(f,wallQ(x,b.z0+.4,b.z1-.4,sh,sh+.9),b.trim);
  // awning (projects into the street, striped)
  const ax=b.s*(STREET-1.9),n=Math.max(2,Math.round((b.z1-b.z0)/1.1));
  for(let i=0;i<n;i++){const za=b.z0+.3+i*(b.z1-b.z0-.6)/n,zb=za+(b.z1-b.z0-.6)/n;quad(f,[svProj(x,sh,za),svProj(x,sh,zb),svProj(ax,sh-.9,zb),svProj(ax,sh-.9,za)],b.awn[i%2])}
  quad(f,[svProj(ax,sh-.9,b.z0+.3),svProj(ax,sh-.9,b.z1-.3),svProj(ax,sh-1.25,b.z1-.3),svProj(ax,sh-1.25,b.z0+.3)],b.awn[0]);
  // upper windows
  const fh=(b.h-sh-1)/(b.st-1);
  for(let s2=1;s2<b.st;s2++){const y0=sh+1+(s2-1)*fh;const m=Math.max(1,Math.round((b.z1-b.z0)/2.6));
   for(let i=0;i<m;i++){const zc=b.z0+(i+.5)*(b.z1-b.z0)/m,xw=b.bay&&s2===1&&i%2===0?b.s*(STREET-.45):x; // every other first-floor window is a bay that steps out over the pavement
    if(xw!==x){quad(f,wallQ(xw,zc-.85,zc+.85,y0+.25,y0+fh-.35),b.wall);quad(f,[svProj(x,y0+fh-.35,zc-.85),svProj(x,y0+fh-.35,zc+.85),svProj(xw,y0+fh-.35,zc+.85),svProj(xw,y0+fh-.35,zc-.85)],shade(b.mroof||'#5d6b7d',.1));quad(f,endQ(zc-.85,x,xw,y0+.25,y0+fh-.35),shade(b.wall,-.18))}
    const x0=x;{const x=xw;quad(f,wallQ(x,zc-.55,zc+.55,y0+.5,y0+fh-.6),b.trim);quad(f,wallQ(x,zc-.42,zc+.42,y0+.62,y0+fh-.72),'#5b7fa8');
    if(b.arch){const a=svProj(x,y0+fh-.6,zc-.55),c2=svProj(x,y0+fh-.6,zc+.55),t=svProj(x,y0+fh-.1,zc);f.fillStyle=b.trim;f.beginPath();f.moveTo(...a);f.quadraticCurveTo(t[0],t[1]-(a[1]-t[1])*.6,...c2);f.fill()}
    quad(f,wallQ(x,zc-.42,zc+.42,y0+fh*.55,y0+fh-.72),'#7ea5c9');SV.wins.push([x,zc-.42,zc+.42,y0+.62,y0+fh-.72,0])}}
   quad(f,wallQ(x,b.z0,b.z1,y0-.15,y0+.05),shade(b.trim,-.2))}
  // pilasters: a trim strip up each end of the facade and between every few windows
  {const np=Math.max(1,Math.round((b.z1-b.z0)/7.5));for(let i=0;i<=np;i++){const zp=b.z0+.12+i*(b.z1-b.z0-.5)/np;quad(f,wallQ(x,zp,zp+.26,sh+.9,b.h-.6),shade(b.trim,-.06))}}
  // cornice
  quad(f,[svProj(x,b.h-.6,b.z0),svProj(x,b.h-.6,b.z1),svProj(b.s*(STREET-.5),b.h-.4,b.z1),svProj(b.s*(STREET-.5),b.h-.4,b.z0)],shade(b.trim,-.35));
  quad(f,wallQ(b.s*(STREET-.5),b.z0,b.z1,b.h-.4,b.h+.25),b.trim);
  for(let z=b.z0+.4;z<b.z1;z+=.9)SV.bulbs.push([b.s*(STREET-.55),b.h+.3,z]);
  for(let y=1;y<b.h;y+=1.1)SV.bulbs.push([b.s*(STREET-.05),y,b.z0+.15]);
  // roof
  if(b.roof==='mansard'){quad(f,[svProj(b.s*(STREET-.5),b.h+.25,b.z0),svProj(b.s*(STREET-.5),b.h+.25,b.z1),svProj(b.s*(STREET+2),b.h+3,b.z1-.4),svProj(b.s*(STREET+2),b.h+3,b.z0+.4)],b.mroof||'#5d6b7d');
   quad(f,[svProj(b.s*(STREET+2),b.h+3,b.z0+.4),svProj(b.s*(STREET+2),b.h+3,b.z1-.4),svProj(b.s*(STREET+2),b.h+3.25,b.z1-.4),svProj(b.s*(STREET+2),b.h+3.25,b.z0+.4)],b.trim); // cresting along the top
   for(let z=b.z0+1.2;z<b.z1-.8;z+=2.4){quad(f,wallQ(b.s*(STREET+.6),z-.45,z+.45,b.h+.7,b.h+2.2),'#f3efe6');quad(f,wallQ(b.s*(STREET+.62),z-.3,z+.3,b.h+.85,b.h+2),'#5b7fa8')}}
  else if(b.roof==='gable'){const zm=(b.z0+b.z1)/2;quad(f,[svProj(x,b.h+.2,b.z0+.3),svProj(x,b.h+.2,b.z1-.3),svProj(x,b.h+2.6,zm)],b.trim);quad(f,[svProj(x,b.h+.6,b.z0+1),svProj(x,b.h+.6,b.z1-1),svProj(x,b.h+2.1,zm)],b.wall);
   for(let i=0;i<=10;i++){const t=i/10;SV.bulbs.push([x,b.h+.2+2.4*(1-Math.abs(t*2-1)),b.z0+.3+(b.z1-b.z0-.6)*t])}}
  if(b.marquee){const mx=b.s*(STREET-3),za=b.z0+3,zb=b.z1-3; // the cinema's canopy out over the pavement, edged in bulbs, with a blade sign above
   quad(f,[svProj(x,sh+.9,za),svProj(x,sh+.9,zb),svProj(mx,sh+.9,zb),svProj(mx,sh+.9,za)],'#f3ead3');quad(f,wallQ(mx,za,zb,sh+.9,sh+1.9),'#b3262e');quad(f,endQ(za,x,mx,sh+.9,sh+1.9),'#8f1f26');
   for(let z=za;z<=zb;z+=.6)SV.bulbs.push([mx,sh+1.95,z],[mx,sh+.85,z]);quad(f,endQ((za+zb)/2,b.s*(STREET-.2),b.s*(STREET-1.1),b.h-3.6,b.h+.6),'#b3262e');for(let y=b.h-3.4;y<b.h+.5;y+=.6)SV.bulbs.push([b.s*(STREET-.75),y,(za+zb)/2])}
  if(b.pole){const p=svProj(b.s*(STREET-.15),1,b.z0+1.2),k=SV.f/(b.z0+1.2);for(let i=0;i<6;i++){f.fillStyle=['#fff','#c8323a','#fff','#1f4f9a'][i%4];f.fillRect(p[0]-.14*k,p[1]-(i+1)*.3*k,.28*k,.3*k)}}
  if(b.cupola){const zc=b.corner?b.z1-2.5:b.corner0?b.z0+2.5:(b.z0+b.z1)/2,cx2=b.s*(STREET+1.5),k=SV.f/zc,p=svProj(cx2,b.h+.2,zc);
   f.fillStyle=b.trim;f.fillRect(p[0]-1.4*k,p[1]-3*k,2.8*k,3*k);f.fillStyle='#5b7fa8';f.fillRect(p[0]-.9*k,p[1]-2.5*k,.6*k,1.8*k);f.fillRect(p[0]+.3*k,p[1]-2.5*k,.6*k,1.8*k);
   f.fillStyle='#4d8a6f';f.beginPath();f.moveTo(p[0]-1.8*k,p[1]-3*k);f.quadraticCurveTo(p[0]-1.6*k,p[1]-5.4*k,p[0],p[1]-6*k);f.quadraticCurveTo(p[0]+1.6*k,p[1]-5.4*k,p[0]+1.8*k,p[1]-3*k);f.fill();
   f.strokeStyle=GOLD;f.lineWidth=Math.max(1,.15*k);f.beginPath();f.moveTo(p[0],p[1]-6*k);f.lineTo(p[0],p[1]-7.2*k);f.stroke();SV.bulbs.push([cx2,b.h+3.2,zc-1.4],[cx2,b.h+3.2,zc+1.4])}
  // sign lettering
  const mz=(b.z0+b.z1)/2,sp=svProj(x,sh+.45,mz),sk=SV.f/mz,fs=Math.min(.62*sk,(b.z1-b.z0)*sk*.11);
  if(fs>3){f.save();const p0=svProj(x,sh+.45,b.z0+.5),p1=svProj(x,sh+.45,b.z1-.5);f.translate(sp[0],sp[1]);f.transform(1,(p1[1]-p0[1])/(p1[0]-p0[0]||1),0,1,0,0);
   const sx=Math.abs(p1[0]-p0[0])/(b.z1-b.z0)/sk;f.scale(Math.max(.15,sx),1);f.fillStyle=b.trim==='#ffffff'||b.trim==='#f7f1e3'?'#7a2d2d':'#fff4dc';f.font=`700 ${fs}px Georgia,serif`;f.textAlign='center';f.textBaseline='middle';f.fillText(b.sign,0,0);f.restore()}
  if(b.flag){const p=svProj(b.s*(STREET-.4),b.h+.3,b.z0+1),k=SV.f/(b.z0+1);f.strokeStyle='#ddd';f.lineWidth=Math.max(1,.08*k);f.beginPath();f.moveTo(...p);f.lineTo(p[0],p[1]-3.2*k);f.stroke();SV.flags=SV.flags||[];SV.flags.push([p[0],p[1]-3.2*k,k,b.s])}
 }
 // lamp posts
 for(const l of [...LAMPS].sort((a,b)=>b.z-a.z)){const p=svProj(l.x,0,l.z),k=SV.f/l.z;if(p[0]<-50||p[0]>cw+50)continue;f.strokeStyle='#1f3a2e';f.lineWidth=Math.max(1,.16*k);f.beginPath();f.moveTo(...p);f.lineTo(p[0],p[1]-3.6*k);f.stroke();
  f.fillStyle='#1f3a2e';f.fillRect(p[0]-.28*k,p[1]-4.3*k,.56*k,.75*k);f.fillStyle='#f6edd0';f.fillRect(p[0]-.2*k,p[1]-4.2*k,.4*k,.55*k)}
 /* glow layer (night emissives) */
 e.globalCompositeOperation='lighter';
 for(const w of SV.wins){const[x,za,zb,y0,y1,shop]=w;quad(e,wallQ(x,za,zb,y0,y1),shop?'rgba(255,200,130,.55)':'rgba(255,190,105,.5)')}
 for(const[x,y,z]of SV.bulbs){const p=svProj(x,y,z),k=SV.f/z,r=Math.max(.6,Math.min(1.6,.09*k));if(p[0]<-5||p[0]>cw+5)continue;const gr=e.createRadialGradient(p[0],p[1],0,p[0],p[1],r*4);gr.addColorStop(0,'rgba(255,236,190,1)');gr.addColorStop(.25,'rgba(255,210,140,.55)');gr.addColorStop(1,'rgba(255,190,110,0)');e.fillStyle=gr;e.fillRect(p[0]-r*4,p[1]-r*4,r*8,r*8)}
 for(const l of LAMPS){const p=svProj(l.x,3.9,l.z),k=SV.f/l.z;if(p[0]<-50||p[0]>cw+50)continue;const r=Math.min(1.8*k,26);const gr=e.createRadialGradient(p[0],p[1],0,p[0],p[1],r);gr.addColorStop(0,'rgba(255,240,200,1)');gr.addColorStop(.2,'rgba(255,215,150,.6)');gr.addColorStop(1,'rgba(255,200,120,0)');e.fillStyle=gr;e.fillRect(p[0]-r,p[1]-r,2*r,2*r)}
 /* trees drawn into a separate layer so they sit between the castle and the buildings */
 C.trees=mkCanvas(W2,H2);const t=C.trees.getContext('2d');t.setTransform(dpr,0,0,dpr,0,0);
 for(const tr2 of tr){const p=svProj(tr2.x,0,tr2.z),k=SV.f/tr2.z;if(p[0]<-200||p[0]>cw+200)continue;t.fillStyle='#5b4330';t.fillRect(p[0]-.25*k,p[1]-tr2.h*.45*k,.5*k,tr2.h*.45*k);
  const cy=p[1]-tr2.h*.62*k;for(let i=0;i<7;i++){const a=i/7*6.283,rr2=tr2.rad*k*(.55+.12*Math.sin(i*2.1));t.fillStyle=i%2?tr2.c:shade(tr2.c,-.12);t.beginPath();t.arc(p[0]+Math.cos(a)*tr2.rad*.55*k,cy+Math.sin(a)*tr2.rad*.4*k,rr2,0,7);t.fill()}
  t.fillStyle=shade(tr2.c,.18);t.beginPath();t.arc(p[0]-tr2.rad*.3*k,cy-tr2.rad*.35*k,tr2.rad*.45*k,0,7);t.fill();
  if(!tr2.small){SV.twinkle=SV.twinkle||[];for(let i=0;i<14;i++)SV.twinkle.push([p[0]+(Math.random()-.5)*tr2.rad*1.8*k,cy+(Math.random()-.5)*tr2.rad*1.3*k,Math.random()*6.28])}}
 /* castle */
 const ck=SV.f/CZ,cb=svProj(0,0,CZ);C.ck=ck;C.cx=cb[0];C.cy=cb[1];
 const cwid=Math.ceil(84*ck),chgt=Math.ceil(78*ck);C.castle=mkCanvas(cwid*dpr,chgt*dpr);C.castleNight=mkCanvas(cwid*dpr,chgt*dpr);C.proj=mkCanvas(cwid*dpr,chgt*dpr);
 C.cox=cb[0]-cwid/2;C.coy=cb[1]-chgt+1;
 // the same castle illustration as the map (images/castle.png), standing on the forecourt; the drawn castle is the fallback
 const img=CASTLE_IMG&&CASTLE_IMG.naturalWidth?CASTLE_IMG:null,ih=75*ck,iw=img?ih*img.naturalWidth/img.naturalHeight:0;
 for(const[cv2,n]of[[C.castle,0],[C.castleNight,1]]){const c=cv2.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  if(img){c.imageSmoothingQuality='high';c.drawImage(img,cwid/2-iw/2,chgt-2-ih,iw,ih)}else castleArt(c,n?c:null,cwid/2,chgt-6,ck,1)}
 SV.dirty=false;SV.nfB=-1}
/* tinted static layers, re-made only when the light level changes noticeably */
function buildTint(){const C=SV.C;const nfq=Math.round(nf*30)/30,gfq=Math.round(gf*20)/20;if(nfq===SV.nfB&&gfq===SV.gfB)return;SV.nfB=nfq;SV.gfB=gfq;
 for(const k of['ground','front','trees']){const src=C[k];if(!C[k+'T']||C[k+'T'].width!==src.width||C[k+'T'].height!==src.height)C[k+'T']=mkCanvas(src.width,src.height); /* remake the tinted copy when the window size has changed (full screen, rotating a tablet) */
  const c=C[k+'T'].getContext('2d');c.globalCompositeOperation='copy';c.drawImage(src,0,0);c.globalCompositeOperation='source-atop';
  if(gfq>0){c.fillStyle=`rgba(255,140,70,${gfq*.28})`;c.fillRect(0,0,src.width,src.height)}
  if(nfq>0){c.fillStyle=`rgba(14,20,52,${nfq*.72})`;c.fillRect(0,0,src.width,src.height)}}
 if(!C.castleT||C.castleT.width!==C.castle.width||C.castleT.height!==C.castle.height)C.castleT=mkCanvas(C.castle.width,C.castle.height);
 const c=C.castleT.getContext('2d');c.globalCompositeOperation='copy';c.drawImage(nfq>.5?C.castleNight:C.castle,0,0);c.globalCompositeOperation='source-atop';
 if(gfq>0){c.fillStyle=`rgba(255,150,80,${gfq*.3})`;c.fillRect(0,0,9e3,9e3)}
 if(nfq>0){c.fillStyle=`rgba(20,22,60,${nfq*.55})`;c.fillRect(0,0,9e3,9e3);const g=c.createLinearGradient(0,C.castle.height,0,0);g.addColorStop(0,`rgba(150,120,255,${nfq*.45})`);g.addColorStop(.6,`rgba(120,160,255,${nfq*.2})`);g.addColorStop(1,'rgba(120,160,255,0)');c.fillStyle=g;c.fillRect(0,0,9e3,9e3)}}
/* ---------- sky ---------- */
function drawSky(c){const h=T/3600;const g=c.createLinearGradient(0,0,0,SV.hy);
 const day=['#5aa6e8','#a9d3f2'],dusk=['#3b4f9c','#f39a6b'],night=['#060a1e','#1b2350'];
 const mix=(a,b,t)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const r=(pa>>16)+((pb>>16)-(pa>>16))*t,gg=(pa>>8&255)+((pb>>8&255)-(pa>>8&255))*t,bb=(pa&255)+((pb&255)-(pa&255))*t;return`rgb(${r|0},${gg|0},${bb|0})`};
 const hx=v=>'#'+v.match(/\d+/g).map(n=>(+n).toString(16).padStart(2,'0')).join('');const top=mix(hx(mix(day[0],dusk[0],gf)),night[0],nf),bot=mix(hx(mix(day[1],dusk[1],gf)),night[1],nf);g.addColorStop(0,top);g.addColorStop(1,bot);c.fillStyle=g;c.fillRect(0,0,cw,SV.hy+2);
 if(nf>.2){const r=rnd(9);c.fillStyle='#fff';for(let i=0;i<220;i++){const x=r()*cw,y=r()*SV.hy*.9,tw=.5+.5*Math.sin(performance.now()/700+i);c.globalAlpha=(nf-.2)*(.3+.6*r())*tw;c.fillRect(x,y,r()<.1?2:1.2,r()<.1?2:1.2)}c.globalAlpha=1}
 if(nf<.9){const r=rnd(5),tt=performance.now()/1000;c.fillStyle='#fff';for(let i=0;i<7;i++){const y=SV.hy*(.12+r()*.45),x=((r()*cw*1.6+tt*(4+r()*6))%(cw*1.6))-cw*.3,s=40+r()*90;c.globalAlpha=(1-nf)*.55;
  for(let j=0;j<5;j++){c.beginPath();c.ellipse(x+j*s*.35,y-(j%2)*s*.12,s*.4,s*.18,0,0,7);c.fill()}}c.globalAlpha=1}}
/* ---------- guests (from the simulation) ---------- */
function simToWorld(gx,gy){ // map coords → street-scene metres (Main Street runs y 592 → 424, hub to 334, castle beyond)
 const TS=P_.townsq[1],HS=P_.hub[1]+48,HN=P_.hub[1]-48,CY=P_.castle[1];let z;if(gy>=TS)z=9+(gy-TS)*.12;else if(gy>=HS)z=15+(TS-gy)/(TS-HS)*185;else if(gy>=HN)z=200+(HS-gy)/(HS-HN)*70;else z=270+(HN-gy)/Math.max(10,HN-CY)*25;
 const lim=gy>=HS?10.4:gy>=HN?26:30;const x=Math.max(-lim,Math.min(lim,(gx-P_.mainst[0])*(gy>=HS?.22:.6)));return[x,z]}
const SKIN=['#f2c9a0','#d9a172','#a8714a','#7a4b2e','#f6d7b8'],HAIR=['#2b1d14','#5a3a22','#c9a25a','#1a1a1a','#8a5a3a'];
function person(c,x,y,k,sh,sk,hr,ph,mv,dark){const h=1.7*k;if(h<1.2){c.fillStyle=sh;c.fillRect(x-.4,y-h,1,h);return}
 const sw=mv?Math.sin(ph)*.18*k:0;c.strokeStyle=dark?'#1b2033':'#2d3550';c.lineWidth=Math.max(1,.16*k);c.beginPath();c.moveTo(x-.1*k,y-.85*k);c.lineTo(x-.12*k+sw,y);c.moveTo(x+.1*k,y-.85*k);c.lineTo(x+.12*k-sw,y);c.stroke();
 c.fillStyle=sh;c.beginPath();c.moveTo(x-.24*k,y-.85*k);c.lineTo(x-.2*k,y-1.42*k);c.lineTo(x+.2*k,y-1.42*k);c.lineTo(x+.24*k,y-.85*k);c.closePath();c.fill();
 c.fillStyle=sk;c.beginPath();c.arc(x,y-1.56*k,.15*k,0,7);c.fill();c.fillStyle=hr;c.beginPath();c.arc(x,y-1.6*k,.15*k,Math.PI,0);c.fill()}
/* Is a person at (x, z) out of sight behind the buildings? The sight line from the camera crosses the building
   frontage (x = ±STREET) at distance zb; if a building stands there (not a gap such as Center Street), the person is hidden.
   Guests out in the hub beyond the corner buildings, or on side streets, would otherwise be drawn on top of the facades. */
function svHidden(x,z){const dx=x-SV.pan,s=dx<0?-1:1,ex=s*STREET-SV.pan;if(Math.abs(dx)<=Math.abs(ex))return false;const zb=z*ex/dx;if(zb<20||zb>198)return false;
 return true} /* behind the frontage anywhere along Main Street, Center Street included (it is closed off at the back), so out of sight */
const BALL=['#ff4d6d','#ffd23f','#3bceac','#5e7cff','#ff8fd3'];
function drawGuests(c){const now=performance.now()/1000,list=[],clear=paradeBusy();
 for(let i=0;i<guests.length;i++){const g=guests[i];if(g.y<P_.castle[1]-30||g.y>P_.townsq[1]+40||Math.abs(g.x-P_.mainst[0])>120||g.st===7||g.st===1||g.st===2||g.st===3)continue;let[x0,z0]=simToWorld(g.x,g.y);if(z0<200){const hh=(i*7919)%1000/1000;x0=clear?(hh<.5?-1:1)*(8.1+(i*104729%1000/1000)*2.1):Math.max(-10.3,Math.min(10.3,x0+(hh-.5)*17))} /* during a parade everyone on Main Street stands along the kerbs, leaving the road to the floats */
  const n=g.n;for(let j=0;j<n;j++){const h=(i*131+j*977)%1000/1000,h2=(i*71+j*313)%1000/1000;let x=x0+(h-.5)*2.4;if(clear&&z0<200)x=Math.sign(x0)*Math.max(7.8,Math.min(10.4,Math.abs(x)));list.push([x,z0+(h2-.5)*3,g,j,i])}}
 for(const[x,z,u]of paradeStreetItems())list.push([x,z,null,u,-1]);
 list.sort((a,b)=>b[1]-a[1]);const dk=nf*.7;const tt=performance.now()/1000;
 for(const[x,z,g,j,i]of list){if(z<9||svHidden(x,z))continue;const p=svProj(x,0,z),k=SV.f/z;if(p[0]<-60||p[0]>cw+60)continue;
  if(!g){c.save();c.translate(p[0],p[1]);c.scale(.55,1);drawUnit(c,j,k,tt,nf>.35);c.restore();continue}/* heading toward the viewer, so seen narrower */
  const mv=g.st===0,col=SHIRT[(g.col+j)%SHIRT.length];const sh=dk>0?mixC(col,'#141a33',dk):col;
  person(c,p[0],p[1],k,sh,mixC(SKIN[(i+j)%5],'#141a33',dk),HAIR[(i*3+j)%5],now*7+i+j,mv,dk>.3);
  if((i+j)%23===0&&k>1.5){c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.6;c.beginPath();c.moveTo(p[0]+.25*k,p[1]-1.3*k);c.lineTo(p[0]+.45*k,p[1]-2.8*k);c.stroke();c.fillStyle=BALL[(i+j)%5];c.beginPath();c.ellipse(p[0]+.45*k,p[1]-3.1*k,.32*k,.38*k,0,0,7);c.fill()}}}
const mixC=(a,b,t)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const r=(pa>>16)+((pb>>16)-(pa>>16))*t,g=(pa>>8&255)+((pb>>8&255)-(pa>>8&255))*t,bb=(pa&255)+((pb&255)-(pa&255))*t;return`rgb(${r|0},${g|0},${bb|0})`};
/* horse-drawn streetcar (daytime) */
function drawStreetcar(c){const h=T/3600;if(h<9||h>14.5||paradeBusy())return;/* streetcars stop running before a parade */const per=420,u=(T%per)/per,dir=u<.5?1:-1,f=u<.5?u*2:(1-u)*2,z=20+f*170,x=dir>0?-.75:.75;
 const p=svProj(x,0,z),k=SV.f/z;if(z<6)return;const dk=nf*.7;
 c.fillStyle=mixC('#8a4b2a',dk?'#141a33':'#8a4b2a',dk);c.fillRect(p[0]-1.1*k,p[1]-3.1*k,2.2*k,2.4*k);c.fillStyle=mixC('#e8d7a8','#141a33',dk);c.fillRect(p[0]-1.2*k,p[1]-3.5*k,2.4*k,.45*k);
 c.fillStyle='#2b2b2b';c.fillRect(p[0]-1*k,p[1]-.75*k,2*k,.35*k);c.fillStyle='#7ea5c9';for(let i=0;i<3;i++)c.fillRect(p[0]+(-0.9+i*.62)*k,p[1]-2.8*k,.45*k,.8*k);
 // horse in front (toward the camera when heading south)
 const hz2=z+(dir>0?3.2:-3.2);if(hz2>5){const q=svProj(x,0,hz2),kk=SV.f/hz2;c.fillStyle=mixC('#d9c3a0','#141a33',dk);c.fillRect(q[0]-.4*kk,q[1]-1.7*kk,.8*kk,.9*kk);c.fillRect(q[0]-.25*kk,q[1]-2.3*kk,.5*kk,.7*kk);
  c.fillStyle='#3b2a1a';const l=Math.sin(performance.now()/180)*.1*kk;c.fillRect(q[0]-.35*kk+l,q[1]-.85*kk,.12*kk,.85*kk);c.fillRect(q[0]+.23*kk-l,q[1]-.85*kk,.12*kk,.85*kk)}}
/* ---------- Happily Ever After: soundtrack-synced fireworks ---------- */
const HEA={audio:new Audio(),ready:false,name:'',ci:0,lastSt:-9,rk:[],pt:[],smoke:[],fwC:null,auto:true,fade:0};
const HEA_EL=HEA.audio;HEA_EL.preload='auto';HEA_EL.addEventListener('canplay',()=>{FW.shows.hea.ready=true;if(HEA.audio===HEA_EL){HEA.ready=true;svBadge()}});
/* which fireworks show is on: mode 'auto' picks Minnie's when the live data says tonight is a party night (it lists
   Minnie's Wonderful Christmastime Fireworks), otherwise Happily Ever After; Entertainment can force either */
const FW={v:'hea',mode:'auto',shows:{hea:{n:'Happily Ever After',ready:false,el:HEA_EL},minnie:{n:'Minnie’s Wonderful Christmastime Fireworks',file:'audio/minnies-christmas-fireworks.mp3',ready:false,el:new Audio(),src:'folder'}}};
/* Disneyland: Believe… In Holiday Magic over Sleeping Beauty Castle. Its music is the owner's audio/believe-in-holiday-magic.mp3 (or
   the copy kept by Load audio folder / Load soundtrack…, key 'believe'); its bursts are CHOREO_BELIEVE once that is made from the
   track with tools/fireworks_from_audio.py, and until then Minnie's Christmas choreography stands in (the show then lasts as long
   as that). The Walt Disney World tracks aren't loaded at Disneyland. */
if(DL){FW.shows.believe={n:'Believe… In Holiday Magic',file:'audio/believe-in-holiday-magic.mp3',ready:false,el:new Audio(),src:'folder'};
 const M=FW.shows.believe,a=M.el;a.preload='auto';a.addEventListener('canplay',()=>{M.ready=true;if(HEA.audio===a){HEA.ready=true;HEA.name=M.n;svBadge()}});
 a.addEventListener('error',async()=>{if(M.src!=='folder')return;M.src='none';if(HEA.audio===a){HEA.name='';svBadge()}try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('believe');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob)blvUse(v.blob,v.name)}catch(e){}});
 setTimeout(()=>loadTrack(a,M.file),0)}
function blvUse(blob,name){const M=FW.shows.believe;if(!M)return;M.src='picked';M.el.src=URL.createObjectURL(blob);M.el.load();if(HEA.audio===M.el){HEA.name=name||M.n;svBadge()}}
function blvPick(){const i=document.createElement('input');i.type='file';i.accept='audio/*,.mp3,.m4a,.wav,.ogg';i.onchange=async()=>{const f=i.files[0];if(!f)return;blvUse(f,f.name);try{await saveFile('believe',f)}catch(e){}};i.click()}
if(!DL){const M=FW.shows.minnie,a=M.el;a.preload='auto';a.addEventListener('canplay',()=>{M.ready=true;if(HEA.audio===a){HEA.ready=true;svBadge()}});
 a.addEventListener('error',async()=>{if(M.src!=='folder')return;M.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('minnie');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){M.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 setTimeout(()=>loadTrack(a,M.file),0)}
const fwName=()=>FW.shows[FW.v].n;
function fwSet(v){if(v===FW.v||(v==='minnie'||v==='believe')&&typeof CHOREO_MINNIE==='undefined')return;const ev=EV.find(e=>e.id==='fire');if(ev&&ev.ph==='live')return; /* never switch in the middle of a show */
 if(!HEA.audio.paused)HEA.audio.pause();if(FW.v==='hea')HEA.hname=HEA.name;FW.v=v;const S=FW.shows[v];HEA.audio=S.el;HEA.ready=S.ready;HEA.name=v==='hea'?(HEA.hname||HEA.name):S.n;CHOREO=v==='minnie'?CHOREO_MINNIE:v==='believe'?(typeof CHOREO_BELIEVE!=='undefined'?CHOREO_BELIEVE:CHOREO_MINNIE):CHOREO_HEA;
 HEA.ci=0;HEA.lastSt=-9;HEA.rk.length=0;HEA.pt.length=0;if(ev){ev.n=S.n+' (fireworks)';if(!ev.userDur)ev.dur=Math.ceil(CHOREO.end/6)/10+.3}if(typeof svBadge==='function')svBadge()}
function fwAuto(){if(DL)return fwSet('believe');fwSet(FW.mode!=='auto'?FW.mode:(typeof LIVENOW!=='undefined'&&LIVENOW&&LIVE.fwShow==='minnie'?'minnie':'hea'))}
const IDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('mk-sim',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function heaSave(file){try{const db=await IDB();await new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put({blob:file,name:file.name},'hea');t.oncomplete=res;t.onerror=()=>rej(t.error)})}catch(e){console.warn('Could not save the soundtrack in this browser',e)}}
async function heaLoadSaved(){try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('hea');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob)heaUse(v.blob,v.name)}catch(e){}}
function heaUse(blob,name){HEA.src='picked';HEA.name=name||'soundtrack';HEA_EL.src=URL.createObjectURL(blob);HEA_EL.load();svBadge()}
function heaPick(){const i=document.createElement('input');i.type='file';i.accept='audio/*,.mp3,.m4a,.wav,.ogg';i.onchange=()=>{const f=i.files[0];if(!f)return;heaUse(f,f.name);heaSave(f)};i.click()}
const fireEv=()=>EV.find(e=>e.id==='fire');
function showClock(){const ev=fireEv();if(!ev||ev.key==null||(ev.ph!=='live'&&ev.ph!=='done'))return null;return T-ev.key}
/* Tinker Bell's flight: near the end of the show she flies from the top of the castle down toward Tomorrowland, trailing pixie dust.
   tinkU() is how far along she is (0–1), or null when she isn't flying. */
const WELCOME_CAST=['donald','daisy','mickey','minnie','goofy']; // on the castle stage for the welcome show
/* The Kiss Goodnight: half an hour after closing the castle shimmers for a couple of minutes. Sparkles are added over the
   castle wherever it is on screen (the map or the Main Street view). */
function kissSparkle(){const e=EV.find(x=>x.id==='kiss');if(!e||e.ph!=='live'||!playing)return;let x0,y0,w,h;
 if(SV.on){const C=SV.C;if(!C.castle)return;w=C.castle.width/dpr;h=C.castle.height/dpr;x0=C.cox;y0=C.coy}else{const[bx,by,bw,bh]=MAP.castleBox,a=toS(bx,by),z=zf();x0=a[0];y0=a[1];w=bw*z;h=bh*z}
 for(let i=0;i<5;i++){const u=Math.random(),v=Math.random()**.7;HEA.pt.push({x:x0+w*(.5+(u-.5)*(.25+.6*v)),y:y0+h*(.05+.9*v),vx:0,vy:4,l:.5+Math.random()*.7,m:1.2,h:45+Math.random()*20,s:70,li:90,dr:1,g:0,w:1.3,fl:1})}}
const TINK={t0:1040,dur:27}; // 17:20 into the show, at "You Can Fly"
const tinkU=st=>FW.v==='hea'&&st!==null&&st>=TINK.t0&&st<=TINK.t0+TINK.dur?(st-TINK.t0)/TINK.dur:null;
// draw her at screen point (x,y), s pixels per metre, leaning along her line of flight
function drawTink(c,x,y,s,lean){const r=s*2.6,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,250,190,.85)');g.addColorStop(.35,'rgba(210,255,140,.3)');g.addColorStop(1,'rgba(200,255,120,0)');
 c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
 c.save();c.translate(x,y);c.rotate(lean);drawChar(c,s,0,.55,'tink',performance.now()/1000);c.restore();
 if(playing)for(let i=0;i<3;i++)HEA.pt.push({x:x+(Math.random()-.5)*s,y:y+(Math.random()-.3)*s,vx:-18+(Math.random()-.5)*26,vy:-6+Math.random()*22,l:1.1+Math.random()*.6,m:1.7,h:50+Math.random()*30,s:95,li:78,dr:.955,g:16,w:1,fl:Math.random()<.35})}
function heaSection(st){const S=CHOREO.sec;let i=0;while(i<S.length-2&&st>=S[i+1])i++;return i}
const envAt=st=>CHOREO.env[Math.max(0,Math.min(CHOREO.env.length-1,Math.floor(st*2)))]||0;
function heaSync(){fwAuto();const ev=fireEv(),st=showClock(),a=HEA.audio,live=ev&&ev.ph==='live';
 if(live&&HEA.liveKey!==ev.key){HEA.liveKey=ev.key;if(HEA.ready&&HEA.auto&&speed!==1&&!FF){speed=1;sync();toast(fwName()+' is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=live&&HEA.ready&&playing&&speed===1&&!FF&&st!==null&&st<a.duration-.5;
 if(want){setVol(a,(AU.mute?0:AU.v.master)*1.1*(1-.85*(typeof ewpNear==='function'&&ewpPlaying()?ewpNear():0))*(1-(typeof lumNear==='function'&&lumPlaying()?lumNear():0)));/* quieter when the map is out at the water pageant */if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{HEA.blocked=true;svBadge()})}
  else syncTrack(HEA,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})} // the soundtrack is the master clock
 else if(!a.paused){a.pause()}}
function hsl(h,s,l,a){return`hsla(${h},${s}%,${l}%,${a})`}
const TRAIL=9; // how many past positions each spark's trail is drawn through
function heaFrame(rdt){const st=showClock();kissSparkle();
 if(!HEA.fwC||HEA.fwC.width!==cw*dpr||HEA.fwC.height!==ch*dpr){HEA.fwC=mkCanvas(cw*dpr,ch*dpr);HEA.fx=HEA.fwC.getContext('2d')}
 /* The layer is wiped clean every frame and each spark draws its own short trail from the last few places it has been.
    (Fading the old picture a little each frame instead leaves faint ghosts behind, because very dim pixels never round down to nothing.) */
 const fx=HEA.fx;fx.setTransform(1,0,0,1,0,0);fx.clearRect(0,0,HEA.fwC.width,HEA.fwC.height);fx.setTransform(dpr,0,0,dpr,0,0);fx.globalCompositeOperation='lighter';fx.lineCap=fx.lineJoin='round';
 const sdt=playing?rdt*Math.min(speed,5):0;
 if(st!==null&&st<CHOREO.end+20){if(st<HEA.lastSt-.5||st>HEA.lastSt+6){HEA.ci=0;while(HEA.ci<CHOREO.cues.length&&cueLaunch(CHOREO.cues[HEA.ci])<st)HEA.ci++;HEA.rk.length=0;HEA.pt.length=0}
  let n=0;while(HEA.ci<CHOREO.cues.length&&cueLaunch(CHOREO.cues[HEA.ci])<=st){const q=CHOREO.cues[HEA.ci++];if(speed<=5||q[5]>1||n<3){launch(q);n++}}
  HEA.lastSt=st}else HEA.lastSt=-9;
 // rockets
 for(let i=HEA.rk.length-1;i>=0;i--){const r=HEA.rk[i];r.t+=sdt;const u=Math.min(1,r.t/r.rise),e=1-Math.pow(1-u,2.2);const x=r.x0+(r.x1-r.x0)*e,y=r.y0+(r.y1-r.y0)*e;
  const tr=r.tr||(r.tr=[]);if(sdt>0){tr.push(x,y);if(tr.length>20)tr.splice(0,2)}
  fx.strokeStyle=r.kind==='comet'?hsl(r.h,90,70,.9):'rgba(255,220,170,.85)';fx.lineWidth=r.kind==='comet'?2.4:1.4;fx.beginPath();fx.moveTo(tr[0]??x,tr[1]??y);for(let k=2;k<tr.length;k+=2)fx.lineTo(tr[k],tr[k+1]);fx.lineTo(x,y);fx.stroke();
  if(r.kind==='comet'&&Math.random()<.6)HEA.pt.push({x,y,vx:(Math.random()-.5)*20,vy:Math.random()*20,l:.5,m:.5,h:r.h,s:90,li:70,dr:.9,g:30,w:1});
  if(u>=1){HEA.rk.splice(i,1);if(r.kind!=='comet')burst(r,x,y)}}
 // particles
 const now=performance.now();
 for(let i=HEA.pt.length-1;i>=0;i--){const p=HEA.pt[i];p.l-=sdt;if(p.l<=0){if(p.split){for(let k=0;k<4;k++){const a=k/4*6.283+Math.random();HEA.pt.push({x:p.x,y:p.y,vx:Math.cos(a)*55*p.k,vy:Math.sin(a)*55*p.k,l:.9,m:.9,h:p.h,s:100,li:65,dr:.97,g:40,w:1.4})}}HEA.pt.splice(i,1);continue}
  if(sdt>0){const tr=p.tr||(p.tr=new Float32Array(TRAIL*2)),j=((p.tn=(p.tn||0)+1)-1)%TRAIL*2;tr[j]=p.x;tr[j+1]=p.y; // remember where it has just been
   const d=Math.pow(p.dr,sdt*60);p.vx*=d;p.vy=p.vy*d+p.g*sdt;p.x+=p.vx*sdt;p.y+=p.vy*sdt}
  const a=Math.min(1,p.l/p.m*1.6),tn=p.tn||0,n=Math.min(TRAIL,tn);
  if(p.fl&&Math.random()<.5)continue;
  if(n){fx.strokeStyle=hsl(p.h,p.s,p.li+(1-a)*10,a*.8);fx.lineWidth=p.w*1.15;fx.beginPath();for(let k=tn-n;k<tn;k++){const j=k%TRAIL*2;k===tn-n?fx.moveTo(p.tr[j],p.tr[j+1]):fx.lineTo(p.tr[j],p.tr[j+1])}fx.lineTo(p.x+.01,p.y+.01);fx.stroke()}
  fx.fillStyle=hsl(p.h,p.s*.6,88,a);fx.fillRect(p.x-p.w*.6,p.y-p.w*.6,p.w*1.2,p.w*1.2)}
 // smoke
 for(let i=HEA.smoke.length-1;i>=0;i--){const s=HEA.smoke[i];s.l-=sdt;s.x+=6*sdt;s.r+=4*sdt;if(s.l<=0)HEA.smoke.splice(i,1)}
 SV.fl=Math.max(0,SV.fl-rdt*2.2)}
/* A fuller show. choreo.js holds the cues derived from the soundtrack; this adds to them every time the page loads, the
   same way each time: partner shells beside the originals, comets and mines mirrored into pairs, extra shells wherever
   the music is loud, and three-circle "Mickey" shells on the big moments and all through the finale. */
function augmentChoreo(){const C=CHOREO.cues,out=[],SH=['peony','chrys','ring','willow','crossette','strobe','peony','chrys'],cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const H=i=>{let n=Math.imul(i+1,2654435761)>>>0;n^=n>>>15;n=Math.imul(n,2246822519)>>>0;n^=n>>>13;return(n>>>0)/4294967296}; // a repeatable "random" number for cue i
 C.forEach((q,i)=>{out.push(q);const[t,k,x,alt,h,sz]=q,r=H(i),r2=H(i+7777),r3=H(i+31337);
  if(k==='comet'){if(r<.7)out.push([t,k,-x,alt,h,sz]);if(r2<.3)out.push([t+.12,k,x*.5,cl(alt+.1,0,1),h,sz*.9])}
  else if(k==='mine'){if(r<.6)out.push([t,k,-x,alt,h,sz])}
  else{if(r<.75)out.push([t+.1+r2*.3,r3<.5?k:SH[(r3*16|0)&7],cl(-x+(r2-.5)*.3,-1,1),cl(alt+(r3-.5)*.3,.2,1),h+(r2<.5?0:40),sz*(.7+r3*.3)]);
   if(r>.55)out.push([t+.25+r3*.4,'peony',cl(x+(r-.5)*.9,-1,1),cl(alt*.7+.1,.2,1),h+20,sz*.65])}});
 for(let i=16;i<CHOREO.end*2;i++){const e=CHOREO.env[i]||0,r=H(i+50000),t=i/2+H(i+60000)*.5,pl=CHOREO.pal[heaSection(t)];
  if(e>.4&&r<(e-.3)*.8)out.push([t,SH[H(i+1)*8|0],(H(i+2)-.5)*1.7,.35+H(i+3)*.6,pl[H(i+4)<.5?0:1]+(H(i+5)-.5)*24,.55+e*.5]);
  else if(e<=.4&&i%5===0&&r<.5){const x=.2+H(i+2)*.6,a=.25+H(i+3)*.3;out.push([t,'comet',x,a,pl[0],.7],[t,'comet',-x,a,pl[0],.7])}}
 let last=-99;C.forEach((q,i)=>{const[t,k,,,h,sz]=q;if(k!=='comet'&&k!=='mine'&&sz>=1.05&&t>20&&t-last>13&&t<CHOREO.end-30){last=t;out.push([t+.05,'mickey',(H(i+9)-.5)*.9,.72+H(i+10)*.25,h,1.15+H(i+11)*.3])}});
 for(let t=CHOREO.end-28,n=0;t<CHOREO.end-3;t+=2.1,n++)out.push([t,'mickey',[-.5,.5,0][n%3],.7+H(n+900)*.3,CHOREO.pal[heaSection(t)][n%2],1.2+H(n+950)*.3]);
 for(const[x,a]of[[-.85,.8],[0,1],[.85,.8]])out.push([CHOREO.end-1.4,'mickey',x,a,45,1.3]);
 CHOREO.cues=out.sort((a,b)=>cueLaunch(a)-cueLaunch(b))}
/* Two fireworks shows share this engine: Happily Ever After (choreo.js), and on Christmas party nights Minnie's
   Wonderful Christmastime Fireworks (choreo-minnie.js, derived from its soundtrack by tools/fireworks_from_audio.py).
   CHOREO is whichever is showing; both get the same fuller-show treatment above. */
const CHOREO_HEA=CHOREO;augmentChoreo();
if(typeof CHOREO_MINNIE!=='undefined'){CHOREO=CHOREO_MINNIE;augmentChoreo();CHOREO=CHOREO_HEA}if(typeof CHOREO_BELIEVE!=='undefined'){CHOREO=CHOREO_BELIEVE;augmentChoreo();CHOREO=CHOREO_HEA}
function streetShell(q){const[t,kind,cx,alt]=q;const z=CZ+60+Math.abs(cx)*30,wx=cx*85,wy=kind==='mine'?2:kind==='comet'?18+alt*45:38+alt*62;
 return{b:svProj(wx*(kind==='comet'?.6:1)+(kind==='comet'?(Math.random()-.5)*14:0),kind==='comet'?24:6,z),e:svProj(wx,wy,z),k:SV.f/z,m:svProj(wx,24,z)[1]}}
function cueLaunch(q){const[t,k,x,alt]=q;return t-(k==='comet'||k==='mine'?.9+alt*.8:1.3+alt*1.3)}
function launch(q){const[t,kind,cx,alt,h,sz]=q;const P=SV.on?streetShell(q):mapShell(q),b=P.b,e=P.e,k=P.k;
 const rise=kind==='comet'||kind==='mine'?.9+alt*.8:1.3+alt*1.3;
 if(kind==='mine'){burst({kind,h,sz,k},b[0],P.m);return}
 HEA.rk.push({kind,h,sz,k,x0:b[0],y0:b[1],x1:e[0],y1:e[1],rise,t:0})}
function burst(r,x,y){const{kind,h,sz,k}=r,R=82*sz*k;const P=HEA.pt,D=P.length>5200?.4:P.length>3600?.65:1;let n; // D: thin out new bursts when the sky is already full, to keep the frame rate up
 const add=(vx,vy,o)=>P.push(Object.assign({x,y,vx,vy,l:1.6,m:1.6,h,s:100,li:62,dr:.965,g:28*k*1.1,w:1.6},o));
 switch(kind){
  case'peony':n=80*D;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=R*(.75+Math.random()*.35);add(Math.cos(a)*s,Math.sin(a)*s,{h:h+Math.random()*20})}break;
  case'chrys':n=120*D;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=R*(.6+Math.random()*.6);add(Math.cos(a)*s,Math.sin(a)*s,{l:2.3,m:2.3,dr:.972,w:1.2,li:70})}break;
  case'ring':n=64;{const tl=Math.random()*.6+.3,rot=Math.random()*6.28;for(let i=0;i<n;i++){const a=i/n*6.283,u=Math.cos(a)*R,v=Math.sin(a)*R*tl;add(u*Math.cos(rot)-v*Math.sin(rot),u*Math.sin(rot)+v*Math.cos(rot),{w:2})}}break;
  case'crossette':n=26;for(let i=0;i<n;i++){const a=i/n*6.283;add(Math.cos(a)*R*.7,Math.sin(a)*R*.7,{l:.7,m:.7,split:1,k,li:72})}break;
  case'willow':n=110*D;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=R*(.5+Math.random()*.5);add(Math.cos(a)*s,Math.sin(a)*s,{h:40+Math.random()*8,s:95,li:58,l:3.6,m:3.6,dr:.955,g:42*k,w:1.3})}break;
  case'strobe':n=46*D;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=R*Math.random();add(Math.cos(a)*s,Math.sin(a)*s,{s:0,li:96,fl:1,l:2.2,m:2.2,w:2.2,dr:.94})}break;
  case'mine':n=60*D;for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*.9,s=R*1.6*(.5+Math.random()*.6);add(Math.cos(a)*s,Math.sin(a)*s,{l:1.2,m:1.2,g:70*k})}break;
  // three circles: a round head and two round ears, drawn in sparks. Every spark flies out along its own place in the outline, so the shape holds as it grows
  case'mickey':{const rot=(Math.random()-.5)*.3,cr=Math.cos(rot),sr=Math.sin(rot),pt=(u,v)=>add((u*cr-v*sr)*R,(u*sr+v*cr)*R,{w:2.1,l:2.1,m:2.1,dr:.96,g:18*k,li:66});
   for(let i=0;i<46;i++){const a=i/46*6.283;pt(Math.cos(a)*.62,Math.sin(a)*.62)}
   for(const sd of[-1,1])for(let i=0;i<30;i++){const a=i/30*6.283,u=sd*.67+Math.cos(a)*.39,v=-.69+Math.sin(a)*.39;if(Math.hypot(u,v)>.64)pt(u,v)}}break;
  default:for(let i=0;i<50;i++){const a=Math.random()*6.283;add(Math.cos(a)*R,Math.sin(a)*R)}}
 add(0,0,{s:0,li:100,w:6,l:.12,m:.12});
 HEA.smoke.push({x,y,r:R*.6,l:14,m:14});if(HEA.smoke.length>40)HEA.smoke.shift();
 SV.fl=Math.min(1,SV.fl+.35*sz);SV.flH=h;
 const tnow=performance.now();if(AU.ready&&speed<=5&&tnow-(AU.last.fwb||0)>75&&(AU.last.fwb=tnow))play('fw'+(1+(Math.random()*6|0)),Math.min(.9,.25+.35*sz),AU.g.show,.18,.8+Math.random()*.35)}
/* castle projection: abstract, palette-driven patterns timed to the soundtrack's sections and loudness */
function drawProjection(c,w,h,st){const sec=heaSection(st),pal=CHOREO.pal[sec],E=envAt(st),t=st;
 c.save();c.globalCompositeOperation='source-atop';const A=.35+.55*E;
 const g=c.createLinearGradient(0,h,0,0);g.addColorStop(0,hsl(pal[0],80,55,A));g.addColorStop(1,hsl(pal[1],80,60,A*.8));c.fillStyle=g;c.fillRect(0,0,w,h);
 switch(sec%5){
  case 0:for(let i=0;i<40;i++){const x=(i*53+t*30)%w,y=(i*97+t*14*(i%3+1))%h;c.fillStyle=hsl(pal[1],90,85,.8*E);c.beginPath();c.arc(x,y,1.5+(i%4),0,7);c.fill()}break;
  case 1:for(let i=0;i<8;i++){const x=((i/8+t*.05)%1)*w;c.fillStyle=hsl(i%2?pal[0]:pal[1],85,62,.45*A);c.fillRect(x,0,w/16,h)}break;
  case 2:{const cx=w/2,cy=h*.55;for(let i=0;i<10;i++){c.strokeStyle=hsl(pal[i%2],90,70,.5*A);c.lineWidth=4;c.beginPath();c.arc(cx,cy,(i*w/14+t*40)%(w*.8),0,7);c.stroke()}}break;
  case 3:for(let i=0;i<14;i++){const y=h-((i/14+t*.08)%1)*h;c.fillStyle=hsl(pal[i%2],90,65,.35*A);c.beginPath();for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x/30+t*2+i)*10);c.lineTo(w,h);c.lineTo(0,h);c.fill()}break;
  case 4:for(let i=0;i<24;i++){const x=(i*37)%w,y=h-((i*23+t*60)%h),s=6+(i%5)*3;c.fillStyle=hsl(pal[0],95,70,.5*A);c.beginPath();c.moveTo(x,y+s*.3);c.bezierCurveTo(x-s,y-s*.6,x-s*.4,y-s,x,y-s*.35);c.bezierCurveTo(x+s*.4,y-s,x+s,y-s*.6,x,y+s*.3);c.fill()}}
 c.restore()}
/* ---------- frame ---------- */
function drawStreet(rdt){if(SV.dirty)buildStatic();buildTint();heaSync();const C=SV.C;
 cx.setTransform(dpr,0,0,dpr,0,0);drawSky(cx);
 // fireworks + smoke sit behind the castle
 heaFrame(rdt);
 for(const s of HEA.smoke){const a=Math.min(1,s.l/s.m)*.07,lit=.25+SV.fl*.7,col=`${150*lit+40|0},${140*lit+40|0},${170*lit+50|0}`,g=cx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);cx.fillStyle=g;cx.fillRect(s.x-s.r,s.y-s.r,s.r*2,s.r*2)}
 cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalCompositeOperation='lighter';cx.drawImage(HEA.fwC,0,0);cx.restore();
 cx.drawImage(C.groundT,0,0,cw,ch);
 // castle
 const cwid=C.castle.width/dpr,chgt=C.castle.height/dpr;cx.drawImage(C.castleT,C.cox,C.coy,cwid,chgt);
 const st=showClock();
 if(st!==null&&st<CHOREO.end+5&&nf>.3){const pc=C.proj.getContext('2d');pc.setTransform(1,0,0,1,0,0);pc.globalCompositeOperation='copy';pc.drawImage(C.castle,0,0);pc.setTransform(dpr,0,0,dpr,0,0);drawProjection(pc,cwid,chgt,Math.max(0,st));
  cx.globalAlpha=Math.min(CASTLE_IMG?.62:1,Math.max(0,st)/4,(CHOREO.end+5-st)/5);cx.drawImage(C.proj,C.cox,C.coy,cwid,chgt);cx.globalAlpha=1}
 if(SV.fl>0){cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=SV.fl*.18;cx.drawImage(C.castle,C.cox,C.coy,cwid,chgt);cx.restore()}
 {const w=EV.find(e=>e.id==='welcome');if(w&&w.ph==='live'){const z=CZ-9,k=SV.f/z*2.2,t=performance.now()/1000;WELCOME_CAST.forEach((who,i)=>{const p=svProj((i-(WELCOME_CAST.length-1)/2)*3.4,7,z);drawChar(cx,k,p[0]/k,p[1]/k,who,t)})}}
 {const u=tinkU(st);if(u!==null){const z=CZ-u*70,p=svProj(u*104,70-u*56+Math.sin(u*Math.PI)*-3,z);drawTink(cx,p[0],p[1],SV.f/z*3.4,.5)}}
 cx.drawImage(C.treesT,0,0,cw,ch);
 if(nf>.4&&SV.twinkle){const tt=performance.now()/400;cx.fillStyle='#fff6d8';for(const[x,y,p]of SV.twinkle){cx.globalAlpha=(nf-.4)*(.5+.5*Math.sin(tt+p));cx.fillRect(x,y,1.5,1.5)}cx.globalAlpha=1}
 cx.drawImage(C.frontT,0,0,cw,ch);
 if(SV.flags){const tt=performance.now()/300;for(const[x,y,k,s]of SV.flags){cx.fillStyle=nf>.5?'#5a2a3a':'#d23a4a';cx.beginPath();cx.moveTo(x,y);for(let i=0;i<=6;i++){const u=i/6;cx.lineTo(x-s*u*1.8*k,y+Math.sin(tt+u*4)*.2*k)}for(let i=6;i>=0;i--){const u=i/6;cx.lineTo(x-s*u*1.8*k,y+1.1*k+Math.sin(tt+u*4)*.2*k)}cx.fill()}}
 drawStreetcar(cx);drawGuests(cx);
 if(nf>0){cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,nf*1.3);cx.drawImage(C.glow,0,0,cw,ch);cx.restore()}
 if(SV.fl>0){cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle=hsl(SV.flH,80,60,SV.fl*.08*nf);cx.fillRect(0,0,cw,ch);cx.restore()}
 svOverlay(st)}
/* on-canvas show banner */
function svOverlay(st){const ev=fireEv();let txt=null;
 if(ev&&ev.ph==='gather')txt='Guests gathering for '+fwName();else if(st!==null&&ev.ph==='live')txt=st<CHOREO.end?`${fwName()}  ${Math.floor(st/60)}:${String(Math.floor(st%60)).padStart(2,'0')} / ${Math.floor(CHOREO.end/60)}:${String(CHOREO.end%60|0).padStart(2,'0')}`:fwName()+' has ended — exit music';
 const b=$('#svb');if(b){b.style.display=txt?'block':'none';if(txt)b.textContent=txt}}
function svBadge(){const el=$('#heaStat');if(el)el.innerHTML=HEA.name?`<b>${HEA.name.replace(/[<>&]/g,'')}</b> — ${HEA.ready?'ready':'loading…'}${HEA.blocked?' (tap Play to allow audio)':''}`:'No soundtrack loaded. The show still runs, silently, with the choreography.'}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),4200)}
/* The soundtrack is read from audio/happily-ever-after.mp3. If it isn't there (or the page is opened straight
   from disk), a file chosen with "Load soundtrack…" is used instead and remembered in this browser. */
const HEA_FILE='audio/happily-ever-after.mp3';
/* Load a soundtrack fully into memory first, so it can jump to any point instantly on any web server
   (simple local servers can't seek inside a file that's still streaming). From disk, fall back to the plain file. */
/* Keep a playing soundtrack and the simulation together. d = how far the music is ahead of the show clock (s).
   After a deliberate time jump, the music moves to the new time. Otherwise the music is the master: if the
   simulation fell behind (tab in the background, a slow frame), the simulation fast-forwards to the music. */
function syncTrack(o,a,d,moveMusic){
 if(o.seekSeen!==SEEKGEN){o.seekSeen=SEEKGEN;if(Math.abs(d)>.4)moveMusic();return}
 if(Math.abs(d)<=.4)return;
 if(d>0&&d<900){if(d>2){CATCHUP=true;seek(T+d,false);CATCHUP=false}else T+=d}  // simulation behind: catch it up
 else if(d<0&&d>-2)T+=d          // music slightly behind (buffering): let the simulation wait a moment
 else moveMusic()}               // anything else: put the music where the show is
function loadTrack(audio,path){streamUrl(path).then(u=>{audio.src=u||path;audio.load()})} /* streamed when the server allows it (see streamUrl in audio.js); a missing file still errors, so the saved-folder copy takes over */
function heaInit(){if(DL)return; /* Happily Ever After is Magic Kingdom's */HEA.name=HEA_FILE;HEA.src='folder';loadTrack(HEA.audio,HEA_FILE);
 HEA.audio.addEventListener('error',()=>{if(HEA.src==='folder'){HEA.src='none';HEA.name='';HEA.ready=false;svBadge();heaLoadSaved()}})}
heaInit();
