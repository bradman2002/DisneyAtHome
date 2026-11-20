/* Magic Kingdom resort-area simulator — park data, path graph and guest/attraction/transport simulation.
   Shared globals (classic scripts, so the site also works when opened straight from disk). */
'use strict';
/* ===== DisneyAtHome — structure: DATA / GRAPH / STATIC ART / SIM / AUDIO / RENDER / UI.
   A new park = new DATA block (lands, nodes, edges, attractions, venues, events). ===== */
const $=s=>document.querySelector(s),W=OSM.W,H=OSM.H,K=12,MKR=OSM.regions?OSM.regions[0]:[0,0,W,H],EPR=OSM.regions&&OSM.regions[1],HSR=OSM.regions&&(OSM.nparks||2)>2?OSM.regions[2]:null,AKR=OSM.regions&&(OSM.nparks||2)>3?OSM.regions[3]:null,MDX=OSM.dx||0; /* HSR: Hollywood Studios; AKR: Animal Kingdom; MDX: how far right the map moved when Animal Kingdom was added (for the few fixed spots below) */ /* MKR: the Magic Kingdom resort area; EPR: Epcot (the map between them is blank for now) */
let OPEN=9,CLOSE=22,EOPEN=9,ECLOSE=21,HOPEN=9,HCLOSE=21,AOPEN=8,ACLOSE=19,LIVENOW=false,CROWDX=1; /* EOPEN/ECLOSE: EPCOT's hours */ // park hours (live mode sets today's real ones); LIVENOW: real wait times and closures apply right now (see live.js)
 // K = real guests represented by one party on the map; CROWDX scales arrivals (live mode sets it from how busy the real park is)
