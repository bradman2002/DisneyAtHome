/* ===== TV MODE: leave it running on a screen =====
   Fills the screen, hides the controls and directs itself: the camera glides from shot to shot (the whole park, each land,
   a monorail, the ferry, Main Street, the resorts), cuts to the parade, the fireworks and the water pageant when they are
   on, and a board in the corner pages through the wait times. With live data it shows the real park in real time; in the
   hours the park is closed it replays the day as a time-lapse instead (slowing to real time for each show).
   Start it with the screen button on the map, the T key, or by adding ?tv to the address (for a browser that opens the
   page by itself). Esc or T leaves. */
/* TV.park: which park TV mode shows ('all', 'mk', 'ep', 'hs' or 'ak'), picked in Sound & settings (or ?tv=ep in the address) and remembered */
const TV={park:'all',on:false,i:-1,shot:null,until:0,key:'',alt:0,replay:false,uiAt:0,page:0,pageAt:0,lock:null};
const TVPARKS=DL?{all:'Both parks',mk:'Disneyland',ep:'California Adventure'}:{all:'All parks',mk:'Magic Kingdom',ep:'EPCOT',hs:'Hollywood Studios',...(OSM.ak?{ak:'Animal Kingdom'}:{})},TVPK={mk:0,ep:1,hs:2,ak:3}; /* at Disneyland, mk = Disneyland Park and ep = California Adventure (their park numbers) */
try{const p=localStorage.getItem('mk-tvpark');if(TVPARKS[p])TV.park=p}catch(e){}
{const m=/[?&]tv=(\w+)/.exec(location.search);if(m&&TVPARKS[m[1]])TV.park=m[1]}
const tvIn=p=>TV.park==='all'||TV.park===p; /* is park p (mk, ep, hs, ak; ds is Disney Springs, shown only with all parks) in TV mode's choice */
function tvSetPark(p){if(!TVPARKS[p])return;TV.park=p;try{localStorage.setItem('mk-tvpark',p)}catch(e){}TV.list=null;TV.i=-1;if(TV.on){TV.shot=null;TV.key=''}}
const tvRand=(a,b)=>a+Math.random()*(b-a);
// the regular rotation of shots
function tvShots(){const land=k=>({k:'map',n:LANDS[k][0],x:LANDS[k][1],y:LANDS[k][2],m:2.5,dur:34,layer:'wait',drift:3}),place=k=>({k:'map',n:RESORTS[k].n.replace('Disney’s ',''),x:RESORTS[k].c[0],y:RESORTS[k].c[1]-10,m:1.8,dur:28,layer:'transport',drift:2});
 const tag=(p,L)=>L.filter(Boolean).map(s=>(s.p=p,s)),
  ride=(o,n,m)=>{const a=AT.find(x=>x.osm===o);return a&&{k:'map',a:a.i,n:n+(a.pk===1?' · EPCOT':a.pk===2?' · Hollywood Studios':a.pk===3?' · Animal Kingdom':''),x:a.x,y:a.y+6,m:m||3.2,dur:40,layer:'wait',drift:1.2}}; /* a close-up on one ride (null if the map doesn't have it) */
 if(DL)return tvShotsDL(land,place,tag,ride);
 return[{k:'map',n:'Magic Kingdom',x:P_.hub[0],y:P_.hub[1]-45,m:1.02,dur:42,layer:'wait',zoom:1.06},land('fan'),{k:'mono',n:'Monorail',dur:38},land('tom'),{k:'street',n:'Main Street, U.S.A.',dur:40},land('adv'),
  ...(EPCOT?tag('ep',[{k:'map',n:'EPCOT',x:(EPR[0]+EPR[2])/2,y:(EPR[1]+EPR[3])/2,m:fitM(EPR)*1.15,dur:34,layer:'wait',zoom:1.05},{k:'map',n:'Spaceship Earth · EPCOT',x:EPCOT.sse[0],y:EPCOT.sse[1]-10,m:3.2,dur:30,layer:'wait',drift:1.5},{k:'map',n:'World Showcase · EPCOT',x:EPCOT.c[0],y:EPCOT.c[1]+40,m:1.7,dur:34,layer:'wait',drift:2},{k:'map',n:'World Discovery · EPCOT',x:LANDS.wd?LANDS.wd[1]:EPCOT.sse[0],y:LANDS.wd?LANDS.wd[2]+40:EPCOT.sse[1],m:2.4,dur:30,layer:'wait',drift:2},
   ride('Living with the Land','Living with the Land'),ride('Test Track','Test Track'),ride('Frozen Ever After','Frozen Ever After · Norway'),ride('Guardians Of The Galaxy: Cosmic Rewind','Guardians of the Galaxy: Cosmic Rewind',2.8),ride('Remy’s Ratatouille Adventure','Remy’s Ratatouille Adventure · France'),ride('The American Adventure','The American Adventure'),ride('The Seas with Nemo & Friends','The Seas with Nemo & Friends')]):[]),
  ...(OSM.hs&&HSR?tag('hs',[{k:'map',n:'Hollywood Studios',x:(HSR[0]+HSR[2])/2,y:(HSR[1]+HSR[3])/2,m:fitM(HSR)*1.1,dur:34,layer:'wait',zoom:1.05},{k:'map',n:'Tower of Terror · Sunset Boulevard',x:POS['The Twilight Zone Tower of Terror'].c[0],y:POS['The Twilight Zone Tower of Terror'].c[1]+10,m:3.2,dur:30,layer:'wait',drift:1.5},
   {k:'map',n:'Star Wars: Galaxy’s Edge · Hollywood Studios',x:LANDS.sw?LANDS.sw[1]:HSR[0],y:LANDS.sw?LANDS.sw[2]:HSR[1],m:2.4,dur:32,layer:'wait',drift:2},{k:'map',n:'Toy Story Land · Hollywood Studios',x:LANDS.ts?LANDS.ts[1]:HSR[0],y:LANDS.ts?LANDS.ts[2]:HSR[1],m:2.8,dur:30,layer:'wait',drift:2},
   {k:'map',n:'Hollywood Boulevard',x:P_.hsbooth?(P_.hsbooth[0]+POS["Mickey and Minnie's Runaway Railway"].c[0])/2:HSR[0],y:P_.hsbooth?(P_.hsbooth[1]+POS["Mickey and Minnie's Runaway Railway"].c[1])/2:HSR[1],m:2.6,dur:30,layer:'wait',drift:2},
   ride('Slinky Dog Dash','Slinky Dog Dash'),ride('Star Wars: Rise of the Resistance','Rise of the Resistance'),ride('Rock ’n’ Roller Coaster Starring The Muppets','Rock ’n’ Roller Coaster'),ride("Mickey and Minnie's Runaway Railway",'Mickey & Minnie’s Runaway Railway'),ride('Millennium Falcon: Smugglers Run','Millennium Falcon: Smugglers Run'),ride('Indiana Jones Epic Stunt Spectacular!','Indiana Jones Epic Stunt Spectacular! · Echo Lake'),ride("Jim Henson's Muppet*Vision 3-D",'Muppet*Vision 3D · Grand Avenue',3)]):[]),
  ...(OSM.ak&&AKR?tag('ak',[{k:'map',n:'Animal Kingdom',x:(AKR[0]+AKR[2])/2,y:(AKR[1]+AKR[3])/2+60,m:fitM(AKR)*1.25,dur:34,layer:'wait',zoom:1.05},...(P_.tol?[{k:'map',n:'The Tree of Life · Discovery Island',x:P_.tol[0],y:P_.tol[1]-20,m:3.2,dur:30,layer:'wait',drift:2}]:[]),
   ...(LANDS.pa?[{k:'map',n:'Pandora – The World of Avatar',x:LANDS.pa[1],y:LANDS.pa[2],m:2.6,dur:30,layer:'wait',drift:2}]:[]),...(LANDS.af?[{k:'map',n:'Harambe · Africa',x:LANDS.af[1],y:LANDS.af[2],m:2.4,dur:30,layer:'wait',drift:2}]:[]),
   ride('Expedition Everest: Legend of the Forbidden Mountain','Expedition Everest',2.8),ride('Avatar Flight of Passage','Avatar Flight of Passage'),ride('Kilimanjaro Safaris','Kilimanjaro Safaris',2.4),ride('Kali River Rapids','Kali River Rapids'),
   ...(P_.akl?[{k:'map',n:'Animal Kingdom Lodge',x:P_.akl[0],y:P_.akl[1],m:1.6,dur:28,layer:'transport',drift:2,p:'ak'}]:[])]):[]),
  ...(P_.ds?[{k:'map',n:'Disney Springs',x:P_.ds[0],y:P_.ds[1]-20,m:1.9,dur:30,layer:'transport',drift:2,p:'ds'}]:[]),
  {k:'map',n:'Seven Seas Lagoon',x:(MKR[0]+MKR[2])/2,y:(MKR[1]+MKR[3])/2,m:0,dur:36,layer:'transport',zoom:1.05},land('fr'),{k:'ferry',n:'Ferryboat',dur:30},place('cont'),land('lib'),place('poly'),{k:'map',n:'Main Street, U.S.A.',x:P_.mainst[0],y:P_.mainst[1]+10,m:2.7,dur:30,layer:'wait',drift:2},{k:'map',n:'Haunted Mansion',x:AT.find(a=>/Haunted/.test(a.osm)).x,y:AT.find(a=>/Haunted/.test(a.osm)).y+6,m:3.6,dur:70,layer:'wait',drift:1.2},place('gf'),place('ttc'),{k:'map',n:'“it’s a small world”',x:AT.find(a=>/small world/.test(a.osm)).x,y:AT.find(a=>/small world/.test(a.osm)).y+6,m:3.6,dur:70,layer:'wait',drift:1.2},{k:'map',n:'Space Mountain',x:AT.find(a=>a.osm==='Space Mountain').x,y:AT.find(a=>a.osm==='Space Mountain').y+8,m:3.2,dur:70,layer:'wait',drift:1.2},{k:'map',n:'Tomorrowland Transit Authority PeopleMover',x:AT.find(a=>/PeopleMover/.test(a.osm)).x,y:AT.find(a=>/PeopleMover/.test(a.osm)).y+6,m:3.4,dur:70,layer:'wait',drift:1.2},{k:'map',n:'Pirates of the Caribbean',x:AT.find(a=>/Pirates/.test(a.osm)).x,y:AT.find(a=>/Pirates/.test(a.osm)).y+6,m:3.6,dur:70,layer:'wait',drift:1.2},...(RESORTS.wl?[{k:'map',n:'Bay Lake',x:(P_.cont[0]+P_.fw[0])/2+60,y:P_.disc[1]+120,m:.72,dur:36,layer:'transport',zoom:1.05},place('wl'),place('fw')]:[])].filter(s=>tvIn(s.p||'mk'))} /* untagged shots are the Magic Kingdom and its resorts */
