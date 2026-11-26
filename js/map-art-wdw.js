/* Walt Disney World's buildings, less generic (owner, 25 Nov 2026: "Make the disney world buildings look less generic as well
   now. Start with magic kingdom area"). Loaded after map-art.js. wdwBuilding(q,bb,land,hh,hs) is called for every building in
   paintMap at Walt Disney World, like dlBuilding at Disneyland: it returns a draw function (c,e), a list of {y,f}, false to skip
   the building, or null for the normal painting. So far it covers the Magic Kingdom (inside the railroad loop).
   Each land gets its own façade detail on top of its colours (the `deco` hook of extrude), and the landmarks are drawn by name:
   the Haunted Mansion's brick manor in front of its show building, the small world entrance, the Hall of Presidents' cupola,
   Be Our Guest's castle towers, Prince Eric's castle on the Little Mermaid building, the Cambodian temple, the Tiki Room's thatch.
   Buildings keep their real outlines and directions; nothing is turned toward the camera. */

/* the window grid extrude draws on a wall (same maths), so façade details can sit round each window */
function wdwWins(L,h,cb){if(L<=3||h<=3)return;const rows=Math.max(1,Math.floor(h/3.6)),cols=Math.max(1,Math.floor(L/3.1));
 for(let r=0;r<rows;r++)for(let k=0;k<cols;k++)cb((k+.3)/cols,(k+.7)/cols,h*(r+.32)/rows,h*(r+.68)/rows)}
const wdwAt=(p,q,t,v)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t-v];
function wdwBand(c,p,q,v0,v1,col){poly4(c,[wdwAt(p,q,0,v0),wdwAt(p,q,1,v0),wdwAt(p,q,1,v1),wdwAt(p,q,0,v1)],col)}
function wdwLine(c,p,q,v,col,w){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...wdwAt(p,q,0,v));c.lineTo(...wdwAt(p,q,1,v));c.stroke()}

/* Liberty Square: colonial Philadelphia and New England: a white cornice and corner boards, dark green or black shutters by the windows */
function libDeco(c,p,q,L,h){if(h<3)return;wdwBand(c,p,q,h-.7,h,'#f6f1e6');wdwLine(c,p,q,h-1,'rgba(0,0,0,.12)',.2);
 const sh=hsh((p[0]*7+p[1]*3)|0)%2?'#2f4a3a':'#2b2e33';wdwWins(L,h,(t0,t1,v0,v1)=>{const w=(t1-t0)*.45;poly4(c,[wdwAt(p,q,t0-w,v0),wdwAt(p,q,t0,v0),wdwAt(p,q,t0,v1),wdwAt(p,q,t0-w,v1)],sh);poly4(c,[wdwAt(p,q,t1,v0),wdwAt(p,q,t1+w,v0),wdwAt(p,q,t1+w,v1),wdwAt(p,q,t1,v1)],sh);
  c.fillStyle='#f6f1e6';const a=wdwAt(p,q,t0,v1),b=wdwAt(p,q,t1,v1);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(b[0],b[1]+.3);c.lineTo(a[0],a[1]+.3);c.fill()});
 for(const t of[0,1]){const a=wdwAt(p,q,t,0);c.fillStyle='#f6f1e6';c.fillRect(a[0]-.25,a[1]-h,.5,h)}}

/* Fantasyland's village: half-timbered plaster, dark beams along each storey, upright posts and braces in the upper floor */
function fanDeco(c,p,q,L,h){if(h<4||L<3)return;const T='rgba(92,62,40,.85)';wdwLine(c,p,q,h*.5,T,.45);wdwLine(c,p,q,h-.3,T,.45);wdwLine(c,p,q,.3,T,.3);
 const n=Math.max(2,Math.round(L/1.8));c.strokeStyle=T;c.lineWidth=.3;c.beginPath();for(let i=0;i<=n;i++){const t=i/n;c.moveTo(...wdwAt(p,q,t,h*.5));c.lineTo(...wdwAt(p,q,t,h-.3));
  if(i<n&&i%2===0){c.moveTo(...wdwAt(p,q,t,h*.5));c.lineTo(...wdwAt(p,q,(i+1)/n,h-.3))}}c.stroke()}

/* Frontierland: board-and-batten walls, a porch roof along the front, and a square false front rising over the roofline */
function frDeco(c,p,q,L,h){if(h<2.5)return;c.strokeStyle='rgba(60,36,20,.22)';c.lineWidth=.15;c.beginPath();for(let v=.6;v<h;v+=.7){c.moveTo(...wdwAt(p,q,0,v));c.lineTo(...wdwAt(p,q,1,v))}c.stroke();
 if(L>4){const a=wdwAt(p,q,.08,h),b=wdwAt(p,q,.92,h),f=Math.min(2.2,h*.3);poly4(c,[a,b,[b[0],b[1]-f],[a[0],a[1]-f]],tone('#b98352',-.05));c.fillStyle='#e9dcc0';c.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1])-f-.3,Math.abs(b[0]-a[0]),.35);
  const v=Math.min(h*.45,3.2);poly4(c,[wdwAt(p,q,.02,v),wdwAt(p,q,.98,v),[wdwAt(p,q,.98,v)[0],wdwAt(p,q,.98,v)[1]+1.1],[wdwAt(p,q,.02,v)[0],wdwAt(p,q,.02,v)[1]+1.1]],'#6f4a2f');
  c.fillStyle='rgba(60,36,20,.7)';for(let i=0;i<=Math.round(L/2.4);i++){const x=wdwAt(p,q,.02+.96*i/Math.max(1,Math.round(L/2.4)),0);c.fillRect(x[0]-.15,x[1]-v+1.1,.3,v-1.1)}}}

/* Adventureland: Caribbean and Moroccan stucco: a darker plinth, a terracotta band under the roof, dark wooden lintels */
function advDeco(c,p,q,L,h){if(h<2.5)return;wdwBand(c,p,q,0,Math.min(.9,h*.15),'rgba(120,80,50,.28)');wdwBand(c,p,q,h-.8,h-.2,'#b8603a');
 wdwWins(L,h,(t0,t1,v0,v1)=>{const a=wdwAt(p,q,t0-.03,v1+.1),b=wdwAt(p,q,t1+.03,v1+.1);c.fillStyle='#5a3a24';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(b[0],b[1]-.45);c.lineTo(a[0],a[1]-.45);c.fill()})}

/* Tomorrowland: white panels, two blue bands and thin silver fins */
function tomDeco(c,p,q,L,h){if(h<3)return;wdwBand(c,p,q,h*.62,h*.62+.6,'#3f7fd0');wdwBand(c,p,q,h*.62+1,h*.62+1.25,'#7fb3ea');wdwBand(c,p,q,h-.45,h,'#f8fbff');
 const n=Math.max(1,Math.round(L/3));c.strokeStyle='rgba(120,140,165,.55)';c.lineWidth=.25;c.beginPath();for(let i=1;i<n;i++){const t=i/n;c.moveTo(...wdwAt(p,q,t,0));c.lineTo(...wdwAt(p,q,t,h))}c.stroke()}

