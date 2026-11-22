/* ===== DISNEYLAND RESORT MAP ART (loaded only at the Disneyland Resort, after map-art.js) =====
   The landmarks the map data only gives as plain outlines, drawn to look like the real ones (original drawings, no
   Disney artwork): the Haunted Mansion's white antebellum house, the "it's a small world" façade with its clock tower,
   Big Thunder's red rock spires, Galaxy's Edge's petrified spires, Carthay Circle Theatre's tower, the Guardians'
   fortress, Grizzly Peak, the Cadillac Range over Cars Land, the Pixar Pal-A-Round and the Incredicoaster's track.
   Also the look of the rest: Main Street's Victorian colours, New Orleans Square's iron balconies, and the big show
   buildings behind the façades as plain, windowless boxes. Called from paintMap (map-art.js): dlBuilding() for each
   building (a draw function, false to skip it, or null for the usual painting) and dlLandmarks() once. */
if(typeof DL!=='undefined'&&DL){
 /* Main Street, U.S.A.: Victorian storefronts in cream, brick, mustard, sage and slate, under slate, brown and green roofs */
 LANDSTYLE.ms=[['#efe3cc','#b8654f','#d9b56a','#a9b98f','#8fa3b5','#d99a82','#f3eee4','#c98f6a'],['#5e5a57','#6b4a3a','#4f6a52','#8a3f35','#7a6a55','#4a5566','#6a5a4a']];
 LANDSTYLE.nos=[['#efe2cf','#e8c9b0','#d9b9a3','#f3e6d6','#c9a98f','#e6d1a8','#d7c0c6'],['#6a6560','#7a4a3a','#4f5f63','#8a5440']];
}
const DLX={};
const dlInPark=(x,y)=>(OSM.dlp&&ptIn(x,y,OSM.dlp))||(OSM.dca&&ptIn(x,y,OSM.dca));
/* New Orleans Square: a wrought-iron balcony along each upper floor */
function nosDeco(c,p,q,L,h){if(L<4||h<5)return;const y0=h*.52;c.strokeStyle='rgba(40,38,44,.85)';c.lineWidth=.35;c.beginPath();c.moveTo(p[0],p[1]-y0);c.lineTo(q[0],q[1]-y0);c.moveTo(p[0],p[1]-y0-1.6);c.lineTo(q[0],q[1]-y0-1.6);c.stroke();
 c.lineWidth=.18;const n=Math.floor(L/.9);c.beginPath();for(let i=1;i<n;i++){const t=i/n,x=p[0]+(q[0]-p[0])*t,y=p[1]+(q[1]-p[1])*t-y0;c.moveTo(x,y);c.lineTo(x,y-1.6)}c.stroke();
 c.fillStyle='rgba(40,38,44,.35)';c.beginPath();c.moveTo(p[0],p[1]-y0+.2);c.lineTo(q[0],q[1]-y0+.2);c.lineTo(q[0],q[1]-y0+.9);c.lineTo(p[0],p[1]-y0+.9);c.fill()}
/* a show building: painted "go-away green" like the real ones so it fades into the planting round it: soft sage walls, a
   pale flat roof with a few rooftop units, no windows, kept low. Painted early (before the park's own buildings) so the
   façades and shops standing on or against it are drawn over it. */
function dlShowBox(c,e,poly,hh,hs,inner){const W_=['#a8b190','#a3ad8c','#afb797'],R_=['#c3c8b0','#bcc2a8','#c8ccb6'];let h=Math.min(hh,9*OSM.S);
 /* façades standing inside its outline (New Orleans Square's French Quarter is the front of the Pirates building): the show
    building rises to their roofline and is drawn after them, round their roofs, so their backs are hidden behind it the way
    the real show building hides them, and only their roofs show through */
 if(inner&&inner.length){h=Math.min(16*OSM.S,Math.max(h,...inner.map(b=>b[1])));const bb=bbox(poly);c.save();c.beginPath();c.rect(bb[0]-5,bb[1]-h-30,bb[2]-bb[0]+10,bb[3]-bb[1]+h+40);for(const[p,ih]of inner){p.forEach(([x,y],i)=>i?c.lineTo(x,y-ih):c.moveTo(x,y-ih));c.closePath()}c.clip('evenodd')}
 extrude(c,null,poly,h,W_[hs%3],R_[(hs>>>3)%3],{noWin:true,ridge:false});if(inner&&inner.length)c.restore();
 const bb=bbox(poly),r=seeded(hs);c.fillStyle='rgba(110,118,100,.4)';for(let i=0;i<Math.min(9,(bb[2]-bb[0])*(bb[3]-bb[1])/500);i++){const x=bb[0]+4+r()*(bb[2]-bb[0]-8),y=bb[1]+4+r()*(bb[3]-bb[1]-8);if(ptIn(x,y,poly))c.fillRect(x-1.2,y-h-.9,2.4,1.6)}}
/* The Haunted Mansion's house: on its own outline in the map (east of the railroad; the show building is beyond the tracks),
   white walls with dark-shuttered windows, a row of tall columns round its porches, a dark slate roof and a cupola */
function hauntedMansion(c,e,q,bb,hs){const hh=12*OSM.S,cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2;
 extrude(c,null,q.p,hh,'#f3efe7','#4f5862',{win:'#33403a',noGlow:true,ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=.35;c.beginPath();c.moveTo(p[0],p[1]-h*.52);c.lineTo(q2[0],q2[1]-h*.52);c.stroke();
  const n=Math.max(1,Math.round(L/2.4));for(let i=0;i<=n;i++){const t=i/n,x=p[0]+(q2[0]-p[0])*t,y=p[1]+(q2[1]-p[1])*t;c.fillStyle='#ffffff';c.fillRect(x-.4,y-h,.8,h);c.fillStyle='rgba(0,0,0,.15)';c.fillRect(x+.2,y-h,.25,h)}
  c.fillStyle='#ffffff';c.beginPath();c.moveTo(p[0],p[1]-h);c.lineTo(q2[0],q2[1]-h);c.lineTo(q2[0],q2[1]-h-.7);c.lineTo(p[0],p[1]-h-.7);c.fill()}});
 const top=cy_-hh;poly4(c,[[cx_-2.6,top-1],[cx_+2.6,top-1],[cx_+2.6,top-5],[cx_-2.6,top-5]],'#f3efe7');poly4(c,[[cx_-3.2,top-5],[cx_+3.2,top-5],[cx_,top-9]],'#4f5862');c.fillStyle='#33403a';c.fillRect(cx_-.9,top-4.3,1.8,2.4);
 c.strokeStyle='#2b2b2b';c.lineWidth=.3;c.beginPath();c.moveTo(cx_,top-9);c.lineTo(cx_,top-11.5);c.stroke();
 if(e){e.fillStyle='rgba(170,255,190,.35)';e.fillRect(cx_-.9,top-4.3,1.8,2.4)}}