/* ===== DATA: built from the OpenStreetMap geometry in park-osm.js (real walkways, buildings and positions) ===== */
const P_=OSM.places,POS=OSM.pos;
const ptIn=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
const polyC=p=>{let x=0,y=0;for(const q of p){x+=q[0];y+=q[1]}return[x/p.length,y/p.length]};
const LANDNAME={ms:'Main Street, U.S.A.',adv:'Adventureland',fr:'Frontierland',lib:'Liberty Square',fan:'Fantasyland',tom:'Tomorrowland',wc:'World Celebration',wd:'World Discovery',wn:'World Nature',ws:'World Showcase',hb:'Hollywood Boulevard',el:'Echo Lake',ga:'Grand Avenue',sw:'Star Wars: Galaxy’s Edge',ts:'Toy Story Land',ac:'Animation Courtyard',sb:'Sunset Boulevard',oa:'Oasis',di:'Discovery Island',pa:'Pandora – The World of Avatar',af:'Africa',as:'Asia'};
const EPL=new Set(['wc','wd','wn','ws']),HSL=new Set(['hb','el','ga','sw','ts','ac','sb']),AKL=new Set(['oa','di','pa','af','as']),parkOf=l=>EPL.has(l)?1:HSL.has(l)?2:AKL.has(l)?3:0; /* EPCOT's neighbourhoods, Hollywood Studios' and Animal Kingdom's lands; park 0 = Magic Kingdom, 1 = EPCOT, 2 = Hollywood Studios, 3 = Animal Kingdom */
// label/ambience centre for each land (inside its real boundary, near its main plaza)
const LC={ms:[P_.mainst[0],P_.mainst[1]+40],hub:P_.hub,adv:POS['The Magic Carpets of Aladdin'].c,fr:[POS['Country Bear Musical Jamboree'].c[0]-30,POS['Country Bear Musical Jamboree'].c[1]-30],lib:[POS['The Hall of Presidents'].c[0]-25,POS['The Hall of Presidents'].c[1]+18],fan:[P_.castle[0]+60,P_.castle[1]-110],tom:[POS['Astro Orbiter'].c[0]+10,POS['Astro Orbiter'].c[1]-70]};
if(P_.sse&&POS['Test Track']){LC.wc=[P_.sse[0],P_.sse[1]+120];LC.wd=[POS['Test Track'].c[0]+10,POS['Test Track'].c[1]-85];LC.wn=[POS['Living with the Land'].c[0]+60,POS['Living with the Land'].c[1]+80];LC.ws=[POS['The American Adventure'].c[0],POS['The American Adventure'].c[1]-120]}
if(OSM.hs)for(const k of HSL)if(OSM.lands[k])LC[k]=polyC(OSM.lands[k]);
if(OSM.ak)for(const k of AKL)if(OSM.lands[k])LC[k]=polyC(OSM.lands[k]); /* Animal Kingdom's lands too */ /* Hollywood Studios: each area's middle, from its outline in the map data */
const PARK={name:'Magic Kingdom',
LANDS:Object.fromEntries(Object.entries(LC).map(([k,c])=>[k,[k==='hub'?'Central Hub':LANDNAME[k],c[0],c[1]]])),
SC:{ms:['#f3e0c8','#a9433f'],hub:['#eadfc8','#8a6a3a'],adv:['#d8b46a','#6e8a3a'],fr:['#a8754a','#5a4030'],lib:['#e6e1d4','#4b5f7f'],fan:['#f1d6e4','#8c63b5'],tom:['#d7e3ec','#4f84b2'],wc:['#e9edf2','#6a5aa8'],wd:['#e2e6ee','#c0563a'],wn:['#e2efdc','#3f8a5a'],ws:['#efe2c8','#a8693f'],hb:['#f3e3cf','#c0463a'],el:['#e3edf2','#3f7fa8'],ga:['#eadfd2','#7a5a8a'],sw:['#dccab0','#7a5a3a'],ts:['#f6e8c8','#d9473f'],ac:['#e9e2f2','#5a6ad0'],sb:['#f2dcc8','#b0532f']},
N:OSM.nodes,E:OSM.edges,
// display name, OpenStreetMap name, land, throughput/hr, ride sec, popularity, kind, open, close, breakdown risk/hr
A:[['Jungle Cruise','Jungle Cruise','adv',1800,540,1.0,'box'],['Pirates of the Caribbean','Pirates of the Caribbean','adv',1800,500,1.0,'box'],['Magic Carpets of Aladdin','The Magic Carpets of Aladdin','adv',900,90,.5,'spin'],['Enchanted Tiki Room',"Walt Disney's Enchanted Tiki Room",'adv',1500,720,.4,'box',9,21],['Swiss Family Treehouse','Swiss Family Treehouse','adv',1200,600,.3,'tree',9,21],
['Big Thunder Mountain','Big Thunder Mountain Railroad','fr',1700,240,1.3,'mtn',9,22,1.1],['Tiana’s Bayou Adventure',"Tiana's Bayou Adventure",'fr',1500,600,1.4,'mtn2'],['Country Bear Musical Jamboree','Country Bear Musical Jamboree','fr',1400,900,.4,'box'],
['Haunted Mansion','The Haunted Mansion','lib',1800,420,1.2,'house'],['Hall of Presidents','The Hall of Presidents','lib',1800,1380,.3,'box',9,19],
['Seven Dwarfs Mine Train','Seven Dwarfs Mine Train','fan',1400,180,1.9,'mtn3',9,22,1.2],['Peter Pan’s Flight',"Peter Pan's Flight",'fan',1000,190,1.4,'box'],['“it’s a small world”','"it\'s a small world"','fan',2200,660,.7,'box'],['Winnie the Pooh','The Many Adventures of Winnie the Pooh','fan',1500,200,.8,'box'],['Under the Sea','Under the Sea: Journey of the Little Mermaid','fan',1400,360,.8,'box'],['PhilharMagic',"Mickey's PhilharMagic",'fan',2000,720,.6,'box'],['Dumbo the Flying Elephant','Dumbo the Flying Elephant','fan',900,100,.8,'spin'],
['Mad Tea Party','Mad Tea Party','fan',1100,90,.6,'spin'],['Prince Charming Regal Carrousel','Prince Charming Regal Carrousel','fan',1500,120,.4,'spin'],['The Barnstormer','The Barnstormer','fan',1000,60,.6,'box'],
['Space Mountain','Space Mountain','tom',1700,180,1.7,'dome',9,22,1.0],['TRON Lightcycle / Run','TRON Lightcycle / Run','tom',1400,120,1.9,'tron',9,22,1.4],['Buzz Lightyear Space Ranger Spin',"Buzz Lightyear's Space Ranger Spin",'tom',1700,300,.9,'box'],['Tomorrowland Speedway','Tomorrowland Speedway','tom',1400,300,.6,'track',9,21],['PeopleMover','Tomorrowland Transit Authority PeopleMover','tom',2400,600,.5,'pm'],['Carousel of Progress',"Walt Disney's Carousel of Progress",'tom',2400,1260,.3,'box',9,20],['Astro Orbiter','Astro Orbiter','tom',700,90,.4,'spin'],['Monsters Inc. Laugh Floor','Monsters, Inc. Laugh Floor','tom',1500,900,.4,'box'],['Town Square Theater','Town Square Theater','ms',900,420,.6,'box',9,21],
// EPCOT (hours are relative to its own 9 to 9; most of World Showcase opens at 11)
['Spaceship Earth','Spaceship Earth','wc',2400,960,.55,'dome',9,21],['Guardians of the Galaxy: Cosmic Rewind','Guardians Of The Galaxy: Cosmic Rewind','wd',1500,180,2.0,'box',9,21,1.2],['Test Track','Test Track','wd',1300,300,1.6,'box',9,21,1.4],['Mission: SPACE','Mission: SPACE','wd',1600,330,.6,'box',9,21,1.0],
['Soarin’','Soarin\' Around The World','wn',2000,330,1.4,'box',9,21],['Living with the Land','Living with the Land','wn',2000,840,.6,'box',9,21],['The Seas with Nemo & Friends','The Seas with Nemo & Friends','wn',1800,240,.5,'box',9,21],['Turtle Talk with Crush','Turtle Talk with Crush','wn',1400,900,.3,'box',9,21],
['Journey Into Imagination with Figment','Journey Into Imagination With Figment','wn',1800,420,.5,'box',9,21],['Journey of Water','Journey of Water, Inspired by Moana','wn',1200,600,.45,'box',9,21],['Awesome Planet','Awesome Planet','wn',1500,600,.2,'box',9,21],
['Frozen Ever After','Frozen Ever After','ws',1100,300,2.0,'box',9,21,1.2],['Remy’s Ratatouille Adventure','Remy’s Ratatouille Adventure','ws',1400,300,1.7,'box',9,21],['Gran Fiesta Tour','Gran Fiesta Tour Starring The Three Caballeros','ws',1500,480,.5,'box',11,21],['Reflections of China','Reflections of China','ws',1500,840,.3,'box',11,21],
['Canada Far and Wide','Canada Far and Wide','ws',1500,900,.3,'box',11,21],['Impressions de France','Impressions de France;Beauty and the Beast Sing-Along','ws',1500,780,.3,'box',11,21],['The American Adventure','The American Adventure','ws',1800,1800,.4,'box',11,21],
// Hollywood Studios (hours relative to its own 9 to 9; the stage shows run 10 to 8)
['Tower of Terror','The Twilight Zone Tower of Terror','sb',1800,240,1.6,'box',9,21,1.1],['Rock ’n’ Roller Coaster','Rock ’n’ Roller Coaster Starring The Muppets','sb',1800,90,1.5,'box',9,21,1.3],
['Mickey & Minnie’s Runaway Railway',"Mickey and Minnie's Runaway Railway",'hb',1700,300,1.2,'box',9,21],['Rise of the Resistance','Star Wars: Rise of the Resistance','sw',1500,900,2.1,'box',9,21,1.5],
['Millennium Falcon: Smugglers Run','Millennium Falcon: Smugglers Run','sw',1500,300,1.2,'box',9,21,1.1],['Star Tours','Star Tours: The Adventures Continue','el',1800,420,.8,'box',9,21],
['Slinky Dog Dash','Slinky Dog Dash','ts',1300,120,1.9,'box',9,21,1.1],['Toy Story Mania!','Toy Story Mania!','ts',1600,420,1.2,'box',9,21],['Alien Swirling Saucers','Alien Swirling Saucers','ts',900,150,.7,'spin',9,21],
['Indiana Jones Epic Stunt Spectacular!','Indiana Jones Epic Stunt Spectacular!','el',2000,1800,.5,'box',10,20],['Beauty and the Beast – Live on Stage','Theater of the Stars','sb',1500,1500,.5,'box',10,20],
['The Little Mermaid – A Musical Adventure','Voyage of the Little Mermaid','ac',1500,1500,.5,'box',10,20],['Frozen Sing-Along Celebration','Hyperion Theater','el',1500,1800,.6,'box',10,20],
['Mickey Mouse Clubhouse Live!','Disney Junior Dance Party!','ac',1200,1320,.35,'box',10,19],['Walt Disney Presents','Walt Disney Presents','ac',1200,900,.2,'box',9,21],
['Vacation Fun','Mickey Shorts Theater','el',1200,600,.2,'box',9,21],['Muppet*Vision 3D',"Jim Henson's Muppet*Vision 3-D",'ga',1800,1020,.35,'box',9,21],['Olaf Draws!','The Magic of Disney Animation','ac',1000,600,.25,'box',10,20],
// Animal Kingdom (opens at 8, closes at 7 by default): Festival of the Lion King plays in Harambe Theatre, Finding Nemo in Theater In The Wild
['Flight of Passage','Avatar Flight of Passage','pa',1300,300,2.0,'box',8,19,1.2],["Na'vi River Journey","Na'vi River Journey",'pa',1500,300,1.3,'box',8,19,1.0],['Kilimanjaro Safaris','Kilimanjaro Safaris','af',2800,1320,1.3,'box',8,19,.8],
['Expedition Everest','Expedition Everest: Legend of the Forbidden Mountain','as',1800,240,1.6,'mtn',8,19,1.2],['Kali River Rapids','Kali River Rapids','as',1500,420,1.1,'box',9,19,1.1],['Zootopia: Better Zoogether!','Zootopia: Better Zoogether!','di',1800,1080,.5,'box',9,18],
['Wildlife Express Train','Wildlife Express Train','af',1200,420,.3,'box',9,17],['Gorilla Falls Trail','Gorilla Falls Exploration Trail','af',2400,1200,.4,'box',8,19,.2],['Maharajah Jungle Trek','Maharajah Jungle Trek','as',2400,1200,.4,'box',8,19,.2],
['Festival of the Lion King','Harambe Theatre','af',2400,1800,.7,'box',10,18],['Finding Nemo: The Big Blue… and Beyond!','Theater In The Wild','di',1800,1500,.4,'box',10,18],['The Oasis Exhibits','The Oasis Exhibits','oa',2400,600,.15,'box',8,19,.1],['Discovery Island Trails','Discovery Island Trails','di',2400,600,.15,'box',8,19,.1]].filter(r=>POS[r[1]]),
// venues: display name, OpenStreetMap name, kind
V:[['Emporium','Emporium','shop'],['Main Street Confectionery','Main Street Confectionery','shop'],['Casey’s Corner',"Casey's Corner",'eat'],['The Plaza Restaurant','The Plaza Restaurant','eat'],['The Crystal Palace','The Crystal Palace','eat'],['Agrabah Bazaar','Agrabah Bazaar','shop'],['Columbia Harbour House','Columbia Harbor House','eat'],['Pecos Bill Tall Tale Inn','Pecos Bill Tale Tale Inn and Café','eat'],['Frontier Trading Post','Frontier Trading Post','shop'],['Be Our Guest','Be Our Guest Restaurant','eat'],['Storybook Treats','Storybook Treats','eat'],['Cosmic Ray’s Starlight Café',"Cosmic Ray's Starlight Café",'eat'],['Star Traders',"Mickey's Star Traders",'shop'],
 ['Sunshine Seasons','Sunshine Seasons','eat','wn'],['Regal Eagle Smokehouse','Regal Eagle Smokehouse: Craft Drafts & Barbecue','eat','ws'],['Katsura Grill','Katsura Grill','eat','ws'],['Les Halles Boulangerie','Les Halles Boulangerie & Pâtisserie','eat','ws'],['Via Napoli','Via Napoli Ristorante e Pizzeria','eat','ws'],
 ['La Cantina de San Angel','La Cantina de San Angel','eat','ws'],['Lotus Blossom Café','Lotus Blossom Cafe','eat','ws'],['Yorkshire County Fish Shop','Yorkshire County Fish Shop','eat','ws'],['Space 220','Space 220 Restaurant','eat','wd'],['Sommerfest','Sommerfest','eat','ws'],['Tangierine Café','Tangierine Cafe','eat','ws'],['Kringla Bakeri Og Kafe','Kringla Bakeri Og Kafe','eat','ws'],
 ['50’s Prime Time Café',"50's Prime Time Cafe",'eat','el'],['Hollywood & Vine','Hollywood and Vine','eat','el'],['The Hollywood Brown Derby','The Hollywood Brown Derby','eat','hb'],['ABC Commissary','ABC Commissary','eat','el'],
 ['Roundup Rodeo BBQ','Roundup Rodeo BBQ','eat','ts'],['PizzeRizzo','Pizza Rizzo','eat','ga'],['Mama Melrose’s Ristorante Italiano',"Mama Melrose's Ristorante Italiano",'eat','ga'],['Sci-Fi Dine-In Theater','Sci-Fi Dine-In Theater','eat','ga'],['Docking Bay 7','Docking Bay 7 Food and Cargo','eat','sw'],['Ronto Roasters','Ronto Roasters','eat','sw'],
 ['Woody’s Lunch Box',"Woody's Lunch Box",'eat','ts'],['Backlot Express','Backlot Express','eat','el'],['Oga’s Cantina',"Oga's Cantina",'eat','sw'],['Min and Bill’s Dockside Diner',"Min and Bill's Dockside Diner",'eat','el'],
 ['Rosie’s All-American Café',"Rosie's All-American Café",'eat','sb'],['Catalina Eddie’s',"Catalina Eddie's",'eat','sb'],['Mickey’s of Hollywood',"Mickey's of Hollywood",'shop','hb'],['Tower Hotel Gifts','Tower Hotel Gifts','shop','sb'],
 ['Dok-Ondar’s Den of Antiquities','Dok-Ondar’s Den of Antiquities','shop','sw'],['Celebrity 5 & 10','Celebrity 5 & 10','shop','hb'],
 ["Satu'li Canteen","Satu'li Canteen",'eat','pa'],['Flame Tree Barbecue','Flame Tree Barbecue','eat','di'],['Pizzafari','Pizzafari','eat','di'],['Harambe Market','Harambe Market','eat','af'],['Yak & Yeti','Yak & Yeti Restaurant','eat','as'],
 ['Tiffins','Tiffins','eat','di'],['Yak & Yeti Local Foods Cafe','Yak & Yeti Local Foods Cafe','eat','as'],['Tamu Tamu Refreshments','Tamu Tamu Refreshments','eat','af']].filter(r=>POS[r[1]]),
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
 {id:'kiss',n:'Kiss Goodnight',ts:['22:30'],dur:3,lead:0,pref:0,rel:['close',1800]},
 // EPCOT's nighttime show on World Showcase Lagoon, at EPCOT's closing time (its length is the soundtrack's, see luminous.js)
 {id:'lum',n:'Luminous: The Symphony of Us',ts:['21:00'],dur:18.2,lead:35,pref:.6,exit:.75,rel:['eclose',0],pk:1},
 // Hollywood Studios' nighttime show in the Hollywood Hills Amphitheater, an hour before the park closes (today's real times when live; see fantasmic.js)
 {id:'fmic',n:'Fantasmic!',ts:['20:00'],dur:29.4,lead:45,pref:.55,exit:.7,rel:['hclose',-3600],pk:2}]};
