/* ===== ELECTRICAL WATER PAGEANT =====
   Fourteen barges carrying screens of lights cross Seven Seas Lagoon every night, the way the real pageant does:
   showings off the Polynesian Village at 9:00 PM and the Grand Floridian at 9:15 PM, then through the channel to Bay Lake
   for Wilderness Lodge at 9:35, Fort Wilderness at 9:45 and the Contemporary at 10:10 PM.
   The barges' course is worked out on the real water from OpenStreetMap: the shortest way between the showing spots that
   keeps clear of the shore. The light figures are original sea-creature designs, ending with flags and stars.
   An optional soundtrack, audio/electrical-water-pageant.mp3, plays during each showing when the map is near the barges. */
const EWP_FILE='audio/electrical-water-pageant.mp3';
const EWP={audio:new Audio(),ready:false,name:EWP_FILE,src:'folder',auto:true,on:true,liveKey:null,N:14,GAP:13,len:476, // len: seconds per showing (the soundtrack's length)
 shows:[{k:'poly',n:'Polynesian Village',t:21*3600},{k:'gf',n:'Grand Floridian',t:21*3600+900},{k:'wl',n:'Wilderness Lodge',t:21*3600+35*60},{k:'fw',n:'Fort Wilderness',t:21*3600+45*60},{k:'cont',n:'Contemporary',t:22*3600+600}]};