/* "it's a small world": along the show building's front (its longest south-facing wall, so it follows the building's real
   angle) the white façade of stylised towers (cones, onion domes, spires) trimmed in gold, with the clock tower in the middle */
function smallWorld(c,e,q,bb,hs){const P=q.p,n=P.length;let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const sg=A>0?1:-1;let best=null;
 for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),ny=-dx/L*sg;if(ny>.5&&(!best||L>best[2]))best=[a,b,L]}
 if(!best)return;let[a,b,L]=best;if(a[0]>b[0])[a,b]=[b,a];const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],gold='#d9b04a',white='#f7f4ee';
 const base=(t0,t1,h,col)=>{const p0=at(t0),p1=at(t1);poly4(c,[p0,p1,[p1[0],p1[1]-h],[p0[0],p0[1]-h]],col)};
 base(.06,.94,7,white);{const p0=at(.06),p1=at(.94);c.strokeStyle=gold;c.lineWidth=.6;c.beginPath();c.moveTo(p0[0],p0[1]-7);c.lineTo(p1[0],p1[1]-7);c.stroke()}
 const N=11,tw=L*.88/N*.42;for(let i=0;i<N;i++){const t=.06+(i+.5)*.88/N,[tx,ty]=at(t),th=8+((i*7)%4)*3.2,k=i%4,y0=ty-7;
  poly4(c,[[tx-tw,y0],[tx+tw,y0],[tx+tw,y0-th],[tx-tw,y0-th]],i%2?white:'#f1ece2');c.fillStyle=gold;c.fillRect(tx-tw,y0-th,tw*2,.5);const top=y0-th;
  if(k===0)poly4(c,[[tx-tw*1.1,top],[tx+tw*1.1,top],[tx,top-tw*3]],gold);
  else if(k===1){c.fillStyle=gold;c.beginPath();c.moveTo(tx-tw,top);c.quadraticCurveTo(tx-tw*1.3,top-tw*1.4,tx,top-tw*2.6);c.quadraticCurveTo(tx+tw*1.3,top-tw*1.4,tx+tw,top);c.fill()}
  else if(k===2){poly4(c,[[tx-tw,top],[tx+tw,top],[tx+tw*.4,top-tw*1.2],[tx-tw*.4,top-tw*1.2]],white);poly4(c,[[tx-tw*.4,top-tw*1.2],[tx+tw*.4,top-tw*1.2],[tx,top-tw*3.4]],gold)}
  else{c.fillStyle=white;c.beginPath();c.arc(tx,top,tw,Math.PI,0);c.fill();c.fillStyle=gold;c.fillRect(tx-.2,top-tw-2,.4,2)}
  c.fillStyle=['#e88aa8','#7fb8e0','#9ad08a','#f0c860'][i%4];c.beginPath();c.arc(tx,y0-th*.55,Math.min(1.1,tw*.5),0,7);c.fill()}
 const[mx,my]=at(.5),cw=L*.06,ch=26,y0=my-7;poly4(c,[[mx-cw,y0],[mx+cw,y0],[mx+cw,y0-ch],[mx-cw,y0-ch]],white);c.fillStyle=gold;c.fillRect(mx-cw,y0-ch,cw*2,.7);
 poly4(c,[[mx-cw*1.15,y0-ch],[mx+cw*1.15,y0-ch],[mx,y0-ch-cw*3.2]],gold);c.fillStyle='#ffffff';c.beginPath();c.arc(mx,y0-ch*.62,cw*.72,0,7);c.fill();c.strokeStyle=gold;c.lineWidth=.4;c.stroke();
 c.strokeStyle='#2c4a8a';c.lineWidth=.3;c.beginPath();c.moveTo(mx,y0-ch*.62);c.lineTo(mx,y0-ch*.62-cw*.55);c.moveTo(mx,y0-ch*.62);c.lineTo(mx+cw*.4,y0-ch*.62);c.stroke();
 if(e){e.fillStyle='rgba(255,230,170,.5)';for(let i=0;i<N;i++){const[tx,ty]=at(.06+(i+.5)*.88/N);e.fillRect(tx-.6,ty-10,1.2,1.2)}e.fillStyle='rgba(255,255,230,.7)';e.beginPath();e.arc(mx,y0-ch*.62,cw*.72,0,7);e.fill()}}
/* the Grand Californian: Craftsman style, dark brown shingled walls with cream trim, deep green-brown roofs, warm windows */
function grandCal(c,e,q,hh){extrude(c,e,q.p,hh,'#7e5d42','#6a6552',{win:'#e9dcbc',ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='#efe4c8';c.lineWidth=.45;for(const f of[.02,.36,.7]){c.beginPath();c.moveTo(p[0],p[1]-h*f);c.lineTo(q2[0],q2[1]-h*f);c.stroke()}c.strokeStyle='rgba(60,40,25,.35)';c.lineWidth=.2;for(let v=1;v<h;v+=1){c.beginPath();c.moveTo(p[0],p[1]-v);c.lineTo(q2[0],q2[1]-v);c.stroke()}}});
 /* the roofs: shingle courses, rows of gabled dormers and stone chimneys, so it reads as pitched roofs and not one flat slab */
 const top=q.p.map(([x,y])=>[x,y-hh]),b=bbox(top),r=seeded(1901);c.save();c.beginPath();top.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 c.strokeStyle='rgba(50,40,30,.18)';c.lineWidth=.3;for(let y=b[1];y<b[3];y+=1.6){c.beginPath();c.moveTo(b[0],y);c.lineTo(b[2],y);c.stroke()}
 for(let y=b[1]+5;y<b[3];y+=12)for(let x=b[0]+4+((y/12|0)%2)*7;x<b[2];x+=14){if(!ptIn(x,y+hh,q.p)||!ptIn(x+4,y+hh+3,q.p)||!ptIn(x-4,y+hh-3,q.p)||r()<.35)continue;poly4(c,[[x-1.3,y+.9],[x+1.3,y+.9],[x+1.3,y-.4],[x,y-1.4],[x-1.3,y-.4]],'#cdbf9f');c.fillStyle='#3f4a42';c.fillRect(x-.6,y-.4,1.2,1);
  if(e)e.fillStyle='rgba(255,210,140,.8)',e.fillRect(x-.6,y-.4,1.2,1);if(r()<.18){c.fillStyle='#8a8172';c.fillRect(x+3,y-3.2,1.4,3.4);c.fillStyle='#6a6256';c.fillRect(x+3,y-3.4,1.4,.5)}}
 c.restore()}