/* Disneyland's rotation: the park and its lands, the monorail and the rides you see from the air, then California Adventure
   (tagged 'ep', its park slot) and the hotels and Downtown Disney. No Main Street view shots (that street view is Magic Kingdom's). */
function tvShotsDL(land,place,tag,ride){const L=k=>LANDS[k]&&land(k),D=(o,n,m)=>{const s=ride(o,n,m);if(s&&s.n)s.n=s.n.replace(' · EPCOT',' · California Adventure');return s},
  map=(n,x,y,m,dur,layer,drift)=>({k:'map',n,x,y,m,dur:dur||32,layer:layer||'wait',drift:drift||2});
 return[map('Disneyland',P_.hub[0],P_.hub[1]-60,fitM(MKR)*1.15,42,'wait',0),L('fan'),{k:'mono',n:'Monorail',dur:38},L('tom'),D('Matterhorn Bobsleds','Matterhorn Bobsleds',2.8),L('adv'),
  map('Main Street, U.S.A.',P_.mainst[0],P_.mainst[1]+10,2.7,30),D('The Haunted Mansion','Haunted Mansion',3.4),L('nos'),L('gx'),D('Star Wars: Rise of the Resistance','Rise of the Resistance'),L('fr'),...(P_.rivers?[map('Rivers of America',P_.rivers[0],P_.rivers[1],3,36,'wait',1.5)]:[]),
  D('Big Thunder Mountain Railroad','Big Thunder Mountain Railroad',3),L('bc'),L('tt'),D('"It\'s a Small World"','“it’s a small world”',3.4),D('Space Mountain','Space Mountain',3),D('Indiana Jones Adventure','Indiana Jones Adventure',3.2),
  map('Sleeping Beauty Castle',P_.castle[0],P_.castle[1]+10,4,40,'wait',1),
  ...tag('ep',[map('Disney California Adventure',(EPR[0]+EPR[2])/2,(EPR[1]+EPR[3])/2,fitM(EPR)*1.15,36,'wait',0),L('bv'),L('cl'),D('Radiator Springs Racers','Radiator Springs Racers',2.8),L('pp'),D('Incredicoaster','Incredicoaster',2.6),
   D('Pixar Pal-A-Round','Pixar Pal-A-Round',3.2),L('av'),D('Guardians of the Galaxy: Mission Breakout','Guardians of the Galaxy – Mission: BREAKOUT!',3.2),L('gp'),D('Grizzly River Run','Grizzly River Run',2.8),L('pg'),L('hl')]),
  map('The Esplanade',P_.espl[0],P_.espl[1],2.4,26,'transport'),...(P_.dd?[map('Downtown Disney',P_.dd[0],P_.dd[1],2,28,'transport')]:[]),place('dlh'),place('gch'),place('pph')].filter(Boolean).filter(s=>tvIn(s.p||'mk'))}