// a showing lasts the length of the music, or until two minutes before the next one starts (the Wilderness Lodge showing is cut short, as the barges must be at Fort Wilderness ten minutes later)
const ewpEnd=s=>{const i=EWP.shows.indexOf(s),nx=EWP.shows[i+1];return Math.min(s.t+EWP.len,nx?nx.t-150:1e9)};
/* ---------- course: A* over a grid of the real water ---------- */
(function(){if(DL){EWP.legs=null;return} /* Walt Disney World only */const CELL=6,gw=Math.ceil(W/CELL),gh=Math.ceil(H/CELL),k=document.createElement('canvas');k.width=gw;k.height=gh;const c=k.getContext('2d');c.scale(1/CELL,1/CELL);
 const waters=OSM.areas.filter(a=>a.k==='water'),ring=r=>{c.beginPath();r.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
 for(const a of waters)ring(a.o);c.globalCompositeOperation='destination-out';for(const a of waters)for(const r of a.i||[])ring(r); // islands are not water
 for(const a of OSM.areas)if(a.k==='pier'||a.k==='bridge')ring(a.o);for(const q of OSM.buildings)if(q.p.length>2)ring(q.p); // nor are piers, or buildings standing in the water
 const px=c.getImageData(0,0,gw,gh).data,wat=new Uint8Array(gw*gh);for(let i=0;i<gw*gh;i++)wat[i]=px[i*4+3]>128?1:0;
 // distance to land (in cells, up to 6) so the course keeps off the shore where there is room
 const dl=new Uint8Array(gw*gh).fill(7);let q=[];for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)if(!wat[j*gw+i]||i===0||j===0||j===gh-1){dl[j*gw+i]=0;q.push(j*gw+i)}
 for(let d=1;d<=6&&q.length;d++){const n=[];for(const u of q){const i=u%gw,j=(u-i)/gw;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(x<0||y<0||x>=gw||y>=gh)continue;const v=y*gw+x;if(dl[v]>d){dl[v]=d;n.push(v)}}}q=n}
 const cell=(x,y)=>Math.max(0,Math.min(gh-1,Math.floor(y/CELL)))*gw+Math.max(0,Math.min(gw-1,Math.floor(x/CELL))),isW=(x,y)=>wat[cell(x,y)]===1;
 function astar(A,B){const s=cell(...A),g=cell(...B),G=new Float32Array(gw*gh).fill(1e9),from=new Int32Array(gw*gh).fill(-1),done=new Uint8Array(gw*gh),hp=[[0,s]];G[s]=0;
  const push=e=>{hp.push(e);let i=hp.length-1;while(i>0){const p=(i-1)>>1;if(hp[p][0]<=hp[i][0])break;[hp[p],hp[i]]=[hp[i],hp[p]];i=p}};
  const pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<hp.length&&hp[a][0]<hp[m][0])m=a;if(b<hp.length&&hp[b][0]<hp[m][0])m=b;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m}}return t};
  const gi=g%gw,gj=(g-gi)/gw;
  while(hp.length){const[,u]=pop();if(done[u])continue;done[u]=1;if(u===g)break;const i=u%gw,j=(u-i)/gw;
   for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){if(!a&&!b)continue;const x=i+a,y=j+b;if(x<0||y<0||x>=gw||y>=gh)continue;const v=y*gw+x;if(!wat[v]||done[v])continue;
    const w=G[u]+Math.hypot(a,b)*(1+3*Math.max(0,5-dl[v])/5);if(w<G[v]){G[v]=w;from[v]=u;push([w+Math.hypot(x-gi,y-gj),v])}}}
  if(from[g]<0&&g!==s)return null;const out=[];for(let u=g;u>=0;u=from[u]){out.push([(u%gw+.5)*CELL,(Math.floor(u/gw)+.5)*CELL]);if(u===s)break}out.reverse();
  // thin the grid steps, then round the corners (Chaikin) so the barges glide
  let p=out.filter((_,i)=>i%5===0||i===out.length-1);for(let n=0;n<3;n++){const r=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];r.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}r.push(p[p.length-1]);p=r}return p}
 // showing spots: out from each resort across the shore, to the first open water well clear of land, docks and bungalows
 const off=(p,to,more,max)=>{const L=Math.hypot(to[0]-p[0],to[1]-p[1])||1,dx=(to[0]-p[0])/L,dy=(to[1]-p[1])/L;let x=p[0],y=p[1],n=0,first=-1,best=null,bc=-1;
  for(;n<160;n++,x+=dx*4,y+=dy*4){if(!isW(x,y))continue;if(first<0)first=n;const c=dl[cell(x,y)];if(c>bc){bc=c;best=[x,y]}if(c>=6&&(n-first)*4>=more)return[x,y];if((n-first)*4>max)break}return best};
 const P=OSM.places,mid=[FER.at(FER.L*.5)[0],FER.at(FER.L*.5)[1]],bay=P.disc||[P.cont[0]+500,P.cont[1]],spot={poly:off(P.poly,mid,60,220),gf:off(P.gf,mid,60,220),cont:off(P.cont,[W+200,P.cont[1]],40,84)};
 if(P.wldock)spot.wl=off(P.wldock,bay,50,160);if(P.fw)spot.fw=off(P.fw,bay,60,180);
 // where the barges come from and go back to: the north end of Bay Lake, at the top edge of the map (their real mooring is up that way)
 let home=null;for(let d=0;d<W&&!home;d+=CELL)for(const x of[bay[0]-d,bay[0]+d])if(x>0&&x<W&&isW(x,10)&&isW(x,40)){home=[x,10];break}
 if(!home)for(let d=0;d<600&&!home;d+=CELL)for(const y of[spot.cont[1]-d,spot.cont[1]+d])if(y>0&&y<H&&isW(MKR[2]-8,y)&&isW(MKR[2]-40,y)){home=[MKR[2]-8,y];break}
 try{const stops=['poly','gf','wl','fw','cont'].filter(k=>spot[k]),pts=[home,...stops.map(k=>spot[k]),home],legs=[];for(let i=0;i<pts.length-1;i++){const l=astar(pts[i],pts[i+1]);if(!l||l.length<2)throw 0;legs.push(mkPath(l))}
  EWP.legs=legs;EWP.spot=spot;EWP.stops=stops}catch(e){console.warn('Electrical Water Pageant: no clear water course found; the pageant is off');EWP.legs=null}})();
if(EWP.legs)EWP.shows=EWP.shows.filter(s=>EWP.stops.includes(s.k));
/* ---------- timetable ----------
   Keyframes: [time, leg, distance along that leg]. Between two keyframes on the same leg the lead barge eases along it;
   distances past either end of a leg are off the edge of the map. */
