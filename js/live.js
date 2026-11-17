/* ===== LIVE: the real park, right now =====
   Real wait times, ride closures, show times and park hours for Magic Kingdom come from the free ThemeParks.wiki API
   (https://themeparks.wiki — not affiliated with Disney), refreshed every five minutes. When "Live" is on, the
   simulator's clock follows the real time in Orlando at 1× and every wait time shown is the posted one; the guests,
   vehicles and crowds are still simulated around those numbers. Scrub the time, pause or change speed and it drops back
   to a plain simulation until you press Live again. If the data can't be fetched, everything simply stays simulated. */
const LIVE={on:false,follow:false,ok:false,at:0,err:'',matched:0,api:'https://api.themeparks.wiki/v1/entity/75ea578a-adc8-4116-a54d-dccb60765ef9',epApi:'https://api.themeparks.wiki/v1/entity/47f90d2c-e191-4239-a466-5892ef59a88b',epHours:null,hsApi:'https://api.themeparks.wiki/v1/entity/288747d1-8b4f-4a64-867e-ea7c9b27bad8',hsHours:null,schedAt:0,inTick:false,hours:null};
// the time in the park: {date:'YYYY-MM-DD', s: seconds since midnight}
function parkClock(){const p={};for(const x of new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date()))p[x.type]=x.value;
 return{date:`${p.year}-${p.month}-${p.day}`,s:+p.hour%24*3600+ +p.minute*60+ +p.second+Date.now()%1000/1000}}
const liveNorm=s=>s.toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/\b(the|walt disneys|disney|mickeys)\b/g,'').replace(/[^a-z0-9]/g,'').replace('jinglecruise','junglecruise'); // (the Jungle Cruise is renamed for Christmas)
// which of the park's shows drive which of ours; the first pattern that matches wins
const LIVE_SHOWS=[[/festival of fantasy/i,'parade'],[/boo.to.you/i,'boo'],[/once upon a christmastime parade/i,'xmas'],[/happily ever after|fireworks/i,'fire'],[/friendship faire/i,'castle'],[/flag retreat/i,'flag'],[/cavalcade/i,'caval'],[/philharmonic/i,'band']];
const isoSec=(iso,date)=>{const m=/^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(iso||'');if(!m)return null;const s=+m[2]*3600+ +m[3]*60;return m[1]===date?s:m[1]>date?86400+s:null}; // seconds into `date`; past midnight counts on
async function liveFetch(){try{const c=parkClock(),get=u=>fetch(u,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)));
  const live=await get(LIVE.api+'/live'),ep=await get(LIVE.epApi+'/live').catch(()=>null),hs=OSM.hs?await get(LIVE.hsApi+'/live').catch(()=>null):null; /* EPCOT's and Hollywood Studios' rides too */
  if(Date.now()-LIVE.schedAt>36e5||LIVE.schedDate!==c.date){try{LIVE.sched=await get(LIVE.api+'/schedule');LIVE.schedAt=Date.now();LIVE.schedDate=c.date}catch(e){}try{LIVE.epSched=await get(LIVE.epApi+'/schedule')}catch(e){}if(OSM.hs)try{LIVE.hsSched=await get(LIVE.hsApi+'/schedule')}catch(e){}}
  liveApply(live,c,ep,hs);LIVE.ok=true;LIVE.at=Date.now();LIVE.err=''}catch(e){LIVE.err=String(e.message||e);if(Date.now()-LIVE.at>30*60e3)LIVE.ok=false}
 liveBadge()}