// what, if anything, is on right now that the camera should be watching
function tvEvent(){const mk=tvIn('mk'),f=fireEv();if(mk&&f&&f.ph==='live')return'fire';if(DL){if(mk&&fmLive())return'fmic';if(tvIn('ep')&&wocLive())return'woc';if(tvIn('ep')&&clLive())return'cl'}if(tvIn('ep')&&lumLive())return'lum';if(tvIn('hs')&&fmLive())return'fmic';if(!mk)return'';
 for(const id of['welcome','flag','kiss']){const e=EV.find(x=>x.id===id);if(e&&e.on!==false&&e.ph==='live')return id}const P=liveParade();if(P&&paradeUnits().length)return'parade:'+P.id;if(ewpShow())return'ewp';if(geyserNow()>.5&&!TV.replay)return'geyser';return''}
function tvNext(){const key=tvEvent();TV.alt=key===TV.key?TV.alt+1:0;TV.key=key;let s;
 const lumS=()=>TV.alt%2?{k:'map',n:'Luminous · World Showcase Lagoon',x:EVPOS.lum[0],y:EVPOS.lum[1]-30,m:2.1,dur:45,layer:'shows'}:{k:'map',n:'Luminous: The Symphony of Us · EPCOT',x:EVPOS.lum[0],y:EVPOS.lum[1]-50,m:1.35,dur:50,layer:'shows'};
 const fmS=()=>{const G=fmGeo();return TV.alt%2?{k:'map',n:DL?'Fantasmic! · Rivers of America':'Fantasmic! · Hollywood Hills Amphitheater',x:G.lc[0],y:G.lc[1]-30,m:2.1,dur:45,layer:'shows'}:{k:'map',n:DL?'Fantasmic! · Disneyland':'Fantasmic! · Hollywood Studios',x:G.lc[0],y:G.lc[1]-25,m:3.2,dur:50,layer:'shows'}};
 const wocS=()=>{const G=wocGeo();return TV.alt%2?{k:'map',n:'World of Color · Paradise Bay',x:G.c[0],y:G.c[1]-25,m:2,dur:45,layer:'shows'}:{k:'map',n:'World of Color · California Adventure',x:G.c[0],y:G.c[1]-10,m:3,dur:50,layer:'shows'}};
 if(DL&&(key==='fmic'||key==='fire')&&tvIn('ep')&&wocLive()&&TV.alt%3===2)s=wocS(); /* Disneyland's two water shows (and the fireworks) at once: now and then cut across the Esplanade */
 else if(DL&&key==='woc')s=wocS();
 else if(DL&&key==='cl'){clBuildings();s=TV.alt%2?{k:'map',n:'Cars Land neon lighting · Radiator Springs',x:CLN.ctr[0],y:CLN.ctr[1]-6,m:3.6,dur:40,layer:'shows'}:{k:'map',n:'Cars Land neon lighting',x:CLN.ctr[0],y:CLN.ctr[1]-15,m:2.4,dur:45,layer:'shows'}}
 else if(DL&&key==='fire'&&tvIn('mk')&&fmLive()&&TV.alt%3===1)s=fmS();
 else if(key==='fire'&&tvIn('ep')&&lumLive()&&TV.alt%3===2)s=lumS(); /* both nighttime shows at once: now and then cut across to EPCOT's */
 else if((key==='fire'||key==='lum')&&tvIn('hs')&&fmLive()&&TV.alt%3===1)s=fmS(); /* and to the Studios' when Fantasmic! is on too */
 else if(key==='lum')s=lumS();
 else if(key==='fmic')s=fmS();
 else if(key==='fire'&&DL)s=TV.alt%2?{k:'map',n:fwName()+' · Sleeping Beauty Castle',x:P_.castle[0],y:P_.castle[1]-30,m:1.8,dur:45,layer:'wait'}:{k:'map',n:fwName(),x:P_.castle[0],y:P_.castle[1]+60,m:1.2,dur:50,layer:'wait'}; /* no street view at Disneyland: two map shots */
  else if(key==='fire')s=TV.alt%2?{k:'map',n:'Fireworks over the castle',x:P_.castle[0],y:P_.castle[1]-40,m:1.45,dur:45,layer:'wait'}:{k:'street',n:EV.find(e=>e.id==='fire').n.replace(' (fireworks)',''),dur:75};
 else if(key==='geyser')s={k:'map',n:'Fire Rock Geyser · Wilderness Lodge',x:P_.geyser[0]+4,y:P_.geyser[1]-14,m:3.6,dur:150,layer:'transport'};
 else if(key==='welcome')s={k:'map',n:'Let the Magic Begin',x:P_.stage[0],y:P_.stage[1]+18,m:3.3,dur:70,layer:'shows'};
 else if(key==='flag')s={k:'map',n:'Flag Retreat · Town Square',x:P_.townsq[0],y:P_.townsq[1]-4,m:3.4,dur:50,layer:'shows'};
 else if(key==='kiss')s=TV.alt%2?{k:'map',n:'Kiss Goodnight',x:P_.castle[0],y:P_.castle[1]-20,m:2.2,dur:40,layer:'shows'}:{k:'street',n:'Kiss Goodnight',dur:50};
 else if(key.startsWith('parade')){const n=parOf(key.slice(7)).n+' Parade';s=TV.alt%2&&!DL?{k:'street',n,dur:45}:{k:'follow',n,f:{k:'parade'},m:2.7,dur:45,layer:'wait'}}
 else if(key==='ewp'&&TV.alt%2===0)s={k:'follow',n:'Electrical Water Pageant',f:{k:'w'},m:2.5,dur:60,layer:'shows'};
 else{const L=TV.list||(TV.list=tvShots());TV.i=(TV.i+1)%L.length;s=L[TV.i]}
 TV.shot=s;TV.until=performance.now()+s.dur*1000;sel=null;follow=null;if(sheet)closeSheet();
 if(s.k==='street'){if(!SV.on)setView(true)}else{if(SV.on)setView(false);VIEW.layer=s.layer||'transport';
  if(s.k==='mono'){let i=MONO.findIndex(m=>m.st==='run');if(i<0)i=0;i=(i+Math.floor(Math.random()*MONO.length))%MONO.length;follow={k:'m',i};s.n='Monorail '+MONO[i].nm+' · '+MLINE[MONO[i].l].n+' line';cam.tm=2.3}
  else if(s.k==='ferry'){let i=FERRY.findIndex(f=>f.st==='run');follow={k:'f',i:i<0?0:i};cam.tm=2.1}
  else if(s.k==='follow'){follow=s.f;cam.tm=s.m}
  else{cam.tx=s.x;cam.ty=s.y;cam.tm=s.m||fitM(MKR);const a=Math.random()*6.283;s.vx=Math.cos(a)*(s.drift||0);s.vy=Math.sin(a)*(s.drift||0)*.6}}
 {const to=s.k==='street'?null:follow?vehPos(follow):[cam.tx,cam.ty];if(to&&Math.hypot(to[0]-cam.x,to[1]-cam.y)>1500){cam.x=cam.tx=to[0];cam.y=cam.ty=to[1];cam.m=cam.tm}} /* a shot in the other park (across the blank land between them) is a cut, not a long glide */
 TV.ride=s.a!=null?s.a:null;tvRideCard();
 const c=$('#tvCap');c.textContent=s.n;c.classList.remove('in');void c.offsetWidth;if(TV.ride==null)c.classList.add('in');sync()} /* on a ride's shot the ride card says it instead of the caption */