const EWP_KEYS=(()=>{if(!EWP.legs)return[];const K=[],tail=EWP.N*EWP.GAP+20,L=EWP.legs.map(l=>l.L),n=EWP.stops.length;let free=EWP.shows[0].t-24*60; // leave the mooring 24 minutes before the first showing
 const V=3.6; /* cruising speed, map units a second: the timetable is real, so legs are sailed as fast as this where they must be */
 EWP.stops.forEach((k,i)=>{const s=EWP.shows.find(x=>x.k===k),nx=EWP.shows.find(x=>x.k===EWP.stops[i+1]),arrive=Math.max(s.t-120,free+L[i]/V),leave=Math.max(arrive+150,Math.min(s.t+EWP.len+20,nx?nx.t-60-L[i+1]/V:1e9));
  K.push([free,i,0],[arrive,i,L[i]],[leave,i,L[i]]);free=leave}); /* sail in (two minutes early where there is time), hold for the showing, move on in time for the next */
 K.push([free,n,0],[free+12*60,n,L[n]+tail]);return K})();
const EWP_PREV=EWP.legs?EWP.legs.map((_,i)=>i-1):[]; // the tail of the string is still on the leg before when the lead barge starts a new one
// where the pageant is at time t: {leg, d (lead barge), show (index of the showing in progress, or -1)} or null when off the map
function ewpState(t){if(!EWP.legs||!EWP.on)return null;const K=EWP_KEYS;if(t<K[0][0]||t>K[K.length-1][0])return null;
 for(let i=K.length-2;i>=0;i--){const a=K[i],b=K[i+1];if(t<a[0]||a[1]!==b[1])continue;if(t>b[0])return null; // between legs: away on Bay Lake
  const u=Math.min(1,(t-a[0])/Math.max(1,b[0]-a[0])),e=u*u*(3-2*u),show=EWP.shows.findIndex(s=>t>=s.t&&t<ewpEnd(s));return{leg:a[1],d:a[2]+(b[2]-a[2])*(a[2]===b[2]?0:e),show}}
 return null}