/* clip a footprint by a half-plane (keep the side where (x-ax,y-ay)·(dx,dy) >= k) */
function wdwHalf(P,ax,ay,dx,dy,k){const s=v=>(v[0]-ax)*dx+(v[1]-ay)*dy-k,out=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],sa=s(a),sb=s(b);if(sa>=0)out.push(a);if((sa>=0)!==(sb>=0)){const t=sa/(sa-sb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return out}
function wdwCen(P){let x=0,y=0;for(const p of P){x+=p[0];y+=p[1]}return[x/P.length,y/P.length]}
/* a show building, "go-away green" as at Disneyland: sage walls, a pale roof with rooftop units, no windows, kept low */
function wdwShowBox(c,P,hh,hs){const h=Math.min(hh,9*OSM.S);extrude(c,null,P,h,['#a8b190','#a3ad8c','#afb797'][hs%3],['#c3c8b0','#bcc2a8','#c8ccb6'][(hs>>>3)%3],{noWin:true,ridge:false});
 const bb=bbox(P),r=seeded(hs);c.fillStyle='rgba(110,118,100,.4)';for(let i=0;i<Math.min(8,(bb[2]-bb[0])*(bb[3]-bb[1])/500);i++){const x=bb[0]+4+r()*(bb[2]-bb[0]-8),y=bb[1]+4+r()*(bb[3]-bb[1]-8);if(ptIn(x,y,P))c.fillRect(x-1.2,y-h-.9,2.4,1.6)}}
/* a steep pyramid roof over a footprint's top (for towers and the manor) */
function wdwPyramid(c,top,rise,col){const[cx,cy]=wdwCen(top);const n=top.length;for(let i=0;i<n;i++){const a=top[i],b=top[(i+1)%n];poly4(c,[a,b,[cx,cy-rise]],tone(col,((a[0]+b[0])/2<cx?.12:-.12)+((a[1]+b[1])/2>cy?.06:-.1)))}}
/* a square tower with a pointed roof, standing at (x,y) on the ground, h tall */
function wdwTower(c,e,x,y,w,h,wall,cap,rise,win){poly4(c,[[x-w,y],[x+w,y],[x+w,y-h],[x-w,y-h]],tone(wall,.04));poly4(c,[[x+w,y],[x+w+w*.5,y-w*.6],[x+w+w*.5,y-w*.6-h],[x+w,y-h]],tone(wall,-.25));
 wdwPyramid(c,[[x-w,y-h],[x+w,y-h],[x+w*1.5,y-h-w*.6],[x-w*.5,y-h-w*.6]],rise,cap);
 if(win){c.fillStyle=win;c.fillRect(x-w*.35,y-h*.7,w*.7,h*.18);if(e){e.fillStyle='rgba(255,210,140,.6)';e.fillRect(x-w*.35,y-h*.7,w*.7,h*.18)}}}

/* The Haunted Mansion: the Dutch Gothic brick manor house (red-brown brick, white trim, a dark slate roof and its square tower)
   stands at the front of the outline, by the entrance; the show building behind it is go-away green */
function hauntedManorWDW(q,bb,hh,hs,a){const ent=[a.dx,a.dy],[mx,my]=wdwCen(q.p);let dx=ent[0]-mx,dy=ent[1]-my;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
 const house=wdwHalf(q.p,ent[0],ent[1],dx,dy,-19),show=wdwHalf(q.p,ent[0],ent[1],-dx,-dy,19);if(house.length<3)return null;const hb=bbox(house),H=11*OSM.S;
 return[{y:bbox(show.length>2?show:q.p)[3],f:(c,e)=>{if(show.length>2)wdwShowBox(c,show,hh,hs)}},
  {y:hb[3],f:(c,e)=>{extrude(c,e,house,H,'#7d4b3e','#474c55',{win:'#2a3634',noGlow:true,ridge:false,deco:(c,p,q2,L2,h)=>{wdwBand(c,p,q2,h-.7,h,'#f2ede2');wdwBand(c,p,q2,h*.5-.2,h*.5+.15,'#f2ede2');
     wdwWins(L2,h,(t0,t1,v0,v1)=>{c.fillStyle='#f2ede2';const u=wdwAt(p,q2,t0-.02,v1),w_=wdwAt(p,q2,t1+.02,v1);c.beginPath();c.moveTo(...u);c.lineTo(...w_);c.lineTo((u[0]+w_[0])/2,(u[1]+w_[1])/2-.7);c.fill()})}});
   const top=house.map(([x,y])=>[x,y-H]);wdwPyramid(c,top,3,'#545a63');
   const tx=ent[0]-dx*9,ty=ent[1]-dy*9,tw=2.4;wdwTower(c,e,tx,ty,tw,H+9,'#7d4b3e','#3d424a',8,'#2a3634');
   c.strokeStyle='#2b2b2b';c.lineWidth=.3;c.beginPath();c.moveTo(tx+tw*.25,ty-H-9-tw*.3-8);c.lineTo(tx+tw*.25,ty-H-9-tw*.3-11);c.stroke();
   if(e){e.fillStyle='rgba(170,255,190,.3)';e.fillRect(tx-tw*.35,ty-(H+9)*.7,tw*.7,(H+9)*.18)}}}]}

/* "it's a small world" at Walt Disney World: the ride is indoors behind Fantasyland; outside, its entrance has a short white and
   pastel façade of little towers and spires trimmed in gold, on the wall nearest the entrance. The rest is a show building. */
function smallWorldWDW(q,bb,hh,hs,a){const P=q.p,n=P.length;let A=0;for(let i=0;i<n;i++){const u=P[i],v=P[(i+1)%n];A+=u[0]*v[1]-v[0]*u[1]}const sg=A>0?1:-1;let best=null,bd=1e9;
 for(let i=0;i<n;i++){const u=P[i],v=P[(i+1)%n],dx=v[0]-u[0],dy=v[1]-u[1],L=Math.hypot(dx,dy),ny=-dx/L*sg;if(ny<.25||L<8)continue;const d=Math.hypot((u[0]+v[0])/2-a.dx,(u[1]+v[1])/2-a.dy);if(d<bd){bd=d;best=[u,v,L]}}
 return(c,e)=>{wdwShowBox(c,P,hh,hs);if(!best)return;let[u,v,L]=best;if(u[0]>v[0])[u,v]=[v,u];const at=t=>[u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t],gold='#d9b04a',white='#f7f4ee',t0=Math.max(0,.5-14/L),t1=Math.min(1,.5+14/L);
  {const p0=at(t0),p1=at(t1);poly4(c,[p0,p1,[p1[0],p1[1]-6],[p0[0],p0[1]-6]],white);c.strokeStyle=gold;c.lineWidth=.5;c.beginPath();c.moveTo(p0[0],p0[1]-6);c.lineTo(p1[0],p1[1]-6);c.stroke()}
  const N=5;for(let i=0;i<N;i++){const t=t0+(i+.5)*(t1-t0)/N,[tx,ty]=at(t),tw=(t1-t0)*L/N*.4,th=5+(i===2?7:(i%2)*2.5),y0=ty-6,top=y0-th;
   poly4(c,[[tx-tw,y0],[tx+tw,y0],[tx+tw,top],[tx-tw,top]],['#f7f4ee','#f6d9e4','#d9ecf6','#f6d9e4','#f7f4ee'][i]);c.fillStyle=gold;c.fillRect(tx-tw,top,tw*2,.45);
   if(i%2===0)poly4(c,[[tx-tw*1.1,top],[tx+tw*1.1,top],[tx,top-tw*(i===2?3.6:2.8)]],gold);else{c.fillStyle=gold;c.beginPath();c.moveTo(tx-tw,top);c.quadraticCurveTo(tx-tw*1.3,top-tw*1.4,tx,top-tw*2.6);c.quadraticCurveTo(tx+tw*1.3,top-tw*1.4,tx+tw,top);c.fill()}
   if(i===2){c.fillStyle='#fff';c.beginPath();c.arc(tx,top+th*.4,tw*.6,0,7);c.fill();c.strokeStyle=gold;c.lineWidth=.3;c.stroke()}
   if(e){e.fillStyle='rgba(255,230,170,.5)';e.fillRect(tx-.5,y0-3,1,1)}}}}

/* The Hall of Presidents: red brick with white trim, and the white cupola with its clock in the middle of the roof */
function hallOfPresidents(q,bb,hh){return(c,e)=>{extrude(c,e,q.p,hh,'#a0503f','#4f545c',{win:'#3a4a5a',ridge:false,deco:libDeco});const[x,y]=wdwCen(q.p);cupola(c,e,x,y-hh)}}
/* a white Georgian cupola with a clock, standing on a roof at (x,t) */
function cupola(c,e,x,t){
 poly4(c,[[x-3,t],[x+3,t],[x+3,t-3.5],[x-3,t-3.5]],'#f4efe4');poly4(c,[[x-2.2,t-3.5],[x+2.2,t-3.5],[x+2.2,t-7],[x-2.2,t-7]],'#f8f4ea');
 c.fillStyle='#f8f4ea';c.beginPath();c.ellipse(x,t-7,2.2,.9,0,0,7);c.fill();c.fillStyle='#e9e2d0';c.beginPath();c.moveTo(x-2.2,t-7);c.quadraticCurveTo(x,t-10.5,x+2.2,t-7);c.fill();
 c.strokeStyle='#c9a24a';c.lineWidth=.35;c.beginPath();c.moveTo(x,t-10);c.lineTo(x,t-12.5);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(x,t-1.8,1.1,0,7);c.fill();c.strokeStyle='#333';c.lineWidth=.2;c.stroke();
 c.fillStyle='#3a4a5a';for(const k of[-1.2,0,1.2])c.fillRect(x+k-.35,t-6.4,.7,2);if(e){e.fillStyle='rgba(255,220,150,.7)';e.beginPath();e.arc(x,t-1.8,1.1,0,7);e.fill()}}

/* Be Our Guest: the Beast's castle, grey stone with battlements, its round towers capped in dark blue slate at the back */
function beOurGuest(q,bb,hh){return(c,e)=>{const H=Math.max(hh,10*OSM.S);extrude(c,e,q.p,H,'#a59a8a','#5d6782',{win:'#3a3550',ridge:false,deco:(c,p,q2,L,h)=>{const n=Math.max(2,Math.round(L/1.2));for(let i=0;i<n;i+=2){poly4(c,[wdwAt(p,q2,i/n,h),wdwAt(p,q2,(i+1)/n,h),wdwAt(p,q2,(i+1)/n,h+1),wdwAt(p,q2,i/n,h+1)],'#a59a8a')}}});
 const back=q.p.slice().sort((u,v)=>u[1]-v[1]).slice(0,6),used=[];for(const p of back){if(used.some(u=>Math.hypot(u[0]-p[0],u[1]-p[1])<10))continue;used.push(p);if(used.length>=3)break}
 used.sort((u,v)=>u[1]-v[1]);used.forEach((p,i)=>wdwTower(c,e,p[0]+(wdwCen(q.p)[0]-p[0])*.15,p[1]+3,1.6+(i===0?.6:0),H+6+(i===0?6:0),'#b3a898','#33406a',6+(i===0?3:0),'#3a3550'))}}

/* Under the Sea: Prince Eric's castle above the rockwork: sandy walls and round towers with terracotta caps along its front */
function ericsCastle(q,bb,hh,hs,a){const P=q.p,n=P.length;let A=0;for(let i=0;i<n;i++){const u=P[i],v=P[(i+1)%n];A+=u[0]*v[1]-v[0]*u[1]}const sg=A>0?1:-1;let best=null;
 for(let i=0;i<n;i++){const u=P[i],v=P[(i+1)%n],dx=v[0]-u[0],dy=v[1]-u[1],L=Math.hypot(dx,dy),ny=-dx/L*sg;if(ny>.4&&(!best||L>best[2]))best=[u,v,L]}
 return(c,e)=>{extrude(c,null,P,Math.min(hh,9*OSM.S),'#b49a7f','#a3906f',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='rgba(80,60,40,.25)';c.lineWidth=.3;const r=seeded((p[0]*3)|0);c.beginPath();for(let i=0;i<L/2;i++){const t=r(),v=r()*h;c.moveTo(...wdwAt(p,q2,t,v));c.lineTo(...wdwAt(p,q2,Math.min(1,t+.05),v+r()*1.5-.75))}c.stroke()}});
  if(!best)return;let[u,v]=best;if(u[0]>v[0])[u,v]=[v,u];const H=Math.min(hh,9*OSM.S);for(const[t,th,w]of[[.25,8,1.7],[.5,13,2.2],[.72,9,1.8]]){const x=u[0]+(v[0]-u[0])*t,y=u[1]+(v[1]-u[1])*t-H*.55;
   c.fillStyle='#efe2c8';c.fillRect(x-w,y-th,w*2,th);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+w*.4,y-th,w*.6,th);poly4(c,[[x-w*1.2,y-th],[x+w*1.2,y-th],[x,y-th-w*2.4]],'#b5543f');
   c.fillStyle='#3a4a6a';c.fillRect(x-.35,y-th*.7,.7,1.4);if(e){e.fillStyle='rgba(255,215,150,.7)';e.fillRect(x-.35,y-th*.7,.7,1.4)}}}}

/* the Cambodian temple in Adventureland: weathered grey-green stone, stepped tiers */
function cambodianTemple(q,bb){return(c,e)=>{const[x,y]=wdwCen(q.p);extrude(c,null,q.p,3,'#8f9480','#7b806c',{noWin:true,ridge:false});for(let i=1;i<4;i++){const k=1-i*.2,P=q.p.map(([px,py])=>[x+(px-x)*k,y+(py-y)*k-i*2.2]);extrude(c,null,P,2.2,tone('#8f9480',-.02*i),'#7b806c',{noWin:true,ridge:false})}
 c.fillStyle='#7b806c';c.beginPath();c.moveTo(x-1.4,y-11.5);c.lineTo(x+1.4,y-11.5);c.lineTo(x,y-16);c.fill()}}

