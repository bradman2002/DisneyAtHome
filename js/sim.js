/* Magic Kingdom resort-area simulator — park data, path graph and guest/attraction/transport simulation.
   Shared globals (classic scripts, so the site also works when opened straight from disk). */
'use strict';
/* ===== Magic Kingdom Simulator — structure: DATA / GRAPH / STATIC ART / SIM / AUDIO / RENDER / UI.
   A new park = new DATA block (lands, nodes, edges, attractions, venues, events). ===== */
const $=s=>document.querySelector(s),W=OSM.W,H=OSM.H,K=12;let OPEN=9,CLOSE=22,LIVENOW=false,CROWDX=1; // park hours (live mode sets today's real ones); LIVENOW: real wait times and closures apply right now (see live.js)
 // K = real guests represented by one party on the map; CROWDX scales arrivals (live mode sets it from how busy the real park is)
/* ===== DATA: built from the OpenStreetMap geometry in park-osm.js (real walkways, buildings and positions) ===== */
const P_=OSM.places,POS=OSM.pos;
const ptIn=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
const polyC=p=>{let x=0,y=0;for(const q of p){x+=q[0];y+=q[1]}return[x/p.length,y/p.length]};
const LANDNAME={ms:'Main Street, U.S.A.',adv:'Adventureland',fr:'Frontierland',lib:'Liberty Square',fan:'Fantasyland',tom:'Tomorrowland'};
// label/ambience centre for each land (inside its real boundary, near its main plaza)
const LC={ms:[P_.mainst[0],P_.mainst[1]+40],hub:P_.hub,adv:POS['The Magic Carpets of Aladdin'].c,fr:[POS['Country Bear Musical Jamboree'].c[0]-30,POS['Country Bear Musical Jamboree'].c[1]-30],lib:[POS['The Hall of Presidents'].c[0]-25,POS['The Hall of Presidents'].c[1]+18],fan:[P_.castle[0]+60,P_.castle[1]-110],tom:[POS['Astro Orbiter'].c[0]+10,POS['Astro Orbiter'].c[1]-70]};
const PARK={name:'Magic Kingdom',
LANDS:Object.fromEntries(Object.entries(LC).map(([k,c])=>[k,[k==='hub'?'Central Hub':LANDNAME[k],c[0],c[1]]])),
SC:{ms:['#f3e0c8','#a9433f'],hub:['#eadfc8','#8a6a3a'],adv:['#d8b46a','#6e8a3a'],fr:['#a8754a','#5a4030'],lib:['#e6e1d4','#4b5f7f'],fan:['#f1d6e4','#8c63b5'],tom:['#d7e3ec','#4f84b2']},
N:OSM.nodes,E:OSM.edges,
// display name, OpenStreetMap name, land, throughput/hr, ride sec, popularity, kind, open, close, breakdown risk/hr
A:[['Jungle Cruise','Jungle Cruise','adv',1800,540,1.0,'box'],['Pirates of the Caribbean','Pirates of the Caribbean','adv',1800,500,1.0,'box'],['Magic Carpets of Aladdin','The Magic Carpets of Aladdin','adv',900,90,.5,'spin'],['Enchanted Tiki Room',"Walt Disney's Enchanted Tiki Room",'adv',1500,720,.4,'box',9,21],['Swiss Family Treehouse','Swiss Family Treehouse','adv',1200,600,.3,'tree',9,21],
['Big Thunder Mountain','Big Thunder Mountain Railroad','fr',1700,240,1.3,'mtn',9,22,1.1],['Tiana’s Bayou Adventure',"Tiana's Bayou Adventure",'fr',1500,600,1.4,'mtn2'],['Country Bear Musical Jamboree','Country Bear Musical Jamboree','fr',1400,900,.4,'box'],
['Haunted Mansion','The Haunted Mansion','lib',1800,420,1.2,'house'],['Hall of Presidents','The Hall of Presidents','lib',1800,1380,.3,'box',9,19],
['Seven Dwarfs Mine Train','Seven Dwarfs Mine Train','fan',1400,180,1.9,'mtn3',9,22,1.2],['Peter Pan’s Flight',"Peter Pan's Flight",'fan',1000,190,1.4,'box'],['“it’s a small world”','"it\'s a small world"','fan',2200,660,.7,'box'],['Winnie the Pooh','The Many Adventures of Winnie the Pooh','fan',1500,200,.8,'box'],['Under the Sea','Under the Sea: Journey of the Little Mermaid','fan',1400,360,.8,'box'],['PhilharMagic',"Mickey's PhilharMagic",'fan',2000,720,.6,'box'],['Dumbo the Flying Elephant','Dumbo the Flying Elephant','fan',900,100,.8,'spin'],
['Mad Tea Party','Mad Tea Party','fan',1100,90,.6,'spin'],['Prince Charming Regal Carrousel','Prince Charming Regal Carrousel','fan',1500,120,.4,'spin'],['The Barnstormer','The Barnstormer','fan',1000,60,.6,'box'],
['Space Mountain','Space Mountain','tom',1700,180,1.7,'dome',9,22,1.0],['TRON Lightcycle / Run','TRON Lightcycle / Run','tom',1400,120,1.9,'tron',9,22,1.4],['Buzz Lightyear Space Ranger Spin',"Buzz Lightyear's Space Ranger Spin",'tom',1700,300,.9,'box'],['Tomorrowland Speedway','Tomorrowland Speedway','tom',1400,300,.6,'track',9,21],['PeopleMover','Tomorrowland Transit Authority PeopleMover','tom',2400,600,.5,'pm'],['Carousel of Progress',"Walt Disney's Carousel of Progress",'tom',2400,1260,.3,'box',9,20],['Astro Orbiter','Astro Orbiter','tom',700,90,.4,'spin'],['Monsters Inc. Laugh Floor','Monsters, Inc. Laugh Floor','tom',1500,900,.4,'box'],['Town Square Theater','Town Square Theater','ms',900,420,.6,'box',9,21]].filter(r=>POS[r[1]]),
// venues: display name, OpenStreetMap name, kind
V:[['Emporium','Emporium','shop'],['Main Street Confectionery','Main Street Confectionery','shop'],['Casey’s Corner',"Casey's Corner",'eat'],['The Plaza Restaurant','The Plaza Restaurant','eat'],['The Crystal Palace','The Crystal Palace','eat'],['Agrabah Bazaar','Agrabah Bazaar','shop'],['Columbia Harbour House','Columbia Harbor House','eat'],['Pecos Bill Tall Tale Inn','Pecos Bill Tale Tale Inn and Café','eat'],['Frontier Trading Post','Frontier Trading Post','shop'],['Be Our Guest','Be Our Guest Restaurant','eat'],['Storybook Treats','Storybook Treats','eat'],['Cosmic Ray’s Starlight Café',"Cosmic Ray's Starlight Café",'eat'],['Star Traders',"Mickey's Star Traders",'shop']].filter(r=>POS[r[1]]),
// entertainment: editable; times in HH:MM (names are generic placeholders)
EV:[{id:'parade',n:'Festival of Fantasy Parade',ts:['12:00','15:00'],dur:20,lead:40,pref:.5},{id:'castle',n:'Castle Stage Show (placeholder)',ts:['11:30','13:30','16:30'],dur:20,lead:20,pref:.3},{id:'band',n:'Main Street Band & Singers',ts:['10:30','12:30','14:30','18:00'],dur:20,lead:8,pref:.12},{id:'fire',n:'Happily Ever After (fireworks)',ts:['21:00'],dur:19,lead:40,pref:.75,exit:.6},
 // the Christmas parade: evenings in the holiday season only (season = first and last day as month*100+day); it can be switched on for any date in Entertainment
 {id:'xmas',n:'Once Upon a Christmastime Parade',ts:['19:00'],dur:15.5,lead:35,pref:.45,season:[1108,1231]},
 // the Halloween parade: evenings from mid-August to Halloween
 {id:'boo',n:'Boo to You Halloween Parade',ts:['19:30'],dur:17.6,lead:35,pref:.45,season:[815,1031]},
 // the day's rituals. `rel` ties a time to the park's hours: [open or close, seconds after]
 {id:'welcome',n:'Let the Magic Begin (welcome show)',ts:['8:55'],dur:5,lead:35,pref:.85,rel:['open',-300]},
 {id:'caval',n:'Adventure Friends Cavalcade',ts:['11:05','13:15'],dur:9,lead:12,pref:.2},
 {id:'flag',n:'Flag Retreat',ts:['17:00'],dur:12,lead:8,pref:.1},
 {id:'kiss',n:'Kiss Goodnight',ts:['22:30'],dur:3,lead:0,pref:0,rel:['close',1800]}]};
