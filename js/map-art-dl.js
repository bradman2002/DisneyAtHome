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
/* a show building: plain greige walls, a flat roof with a few rooftop units, no windows */
function dlShowBox(c,e,poly,hh,hs){const W_=['#d8d1c4','#d0c9bc','#dcd5c8'],R_=['#c9c3b8','#c2bcb0','#cec8bd'];extrude(c,null,poly,Math.min(hh,12*OSM.S),W_[hs%3],R_[(hs>>>3)%3],{noWin:true,ridge:false});
 const bb=bbox(poly),h=Math.min(hh,12*OSM.S),r=seeded(hs);c.fillStyle='rgba(120,115,105,.45)';for(let i=0;i<Math.min(9,(bb[2]-bb[0])*(bb[3]-bb[1])/500);i++){const x=bb[0]+4+r()*(bb[2]-bb[0]-8),y=bb[1]+4+r()*(bb[3]-bb[1]-8);if(ptIn(x,y,poly))c.fillRect(x-1.2,y-h-.9,2.4,1.6)}}
/* The Haunted Mansion: the show building behind, and in front the white antebellum mansion: two storeys, a row of
   tall columns along its porch, green-shuttered windows, a dark slate roof with a cupola on top */
function hauntedMansion(c,e,q,bb,hh,hs){dlShowBox(c,e,q.p,hh*.8,hs);
 const w=Math.min(34,(bb[2]-bb[0])*.38),x1=bb[2]-3,x0=x1-w,y=bb[1]+16,d=10,H=11,col='#f2eee6';
 c.fillStyle='rgba(30,40,30,.25)';c.fillRect(x0+2,y+.5,w,2.4);
 poly4(c,[[x0,y-d],[x1,y-d],[x1,y-d-H],[x0,y-d-H]],tone(col,-.1)); /* back wall top band (seen over the roof) */
 poly4(c,[[x0,y],[x1,y],[x1,y-H],[x0,y-H]],col); /* the front */
 for(let f=0;f<2;f++)for(let i=0;i<6;i++){const wx=x0+3+i*(w-6)/5,wy=y-H*(.28+f*.42);c.fillStyle='#2f3a33';c.fillRect(wx-1,wy-1.6,2,3);c.fillStyle='#3f5a46';c.fillRect(wx-1.8,wy-1.6,.7,3);c.fillRect(wx+1.1,wy-1.6,.7,3)}
 c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x0+1,y-H*.5,w-2,.6); /* the gallery floor */
 for(let i=0;i<=7;i++){const cx_=x0+1.2+i*(w-2.4)/7;c.fillStyle='#ffffff';c.fillRect(cx_-.55,y-H+.6,1.1,H-.6);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(cx_+.25,y-H+.6,.3,H-.6)}
 poly4(c,[[x0-1.2,y-H],[x1+1.2,y-H],[x1-2,y-H-6],[x0+2,y-H-6]],'#4d5560');poly4(c,[[x0+2,y-H-6],[x1-2,y-H-6],[x1-4,y-H-d-4],[x0+4,y-H-d-4]],'#5d6670'); /* slate roof */
 c.fillStyle='#ffffff';c.fillRect(x0-1.2,y-H-.6,w+2.4,.8);
 const mx=(x0+x1)/2;poly4(c,[[mx-3,y-H-7],[mx+3,y-H-7],[mx+3,y-H-12],[mx-3,y-H-12]],col);poly4(c,[[mx-3.6,y-H-12],[mx+3.6,y-H-12],[mx,y-H-16]],'#4d5560');c.fillStyle='#2f3a33';c.fillRect(mx-1,y-H-11,2,2.4); /* cupola */
 c.strokeStyle='#2b2b2b';c.lineWidth=.3;c.beginPath();c.moveTo(mx,y-H-16);c.lineTo(mx,y-H-19);c.stroke(); /* weathervane */
 if(e){e.fillStyle='rgba(180,255,190,.35)';for(let i=0;i<6;i++){const wx=x0+3+i*(w-6)/5;if(hsh(i*7+hs)%3===0)e.fillRect(wx-1,y-H*.7-1.6,2,3)}}} /* a few windows glow green at night */
/* "it's a small world": the show building behind, and along its front the white façade of stylised towers (cones,
   onion domes, spires) trimmed in gold, with the tall clock tower in the middle */
