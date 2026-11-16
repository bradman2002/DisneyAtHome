/* ===== AUDIO — real recordings only (no synthesized sounds). Every clip is an actual field or studio
   recording under CC0 or CC BY 4.0; see SOUND_CREDITS. None are Disney recordings: they are stand-ins
   chosen to match what each place sounds like (crowd walla, waterfalls, rivers, monorail-style electric train, etc.). ===== */
const SOUND_CREDITS=[
 ['Crowd, waterfall, jungle wind & birds, river, water lapping, flag, wind chimes, creek, machine hum, lake shore, bus engine, electric train pass-by & doors, horse, marching snare, orchestral fanfare','“Oculus Audio Pack 01” by Oculus VR, LLC, CC BY 4.0 (via Meta Open Sound; OGG files trimmed, mixed to mono and re-encoded)'],
 ['Daytime birdsong; night crickets','felix.blume on Freesound (#414098, #476672), CC0'],
 ['Fireworks bursts and show bed','rubberduck, “25 CC0 bang/firework SFX”, OpenGameArt, CC0'],
 ['Ship’s bell (ferry departures/arrivals)','Nigel K, Ship’s Bells, CC0'],
 ['Applause (built by layering real hand-clap recordings)','Owlish sound pack, CC0'],
 ['“The Star-Spangled Banner” (Flag Retreat)','United States Navy Band, public domain (US government work), via Wikimedia Commons']];
const AU={ctx:null,mute:false,ready:false,loading:false,v:{master:.8,music:.55,crowd:.08,amb:.05,trans:.7,show:.8},buf:{},L:{},lt:0,last:{}};
const LOOPDEF={crowd:'crowd',crowdEv:'crowd',birds:'amb',crickets:'amb',falls:'amb',jungle:'amb',river:'amb',lap:'amb',flag:'amb',chimes:'amb',creek:'amb',hum:'amb',lake:'amb',engine:'trans',fwbed:'show'};
const LOOPSRC={crowdEv:'crowd'};
/* Sound files live in the audio/ folder next to index.html. Loop points (seconds) mark the seamless part of each bed. */
const AUDIO_DIR='audio/';
const SOUND_FILES=["applause", "applause_big", "bell1", "bell2", "birds", "chimes", "creek", "crickets", "crowd", "doorsclose", "doorsopen", "engine", "falls", "fanfare", "flag", "fw1", "fw2", "fw3", "fw4", "fw5", "fw6", "fwbed", "horse", "hum", "jungle", "lake", "lap", "river", "snare", "trainpass"];
const LOOP_POINTS={"crowd": [0.3, 48.17359], "birds": [0.3, 45.3], "crickets": [0.3, 45.3], "falls": [0.3, 43.93469], "jungle": [0.3, 40.3], "river": [0.3, 44.91869], "lap": [0.3, 45.3], "flag": [0.3, 18.508], "chimes": [0.3, 31.86109], "creek": [0.3, 44.91153], "hum": [0.3, 30.3], "lake": [0.3, 45.3], "engine": [0.3, 4.45706], "fwbed": [0.3, 13.712]};
async function loadSound(c,n){let err;
 for(let tries=0;tries<4;tries++){ // retry: a busy local server or a decoder hiccup shouldn't lose a sound
  try{const r=await fetch(AUDIO_DIR+n+'.m4a',{cache:'no-store'});if(!r.ok)throw new Error(n+': HTTP '+r.status);const ab=await r.arrayBuffer();
   return await new Promise((res,rej)=>c.decodeAudioData(ab,res,e=>rej(e||new Error(n+': could not decode'))))}catch(e){err=e;await new Promise(r=>setTimeout(r,400*(tries+1)))}}
 throw err}