const {LANDS,SC,N,E,V,EV}=PARK;
const AT=PARK.A.map((r,i)=>{const p=POS[r[1]];return{i,n:r[0],osm:r[1],l:r[2],x:p.c[0],y:p.c[1],nd:p.nd,dx:N[p.nd][0],dy:N[p.nd][1],thr:r[3],dur:r[4],pop:r[5],k:r[6],open:r[7]||9,close:r[8]||22,o0:r[7]||9,c0:r[8]||22,risk:r[9]||.7}});
const VN=V.map((r,i)=>{const p=POS[r[1]];return{i,n:r[0],osm:r[1],k:r[2],x:p.c[0],y:p.c[1],nd:p.nd,dr:0}});
// set the park's hours; each ride keeps its own offset from them (a ride that normally shuts an hour early still does)
// shows whose time follows the park's hours (the welcome show five minutes before opening, the Kiss Goodnight half an hour after closing)
function relTimes(){for(const e of EV)if(e.rel&&Array.isArray(e.t)){const t=(e.rel[0]==='open'?OPEN:CLOSE)*3600+e.rel[1];e.t=[Math.min(t,86400-e.dur*60-90)]}}
function setHours(o,c){OPEN=o;CLOSE=c;relTimes();for(const a of AT){a.open=o+(a.o0-9);a.close=Math.max(a.open+1,c-(22-a.c0))}}
const GATE=OSM.keys.gate,TOWNSQ=OSM.keys.townsq,MAINST=OSM.keys.mainst,HUB=OSM.keys.hub;
/* ---- graph: real walkways. Routes are computed on demand toward each destination (Dijkstra), then cached ---- */
const ADJ=N.map(()=>[]);E.forEach(([a,b])=>{const d=Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]);ADJ[a].push([b,d]);ADJ[b].push([a,d])});
const ROUTE=new Map();
function routeTo(goal){let r=ROUTE.get(goal);if(r)return r;const n=N.length,dist=new Float32Array(n).fill(1e9),hop=new Int32Array(n).fill(-1),done=new Uint8Array(n);dist[goal]=0;hop[goal]=goal;
 const hp=[[0,goal]];const push=(d,v)=>{hp.push([d,v]);let i=hp.length-1;while(i>0){const p=(i-1)>>1;if(hp[p][0]<=hp[i][0])break;[hp[p],hp[i]]=[hp[i],hp[p]];i=p}};
 const pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<hp.length&&hp[a][0]<hp[m][0])m=a;if(b<hp.length&&hp[b][0]<hp[m][0])m=b;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m}}return t};
 while(hp.length){const[d,u]=pop();if(done[u])continue;done[u]=1;for(const[v,w]of ADJ[u]){if(d+w<dist[v]){dist[v]=d+w;hop[v]=u;push(d+w,v)}}}
 for(let i=0;i<n;i++)if(hop[i]<0){hop[i]=goal;dist[i]=Math.hypot(N[i][0]-N[goal][0],N[i][1]-N[goal][1])*1.4} // off-network: head straight there
 r={dist,hop};ROUTE.set(goal,r);return r}