/* a big roof split into a row of separate gabled roofs (like Main Street's storefronts), each its own colour from the land's
   palette, with its ridge and a lit and a shaded slope, so a long village block reads as many houses rather than one slab */
function wdwRoofs(c,poly,hh,seed,pal,base){const top=poly.map(([x,y])=>[x,y-hh]),[mx,my]=wdwCen(top),R2=seeded(seed);
 let sxx=0,syy=0,sxy=0;for(const[x,y]of top){sxx+=(x-mx)**2;syy+=(y-my)**2;sxy+=(x-mx)*(y-my)}const an=.5*Math.atan2(2*sxy,sxx-syy),ux=Math.cos(an),uy=Math.sin(an); /* the footprint's long axis */
 let lo=1e9,hi=-1e9,wl=1e9,wh=-1e9;for(const[x,y]of top){const u=(x-mx)*ux+(y-my)*uy,v=-(x-mx)*uy+(y-my)*ux;lo=Math.min(lo,u);hi=Math.max(hi,u);wl=Math.min(wl,v);wh=Math.max(wh,v)}
 c.save();pathOf(c,top,1);c.clip();c.translate(mx,my);c.rotate(an); /* strips across the long axis, each a little house with its ridge along the short axis */
 let u=lo;while(u<hi){const w=6+R2()*5,col=R2()<.22?pal[(R2()*pal.length)|0]:tone(base,(R2()-.5)*.22);
  c.fillStyle=tone(col,.15);c.fillRect(u,wl-1,w,(wh-wl)/2+1);c.fillStyle=tone(col,-.12);c.fillRect(u,(wl+wh)/2,w,(wh-wl)/2+1);
  c.fillStyle='rgba(255,255,255,.28)';c.fillRect(u,(wl+wh)/2-.2,w,.4);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(u+w-.35,wl-1,.35,wh-wl+2);
  if(R2()<.3){const cu=u+w*(.3+R2()*.4),cv=wl+(wh-wl)*(.2+R2()*.25);c.fillStyle='#8a5a48';c.fillRect(cu-.5,cv-.5,1,1.4);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(cu-.5,cv-.7,1,.3)} /* a chimney */
  u+=w}
 c.restore()}

/* Tomorrowland's roofs: a blue trim band round the edge, panel seams along the building, and a few of its finned spires
   (teal, purple and gold, each on a little drum) */
function tomRoof(c,e,poly,hh,seed){const top=poly.map(([x,y])=>[x,y-hh]),[mx,my]=wdwCen(top),R2=seeded(seed);
 let sxx=0,syy=0,sxy=0;for(const[x,y]of top){sxx+=(x-mx)**2;syy+=(y-my)**2;sxy+=(x-mx)*(y-my)}const an=.5*Math.atan2(2*sxy,sxx-syy);
 c.save();pathOf(c,top,1);c.clip();c.strokeStyle='#5b97dc';c.lineWidth=2;c.stroke();c.strokeStyle='#f8fbff';c.lineWidth=.6;c.stroke();
 c.translate(mx,my);c.rotate(an);c.strokeStyle='rgba(120,135,155,.28)';c.lineWidth=.25;for(let u=-120;u<120;u+=4){c.beginPath();c.moveTo(u,-120);c.lineTo(u,120);c.stroke()}c.restore();
 const bb=bbox(poly),A=(bb[2]-bb[0])*(bb[3]-bb[1]),n=A>2500?3:A>900?2:1,cols=['#2fa8a0','#8a5ad0','#d9b04a'];
 for(let i=0,tries=0;i<n&&tries<30;tries++){const x=bb[0]+(bb[2]-bb[0])*(.2+R2()*.6),y=bb[1]+(bb[3]-bb[1])*(.2+R2()*.6);if(!ptIn(x,y,poly))continue;i++;
  const g=y-hh,h=5+R2()*6,col=cols[(seed+i)%3];c.fillStyle='#e9eef5';c.beginPath();c.ellipse(x,g,1.6,.7,0,0,7);c.fill();c.fillRect(x-1.6,g-1.2,3.2,1.2);c.beginPath();c.ellipse(x,g-1.2,1.6,.7,0,0,7);c.fill();
  poly4(c,[[x-.7,g-1.2],[x+.7,g-1.2],[x,g-1.2-h]],col);poly4(c,[[x,g-1.2],[x+.7,g-1.2],[x,g-1.2-h]],tone(col,-.25));
  for(const s_ of[-1,1])poly4(c,[[x,g-1.6],[x+s_*1.5,g-1.2],[x,g-1.2-h*.5]],tone(col,s_>0?-.15:.1));
  if(e){e.fillStyle='rgba(140,210,255,.8)';e.beginPath();e.arc(x,g-1.2-h,.5,0,7);e.fill()}}}

const MKFRONT={lib:libDeco,fan:fanDeco,fr:frDeco,adv:advDeco,tom:tomDeco};
if(!DL){ /* Magic Kingdom roofs: Fantasyland's mostly brown and slate shingle with a little colour, Tomorrowland's pale metal */
 LANDSTYLE.fan=[['#f4e8d6','#f1dcc8','#efe3cf','#f6efe0','#e9d6bc'],['#7a5a4a','#5f6f8a','#8a4a3f','#6a5a7a','#4f6a5a','#3f6ad0']];
 LANDSTYLE.tom=[['#eef2f7','#e4ebf3','#f6f8fb'],['#c9ced6','#b8bec8','#d6dae0','#aeb6c2']];
 LANDSTYLE.lib=[['#a8503f','#efe8da','#9a4a3a','#e6dccb','#d9c9a8','#5a6f8a'],['#4f545c','#3d4a5c','#5a4a3f','#4a4f58']];}

function wdwBuilding(q,bb,land,hh,hs){if(DL)return null;const cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2;
 if(land==='none'){const k=wdwResort(cx,cy);if(k)return resortBuilding(q,bb,k,hh,hs);return null}
 if(land.startsWith('ep_'))return epBuilding(q,bb,land,hh,hs);
 if(typeof HSL_ART!=='undefined'&&HSL_ART.has(land))return hsBuilding(q,bb,land,hh,hs);
 if(typeof AKL_ART!=='undefined'&&AKL_ART.has(land))return akBuilding(q,bb,land,hh,hs);
 if(!OSM.routes.rail||!ptIn(cx,cy,OSM.routes.rail)||!MKFRONT[land])return null; /* the Magic Kingdom, inside its railroad (Main Street keeps its storefronts) */
 const n=q.n||'',a=n&&AT.find(x=>x.osm===n);
 if(n==='The Haunted Mansion'&&a){const f=hauntedManorWDW(q,bb,hh,hs,a);if(f)return f}
 if(n==='"it\'s a small world"'&&a)return smallWorldWDW(q,bb,hh,hs,a);
 if(n==='The Hall of Presidents')return hallOfPresidents(q,bb,hh);
 if(n==='Be Our Guest Restaurant')return beOurGuest(q,bb,hh);
 if(/^Under the Sea/.test(n))return ericsCastle(q,bb,hh,hs,a);
 if(n==='Cambodian Temple')return cambodianTemple(q,bb);
 if(q.k==='roof'||q.k==='tent'||/^Cinderella Castle|Rapunzel|train_station/.test(n+'|'+(q.k||'')))return null;
 const st=LANDSTYLE[land];let A=0;for(let i=0;i<q.p.length;i++){const u=q.p[i],v=q.p[(i+1)%q.p.length];A+=u[0]*v[1]-v[0]*u[1]}A=Math.abs(A/2);
 let wall=st[0][hs%st[0].length],roof=q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length],noWin=false;
 if(land==='fan'&&A>1200&&roof==='#3f6ad0')roof='#5f6f8a'; /* big Fantasyland roofs stay muted */
 if(n==="Walt Disney's Enchanted Tiki Room"){wall='#e2c79a';roof='#b8955a'}
 if(land==='tom'){wall=st[0][hs%st[0].length];noWin=A>900}
 if(n==="Walt Disney's Carousel of Progress"){wall='#f2f5f9';roof='#c6ccd4';noWin=true}
 const deco=MKFRONT[land],thatch=n==="Walt Disney's Enchanted Tiki Room";
 const split=A>500&&(land==='fan'||land==='lib'||land==='fr'||land==='adv')&&n!=="Walt Disney's Enchanted Tiki Room";
 return(c,e)=>{extrude(c,e,q.p,hh,wall,roof,{noWin,ridge:land!=='tom'&&!split,deco});if(split)wdwRoofs(c,q.p,hh,hs,st[1].filter(r=>r!=='#3f6ad0'),roof);if(land==='tom'&&A>250&&n!=="Walt Disney's Carousel of Progress")tomRoof(c,e,q.p,hh,hs);
  if(thatch){const top=q.p.map(([x,y])=>[x,y-hh]),tb=bbox(top);c.save();pathOf(c,top,1);c.clip();c.strokeStyle='rgba(110,80,40,.45)';c.lineWidth=.3;for(let x=tb[0];x<tb[2];x+=.8){c.beginPath();c.moveTo(x,tb[1]);c.lineTo(x+1.5,tb[3]);c.stroke()}c.restore()}}}

/* ---------------- EPCOT (owner, 25 Nov 2026: "Yes, EPCOT next") ----------------
   World Showcase: each pavilion's façade detail on its own colours, big pavilion roofs split into their separate roofs, and its
   landmark drawn by name: Japan's Goju-no-to pagoda and torii gate, Italy's campanile, Norway's stave church, China's Temple of
   Heaven, the American Adventure's cupola, France's Eiffel Tower (behind Impressions de France, away from the lagoon) and
   Morocco's minaret (by Spice Road Table). Future World: Mission: SPACE's red planet by its entrance, Cosmic Rewind's blue
   show building. The Land, Test Track, Spaceship Earth, Mexico's pyramid and Imagination keep their own painting in map-art.js. */