/* the ride card (owner, 26 Nov 2026: "With the tv mode, when it goes to a ride have it display the ride somewhere"): bottom left for the
   whole of a ride's shot: its name, land and park, the wait right now (or Closed / Temporarily down) and whether its own audio is playing */
function tvRideCard(){const r=$('#tvRide');if(!r)return;const a=TV.on&&TV.ride!=null?AT.find(x=>x.i===TV.ride):null;if(!a){r.hidden=true;r.classList.remove('in');return}
 const st=aStat(a),open=st!=='Closed'&&st!=='Down'&&!/down|refurb/i.test(st),park=['Magic Kingdom','EPCOT','Hollywood Studios','Animal Kingdom'][a.pk||0],pn=DL?['Disneyland Park','Disney California Adventure'][a.pk||0]:park,
  ln=LANDNAME[a.l]||'',w=open?`<b class="${wc(a.wt)}">${a.wt}<small>min wait</small></b>`:`<b class="x">${/down/i.test(st)?'Temporarily down':'Closed'}</b>`,au=typeof RA!=='undefined'&&RA.cur&&rideAt(a)===RA.cur&&RA.lvl>.02;
 const h=`<div class="rn">${esc(a.n)}</div><div class="rl">${esc([ln,pn].filter(Boolean).join(' · '))}</div><div class="rw">${w}${au?'<span class="ra">♪ On-ride audio</span>':''}</div>`;
 if(r.dataset.h!==h){r.innerHTML=h;r.dataset.h=h}if(r.hidden){r.hidden=false;r.classList.remove('in');void r.offsetWidth;r.classList.add('in')}}