const {LANDS,SC,N,E,V,EV}=PARK;
const AT=PARK.A.map((r,i)=>{const p=POS[r[1]],pk=parkOf(r[2]);return{i,n:r[0],osm:r[1],l:r[2],pk,x:p.c[0],y:p.c[1],nd:p.nd,dx:N[p.nd][0],dy:N[p.nd][1],thr:r[3],dur:r[4],pop:r[5],k:r[6],open:r[7]||9,close:r[8]||(pk?21:22),o0:r[7]||9,c0:r[8]||(pk?21:22),c00:pk?21:22,risk:r[9]||.7}});
/* Muppet*Vision 3D closed in 2024, so there's no real wait for it: it shows a fixed placeholder wait while it runs (a.ph, minutes) */
{const M=AT.find(a=>a.osm==="Jim Henson's Muppet*Vision 3-D");if(M)M.ph=15}
/* Cosmic Rewind's map outline runs from the pavilion out through the tunnel to the show building backstage, so its middle lands on a service road: the wait sits over the pavilion guests walk into instead */
{const G=AT.find(a=>a.osm==='Guardians Of The Galaxy: Cosmic Rewind');if(G){G.x=4240+MDX;G.y=5450}}
/* Soarin' and Awesome Planet are inside The Land: guests go in by its door, not the nearest path to the far side of the building */
{const L=AT.find(a=>a.osm==='Living with the Land');if(L)for(const a of AT)if(a.osm==='Soarin\' Around The World'||a.osm==='Awesome Planet'){a.nd=L.nd;a.dx=L.dx;a.dy=L.dy}}
const VN=V.map((r,i)=>{const p=POS[r[1]];return{i,n:r[0],osm:r[1],k:r[2],l:r[3],pk:r[3]?parkOf(r[3]):0,x:p.c[0],y:p.c[1],nd:p.nd,dr:0}});
// set the park's hours; each ride keeps its own offset from them (a ride that normally shuts an hour early still does)
// shows whose time follows the park's hours (the welcome show five minutes before opening, the Kiss Goodnight half an hour after closing)
function relTimes(){for(const e of EV)if(e.rel&&Array.isArray(e.t)){const t=(e.rel[0]==='open'?OPEN:e.rel[0]==='eclose'?ECLOSE:e.rel[0]==='hclose'?HCLOSE:CLOSE)*3600+e.rel[1];e.t=[Math.min(t,86400-e.dur*60-90)]}}
function setHours(o,c){OPEN=o;CLOSE=c;relTimes();for(const a of AT)if(!a.pk){a.open=o+(a.o0-9);a.close=Math.max(a.open+1,c-(22-a.c0))}}
function setHoursEP(o,c){EOPEN=o;ECLOSE=c;relTimes();for(const a of AT)if(a.pk===1){a.open=o+(a.o0-9);a.close=Math.max(a.open+1,c-(21-a.c0))}}
function setHoursHS(o,c){HOPEN=o;HCLOSE=c;relTimes();for(const a of AT)if(a.pk===2){a.open=o+(a.o0-9);a.close=Math.max(a.open+1,c-(21-a.c0))}}
function setHoursAK(o,c){AOPEN=o;ACLOSE=c;relTimes();for(const a of AT)if(a.pk===3){a.open=o+(a.o0-8);a.close=Math.max(a.open+1,c-(19-a.c0))}} /* Animal Kingdom's: its rides' times are written against an 8 am to 7 pm day */
const pOpen=pk=>pk===3?AOPEN:pk===2?HOPEN:pk?EOPEN:OPEN,pClose=pk=>pk===3?ACLOSE:pk===2?HCLOSE:pk?ECLOSE:CLOSE;
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
const STOPNAME={epst:'EPCOT',ttc:'Ticket and Transportation Center',poly:'Polynesian Village',gf:'Grand Floridian',mk:'Magic Kingdom',cont:'Contemporary'};
const MLINE={express:{n:'Express',stops:['ttc','mk'],cap:25,trains:[['Red','#d6453b'],['Coral','#f08a7a'],['Orange','#ee8a2c']]},
 resort:{n:'Resort',stops:['ttc','poly','gf','mk','cont'],cap:10,trains:[['Blue','#3a7bd5'],['Green','#3f9a55'],['Gold','#d9a520']]}};