async function auInit(){if(AU.ctx){AU.ctx.resume();return}if(AU.loading)return;AU.loading=true;
 const c=AU.ctx=new(window.AudioContext||window.webkitAudioContext)();AU.m=c.createGain();AU.m.connect(c.destination);AU.g={};
 for(const k of['crowd','amb','trans','show']){const g=c.createGain();g.connect(AU.m);AU.g[k]=g}applyVol();
 let done=0;AU.failed=[];const st=t=>{const b=$('#au');if(b)b.textContent=t};
 // load four at a time rather than all thirty at once
 const queue=SOUND_FILES.slice();await Promise.all([0,1,2,3].map(async()=>{while(queue.length){const n=queue.shift();
  try{AU.buf[n]=await loadSound(c,n)}catch(e){AU.failed.push(n);console.warn('Sound not loaded:',n,e)}done++;st(`Loading sounds… ${done}/${SOUND_FILES.length}`)}}));
 for(const k in LOOPDEF){const n=LOOPSRC[k]||k,b=AU.buf[n];if(!b)continue;const s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.loop=true;
  const lp=LOOP_POINTS[n];if(lp){s.loopStart=lp[0];s.loopEnd=lp[1]}g.gain.value=0;s.connect(g).connect(AU.g[LOOPDEF[k]]);
  s.start(0,lp?lp[0]+Math.random()*(lp[1]-lp[0]):0);AU.L[k]={s,g}}
 AU.ready=true;AU.loading=false;AU.lt=T;auSync();setInterval(auTick,500);
 st(AU.failed.length===SOUND_FILES.length?'Sounds unavailable':'Audio on');
 if(AU.failed.length)toast(AU.failed.length===SOUND_FILES.length?(location.protocol==='file:'?'Sounds can’t load from a file opened directly. Run a local web server (see README).':'Sound files not found in the audio/ folder.'):`${AU.failed.length} sound effect(s) couldn’t load (${AU.failed.join(', ')}). Reload the page to try again.`)}
/* Set a music player's volume. iPhones and iPads ignore the volume of web audio players (they play at full volume or not
   at all), so where possible each player is routed through the page's own sound mixer and its level set there instead. */
function setVol(a,v){v=isFinite(v)?Math.max(0,Math.min(1,v)):0;if(AU.ctx&&!a._nog){if(!a._g){try{const s=AU.ctx.createMediaElementSource(a);a._g=AU.ctx.createGain();s.connect(a._g).connect(AU.ctx.destination);a.volume=1}catch(e){a._nog=1}}
  if(a._g){a._g.gain.value=v;return} /* (callers already ease the level over time) */}a.volume=v}
function applyVol(){if(!AU.ctx)return;AU.m.gain.value=AU.mute?0:AU.v.master;for(const k of['crowd','amb','trans','show'])AU.g[k].gain.value=AU.v[k]}
function play(n,v,dst,at,rate){const b=AU.buf[n];if(!b||!AU.ready||!(v>=.004&&isFinite(v)))return;const c=AU.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=b;
 s.playbackRate.value=rate||1;g.gain.value=v;s.connect(g).connect(dst);s.start(c.currentTime+(at||0))}
const prox=(x,y,s)=>Math.exp(-Math.hypot(cam.x-x,cam.y-y)/(s||260));
const EVPOS={parade:[(P_.hub[0]+P_.townsq[0])/2,(P_.hub[1]+P_.townsq[1])/2],xmas:[(P_.hub[0]+P_.townsq[0])/2+26,(P_.hub[1]+P_.townsq[1])/2+30],boo:[(P_.hub[0]+P_.townsq[0])/2-26,(P_.hub[1]+P_.townsq[1])/2+30],caval:[(P_.hub[0]+P_.townsq[0])/2,(P_.hub[1]+P_.townsq[1])/2-34],welcome:[P_.stage[0]-30,P_.stage[1]+8],flag:P_.flagpole||[P_.townsq[0]+24,P_.townsq[1]],kiss:[P_.castle[0]+34,P_.castle[1]-40],castle:P_.stage,band:P_.townsq,fire:[P_.castle[0],P_.castle[1]-60]};
const busXY=b=>BUSP.at((1010-b.x)/370*BUSP.L);
const evP=(ev,s)=>{const q=EVPOS[ev.id]||P_.hub;return .25+.75*prox(q[0],q[1],s||380)};
function cue(ev){if(!AU.ready||speed>30)return;const d=AU.g.show,p=evP(ev);
 if(ev.id==='castle'||(ev.id==='welcome'&&!WELC.a.ready))play('fanfare',.7*p,d);else if(ev.id==='flag'){play('snare',.5*p,d);AU.last['snare'+ev.id]=performance.now()}else if(isParade(ev.id)||ev.id==='band'){play('snare',.55*p,d);AU.last['snare'+ev.id]=performance.now()}
 else if(ev.id==='fire')play('fw4',.6*p,d)}