let EPLAG=null;const EPLAGOON=()=>EPLAG||(EPLAG=(()=>{const T=OSM.buildings.find(q=>q.n==='Torii Gate'),t=T?wdwCen(T.p):[6200,6237],W=OSM.areas.filter(a=>a.k==='water'&&a.o.length>20&&ptIn(t[0],t[1],a.o))[0]||OSM.areas.filter(a=>a.k==='water'&&a.o.length>20).sort((u,v)=>Math.hypot(...wdwCen(u.o).map((z,k)=>z-t[k]))-Math.hypot(...wdwCen(v.o).map((z,k)=>z-t[k])))[0];const b=bbox(W.o);return[(b[0]+b[2])/2,(b[1]+b[3])/2]})()); /* the middle of World Showcase Lagoon: the water the torii gate stands in */
function canadaDeco(c,p,q,L,h){c.strokeStyle='rgba(60,40,30,.18)';c.lineWidth=.15;c.beginPath();for(let v=.8;v<h;v+=.9){c.moveTo(...wdwAt(p,q,0,v));c.lineTo(...wdwAt(p,q,1,v))}c.stroke();wdwBand(c,p,q,h-.5,h,'#e9e0cc')}
function franceDeco(c,p,q,L,h){if(h<4)return;wdwBand(c,p,q,h-1.1,h,'#5a6470');wdwBand(c,p,q,h-1.3,h-1.1,'#f4ecdc');const y0=h*.5;wdwLine(c,p,q,y0,'rgba(40,40,48,.85)',.3);wdwLine(c,p,q,y0+1.2,'rgba(40,40,48,.85)',.3);
 c.strokeStyle='rgba(40,40,48,.6)';c.lineWidth=.12;c.beginPath();const n=Math.floor(L/.8);for(let i=1;i<n;i++){c.moveTo(...wdwAt(p,q,i/n,y0));c.lineTo(...wdwAt(p,q,i/n,y0+1.2))}c.stroke()}
function japanDeco(c,p,q,L,h){wdwBand(c,p,q,0,Math.min(1.2,h*.2),'#5a4a3e');const n=Math.max(1,Math.round(L/2.2));c.strokeStyle='#4a3a2e';c.lineWidth=.35;c.beginPath();for(let i=0;i<=n;i++){c.moveTo(...wdwAt(p,q,i/n,0));c.lineTo(...wdwAt(p,q,i/n,h))}c.stroke();wdwLine(c,p,q,h*.55,'#4a3a2e',.3)}
function chinaDeco(c,p,q,L,h){wdwBand(c,p,q,h-.8,h,'#d9a441');wdwBand(c,p,q,h-1.2,h-.8,'#2f6b5a');const n=Math.max(1,Math.round(L/1.6));c.fillStyle='#a82a20';for(let i=0;i<=n;i++){const a=wdwAt(p,q,i/n,0);c.fillRect(a[0]-.25,a[1]-h+1.2,.5,h-1.2)}}
function norwayDeco(c,p,q,L,h){c.strokeStyle='rgba(40,25,15,.3)';c.lineWidth=.15;c.beginPath();const n=Math.floor(L/.6);for(let i=1;i<n;i++){c.moveTo(...wdwAt(p,q,i/n,0));c.lineTo(...wdwAt(p,q,i/n,h))}c.stroke();wdwBand(c,p,q,h-.6,h,'#e9dcc0')}
function moroccoDeco(c,p,q,L,h){wdwBand(c,p,q,h-.9,h-.5,'#3e8a7a');wdwBand(c,p,q,h-.5,h,'#f2e6cc');
 wdwWins(L,h,(t0,t1,v0,v1)=>{const a=wdwAt(p,q,t0,v1),b=wdwAt(p,q,t1,v1),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];c.fillStyle='#3e8a7a';c.beginPath();c.moveTo(...a);c.quadraticCurveTo(m[0],m[1]-(Math.abs(b[0]-a[0])+.6),b[0],b[1]);c.fill()})}
if(!DL){LANDSTYLE.ep_japan=[['#f4efe6','#efe8dc','#e6dccb'],['#5a6472','#6a7482','#4f5866']]} /* the White Heron castle and its town: white plaster, grey-blue tile */
const EPFRONT={ep_canada:canadaDeco,ep_uk:fanDeco,ep_france:franceDeco,ep_morocco:moroccoDeco,ep_japan:japanDeco,ep_italy:advDeco,ep_germany:fanDeco,ep_china:chinaDeco,ep_norway:norwayDeco,ep_usa:libDeco};

/* Goju-no-to: five tiers, each a white-and-red storey under a wide flared blue-grey roof, a gold spire on top */
function pagoda(c,e,x,y,w){let yb=y;for(let i=0;i<5;i++){const k=1-i*.11,bw=w*.55*k,rw=w*k*1.05;c.fillStyle='#f2e8d8';c.fillRect(x-bw,yb-2.6,bw*2,2.6);c.fillStyle='#b8352a';for(const s_ of[-1,0,1])c.fillRect(x+s_*bw*.7-.2,yb-2.6,.4,2.6);c.fillStyle='rgba(0,0,0,.15)';c.fillRect(x+bw*.4,yb-2.6,bw*.6,2.6);
  if(e){e.fillStyle='rgba(255,210,140,.35)';e.fillRect(x-bw*.5,yb-2,bw,1.2)}
  yb-=2.6;c.fillStyle='#3f4a5c';c.beginPath();c.moveTo(x-rw-.8,yb+.6);c.quadraticCurveTo(x-rw*.6,yb-.2,x-bw*.8,yb-1.2);c.lineTo(x+bw*.8,yb-1.2);c.quadraticCurveTo(x+rw*.6,yb-.2,x+rw+.8,yb+.6);c.lineTo(x+rw*.7,yb+.1);c.lineTo(x-rw*.7,yb+.1);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x-bw*.8,yb-1.2,bw*.8,.3);yb-=1.2}
 c.strokeStyle='#c9a24a';c.lineWidth=.45;c.beginPath();c.moveTo(x,yb);c.lineTo(x,yb-6);c.stroke();for(let i=1;i<6;i++){c.beginPath();c.ellipse(x,yb-i*.9,.6,.2,0,0,7);c.stroke()}}
/* the torii gate standing in the lagoon: two red posts, a black-capped top beam with upturned ends and a tie beam */
function torii(c,x,y){const w=4.2,h=8;c.fillStyle='#c8382a';c.fillRect(x-w,y-h,.8,h);c.fillRect(x+w-.8,y-h,.8,h);c.fillRect(x-w-.6,y-h*.72,w*2+1.2,.7);
 c.fillStyle='#c8382a';c.beginPath();c.moveTo(x-w-1.8,y-h-.4);c.quadraticCurveTo(x,y-h+.5,x+w+1.8,y-h-.4);c.lineTo(x+w+1.6,y-h-1.4);c.quadraticCurveTo(x,y-h-.5,x-w-1.6,y-h-1.4);c.fill();
 c.fillStyle='#222';c.beginPath();c.moveTo(x-w-2,y-h-1.2);c.quadraticCurveTo(x,y-h-.3,x+w+2,y-h-1.2);c.lineTo(x+w+2.1,y-h-1.9);c.quadraticCurveTo(x,y-h-1,x-w-2.1,y-h-1.9);c.fill();
 c.fillStyle='rgba(200,56,42,.35)';c.fillRect(x-w,y,.8,2.5);c.fillRect(x+w-.8,y,.8,2.5)} /* reflections */
/* the campanile of St Mark's: a tall brick shaft, the white arcaded belfry and a green pyramid spire with its gold angel */
function campanile(c,e,x,y){const w=1.6,h=22;c.fillStyle='#b5553f';c.fillRect(x-w,y-h,w*2,h);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x+w*.3,y-h,w*.7,h);c.strokeStyle='rgba(255,230,210,.25)';c.lineWidth=.2;for(const s_ of[-.6,0,.6]){c.beginPath();c.moveTo(x+s_*w,y);c.lineTo(x+s_*w,y-h);c.stroke()}
 c.fillStyle='#f2ead8';c.fillRect(x-w*1.1,y-h-3.2,w*2.2,3.2);c.fillStyle='#4a4038';for(const s_ of[-.55,0,.55])c.fillRect(x+s_*w-.25,y-h-2.6,.5,2);c.fillStyle='#f2ead8';c.fillRect(x-w,y-h-4.8,w*2,1.6);
 poly4(c,[[x-w,y-h-4.8],[x+w,y-h-4.8],[x,y-h-10.5]],'#5f9a7a');poly4(c,[[x,y-h-4.8],[x+w,y-h-4.8],[x,y-h-10.5]],'#4a7f63');c.fillStyle='#d9b04a';c.fillRect(x-.25,y-h-12,.5,1.5);
 if(e){e.fillStyle='rgba(255,215,150,.6)';e.fillRect(x-w,y-h-3,w*2,2.4)}}
/* the stave church: dark tarred wood, three stacked steep shingle roofs, dragon-headed gables */
function staveChurch(c,e,x,y,w){const D='#4a3426',R='#3a2a20';c.fillStyle=D;c.fillRect(x-w,y-4,w*2,4);let yb=y-4;for(let i=0;i<3;i++){const k=1-i*.28,rw=w*1.2*k;poly4(c,[[x-rw,yb],[x+rw,yb],[x+rw*.35,yb-3.4],[x-rw*.35,yb-3.4]],tone(R,i*.06));c.fillStyle=D;c.fillRect(x-rw*.35,yb-4.6,rw*.7,1.2);
  c.strokeStyle='#2a1c14';c.lineWidth=.3;c.beginPath();c.moveTo(x-rw,yb);c.quadraticCurveTo(x-rw-1,yb-1.2,x-rw-.4,yb-1.8);c.moveTo(x+rw,yb);c.quadraticCurveTo(x+rw+1,yb-1.2,x+rw+.4,yb-1.8);c.stroke();yb-=4.6}
 poly4(c,[[x-.9,yb],[x+.9,yb],[x,yb-4]],R)}