/* the EPCOT line (when the land between the parks is on the map): from the Ticket Center round over Future World into
   EPCOT's station and straight back. Its trains carry scenery passengers only: EPCOT's guests start at its gate. */
if(OSM.mono.epcot&&P_.epst)MLINE.epcot={n:'EPCOT',stops:['ttc','epst'],cap:25,trains:[['Teal','#1f9e95'],['Lime','#8cc63f'],['Peach','#f4a582'],['Silver','#9aa3ad']]};
for(const k in MLINE){const l=MLINE[k];l.k=k;l.p=mkPath(OSM.mono[k]);l.sd=l.stops.map(s=>l.p.proj(...P_[s])).map(d=>d>=l.p.L-20?0:d)} /* a station at the loop's start/end counts as its start */
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
const DWELL=s=>s==='mk'?45:s==='ttc'||s==='epst'?60:35;
// trains heading for a station, soonest first: [{m, t seconds}]
function monoEta(stop){const out=[];for(const m of MONO){const l=MLINE[m.l],si=l.stops.indexOf(stop),L=l.p.L;if(si<0)continue;if(m.st==='dwell'&&m.at===si){out.push({m,t:0});continue}
  const gap=((l.sd[si]-m.x)%L+L)%L;let t=(m.st==='dwell'?m.tm:0)+gap/MSPEED;l.sd.forEach((d,j)=>{const g=((d-m.x)%L+L)%L;if(j!==si&&g>.5&&g<gap)t+=DWELL(l.stops[j])});out.push({m,t})}return out.sort((a,b)=>a.t-b.t)}
/* where a ferry is drawn: on the route, but out to its own side (keeping right) in mid-lagoon, so two boats
   crossing in opposite directions pass each other instead of sailing through one another */