function smallWorld(c,e,q,bb,hh,hs){dlShowBox(c,e,q.p,hh,hs);
 const y=bb[3]-1,x0=bb[0]+(bb[2]-bb[0])*.08,x1=bb[2]-(bb[2]-bb[0])*.08,w=x1-x0,mx=(x0+x1)/2,gold='#d9b04a',white='#f7f4ee';
 c.fillStyle='rgba(30,40,30,.22)';c.fillRect(x0+2,y,w,2.2);
 poly4(c,[[x0,y],[x1,y],[x1,y-7],[x0,y-7]],white);c.fillStyle=gold;c.fillRect(x0,y-7,w,.7);c.fillRect(x0,y-3.2,w,.35);
 const n=11;for(let i=0;i<n;i++){const tx=x0+(i+.5)*w/n,tw=w/n*.42,th=8+((i*7)%4)*3.2+(Math.abs(i-(n-1)/2)<1.5?0:0),k=i%4;
  poly4(c,[[tx-tw,y-7],[tx+tw,y-7],[tx+tw,y-7-th],[tx-tw,y-7-th]],i%2?white:'#f1ece2');c.fillStyle=gold;c.fillRect(tx-tw,y-7-th,tw*2,.5);
  const top=y-7-th;if(k===0)poly4(c,[[tx-tw*1.1,top],[tx+tw*1.1,top],[tx,top-tw*3]],gold);
  else if(k===1){c.fillStyle=gold;c.beginPath();c.moveTo(tx-tw,top);c.quadraticCurveTo(tx-tw*1.3,top-tw*1.4,tx,top-tw*2.6);c.quadraticCurveTo(tx+tw*1.3,top-tw*1.4,tx+tw,top);c.fill()}
  else if(k===2){poly4(c,[[tx-tw,top],[tx+tw,top],[tx+tw*.4,top-tw*1.2],[tx-tw*.4,top-tw*1.2]],white);poly4(c,[[tx-tw*.4,top-tw*1.2],[tx+tw*.4,top-tw*1.2],[tx,top-tw*3.4]],gold)}
  else{c.fillStyle=white;c.beginPath();c.arc(tx,top,tw,Math.PI,0);c.fill();c.fillStyle=gold;c.fillRect(tx-.2,top-tw-2,.4,2)}
  c.fillStyle=['#e88aa8','#7fb8e0','#9ad08a','#f0c860'][i%4];c.beginPath();c.arc(tx,y-7-th*.55,Math.min(1.1,tw*.5),0,7);c.fill()}
 /* the clock tower */
 const cw=w*.07,ch=26;poly4(c,[[mx-cw,y-7],[mx+cw,y-7],[mx+cw,y-7-ch],[mx-cw,y-7-ch]],white);c.fillStyle=gold;c.fillRect(mx-cw,y-7-ch,cw*2,.7);
 poly4(c,[[mx-cw*1.15,y-7-ch],[mx+cw*1.15,y-7-ch],[mx,y-7-ch-cw*3.2]],gold);c.fillStyle='#ffffff';c.beginPath();c.arc(mx,y-7-ch*.62,cw*.72,0,7);c.fill();c.strokeStyle=gold;c.lineWidth=.4;c.stroke();
 c.strokeStyle='#2c4a8a';c.lineWidth=.3;c.beginPath();c.moveTo(mx,y-7-ch*.62);c.lineTo(mx,y-7-ch*.62-cw*.55);c.moveTo(mx,y-7-ch*.62);c.lineTo(mx+cw*.4,y-7-ch*.62);c.stroke();
 if(e){e.fillStyle='rgba(255,230,170,.5)';for(let i=0;i<n;i++)e.fillRect(x0+(i+.5)*w/n-.6,y-10,1.2,1.2);e.fillStyle='rgba(255,255,230,.7)';e.beginPath();e.arc(mx,y-7-ch*.62,cw*.72,0,7);e.fill()}}
/* New Orleans Square's French Quarter along the front of a big building (Pirates of the Caribbean, with the Blue Bayou
   inside): a row of pastel two- and three-storey houses with iron balconies and dark mansard roofs, the show building behind */
function frenchQuarter(c,e,q,bb,hh,hs){dlShowBox(c,e,q.p,hh*.9,hs);const r=seeded(hs),W_=LANDSTYLE.nos[0],R_=LANDSTYLE.nos[1];
 for(let x=bb[0]+2;x<bb[2]-4;){const w=6+r()*4;let y=bb[1];while(y<bb[3]&&!ptIn(x+w/2,y,q.p))y+=1;if(y>=bb[3]-10||!ptIn(x+w/2,y+9,q.p)){x+=w;continue}
  const h=(9+r()*5)*OSM.S,poly=[[x,y],[x+w,y],[x+w,y+9],[x,y+9]];extrude(c,e,poly,h,W_[(r()*W_.length)|0],R_[(r()*R_.length)|0],{ridge:false,deco:nosDeco});x+=w+.4}}