// barge i of the string (0 = lead): [x, y, heading] or null if it is off the map
function ewpBarge(st,i){let leg=st.leg,d=st.d-i*EWP.GAP;if(d<0){leg=EWP_PREV[leg];if(leg<0)return null;d+=EWP.legs[leg].L;if(d<0)return null}if(d>EWP.legs[leg].L)return null;return EWP.legs[leg].at(d)}
function ewpCentre(t){const st=ewpState(t??T);if(!st)return null;for(const i of[6,3,9,0,13]){const p=ewpBarge(st,i);if(p)return[p[0],p[1]]}return null}
const ewpShow=()=>{const i=EWP.shows.findIndex(s=>T>=s.t&&T<ewpEnd(s));return i<0||!EWP.on||!EWP.legs?null:EWP.shows[i]};
/* ---------- the light figures: drawn in a 10 x 6 box, x from -5 to 5, y from 0 (bottom) up to -6 ---------- */
const EWP_FIG=[
 [(c,t)=>{c.moveTo(-4.4,0);c.quadraticCurveTo(-4.6,-5.6,-.5,-4.9);c.lineTo(2.6,-4.9);c.lineTo(4.4,-3.9);c.lineTo(2.6,-3.2);c.lineTo(.6,-3.2);c.quadraticCurveTo(-1.6,-3.2,-1.5,0);c.moveTo(1.8,-4.3);c.arc(1.6,-4.3,.25,0,7);c.moveTo(-3.2,-5.4);c.lineTo(-2.4,-6);c.lineTo(-1.6,-5.2)},'#6dff7a'],                  // sea serpent: head
 [(c,t)=>{c.moveTo(-4.6,0);c.quadraticCurveTo(0,-9.4,4.6,0);c.moveTo(-2.9,0);c.quadraticCurveTo(0,-6.2,2.9,0);for(const x of[-1.6,0,1.6]){c.moveTo(x+.3,-4-.7*Math.cos(x));c.arc(x,-4-.7*Math.cos(x),.3,0,7)}},'#6dff7a'],   // serpent: a coil
 [(c,t)=>{c.moveTo(-4.6,0);c.quadraticCurveTo(-1,-8.6,2,-1.2);c.quadraticCurveTo(3,.6,4.6,-3.4);c.lineTo(3.6,-5);c.moveTo(4.6,-3.4);c.lineTo(4.9,-5.2)},'#6dff7a'],                                              // serpent: tail
 [(c,t)=>{c.moveTo(-4.4,-1.6);c.quadraticCurveTo(-3.6,-4.6,0,-4.4);c.quadraticCurveTo(3,-4.2,3.6,-2.2);c.lineTo(4.8,-3.6);c.moveTo(3.6,-2.2);c.lineTo(4.9,-1.2);c.moveTo(3.6,-2.2);c.quadraticCurveTo(0,-.2,-4.4,-1.6);c.moveTo(-2.6,-2.9);c.arc(-2.8,-2.9,.22,0,7);
   const s=(t*1.2)%1;c.moveTo(-1.2,-4.5);c.lineTo(-1.2,-4.7-s*1.2);c.moveTo(-1.2,-4.9-s);c.lineTo(-2,-5.5-s);c.moveTo(-1.2,-4.9-s);c.lineTo(-.4,-5.5-s)},'#62c8ff'],                                              // whale, spouting
 [(c,t)=>{c.moveTo(-3,-1.4);c.arc(0,-1.4,3,Math.PI,0);c.closePath();c.moveTo(-1.5,-1.4);c.lineTo(-.8,-4.2);c.moveTo(1.5,-1.4);c.lineTo(.8,-4.2);c.moveTo(-2.5,-3);c.lineTo(2.5,-3);c.moveTo(3,-1.8);c.quadraticCurveTo(4.6,-2.6,4.7,-1.6);c.quadraticCurveTo(4.4,-.9,3,-1.4);
   const f=Math.sin(t*3)*.4;c.moveTo(-1.8,-1.4);c.lineTo(-2.6,-.2+f);c.moveTo(1.6,-1.4);c.lineTo(2.3,-.2-f)},'#b6ff5a'],                                                                                            // turtle, paddling
 [(c,t)=>{c.moveTo(2,-3.6);c.arc(0,-3.6,2,0,Math.PI,true);for(let i=0;i<6;i++){const x=-2+i*.8,w=Math.sin(t*3+i)*.5;c.moveTo(x,-3.6);c.quadraticCurveTo(x+w,-2,x-w*.6,-.2)}c.moveTo(-.5,-4);c.arc(-.75,-4,.22,0,7);c.moveTo(1,-4);c.arc(.75,-4,.22,0,7)},'#e07bff'],     // octopus
 [(c,t)=>{for(const o of[-2.4,2.2]){const b=Math.sin(t*2+o)*.3;c.moveTo(o+.9,-4.9+b);c.lineTo(o,-5.2+b);c.quadraticCurveTo(o-1.3,-5+b,o-.8,-3.6+b);c.quadraticCurveTo(o+.9,-2.6+b,o,-1.3+b);c.quadraticCurveTo(o-.9,-.5+b,o-.2,-.1+b);c.moveTo(o-.9,-3.4+b);c.lineTo(o-1.6,-3+b)}},'#ffb14a'],  // seahorses
 [(c,t)=>{for(const[o,ph]of[[-2.4,0],[2.2,1.6]]){const j=Math.max(0,Math.sin(t*2.2+ph))*2.4;c.moveTo(o-2,-1.2-j);c.quadraticCurveTo(o,-3.6-j,o+2,-1.6-j);c.quadraticCurveTo(o,-2-j,o-2,-1.2-j);c.moveTo(o-2,-1.2-j);c.lineTo(o-2.6,-2-j);c.moveTo(o-2,-1.2-j);c.lineTo(o-2.6,-.6-j);c.moveTo(o,-2.75-j);c.lineTo(o-.3,-3.6-j)}},'#5af0ff'], // leaping dolphins
 [(c,t)=>{for(const[x,y]of[[-2.6,-4.2],[1.4,-3],[-1.2,-1.4],[3,-5]]){const w=Math.sin(t*5+x)*.25;c.moveTo(x+1.2,y);c.quadraticCurveTo(x,y-1,x-1,y);c.quadraticCurveTo(x,y+1,x+1.2,y);c.moveTo(x-1,y);c.lineTo(x-1.7,y-.6+w);c.moveTo(x-1,y);c.lineTo(x-1.7,y+.6+w)}},'#ffe45a'],   // a school of fish
 [(c,t)=>{c.moveTo(2.2,-2.6);c.arc(0,-2.6,2.2,0,7);const f=Math.sin(t*4)*.3;for(const sd of[-1,1]){c.moveTo(sd*1.6,-4.1);c.lineTo(sd*2.8,-5.2);c.arc(sd*3.3,-5.3,.5,sd>0?Math.PI:0,sd>0?Math.PI*2.6:Math.PI*1.6);for(let i=0;i<3;i++){c.moveTo(sd*1.9,-2.2+i*.6);c.lineTo(sd*(3.3+f*(i%2?1:-1)),-1.6+i*.7)}}
   c.moveTo(-.6,-3.2);c.arc(-.8,-3.2,.2,0,7);c.moveTo(1,-3.2);c.arc(.8,-3.2,.2,0,7)},'#ff6a5a'],                                                                                                                    // crab
 [(c,t)=>{c.moveTo(2.4,-3.8);c.arc(0,-3.8,2.4,0,Math.PI,true);c.closePath();for(let i=0;i<5;i++){const x=-1.8+i*.9,w=Math.sin(t*2.5+i)*.5;c.moveTo(x,-3.8);c.bezierCurveTo(x+w,-2.6,x-w,-1.6,x+w*.5,-.3)}},'#ff8fd8'],       // jellyfish
 [(c,t)=>{c.moveTo(0,-.2);c.lineTo(0,-5.8);c.moveTo(-2,-5.8);c.lineTo(-2,-3.8);c.quadraticCurveTo(0,-2.6,2,-3.8);c.lineTo(2,-5.8);for(const x of[-2,0,2]){c.moveTo(x-.4,-5.3);c.lineTo(x,-6);c.lineTo(x+.4,-5.3)}c.moveTo(-.8,-1.4);c.lineTo(.8,-1.4)},'#ffd95a'],              // a trident
 [(c,t)=>{const a0=t*.6;for(let i=0;i<5;i++){const a=a0+i/5*6.283;c.moveTo(0,-3);c.quadraticCurveTo(Math.cos(a+.5)*2,-3+Math.sin(a+.5)*2,Math.cos(a)*3.2,-3+Math.sin(a)*2.9)}c.moveTo(.5,-3);c.arc(0,-3,.5,0,7)},'#ff9a4a'], // starfish
 [(c,t)=>{c.moveTo(-4.6,0);c.quadraticCurveTo(-2.5,-6.4,0,-2.6);c.quadraticCurveTo(2.5,1,4.6,-4.4);for(let i=0;i<4;i++){const u=(t*.5+i/4)%1;c.moveTo(-3+i*2+.3,-1-u*4.6);c.arc(-3+i*2,-1-u*4.6,.3,0,7)}},'#7affd0']];  // a wave and bubbles