/* the Temple of Heaven (Hall of Prayer for Good Harvests): a round hall of red columns under three blue tiled roofs, gold finial */
function templeOfHeaven(c,e,x,y,R){c.fillStyle='#f2ece0';c.beginPath();c.ellipse(x,y,R*1.25,R*.5,0,0,7);c.fill();let yb=y-.8;
 for(let i=0;i<3;i++){const r=R*(1-i*.22),dh=i?1.4:3.2;c.fillStyle='#b8352a';c.fillRect(x-r*.82,yb-dh,r*1.64,dh);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x+r*.3,yb-dh,r*.52,dh);
  c.fillStyle='#d9a441';c.fillRect(x-r*.82,yb-dh-.3,r*1.64,.3);yb-=dh+.3;
  c.fillStyle='#2f5aa8';c.beginPath();c.ellipse(x,yb,r,r*.4,0,0,7);c.fill();c.fillStyle='#24488a';c.beginPath();c.moveTo(x-r,yb);c.quadraticCurveTo(x,yb-r*.9,x+r,yb);c.fill();c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.moveTo(x-r*.7,yb-.2);c.quadraticCurveTo(x-r*.3,yb-r*.6,x,yb-r*.62);c.lineTo(x,yb-r*.5);c.quadraticCurveTo(x-r*.3,yb-r*.45,x-r*.6,yb);c.fill();yb-=r*.55}
 c.fillStyle='#d9b04a';c.beginPath();c.arc(x,yb-.6,.7,0,7);c.fill();c.fillRect(x-.2,yb-2.6,.4,2);if(e){e.fillStyle='rgba(255,200,130,.5)';e.fillRect(x-R*.6,y-3.6,R*1.2,1.8)}}
/* the Eiffel Tower (a tenth scale, as at EPCOT): bronze lattice legs curving in to the platforms and the spire */
function eiffel(c,e,x,y,h){const col='#7a5f48',lit='#a88a6a',w=h*.24,pt=t=>w*Math.pow(1-t,1.9)+.35; /* half-width at height t */
 for(const s_ of[-1,1]){c.fillStyle=s_<0?lit:col;c.beginPath();c.moveTo(x,y);for(let t=0;t<=1.0001;t+=.05)c.lineTo(x+s_*pt(t),y-t*h);c.lineTo(x,y-h);c.closePath();c.fill()} /* solid, so it reads at a distance; the lattice is drawn over it */
 c.fillStyle='#f2e6cc';c.beginPath();c.moveTo(x-pt(0)+1.4,y);c.quadraticCurveTo(x,y-h*.26,x+pt(0)-1.4,y);c.fill(); /* the great arch under the first platform */
 c.strokeStyle='rgba(235,215,185,.45)';c.lineWidth=.22;c.beginPath();for(let t=.26;t<.92;t+=.05){const a=pt(t),b=pt(t+.05);c.moveTo(x-a,y-t*h);c.lineTo(x+b,y-(t+.05)*h);c.moveTo(x+a,y-t*h);c.lineTo(x-b,y-(t+.05)*h)}c.stroke();
 c.fillStyle=col;for(const t of[.26,.52,.8]){const a=pt(t)+.5;c.fillRect(x-a,y-t*h-.6,a*2,.9)}c.fillRect(x-.35,y-h-2.5,.7,2.5);
 if(e){e.fillStyle='rgba(255,200,120,.8)';for(let t=.05;t<1;t+=.07){const a=pt(t);e.fillRect(x-a,y-t*h,.6,.6);e.fillRect(x+a-.6,y-t*h,.6,.6)}e.fillRect(x-.3,y-h-2.5,.6,.6)}}
/* Morocco's minaret (the Koutoubia's likeness): a square sandstone tower with green tile panels, crenellations and a small lantern with a dome */
function minaret(c,e,x,y){const w=1.8,h=20,S_='#e3cfa8';c.fillStyle=S_;c.fillRect(x-w,y-h,w*2,h);c.fillStyle='rgba(0,0,0,.14)';c.fillRect(x+w*.3,y-h,w*.7,h);
 c.fillStyle='#3e8a7a';c.fillRect(x-w*.8,y-h+1,w*1.6,1.2);c.fillStyle='#b98a5a';for(const v of[.35,.6,.82]){c.beginPath();c.moveTo(x-.5,y-h*v);c.quadraticCurveTo(x,y-h*v-1.4,x+.5,y-h*v);c.lineTo(x+.5,y-h*v+1.2);c.lineTo(x-.5,y-h*v+1.2);c.fill()}
 c.fillStyle=S_;for(let i=0;i<4;i++)c.fillRect(x-w+i*w*.55,y-h-.8,w*.35,.8);c.fillRect(x-w*.5,y-h-4,w,3.2);c.fillStyle='#3e8a7a';c.beginPath();c.arc(x,y-h-4,w*.5,Math.PI,0);c.fill();c.fillStyle='#d9b04a';c.fillRect(x-.15,y-h-6.2,.3,1.4);
 if(e){e.fillStyle='rgba(255,210,140,.6)';e.fillRect(x-w*.3,y-h-3.4,w*.6,1.6)}}

function epBuilding(q,bb,land,hh,hs){const n=q.n||'',cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2;
 if(/^(The Land|Test Track|Spaceship Earth|Mexico Pavilion|Imagination Pavilion|Project Tomorrow)/.test(n)||q.k==='greenhouse')return null;
 if(n==='Goju-no-to Pagoda')return(c,e)=>pagoda(c,e,cx,bb[3]-(bb[3]-bb[1])*.3,Math.max(3.5,(bb[2]-bb[0])*.5));
 if(n==='Torii Gate')return(c,e)=>torii(c,cx,cy);
 if(/^Saint Mark/.test(n))return(c,e)=>campanile(c,e,cx,cy);
 if(n==='Stave Church Gallery')return(c,e)=>staveChurch(c,e,cx,bb[3]-1,Math.max(2.5,(bb[2]-bb[0])*.4));
 if(n==='The American Adventure'){return(c,e)=>{extrude(c,e,q.p,hh,'#a0503f','#4f545c',{win:'#3a4a5a',ridge:false,deco:libDeco});wdwRoofs(c,q.p,hh,hs,['#4f545c','#5b6b7a'],'#55606c');const[x,y]=wdwCen(q.p);cupola(c,e,x,y-hh)}}
 if(n==='China Pavilion'){const st=LANDSTYLE.ep_china,[mx,my]=wdwCen(q.p);return(c,e)=>{extrude(c,e,q.p,hh,st[0][0],'#2f6b5a',{deco:chinaDeco,ridge:false});wdwRoofs(c,q.p,hh,hs,['#2f6b5a','#2a5a4c','#3a7a64'],'#2f6b5a');templeOfHeaven(c,e,mx,my-hh+2,10)}}
 if(n==='Mission: SPACE'){const a=AT.find(x=>x.osm===n);return(c,e)=>{extrude(c,e,q.p,hh,'#e9e4ee','#c9c3d4',{noWin:true,ridge:false,deco:tomDeco});if(!a)return;const[mx,my]=wdwCen(q.p);let dx=a.dx-mx,dy=a.dy-my;const L=Math.hypot(dx,dy)||1,x=a.dx-dx/L*6,y=a.dy-dy/L*6,R=11;
   const g=c.createRadialGradient(x-R*.35,y-R-R*.35,R*.2,x,y-R,R);g.addColorStop(0,'#f08a4a');g.addColorStop(.7,'#c4502a');g.addColorStop(1,'#8a3420');c.fillStyle=g;c.beginPath();c.arc(x,y-R,R,0,7);c.fill();
   c.strokeStyle='rgba(120,40,20,.35)';c.lineWidth=.4;for(const k of[-.3,.15,.5]){c.beginPath();c.ellipse(x,y-R+k*R,R*Math.sqrt(1-k*k),R*.2,0,0,Math.PI);c.stroke()}
   c.strokeStyle='#cfd5de';c.lineWidth=.9;c.beginPath();c.ellipse(x,y-R,R*1.5,R*.35,-.2,0,7);c.stroke();if(e){e.fillStyle='rgba(255,140,80,.35)';e.beginPath();e.arc(x,y-R,R*.8,0,7);e.fill()}}}
 if(n==='Guardians Of The Galaxy: Cosmic Rewind')return(c,e)=>extrude(c,null,q.p,Math.min(hh,14*OSM.S),'#2f5f86','#3b6f96',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{wdwBand(c,p,q2,h*.7,h*.7+.5,'#d9b04a');wdwBand(c,p,q2,h*.35,h*.35+.3,'#6fb0d8')}});
 const fr=EPFRONT[land];if(!fr||q.k==='roof'||q.k==='trailer')return null;
 const st=LANDSTYLE[land];let A=0;for(let i=0;i<q.p.length;i++){const u=q.p[i],v=q.p[(i+1)%q.p.length];A+=u[0]*v[1]-v[0]*u[1]}A=Math.abs(A/2);
 const wall=st[0][hs%st[0].length],roof=q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length],split=A>400,
  extra=/Impressions de France/.test(n)?'eiffel':n==='Spice Road Table'?'minaret':null;
 const draw=(c,e)=>{extrude(c,e,q.p,hh,wall,roof,{noWin:A>1500,ridge:!split,deco:fr});if(split)wdwRoofs(c,q.p,hh,hs,st[1],roof);
  };
 if(!extra)return draw;const P=behind(q.p,extra==='eiffel'?5:2.5); /* the tower is far taller than the trees and shops round it: painted after them (later in the depth order) so they cover no more than its foot */
 return[{y:bb[3],f:draw},{y:P[1]+40,f:(c,e)=>extra==='eiffel'?eiffel(c,e,P[0],P[1],34):minaret(c,e,P[0],P[1])}]}
/* a spot on open ground just behind a building (the side away from the lagoon), for a tower standing beside it */
function behind(P,gap){const L0=EPLAGOON(),[mx,my]=wdwCen(P);let dx=mx-L0[0],dy=my-L0[1];const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;let d=0;while(d<80&&ptIn(mx+dx*d,my+dy*d,P))d+=.5;return[mx+dx*(d+gap),my+dy*(d+gap)]}

/* ---------------- Hollywood Studios (owner, 25 Nov 2026: "Yes, Studios next") ----------------
   Hollywood and Sunset Boulevards and Echo Lake: Streamline Moderne and art-deco fronts (fluted pilasters, speed lines, a stepped
   parapet, pastel neon trim) under flat roofs split into their separate shops. Animation Courtyard: cream soundstages with ribbed
   walls, big stage doors and pale roofs. Grand Avenue: brick with cornices. Toy Story Land: giant toy blocks (each wall in big
   bordered squares). Galaxy's Edge: weathered Batuu stucco with dark streaks, round windows and domes on the roofs. Landmarks: the
   AT-AT walker at Star Tours, Gertie the dinosaur on Echo Lake, Min and Bill's tramp steamer. The Tower of Terror, Muppet*Vision,
   PizzeRizzo, Runaway Railway's Chinese Theatre, Rock 'n' Roller Coaster, Smugglers Run and Rise keep their map-art.js painting. */