/* the Guardians' fortress: a tall dark industrial block with copper ribs and pipes, stepping in near the top */
function guardiansFortress(c,e,q,bb,hh){const H=Math.max(hh,40*OSM.S);extrude(c,e,q.p,H*.72,'#3d4148','#2f3238',{noWin:true,ridge:false,deco:(c,p,q2,L,h)=>{c.strokeStyle='#b07a3a';c.lineWidth=.55;const n=Math.max(2,Math.floor(L/3));c.beginPath();for(let i=1;i<n;i++){const t=i/n,x=p[0]+(q2[0]-p[0])*t,y=p[1]+(q2[1]-p[1])*t;c.moveTo(x,y);c.lineTo(x,y-h)}c.stroke();c.fillStyle='#c9903f';c.beginPath();c.moveTo(p[0],p[1]-h*.62);c.lineTo(q2[0],q2[1]-h*.62);c.lineTo(q2[0],q2[1]-h*.62+.8);c.lineTo(p[0],p[1]-h*.62+.8);c.fill()}});
 const cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2,w=(bb[2]-bb[0])*.28,d=(bb[3]-bb[1])*.25;extrude(c,e,[[cx_-w,cy_-d],[cx_+w,cy_-d],[cx_+w,cy_+d],[cx_-w,cy_+d]].map(([x,y])=>[x,y-H*.72]),H*.28,'#454a52','#33363c',{noWin:true,ridge:false});
 c.strokeStyle='#8a5a2a';c.lineWidth=1;c.beginPath();c.moveTo(cx_+w*.6,cy_+d-H*.72);c.quadraticCurveTo(cx_+w*1.4,cy_+d-H*.5,bb[2]-2,bb[3]-H*.3);c.stroke(); /* a big copper pipe down the side */
 if(e){e.fillStyle='rgba(255,170,90,.55)';e.fillRect(cx_-w,cy_-d-H+1,w*2,.8)}}
/* Carthay Circle Theatre: white Spanish-colonial walls and red tiles, and its tall tower with a gold-topped blue spire */
function carthay(c,e,q,bb,hh){extrude(c,e,q.p,hh,'#f4efe4','#b5583a',{ridge:true});const tx=(bb[0]+bb[2])/2,ty=bb[3]-4,w=3.4,H=hh+20;
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
/* the Pixar Pal-A-Round: a big Ferris wheel on the pier, white rim and spokes, coloured gondolas, a sunburst at its hub */
function palAround(c,e,x,y){const R=12,cy=y-R-3;c.strokeStyle='#e9e4da';c.lineWidth=1;c.beginPath();c.moveTo(x-6,y);c.lineTo(x,cy);c.lineTo(x+6,y);c.stroke();
 c.lineWidth=.35;c.strokeStyle='#f4efe6';for(let i=0;i<24;i++){const a=i/24*6.283;c.beginPath();c.moveTo(x,cy);c.lineTo(x+Math.cos(a)*R,cy+Math.sin(a)*R);c.stroke()}
 c.lineWidth=.9;c.strokeStyle='#d8423a';c.beginPath();c.arc(x,cy,R,0,7);c.stroke();c.lineWidth=.4;c.strokeStyle='#f6c03a';c.beginPath();c.arc(x,cy,R*.72,0,7);c.stroke();
 const G=['#d8423a','#3f7fc0','#f0b030','#2f9a8a','#7b4fc0','#e86aa0'];for(let i=0;i<24;i++){const a=i/24*6.283,gx=x+Math.cos(a)*R,gy=cy+Math.sin(a)*R;c.fillStyle=G[i%G.length];c.fillRect(gx-.9,gy,1.8,1.6)}
 c.fillStyle='#f6c03a';c.beginPath();for(let i=0;i<16;i++){const a=i/16*6.283,rr=i%2?2.2:3.4;c.lineTo(x+Math.cos(a)*rr,cy+Math.sin(a)*rr)}c.closePath();c.fill();
 if(e){e.strokeStyle='rgba(255,220,150,.7)';e.lineWidth=.6;e.beginPath();e.arc(x,cy,R,0,7);e.stroke();e.beginPath();e.arc(x,cy,R*.72,0,7);e.stroke()}}
/* a roller coaster's track on its supports: two rails at height h, a post every few units down to the ground */
function coasterTrack(c,e,p,h,rail,post){c.strokeStyle=post;c.lineWidth=.6;c.beginPath();let acc=0;for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);acc+=d;if(acc>3.2){acc=0;c.moveTo(p[i][0],p[i][1]);c.lineTo(p[i][0],p[i][1]-h)}}c.stroke();
 c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=1.4;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x+1,y+.6):c.moveTo(x+1,y+.6));c.stroke(); /* its shadow */
 c.strokeStyle=rail;c.lineWidth=1.5;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y-h):c.moveTo(x,y-h));c.stroke();c.strokeStyle=tone(rail,-.25);c.lineWidth=.3;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y-h+.5):c.moveTo(x,y-h+.5));c.stroke();
 if(e){e.strokeStyle='rgba(255,230,180,.35)';e.lineWidth=.5;e.beginPath();p.forEach(([x,y],i)=>i?e.lineTo(x,y-h):e.moveTo(x,y-h));e.stroke()}}