/* called every frame while TV mode is on */
function tvTick(rdt){const now=performance.now();if(now-(TV.rcAt||0)>1000){TV.rcAt=now;tvRideCard()} /* keep the ride card's wait and audio note current */
 // which clock: the real one while the park is open (or about to be), a replay of the day otherwise
 if(LIVE.ok){const h=parkClock().s/3600,[o,cl]=LIVE.hours||[OPEN,CLOSE],shut=h<o-.75||h>cl+.5;
  if(!shut){if(TV.replay||!LIVE.follow){TV.replay=false;liveFollow()}}
  else{if(LIVE.follow)liveUnfollow();TV.replay=true}}
 if(TV.replay||!LIVE.ok){const lo=(OPEN-.5)*3600,hi=(CLOSE+.45)*3600;if(T<lo||T>hi){LIVE.inTick=true;seek(lo,true);LIVE.inTick=false}
  playing=true;const show=!!tvEvent()||(()=>{const f=fireEv();return f&&f.ph==='gather'&&f.key-T<40})();const sp=show?1:30;if(speed!==sp){speed=sp;sync()}} // time-lapse, but every show plays at its real speed
 if(!TV.shot||now>TV.until||tvEvent()!==TV.key)tvNext();
 const s=TV.shot;if(s.k==='map'&&s.vx){cam.tx+=s.vx*rdt;cam.ty+=s.vy*rdt} /* a slow pan only: a slow zoom re-scales the whole map a hair every frame, which shimmers */
 if(now-TV.uiAt>500){TV.uiAt=now;tvBoard(now)}}