function decoDeco(c,p,q,L,h){if(h<3)return;wdwBand(c,p,q,h-.5,h,'rgba(255,255,255,.75)');for(const v of[h*.62,h*.62+.5,h*.62+1])wdwLine(c,p,q,v,'rgba(90,110,130,.35)',.18);
 const k=hsh((p[0]*5+p[1]*11)|0)%4,neon=['#f06aa0','#4ac8e8','#f0c040','#7ae07a'][k];wdwLine(c,p,q,h*.62-.4,neon,.3);
 for(const t of[0,1]){const a=wdwAt(p,q,t,0);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(a[0]-.35,a[1]-h-.6,.7,h+.6);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(a[0]-.1,a[1]-h-.6,.2,h+.6)}
 if(L>6){const a=wdwAt(p,q,.38,h),b=wdwAt(p,q,.62,h);poly4(c,[a,b,[b[0],b[1]-1.4],[a[0],a[1]-1.4]],'rgba(255,255,255,.8)');const a2=wdwAt(p,q,.45,h+1.4),b2=wdwAt(p,q,.55,h+1.4);poly4(c,[a2,b2,[b2[0],b2[1]-1],[a2[0],a2[1]-1]],'rgba(255,255,255,.85)')}}
function studioDeco(c,p,q,L,h){const n=Math.max(1,Math.round(L/2.2));c.strokeStyle='rgba(120,110,95,.3)';c.lineWidth=.3;c.beginPath();for(let i=1;i<n;i++){c.moveTo(...wdwAt(p,q,i/n,0));c.lineTo(...wdwAt(p,q,i/n,h))}c.stroke();
 if(L>10&&h>5){const a=wdwAt(p,q,.4,0),b=wdwAt(p,q,.6,0);poly4(c,[a,b,[b[0],b[1]-h*.6],[a[0],a[1]-h*.6]],'#9a9488');c.strokeStyle='rgba(60,55,50,.35)';c.lineWidth=.15;c.beginPath();for(let v=.5;v<h*.6;v+=.5){const u=wdwAt(p,q,.4,v),w=wdwAt(p,q,.6,v);c.moveTo(...u);c.lineTo(...w)}c.stroke()}
 wdwBand(c,p,q,h-.4,h,'#f7f2e6')}
function brickDeco(c,p,q,L,h){c.strokeStyle='rgba(60,30,20,.2)';c.lineWidth=.12;c.beginPath();for(let v=.5;v<h;v+=.5){c.moveTo(...wdwAt(p,q,0,v));c.lineTo(...wdwAt(p,q,1,v))}c.stroke();wdwBand(c,p,q,h-.7,h,'#d9cbb0');wdwBand(c,p,q,0,.6,'rgba(40,30,25,.3)')}
function toyDeco(c,p,q,L,h){if(h<3)return;const S=Math.max(2.5,Math.min(h,4.5)),cols=['#f3d56c','#ea6a5e','#70aadb','#83c870'],n=Math.max(1,Math.round(L/S)),m=Math.max(1,Math.round(h/S));
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const k=hsh(i*7+j*13+((p[0]*3)|0))%4;poly4(c,[wdwAt(p,q,i/n,j*h/m),wdwAt(p,q,(i+1)/n,j*h/m),wdwAt(p,q,(i+1)/n,(j+1)*h/m),wdwAt(p,q,i/n,(j+1)*h/m)],cols[k]);
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.3;c.beginPath();const u=[wdwAt(p,q,i/n+.08/n,j*h/m+.3),wdwAt(p,q,(i+1)/n-.08/n,j*h/m+.3),wdwAt(p,q,(i+1)/n-.08/n,(j+1)*h/m-.3),wdwAt(p,q,i/n+.08/n,(j+1)*h/m-.3)];u.forEach((z,ii)=>ii?c.lineTo(...z):c.moveTo(...z));c.closePath();c.stroke()}}
function batuuDeco(c,p,q,L,h){const r=seeded((p[0]*7+p[1])|0);c.fillStyle='rgba(90,70,50,.18)';for(let i=0;i<L/2;i++){const t=r(),a=wdwAt(p,q,t,h);c.fillRect(a[0]-.2,a[1],.4,h*(.3+r()*.5))}
 wdwWins(L,h,(t0,t1,v0,v1)=>{if(r()<.5)return;const a=wdwAt(p,q,(t0+t1)/2,(v0+v1)/2);c.fillStyle='#4a3a2e';c.beginPath();c.arc(a[0],a[1],Math.min(.7,(v1-v0)*.4),0,7);c.fill()})}
const HSFRONT={hb:decoDeco,sb:decoDeco,el:decoDeco,ac:studioDeco,ga:brickDeco,ts:toyDeco,sw:batuuDeco};
/* flat roofs split into their separate buildings, each a pale tone with a parapet edge (for the boulevards) */
function wdwFlatRoofs(c,poly,hh,seed,pal){const top=poly.map(([x,y])=>[x,y-hh]),[mx,my]=wdwCen(top),R2=seeded(seed);let sxx=0,syy=0,sxy=0;for(const[x,y]of top){sxx+=(x-mx)**2;syy+=(y-my)**2;sxy+=(x-mx)*(y-my)}const an=.5*Math.atan2(2*sxy,sxx-syy);
 c.save();pathOf(c,top,1);c.clip();c.translate(mx,my);c.rotate(an);let u=-200;while(u<200){const w=5+R2()*6;c.fillStyle=tone(pal[(R2()*pal.length)|0],(R2()-.5)*.12);c.fillRect(u,-200,w,400);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(u,-200,.45,400);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(u+.45,-200,.25,400);
  if(R2()<.35){const v=(R2()-.5)*20;c.fillStyle='rgba(120,125,130,.45)';c.fillRect(u+w*.3,v,1.8,1.2)}u+=w}c.restore()}
/* the AT-AT walker at Star Tours: grey armoured body on four tall legs, its head toward (fx) */
function atat(c,e,x,y,fx){const G='#9aa0a6',D='#6f757c',s_=fx<0?-1:1,bh=12;for(const[lx,back]of[[-3.6,1],[3.2,1],[-2.6,0],[4.2,0]]){const X=x+lx*s_;c.fillStyle=back?D:G;c.fillRect(X-.45,y-bh,.9,bh);c.fillStyle=D;c.fillRect(X-.8,y-.6,1.6,.6);c.fillRect(X-.55,y-bh*.55,1.1,.9)}
 poly4(c,[[x-5.5*s_,y-bh],[x+5.5*s_,y-bh],[x+5*s_,y-bh-4.2],[x-5*s_,y-bh-4.2]],G);poly4(c,[[x-5*s_,y-bh-4.2],[x+5*s_,y-bh-4.2],[x+4.2*s_,y-bh-5],[x-4.2*s_,y-bh-5]],tone(G,.12));
 c.strokeStyle=D;c.lineWidth=.2;for(const t of[-2.5,0,2.5]){c.beginPath();c.moveTo(x+t*s_,y-bh);c.lineTo(x+t*s_,y-bh-4.2);c.stroke()}
 c.fillStyle=D;c.fillRect(x+(s_>0?5.5:-7),y-bh-3,1.5,1.2);poly4(c,[[x+7*s_,y-bh-1.6],[x+10*s_,y-bh-1.2],[x+10.4*s_,y-bh-3.4],[x+7*s_,y-bh-4]],G);c.fillStyle='#3a3f45';c.fillRect(x+(s_>0?9.2:-9.9),y-bh-3,.7,.6);
 c.strokeStyle='#4a4f55';c.lineWidth=.3;c.beginPath();c.moveTo(x+10*s_,y-bh-1.6);c.lineTo(x+11.6*s_,y-bh-1.8);c.stroke();if(e){e.fillStyle='rgba(255,120,90,.6)';e.fillRect(x+(s_>0?9.2:-9.9),y-bh-3,.7,.6)}}
/* Gertie, the dinosaur in Echo Lake: a green sauropod with her long neck raised */
function gertie(c,x,y,fx){const s_=fx<0?-1:1,G='#5fa04a',D='#3f7a35';c.fillStyle=D;for(const lx of[-2.2,1.8])c.fillRect(x+lx*s_-.6,y-2.6,1.2,2.6);c.fillStyle=G;c.beginPath();c.ellipse(x,y-3.6,4.2,2.2,0,0,7);c.fill();
 c.strokeStyle=G;c.lineWidth=1.3;c.lineCap='round';c.beginPath();c.moveTo(x+3*s_,y-4.5);c.quadraticCurveTo(x+5.5*s_,y-7,x+5.6*s_,y-10);c.stroke();c.beginPath();c.moveTo(x-3.8*s_,y-3.6);c.quadraticCurveTo(x-6.5*s_,y-3,x-8*s_,y-1.4);c.lineWidth=.9;c.stroke();c.lineCap='butt';
 c.fillStyle=G;c.beginPath();c.ellipse(x+6.2*s_,y-10.3,1.3,.8,0,0,7);c.fill();c.fillStyle='#fff';c.fillRect(x+6.4*s_-.2,y-10.6,.4,.4);c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(x-.8,y-4.6,2.4,.8,0,0,7);c.fill()}