function auSync(){for(const m of MONO)m._ps=m.st;for(const f of FERRY)f._ps=f.st;for(const b of BUS)b._ps=b.st;for(const ev of EV)ev._aps=ev.ph}
function lvl(k,v,tc){const l=AU.L[k];if(!isFinite(v))v=0;if(l)l.g.gain.setTargetAtTime(Math.max(0,v),AU.ctx.currentTime,tc||.6)}
function auTick(){if(!AU.ready||FF)return;
 // a large jump in simulated time means a seek or a fast speed: resync state without firing stale one-shots
 const jump=Math.abs(T-AU.lt)>Math.max(60,speed*3);AU.lt=T;if(jump){auSync();}
 const z=.6+.4*Math.min(1,cam.m/2),open=T>=8.5*3600&&T<22.5*3600,dens=Math.min(1,guests.length*K/24000),day=1-nf,zl=.5+.5*Math.min(1,Math.max(0,(cam.m-1)/1.5)),LP=k=>zl*prox(LANDS[k][1],LANDS[k][2],230);
 // beds
 lvl('crowd',(open?.12+.55*dens:.02)*z);
 let ce=0;for(const ev of EV)if(ev.ph==='gather'||ev.ph==='live'){ce=Math.max(ce,evP(ev,300)*(ev.ph==='live'?1:.55)*Math.min(1,.4+dens))}lvl('crowdEv',ce*.6);
 // nature sits well under the crowd, and drops further while a show's music is playing
 const nat=PARADES.some(P=>parPlaying(P.id))||(HEA.ready&&!HEA.audio.paused)?.35:1;
 lvl('birds',day*(.06+.1*(1-dens*.6))*nat);lvl('crickets',nf*.13*nat,1.5);
 {const gp=P_.geyser?geyserNow()*prox(P_.geyser[0],P_.geyser[1],200)*zl:0;lvl('falls',Math.max(LP('adv')*.3*nat,gp*.6))} /* the waterfall recording also stands in for the geyser's roar */lvl('jungle',LP('adv')*.24*(.4+.6*day)*nat);lvl('river',LP('fr')*.3*nat);
 lvl('lap',LP('lib')*.24*nat);lvl('flag',(LP('lib')*.22+LP('ms')*.12)*(.5+.5*day));
 lvl('chimes',LP('fan')*.2*nat);lvl('creek',LP('fan')*.15*nat);lvl('hum',LP('tom')*.38);{let lk=0;for(let i=0;i<=8;i++){const q=FER.at(FER.L*i/8);lk=Math.max(lk,prox(q[0],q[1],260))}lvl('lake',lk*.3*nat)} // anywhere along the lagoon crossing
 let bv=0;for(const b of BUS){const p=busXY(b);bv=Math.max(bv,prox(p[0],p[1],240)*(b.st==='dwell'?.55:1))}lvl('engine',bv*.5,.3);
 if(AU.L.engine)AU.L.engine.s.playbackRate.setTargetAtTime(BUS.some(b=>{const p=busXY(b);return b.st!=='dwell'&&prox(p[0],p[1],240)>.3})?.8:.62,AU.ctx.currentTime,.5);
 const F=EV.find(e=>e.id==='fire');lvl('fwbed',F&&F.ph==='live'&&playing?.55*evP(F,500):0,.4);
 if(jump)return;const q=speed<=30;const TR=AU.g.trans,SH=AU.g.show;
 // transport one-shots on state changes
 for(const m of MONO){if(m._ps!==m.st&&q){const mp=monoXY(m),p=prox(mp[0],mp[1],320);if(m.st==='dwell')play('doorsopen',.45*p,TR,.8);else{play('doorsclose',.45*p,TR);play('trainpass',.55*p,TR,1.6)}}m._ps=m.st}
 for(const f of FERRY){if(f._ps!==f.st&&q){const fp=FER.at(f.p*FER.L),p=prox(fp[0],fp[1],300);play(f.st==='run'?'bell2':'bell1',.5*p,TR)}f._ps=f.st}
 for(const b of BUS){if(b._ps!==b.st&&b.st==='dwell'&&q)play('doorsopen',.25*prox(P_.busstation[0],P_.busstation[1],240),TR,0,.85);b._ps=b.st}
 // horse-drawn streetcar on Main Street
 if(open&&q&&playing&&Math.random()<.035)play('horse',.35*LP('ms'),AU.g.amb,0,.95+Math.random()*.1);
 // entertainment: cadence during parades/band sets, applause when a show ends
 const now=performance.now();
 for(const ev of EV){const was=ev._aps;ev._aps=ev.ph;if(!q)continue;const p=evP(ev);
  if((isParade(ev.id)&&!parPlaying(ev.id)||ev.id==='band'||(ev.id==='flag'&&!anthemPlaying()))&&ev.ph==='live'&&playing&&now-(AU.last['snare'+ev.id]||0)>4200){play('snare',.45*p,SH,0,.97+Math.random()*.06);AU.last['snare'+ev.id]=now}
  if(was==='live'&&ev.ph!=='live')play(ev.id==='fire'?'applause_big':'applause',.8*p,SH)}}