/* the Guardians' fortress: a tall dark industrial block with copper ribs and pipes, stepping in near the top */
function guardiansFortress(c,e,q,bb,hh){const H=Math.max(hh,40*OSM.S);extrude(c,e,q.p,H*.72,'#3d4148','#2f3238',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='#b07a3a';c.lineWidth=.55;const n=Math.max(2,Math.floor(L/3));c.beginPath();for(let i=1;i<n;i++){const t=i/n,x=p[0]+(q2[0]-p[0])*t,y=p[1]+(q2[1]-p[1])*t;c.moveTo(x,y);c.lineTo(x,y-h)}c.stroke();c.fillStyle='#c9903f';c.beginPath();c.moveTo(p[0],p[1]-h*.62);c.lineTo(q2[0],q2[1]-h*.62);c.lineTo(q2[0],q2[1]-h*.62+.8);c.lineTo(p[0],p[1]-h*.62+.8);c.fill()}});
 const cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2,w=(bb[2]-bb[0])*.28,d=(bb[3]-bb[1])*.25;extrude(c,e,[[cx_-w,cy_-d],[cx_+w,cy_-d],[cx_+w,cy_+d],[cx_-w,cy_+d]].map(([x,y])=>[x,y-H*.72]),H*.28,'#454a52','#33363c',{noWin:true,ridge:false});
 if(e){e.fillStyle='rgba(255,170,90,.55)';e.fillRect(cx_-w,cy_-d-H+1,w*2,.8)}}
/* Carthay Circle Theatre: white Spanish-colonial walls and red tiles, and its tall tower with a gold-topped blue spire */
function carthay(c,e,q,bb,hh){extrude(c,e,q.p,hh,'#f4efe4','#b5583a',{ridge:true});
 /* the tower stands at the corner looking onto Carthay Circle (places.carthaycircle), pulled a little inside the outline */
 const cc=OSM.places.carthaycircle;let tp=[(bb[0]+bb[2])/2,bb[3]-4];if(cc){let bd=1e9;for(const p of q.p){const d=Math.hypot(p[0]-cc[0],p[1]-cc[1]);if(d<bd){bd=d;tp=p}}const mx=(bb[0]+bb[2])/2,my=(bb[1]+bb[3])/2;tp=[tp[0]+(mx-tp[0])*.15,tp[1]+(my-tp[1])*.15]}
 const tx=tp[0],ty=tp[1],w=3.4,H=hh+20;
 poly4(c,[[tx-w,ty],[tx+w,ty],[tx+w,ty-H],[tx-w,ty-H]],'#f6f2e8');poly4(c,[[tx,ty],[tx+w,ty],[tx+w,ty-H],[tx,ty-H]],'#e2dccf');
 c.fillStyle='#3f5a7a';for(let i=0;i<3;i++)c.fillRect(tx-.8,ty-H*(.5+i*.14),1.6,2.2);
 poly4(c,[[tx-w*1.2,ty-H],[tx+w*1.2,ty-H],[tx+w*.9,ty-H-1.4],[tx-w*.9,ty-H-1.4]],'#e8e1d2');poly4(c,[[tx-w*.9,ty-H-1.4],[tx+w*.9,ty-H-1.4],[tx,ty-H-9]],'#3e6fa0');
 c.fillStyle='#e0b440';c.fillRect(tx-.3,ty-H-11,.6,2.5);c.beginPath();c.arc(tx,ty-H-11,.7,0,7);c.fill();
 if(e){e.fillStyle='rgba(255,230,180,.6)';e.fillRect(tx-w,ty-H,w*2,H*.6)}}
/* a cluster of rock spires: [x, y, height, width] each, painted back to front; strata bands when `bands` */
function dlSpire(c,x,y,h,w,col,bands,r){const P=[[x-w,y],[x-w*.75,y-h*.55],[x-w*.42,y-h*.92],[x-w*.1,y-h],[x+w*.3,y-h*.9],[x+w*.62,y-h*.55],[x+w,y]];
 poly4(c,P,col[0]);poly4(c,[[x+w*.05,y],[x-w*.1,y-h],[x+w*.3,y-h*.9],[x+w*.62,y-h*.55],[x+w,y]],col[2]);poly4(c,[[x-w*.42,y-h*.92],[x-w*.1,y-h],[x-w*.05,y-h*.5],[x-w*.5,y-h*.6]],col[1]);
 if(bands){c.save();c.beginPath();P.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.clip();c.strokeStyle='rgba(90,30,15,.3)';c.lineWidth=Math.max(.3,h*.025);for(let k=1;k<6;k++){const yy=y-h*k/6+(r()-.5)*h*.04;c.beginPath();c.moveTo(x-w,yy);c.lineTo(x+w,yy+(r()-.5)*h*.05);c.stroke()}c.restore()}}
function dlSpires(B,vis,pts,col,bands,seed){const r=seeded(seed);for(const[x,y,h,w]of pts){if(!vis([x-w,y-h,x+w,y+2]))continue;B.push({y,f:()=>dlSpire(B.c,x,y,h,w,col,bands,r)})}}
/* Grizzly Peak: a granite mountain whose top is a bear's head (snout, ear) looking out over the park, pines on its slopes */
function grizzly(c,x,y,R){const H=R*1.5;c.fillStyle='rgba(30,40,30,.25)';c.beginPath();c.ellipse(x+H*.25,y+2,R*1.2,R*.4,0,0,7);c.fill();
 poly4(c,[[x-R,y],[x-R*.6,y-H*.5],[x-R*.35,y-H*.8],[x-R*.05,y-H*.86],[x+R*.12,y-H*.98],[x+R*.22,y-H*.9],[x+R*.5,y-H*.86],[x+R*.62,y-H*.78],[x+R*.55,y-H*.7],[x+R*.75,y-H*.48],[x+R,y]],'#a08f78');
 poly4(c,[[x+R*.05,y],[x+R*.12,y-H*.98],[x+R*.22,y-H*.9],[x+R*.5,y-H*.86],[x+R*.62,y-H*.78],[x+R*.55,y-H*.7],[x+R*.75,y-H*.48],[x+R,y]],'#7d6d5a');
 poly4(c,[[x-R*.35,y-H*.8],[x-R*.05,y-H*.86],[x-R*.1,y-H*.55],[x-R*.45,y-H*.55]],'#b8a68c');
 c.fillStyle='#3a2f28';c.beginPath();c.arc(x+R*.56,y-H*.8,R*.035,0,7);c.fill(); /* the bear's eye */
 const r=seeded(1955);for(let i=0;i<22;i++){const t=r(),a=(r()-.5)*1.8,px=x+Math.sin(a)*R*.85*(1-t*.6),py=y-H*t*.55-R*.05;const s=R*.07*(1-t*.4);poly4(c,[[px-s,py],[px+s,py],[px,py-s*3.2]],i%3?'#2f5a3a':'#3d6a45')}}