/* Min and Bill's Dockside Diner: a little tramp steamer, dark red hull, white deckhouse, a funnel */
function steamer(c,e,P){const[mx,my]=wdwCen(P);let sxx=0,syy=0,sxy=0;for(const[x,y]of P){sxx+=(x-mx)**2;syy+=(y-my)**2;sxy+=(x-mx)*(y-my)}const an=.5*Math.atan2(2*sxy,sxx-syy),ca=Math.cos(an),sa=Math.sin(an);let lo=1e9,hi=-1e9;for(const[x,y]of P){const u=(x-mx)*ca+(y-my)*sa;lo=Math.min(lo,u);hi=Math.max(hi,u)}const L=(hi-lo)/2,W=2.6,pt=(u,v,h)=>[mx+ca*u-sa*v,my+sa*u+ca*v-h];
 c.fillStyle='#7a2a24';c.beginPath();[pt(-L,-W,0),pt(L*.8,-W,0),pt(L,0,0),pt(L*.8,W,0),pt(-L,W,0)].forEach((z,i)=>i?c.lineTo(...z):c.moveTo(...z));c.closePath();c.fill();
 c.fillStyle='#2a2a2e';c.beginPath();[pt(-L,W,0),pt(L*.8,W,0),pt(L*.8,W,2),pt(-L,W,2)].forEach((z,i)=>i?c.lineTo(...z):c.moveTo(...z));c.fill();
 poly4(c,[pt(-L*.5,-W*.6,2),pt(L*.3,-W*.6,2),pt(L*.3,W*.6,2),pt(-L*.5,W*.6,2)].map(([a,b])=>[a,b]),'#f4f0e6');poly4(c,[pt(-L*.5,W*.6,2),pt(L*.3,W*.6,2),pt(L*.3,W*.6,4.2),pt(-L*.5,W*.6,4.2)],'#f4f0e6');
 const f=pt(-L*.15,0,4.2);c.fillStyle='#e8c040';c.fillRect(f[0]-.7,f[1]-3.4,1.4,3.4);c.fillStyle='#222';c.fillRect(f[0]-.7,f[1]-3.6,1.4,.5);if(e){e.fillStyle='rgba(255,210,140,.7)';const w=pt(0,W*.6,3.2);e.fillRect(w[0]-1.5,w[1],3,.6)}}

function hsBuilding(q,bb,land,hh,hs){const n=q.n||'';
 if(/^(The Twilight Zone Tower of Terror|Jim Henson|Mickey and Minnie|Rock ’n’ Roller|Millennium Falcon|Star Wars: Rise|Fantasmic|Theater of the Stars)/.test(n)||q.k==='stadium')return null;
 if(!n&&typeof POS!=='undefined'&&POS['Pizza Rizzo']&&ptIn(POS['Pizza Rizzo'].c[0],POS['Pizza Rizzo'].c[1],q.p))return null;
 const towerB=OSM.buildings.find(b=>b.n==='The Twilight Zone Tower of Terror');if(towerB&&!n&&ptIn((bb[0]+bb[2])/2,(bb[1]+bb[3])/2,towerB.p))return null;
 const[mx,my]=wdwCen(q.p);
 if(/^Dinosaur Gertie/.test(n)){const W=OSM.areas.filter(a=>a.k==='water'&&a.o.length>4&&Math.hypot(...wdwCen(a.o).map((z,k)=>z-[mx,my][k]))<60)[0],fx=W?wdwCen(W.o)[0]-mx:1;return(c,e)=>gertie(c,mx,my+1.5,fx)}
 if(/^Min and Bill/.test(n))return(c,e)=>steamer(c,e,q.p);
 const fr=HSFRONT[land];if(!fr||q.k==='roof')return null;
 const st=LANDSTYLE[land];let A=0;for(let i=0;i<q.p.length;i++){const u=q.p[i],v=q.p[(i+1)%q.p.length];A+=u[0]*v[1]-v[0]*u[1]}A=Math.abs(A/2);
 let wall=st[0][hs%st[0].length],roof=q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length];
 if(land==='ac'){wall=['#f3ecdb','#efe6d2','#e9e2d4'][hs%3];roof=['#c9ccd6','#bfc4cf','#d4d6dc'][(hs>>>3)%3]}
 if(n==='Toy Story Mania!'){wall='#70aadb';roof='#c3c8b0'}
 const boulevard=land==='hb'||land==='sb'||land==='el',big=A>1500,showbox=(land==='ts'&&big&&n==='Toy Story Mania!')||(land==='el'&&n==='Star Tours: The Adventures Continue');
 const a=n==='Star Tours: The Adventures Continue'&&AT.find(x=>x.osm===n);
 const draw=(c,e)=>{if(showbox)wdwShowBox(c,q.p,hh,hs);else{extrude(c,e,q.p,hh,wall,roof,{noWin:big||land==='ts',ridge:false,deco:fr});
   if(boulevard&&A>300)wdwFlatRoofs(c,q.p,hh,hs,['#e6e1d6','#d9d4ca','#ece6da','#cfd3d6','#e2dccf',tone(st[1][hs%st[1].length],.3)]);else if(land==='sw'&&A>200){const r=seeded(hs);for(let i=0,k=0;i<Math.min(4,A/250)&&k<30;k++){const x=bb[0]+(bb[2]-bb[0])*(.15+r()*.7),y=bb[1]+(bb[3]-bb[1])*(.15+r()*.7);if(!ptIn(x,y,q.p))continue;i++;const R=1.6+r()*2,t=y-hh;c.fillStyle=tone(roof,.15);c.beginPath();c.ellipse(x,t,R,R*.45,0,0,7);c.fill();c.fillStyle=tone(roof,.05);c.beginPath();c.ellipse(x,t,R,R*.45,0,Math.PI,0);c.quadraticCurveTo(x,t-R*1.3,x-R,t);c.fill()}}}};
 if(a){let dx=a.dx-mx,dy=a.dy-my;const L=Math.hypot(dx,dy)||1,ax=a.dx+dx/L*3,ay=a.dy+dy/L*3;return[{y:bb[3],f:draw},{y:Math.max(ay+2,bb[3]+1),f:(c,e)=>{for(const k of[c,e])if(k){k.save();k.translate(ax,ay);k.scale(1.7,1.7)}atat(c,e,0,0,dx);for(const k of[c,e])if(k)k.restore()}}] /* after the show building beside it: it stands out in the plaza and towers over the box */}
 return draw}

/* ---------------- Animal Kingdom (owner, 25 Nov 2026: "Yes, Animal Kingdom") ----------------
   Harambe (Africa): Swahili-coast plaster, weathered and stained, carved dark doors, thatched (makuti) and rusty tin roofs.
   Anandapur (Asia): faded ochre, terracotta and teal plaster, painted bands, tiled roofs, strings of prayer flags.
   Discovery Island: folk-art painted wood in bright colours with carved trim and bright corrugated roofs.
   Pandora: Flight of Passage's mountain of rock, with bioluminescent spots that glow at night on Pandora's buildings.
   Oasis: the Rainforest Cafe's rockwork and waterfall. The Tree of Life, Everest's mountain, the safari and the backstage
   animal houses keep their own painting. */
function stain(c,p,q,L,h,col){const r=seeded((p[0]*13+p[1]*7)|0);c.fillStyle=col;for(let i=0;i<L/1.6;i++){const t=r(),a=wdwAt(p,q,t,h*(.5+r()*.5)),w=.4+r()*1.2;c.fillRect(a[0]-w/2,a[1],w,h*(.2+r()*.5))}}
function harambeDeco(c,p,q,L,h){wdwBand(c,p,q,0,Math.min(1,h*.18),'rgba(110,80,50,.3)');stain(c,p,q,L,h,'rgba(120,90,55,.15)');
 if(L>4){const a=wdwAt(p,q,.42,0),b=wdwAt(p,q,.58,0),dh=Math.min(3,h*.55);poly4(c,[a,b,[b[0],b[1]-dh],[a[0],a[1]-dh]],'#5a3a24');c.strokeStyle='#c9a46a';c.lineWidth=.15;c.beginPath();c.moveTo(a[0],a[1]-dh);c.lineTo(b[0],b[1]-dh);c.stroke()}}
function anandapurDeco(c,p,q,L,h){stain(c,p,q,L,h,'rgba(90,60,40,.16)');wdwBand(c,p,q,h*.55,h*.55+.5,['#3f7a6a','#b8603a','#d9a441'][hsh((p[0]*3)|0)%3]);wdwBand(c,p,q,h-.5,h,'#e8d6b0')}
function discoveryDeco(c,p,q,L,h){c.strokeStyle='rgba(60,40,30,.2)';c.lineWidth=.15;c.beginPath();const n=Math.floor(L/.7);for(let i=1;i<n;i++){c.moveTo(...wdwAt(p,q,i/n,0));c.lineTo(...wdwAt(p,q,i/n,h))}c.stroke();
 const cols=['#e84a6a','#f0c040','#3fb0a8','#8a5ad0','#f08a3a'],k=hsh((p[0]*5+p[1])|0);wdwBand(c,p,q,h-.8,h,cols[k%5]);wdwBand(c,p,q,0,.6,cols[(k+2)%5]);
 const m=Math.max(1,Math.round(L/2));for(let i=0;i<m;i++){const a=wdwAt(p,q,(i+.5)/m,h-1.3);c.fillStyle=cols[(k+i)%5];c.beginPath();c.arc(a[0],a[1],.35,0,7);c.fill()}} /* carved and painted animal medallions under the eaves */
function pandoraDeco(c,p,q,L,h){c.strokeStyle='rgba(70,90,80,.35)';c.lineWidth=.2;const r=seeded((p[0]*3+p[1])|0);c.beginPath();for(let i=0;i<L/1.5;i++){const t=r(),v=r()*h;c.moveTo(...wdwAt(p,q,t,v));c.quadraticCurveTo(...wdwAt(p,q,t+.03,v+1),...wdwAt(p,q,t+.01,v+2))}c.stroke()}
const AKFRONT={af:harambeDeco,as:anandapurDeco,di:discoveryDeco,pa:pandoraDeco,oa:harambeDeco};
/* thatch over a roof: straw strokes running down the slope */
function thatch(c,poly,hh,col){const top=poly.map(([x,y])=>[x,y-hh]),tb=bbox(top);c.save();pathOf(c,top,1);c.clip();c.fillStyle=col;c.fillRect(tb[0]-1,tb[1]-1,tb[2]-tb[0]+2,tb[3]-tb[1]+2);c.strokeStyle='rgba(90,65,35,.45)';c.lineWidth=.25;
 for(let x=tb[0];x<tb[2];x+=.6){c.beginPath();c.moveTo(x,tb[1]);c.lineTo(x+.8,tb[3]);c.stroke()}c.strokeStyle='rgba(255,235,190,.25)';for(let y=tb[1]+1;y<tb[3];y+=2.2){c.beginPath();c.moveTo(tb[0],y);c.lineTo(tb[2],y);c.stroke()}c.restore()}
/* glowing spots of Pandora's plants and buildings, seen at night (on the glow layer only, with faint daytime dots) */
function bioGlow(c,e,poly,hh,seed){const bb=bbox(poly),r=seeded(seed);for(let i=0;i<Math.min(30,(bb[2]-bb[0])*(bb[3]-bb[1])/60);i++){const x=bb[0]+r()*(bb[2]-bb[0]),y=bb[1]+r()*(bb[3]-bb[1]);if(!ptIn(x,y,poly))continue;const col=r()<.5?'rgba(80,220,255,':'rgba(220,90,255,';
  c.fillStyle=col+'.25)';c.beginPath();c.arc(x,y-hh,.5,0,7);c.fill();if(e){e.fillStyle=col+'.9)';e.beginPath();e.arc(x,y-hh,.7,0,7);e.fill()}}}