// finale: flags and stars in red, white and blue
function ewpFinale(c,i,t){const stroke=(col,f)=>{c.strokeStyle=col;c.beginPath();f();c.stroke()};
 if(i%2){for(const[x,y,r,col,ph]of[[-2.6,-3.6,1.5,'#ff5a5a',0],[.4,-2.2,1.9,'#ffffff',1.3],[3.2,-4.2,1.3,'#6aa8ff',2.4]]){if(Math.sin(t*4+ph+i)<-.55)continue;stroke(col,()=>{for(let k=0;k<=10;k++){const rr2=k%2?r*.42:r,a=-Math.PI/2+k*Math.PI/5;c.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)}})}}
 else{const w=k=>Math.sin(t*3+k*.9+i)*.18;stroke('#ff5a5a',()=>{for(const y of[-5.6,-4.4,-3.2,-2,-.8]){c.moveTo(y<-3?-.6:-4.4,y+w(0));for(let x=(y<-3?-.6:-4.4);x<=4.4;x+=1)c.lineTo(x,y+w(x))}});
  stroke('#ffffff',()=>{for(const y of[-5,-3.8,-2.6,-1.4]){c.moveTo(y<-3?-.6:-4.4,y+w(0));for(let x=(y<-3?-.6:-4.4);x<=4.4;x+=1)c.lineTo(x,y+w(x))}});
  stroke('#6aa8ff',()=>{c.rect(-4.4,-5.7,3.4,2.5);for(const[x,y]of[[-3.6,-5],[-2.7,-5],[-1.8,-5],[-3.15,-4.2],[-2.25,-4.2]]){c.moveTo(x+.18,y);c.arc(x,y,.18,0,7)}})}}