/* the Cadillac Range over Cars Land: tall red-orange buttes shaped like the tail fins of old cars, banded with strata */
function cadillac(c,x,y,h,w,r){const lean=w*.5;const P=[[x-w,y],[x-w*.8,y-h*.7],[x-w*.3+lean,y-h],[x+w*.15+lean,y-h*.96],[x+w*.55,y-h*.55],[x+w,y]];poly4(c,P,'#c8643a');poly4(c,[[x+w*.15+lean,y-h*.96],[x+w*.55,y-h*.55],[x+w,y],[x+w*.1,y]],'#a14a2a');poly4(c,[[x-w*.8,y-h*.7],[x-w*.3+lean,y-h],[x-w*.25+lean*.7,y-h*.75],[x-w*.65,y-h*.5]],'#e08a55');
 c.save();c.beginPath();P.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.clip();c.strokeStyle='rgba(240,200,150,.35)';c.lineWidth=Math.max(.4,h*.03);for(let k=1;k<7;k++){const yy=y-h*k/7;c.beginPath();c.moveTo(x-w,yy+(r()-.5)*2);c.lineTo(x+w,yy+(r()-.5)*2);c.stroke()}c.restore()}
/* the Pixar Pal-A-Round: a 49 m Ferris wheel on the pier. Its outline in the map is a strip along the wheel's plane
   (places.palwheel = centre, direction, diameter), which runs north-west to south-east, so from the map's southern view the
   wheel is seen at an angle: a leaning oval. palPt(θ, f) is a point on it (f = fraction of the radius); WoC lights it too. */
function palGeo(){const w=OSM.places.palwheel,p=OSM.places.palaround;if(w)return{x:w[0],y:w[1],ux:w[2],uy:w[3],R:w[4]/2};return p?{x:p[0],y:p[1],ux:1,uy:0,R:22}:null}
function palPt(th,f){const G=palGeo(),r=G.R*(f==null?1:f),Hc=G.R+3;return[G.x+G.ux*r*Math.cos(th),G.y+G.uy*r*Math.cos(th)-Hc-r*Math.sin(th)]}
function palAround(c,e){const G=palGeo();if(!G)return;const{x,y,ux,uy,R}=G,Hc=R+3,hub=[x,y-Hc],nx=-uy,ny=ux,ring=(f,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();for(let i=0;i<=48;i++){const[px,py]=palPt(i/48*6.283,f);i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke()};
 c.fillStyle='rgba(30,40,60,.18)';c.beginPath();c.ellipse(x+5,y+1.5,R*.85,3,Math.atan2(uy,ux),0,7);c.fill(); /* its shadow on the water */
 c.strokeStyle='#d9d4ca';c.lineWidth=1.6;c.beginPath();for(const s of[-1,1])for(const a of[-1,1]){c.moveTo(x+nx*s*6+ux*a*7,y+ny*s*6+uy*a*7);c.lineTo(hub[0]+nx*s*1.5,hub[1]+ny*s*1.5)}c.stroke(); /* the A-frame legs, one each side of the wheel */
 c.lineWidth=.4;c.strokeStyle='#f4efe6';c.beginPath();for(let i=0;i<32;i++){const[px,py]=palPt(i/32*6.283);c.moveTo(hub[0],hub[1]);c.lineTo(px,py)}c.stroke();
 ring(1,'#d8423a',1.4);ring(.78,'#f6c03a',.6);ring(.5,'#3f7fc0',.6);
 const C=['#d8423a','#3f7fc0','#f0b030','#2f9a8a','#7b4fc0','#e86aa0'];for(let i=0;i<24;i++){const[gx,gy]=palPt(i/24*6.283,.94),fw=1.7*Math.max(.45,Math.abs(ux));c.strokeStyle='#888';c.lineWidth=.2;c.beginPath();c.moveTo(gx,gy);c.lineTo(gx,gy+.8);c.stroke();c.fillStyle=C[i%C.length];c.beginPath();c.roundRect(gx-fw,gy+.8,fw*2,2.6,.8);c.fill();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(gx-fw*.65,gy+1.2,fw*1.3,.8)} /* gondolas hang level */
 c.fillStyle='#f6c03a';c.beginPath();for(let i=0;i<24;i++){const[px,py]=palPt(i/24*6.283,i%2?.16:.27);c.lineTo(px,py)}c.closePath();c.fill();c.fillStyle='#e86a2a';c.beginPath();for(let i=0;i<16;i++){const[px,py]=palPt(i/16*6.283,.11);c.lineTo(px,py)}c.closePath();c.fill(); /* the sunburst at the hub, in the wheel's plane */
 if(e){e.strokeStyle='rgba(255,220,150,.75)';e.lineWidth=.8;for(const f of[1,.78,.5]){e.beginPath();for(let i=0;i<=48;i++){const[px,py]=palPt(i/48*6.283,f);i?e.lineTo(px,py):e.moveTo(px,py)}e.stroke()}}}
/* a roller coaster's track on its supports: two rails at height h, a post every few units down to the ground */
function coasterTrack(c,e,p,h,rail,post){c.strokeStyle=post;c.lineWidth=.6;c.beginPath();let acc=0;for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);acc+=d;if(acc>3.2){acc=0;c.moveTo(p[i][0],p[i][1]);c.lineTo(p[i][0],p[i][1]-h)}}c.stroke();
 c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=1.4;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x+1,y+.6):c.moveTo(x+1,y+.6));c.stroke(); /* its shadow */
 c.strokeStyle=rail;c.lineWidth=1.5;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y-h):c.moveTo(x,y-h));c.stroke();c.strokeStyle=tone(rail,-.25);c.lineWidth=.3;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y-h+.5):c.moveTo(x,y-h+.5));c.stroke();
 if(e){e.strokeStyle='rgba(255,230,180,.35)';e.lineWidth=.5;e.beginPath();p.forEach(([x,y],i)=>i?e.lineTo(x,y-h):e.moveTo(x,y-h));e.stroke()}}
/* per building: a draw function (or a list of {y, f} to paint at different depths) for the landmarks, false to leave it
   out (it is part of another drawing), null for the usual painting */