const hop=(from,goal)=>from===goal?goal:routeTo(goal).hop[from];
const dist=(from,goal)=>routeTo(goal).dist[from];
function nearestNode(x,y){let b=0,bd=1e18;for(let i=0;i<N.length;i++){const d=(N[i][0]-x)**2+(N[i][1]-y)**2;if(d<bd){bd=d;b=i}}return b}
function mkPath(p){let L=0;const s=[0];for(let i=1;i<p.length;i++){L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);s.push(L)}
 return{L,p,at(d){d=Math.max(0,Math.min(L-1e-6,d));let lo=1,hi=s.length-1;while(lo<hi){const m=(lo+hi)>>1;if(s[m]<d)lo=m+1;else hi=m}const i=lo,u=(d-s[i-1])/(s[i]-s[i-1]||1),a=p[i-1],b=p[i];return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,Math.atan2(b[1]-a[1],b[0]-a[0])]},
  near(x,y){let bi=0,bd=1e18;for(let i=0;i<p.length;i++){const d=(p[i][0]-x)**2+(p[i][1]-y)**2;if(d<bd){bd=d;bi=i}}return s[bi]},
  // distance along the path of the closest point on any segment (near() only looks at the corners)
  proj(x,y){let bs=0,bd=1e18;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l2)),d=(a[0]+dx*u-x)**2+(a[1]+dy*u-y)**2;if(d<bd){bd=d;bs=s[i-1]+(s[i]-s[i-1])*u}}return bs}}}
// the real Festival of Fantasy route, run from Frontierland toward Town Square
const PR=(()=>{const r=OSM.routes.parade.slice();if(r[0][1]>r[r.length-1][1])r.reverse();return mkPath(r)})();
const RR=mkPath(OSM.routes.rail);
const FER=mkPath(OSM.ferryPath),BUSP=mkPath(OSM.busPath);
/* Monorail: the two real passenger loops around Seven Seas Lagoon. Trains only run forward, in the order of `stops`;
   `sd` is each station's distance along the loop. Train names are the real fleet's stripe colours. */
const STOPNAME={ttc:'Ticket and Transportation Center',poly:'Polynesian Village',gf:'Grand Floridian',mk:'Magic Kingdom',cont:'Contemporary'};
const MLINE={express:{n:'Express',stops:['ttc','mk'],cap:25,trains:[['Red','#d6453b'],['Coral','#f08a7a'],['Orange','#ee8a2c']]},
 resort:{n:'Resort',stops:['ttc','poly','gf','mk','cont'],cap:10,trains:[['Blue','#3a7bd5'],['Green','#3f9a55'],['Gold','#d9a520']]}};
for(const k in MLINE){const l=MLINE[k];l.k=k;l.p=mkPath(OSM.mono[k]);l.sd=l.stops.map(s=>l.p.proj(...P_[s]))}
/* Places around the lagoon: every monorail station, with the resort it serves */
const RESORTS={mk:{n:'Magic Kingdom Station',t:'Monorail station at the park entrance',c:P_.mk},cont:{n:'Disney’s Contemporary Resort',t:'Monorail resort · the Resort line runs through the tower',c:P_.cont},
 ttc:{n:'Transportation and Ticket Center',t:'Monorail hub, ferry dock and parking',c:P_.ttc},poly:{n:'Disney’s Polynesian Village Resort',t:'Monorail resort on the south shore',c:P_.poly},gf:{n:'Disney’s Grand Floridian Resort & Spa',t:'Monorail resort on the west shore',c:P_.gf}};
if(P_.wl)RESORTS.wl={n:'Disney’s Wilderness Lodge',t:'Lodge on the south shore of Bay Lake, reached by boat',c:P_.wl,boat:P_.wldock||P_.wl};
if(P_.fw)RESORTS.fw={n:'Disney’s Fort Wilderness Resort',t:'Campground marina on the east shore of Bay Lake, reached by boat',c:P_.fw,boat:P_.fw};
// boats that call at a place: [route, boat] for every boat whose route has a stop there
const boatsAt=q=>{const out=[];LAUNCH.forEach(b=>{const R=BOATR[b.r];if(R.st.some(d=>{const p=R.p.at(Math.min(d,R.p.L-.01));return Math.hypot(p[0]-q[0],p[1]-q[1])<70}))out.push([R,b])});return out};
/* Fire Rock Geyser at Wilderness Lodge erupts at the top of every hour from 7 AM to 10 PM, about 120 feet (37 m) high.
   geyserNow() is how strong the eruption is right now: 0 when quiet, rising through a short sputtering start to a full
   column for about two minutes, then dying away. */
const GEYSER={first:7,last:22,up:20,full:140,down:40};
function geyserNow(t){if(!P_.geyser)return 0;t=t??T;const h=Math.floor(t/3600),s=t-h*3600;if(h<GEYSER.first||h>GEYSER.last)return 0;const G=GEYSER;
 if(s<G.up)return .15+.25*(s/G.up)*(.6+.4*Math.sin(s*3));if(s<G.up+G.full)return 1;if(s<G.up+G.full+G.down)return 1-(s-G.up-G.full)/G.down;return 0}