/* ---------- drawing ----------
   pass 0: hulls and screen frames (they take the night tint like everything else);  pass 1: the lights, over the night tint */
function drawPageant(now,pass){const st=ewpState(T);if(!st)return;const sh=st.show>=0?EWP.shows[st.show]:null,ts=sh?T-sh.t:0,tw=now/1000,B=[];
 for(let i=0;i<EWP.N;i++){const p=ewpBarge(st,i);if(p)B.push([p,i])}B.sort((a,b)=>a[0][1]-b[0][1]);
 for(const[[x,y,a],i]of B){cx.save();cx.translate(x,y);
  if(!pass){cx.save();cx.rotate(a);cx.fillStyle='rgba(20,40,60,.3)';cx.beginPath();cx.ellipse(.6,.8,6.2,2.3,0,0,7);cx.fill();cx.fillStyle='#39424f';cx.beginPath();cx.roundRect(-5.6,-1.8,11.2,3.6,1.2);cx.fill();cx.fillStyle='#566170';cx.fillRect(-5,-1.2,10,2.4);cx.restore();
   cx.strokeStyle='rgba(70,80,95,.7)';cx.lineWidth=.3;cx.strokeRect(-5.2,-7.4,10.4,6.6);cx.beginPath();for(const sx of[-5.2,0,5.2]){cx.moveTo(sx,-.8);cx.lineTo(sx,.4)}cx.stroke();cx.restore();continue}
  cx.globalCompositeOperation='lighter';cx.lineCap=cx.lineJoin='round';
  if(!sh||ts<i*1.4){cx.fillStyle='rgba(255,240,200,.85)';for(const sx of[-5,5]){cx.beginPath();cx.arc(sx,-1,.35,0,7);cx.fill()}cx.restore();continue} // under way, or not lit yet: just running lights
  const fin=ts>EWP.len-95,[fig,col]=EWP_FIG[i%EWP_FIG.length],draw=()=>{if(fin)ewpFinale(cx,i,tw);else{cx.strokeStyle=col;cx.beginPath();fig(cx,tw);cx.stroke()}};
  cx.translate(0,-1);
  cx.save();cx.scale(1,-.5);cx.translate(0,-3.2);cx.globalAlpha=.16;cx.lineWidth=.9;draw();cx.restore();                         // reflection on the water
  cx.globalAlpha=.3;cx.lineWidth=1.25;draw();                                                                                       // glow
  cx.globalAlpha=1;cx.lineWidth=.42;cx.setLineDash([.42,.34]);cx.lineDashOffset=-tw*1.6;draw();cx.setLineDash([]);cx.restore()}}   // the bulbs, chasing