function fwBurst(){if(!AU.ready||speed>30)return;const now=performance.now();if(now-(AU.last.fw||0)<110)return;AU.last.fw=now;
 const F=EV.find(e=>e.id==='fire');play('fw'+(1+(Math.random()*6|0)),(.35+.4*Math.random())*evP(F,500),AU.g.show,0,.85+Math.random()*.3)}
/* ===== AREA MUSIC =====
   Each land's background music loop (the owner's own copies, in audio/area-*.mp3, never committed). The music follows
   the camera: the land you are looking at plays, neighbouring lands blend in toward their edges, and it fades away as
   you zoom out over the lagoon. The Main Street view always hears Main Street. It drops right down while a parade,
   the fireworks or the water pageant has its own music playing, and stops after the park closes.
   The files are long (25 to 60 minutes) and simply loop; each keeps its place while it is silent. A missing file is
   skipped. */
const AREA={ms:'audio/area-ms.mp3',adv:'audio/area-adv.mp3',fr:'audio/area-fr.mp3',lib:'audio/area-lib.mp3',fan:'audio/area-fan.mp3',tom:'audio/area-tom.mp3',ep:'audio/area-ep.mp3'}; /* ep: EPCOT, heard anywhere over EPCOT */
const AM={el:{},vol:{},bad:{}};
function areaTargets(){const t={};for(const k in AREA)t[k]=0;
 if(T<OPEN*3600-1800||T>CLOSE*3600+900)return t;
 if(SV.on){t.ms=1;return t}
 if(typeof EPCOT!=='undefined'&&EPCOT&&cam.x>EPR[0]-250&&cam.x<EPR[2]+250&&cam.y>EPR[1]-250&&cam.y<EPR[3]+250){t.ep=Math.max(0,Math.min(1,(cam.m-.3)/.45));return t} /* over EPCOT: its one loop, fading as you zoom out */
 /* nearness of each land's centre to the middle of the screen; the nearest dominates, and everything fades as you zoom out */
 const zoom=Math.max(0,Math.min(1,(cam.m-.55)/.9)),w={};let sum=0,top=0;
 for(const k in AREA){const L=LANDS[k];if(!L)continue;let d=Math.hypot(cam.x-L[1],cam.y-L[2]);if(k==='ms'&&LANDS.hub)d=Math.min(d,Math.hypot(cam.x-LANDS.hub[1],cam.y-LANDS.hub[2])*.8); /* the hub in front of the castle plays Main Street's music, as in the park */
  const v=Math.exp(-d/150);w[k]=v**5;sum+=w[k];top=Math.max(top,v)}
 /* the nearest land dominates sharply (fifth power), so the hub hears mostly one land, not a muddle of six */
 if(sum>0)for(const k in w)t[k]=w[k]/sum*Math.min(1,top*2.2)*zoom;
 return t}
