/* ===== TREE OF LIFE AWAKENINGS: Animal Kingdom's nighttime show on the Tree of Life =====
   After dark, while Animal Kingdom is open, the tree wakes up every quarter of an hour (the first show half an hour after
   sunset, the last one starting before the park closes): coloured light washes over the trunk, glowing spirit animals
   come out of the bark one after another, the carvings shimmer, and fireflies swirl through the canopy. The soundtrack
   (the owner's own copy, audio/tree-of-life.mp3, never committed; or the copy kept by Load audio folder) plays while the
   map is close to the tree, at 1x speed, and keeps the show's time; the show is as long as its music. */
const TOL={file:'audio/tree-of-life.mp3',a:{audio:new Audio(),ready:false,src:'folder',name:'audio/tree-of-life.mp3'},len:566,liveKey:null,spr:null};
{const A=TOL.a,a=A.audio;a.preload='auto';a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{if(isFinite(a.duration)&&a.duration>30)TOL.len=a.duration});
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('treeoflife');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 if(OSM.ak)setTimeout(()=>loadTrack(a,TOL.file),0)}
const tolPeriod=()=>Math.max(900,Math.ceil((TOL.len+120)/300)*300);
const tolFirst=()=>Math.ceil((sunset+.5)*4)/4*3600;
/* the show's own time: seconds since the current show began, or null when none is on */
function tolClock(){if(!OSM.ak||typeof ACLOSE==='undefined')return null;const s0=tolFirst(),end=ACLOSE*3600,P=tolPeriod();if(T<s0||s0>=end)return null;
 const k=Math.min(Math.floor((T-s0)/P),Math.floor((end-1-s0)/P)),st=T-(s0+k*P);return st<TOL.len+6?st:null}
const tolPlaying=()=>!TOL.a.audio.paused;
/* how much the map is looking at the tree: 1 close by on Discovery Island, nothing from the far side of the park */
function tolNear(){if(SV.on||!TOL_AT)return 0;return Math.max(0,Math.min(1,prox(TOL_AT.x,TOL_AT.y-TOL_AT.H*.5,300)*1.7-.08))}
function tolSync(){const A=TOL.a,a=A.audio,st=tolClock(),near=tolNear();
 if(st!==null&&st<5&&TOL.liveKey!==Math.round(T-st)){TOL.liveKey=Math.round(T-st);if(A.ready&&HEA.auto&&speed!==1&&!FF&&near>.15){speed=1;sync();toast('Tree of Life Awakenings is starting — speed set to 1× so the soundtrack stays in sync')}}
 const want=st!==null&&A.ready&&playing&&speed===1&&!FF&&near>.02&&st<a.duration-.5;
 if(!want){if(!a.paused)a.pause();return}
 setVol(a,(AU.mute?0:AU.v.master)*1.05*near);
 if(a.paused){a.currentTime=Math.max(0,st);a.play().catch(()=>{})}else syncTrack(A,a,a.currentTime-st,()=>{a.currentTime=Math.max(0,st)})}
/* a glowing spirit animal: the safari's animal drawn once in white on a little canvas, then tinted and added as light */
function tolSpirit(k){TOL.spr=TOL.spr||{};if(TOL.spr[k])return TOL.spr[k];const s=document.createElement('canvas');s.width=s.height=96;const g=s.getContext('2d');
 g.translate(48,70);g.scale(6,6);if(typeof safAnimal==='function')safAnimal(g,k,0);g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,96,96);return TOL.spr[k]=s}