/* ---------- soundtrack ---------- */
EWP.audio.preload='auto';EWP.audio.addEventListener('canplay',()=>{EWP.ready=true;ewpBadge()});
EWP.audio.addEventListener('loadedmetadata',()=>{const d=EWP.audio.duration;if(d&&isFinite(d))EWP.len=Math.min(560,d);ewpBadge()});
EWP.audio.addEventListener('error',()=>{if(EWP.src==='folder'){EWP.src='none';EWP.name='';EWP.ready=false;ewpBadge();ewpLoadSaved()}});
loadTrack(EWP.audio,EWP_FILE);
function ewpUse(blob,name){EWP.src='picked';EWP.name=name||'pageant soundtrack';EWP.audio.src=URL.createObjectURL(blob);EWP.audio.load();ewpBadge()}
async function ewpLoadSaved(){try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('ewp');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob)ewpUse(v.blob,v.name)}catch(e){}}
function ewpPick(){const i=document.createElement('input');i.type='file';i.accept='audio/*,.mp3,.m4a,.wav,.ogg';i.onchange=async()=>{const f=i.files[0];if(!f)return;ewpUse(f,f.name);
  try{const db=await IDB();const t=db.transaction('files','readwrite');t.objectStore('files').put({blob:f,name:f.name},'ewp')}catch(e){}};i.click()}
const ewpNext=()=>EWP.shows.find(s=>ewpEnd(s)>T)||null;
function ewpText(){if(!EWP.legs)return'Not available on this map.';if(!EWP.on)return'Turned off';const s=ewpShow();if(s)return`On now off the ${s.n} · ends ${fmt(ewpEnd(s))}`;const n=ewpNext();return n?`Next showing: ${n.n}, ${fmt(n.t)}`+(ewpState(T)?' · barges on the water':''):'No more showings tonight'}
function ewpBadge(){const el=document.querySelector('#ewpStat');if(el)el.innerHTML=esc(ewpText())+'<br>'+(EWP.name?`<b>${esc(EWP.name)}</b> — ${EWP.ready?'ready':'loading…'}${EWP.blocked?' (tap Play to allow audio)':''}`:'No soundtrack loaded.')}
// how close the map is to the barges, 0–1 (the music is only heard near them)
function ewpNear(){if(SV.on)return 0;const p=ewpCentre();return p?Math.max(0,Math.min(1,prox(p[0],p[1],340)*1.45-.14)):0} // silent beyond about 800 map units
const ewpPlaying=()=>EWP.ready&&!EWP.audio.paused;
function pageantSync(){const s=ewpShow(),a=EWP.audio,near=s?ewpNear():0;
 if(s&&EWP.liveKey!==s.t){EWP.liveKey=s.t;if(EWP.ready&&EWP.auto&&near>.3&&speed!==1&&!FF){speed=1;sync();toast('The Electrical Water Pageant is starting — speed set to 1× so the music stays in sync')}}
 const want=s&&EWP.ready&&playing&&speed===1&&!FF&&near>.02;
 if(want){const pos=T-s.t;setVol(a,near*(AU.mute?0:AU.v.master)*1.1);
  if(a.paused){a.currentTime=Math.max(0,pos);a.play().catch(()=>{EWP.blocked=true;ewpBadge()})}
  else{const d=a.currentTime-pos,other=(HEA.ready&&!HEA.audio.paused)||PARADES.some(P=>parPlaying(P.id));
   if(other){if(Math.abs(d)>.6)a.currentTime=Math.max(0,pos)}                 // another show's music is keeping time: just follow
   else syncTrack(EWP,a,d,()=>{a.currentTime=Math.max(0,pos)})}}
 else if(!a.paused)a.pause()}
function watchPageant(k){if(!EWP.legs)return;EWP.on=true;const s=EWP.shows.find(x=>x.k===k)||EWP.shows.find(x=>x.t>=T-60)||EWP.shows[0];if(!AU.ready)auInit();seek(s.t-20,s.t-20<T);EWP.liveKey=null;speed=1;playing=true;
 if(SV.on)setView(false);const p=EWP.spot[s.k];cam.tx=cam.x=p[0];cam.ty=cam.y=p[1];cam.tm=Math.max(cam.tm,2.4);follow={k:'w'};closeSheet();sync();
 if(!EWP.ready)toast(`Add ${EWP_FILE} (or load it in Entertainment) to hear the pageant`);EWP.audio.play().then(()=>EWP.audio.pause()).catch(()=>{})}