const geyserNext=()=>{const h=Math.floor(T/3600)+(T%3600>GEYSER.up+GEYSER.full+GEYSER.down?1:0),n=Math.max(h,GEYSER.first);return n<=GEYSER.last?n*3600:null};
const DWELL=s=>s==='mk'?45:s==='ttc'?60:35;
// trains heading for a station, soonest first: [{m, t seconds}]
function monoEta(stop){const out=[];for(const m of MONO){const l=MLINE[m.l],si=l.stops.indexOf(stop),L=l.p.L;if(si<0)continue;if(m.st==='dwell'&&m.at===si){out.push({m,t:0});continue}
  const gap=((l.sd[si]-m.x)%L+L)%L;let t=(m.st==='dwell'?m.tm:0)+gap/MSPEED;l.sd.forEach((d,j)=>{const g=((d-m.x)%L+L)%L;if(j!==si&&g>.5&&g<gap)t+=DWELL(l.stops[j])});out.push({m,t})}return out.sort((a,b)=>a.t-b.t)}
const MSPEED=14,monoXY=(m,off)=>{const l=MLINE[m.l].p;return l.at((((m.x+(off||0))%l.L)+l.L)%l.L)};
/* Resort boats (shown only; no guests modelled), each on its real route: the launch that circles Magic Kingdom, the Grand
   Floridian and the Polynesian; the boats from Magic Kingdom to Fort Wilderness and to Wilderness Lodge; and the launch
   that circles Fort Wilderness, the Contemporary and Wilderness Lodge on Bay Lake.
   A route is {p: path, loop, st: distances of its stops, col, n: name}. */
const BOATR=[];{const B=OSM.boats||{},add=(pts,loop,stops,col,n)=>{if(!pts||pts.length<4)return;const p=mkPath(pts),st=[...new Set([0,...stops.filter(Boolean).map(q=>Math.round(p.proj(...q))),loop?0:Math.floor(p.L)])].sort((a,b)=>a-b);BOATR.push({p,loop,st,col,n})};
 add(OSM.launchPath,true,[P_.gf,P_.poly],'#d9a520','Gold flag launch');add(B.fw,false,[],'#2f7d5a','Fort Wilderness boat');add(B.wl,false,[],'#b3262e','Wilderness Lodge boat');add(B.blue,true,[P_.fw,P_.wldock],'#2f6fd6','Blue flag launch')}
const GATEXY=N[GATE];
/* Where guests may stand: every paved place in the map data (plazas, walkways and queue paths), minus building
   footprints and the Speedway track. Guests walk along the path network, but the exact spot they stop at (outside a
   ride, watching a show, waiting at the gate) is checked against this, so nobody ends up on a track, a lawn or the water. */
const PAVE=(()=>{const q=2,gw=Math.ceil(W/q),gh=Math.ceil(H/q),k=document.createElement('canvas');k.width=gw;k.height=gh;const c=k.getContext('2d');c.scale(1/q,1/q);c.fillStyle=c.strokeStyle='#000';c.lineCap=c.lineJoin='round';
 const ring=r=>{r.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()};
 for(const a of OSM.areas)if(a.k==='ped'){c.beginPath();ring(a.o);for(const r of a.i||[])ring(r);c.fill('evenodd')}
 for(const p of OSM.paths){c.beginPath();p.p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(p.a)c.fill();else{c.lineWidth=Math.max(2.6,p.w);c.stroke()}}
 c.globalCompositeOperation='destination-out';for(const b of OSM.buildings)if(b.p.length>2&&b.k!=='roof'){c.beginPath();ring(b.p);c.fill()}
 c.lineWidth=7;for(const l of OSM.lines)if(l.k==='race')for(const p of l.p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
 const d=c.getImageData(0,0,gw,gh).data;return(x,y)=>{const i=Math.floor(x/q),j=Math.floor(y/q);return i>=0&&j>=0&&i<gw&&j<gh&&d[(j*gw+i)*4+3]>128}})();
// Each ride and venue is entered from the nearest point on the path network that is out in the open (the closest point
// can be an indoor queue path under the building's roof, where guests would be drawn standing on the roof).
for(const o of[...AT,...VN]){const seen=new Set([o.nd]);let q=[o.nd],hit=PAVE(...N[o.nd])?o.nd:-1;for(let d=0;d<8&&hit<0&&q.length;d++){const nx=[];for(const u of q)for(const[v]of ADJ[u]){if(seen.has(v))continue;seen.add(v);if(PAVE(...N[v])){hit=v;break}nx.push(v)}q=nx}
 if(hit>=0)o.nd=hit;o.dx=N[o.nd][0];o.dy=N[o.nd][1]}
// a paved spot within r of (x,y); if none turns up, the nearest point of the path network itself
function paved(x,y,r,nd){for(let i=0;i<12;i++){const px=x+rr(-r,r),py=y+rr(-r,r);if(PAVE(px,py))return[px,py]}const n=N[nd??nearestNode(x,y)];return[n[0]+rr(-1.2,1.2),n[1]+rr(-1.2,1.2)]}
/* ===== SIMULATION ===== */
let T=9*3600,speed=1,playing=true,FF=false,dateStr='2026-11-12',att=50000,nf=0,gf=0,sunset=17.7,sunrise=7.2,rs=1;
const R=()=>{rs|=0;rs=rs+0x6D2B79F5|0;let t=Math.imul(rs^rs>>>15,1|rs);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},rr=(a,b)=>a+R()*(b-a);
let guests=[],pend=[0,0,0],dep=[0,0,0],sp=0,ST={arr:0,dep:0},ARR=[0,0,0,0,0,0,0,0,.14,.2,.15,.1,.08,.07,.06,.05,.04,.04,.03,.02,.02,0,0,0],MODE=[.38,.17,.3,.15];
let MONO=[],FERRY=[],LAUNCH=[],BUS=[],busT=0,RRT=0,sel=null,follow=null;
function dayParams(){const d=new Date(dateStr+'T12:00:00'),m=d.getMonth(),dw=d.getDay(),doy=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),dd=d.getDate();
 sunset=18.9+1.4*Math.cos(2*Math.PI*(doy-172)/365);sunrise=6.85-.38*Math.cos(2*Math.PI*(doy-172)/365);
 let f=[.9,.95,1.2,1.05,.85,1,1.05,.85,.75,.95,1,1.1][m]*(dw==0||dw==6?1.12:1);if((m==10&&dd>=21)||(m==11&&dd>=19)||(m==6&&dd<=5)||(m==2&&dd>=10&&dd<=25))f*=1.28;
 const h=((d.getFullYear()*372+m*31+dd)*2654435761>>>0)/4294967296;att=Math.max(22000,Math.min(80000,Math.round(42000*f*(.9+h*.2)/500)*500));rs=(d.getFullYear()*372+m*31+dd)|0;
 for(const e of EV)if(e.season&&!e.userOn){const md=(m+1)*100+dd;e.on=md>=e.season[0]&&md<=e.season[1]}} // seasonal shows follow the date unless switched by hand