// names that differ between the map data and the live feed (Soarin' is showing its America film for 2026)
const LIVE_ALIAS={'Soarin\' Around The World':['Soarin\' Across America','Soarin\' Around the World'],'Canada Far and Wide':['Canada Far and Wide in Circle-Vision 360'],'Impressions de France;Beauty and the Beast Sing-Along':['Impressions de France'],'Mickey Shorts Theater':['Vacation Fun - An Original Animated Short with Mickey & Minnie'],'The Magic of Disney Animation':['Olaf Draws!']};
function liveApply(live,c,ep,hs){const by={};for(const x of[...(live.liveData||[]),...(ep&&ep.liveData||[]),...(hs&&hs.liveData||[])])if(x.entityType==='ATTRACTION')by[liveNorm(x.name)]=x;
 LIVE.matched=0;for(const a of AT){const x=by[liveNorm(a.osm)]||by[liveNorm(a.n)]||(LIVE_ALIAS[a.osm]||[]).map(n=>by[liveNorm(n)]).find(Boolean);if(!x){a.live=null;continue}const w=x.queue&&x.queue.STANDBY?x.queue.STANDBY.waitTime:null;a.live={st:x.status||'OPERATING',w:typeof w==='number'?w:null,at:x.lastUpdated};LIVE.matched++}
 {const ws=AT.filter(a=>a.live&&a.live.st==='OPERATING'&&a.live.w!==null).map(a=>a.live.w);LIVE.crowd=ws.length>5?Math.max(.6,Math.min(1.5,ws.reduce((p,q)=>p+q,0)/ws.length/26)):1} /* how busy the real park is: the average posted wait against a typical day's */
 // park hours today: regular hours, plus any ticketed event (a party) that runs on into the night
 if(LIVE.sched){const day=(LIVE.sched.schedule||[]).filter(e=>e.date===c.date),op=day.find(e=>e.type==='OPERATING');
  if(op){const o=isoSec(op.openingTime,c.date);let cl=isoSec(op.closingTime,c.date);for(const e of day)if(e.type==='TICKETED_EVENT'){const s=isoSec(e.openingTime,c.date),en=isoSec(e.closingTime,c.date);if(s!==null&&en!==null&&s>=cl-3600&&en>cl)cl=en}
   if(o!==null&&cl!==null)LIVE.hours=[o/3600,Math.min(23.75,cl/3600)]}}
 if(LIVE.epSched){const op=(LIVE.epSched.schedule||[]).find(e=>e.date===c.date&&e.type==='OPERATING');if(op){const o=isoSec(op.openingTime,c.date),cl=isoSec(op.closingTime,c.date);if(o!==null&&cl!==null)LIVE.epHours=[o/3600,Math.min(23.75,cl/3600)]}} /* EPCOT's own hours */
 if(LIVE.hsSched){const op=(LIVE.hsSched.schedule||[]).find(e=>e.date===c.date&&e.type==='OPERATING');if(op){const o=isoSec(op.openingTime,c.date),cl=isoSec(op.closingTime,c.date);if(o!==null&&cl!==null)LIVE.hsHours=[o/3600,Math.min(23.75,cl/3600)]}} /* and Hollywood Studios' */
 // today's show times
 const times={};for(const x of live.liveData||[]){if(x.entityType!=='SHOW')continue;const m=LIVE_SHOWS.find(([re])=>re.test(x.name));if(!m)continue;const t=times[m[1]]||(times[m[1]]=new Set());for(const s of x.showtimes||[]){const v=isoSec(s.startTime,c.date);if(v!==null&&v<86400-20*60)t.add(v)}}
 LIVE.fwShow=(live.liveData||[]).some(x=>x.entityType==='SHOW'&&/minnie.*fireworks/i.test(x.name)&&(x.showtimes||[]).some(s=>isoSec(s.startTime,c.date)!==null))?'minnie':'hea'; /* party night: Minnie's fireworks instead of Happily Ever After */
 LIVE.shows={};for(const[,id]of LIVE_SHOWS)LIVE.shows[id]=[...(times[id]||[])].sort((a,b)=>a-b);
 {const lt=new Set();for(const x of(ep&&ep.liveData)||[])if(x.entityType==='SHOW'&&/luminous/i.test(x.name))for(const s of x.showtimes||[]){const v=isoSec(s.startTime,c.date);if(v!==null&&v<86400-20*60)lt.add(v)}if(ep)LIVE.shows.lum=[...lt].sort((a,b)=>a-b)} /* EPCOT's Luminous, from its own feed */
 {const ft=new Set();for(const x of(hs&&hs.liveData)||[])if(x.entityType==='SHOW'&&/^fantasmic/i.test(x.name))for(const s of x.showtimes||[]){const v=isoSec(s.startTime,c.date);if(v!==null&&v<86400-30*60)ft.add(v)}if(hs)LIVE.shows.fmic=[...ft].sort((a,b)=>a-b)} /* and Hollywood Studios' Fantasmic! */
 if(LIVE.follow)liveSchedule(true)}