function areaTick(){if(!AU.ready)return;const t=areaTargets(),show=(HEA.ready&&!HEA.audio.paused)||PARADES.some(P=>parPlaying(P.id))||(typeof ewpPlaying==='function'&&ewpPlaying())||(typeof welcPlaying==='function'&&welcPlaying())||(typeof anthemPlaying==='function'&&anthemPlaying())||(typeof kissPlaying==='function'&&kissPlaying()),
  duck=(show?.12:1)*(1-.8*(typeof rideLevel==='number'?rideLevel:0)),base=(AU.mute?0:AU.v.master*AU.v.music)*(playing?1:0)*(speed>30?.4:1);
 for(const k in AREA){if(AM.bad[k])continue;const want=t[k]*duck*base,v=AM.vol[k]=(AM.vol[k]||0)+(want-(AM.vol[k]||0))*.12;let a=AM.el[k];
  if(v>.006){if(!a){a=AM.el[k]=new Audio(AREA[k]);a.loop=true;a.preload='auto';a.addEventListener('error',()=>{if(a.dataset.saved){AM.bad[k]=1;return}a.dataset.saved=1;areaSaved(k).then(b=>{if(b){a.src=URL.createObjectURL(b);a.play().catch(()=>{})}else{AM.bad[k]=1;console.warn('Area music not found:',AREA[k])}})} /* not on the site (GitHub Pages): use the copy kept in this browser by Load audio folder */)}
   setVol(a,v);if(a.paused)a.play().catch(()=>{})}
  else if(a&&!a.paused){setVol(a,0);a.pause()}}}
setInterval(areaTick,120);
/* ===== YOUR AUDIO, KEPT IN THIS BROWSER =====
   The Disney music is never put on the website itself (it is Disney's, and a public site would be giving it away). Instead,
   "Load audio folder…" in the ☰ menu reads your own audio folder once on each device and keeps the files in this
   browser's storage (IndexedDB), so a hosted copy of the site (GitHub Pages) plays them from then on. Files are matched by
   name: happily-ever-after.mp3, minnies-christmas-fireworks.mp3, let-the-magic-begin.mp3, kiss-goodnight.mp3, festival-of-fantasy.mp3, boo-to-you.mp3, once-upon-a-christmastime.mp3,
   electrical-water-pageant.mp3, area-*.mp3 and ride-*.mp3. Anything else in the folder is ignored. */
async function areaSaved(k){try{const db=await IDB();return await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('area-'+k);r.onsuccess=()=>res(r.result&&r.result.blob);r.onerror=()=>res(null)})}catch(e){return null}}
async function saveFile(key,f){const db=await IDB();await new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put({blob:f,name:f.name},key);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
function pickAudioFolder(){const i=document.createElement('input');i.type='file';i.multiple=true;i.webkitdirectory=true;i.onchange=()=>loadAudioFiles([...i.files]);i.click()}
async function loadAudioFiles(files){const st=t=>{const e=$('#afStat');if(e)e.textContent=t};let n=0,miss=0;
 try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist()}catch(e){} /* ask the browser not to clear it to save space */
 for(const f of files){const nm=f.name.toLowerCase();let key=null,use=null;
  if(nm==='happily-ever-after.mp3'){key='hea';use=()=>heaUse(f,f.name)}
  else if(nm==='minnies-christmas-fireworks.mp3'){key='minnie';use=()=>{const M=FW.shows.minnie;M.src='picked';M.el.src=URL.createObjectURL(f);M.el.load()}}
  else if(nm==='kiss-goodnight.mp3'){key='kiss';use=()=>{KISS.a.src='picked';KISS.a.audio.src=URL.createObjectURL(f);KISS.a.audio.load()}}
  else if(nm==='let-the-magic-begin.mp3'){key='welcome';use=()=>{WELC.a.src='picked';WELC.a.audio.src=URL.createObjectURL(f);WELC.a.audio.load()}}
  else if(nm==='electrical-water-pageant.mp3'){key='ewp';use=()=>ewpUse(f,f.name)}
  else{const P=PARADES.find(P=>P.file&&P.file.split('/').pop()===nm);if(P){key=P.id;use=()=>parUse(P,f,f.name)}
   else if(/^ride-(\w+)\.mp3$/.test(nm)){const k=/^ride-(\w+)\.mp3$/.exec(nm)[1];key='ride-'+k;use=()=>{RA.bad[k]=0;RA.url[k]=URL.createObjectURL(f)}}
   else{const m=/^area-(\w+)\.mp3$/.exec(nm);if(m&&AREA[m[1]]){key='area-'+m[1];use=()=>{const a=AM.el[m[1]];AM.bad[m[1]]=0;if(a){a.dataset.saved=1;a.src=URL.createObjectURL(f)}}}}}
  if(!key)continue;st(`Saving ${f.name}…`);try{await saveFile(key,f);use();n++}catch(e){miss++;console.warn('Could not keep',f.name,e)}}
 st(n?`${n} file${n>1?'s':''} kept in this browser${miss?` · ${miss} could not be saved (not enough space?)`:''}.`:'No matching audio files in that folder.');toast(n?'Audio saved in this browser':'No matching audio files found')}