let DLHM=undefined;
function dlMansionHouse(){if(DLHM!==undefined)return DLHM;DLHM=null;const hm=OSM.buildings.find(q=>q.n==='The Haunted Mansion');if(!hm)return null;const hb=bbox(hm.p);let best=0;
 for(const q of OSM.buildings){if(q.n||q===hm)continue;const b=bbox(q.p),cx_=(b[0]+b[2])/2,cy_=(b[1]+b[3])/2,a=(b[2]-b[0])*(b[3]-b[1]);if(a>1500||a<120||cx_<hb[0]-8||cx_>hb[2]+8||cy_<hb[1]-12||cy_>hb[3]+8||ptIn(cx_,cy_,hm.p))continue;if(a>best){best=a;DLHM=q}}
 return DLHM} /* the house: the biggest unnamed outline beside the show building, outside it */
/* the Cadillac Range's rockwork is in the map as two big unnamed 28 m outlines in Cars Land */
const dlIsRange=q=>!q.n&&q.h>=20&&OSM.lands.cl&&q.p.length>2&&(()=>{const b=bbox(q.p);return(b[2]-b[0])*(b[3]-b[1])>2000&&ptIn((b[0]+b[2])/2,(b[1]+b[3])/2,OSM.lands.cl)})();
function dlBuilding(q,bb,land,hh,hs){const n=q.n||'',area=(bb[2]-bb[0])*(bb[3]-bb[1]),cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2,k=q.h?hh/q.h:OSM.S,
  /* façades standing on or against it (any corner inside its outline or within 1.5 units of its wall) */
  edgeD=(x,y)=>{let m=1e9;const P=q.p;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/L2));m=Math.min(m,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t))}return m},
  inner=()=>OSM.buildings.filter(b=>{if(b===q||b.p.length<3||(b.n&&AT.some(t=>t.osm===b.n)))return false;const v=bbox(b.p);if(v[2]<bb[0]||v[0]>bb[2]||v[3]<bb[1]||v[1]>bb[3]||(v[2]-v[0])*(v[3]-v[1])<60)return false;return b.p.some(([x,y])=>ptIn(x,y,q.p)||edgeD(x,y)<1.5)}).map(b=>[b.p,b.h*k]),
  show=f=>{const I=inner(),h0=Math.min(hh,9*OSM.S);q._dh=I.length?Math.min(16*OSM.S,Math.max(h0,...I.map(b=>b[1]))):h0;return[{y:bb[3],f:(c,e)=>f(c,e,I)}]}; /* _dh: the height drawn, for what it hides (render.js occ) */
 if(land==='cl'){const f=dlCarsLand(q,bb,hh);if(f)return f}
 {const sm=OSM.places.spacemtn;if(sm&&!n&&ptIn(sm[0],sm[1],q.p)){q._dh=Math.min(hh,9*OSM.S);return[{y:bb[1],f:(c,e)=>dlShowBox(c,e,q.p,hh,hs)},{y:sm[1]+sm[2]*.95,f:(c,e)=>spaceDome(c,e,sm[0],sm[1],sm[2])}]}} /* Space Mountain: its white cone (a building part in the data) on the low base building round it */
 if(n==='Millennium Falcon')return false; /* drawn as the ship (falcon(), map-art.js) */
 if(n==='Grizzly Peak'&&OSM.places.grizzlypk)return false;
 if(n==='Big Thunder Mountain Show Building')return false; /* inside the rocks */
 if(dlIsRange(q))return false; /* the Cadillac Range's rockwork outlines: painted as the range (dlLandmarks) */
 if(q===dlMansionHouse()){q._dh=12*OSM.S+4}if(q===dlMansionHouse())return(c,e)=>hauntedMansion(c,e,q,bb,hs);
 if(n==='"it\'s a small world"')q._dh=Math.min(hh,9*OSM.S);
 if(n==='"it\'s a small world"')return[{y:bb[1],f:(c,e)=>dlShowBox(c,e,q.p,hh,hs)},{y:bb[3],f:(c,e)=>smallWorld(c,e,q,bb,hs)}];
 if(/^Guardians of the Galaxy/.test(n))q._dh=Math.max(hh,40*OSM.S);
 if(/^Guardians of the Galaxy/.test(n))return(c,e)=>guardiansFortress(c,e,q,bb,hh);
 if(n==='Carthay Circle Restaurant')return(c,e)=>carthay(c,e,q,bb,hh);
 if(/^Disney's Grand Californian Hotel/.test(n))return(c,e)=>grandCal(c,e,q,hh);
 const ride=n&&(AT.some(t=>t.osm===n)||/show building|warehouse|receiving|costuming|building \w$|offices|parade building|diorama/i.test(n)||/^(warehouse|industrial|commercial)$/.test(q.k||''));
 if(!q.c&&area>1500&&ride&&q.k!=='hotel'&&q.k!=='parking'&&land!=='ms'&&land!=='bv'&&dlInPark(cx_,cy_))return show((c,e,I)=>dlShowBox(c,e,q.p,hh,hs,I)); /* the big ride and backstage buildings behind the façades (unnamed big outlines are façade blocks, like the French Quarter's) */
 return null}