function ferXY(f){const[x,y,an]=FER.at(f.p*FER.L),o=f.dir*9*Math.sin(Math.PI*f.p);return[x-Math.sin(an)*o,y+Math.cos(an)*o,an]}
const MSPEED=14,monoXY=(m,off)=>{const l=MLINE[m.l].p;return l.at((((m.x+(off||0))%l.L)+l.L)%l.L)};
/* Resort boats (shown only; no guests modelled), each on its real route: the launch that circles Magic Kingdom, the Grand
   Floridian and the Polynesian; the boats from Magic Kingdom to Fort Wilderness and to Wilderness Lodge; and the launch
   that circles Fort Wilderness, the Contemporary and Wilderness Lodge on Bay Lake.
   A route is {p: path, loop, st: distances of its stops, col, n: name}. */
const BOATR=[];{const B=OSM.boats||{},add=(pts,loop,stops,col,n,fs)=>{if(!pts||pts.length<4)return;const p=mkPath(pts),st=[...new Set([0,...stops.filter(Boolean).map(q=>Math.round(p.proj(...q))),loop?0:Math.floor(p.L)])].sort((a,b)=>a-b);BOATR.push({p,loop,st,col,n,fs})};
 add(OSM.launchPath,true,[P_.gf,P_.poly],'#d9a520','Gold flag launch');add(B.fw,false,[],'#2f7d5a','Fort Wilderness boat');add(B.wl,false,[],'#b3262e','Wilderness Lodge boat');add(B.blue,true,[P_.fw,P_.wldock],'#2f6fd6','Blue flag launch');
 /* the Friendship boats (bigger, drawn their own way): EPCOT's International Gateway to Hollywood Studios by way of the BoardWalk, the
    Yacht & Beach Club and the Swan & Dolphin; and two loops across World Showcase Lagoon, Showcase Plaza to Germany and to Morocco */
 add(B.fsc,false,[P_.bwdock,P_.bydock,P_.sddock],'#1d8fa8','Friendship boat · EPCOT – BoardWalk – Yacht & Beach Club – Swan & Dolphin – Hollywood Studios',true);
 for(const k of['fsw','fse'])if(B[k]){const a=B[k][0],far=B[k].reduce((m,q)=>Math.hypot(q[0]-a[0],q[1]-a[1])>Math.hypot(m[0]-a[0],m[1]-a[1])?q:m,a);
  add(B[k],true,[far],'#1d8fa8','Friendship boat · Showcase Plaza – '+(Math.max(a[0],far[0])>4200+MDX?'Germany':'Morocco'),true)}}
const GATEXY=N[GATE],EPGATE=OSM.keys.epgate??null,EPGATEXY=EPGATE!==null?N[EPGATE]:null, /* EPCOT's main entrance */
 HSGATE=OSM.keys.hsgate??null,HSGATEXY=HSGATE!==null?N[HSGATE]:null,AKGATE=OSM.keys.akgate??null,AKGATEXY=AKGATE!==null?N[AKGATE]:null,PGATE=[GATE,EPGATE,HSGATE,AKGATE],PGATEXY=[GATEXY,EPGATEXY,HSGATEXY,AKGATEXY]; /* Hollywood Studios' entrance; each park's gate by park number */
/* Where guests may stand: every paved place in the map data (plazas, walkways and queue paths), minus building
   footprints and the Speedway track. Guests walk along the path network, but the exact spot they stop at (outside a
   ride, watching a show, waiting at the gate) is checked against this, so nobody ends up on a track, a lawn or the water. */
const PAVE1=R0=>{const q=2,gw=Math.ceil((R0[2]-R0[0])/q),gh=Math.ceil((R0[3]-R0[1])/q),k=document.createElement('canvas');k.width=gw;k.height=gh;const c=k.getContext('2d');c.scale(1/q,1/q);c.translate(-R0[0],-R0[1]);c.fillStyle=c.strokeStyle='#000';c.lineCap=c.lineJoin='round';
 const ring=r=>{r.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()};
 for(const a of OSM.areas)if(a.k==='ped'){c.beginPath();ring(a.o);for(const r of a.i||[])ring(r);c.fill('evenodd')}
 for(const p of OSM.paths){c.beginPath();p.p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(p.a)c.fill();else{c.lineWidth=Math.max(2.6,p.w);c.stroke()}}
 c.globalCompositeOperation='destination-out';for(const b of OSM.buildings)if(b.p.length>2&&b.k!=='roof'){c.beginPath();ring(b.p);c.fill()}
 c.lineWidth=7;for(const l of OSM.lines)if(l.k==='race')for(const p of l.p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
 const d=c.getImageData(0,0,gw,gh).data;return(x,y)=>{const i=Math.floor((x-R0[0])/q),j=Math.floor((y-R0[1])/q);return i>=0&&j>=0&&i<gw&&j<gh&&d[(j*gw+i)*4+3]>128}};
const PAVE=(()=>{const P0=PAVE1(MKR),P1=EPR?PAVE1(EPR):null,P2=HSR?PAVE1(HSR):null,P3=AKR?PAVE1(AKR):null;return(x,y)=>P3&&x>=AKR[0]&&y>=AKR[1]&&x<=AKR[2]&&y<=AKR[3]?P3(x,y):P2&&x>=HSR[0]&&y>=HSR[1]&&x<=HSR[2]&&y<=HSR[3]?P2(x,y):P1&&x>=EPR[0]&&y>=EPR[1]?P1(x,y):P0(x,y)})(); /* one mask per park area (Magic Kingdom with its resorts, EPCOT, Hollywood Studios) */
// Each ride and venue is entered from the nearest point on the path network that is out in the open (the closest point
// can be an indoor queue path under the building's roof, where guests would be drawn standing on the roof).
for(const o of[...AT,...VN]){const seen=new Set([o.nd]);let q=[o.nd],hit=PAVE(...N[o.nd])?o.nd:-1;for(let d=0;d<8&&hit<0&&q.length;d++){const nx=[];for(const u of q)for(const[v]of ADJ[u]){if(seen.has(v))continue;seen.add(v);if(PAVE(...N[v])){hit=v;break}nx.push(v)}q=nx}
 if(hit>=0)o.nd=hit;o.dx=N[o.nd][0];o.dy=N[o.nd][1]}
// a paved spot within r of (x,y); if none turns up, the nearest point of the path network itself
function paved(x,y,r,nd){for(let i=0;i<12;i++){const px=x+rr(-r,r),py=y+rr(-r,r);if(PAVE(px,py))return[px,py]}const n=N[nd??nearestNode(x,y)];return[n[0]+rr(-1.2,1.2),n[1]+rr(-1.2,1.2)]}
/* ===== SIMULATION ===== */
let T=9*3600,speed=1,playing=true,FF=false,dateStr='2026-11-12',att=50000,nf=0,gf=0,sunset=17.7,sunrise=7.2,rs=1;
const R=()=>{rs|=0;rs=rs+0x6D2B79F5|0;let t=Math.imul(rs^rs>>>15,1|rs);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},rr=(a,b)=>a+R()*(b-a);
const EPATT=.8,HSATT=.75,AKATT=.65; /* EPCOT's and Hollywood Studios' crowds relative to Magic Kingdom's */
let guests=[],pend=[0,0,0],dep=[0,0,0],sp=0,spE=0,spH=0,spA=0,ST={arr:0,dep:0},ARR=[0,0,0,0,0,0,0,0,.14,.2,.15,.1,.08,.07,.06,.05,.04,.04,.03,.02,.02,0,0,0],MODE=[.38,.17,.3,.15];
let MONO=[],FERRY=[],LAUNCH=[],BUS=[],busT=0,RRT=0,sel=null,follow=null;
function dayParams(){const d=new Date(dateStr+'T12:00:00'),m=d.getMonth(),dw=d.getDay(),doy=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),dd=d.getDate();
 sunset=18.9+1.4*Math.cos(2*Math.PI*(doy-172)/365);sunrise=6.85-.38*Math.cos(2*Math.PI*(doy-172)/365);
 let f=[.9,.95,1.2,1.05,.85,1,1.05,.85,.75,.95,1,1.1][m]*(dw==0||dw==6?1.12:1);if((m==10&&dd>=21)||(m==11&&dd>=19)||(m==6&&dd<=5)||(m==2&&dd>=10&&dd<=25))f*=1.28;
 const h=((d.getFullYear()*372+m*31+dd)*2654435761>>>0)/4294967296;att=Math.max(22000,Math.min(80000,Math.round(42000*f*(.9+h*.2)/500)*500));rs=(d.getFullYear()*372+m*31+dd)|0;
 for(const e of EV)if(e.season&&!e.userOn){const md=(m+1)*100+dd;e.on=md>=e.season[0]&&md<=e.season[1]}} // seasonal shows follow the date unless switched by hand