function tvBoard(now){const c=parkClock(),d=new Date(dateStr+'T12:00:00');
 $('#tvTime').textContent=fmt(T);$('#tvDate').textContent=d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
 $('#tvNote').textContent=TV.replay?'Park closed · replaying the day':LIVENOW?'Live from '+(TV.park==='all'?RESORT_NAME:TVPARKS[TV.park]):LIVE.follow?'Live time · simulated waits':'Simulated';$('#tv').classList.toggle('live',LIVENOW);
 const run=AT.filter(a=>{if(TV.park!=='all'&&(a.pk||0)!==TVPK[TV.park])return false;const st=aStat(a);return st==='Operating'||st==='Last riders'}).sort((a,b)=>b.wt-a.wt),off=AT.filter(a=>TV.park==='all'||(a.pk||0)===TVPK[TV.park]).length-run.length,per=innerWidth<=760||innerHeight<=500?4:7,pages=Math.max(1,Math.ceil(run.length/per));
 if(now-TV.pageAt>9000){TV.pageAt=now;TV.page=(TV.page+1)%pages}if(TV.page>=pages)TV.page=0;
 $('#tvList').innerHTML=run.length?run.slice(TV.page*per,TV.page*per+per).map(a=>`<div class="tr"><span>${esc(a.n)}</span><b class="${wc(a.wt)}">${a.wt}<small>min</small></b></div>`).join(''):'<div class="tr"><span>The park is closed</span></div>';
 $('#tvFoot').textContent=(run.length?`${run.length} rides running${off?' · '+off+' closed or down':''} · ${TV.page+1}/${pages} · `:'')+`~${((TV.park==='all'?guests.length:guests.reduce((n,g)=>n+((g.pk||0)===TVPK[TV.park]),0))*K).toLocaleString()} guests in the park${TV.park==='all'?'s':''}`;
 const up=[];for(const e of EV){if(e.on===false||!tvIn(['mk','ep','hs','ak'][e.pk||0]))continue;const n=e.ph==='live'?T:e.t.find(t=>t>T);if(n!==undefined)up.push([n,e.n.replace(' (fireworks)','').replace(' (placeholder)',''),e.ph==='live'])}
 if(DL&&tvIn('ep')&&typeof clStart==='function'){const s0=clStart();if(clLive())up.push([T,'Cars Land neon lighting',true]);else if(T<s0)up.push([s0,'Cars Land neon lighting',false])} /* not an EV event, so added here */
 if(EWP.legs&&EWP.on&&tvIn('mk')){const s=ewpShow(),n=ewpNext();if(s)up.push([T,'Electrical Water Pageant',true]);else if(n)up.push([n.t,'Electrical Water Pageant · '+n.n,false])}
 up.sort((a,b)=>a[0]-b[0]);let show=up.slice(0,innerWidth<=760||innerHeight<=500?1:3);
 if(DL)for(const nm of['Fantasmic!','World of Color']){const x=up.find(u=>u[1]===nm);if(x&&!show.includes(x))show.push(x)} /* Disneyland's nighttime water shows are always on the board (their next showing) */
 show.sort((a,b)=>a[0]-b[0]);$('#tvUp').innerHTML=show.map(([t,n,live])=>`<div class="tr"><span>${esc(n)}</span><b>${live?'Now':fmt(t)}</b></div>`).join('')}