function reset(t0){dayParams();T=t0;guests=[];pend=[0,0,0];dep=[0,0,0];sp=0;ST={arr:0,dep:0};busT=0;RRT=0;
 for(const a of AT){Object.assign(a,{q:[],ri:[],acc:0,down:0,dt:0,posted:5,est:0,wt:0,rides:0,hist:[],hw:0})}
 for(const e of EV){e.key=null;e.ph='idle';e.p=0}
 MONO=[];for(const k in MLINE){const l=MLINE[k];l.trains.forEach(([nm,col],i)=>{const x=(l.sd[0]+i*l.p.L/l.trains.length)%l.p.L;let nx=l.sd.findIndex(d=>d>x+1);if(nx<0)nx=0;
   MONO.push({l:k,nm,col,x,st:i?'run':'dwell',tm:i?0:30,ld:0,at:i?-1:0,nx:i?nx:1%l.sd.length})})}
 FERRY=[{p:0,dir:1,st:'dwell',tm:60,ld:0},{p:1,dir:-1,st:'dwell',tm:150,ld:0}];BUS=[];
 LAUNCH=[];BOATR.forEach((R,r)=>LAUNCH.push({r,x:0,dir:1,tm:20},{r,x:R.loop?R.p.L/2:R.p.L-.01,dir:-1,tm:R.loop?0:80}));}
/* ===== CROWDS =====
   Each guest object is a party of one to six people who go round the park together. On the map every member is drawn:
   strung out behind the leader while walking, gathered in a knot when they stop. Parties keep to the right of the path
   (`lane`), slow down where the crowd is thick (`crowdSlow`), and step off to the side when they take a break.
   DENS is a coarse count of people out in the open, used for the slowing and for the Crowds layer. */
const PARTY=[.08,.35,.57,.83,.94,1]; // share of parties with up to 1, 2, … 6 people
const DCELL=18,DW=Math.ceil(W/DCELL),DH=Math.ceil(H/DCELL),DENS=new Uint16Array(DW*DH);let densAt=-99;
function crowdGrid(){DENS.fill(0);for(const g of guests)if(g.st===0||g.st===4||g.st===5){const i=(g.y/DCELL|0)*DW+(g.x/DCELL|0);if(i>=0&&i<DENS.length)DENS[i]+=g.n}densAt=T}
const crowdAt=(x,y)=>DENS[(y/DCELL|0)*DW+(x/DCELL|0)]||0,crowdSlow=(x,y)=>{const d=crowdAt(x,y);return d<26?1:Math.max(.4,1-(d-26)*.012)};
function mk(x,y,m){[x,y]=paved(x,y,5);const stay=R()<.35?(CLOSE+.4-T/3600)*3600:rr(3.5,8)*3600,r=R();let n=1;while(n<6&&r>PARTY[n-1])n++;
 const g={x,y,tx:x,ty:y,hx:0,hy:-1,node:nearestNode(x,y),goal:GATE,st:5,timer:rr(3,40),intent:'',tgt:-1,n,sz:Math.min(3,n),col:R()*6|0,seed:R()*1e6|0,spd:rr(.85,1.35)*(n>4?.9:1),lane:rr(-.3,2.1),t0:T,ox:rr(-2.2,2.2),oy:rr(-2.2,2.2),leave:Math.min(T+stay,CLOSE*3600+rr(0,2400)),mode:m,v:{},tol:rr(25,80),eat:Math.max(11.3*3600,T+2.5*3600)+rr(0,5400)};guests.push(g);ST.arr++;return g}