/* the landmarks that aren't one building: rock spires, mountains, the Pal-A-Round and the coaster tracks */
function dlLandmarks(c,e,B,vis,S2){B.c=c;const P=OSM.places;
 /* Big Thunder Mountain: red spires round its peak, tallest in the middle, spread over the coaster's own ground */
 const bt=(OSM.coasters||[]).filter(k=>k[0]==='Big Thunder Mountain').flatMap(k=>k[2]);
 if(P.btmpeak){const ctr=P.btmpeak,bbx=bt.length?bbox(bt):[ctr[0]-35,ctr[1]-45,ctr[0]+35,ctr[1]+45],r=seeded(1979),pts=[];
  for(let i=0;i<34;i++){const x=bbx[0]+r()*(bbx[2]-bbx[0]),y=bbx[1]+r()*(bbx[3]-bbx[1]),d=Math.hypot((x-ctr[0])/((bbx[2]-bbx[0])/2+1),(y-ctr[1])/((bbx[3]-bbx[1])/2+1));if(d>1.1)continue;pts.push([x,y,(10+26*Math.max(0,1-d))*(.7+r()*.5),4+r()*5])}
  pts.push([ctr[0],ctr[1]+6,40,9]);pts.sort((a,b)=>a[1]-b[1]);
  for(const k of(OSM.coasters||[]))if(k[0]==='Big Thunder Mountain'&&!k[1]){const p=k[2],yb=Math.max(...p.map(v=>v[1]));if(vis(bbox(p)))B.push({y:yb-6,f:()=>coasterTrack(c,e,p,1.6,'#6b4a35','#5a3f2c')})}
  dlSpires(B,vis,pts,['#c8663c','#e08a58','#9a4528'],true,7)}
 /* Galaxy's Edge: Batuu's petrified spires, standing in the open ground between its buildings */
 if(OSM.lands.gx){const L=OSM.lands.gx,lb=bbox(L),r=seeded(77),pts=[],free=(x,y)=>ptIn(x,y,L)&&!(typeof PAVE==='function'&&PAVE(x,y))&&!OSM.buildings.some(q=>{const b=bbox(q.p);return x>b[0]-3&&x<b[2]+3&&y>b[1]-3&&y<b[3]+3&&ptIn(x,y,q.p)});
  for(let i=0;i<400&&pts.length<26;i++){const x=lb[0]+r()*(lb[2]-lb[0]),y=lb[1]+r()*(lb[3]-lb[1]);if(!free(x,y)||pts.some(p=>Math.hypot(p[0]-x,p[1]-y)<14))continue;pts.push([x,y,16+r()*22,2.5+r()*3])}
  pts.sort((a,b)=>a[1]-b[1]);dlSpires(B,vis,pts,['#c9b28e','#e0cdaa','#a08a68'],false,9)}
 if(P.grizzlypk&&vis([P.grizzlypk[0]-40,P.grizzlypk[1]-70,P.grizzlypk[0]+40,P.grizzlypk[1]+30])){const[x,y]=P.grizzlypk;B.push({y:y+26,f:()=>grizzly(c,x,y+26,44)})}
 /* the Cadillac Range: tail-fin buttes filling its two rockwork outlines, tallest round the named peak */
 {const r=seeded(2006),pk=P.cadillac,fins=[];for(const q of OSM.buildings){if(!dlIsRange(q))continue;const b=bbox(q.p);
   for(let y=b[1]+6;y<=b[3];y+=11)for(let x=b[0]+5+((y/11|0)%2)*6;x<=b[2];x+=13){const fx=x+(r()-.5)*5,fy=y+(r()-.5)*4;if(!ptIn(fx,fy,q.p))continue;const d=pk?Math.hypot(fx-pk[0],fy-pk[1]):60;fins.push([fx,fy,(26+30*Math.exp(-d/55))*(.8+r()*.4),8+r()*5])}}
  fins.sort((a,b)=>a[1]-b[1]);for(const[fx,fy,h,w]of fins)if(vis([fx-w,fy-h,fx+w,fy+2]))B.push({y:fy,f:()=>cadillac(c,fx,fy,h,w,r)})}
 {const G=palGeo();if(G&&vis([G.x-G.R-4,G.y-G.R*2-6,G.x+G.R+4,G.y+G.R]))B.push({y:G.y+Math.abs(G.uy)*G.R,f:()=>palAround(c,e)})}
 /* the other open-air coaster tracks: the Incredicoaster high over Pixar Pier on white supports, the small ones low */
 const inB=(x,y)=>OSM.buildings.some(q=>{const b=bbox(q.p);return x>b[0]&&x<b[2]&&y>b[1]&&y<b[3]&&ptIn(x,y,q.p)});
 for(const k of(OSM.coasters||[])){if(k[0]==='Big Thunder Mountain'||k[1])continue;const p=k[2],m=p[p.length>>1];if(inB(m[0],m[1]))continue;const pier=OSM.lands.pp&&ptIn(m[0],m[1],OSM.lands.pp);
  if(OSM.lands.fan&&ptIn(m[0],m[1],OSM.lands.fan))continue; /* the Matterhorn's track runs inside the mountain */
  const yb=Math.max(...p.map(v=>v[1])),h=pier?11:3;if(vis(bbox(p)))B.push({y:yb,f:()=>coasterTrack(c,e,p,h,pier?'#f2f0ea':'#e6b33a',pier?'#e4e1da':'#c9c2b0')})}}
/* The Disneyland Monorail runs THROUGH the Grand Californian (a portal in the hotel), not over it. The beams are painted after
   the buildings, so along the beam the hotel is painted again on top, in a narrow corridor round the track: the beam vanishes
   into its wall and comes out the other side. dlInGCH(x,y) tells render.js when a train car is inside or behind it. */
const dlGCH=()=>OSM.buildings.find(q=>/^Disney's Grand Californian Hotel/.test(q.n||''));
let DLG=null;function dlGCHGeo(){if(DLG!==null)return DLG;const q=dlGCH();DLG=q?{q,b:bbox(q.p),h:(q.h||30)*OSM.S*.78}:false;return DLG}
function dlInGCH(x,y){const G=dlGCHGeo();if(!G||x<G.b[0]||x>G.b[2]||y<G.b[1]-G.h||y>G.b[3])return false;for(let s=0;s<=G.h;s+=1.5)if(ptIn(x,y+s,G.q.p))return true;return false}
function dlMonoThrough(c,e,vis){const G=dlGCHGeo();if(!G||!vis([G.b[0],G.b[1]-G.h,G.b[2],G.b[3]]))return;const W=5;c.save();c.beginPath();let any=false;
 for(const p of OSM.monoLines)for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];if(Math.max(a[0],b[0])<G.b[0]-5||Math.min(a[0],b[0])>G.b[2]+5||Math.max(a[1],b[1])<G.b[1]-G.h-5||Math.min(a[1],b[1])>G.b[3]+5)continue;
  const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L*W,uy=dy/L*W,nx=-uy,ny=ux,A=[a[0]-ux,a[1]-uy],B2=[b[0]+ux,b[1]+uy]; /* each piece a rectangle, all wound the same way so they add up, overlapping at the joints */
  c.moveTo(A[0]+nx,A[1]+ny);c.lineTo(B2[0]+nx,B2[1]+ny);c.lineTo(B2[0]-nx,B2[1]-ny);c.lineTo(A[0]-nx,A[1]-ny);c.closePath();any=true}
 if(any){c.clip('nonzero');grandCal(c,null,G.q,G.h)}c.restore()}
/* ===== CARS LAND: Radiator Springs, drawn after its real buildings =====
   Route 66 desert storefronts in sun-faded pastels with flat parapet roofs; the Cozy Cone Motel's five big orange cones;
   Flo's V8 Café (white and turquoise, chrome bands, its tall round sign at the corner toward the street); Ramone's art-deco
   tower in purple; Luigi's in the Italian colours with the Leaning Tower of Tires beside it; Fillmore's geodesic dome;
   Sarge's army Quonset hut (laid along its outline's long axis); the brick Firehouse & Courthouse with white columns and
   its clock cupola; and the red rock buttes (Willy's Butte, the Radiator Cap). Shapes follow each outline's real angle. */