function reset(t0){dayParams();T=t0;guests=[];pend=[0,0,0];dep=[0,0,0];sp=0;spE=0;spH=0;spA=0;ST={arr:0,dep:0};busT=0;RRT=0;
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
function mk(x,y,m,pk){pk=pk||0;[x,y]=paved(x,y,5);const CL=pClose(pk),stay=R()<.35?(CL+.4-T/3600)*3600:rr(3.5,8)*3600,r=R();let n=1;while(n<6&&r>PARTY[n-1])n++;
 const g={pk,x,y,tx:x,ty:y,hx:0,hy:-1,node:nearestNode(x,y),goal:PGATE[pk],st:5,timer:rr(3,40),intent:'',tgt:-1,n,sz:Math.min(3,n),col:R()*6|0,seed:R()*1e6|0,spd:rr(.85,1.35)*(n>4?.9:1),lane:rr(-.3,2.1),t0:T,ox:rr(-2.2,2.2),oy:rr(-2.2,2.2),leave:Math.min(T+stay,CL*3600+rr(0,2400)),mode:m,v:{},tol:rr(25,80),eat:Math.max(11.3*3600,T+2.5*3600)+rr(0,5400)};guests.push(g);ST.arr++;return g}
function setT(g,n,x,y,i){g.goal=n;g.tx=x;g.ty=y;g.intent=i;g.st=0}
function decide(g){
 if(g.pk)return decideEP(g);
 if(T<OPEN*3600){if(T<OPEN*3600-50*60)return setT(g,GATE,...paved(GATEXY[0],GATEXY[1]+12,22,GATE),'hold'); // early: wait outside the gate
  const[x,y]=paved(P_.hub[0],P_.hub[1]-6,42);return setT(g,nearestNode(x,y),x,y,'hold')}                              // the last 50 minutes: let in as far as the hub, held there until opening (rope drop)
 if(g.leave<=T||T>=CLOSE*3600+600)return setT(g,GATE,...paved(GATEXY[0],GATEXY[1]+8,10,GATE),'exit');
 const r=R();
 if(T>=g.eat){const c=VN.filter(v=>v.k==='eat'&&!v.pk),w=c.map(v=>Math.exp(-dist(g.node,v.nd)/260)*(.4+R()));let b=0;w.forEach((x,i)=>{if(x>w[b])b=i});g.eat=T+rr(4,5.2)*3600;const v=c[b];g.tgt=v.i;return setT(g,v.nd,...paved(N[v.nd][0],N[v.nd][1],2.5,v.nd),'eat')}
 if(r<.09){const c=VN.filter(v=>v.k==='shop'&&!v.pk),v=c[R()*c.length|0];g.tgt=v.i;return setT(g,v.nd,...paved(N[v.nd][0],N[v.nd][1],2.5,v.nd),'shop')}
 if(r<.17){const[x,y]=paved(g.x,g.y,7,g.node);g.rest=rr(60,300);return setT(g,g.node,x,y,'rest')} /* take a break: step off to the side of the path first */
 let tot=0;const w=AT.map(a=>{const ok=a.pk===g.pk&&aOpen(a)&&(LIVENOW&&a.live||T<a.close*3600-300)&&!(a.dt===2&&a.down>0),x=ok?a.pop*Math.exp(-dist(g.node,a.nd)/330)/(1+a.posted/22)*(g.v[a.i]?.3:1)*(LIVENOW&&a.live&&a.live.w!==null?Math.max(.35,Math.min(3,(a.live.w+8)/(a.est+8))):1):0; /* live: guests drift toward the rides whose real lines are longer than ours, so the queues you see track the real ones */tot+=x;return x});
 let u=R()*tot,i=0;for(;i<w.length-1&&(u-=w[i])>0;i++);const a=AT[i];g.tgt=i;setT(g,a.nd,...paved(a.dx,a.dy,3,a.nd),'ride')} // walk to the ride's entrance, not its middle
/* EPCOT's guests: the same day as a Magic Kingdom guest's, in their own park. Before opening they wait outside the gate
   (there is no rope drop to a hub here); they ride, eat around the world and leave by the main entrance. */
function decideEP(g){const pk=g.pk,O=pOpen(pk)*3600,C=pClose(pk)*3600,GT=PGATE[pk],GX=PGATEXY[pk],OU=pk===3&&P_.akout?P_.akout:pk===2&&P_.hsout?P_.hsout:[0,-1]; /* the outside of the gate: north of EPCOT's, and for Hollywood Studios away from the park's middle */
 if(T<O)return setT(g,GT,...paved(GX[0]+OU[0]*12,GX[1]+OU[1]*12,22,GT),'hold');
 if(g.leave<=T||T>=C+600)return setT(g,GT,...paved(GX[0]+OU[0]*8,GX[1]+OU[1]*8,10,GT),'exit');
 const r=R();
 if(T>=g.eat){const c=VN.filter(v=>v.k==='eat'&&v.pk===g.pk);if(c.length){const w=c.map(v=>Math.exp(-dist(g.node,v.nd)/300)*(.4+R()));let b=0;w.forEach((x,i)=>{if(x>w[b])b=i});g.eat=T+rr(4,5.2)*3600;const v=c[b];g.tgt=v.i;return setT(g,v.nd,...paved(N[v.nd][0],N[v.nd][1],2.5,v.nd),'eat')}}
 if(r<.14){const[x,y]=paved(g.x,g.y,7,g.node);g.rest=rr(60,420);return setT(g,g.node,x,y,'rest')} /* a stroll round World Showcase has more pauses */
 let tot=0;const w=AT.map(a=>{const ok=a.pk===g.pk&&aOpen(a)&&(LIVENOW&&a.live||T<a.close*3600-300)&&!(a.dt===2&&a.down>0),x=ok?a.pop*Math.exp(-dist(g.node,a.nd)/380)/(1+a.posted/22)*(g.v[a.i]?.3:1)*(LIVENOW&&a.live&&a.live.w!==null?Math.max(.35,Math.min(3,(a.live.w+8)/(a.est+8))):1):0;tot+=x;return x});
 if(tot<=0){const[x,y]=paved(g.x,g.y,7,g.node);g.rest=rr(120,600);return setT(g,g.node,x,y,'rest')}
 let u=R()*tot,i=0;for(;i<w.length-1&&(u-=w[i])>0;i++);const a=AT[i];g.tgt=i;setT(g,a.nd,...paved(a.dx,a.dy,3,a.nd),'ride')}
const aOpen=a=>LIVENOW&&a.live?a.live.st==='OPERATING':T>=a.open*3600&&T<a.close*3600; // live: the park says whether it is running
function arrive(g){switch(g.intent){
 case'ride':{const a=AT[g.tgt];if(!aOpen(a)||(a.dt===2&&a.down>0&&R()<.6)||a.posted>g.tol){g.v[a.i]=1;g.st=5;g.timer=rr(2,20);break}g.st=1;a.q.push(g);break}
 case'eat':g.st=3;g.timer=rr(900,2400);break;case'shop':g.st=3;g.timer=rr(300,900);break;
 case'watch':g.st=4;break;case'rest':g.st=5;g.timer=g.rest||60;break;case'hold':g.st=5;g.timer=g.pk?Math.max(5,pOpen(g.pk)*3600-T+rr(0,240)):Math.max(5,(T<OPEN*3600-3000?OPEN*3600-3000:OPEN*3600)-T+rr(0,90));break; // at the gate: until they are let in; at the hub: until opening
 case'exit':g.st=7;if(!g.pk)dep[g.mode]++;ST.dep++;break;default:g.st=5;g.timer=10}}
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
 if(a.ph!==undefined&&aStat(a)!=='Closed')a.posted=a.wt=a.ph; // a placeholder wait (Muppet*Vision 3D)
 if(a.hist.length===0||T-a.ht>=600){a.hist.push(a.wt);a.ht=T;if(a.hist.length>150)a.hist.shift()}}