async function tvWake(){try{if(TV.on&&navigator.wakeLock&&document.visibilityState==='visible')TV.lock=await navigator.wakeLock.request('screen')}catch(e){}} // keep the screen from sleeping
function tvStart(){if(TV.on)return;unlockRide(); /* the tap that starts TV mode also unlocks ride audio on iPhone */TV.on=true;document.body.classList.add('tv');$('#tv').hidden=false;if(!document.body.classList.contains('fs'))toggleFS();TV.shot=null;TV.key='';TV.uiAt=0;TV.user={layer:VIEW.layer,speed};
 if(!LIVE.ok){speed=1;playing=true}if(!AU.ready)auInit();tvWake();sync()}
function tvStop(){if(!TV.on)return;TV.on=false;TV.ride=null;tvRideCard();document.body.classList.remove('tv');$('#tv').hidden=true;follow=null;if(SV.on)setView(false);VIEW.layer=TV.user.layer;if(TV.replay||!LIVE.follow){speed=TV.user.speed}TV.replay=false;
 if(TV.lock){try{TV.lock.release()}catch(e){}TV.lock=null}if(document.body.classList.contains('fs'))toggleFS();sync()}
document.addEventListener('visibilitychange',tvWake);
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName)||e.metaKey||e.ctrlKey)return;if(e.key==='t'||e.key==='T')TV.on?tvStop():tvStart();else if(e.key==='Escape'&&TV.on)tvStop()});
$('#tvBtn').onclick=()=>TV.on?tvStop():tvStart();
for(const ev of['fullscreenchange','webkitfullscreenchange'])document.addEventListener(ev,()=>{if(TV.on&&!fsActive())tvStop()}); // leaving full screen leaves TV mode
if(/[?&]tv\b/.test(location.search)){const go=()=>setTimeout(tvStart,1500);document.readyState==='complete'?go():addEventListener('load',go)} /* ?tv in the address starts it by itself (the scripts are added after the loading screen, often after the page's load event has already fired) */