if(typeof DL!=='undefined'&&DL)LANDSTYLE.cl=[['#e9c9a1','#cfe3d8','#f0d3c8','#e8dcb8','#bcd7e0','#e7b8a0'],['#c9b08a','#b98a5a','#a8603a','#c2a77e']];
const CL_CONES=/^(Churros|Chillie-Cone-Carne|Ice Cream Cone|Cone-Cactions|Pop-Cone)$/;
const dlIsCone=q=>CL_CONES.test(q.n||'');
function dlConeGeo(q){const b=bbox(q.p),r=Math.max(3,Math.min(b[2]-b[0],b[3]-b[1])*.72);return{x:(b[0]+b[2])/2,y:(b[1]+b[3])/2+r*.3,r,H:Math.max(13*OSM.S,r*2.7)}}
function coneArt(c,e,q){const{x,y,r,H}=dlConeGeo(q);c.fillStyle='rgba(30,30,20,.25)';c.beginPath();c.ellipse(x+H*.25,y+.6,r*1.1,r*.4,0,0,7);c.fill();
 const g=c.createLinearGradient(x-r,0,x+r,0);g.addColorStop(0,'#ffa25a');g.addColorStop(.45,'#f0802e');g.addColorStop(1,'#b8561c');c.fillStyle=g;c.beginPath();c.moveTo(x-r,y);c.lineTo(x,y-H);c.lineTo(x+r,y);c.ellipse(x,y,r,r*.4,0,0,Math.PI);c.closePath();c.fill();
 for(const[f0,f1]of[[.3,.4],[.58,.66]]){const w0=r*(1-f0),w1=r*(1-f1);poly4(c,[[x-w0,y-H*f0],[x+w0,y-H*f0],[x+w1,y-H*f1],[x-w1,y-H*f1]],'rgba(255,248,235,.95)')} /* the white bands */
 poly4(c,[[x-r*.12,y-H*.88],[x+r*.12,y-H*.88],[x,y-H-1]],'#d84a2a');c.fillStyle='#3a2a22';c.fillRect(x-r*.22,y-r*.15-2.6,r*.44,2.6); /* the tip, the door */
 if(e){e.fillStyle='rgba(255,210,140,.7)';e.fillRect(x-r*.22,y-r*.15-2.6,r*.44,2.6)}}
function pAxis(P){const n=P.length,mx=P.reduce((s,p)=>s+p[0],0)/n,my=P.reduce((s,p)=>s+p[1],0)/n;let a=0,b=0,d=0;for(const p of P){a+=(p[0]-mx)**2;b+=(p[1]-my)**2;d+=(p[0]-mx)*(p[1]-my)}const an=.5*Math.atan2(2*d,a-b);
 const ux=Math.cos(an),uy=Math.sin(an);let l0=1e9,l1=-1e9,w=0;for(const p of P){const t=(p[0]-mx)*ux+(p[1]-my)*uy,s=Math.abs(-(p[0]-mx)*uy+(p[1]-my)*ux);l0=Math.min(l0,t);l1=Math.max(l1,t);w=Math.max(w,s)}return{mx,my,ux,uy,l0,l1,w}}
/* Sarge's Quonset hut: a half-cylinder of corrugated army-green steel along the outline's long axis */
function quonset(c,e,q){const A=pAxis(q.p),R=A.w,N=14,sl=[];for(let i=0;i<=N;i++){const t=A.l0+(A.l1-A.l0)*i/N;sl.push([A.mx+A.ux*t,A.my+A.uy*t,i])}sl.sort((p,q2)=>p[1]-q2[1]);
 const arch=(x,y)=>{const pts=[];for(let k=0;k<=12;k++){const f=Math.PI*k/12;pts.push([x+(-A.uy)*R*Math.cos(f),y+A.ux*R*Math.cos(f)-R*Math.sin(f)])}return pts};
 for(const[x,y,i]of sl){const pts=arch(x,y);c.fillStyle=i===0||i===N?'#5d6640':'#6f7a4a';c.beginPath();pts.forEach(([a,b],k)=>k?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();c.strokeStyle='rgba(40,45,25,.5)';c.lineWidth=.25;c.beginPath();pts.forEach(([a,b],k)=>k?c.lineTo(a,b):c.moveTo(a,b));c.stroke()}
 const top=[A.mx+A.ux*A.l0,A.my+A.uy*A.l0-R],top2=[A.mx+A.ux*A.l1,A.my+A.uy*A.l1-R];c.strokeStyle='rgba(220,230,190,.5)';c.lineWidth=.6;c.beginPath();c.moveTo(...top);c.lineTo(...top2);c.stroke()}
/* Fillmore's: a geodesic dome in green, painted with sixties colours */
function geoDome(c,e,q){const b=bbox(q.p),x=(b[0]+b[2])/2,y=(b[1]+b[3])/2+2,r=Math.min(b[2]-b[0],b[3]-b[1])*.55;const g=c.createRadialGradient(x-r*.4,y-r*.7,1,x,y-r*.4,r*1.2);g.addColorStop(0,'#c8e88a');g.addColorStop(1,'#4f8a3a');
 c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*.4,0,0,Math.PI);c.ellipse(x,y,r,r,0,Math.PI,0);c.fill();c.save();c.beginPath();c.ellipse(x,y,r,r,0,Math.PI,0);c.clip();c.strokeStyle='rgba(255,255,230,.6)';c.lineWidth=.25;
 for(let i=1;i<4;i++){c.beginPath();c.ellipse(x,y,r,r*i/4,0,Math.PI,0);c.stroke()}for(let i=1;i<6;i++){c.beginPath();c.ellipse(x,y,r*Math.abs(Math.cos(i*Math.PI/6)),r,0,Math.PI,0);c.stroke()}
 c.fillStyle='rgba(240,120,180,.6)';c.beginPath();c.ellipse(x-r*.3,y-r*.5,r*.18,r*.12,0,0,7);c.fill();c.fillStyle='rgba(250,210,70,.6)';c.beginPath();c.ellipse(x+r*.35,y-r*.35,r*.15,r*.1,0,0,7);c.fill();c.restore()}