/* events */
const hm24=s=>{const m=Math.floor(s/60);return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')},hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(s.trim());return m?(+m[1]*3600+ +m[2]*60):null};
/* Crowds for shows build the way they do in the park. When a show's gathering time begins, the guests who will watch
   it each pick their own moment to head over: a few early birds claim the front, most drift in during the last
   minutes, and stragglers keep arriving after it starts. Spots fill from the front (the kerb, the hub by the castle)
   backwards as the crowd grows, and each guest takes a spot near where they already are. */
function invite(ev,key){ev.nw=0;ev.nexp=0;for(const g of guests){if((g.pk||0)!==(ev.pk||0)||g.intent==='exit'||g.st===7||R()>=ev.pref)continue;g.evId=ev.id;g.evK=key;g.evT=key-150-ev.lead*60*R()**2.2;ev.nexp++}}
const isPar=ev=>typeof isParade==='function'?isParade(ev.id):ev.id==='parade',paradeLen=ev=>(typeof parOf==='function'&&parOf(ev.id)?parOf(ev.id).len:300)*OSM.S,paradeHead=ev=>ev.p*(PR.L+paradeLen(ev));
function spot(ev,g){let s=null;if(ev.id==='fmic'){s=spot0(ev,g);if(!s)return null;s[2]=nearestNode(s[0],s[1]);s[4]=0;return s} /* the amphitheater's seats aren't pavement in the map data, but that's where people sit */
 for(let i=0;i<8;i++){s=spot0(ev,g);if(!s)return null;if(PAVE(s[0],s[1])){s[4]=0;break}s[4]=1} // only on pavement: try again if the spot fell on a lawn, a building or the water
 s[2]=nearestNode(s[0],s[1]);if(s[4]){s[0]=N[s[2]][0]+rr(-1.5,1.5);s[1]=N[s[2]][1]+rr(-1.5,1.5)}return s}
function spot0(ev,g){ // [x, y, (walk-graph node, filled in by spot), distance along the parade route]
 const near=(x,y,d)=>[x,y,-1,d],f=Math.min(1,ev.nw/Math.max(8,ev.nexp)); // f: how full the viewing areas are
 switch(isPar(ev)?'parade':ev.id){case'parade':{const head=ev.ph==='live'?paradeHead(ev)+30:0;let best=null,bd=1e18; // only where the parade hasn't passed; busiest toward Main Street
   for(let i=0;i<4;i++){const d=PR.L*(.08+.88*R()**.75);if(d<head)continue;const[x,y,a]=PR.at(d),dd=(x-g.x)**2+(y-g.y)**2;if(dd<bd){bd=dd;best=[d,x,y,a]}}
   if(!best)return null;const[d,x,y,a]=best,o=(R()<.5?-1:1)*(6.5+rr(0,1.2+4.8*f));return near(x-Math.sin(a)*o,y+Math.cos(a)*o,d)}
  case'lum':{const L=lumSpots();if(!L.length)return null;const n=N[L[R()*L.length|0]],k=1+f*1.5;return near(n[0]+rr(-4,4)*k,n[1]+rr(-4,4)*k)} /* along the World Showcase promenade, round the lagoon */
  case'fmic':{const G=typeof fmGeo==='function'&&fmGeo();if(!G||!G.seats.length)return null;const a=Math.atan2(G.u[1],G.u[0])+rr(-1.05,1.05),r=G.shore(a)+3+rr(0,16)*(.35+.65*f);return near(G.lc[0]+Math.cos(a)*r,G.lc[1]+Math.sin(a)*r)} /* in the amphitheater's seats, facing the lagoon (filling from the front) */
  case'castle':case'welcome':return near(P_.stage[0]+rr(-34,34),P_.stage[1]+rr(14,22+26*f));
  case'flag':{const fp=P_.flagpole||P_.townsq,a=rr(0,6.283),d=7+rr(0,14)*(.4+.6*f);return near(fp[0]+Math.cos(a)*d,fp[1]+Math.sin(a)*d*.8+3)} /* around the pole, leaving it clear */
  case'band':{const k=.4+.6*f;return near(P_.townsq[0]+rr(-22,22)*k,P_.townsq[1]+rr(-14,14)*k)}
  default:{const k=.35+.65*f;if(R()<.55)return near(P_.hub[0]+rr(-55,55)*k,P_.hub[1]+rr(-40,45)*k);const d=rr(0,1)*Math.min(1,.25+f);return near(P_.hub[0]+rr(-11,11),P_.hub[1]+50+d*(P_.townsq[1]-P_.hub[1]-60))}}}
/* the walkway nodes along World Showcase Lagoon's shore: where EPCOT's guests stand to watch Luminous */
let LUMSPOTS=null;function lumSpots(){if(LUMSPOTS)return LUMSPOTS;LUMSPOTS=[];if(!EPR||typeof EPCOT==='undefined'||!EPCOT)return LUMSPOTS;const c=EPCOT.c,w=OSM.areas.filter(a=>a.k==='water'&&ptIn(c[0],c[1],a.o)).sort((p,q)=>q.o.length-p.o.length)[0];if(!w)return LUMSPOTS;
 for(let i=0;i<N.length;i++){const[x,y]=N[i];if(x<EPR[0]||y<EPR[1]||Math.hypot(x-c[0],y-c[1])>420)continue;let d=1e9;for(const q of w.o)d=Math.min(d,Math.hypot(q[0]-x,q[1]-y));if(d<40)LUMSPOTS.push(i)}return LUMSPOTS}
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
  if(m.st==='dwell'){m.tm-=dt;if(m.tm<=0){m.st='run';m.v=0;m.nx=(m.at+1)%l.sd.length}continue}
  const gap=((l.sd[m.nx]-m.x)%L+L)%L,vt=MSPEED*Math.min(1,Math.max(.12,Math.sqrt(gap/60)));m.v=Math.min(vt,(m.v??MSPEED)+3.5*dt); /* trains ease out of a station and slow into the next (riding in the cab, and on the map) */
  if(gap>m.v*dt){m.x=(m.x+m.v*dt)%L;continue}
  m.x=l.sd[m.nx];m.st='dwell';m.at=m.nx;const stop=l.stops[m.at];m.tm=DWELL(stop);
  if(l.k==='epcot')m.ld=Math.round(l.cap*rr(.25,.9)); /* EPCOT's trains: a load of guests each way */
  else if(stop==='mk'){unload(0,P_.monostation[0],P_.monostation[1]-6,l.cap);m.ld=board(0,l.cap)}   // arrivals step off, departures board
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
 if(EPGATEXY){const he=Math.max(0,Math.min(23,Math.floor(T/3600-(EOPEN-9))));spE+=att*EPATT*CROWDX*ARR[he]/K/3600*dt; /* EPCOT's guests walk in from the monorail and the parking lot, north of the gate */
  while(spE>=1){spE--;mk(EPGATEXY[0]+rr(-14,14),EPGATEXY[1]-rr(14,30),4,1)}}
 if(HSGATEXY){const hh=Math.max(0,Math.min(23,Math.floor(T/3600-(HOPEN-9))));spH+=att*HSATT*CROWDX*ARR[hh]/K/3600*dt; /* Hollywood Studios' guests come from the parking lot and the bus and Skyliner stops, outside its gate */
  while(spH>=1){spH--;const o=P_.hsout||[0,1],d=rr(14,30),sd=rr(-14,14);mk(HSGATEXY[0]+o[0]*d-o[1]*sd,HSGATEXY[1]+o[1]*d+o[0]*sd,4,2)}}
 if(AKGATEXY){const ha=Math.max(0,Math.min(23,Math.floor(T/3600-(AOPEN-9))));spA+=att*AKATT*CROWDX*ARR[ha]/K/3600*dt; /* Animal Kingdom's from its parking lot and bus station, outside its gate */
  while(spA>=1){spA--;const o=P_.akout||[0,1],d=rr(14,30),sd=rr(-14,14);mk(AKGATEXY[0]+o[0]*d-o[1]*sd,AKGATEXY[1]+o[1]*d+o[0]*sd,4,3)}}
 if(T-densAt>3||T<densAt)crowdGrid();
 for(const a of AT)updA(a,dt);for(const e of EV){evUpd(e);if(e.ph==='live'&&isPar(e))trail(e,dt)}transport(dt);
 for(let i=guests.length-1;i>=0;i--){const g=guests[i];if(g.st===7){guests[i]=guests[guests.length-1];guests.pop();continue}upd(g,dt)}}
/* SEEKGEN counts deliberate time jumps (slider, ±15, Watch…), so the soundtracks can tell those apart from
   the simulation merely falling behind (background tab, slow frame) — see catchUp() in street.js */
let SEEKGEN=0,CATCHUP=false;
function seek(t,force){t=Math.max(0,Math.min(86399,t));if(!CATCHUP)SEEKGEN++;FF=true;if(force||t<T-1){reset(Math.min(7*3600,t));}while(T<t)step(Math.min(10,t-T));FF=false;lighting()}
function lighting(){const h=T/3600,ev=Math.max(0,Math.min(1,(h-sunset+.25)/1.2)),mo=Math.max(0,Math.min(1,(sunrise+.6-h)/1));nf=h>12?ev:mo;
 gf=h>12?Math.max(0,Math.min(1,(h-(sunset-1.8))/1.8))*(1-nf):Math.max(0,1-Math.abs(h-(sunrise+.5))/1.2)*(1-nf)*.7}