function setT(g,n,x,y,i){g.goal=n;g.tx=x;g.ty=y;g.intent=i;g.st=0}
function decide(g){
 if(T<OPEN*3600){if(T<OPEN*3600-50*60)return setT(g,GATE,...paved(GATEXY[0],GATEXY[1]+12,22,GATE),'hold'); // early: wait outside the gate
  const[x,y]=paved(P_.hub[0],P_.hub[1]-6,42);return setT(g,nearestNode(x,y),x,y,'hold')}                              // the last 50 minutes: let in as far as the hub, held there until opening (rope drop)
 if(g.leave<=T||T>=CLOSE*3600+600)return setT(g,GATE,...paved(GATEXY[0],GATEXY[1]+8,10,GATE),'exit');
 const r=R();
 if(T>=g.eat){const c=VN.filter(v=>v.k==='eat'),w=c.map(v=>Math.exp(-dist(g.node,v.nd)/260)*(.4+R()));let b=0;w.forEach((x,i)=>{if(x>w[b])b=i});g.eat=T+rr(4,5.2)*3600;const v=c[b];g.tgt=v.i;return setT(g,v.nd,...paved(N[v.nd][0],N[v.nd][1],2.5,v.nd),'eat')}
 if(r<.09){const c=VN.filter(v=>v.k==='shop'),v=c[R()*c.length|0];g.tgt=v.i;return setT(g,v.nd,...paved(N[v.nd][0],N[v.nd][1],2.5,v.nd),'shop')}
 if(r<.17){const[x,y]=paved(g.x,g.y,7,g.node);g.rest=rr(60,300);return setT(g,g.node,x,y,'rest')} /* take a break: step off to the side of the path first */
 let tot=0;const w=AT.map(a=>{const ok=aOpen(a)&&(LIVENOW&&a.live||T<a.close*3600-300)&&!(a.dt===2&&a.down>0),x=ok?a.pop*Math.exp(-dist(g.node,a.nd)/330)/(1+a.posted/22)*(g.v[a.i]?.3:1)*(LIVENOW&&a.live&&a.live.w!==null?Math.max(.35,Math.min(3,(a.live.w+8)/(a.est+8))):1):0; /* live: guests drift toward the rides whose real lines are longer than ours, so the queues you see track the real ones */tot+=x;return x});
 let u=R()*tot,i=0;for(;i<w.length-1&&(u-=w[i])>0;i++);const a=AT[i];g.tgt=i;setT(g,a.nd,...paved(a.dx,a.dy,3,a.nd),'ride')} // walk to the ride's entrance, not its middle
const aOpen=a=>LIVENOW&&a.live?a.live.st==='OPERATING':T>=a.open*3600&&T<a.close*3600; // live: the park says whether it is running
function arrive(g){switch(g.intent){
 case'ride':{const a=AT[g.tgt];if(!aOpen(a)||(a.dt===2&&a.down>0&&R()<.6)||a.posted>g.tol){g.v[a.i]=1;g.st=5;g.timer=rr(2,20);break}g.st=1;a.q.push(g);break}
 case'eat':g.st=3;g.timer=rr(900,2400);break;case'shop':g.st=3;g.timer=rr(300,900);break;
 case'watch':g.st=4;break;case'rest':g.st=5;g.timer=g.rest||60;break;case'hold':g.st=5;g.timer=Math.max(5,(T<OPEN*3600-3000?OPEN*3600-3000:OPEN*3600)-T+rr(0,90));break; // at the gate: until they are let in; at the hub: until opening
 case'exit':g.st=7;dep[g.mode]++;ST.dep++;break;default:g.st=5;g.timer=10}}
function upd(g,dt){if(g.evT&&T>=g.evT)joinEv(g);if(g.st===1||g.st===2||g.st===4)return;
 if(g.st===3||g.st===5){g.timer-=dt;if(g.timer<=0)decide(g);return}
 let px,py,nx=-1;if(g.node!==g.goal){nx=hop(g.node,g.goal);const a=N[g.node],b=N[nx],ex=b[0]-a[0],ey=b[1]-a[1],el=Math.hypot(ex,ey)||1;px=b[0]-ey/el*g.lane;py=b[1]+ex/el*g.lane}else{px=g.tx;py=g.ty} /* aim for the right-hand side of the path */
 const dx=px-g.x,dy=py-g.y,d=Math.hypot(dx,dy),s=g.spd*dt*crowdSlow(g.x,g.y);
 if(d>.01){const k=Math.min(1,dt*.5+.15);g.hx+=(dx/d-g.hx)*k;g.hy+=(dy/d-g.hy)*k} /* which way the party is facing, eased so the line behind the leader swings round smoothly */
 if(d<=s){g.x=px;g.y=py;if(nx>=0)g.node=nx;else arrive(g)}else{g.x+=dx/d*s;g.y+=dy/d*s}}
const aStat=a=>LIVENOW&&a.live?(a.live.st==='OPERATING'?'Operating':a.live.st==='DOWN'?'Temporarily down':'Closed'):T<a.open*3600?'Closed':T>=a.close*3600?(a.q.length||a.ri.length?'Last riders':'Closed'):a.down>0?(a.dt===2?'Temporarily down':'Delayed'):'Operating';
function updA(a,dt){
 if(a.down>0){a.down-=dt;if(a.down<=0)a.down=a.dt=0;else if(a.dt===2)for(let i=a.q.length-1;i>=0;i--)if(R()<dt/1100){const g=a.q.splice(i,1)[0];g.st=5;g.timer=rr(5,60)}}
 else if(aOpen(a)&&!(LIVENOW&&a.live)&&R()<a.risk*dt/3600){a.dt=R()<.5?1:2;a.down=a.dt===1?rr(180,600):rr(600,2400)}
 if(LIVENOW&&a.live)a.down=a.dt=0; // no made-up breakdowns while the real status is known
 if(a.down<=0&&(LIVENOW&&a.live?a.live.st==='OPERATING':T>=a.open*3600)){a.acc+=a.thr/K/3600*dt;while(a.acc>=1&&a.q.length){const g=a.q.shift();g.st=2;g.timer=a.dur*rr(.92,1.08);a.ri.push(g);a.acc--;a.rides++}if(!a.q.length)a.acc=Math.min(a.acc,1)}
 for(let i=a.ri.length-1;i>=0;i--){const g=a.ri[i];g.timer-=dt;if(g.timer<=0){a.ri.splice(i,1);g.v[a.i]=1;[g.x,g.y]=paved(a.dx,a.dy,4,a.nd);g.node=a.nd;g.st=5;g.timer=rr(15,150)}}
 a.est=a.q.length*K/(a.thr/60);a.hw+=dt;if(a.hw>=60){a.hw=0;const tgt=aStat(a)==='Closed'?0:Math.max(5,a.est+3);a.posted+=(tgt-a.posted)*.35;a.wt=Math.round(a.posted/5)*5}
 if(LIVENOW&&a.live&&a.live.w!==null)a.posted=a.wt=a.live.w; // the real posted wait
 if(a.hist.length===0||T-a.ht>=600){a.hist.push(a.wt);a.ht=T;if(a.hist.length>150)a.hist.shift()}}