// put today's real hours and show times into the simulation (on), or give back the built-in ones (off)
function liveSchedule(on){for(const e of EV){if(!LIVE.shows||!(e.id in LIVE.shows))continue;if(e.t0===undefined){e.t0=e.t.slice();e.on0=e.on;e.userOn0=e.userOn}
  if(on){const t=LIVE.shows[e.id];if(t.length){e.t=t.slice();e.on=true}else e.on=false;e.userOn=true}else{e.t=e.t0.slice();e.on=e.on0;e.userOn=e.userOn0;delete e.t0}
  if(e.force&&e.force.length){e.t=[...new Set([...e.t,...e.force])].sort((a,b)=>a-b);e.on=true}} /* a show started by hand keeps going */
 if(on&&LIVE.hours)setHours(LIVE.hours[0],LIVE.hours[1]);else if(!on){setHours(9,22);dayParams()}
 if(on&&LIVE.epHours)setHoursEP(LIVE.epHours[0],LIVE.epHours[1]);else if(!on)setHoursEP(9,21);
 if(on&&LIVE.hsHours)setHoursHS(LIVE.hsHours[0],LIVE.hsHours[1]);else if(!on)setHoursHS(9,21)}
function liveFollow(){if(!LIVE.ok)return;LIVE.on=LIVE.follow=true;liveSchedule(true);const c=parkClock();LIVE.inTick=true;dateStr=c.date;reset(Math.min(7*3600,c.s));seek(c.s,false);LIVE.inTick=false;speed=1;playing=true;sync();liveBadge()}
function liveUnfollow(){if(!LIVE.follow)return;LIVE.follow=false;LIVENOW=false;CROWDX=1;liveSchedule(false);liveBadge()}
// called every frame: keep the clock on the real time, and say whether the live numbers apply right now
function liveTick(){if(!LIVE.follow){LIVENOW=false;return}const c=parkClock();LIVE.inTick=true;
 if(dateStr!==c.date){dateStr=c.date;liveSchedule(true);reset(Math.min(7*3600,c.s));seek(c.s,false)}
 else{const d=c.s-T,music=(HEA.ready&&!HEA.audio.paused)||PARADES.some(P=>parPlaying(P.id))||ewpPlaying()||lumPlaying()||fmPlaying(); // while a show's music is playing it keeps the time
  if(!music&&Math.abs(d)>3){if(d>0&&d<=120||d<0&&d>-120)T=c.s;else seek(c.s,d<0)}}
 LIVE.inTick=false;if(speed!==1||!playing){speed=1;playing=true;sync()}
 LIVENOW=LIVE.ok&&Date.now()-LIVE.at<25*60e3;CROWDX=LIVENOW?LIVE.crowd||1:1}
// any jump in time that isn't ours means the viewer has taken the clock back
{const seek0=seek;seek=function(t,force){if(!LIVE.inTick&&!CATCHUP)liveUnfollow();return seek0(t,force)}}
function liveBadge(){const b=$('#liveBtn');if(!b)return;b.hidden=!LIVE.ok;b.classList.toggle('on',LIVE.follow);b.textContent=LIVE.follow?'● Live':'Go live';b.title=LIVE.follow?'Showing the real park right now. Live data: ThemeParks.wiki':'Jump to the real time and real wait times';
 const o=$('#osmc');if(o)o.textContent='Map data © OpenStreetMap contributors'+(LIVE.follow?' · Live data: ThemeParks.wiki':'')}
const liveText=a=>LIVENOW&&a.live?`Live from the park${a.live.at?' · updated '+new Date(a.live.at).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}):''}`:'Simulated estimate';
// start: fetch now and every five minutes; go live as soon as there is data (add ?sim to the address to stay simulated)
function liveInit(){const want=!/[?&]sim\b/.test(location.search);liveFetch().then(()=>{if(want&&LIVE.ok)liveFollow()});setInterval(liveFetch,5*60e3)}