/* per building: a draw function for the landmarks, false to leave it out (it is part of another drawing), null otherwise */
function dlBuilding(q,bb,land,hh,hs){const n=q.n||'',area=(bb[2]-bb[0])*(bb[3]-bb[1]),cx_=(bb[0]+bb[2])/2,cy_=(bb[1]+bb[3])/2;
 if(n==='Millennium Falcon')return false; /* drawn as the ship (falcon(), map-art.js) */
 if(n==='Grizzly Peak'&&OSM.places.grizzlypk)return false;
 if(n==='Big Thunder Mountain Show Building')return false; /* inside the rocks */
 if(n==='Radiator Springs Racers'&&OSM.places.cadillac)return false; /* the Cadillac Range stands on it */
 if(n==='Pirates of the Caribbean')return(c,e)=>frenchQuarter(c,e,q,bb,hh,hs);
 if(n==='The Haunted Mansion')return(c,e)=>hauntedMansion(c,e,q,bb,hh,hs);
 if(n==='"it\'s a small world"')return(c,e)=>smallWorld(c,e,q,bb,hh,hs);
 if(/^Guardians of the Galaxy/.test(n))return(c,e)=>guardiansFortress(c,e,q,bb,hh);
 if(n==='Carthay Circle Restaurant')return(c,e)=>carthay(c,e,q,bb,hh);
 if(!q.c&&area>1500&&q.k!=='hotel'&&q.k!=='parking'&&land!=='ms'&&land!=='bv'&&dlInPark(cx_,cy_))return(c,e)=>dlShowBox(c,e,q.p,hh,hs); /* the big show buildings behind the façades */
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
 if(P.cadillac){const[x,y]=P.cadillac,r=seeded(2006),rs=OSM.buildings.find(q=>q.n==='Radiator Springs Racers'),rb=rs?bbox(rs.p):[x-150,y,x,y+70],fins=[];
  /* along the Racers' show building from its west end to the peak, tallest round the peak and in the middle */
  for(let i=0;i<7;i++){const t=i/6,fx=rb[0]+14+(x-rb[0]-14)*t,fy=rb[1]+12+(y-rb[1]-12)*t;fins.push([fx-x,fy-y-14,(30+22*Math.sin(Math.PI*t))*(.85+r()*.3),11+r()*6])} /* a lower row behind */
  for(let i=0;i<9;i++){const t=i/8,fx=rb[0]+8+(x+6-rb[0]-8)*t,fy=rb[3]-6+(y+18-rb[3]+6)*t+(r()-.5)*10;fins.push([fx-x,fy-y-14,(42+30*Math.sin(Math.PI*t*.9+.3))*(.85+r()*.3),13+r()*7])}
  fins.sort((a,b)=>a[1]-b[1]);
  for(const[dx,dy,h,w]of fins){const fx=x+dx,fy=y+dy+14;if(vis([fx-w,fy-h,fx+w,fy+2]))B.push({y:fy,f:()=>cadillac(c,fx,fy,h,w,r)})}}
 if(P.palaround&&vis([P.palaround[0]-15,P.palaround[1]-30,P.palaround[0]+15,P.palaround[1]+2])){const[x,y]=P.palaround;B.push({y:y+1,f:()=>palAround(c,e,x,y)})}
 /* the other open-air coaster tracks: the Incredicoaster high over Pixar Pier on white supports, the small ones low */
 const inB=(x,y)=>OSM.buildings.some(q=>{const b=bbox(q.p);return x>b[0]&&x<b[2]&&y>b[1]&&y<b[3]&&ptIn(x,y,q.p)});
 for(const k of(OSM.coasters||[])){if(k[0]==='Big Thunder Mountain'||k[1])continue;const p=k[2],m=p[p.length>>1];if(inB(m[0],m[1]))continue;const pier=OSM.lands.pp&&ptIn(m[0],m[1],OSM.lands.pp);
  if(OSM.lands.fan&&ptIn(m[0],m[1],OSM.lands.fan))continue; /* the Matterhorn's track runs inside the mountain */
  const yb=Math.max(...p.map(v=>v[1])),h=pier?11:3;if(vis(bbox(p)))B.push({y:yb,f:()=>coasterTrack(c,e,p,h,pier?'#f2f0ea':'#e6b33a',pier?'#e4e1da':'#c9c2b0')})}}