/* ===== SOUND STARTS BY ITSELF =====
   Sound starts as the page opens. Browsers only allow that once you have interacted with a site (Chrome remembers sites
   you use a lot, and the TV launchers allow it outright); otherwise it starts on your first click, tap or key press
   anywhere, with a small reminder on screen until then. */
function soundRunning(){return AU.ctx&&AU.ctx.state==='running'}
function soundHint(){const h=$('#sndHint');if(h)h.hidden=soundRunning()||AU.mute}
function soundKick(){unlockRide();if(!AU.ctx){auInit();return}AU.ctx.resume().then(soundHint);for(const k in AM.el){const a=AM.el[k];if(a&&a.volume>.004&&a.paused)a.play().catch(()=>{})}}
function soundAuto(){auInit();setTimeout(soundHint,1500);
 const once=()=>{soundKick();if(soundRunning()||AU.ctx)setTimeout(()=>{if(soundRunning()){for(const e of['pointerdown','keydown','touchend'])removeEventListener(e,once,true)}soundHint()},300)};
 for(const e of['pointerdown','keydown','touchend'])addEventListener(e,once,true)}
/* ===== RIDE AUDIO =====
   A ride's own soundtrack (the owner's copies, audio/ride-<name>.mp3, never committed) fades in when you look closely
   at that ride, the way you hear it walking up to the entrance: when you tap the ride, when you zoom in on it, or when
   TV mode's camera visits it. The monorail works the same way: its onboard audio plays while TV mode follows a train,
   when you tap one, or when the mouse is over one. The land music dips underneath, and the ride fades out again as you move away. It only
   plays while the ride is running. Each track keeps its place, but starts from the top if it hasn't been heard for ten
   minutes, when it jumps to a random spot, so you drop in partway through as if walking up to the ride. To add a ride, put its file in audio/ and add a line to RIDEAUD. */
const RIDEAUD={'The Haunted Mansion':'mansion','Pirates of the Caribbean':'pirates','"it\'s a small world"':'smallworld','Space Mountain':'spacemtn','Tomorrowland Transit Authority PeopleMover':'peoplemover'};
const RA={bad:{},heard:{}};let rideLevel=0;
const rideAt=a=>a&&RIDEAUD[a.osm];
async function rideSaved(k){try{const db=await IDB();return await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('ride-'+k);r.onsuccess=()=>res(r.result&&r.result.blob);r.onerror=()=>res(null)})}catch(e){return null}}
let MONOHOVER=false; /* the mouse is over a monorail (set in ui.js) */
function rideTargets(){const t={};for(const n in RIDEAUD)t[RIDEAUD[n]]=0;t.monorail=0;
 if(SV.on)return t;
 /* the monorail's onboard audio (audio/ride-monorail.mp3): while TV mode rides along with a train, while a train's card is open, or while the mouse is over one; only in operating hours */
 if(T>OPEN*3600-5400&&T<CLOSE*3600+3600)t.monorail=follow&&follow.k==='m'?1:sel&&sel.k==='m'&&sheet==='detail'?.95:MONOHOVER?.85:0;const z=Math.max(0,Math.min(1,(cam.m-1.9)/1.1));
 for(const a of AT){const k=rideAt(a);if(!k)continue;const run=aStat(a)==='Operating'||aStat(a)==='Last riders';if(!run)continue;
  let v=z*Math.exp(-Math.hypot(cam.x-a.x,cam.y-a.y)/55); /* close in on it */
  if(sel&&sel.k==='a'&&sel.i===a.i&&sheet==='detail')v=Math.max(v,.9); /* you tapped it */
  t[k]=Math.max(t[k],Math.min(1,v*1.4))}
 /* only one ride (or the monorail) is heard at a time: the one you're closest to, or tapped. Neighbouring rides
    (Haunted Mansion and small world are next door to each other) would otherwise play over each other */
 let top=null;for(const k in t)if(t[k]>.02&&(!top||t[k]>t[top]))top=k;for(const k in t)if(k!==top)t[k]=0;return t}