const TOL_SP=['elephant','giraffe','lion','rhino','zebra','flamingo','ant','cheetah','ostrich','hippo'];
/* drawn after the night tint, as added light */
function tolDraw(now){const st=tolClock();if(st===null||!TOL_AT||SV.on||nf<.3)return;const{x,y,R,H}=TOL_AT,z=zf();
 if(Math.abs(x-cam.x)>cw/2/z+R*2||Math.abs(y-cam.y)>ch/2/z+H*1.5)return;
 const fade=Math.max(0,Math.min(1,st/8,(TOL.len-st)/8))*Math.min(1,nf*1.4),t=now/1000,sec=Math.floor(st/42),u=(st%42)/42,
  h=[200,280,30,140,330,50,180,260,10,100][sec%10],beat=.55+.45*Math.abs(Math.sin(st*1.9))*(.6+.4*Math.sin(st*.31)),c=cx,top=y-H,tw=R*.32;
 c.save();c.globalCompositeOperation='lighter';
 /* the wash of colour over the trunk and roots */
 let g=c.createRadialGradient(x,y-H*.45,1,x,y-H*.45,H*.55);g.addColorStop(0,hsl(h,90,60,.55*fade*beat));g.addColorStop(.7,hsl(h+40,90,50,.22*fade));g.addColorStop(1,hsl(h+40,90,50,0));
 c.fillStyle=g;c.beginPath();c.ellipse(x,y-H*.42,tw*2.4,H*.5,0,0,7);c.fill();
 /* the carvings shimmer: little arcs lighting up in a wave climbing the trunk */
 const r=seeded(1998);c.lineWidth=Math.max(.2,R*.02);for(let i=0;i<34;i++){const yy=y-r()*H*.8,xx=x+(r()-.5)*tw*1.6,w=tw*(.2+r()*.35),wv=Math.max(0,Math.sin((1-(y-yy)/H)*9-st*2.2));
  if(wv<.2)continue;c.strokeStyle=hsl(h+60*Math.sin(i),95,70,.8*fade*wv);c.beginPath();c.moveTo(xx-w,yy);c.quadraticCurveTo(xx,yy-w*.8,xx+w,yy);c.stroke()}
 /* this section's spirit animal rising out of the bark, growing, then fading back in */
 const sp=tolSpirit(TOL_SP[sec%TOL_SP.length]),ap=Math.sin(Math.PI*Math.min(1,u*1.15))*fade,sz=tw*(2.4+.5*u),flip=sec%2?-1:1;
 if(ap>.02){const tc=document.createElement('canvas');tc.width=tc.height=96;const q=tc.getContext('2d');q.drawImage(sp,0,0);q.globalCompositeOperation='source-in';q.fillStyle=hsl(h+20,100,72,1);q.fillRect(0,0,96,96);
  c.globalAlpha=ap*.95;c.save();c.translate(x,y-H*(.3+.12*u));c.scale(flip,1);c.drawImage(tc,-sz/2,-sz*.73,sz,sz);c.restore();c.globalAlpha=ap*.35;c.save();c.translate(x,y-H*(.3+.12*u));c.scale(flip*1.15,1.15);c.drawImage(tc,-sz/2,-sz*.73,sz,sz);c.restore();c.globalAlpha=1}
 /* the canopy glows from inside, and fireflies swirl round it */
 g=c.createRadialGradient(x,top,1,x,top,R*1.1);g.addColorStop(0,hsl(h+120,80,60,.3*fade*beat));g.addColorStop(1,hsl(h+120,80,60,0));c.fillStyle=g;c.beginPath();c.ellipse(x,top,R*1.15,R*.55,0,0,7);c.fill();
 for(let i=0;i<60;i++){const a=i*2.399+t*(.15+.1*(i%3))+st*.05,d=.25+.8*((i*.618)%1),fx=x+Math.cos(a)*R*1.05*d,fy=top+Math.sin(a)*R*.42*d-R*.05,tw2=.5+.5*Math.sin(t*3+i*1.7);
  c.fillStyle=hsl(i%2?h:h+180,100,80,.85*fade*tw2);c.beginPath();c.arc(fx,fy,Math.max(.25,R*.025),0,7);c.fill()}
 c.restore()}
/* today's showtimes, and "Jump to the next show" (Entertainment): the clock goes to just before the next show, at 1x so
   the soundtrack keeps time, and the map flies to the tree. Past the last show of the day, it goes back to the first one. */
function tolTimes(){if(!OSM.ak||typeof ACLOSE==='undefined')return[];const s0=tolFirst(),end=ACLOSE*3600,P=tolPeriod(),o=[];for(let t=s0;t<end;t+=P)o.push(t);return o}
function tolLook(){if(SV.on)setView(false);follow=null;sel=null;const x=TOL_AT?TOL_AT.x:P_.tol[0],y=TOL_AT?TOL_AT.y-TOL_AT.H*.5:P_.tol[1];cam.x=cam.tx=x;cam.y=cam.ty=y;cam.tm=Math.max(2.6,Math.min(cam.tm,4));cam.m=cam.tm}
function tolJump(){const ts=tolTimes();if(!ts.length){toast('No Tree of Life shows today: Animal Kingdom closes before dark');return}
 const n=ts.find(t=>t>T+20)??ts[0];if(typeof LIVE!=='undefined'&&LIVE.follow&&typeof liveUnfollow==='function')liveUnfollow();
 if(!AU.ready)auInit();seek(n-20,n<T);speed=1;playing=true;sync();tolLook();if(typeof closeSheet==='function')closeSheet();
 if(!TOL.a.ready)toast('Add audio/tree-of-life.mp3 (or include it in Load audio folder) to hear the show');TOL.a.audio.play().then(()=>TOL.a.audio.pause()).catch(()=>{})} /* the tap unlocks its player */