/* Luigi's Leaning Tower of Tires: black tyres stacked up and leaning */
function tireTower(c,e,q){const b=bbox(q.p),x=(b[0]+b[2])/2,y=(b[1]+b[3])/2+1,n=11,s=1.15;for(let i=0;i<n;i++){const xx=x+i*i*.022,yy=y-i*s*1.05;c.fillStyle='#2a2a2c';c.beginPath();c.ellipse(xx,yy,2.2,1,0,0,7);c.fill();c.fillStyle='#4a4a4e';c.fillRect(xx-2.2,yy-s,4.4,s);c.fillStyle='#2a2a2c';c.beginPath();c.ellipse(xx,yy-s,2.2,1,0,0,7);c.fill();c.fillStyle='#777';c.beginPath();c.ellipse(xx,yy-s,1,.45,0,0,7);c.fill()}}
/* Flo's V8 Café: white and turquoise, chrome bands, and its tall round sign at the corner toward the middle of the street */
function flos(c,e,q,bb,hh){extrude(c,e,q.p,hh,'#eef5f3','#55b4ab',{win:'#7fd4e0',ridge:false,deco:(c,p,q2,L,h)=>{for(const[f,col,w]of[[.18,'#3fa59c',.9],[.82,'#c9d3d6',.5],[.94,'#3fa59c',.7]]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(p[0],p[1]-h*f);c.lineTo(q2[0],q2[1]-h*f);c.stroke()}}});
 const ctr=CLN&&clBuildings().length?CLN.ctr:[(bb[0]+bb[2])/2,bb[3]];let sp=q.p[0],bd=1e9;for(const p of q.p){const d=Math.hypot(p[0]-ctr[0],p[1]-ctr[1]);if(d<bd){bd=d;sp=p}}
 const[sx,sy]=sp,H=hh+16;c.fillStyle='#e8eef0';c.fillRect(sx-.6,sy-H,1.2,H);c.fillStyle='#d8433a';c.beginPath();c.arc(sx,sy-H,3.4,0,7);c.fill();c.fillStyle='#fff6e0';c.beginPath();c.arc(sx,sy-H,2.6,0,7);c.fill();
 c.fillStyle='#d8433a';c.font='bold 2.6px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('V8',sx,sy-H+.1);
 if(e){e.strokeStyle='rgba(255,90,80,.9)';e.lineWidth=.6;e.beginPath();e.arc(sx,sy-H,3.4,0,7);e.stroke()}}
/* Ramone's House of Body Art: purple art deco with gold fins, and its stepped tower */
function ramones(c,e,q,bb,hh){extrude(c,e,q.p,hh,'#b98ad0','#7a4f9a',{ridge:false,noWin:true,deco:(c,p,q2,L,h)=>{c.strokeStyle='#e8c25a';c.lineWidth=.45;const n=Math.max(2,Math.floor(L/2.5));c.beginPath();for(let i=1;i<n;i++){const t=i/n,x=p[0]+(q2[0]-p[0])*t,y=p[1]+(q2[1]-p[1])*t;c.moveTo(x,y-h*.15);c.lineTo(x,y-h)}c.stroke()}});
 const x=(bb[0]+bb[2])/2,y=(bb[1]+bb[3])/2+2;let h=hh;for(const[w,d,dh,col]of[[5,4,5,'#c99ae0'],[3.6,3,4,'#d6aee8'],[2.2,2,3,'#e2c2f0']]){extrude(c,e,[[x-w,y-d],[x+w,y-d],[x+w,y+d],[x-w,y+d]].map(([a,b2])=>[a,b2-h]),dh,col,'#8a5fae',{ridge:false,noWin:true});h+=dh}
 c.strokeStyle='#e8c25a';c.lineWidth=.4;c.beginPath();c.moveTo(x,y-h);c.lineTo(x,y-h-4);c.stroke()}
/* Luigi's Casa Della Tires: cream walls in Italian green, white and red bands, a green roof */
function luigis(c,e,q,hh){extrude(c,e,q.p,hh,'#f4efe2','#3f8a4a',{ridge:false,deco:(c,p,q2,L,h)=>{for(const[f,col]of[[.92,'#3f8a4a'],[.84,'#f4efe2'],[.76,'#c8402f']]){c.strokeStyle=col;c.lineWidth=.8;c.beginPath();c.moveTo(p[0],p[1]-h*f);c.lineTo(q2[0],q2[1]-h*f);c.stroke()}}})}
/* the Firehouse & Courthouse: red brick, white columns, a white clock cupola */
function courthouse(c,e,q,bb,hh){const H=Math.max(hh,9*OSM.S);extrude(c,e,q.p,H,'#b86a4a','#6a3a2a',{ridge:false,win:'#2f3a44',deco:(c,p,q2,L,h)=>{const n=Math.max(1,Math.round(L/2.6));for(let i=0;i<=n;i++){const t=i/n,x=p[0]+(q2[0]-p[0])*t,y=p[1]+(q2[1]-p[1])*t;c.fillStyle='#f4efe4';c.fillRect(x-.35,y-h*.75,.7,h*.75)}c.fillStyle='#f4efe4';c.beginPath();c.moveTo(p[0],p[1]-h*.75);c.lineTo(q2[0],q2[1]-h*.75);c.lineTo(q2[0],q2[1]-h*.8);c.lineTo(p[0],p[1]-h*.8);c.fill()}});
 const x=(bb[0]+bb[2])/2,y=(bb[1]+bb[3])/2;poly4(c,[[x-2,y-H],[x+2,y-H],[x+2,y-H-5],[x-2,y-H-5]],'#f4efe4');poly4(c,[[x-2.4,y-H-5],[x+2.4,y-H-5],[x,y-H-8.5]],'#6a3a2a');c.fillStyle='#fff';c.beginPath();c.arc(x,y-H-3,1.2,0,7);c.fill();c.strokeStyle='#333';c.lineWidth=.2;c.stroke()}
/* a red rock butte on its outline: flat top, banded sides */
function butte(c,e,q,hh){const H=Math.max(hh,14*OSM.S);extrude(c,null,q.p,H,'#c8643a','#d98050',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='rgba(240,200,150,.35)';c.lineWidth=.5;for(let f=.2;f<1;f+=.2){c.beginPath();c.moveTo(p[0],p[1]-h*f);c.lineTo(q2[0],q2[1]-h*f);c.stroke()}}})}
function dlCarsLand(q,bb,hh){const n=q.n||'';
 if(dlIsCone(q)){q._dh=dlConeGeo(q).H;return(c,e)=>coneArt(c,e,q)}
 if(n==="Sarge's Surplus Hut")return(c,e)=>quonset(c,e,q);
 if(n==="Fillmore's Taste-in")return(c,e)=>geoDome(c,e,q);
 if(n==="Luigi's Leaning Tower of Tires"){q._dh=13}if(n==="Luigi's Leaning Tower of Tires")return(c,e)=>tireTower(c,e,q);
 if(n==="Flo's V8 Café")return(c,e)=>flos(c,e,q,bb,hh);
 if(n==="Ramone's House of Body Art")return(c,e)=>ramones(c,e,q,bb,hh);
 if(n==="Luigi's Casa Della Tires")return(c,e)=>luigis(c,e,q,hh);
 if(n==='Radiator Springs Firehouse & Courthouse')return(c,e)=>courthouse(c,e,q,bb,hh);
 if(n==="Willy's Butte"||n==='Radiator Cap')return(c,e)=>butte(c,e,q,hh);
 return null}