/* events */
const hm24=s=>{const m=Math.floor(s/60);return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')},hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(s.trim());return m?(+m[1]*3600+ +m[2]*60):null};
/* Crowds for shows build the way they do in the park. When a show's gathering time begins, the guests who will watch
   it each pick their own moment to head over: a few early birds claim the front, most drift in during the last
   minutes, and stragglers keep arriving after it starts. Spots fill from the front (the kerb, the hub by the castle)
   backwards as the crowd grows, and each guest takes a spot near where they already are. */
function invite(ev,key){ev.nw=0;ev.nexp=0;for(const g of guests){if(g.intent==='exit'||g.st===7||R()>=ev.pref)continue;g.evId=ev.id;g.evK=key;g.evT=key-150-ev.lead*60*R()**2.2;ev.nexp++}}
const isPar=ev=>typeof isParade==='function'?isParade(ev.id):ev.id==='parade',paradeLen=ev=>(typeof parOf==='function'&&parOf(ev.id)?parOf(ev.id).len:300)*OSM.S,paradeHead=ev=>ev.p*(PR.L+paradeLen(ev));
function spot(ev,g){let s=null;for(let i=0;i<8;i++){s=spot0(ev,g);if(!s)return null;if(PAVE(s[0],s[1])){s[4]=0;break}s[4]=1} // only on pavement: try again if the spot fell on a lawn, a building or the water
 s[2]=nearestNode(s[0],s[1]);if(s[4]){s[0]=N[s[2]][0]+rr(-1.5,1.5);s[1]=N[s[2]][1]+rr(-1.5,1.5)}return s}
function spot0(ev,g){ // [x, y, (walk-graph node, filled in by spot), distance along the parade route]
 const near=(x,y,d)=>[x,y,-1,d],f=Math.min(1,ev.nw/Math.max(8,ev.nexp)); // f: how full the viewing areas are
 switch(isPar(ev)?'parade':ev.id){case'parade':{const head=ev.ph==='live'?paradeHead(ev)+30:0;let best=null,bd=1e18; // only where the parade hasn't passed; busiest toward Main Street
   for(let i=0;i<4;i++){const d=PR.L*(.08+.88*R()**.75);if(d<head)continue;const[x,y,a]=PR.at(d),dd=(x-g.x)**2+(y-g.y)**2;if(dd<bd){bd=dd;best=[d,x,y,a]}}
   if(!best)return null;const[d,x,y,a]=best,o=(R()<.5?-1:1)*(6.5+rr(0,1.2+4.8*f));return near(x-Math.sin(a)*o,y+Math.cos(a)*o,d)}
  case'castle':case'welcome':return near(P_.stage[0]+rr(-34,34),P_.stage[1]+rr(14,22+26*f));
  case'band':case'flag':{const k=.4+.6*f;return near(P_.townsq[0]+rr(-22,22)*k,P_.townsq[1]+rr(-14,14)*k)}
  default:{const k=.35+.65*f;if(R()<.55)return near(P_.hub[0]+rr(-55,55)*k,P_.hub[1]+rr(-40,45)*k);const d=rr(0,1)*Math.min(1,.25+f);return near(P_.hub[0]+rr(-11,11),P_.hub[1]+50+d*(P_.townsq[1]-P_.hub[1]-60))}}}
// a guest's moment to head for the show has come
function joinEv(g){const ev=EV.find(e=>e.id===g.evId);if(!ev||ev.key!==g.evK||(ev.ph!=='gather'&&ev.ph!=='live')||g.intent==='exit'){g.evT=0;return}
 if(g.st===1){const a=AT[g.tgt],i=a.q.indexOf(g);if(i<0||R()>=.25){g.evT=0;return}a.q.splice(i,1);g.node=a.nd}   // in a queue: most stay in line
 else if(g.st!==0&&g.st!==5)return;                                                                              // on a ride or eating: go when free
 const s=spot(ev,g);g.evT=0;if(!s)return;ev.nw++;g.pd=s[3];setT(g,s[2],s[0],s[1],'watch')}
// once the last float has gone by, the guests along that stretch drift off and the street fills back in behind the parade
function trail(ev,dt){const tail=paradeHead(ev)-paradeLen(ev)-14;for(const g of guests)if(g.st===4&&g.evId===ev.id&&g.pd<tail&&R()<dt/25){g.st=5;g.timer=rr(3,45);g.evId=null}}
function disperse(ev){for(const g of guests)if(g.st===4&&g.evId===ev.id){g.st=5;g.timer=rr(5,ev.id==='fire'?500:150);if(ev.exit&&R()<ev.exit)g.leave=T}}
function evUpd(ev){let ph='idle',key=null,nx=null;
 if(ev.on!==false)for(const s of ev.t){const a=s-ev.lead*60,b=s+ev.dur*60;if(T>=a&&T<b+60&&key===null){key=s;ph=T<s?'gather':T<b?'live':'done'}if(s>T&&(nx===null||s<nx))nx=s}
 ev.nx=nx;if(key!==ev.key||ph!==ev.ph){if(ph==='gather'&&key!==ev.key)invite(ev,key);if(ph==='live'&&ev.ph!=='live'&&!FF)cue(ev);if((ph==='done'&&ev.ph==='live')||(ph==='idle'&&ev.ph==='gather'))disperse(ev)}
 ev.key=key;ev.ph=ph;ev.p=ph==='live'?(T-key)/(ev.dur*60):ph==='done'?1:0}
/* transport */
function unload(m,x,y,cap){const n=Math.min(Math.floor(pend[m]),cap);pend[m]-=n;for(let i=0;i<n;i++)mk(x+rr(-6,6),y+rr(-3,3),m);return n}
function board(m,cap){const n=Math.min(Math.floor(dep[m]),cap);dep[m]-=n;return n}
function transport(dt){
 for(const m of MONO){const l=MLINE[m.l],L=l.p.L;
  if(m.st==='dwell'){m.tm-=dt;if(m.tm<=0){m.st='run';m.nx=(m.at+1)%l.sd.length}continue}
  const gap=((l.sd[m.nx]-m.x)%L+L)%L;
  if(gap>MSPEED*dt){m.x=(m.x+MSPEED*dt)%L;continue}
  m.x=l.sd[m.nx];m.st='dwell';m.at=m.nx;const stop=l.stops[m.at];m.tm=DWELL(stop);
  if(stop==='mk'){unload(0,P_.monostation[0],P_.monostation[1]-6,l.cap);m.ld=board(0,l.cap)}   // arrivals step off, departures board
  else if(stop==='ttc'||l.stops.indexOf('mk')>m.at)m.ld=Math.min(Math.floor(pend[0]),l.cap); // heading for the park: the guests who will get off there
  else m.ld=Math.floor(m.ld/2)}                                                                // after the park: some get off at each resort
 for(const b of LAUNCH){if(b.tm>0){b.tm-=dt;continue}const R=BOATR[b.r],L=R.p.L,stp=2.6*dt;
  if(R.loop){const nx=R.st.find(d=>d>b.x+.01)??L;if(nx-b.x<=stp){b.x=nx>=L?0:nx;b.tm=50}else b.x+=stp}                                   /* round and round, pausing at each dock */
  else{const nx=b.dir>0?R.st.find(d=>d>b.x+.01)??L:[...R.st].reverse().find(d=>d<b.x-.01)??0;if(Math.abs(nx-b.x)<=stp){b.x=nx;b.tm=70;if(nx<=0||nx>=Math.floor(L))b.dir=-b.dir}else b.x+=b.dir*stp}} /* there and back */
 for(const f of FERRY){if(f.st==='dwell'){f.tm-=dt;if(f.tm<=0)f.st='run'}else{f.p+=f.dir*2.6*dt/FER.L;if(f.p<=0||f.p>=1){f.p=f.p<=0?0:1;f.st='dwell';f.tm=150;if(f.p===0){unload(1,FER.p[0][0],FER.p[0][1]-8,35);f.ld=board(1,35)}else f.ld=0;f.dir=-f.dir}}}
 busT-=dt;if(busT<=0){busT=Math.max(40,pend[2]>10?40:rr(60,110));BUS.push({x:1010,st:'in',tm:0,ld:0,d:['Resorts','EPCOT','Hollywood Studios','Animal Kingdom','Disney Springs'][R()*5|0]})}
 for(let i=BUS.length-1;i>=0;i--){const b=BUS[i];if(b.st==='in'){b.x-=6*dt;if(b.x<=640){b.x=640;b.st='dwell';b.tm=45;unload(2,P_.busstation[0],P_.busstation[1]-8,5);b.ld=board(2,5)}}else if(b.st==='dwell'){b.tm-=dt;if(b.tm<=0)b.st='out'}else{b.x+=6*dt;if(b.x>1015)BUS.splice(i,1)}}
 RRT=(RRT+6*dt)%RR.L}
function step(dt){T+=dt;if(T>=86400){reset(0)}
 const h=Math.max(0,Math.min(23,Math.floor(T/3600-(OPEN-9))));sp+=att*CROWDX*ARR[h]/K/3600*dt;/* the arrival curve moves with the opening time */while(sp>=1){sp--;const r=R();let m=r<.38?0:r<.55?1:r<.85?2:3;if(m===3)mk(GATEXY[0]+rr(-10,10),GATEXY[1]+rr(10,20),3);else pend[m]++}
 if(T-densAt>3||T<densAt)crowdGrid();
 for(const a of AT)updA(a,dt);for(const e of EV){evUpd(e);if(e.ph==='live'&&isPar(e))trail(e,dt)}transport(dt);
 for(let i=guests.length-1;i>=0;i--){const g=guests[i];if(g.st===7){guests[i]=guests[guests.length-1];guests.pop();continue}upd(g,dt)}}
/* SEEKGEN counts deliberate time jumps (slider, ±15, Watch…), so the soundtracks can tell those apart from
   the simulation merely falling behind (background tab, slow frame) — see catchUp() in street.js */
let SEEKGEN=0,CATCHUP=false;
function seek(t,force){t=Math.max(0,Math.min(86399,t));if(!CATCHUP)SEEKGEN++;FF=true;if(force||t<T-1){reset(Math.min(7*3600,t));}while(T<t)step(Math.min(10,t-T));FF=false;lighting()}
function lighting(){const h=T/3600,ev=Math.max(0,Math.min(1,(h-sunset+.25)/1.2)),mo=Math.max(0,Math.min(1,(sunrise+.6-h)/1));nf=h>12?ev:mo;
 gf=h>12?Math.max(0,Math.min(1,(h-(sunset-1.8))/1.8))*(1-nf):Math.max(0,1-Math.abs(h-(sunrise+.5))/1.2)*(1-nf)*.7}