/* One shared player for all ride audio (only one ride is heard at a time anyway). iPhones only let a page start an audio
   player in response to a tap, so this one player is unlocked on your first tap (unlockRide) and then reused for every
   ride and the monorail by swapping in each recording. Each recording streams (or, where the server cannot stream, is fetched whole and let go after it fades out);
   switching rides fades the current one out first, then the next one fades in from where it was (or, the first time or
   after ten minutes away, from a random point). */
/* Long music is streamed when the server allows it (it answers byte-range requests, as GitHub Pages and the launchers'
   tools/serve.py do): the player reads it straight from the server and can jump anywhere, without the whole file sitting in
   memory. Otherwise the whole file is fetched once into memory (a blob), which also lets it start anywhere. Resolves to
   the URL to play, or null when the file isn't there. */
const STREAMS={};
async function streamUrl(path){if(STREAMS[path])return path;try{const r=await fetch(path,{headers:{Range:'bytes=0-1'},cache:'no-store'});
  if(r.status===206){STREAMS[path]=1;try{r.body&&r.body.cancel()}catch(e){}return path}if(r.ok)return URL.createObjectURL(await r.blob())}catch(e){}return null}
const SILENT='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
RA.pos={};RA.url={};RA.tmp={};RA.cur=null;RA.lvl=0;RA.loading=null;
function rideEl(){if(!RA.one){const a=RA.one=new Audio();a.loop=true;a.preload='auto'}return RA.one}
function unlockRide(){const a=rideEl();if(RA.cur||RA.unlocked)return;try{a.src=SILENT;const p=a.play();if(p&&p.then)p.then(()=>{RA.unlocked=true;if(!RA.cur)a.pause()}).catch(()=>{})}catch(e){}}
async function rideUrl(k){if(RA.url[k])return RA.url[k];const u=await streamUrl('audio/ride-'+k+'.mp3');
 if(u){RA.url[k]=u;if(u.startsWith('blob:'))RA.tmp[k]=1}else{const b=await rideSaved(k);if(b){RA.url[k]=URL.createObjectURL(b);RA.tmp[k]=1}else RA.bad[k]=1}return RA.url[k]}
/* a ride recording held whole in memory is let go once it has faded out (it is fetched again next time); streamed ones cost nothing to keep */
function rideFree(k){if(!RA.tmp[k])return;URL.revokeObjectURL(RA.url[k]);delete RA.url[k];delete RA.tmp[k];const a=rideEl();a.src=SILENT}
function rideTick(){if(!AU.ready)return;const t=rideTargets(),show=(HEA.ready&&!HEA.audio.paused)||PARADES.some(P=>parPlaying(P.id)),
  base=(AU.mute?0:AU.v.master*AU.v.music*1.25)*(playing?1:0)*(speed>30?.3:1)*(show?.25:1);let top=null;for(const k in t)if(t[k]>0&&!RA.bad[k])top=k;const a=rideEl();
 if(RA.cur&&RA.cur!==top){RA.lvl*=.85;if(RA.lvl<.01){RA.pos[RA.cur]=a.currentTime;RA.heard[RA.cur]=Date.now();a.pause();rideFree(RA.cur);RA.cur=null;RA.lvl=0}} /* fade the old one out first */
 else if(!RA.cur&&top&&RA.loading!==top){const k=top;RA.loading=k;rideUrl(k).then(u=>{if(RA.loading!==k)return;RA.loading=null;if(!u||RA.cur)return;
   const fresh=!(k in RA.pos)||Date.now()-(RA.heard[k]||0)>10*60e3;a.src=u;RA.cur=k;RA.lvl=0;setVol(a,0);
   a.addEventListener('loadedmetadata',()=>{if(RA.cur!==k)return;a.currentTime=fresh&&isFinite(a.duration)?Math.random()*a.duration:RA.pos[k]||0;a.play().catch(()=>{})},{once:true})})}
 else if(RA.cur&&RA.cur===top){RA.lvl+=(t[top]*base-RA.lvl)*.06;if(a.paused&&a.readyState>0)a.play().catch(()=>{});RA.heard[top]=Date.now()}
 if(RA.cur)setVol(a,RA.lvl);
 rideLevel+=((top?t[top]:0)-rideLevel)*.06} /* how much the land music should step aside */
setInterval(rideTick,120);