/* prayer flags: a sagging string of small coloured flags from (a) to (b), up at height h */
function prayerFlags(c,a,b,h){const n=Math.max(4,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/1.2)),cols=['#3f6ad0','#f2efe4','#d9473f','#58a85a','#f0c040'];c.strokeStyle='rgba(60,50,40,.5)';c.lineWidth=.12;c.beginPath();
 for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t-h+Math.sin(t*Math.PI)*1.6;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();for(let i=1;i<n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t-h+Math.sin(t*Math.PI)*1.6;c.fillStyle=cols[i%5];c.fillRect(x-.3,y,.6,.8)}}

function akBuilding(q,bb,land,hh,hs){const n=q.n||'',[mx,my]=wdwCen(q.p);
 if(n==='Tree of Life'||q.k==='roof'||q.k==='train_station'||/House$|^Aviary|Trainshed|^WAT|^Dep /.test(n))return null;
 const ev=OSM.places.everest;if(land==='as'&&ev&&Math.hypot(mx-ev[0],my-ev[1])<48)return null; /* Everest's show building: the painted mountain stands there */
 let A=0;for(let i=0;i<q.p.length;i++){const u=q.p[i],v=q.p[(i+1)%q.p.length];A+=u[0]*v[1]-v[0]*u[1]}A=Math.abs(A/2);
 const st=LANDSTYLE[land],fr=AKFRONT[land];let wall=st[0][hs%st[0].length],roof=q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length];
 if(land==='pa'&&!n&&A>4000)return(c,e)=>{extrude(c,null,q.p,Math.min(hh,10*OSM.S),'#8a8378','#7d8a6a',{noWin:true,ridge:false,deco:pandoraDeco});bioGlow(c,e,q.p,Math.min(hh,10*OSM.S),hs)}; /* Flight of Passage's show building under its rock and plants */
 if(n==='Rainforest Cafe')return(c,e)=>{extrude(c,e,q.p,hh,'#9a8a72','#5f8a4a',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{stain(c,p,q2,L,h,'rgba(60,50,40,.25)')}});const t=q.p.map(([x,y])=>[x,y-hh]),b2=bbox(t),r=seeded(hs);c.fillStyle='#4f8a3f';for(let i=0;i<40;i++){const x=b2[0]+r()*(b2[2]-b2[0]),y=b2[1]+r()*(b2[3]-b2[1]);if(ptIn(x,y+hh,q.p)){c.beginPath();c.arc(x,y,1+r()*1.5,0,7);c.fill()}}
  const P=q.p.reduce((u,v)=>v[1]>u[1]?v:u);c.fillStyle='rgba(200,235,255,.85)';c.fillRect(P[0]-1.2,P[1]-hh,2.4,hh);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(P[0]-.4,P[1]-hh,.5,hh)}; /* its waterfall on the front corner */
 const thatched=land==='af'&&(n==='Harambe Theatre'||hs%3===0)||land==='di'&&hs%4===0,split=A>500&&!thatched;
 return(c,e)=>{extrude(c,e,q.p,hh,wall,roof,{noWin:A>2000,ridge:!split&&!thatched,deco:fr});
  if(thatched)thatch(c,q.p,hh,land==='di'?'#c9a46a':'#b8955a');else if(split)wdwRoofs(c,q.p,hh,hs,land==='af'?['#8a5a3a','#9a6a4a','#7a6a5a','#a5562f']:land==='di'?['#3f8a7a','#b5603a','#b89040','#7d6a8a','#8a6a3e']:st[1],roof);
  if(land==='pa')bioGlow(c,e,q.p,hh,hs);
  if(land==='as'&&A>250){const P=q.p,k=hs%P.length,a=P[k],b=P[(k+Math.floor(P.length/2))%P.length];prayerFlags(c,[a[0],a[1]],[b[0],b[1]],hh+1.5)}}}

/* ---------------- the resort hotels that had no style yet (owner, 25 Nov 2026: "Yes, the resorts") ----------------
   Found by their named buildings in the map data: Pop Century (Classic Hall) and Art of Animation (Animation Hall), Port Orleans
   Riverside's mansions (Oak Manor, Parterre Place, Magnolia Terrace) and its Alligator Bayou lodges, Port Orleans French Quarter
   (Mardi Grogs), Old Key West, Saratoga Springs, Caribbean Beach (Old Port Royale) and the Riviera. Each gets its colours, wall detail
   and roofs; the Crescent Lake hotels, the monorail resorts, Wilderness Lodge, Animal Kingdom Lodge, Coronado Springs and the All-Stars
   already had theirs. */
const WDWRES=[['riv',[7008,6515],120],['pop',[6945,8251],270],['aoa',[6408,8285],250],['porm',[7762,4253],150],['porb',[7363,4011],230],['pofq',[7636,4809],190],
 ['ssrt',[8320,5150],240],['okw',[7655,5300],380],['ssr',[8950,5050],520],['cbr',[6950,7000],420]];
function wdwResort(x,y){for(const[k,c,r]of WDWRES)if(Math.hypot(x-c[0],y-c[1])<r)return k;return null}
/* clapboard: white-edged boards, white corner trim and a porch rail */
function clapDeco(c,p,q,L,h){c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=.15;c.beginPath();for(let v=.6;v<h;v+=.6){c.moveTo(...wdwAt(p,q,0,v));c.lineTo(...wdwAt(p,q,1,v))}c.stroke();
 wdwBand(c,p,q,h-.5,h,'#ffffff');for(const t of[0,1]){const a=wdwAt(p,q,t,0);c.fillStyle='#ffffff';c.fillRect(a[0]-.25,a[1]-h,.5,h)}
 if(h>5){wdwLine(c,p,q,h*.45,'#ffffff',.35);const n=Math.max(2,Math.round(L/.8));c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=.12;c.beginPath();for(let i=1;i<n;i++){c.moveTo(...wdwAt(p,q,i/n,h*.45));c.lineTo(...wdwAt(p,q,i/n,h*.45-.9))}c.stroke()}}
/* an antebellum mansion: tall white columns along the front and a white cornice */
function columnDeco(c,p,q,L,h){wdwBand(c,p,q,h-.7,h,'#ffffff');const n=Math.max(1,Math.round(L/2.4));for(let i=0;i<=n;i++){const a=wdwAt(p,q,i/n,0);c.fillStyle='#ffffff';c.fillRect(a[0]-.4,a[1]-h,.8,h);c.fillStyle='rgba(0,0,0,.14)';c.fillRect(a[0]+.2,a[1]-h,.25,h)}wdwLine(c,p,q,h*.5,'rgba(255,255,255,.9)',.4)}
/* Pop Century: a coloured stair tower at each end of a white block, a decade-colour band along the top */
function popDeco(c,p,q,L,h){const k=hsh((p[0]*3+p[1]*5)|0),col=['#e9524a','#3f7fd0','#f2c24a','#58a85a','#f08a3a','#b05ad0'][k%6];wdwBand(c,p,q,h-1,h,col);
 for(const t of[0,1]){if(L<8)break;const a=wdwAt(p,q,t?1-2/L:0,0),b=wdwAt(p,q,t?1:2/L,0);poly4(c,[a,b,[b[0],b[1]-h-.8],[a[0],a[1]-h-.8]],col)}wdwLine(c,p,q,h*.33,'rgba(255,255,255,.7)',.25);wdwLine(c,p,q,h*.66,'rgba(255,255,255,.7)',.25)}
const RESSTYLE={
 pop:{w:['#f4f2ec','#f0ede4'],r:['#d4d8dc','#c9cdd2'],deco:popDeco,flat:true},
 aoa:{w:['#f0a040','#3fa0d0','#e8c46a','#f07a50','#5ab0b0','#e8607a'],r:['#d4d8dc','#c9cdd2'],deco:popDeco,flat:true},
 porm:{w:['#fbf8f2','#f6f1e7'],r:['#6e7e76','#64746c','#748086'],deco:columnDeco},
 porb:{w:['#a88a62','#9a7a52','#b8986a'],r:['#8a8f94','#7a7f84','#9a8a7a'],deco:frDeco},
 pofq:{w:['#f0c8b4','#ecdca0','#bcd8c8','#f4e4cc','#e8bca0'],r:['#6e7884','#7a8a7c','#8e7062','#78828e'],deco:franceDeco},
 okw:{w:['#cfe8d8','#f6e0e4','#f6eec0','#e0eef6','#fbfaf4'],r:['#c9d4d8','#a8c4c8','#b8c8cc'],deco:clapDeco},
 ssrt:{w:['#a88a62','#9a7a52','#b0926a'],r:['#5a6a50','#6a5a48','#4f5f48'],deco:norwayDeco}, /* Saratoga's Treehouse Villas: wood on stilts in the woods */
 ssr:{w:['#e8d8a8','#d6c48e','#cfdcc8','#efe6d0'],r:['#4f6f5a','#6a5a48','#5a6a50'],deco:clapDeco},
 cbr:{w:['#f6c8a8','#f6e08a','#a8d8e8','#f0a8b8','#b8e0b0'],r:['#c9503a','#3f8a8a','#d9a040'],deco:clapDeco},
 riv:{w:['#f2e6cc','#efdcbc','#f6ecd8'],r:['#b5603a','#a8502f','#c4673f'],deco:libDeco}};
function resortBuilding(q,bb,k,hh,hs){if(q.k==='roof')return null;const S_=RESSTYLE[k];let A=0;for(let i=0;i<q.p.length;i++){const u=q.p[i],v=q.p[(i+1)%q.p.length];A+=u[0]*v[1]-v[0]*u[1]}A=Math.abs(A/2);
 const wall=S_.w[hs%S_.w.length],roof=S_.r[(hs>>>4)%S_.r.length],split=A>350;
 return(c,e)=>{extrude(c,e,q.p,hh,wall,roof,{ridge:!split,deco:S_.deco});if(split){if(S_.flat)wdwFlatRoofs(c,q.p,hh,hs,S_.r);else wdwRoofs(c,q.p,hh,hs,S_.r,roof)}}}
