/* ===== PARADES =====
   Two parades share the real parade route (OpenStreetMap) from Frontierland to Town Square:
   the daytime Festival of Fantasy, and on evenings in their seasons the Halloween parade (Boo to You) and the Christmas
   parade (Once Upon a Christmastime).
   The floats are original designs; the characters who ride and walk with them are drawn in characters.js. Each parade has an optional soundtrack in
   audio/, which starts and stays in sync with it the same way the fireworks music does. */
// line-up: [kind, distance behind the lead unit in metres]
const PARADE_UNITS=[['drum',0],['coach',26],['dancers',56],['garden',76],['stilts',106],['sea',126],['flags',156],['galleon',176],['pals',206],['ice',226],['pooh',256],['book',278]];
const XMAS_UNITS=[['xdrum',0],['xtree',26],['soldiers',54],['ginger',76],['elves',104],['candy',124],['snow',152],['toybox',174],['soldiers',202],['xpooh',222],['sleigh',246]];
const BOO_UNITS=[['horseman',0],['pumpkins',30],['ghosts',58],['haunted',80],['diggers',108],['cauldron',130],['skeletons',158],['treats',180],['scarecrows',208],['web',230],['villains',256]];
const CAV_UNITS=[['cavcar',0],['pals',15],['royals',33],['pooh',50]]; // a cavalcade: a short, quick procession with no floats to speak of
// id = the event's id in sim.js; len = length of the line-up in metres; a = soundtrack state (filled in below)
const PARADES=[{id:'parade',n:'Festival of Fantasy',file:'audio/festival-of-fantasy.mp3',units:PARADE_UNITS,len:300},
 {id:'boo',n:'Boo to You Halloween',file:'audio/boo-to-you.mp3',units:BOO_UNITS,len:282},
 {id:'xmas',n:'Once Upon a Christmastime',file:'audio/once-upon-a-christmastime.mp3',units:XMAS_UNITS,len:270},
 {id:'caval',n:'Adventure Friends Cavalcade',file:null,units:CAV_UNITS,len:62}]; // (no soundtrack: it steps along to the drum cadence)
const parOf=id=>PARADES.find(p=>p.id===id),isParade=id=>!!parOf(id);
const paradeEv=id=>EV.find(e=>e.id===(id||'parade'));
const liveParade=()=>PARADES.find(p=>{const e=paradeEv(p.id);return e&&e.ph==='live'});
const paradeBusy=()=>PARADES.some(p=>{const e=paradeEv(p.id);return e&&(e.ph==='live'||e.ph==='gather')}); // a parade is on the route, or the crowd is gathering for one
/* position of every unit right now (map units), or [] when no parade is on the route */
function paradeUnits(){const P=liveParade();if(!P)return[];const ev=paradeEv(P.id),head=ev.p*(PR.L+P.len*OSM.S),out=[];
 for(const[k,back]of P.units){const d=head-back*OSM.S;if(d<0||d>PR.L)continue;const[x,y,a]=PR.at(d);out.push({k,x,y,a,d})}return out}
/* ---------- artwork: drawn upright in metres, scale s = pixels (or map units) per metre ---------- */
const FL={
 base(c,s,L,col,night){const h=1.1*s;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(.6*s,0,L*s*.55,1.1*s,0,0,7);c.fill();
  c.fillStyle=col;c.beginPath();c.roundRect(-L*s/2,-h,L*s,h,.35*s);c.fill();c.fillStyle='#f2c444';c.fillRect(-L*s/2,-h,L*s,.22*s);
  for(let x=-L/2+.35;x<L/2;x+=.7){c.beginPath();c.arc(x*s,-h+.22*s,.3*s,0,Math.PI);c.fill()}
  if(night)FL.bulbs(c,s,[[-L/2,-1.1],[L/2,-1.1]],.6)},
 bulbs(c,s,line,step){c.save();c.globalCompositeOperation='lighter';const[[x0,y0],[x1,y1]]=line,n=Math.max(2,Math.round(Math.hypot(x1-x0,y1-y0)/step));
  for(let i=0;i<=n;i++){const x=(x0+(x1-x0)*i/n)*s,y=(y0+(y1-y0)*i/n)*s;c.fillStyle=['#fff3c4','#ffd1f0','#c9f0ff'][i%3];c.beginPath();c.arc(x,y,Math.max(.6,.16*s),0,7);c.fill()}c.restore()},
 rider(c,s,x,y,col,t){c.fillStyle=col;c.fillRect((x-.22)*s,(y-1.2)*s,.44*s,.8*s);c.fillStyle='#f2c9a0';c.beginPath();c.arc(x*s,(y-1.45)*s+Math.sin(t*4+x)*.05*s,.2*s,0,7);c.fill();
  c.strokeStyle='#f2c9a0';c.lineWidth=Math.max(.5,.1*s);c.beginPath();c.moveTo((x-.2)*s,(y-1.05)*s);c.lineTo((x-.5)*s,(y-1.5+Math.sin(t*5+x)*.25)*s);c.stroke()},
 coach(c,s,t,n){FL.base(c,s,9,'#2f4fa8',n);
  for(const hx of[3.6,2.3]){c.fillStyle='#f6f2ea';c.fillRect((hx-.9)*s,-2.4*s,1.8*s,.8*s);c.fillRect((hx+.6)*s,-3*s,.45*s,1*s);c.fillStyle='#e9e2d6';const lg=Math.sin(t*6+hx)*.15;c.fillRect((hx-.8+lg)*s,-1.6*s,.2*s,.6*s);c.fillRect((hx+.5-lg)*s,-1.6*s,.2*s,.6*s);c.fillStyle='#c9a227';c.fillRect((hx+.55)*s,-3.2*s,.5*s,.25*s)}
  c.strokeStyle='#f2c444';c.lineWidth=Math.max(.6,.18*s);for(const wx of[-2.6,.2]){c.beginPath();c.arc(wx*s,-1.7*s,.9*s,0,7);c.stroke()}
  const g=c.createRadialGradient(-1.3*s,-3.6*s,.2*s,-1.2*s,-3*s,2.2*s);g.addColorStop(0,'#fff6c8');g.addColorStop(1,'#d9a520');c.fillStyle=g;c.beginPath();c.ellipse(-1.2*s,-3*s,2*s,1.5*s,0,0,7);c.fill();
  c.fillStyle='#9fd0ff';c.beginPath();c.ellipse(-1.2*s,-3.1*s,.7*s,.9*s,0,0,7);c.fill();c.fillStyle='#f2c444';for(let i=-1;i<=1;i++){c.beginPath();c.moveTo((-1.2+i*.35)*s,-4.4*s);c.lineTo((-1.05+i*.35)*s,-5*s);c.lineTo((-.9+i*.35)*s,-4.4*s);c.fill()}
  drawChar(c,s,-2,-1.1,'cinderella',t);drawChar(c,s,-.7,-1.1,'prince',t);if(n)FL.bulbs(c,s,[[-3.2,-3],[.8,-3]],.45)},
 garden(c,s,t,n){FL.base(c,s,10,'#3f8a3c',n);const fl=[[-3.4,3.6,'#ff6f9f'],[-1.2,5,'#ffd23f'],[1.2,4.2,'#b06ae8'],[3.3,3.2,'#ff8a3d']];
  for(const[x,h,col]of fl){c.strokeStyle='#3f7a35';c.lineWidth=Math.max(.6,.22*s);c.beginPath();c.moveTo(x*s,-1.1*s);c.quadraticCurveTo((x+.4)*s,-(h*.6)*s,x*s,-h*s);c.stroke();
   const r=.9*s,sp=t*.6+x;for(let i=0;i<8;i++){const a=sp+i/8*6.283;c.fillStyle=col;c.beginPath();c.ellipse(x*s+Math.cos(a)*r*.7,-h*s+Math.sin(a)*r*.7,r*.45,r*.28,a,0,7);c.fill()}c.fillStyle='#fff3a6';c.beginPath();c.arc(x*s,-h*s,r*.35,0,7);c.fill()}
  for(const[x,r]of[[-4.3,.7],[4.3,.6]]){c.fillStyle='#fff';c.fillRect((x-.15)*s,-1.9*s,.3*s,.8*s);c.fillStyle='#d6303f';c.beginPath();c.ellipse(x*s,-1.9*s,r*s,r*.6*s,0,Math.PI,0);c.fill();c.fillStyle='#fff';c.beginPath();c.arc((x-.25)*s,-2.15*s,.1*s,0,7);c.fill()}
  drawChar(c,s,-2.3,-1.1,'rapunzel',t);drawChar(c,s,-.1,-1.1,'belle',t);drawChar(c,s,2.3,-1.1,'tiana',t)},
 sea(c,s,t,n){FL.base(c,s,10,'#1f8a9a',n);c.save();c.translate(0,-1.1*s);
  for(let i=0;i<9;i++){const a=Math.PI+i/8*Math.PI;c.fillStyle=i%2?'#ffd9e6':'#ffc1d6';c.beginPath();c.moveTo(0,0);c.arc(0,0,4.4*s,a-.17,a+.17);c.closePath();c.fill()}
  c.restore();for(let i=-2;i<=2;i++){const x=i*2,ph=Math.sin(t*2+i)*.2;c.fillStyle='#3fa6d6';c.beginPath();c.arc(x*s,(-1.4+ph)*s,.9*s,Math.PI,0);c.fill();c.fillStyle='#fff';c.beginPath();c.arc((x+.4)*s,(-1.9+ph)*s,.3*s,Math.PI,0);c.fill()}
  c.fillStyle='#fff';c.beginPath();c.arc(0,-2.8*s,.5*s,0,7);c.fill();drawChar(c,s,0,-2.75,'ariel',t);if(n)FL.bulbs(c,s,[[-4.2,-1.4],[4.2,-1.4]],.5)},
 galleon(c,s,t,n){c.fillStyle='rgba(255,255,255,.92)';for(const[x,r]of[[-3.5,1.2],[-1.5,1.4],[1,1.3],[3.4,1.1]]){c.beginPath();c.arc(x*s,-.9*s,r*s,0,7);c.fill()}
  const bob=Math.sin(t*1.5)*.25;c.save();c.translate(0,bob*s);c.fillStyle='#7a4a2a';c.beginPath();c.moveTo(-4.6*s,-2.4*s);c.lineTo(4.4*s,-2.4*s);c.lineTo(3.4*s,-1*s);c.lineTo(-3.6*s,-1*s);c.closePath();c.fill();
  c.fillStyle='#f2c444';c.fillRect(-4.3*s,-2.3*s,8.4*s,.2*s);c.strokeStyle='#5a3a22';c.lineWidth=Math.max(.6,.18*s);for(const mx of[-1.5,1.5]){c.beginPath();c.moveTo(mx*s,-2.4*s);c.lineTo(mx*s,-7*s);c.stroke();
   c.fillStyle='#fffaf0';c.beginPath();c.moveTo((mx-1.3)*s,-6.5*s);c.quadraticCurveTo((mx+.4)*s,-5.4*s,(mx-1.3)*s,-3*s);c.lineTo((mx+1.2)*s,-3*s);c.quadraticCurveTo((mx+1.9)*s,-4.8*s,(mx+1.2)*s,-6.5*s);c.fill();
   c.fillStyle='#d6303f';c.beginPath();c.moveTo(mx*s,-7*s);c.lineTo((mx+1)*s,(-6.75+Math.sin(t*5)*.1)*s);c.lineTo(mx*s,-6.5*s);c.fill()}
  drawChar(c,s,-3.5,-2.4,'hook',t);drawChar(c,s,.1,-2.4,'wendy',t);drawChar(c,s,3.3,-2.4,'peter',t);drawChar(c,s,2,-6.4+Math.sin(t*2)*.3,'tink',t);
  c.restore();if(n)FL.bulbs(c,s,[[-4.4,-2.4],[4.2,-2.4]],.45)},
 ice(c,s,t,n){FL.base(c,s,10,'#cfe6f5',n);const sp=[[-3.5,3],[-2,4.6],[0,6.4],[2,4.2],[3.6,2.8]];
  for(const[x,h]of sp){const g=c.createLinearGradient((x-1)*s,0,(x+1)*s,0);g.addColorStop(0,'rgba(230,248,255,.95)');g.addColorStop(1,'rgba(120,190,235,.9)');c.fillStyle=g;c.beginPath();c.moveTo((x-.9)*s,-1.1*s);c.lineTo(x*s,-(1.1+h)*s);c.lineTo((x+.9)*s,-1.1*s);c.fill()}
  c.save();c.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const x=Math.sin(i*2.1+t)*3.5,y=-2-((t*.6+i*.7)%4.5);c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(x*s,y*s,Math.max(.5,.12*s),0,7);c.fill()}c.restore();
  drawChar(c,s,-1,-1.1,'anna',t);drawChar(c,s,1,-1.1,'elsa',t)},
 book(c,s,t,n){FL.base(c,s,10,'#6a3fa0',n);c.fillStyle='#8a5a32';c.beginPath();c.moveTo(-4.6*s,-1.4*s);c.lineTo(0,-2.2*s);c.lineTo(4.6*s,-1.4*s);c.lineTo(4.6*s,-1.1*s);c.lineTo(-4.6*s,-1.1*s);c.fill();
  for(const sd of[-1,1]){c.fillStyle='#fffaf0';c.beginPath();c.moveTo(0,-2.2*s);c.quadraticCurveTo(sd*2.2*s,-3.4*s,sd*4.4*s,-2.6*s);c.lineTo(sd*4.4*s,-1.5*s);c.quadraticCurveTo(sd*2.2*s,-2.2*s,0,-2.2*s);c.fill();
   c.strokeStyle='rgba(120,100,80,.4)';c.lineWidth=Math.max(.4,.06*s);for(let i=1;i<4;i++){c.beginPath();c.moveTo(sd*.6*i*s,(-2.3-i*.25)*s);c.lineTo(sd*(.6*i+1)*s,(-2.45-i*.25)*s);c.stroke()}}
  // pop-up castle
  c.fillStyle='#f5d9df';c.fillRect(-1.2*s,-4.6*s,2.4*s,2.4*s);for(const[x,h]of[[-1.2,1.6],[1.2,1.6],[0,2.6]]){c.fillStyle='#f5d9df';c.fillRect((x-.35)*s,-(4.6+h*.6)*s,.7*s,h*.6*s);c.fillStyle='#2f5ad0';c.beginPath();c.moveTo((x-.5)*s,-(4.6+h*.6)*s);c.lineTo(x*s,-(4.6+h*.6+1.3)*s);c.lineTo((x+.5)*s,-(4.6+h*.6)*s);c.fill()}
  c.save();c.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const a=t*1.2+i*1.256,x=Math.cos(a)*3.2,y=-5-Math.sin(a)*1.2;c.fillStyle='#ffe58a';c.beginPath();c.arc(x*s,y*s,Math.max(.5,.18*s),0,7);c.fill()}c.restore();
  drawChar(c,s,-2.7,-2.7,'mickey',t);drawChar(c,s,2.7,-2.7,'minnie',t);if(n)FL.bulbs(c,s,[[-4.4,-2.6],[4.4,-2.6]],.45)},
 /* ---- Halloween parade units ---- */
 // a carved pumpkin: centre (x,y) and radius r in metres; the face glows after dark
 jack(c,s,x,y,r,n,t){c.fillStyle='#e8791e';c.beginPath();c.ellipse(x*s,y*s,r*s,r*.85*s,0,0,7);c.fill();c.strokeStyle='rgba(150,70,10,.55)';c.lineWidth=Math.max(.4,.05*s);for(const k of[-.5,0,.5]){c.beginPath();c.ellipse((x+k*r)*s,y*s,r*.33*s,r*.85*s,0,0,7);c.stroke()}
  c.fillStyle='#4a7a2a';c.fillRect((x-.1*r)*s,(y-r*1.08)*s,.2*r*s,.32*r*s);c.save();if(n){c.globalCompositeOperation='lighter';c.fillStyle=`rgba(255,${200+40*Math.sin((t||0)*9+x)|0},90,.95)`}else c.fillStyle='#3a1d08';
  for(const sd of[-1,1]){c.beginPath();c.moveTo((x+sd*.5*r)*s,(y-.1*r)*s);c.lineTo((x+sd*.2*r)*s,(y-.1*r)*s);c.lineTo((x+sd*.35*r)*s,(y-.45*r)*s);c.fill()}
  c.beginPath();c.moveTo((x-.55*r)*s,(y+.2*r)*s);for(let k=1;k<=6;k++)c.lineTo((x-.55*r+k*1.1*r/6)*s,(y+(k%2?.45:.25)*r)*s);c.lineTo((x+.55*r)*s,(y+.2*r)*s);c.fill();c.restore()},
 // the lead rider: a headless horseman on a black horse, holding a glowing pumpkin high
 horseman(c,s,t,n){c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(.3*s,0,2.2*s,.5*s,0,0,7);c.fill();const g=Math.sin(t*7),y=-1.75+g*.08;
  c.strokeStyle='#17171f';c.lineWidth=Math.max(.6,.2*s);for(const[dx,d]of[[-1,g*.4],[-.65,-g*.4],[.75,g*.4],[1.05,-g*.4]]){c.beginPath();c.moveTo(dx*s,(y+.3)*s);c.lineTo((dx+d)*s,(y+1)*s);c.lineTo((dx+d*1.5)*s,0);c.stroke()}
  c.fillStyle='#1d1d28';c.beginPath();c.ellipse(0,y*s,1.35*s,.55*s,0,0,7);c.fill();c.beginPath();c.moveTo(.8*s,(y-.2)*s);c.lineTo(1.5*s,(y-1.25)*s);c.lineTo(1.9*s,(y-1.05)*s);c.lineTo(1.35*s,(y+.2)*s);c.fill();c.beginPath();c.ellipse(1.95*s,(y-1.2)*s,.5*s,.26*s,.35,0,7);c.fill();
  c.strokeStyle='#1d1d28';c.lineWidth=Math.max(.5,.12*s);c.beginPath();c.moveTo(-1.3*s,(y-.1)*s);c.quadraticCurveTo(-2*s,(y-.3+g*.2)*s,-2.1*s,(y+.8)*s);c.stroke();
  c.fillStyle='#5a1f5a';c.beginPath();c.moveTo(-.1*s,(y-1.9)*s);c.quadraticCurveTo(-1.6*s,(y-1.7+g*.15)*s,-2.2*s,(y-.5+g*.2)*s);c.lineTo(-.4*s,(y-.5)*s);c.fill();
  c.fillStyle='#22222e';c.fillRect(-.35*s,(y-1.9)*s,.7*s,1.4*s);c.fillStyle='#f4f1e6';c.fillRect(-.42*s,(y-2.02)*s,.84*s,.16*s);c.strokeStyle='#22222e';c.lineWidth=Math.max(.6,.2*s);c.beginPath();c.moveTo(.2*s,(y-1.7)*s);c.lineTo(.75*s,(y-2.7)*s);c.stroke();
  FL.jack(c,s,.85,y-3.15,.48,true,t)},
 // a pumpkin patch: one huge jack-o'-lantern, smaller ones, corn stalks and a scarecrow
 pumpkins(c,s,t,n){FL.base(c,s,10,'#6a4a22',n);for(const x of[-4.3,-3.9,3.6,4.1,4.5]){c.strokeStyle='#b99a3c';c.lineWidth=Math.max(.5,.1*s);c.beginPath();c.moveTo(x*s,-1.1*s);c.quadraticCurveTo((x+Math.sin(t*2+x)*.15)*s,-3*s,(x+.2)*s,-4.6*s);c.stroke();c.fillStyle='#d9c05a';c.beginPath();c.ellipse((x+.25)*s,-3.4*s,.14*s,.5*s,.4,0,7);c.fill()}
  c.strokeStyle='#7a5a3a';c.lineWidth=Math.max(.5,.14*s);c.beginPath();c.moveTo(-2.7*s,-1.1*s);c.lineTo(-2.7*s,-5.2*s);c.moveTo(-3.8*s,-4.2*s);c.lineTo(-1.6*s,-4.2*s);c.stroke();c.fillStyle='#b5463f';c.fillRect(-3.2*s,-4.5*s,1*s,1.5*s);c.fillStyle='#e9cfa6';c.beginPath();c.arc(-2.7*s,-4.95*s,.42*s,0,7);c.fill();c.fillStyle='#8a5a32';c.beginPath();c.moveTo(-3.4*s,-5.2*s);c.lineTo(-2.7*s,-6.1*s);c.lineTo(-2*s,-5.2*s);c.fill();
  FL.jack(c,s,.6,-3,1.9,n,t);FL.jack(c,s,-1.5,-1.75,.7,n,t+1);FL.jack(c,s,3,-1.9,.85,n,t+2);FL.jack(c,s,-4,-1.6,.5,n,t+3);drawChar(c,s,-1,-1.1,'minnie',t,{witch:1});drawChar(c,s,4.1,-1.1,'mickey',t,{cape:'#5a1f8a'});if(n)FL.bulbs(c,s,[[-4.6,-1.3],[4.6,-1.3]],.6)},
 // a haunted house with a crooked tower, lit windows, a bare tree and circling bats
 haunted(c,s,t,n){FL.base(c,s,10,'#3a3148',n);c.strokeStyle='#2a2230';c.lineWidth=Math.max(.5,.16*s);c.beginPath();c.moveTo(-3.9*s,-1.1*s);c.lineTo(-3.8*s,-3.6*s);c.lineTo(-4.6*s,-4.8*s);c.moveTo(-3.8*s,-3.6*s);c.lineTo(-3.1*s,-4.9*s);c.moveTo(-3.85*s,-2.8*s);c.lineTo(-3.1*s,-3.4*s);c.stroke();
  c.fillStyle='#4b4160';c.fillRect(-2.4*s,-4.4*s,4.4*s,3.3*s);c.fillStyle='#2f2840';c.beginPath();c.moveTo(-2.8*s,-4.3*s);c.lineTo(-.2*s,-6*s);c.lineTo(2.4*s,-4.3*s);c.fill();
  c.fillStyle='#54496b';c.beginPath();c.moveTo(1.5*s,-1.1*s);c.lineTo(1.7*s,-6.6*s);c.lineTo(3.2*s,-6.5*s);c.lineTo(3.1*s,-1.1*s);c.fill();c.fillStyle='#2f2840';c.beginPath();c.moveTo(1.4*s,-6.5*s);c.lineTo(2.6*s,-8.6*s);c.lineTo(3.5*s,-6.4*s);c.fill();
  const win=(x,y,w,h)=>{c.fillStyle=Math.sin(t*5+x*3)>-.6||!n?'#ffd45a':'#a8862e';c.fillRect(x*s,y*s,w*s,h*s);c.fillStyle='#2f2840';c.fillRect((x+w/2-.04)*s,y*s,.08*s,h*s);if(n){c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,90,.35)';c.fillRect((x-.1)*s,(y-.1)*s,(w+.2)*s,(h+.2)*s);c.restore()}};
  win(-1.9,-3.9,.7,1);win(-.5,-3.9,.7,1);win(2.05,-5.8,.7,1.1);win(2.05,-3.6,.7,1);c.fillStyle='#2a2230';c.beginPath();c.roundRect(-.2*s,-2.6*s,1*s,1.5*s,[.5*s,.5*s,0,0]);c.fill();
  c.strokeStyle='#1d1a26';c.lineWidth=Math.max(.4,.07*s);for(let x=-4.6;x<=4.6;x+=.55){c.beginPath();c.moveTo(x*s,-1.1*s);c.lineTo(x*s,-2*s);c.stroke()}c.beginPath();c.moveTo(-4.6*s,-1.75*s);c.lineTo(4.6*s,-1.75*s);c.stroke();
  c.fillStyle='#1d1a26';for(let i=0;i<4;i++){const a=t*1.3+i*1.57,x=Math.cos(a)*3.4,y=-7-Math.sin(a*2)*.8,f=Math.sin(t*14+i)*.25;c.beginPath();c.moveTo(x*s,y*s);c.lineTo((x-.5)*s,(y-.25-f)*s);c.lineTo((x-.25)*s,(y+.08)*s);c.lineTo(x*s,(y+.2)*s);c.lineTo((x+.25)*s,(y+.08)*s);c.lineTo((x+.5)*s,(y-.25-f)*s);c.fill()}},
 // a bubbling cauldron, with a witch stirring it
 cauldron(c,s,t,n){FL.base(c,s,10,'#2f5a3a',n);
  for(let i=0;i<6;i++){const u=(t*.35+i/6)%1;c.fillStyle=`rgba(150,90,200,${.45*(1-u)})`;c.beginPath();c.arc((-.6+Math.sin(i*2+t)*.9)*s,(-4-u*3.4)*s,(.5+u*.7)*s,0,7);c.fill()}
  c.fillStyle='#1d1d24';c.beginPath();c.ellipse(-.6*s,-2.6*s,2.3*s,1.6*s,0,0,7);c.fill();c.fillRect(-2.6*s,-1.5*s,.4*s,.5*s);c.fillRect(1*s,-1.5*s,.4*s,.5*s);c.fillStyle='#34343f';c.beginPath();c.ellipse(-.6*s,-3.75*s,2.2*s,.45*s,0,0,7);c.fill();
  c.save();if(n)c.globalCompositeOperation='lighter';c.fillStyle='#6fe04a';c.beginPath();c.ellipse(-.6*s,-3.75*s,1.95*s,.34*s,0,0,7);c.fill();for(let i=0;i<5;i++){const u=(t*.9+i*.23)%1;c.fillStyle=`rgba(150,255,110,${1-u})`;c.beginPath();c.arc((-.6+Math.sin(i*2.3)*1.5)*s,(-3.8-u*.9)*s,(.14+u*.16)*s,0,7);c.fill()}c.restore();
  for(let i=0;i<3;i++){c.fillStyle=['#ff8a2c','#ffb52c','#ff6a1c'][i];c.beginPath();c.moveTo((-1.6+i*.9)*s,-1.1*s);c.lineTo((-1.25+i*.9)*s,(-1.9-Math.sin(t*8+i)*.2)*s);c.lineTo((-.9+i*.9)*s,-1.1*s);c.fill()}
  {const x=3,sw=Math.sin(t*2.5)*.5;c.fillStyle='#3a2a5a';c.beginPath();c.moveTo((x-.7)*s,-1.1*s);c.lineTo((x-.35)*s,-2.9*s);c.lineTo((x+.35)*s,-2.9*s);c.lineTo((x+.7)*s,-1.1*s);c.fill();c.fillStyle='#9fc98a';c.beginPath();c.arc(x*s,-3.2*s,.36*s,0,7);c.fill();
   c.fillStyle='#22192e';c.beginPath();c.ellipse(x*s,-3.45*s,.75*s,.14*s,0,0,7);c.fill();c.beginPath();c.moveTo((x-.4)*s,-3.45*s);c.lineTo((x+.15)*s,-4.75*s);c.lineTo((x+.4)*s,-3.45*s);c.fill();
   c.strokeStyle='#7a5a3a';c.lineWidth=Math.max(.5,.1*s);c.beginPath();c.moveTo((x-.3)*s,-2.5*s);c.lineTo((.4+sw)*s,-4.3*s);c.lineTo((-.3+sw)*s,-3.7*s);c.stroke()}
  if(n)FL.bulbs(c,s,[[-4.6,-1.3],[4.6,-1.3]],.6)},
 // trick-or-treat sweets: giant candy corn, a spinning lollipop and a bucket of treats
 treats(c,s,t,n){FL.base(c,s,10,'#e8791e',n);
  for(const[x,h,w]of[[-3.6,3.4,1.5],[-1.7,4.6,1.9],[.5,3,1.4]]){const y0=-1.1,cut=(u,col)=>{c.fillStyle=col;c.beginPath();c.moveTo((x-w/2*(1-u[0]))*s,(y0-h*u[0])*s);c.lineTo((x+w/2*(1-u[0]))*s,(y0-h*u[0])*s);c.lineTo((x+w/2*(1-u[1]))*s,(y0-h*u[1])*s);c.lineTo((x-w/2*(1-u[1]))*s,(y0-h*u[1])*s);c.fill()};cut([0,.34],'#ffd23f');cut([.34,.7],'#ff8a2c');cut([.7,1],'#fff8ea')}
  {const x=2.4,y=-4.2;c.fillStyle='#fff';c.fillRect((x-.08)*s,y*s,.16*s,(-1.1-y)*s);for(let i=0;i<8;i++){const a=t*1.2+i/8*6.283;c.fillStyle=i%2?'#7b4fc0':'#9be04a';c.beginPath();c.moveTo(x*s,y*s);c.arc(x*s,y*s,1.15*s,a,a+.8);c.closePath();c.fill()}}
  c.fillStyle='#e8791e';c.beginPath();c.moveTo(3.3*s,-2.6*s);c.lineTo(4.7*s,-2.6*s);c.lineTo(4.5*s,-1.1*s);c.lineTo(3.5*s,-1.1*s);c.fill();c.strokeStyle='#1d1d24';c.lineWidth=Math.max(.4,.07*s);c.beginPath();c.arc(4*s,-2.6*s,.7*s,Math.PI,0);c.stroke();
  for(const[x,y,col]of[[3.6,-2.75,'#d6303f'],[4,-2.9,'#7b4fc0'],[4.4,-2.75,'#3fa060']]){c.fillStyle=col;c.beginPath();c.arc(x*s,y*s,.2*s,0,7);c.fill()}
  drawChar(c,s,-.5,-1.1,'goofy',t);if(n)FL.bulbs(c,s,[[-4.6,-1.3],[4.6,-1.3]],.6)},
 // a giant web between two posts, a spider on a thread, and tombstones
 web(c,s,t,n){FL.base(c,s,10,'#4a2f6a',n);c.strokeStyle='#2a2230';c.lineWidth=Math.max(.6,.18*s);for(const x of[-3.6,3.6]){c.beginPath();c.moveTo(x*s,-1.1*s);c.lineTo(x*s,-6.6*s);c.stroke()}
  c.save();if(n)c.globalCompositeOperation='lighter';c.strokeStyle=n?'rgba(210,225,255,.9)':'rgba(255,255,255,.9)';c.lineWidth=Math.max(.35,.05*s);const cx0=0,cy0=-4.2;
  for(let i=0;i<10;i++){const a=i/10*6.283;c.beginPath();c.moveTo(cx0*s,cy0*s);c.lineTo((cx0+Math.cos(a)*3.5)*s,(cy0+Math.sin(a)*2.5)*s);c.stroke()}
  for(const r of[.3,.55,.8,1]){c.beginPath();for(let i=0;i<=10;i++){const a=i/10*6.283,x=(cx0+Math.cos(a)*3.5*r)*s,y=(cy0+Math.sin(a)*2.5*r)*s;if(!i)c.moveTo(x,y);else{const b=(i-.5)/10*6.283;c.quadraticCurveTo((cx0+Math.cos(b)*3.5*r*.86)*s,(cy0+Math.sin(b)*2.5*r*.86)*s,x,y)}}c.stroke()}c.restore();
  {const x=1.3,y=-3.4+Math.sin(t*1.6)*.7;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=Math.max(.3,.04*s);c.beginPath();c.moveTo(x*s,-6.3*s);c.lineTo(x*s,y*s);c.stroke();c.strokeStyle='#17171f';c.lineWidth=Math.max(.4,.07*s);for(let i=0;i<4;i++)for(const sd of[-1,1]){c.beginPath();c.moveTo(x*s,(y+.1)*s);c.lineTo((x+sd*.55)*s,(y-.25+i*.22)*s);c.lineTo((x+sd*.85)*s,(y+.1+i*.25+Math.sin(t*6+i)*.05)*s);c.stroke()}
   c.fillStyle='#17171f';c.beginPath();c.ellipse(x*s,(y+.25)*s,.42*s,.5*s,0,0,7);c.fill();c.beginPath();c.arc(x*s,(y-.3)*s,.25*s,0,7);c.fill();c.fillStyle='#ff4a3a';c.fillRect((x-.12)*s,(y-.36)*s,.08*s,.08*s);c.fillRect((x+.04)*s,(y-.36)*s,.08*s,.08*s)}
  for(const[x,h]of[[-2.2,1.3],[-.9,1],[2.4,1.2]]){c.fillStyle='#8f96a0';c.beginPath();c.roundRect((x-.45)*s,(-1.1-h)*s,.9*s,h*s,[.45*s,.45*s,0,0]);c.fill();c.fillStyle='#6f7682';c.fillRect((x-.2)*s,(-1.1-h*.6)*s,.4*s,.08*s)}
  drawChar(c,s,-1.55,-1.1,'donald',t,{cape:'#1d1a1a'});drawChar(c,s,.3,-1.1,'daisy',t,{witch:1});if(n)FL.bulbs(c,s,[[-4.6,-1.3],[4.6,-1.3]],.6)},
 /* ---- Christmas parade floats ---- */
 // a decorated tree with presents round it
 xtree(c,s,t,n){FL.base(c,s,9,'#b3262e',n);
  for(const[x,w,h,col,rib]of[[-3.5,1.2,1,'#2f7dd6','#fff'],[-2.4,.9,.7,'#f2c444','#d6303f'],[2.6,1.3,1.1,'#3fa060','#f2c444'],[3.7,.8,.8,'#b06ae8','#fff']]){c.fillStyle=col;c.fillRect((x-w/2)*s,(-1.1-h)*s,w*s,h*s);c.fillStyle=rib;c.fillRect((x-.08)*s,(-1.1-h)*s,.16*s,h*s);c.fillRect((x-w/2)*s,(-1.1-h*.55)*s,w*s,.14*s)}
  c.fillStyle='#6b4a30';c.fillRect(-.3*s,-1.9*s,.6*s,.8*s);
  for(let i=0;i<4;i++){const y=-1.8-i*1.3,w=2.5-i*.52;c.fillStyle=i%2?'#237a3f':'#1c6a36';c.beginPath();c.moveTo(-w*s,y*s);c.lineTo(0,(y-2.1)*s);c.lineTo(w*s,y*s);c.closePath();c.fill();
   c.strokeStyle='#f2c444';c.lineWidth=Math.max(.5,.09*s);c.beginPath();c.moveTo(-w*.8*s,(y-.35)*s);c.quadraticCurveTo(0,(y+.25)*s,w*.8*s,(y-.35)*s);c.stroke()}
  c.save();if(n)c.globalCompositeOperation='lighter';for(let i=0;i<16;i++){const l=i%4,f=(i*.37)%1,y=-2-l*1.3-f*.8,w=(2.3-l*.52)*(1-f*.4),x=Math.sin(i*2.4)*w*.8,on=Math.sin(t*3+i*1.7)>-.3;
   c.fillStyle=on?['#ff5a5a','#ffd23f','#6fc3ff','#ff8fd0'][i%4]:'rgba(255,255,255,.35)';c.beginPath();c.arc(x*s,y*s,Math.max(.6,.17*s),0,7);c.fill()}c.restore();
  c.fillStyle='#ffd23f';c.beginPath();for(let i=0;i<10;i++){const r=(i%2?.3:.7)*s,a=-Math.PI/2+i*Math.PI/5;c.lineTo(Math.cos(a)*r,-7.9*s+Math.sin(a)*r)}c.fill();drawChar(c,s,-1.9,-1.1,'mickey',t,{santa:1});drawChar(c,s,1.9,-1.1,'minnie',t,{santa:1})},
 // a gingerbread house with icing, gumdrops and a smoking chimney
 ginger(c,s,t,n){FL.base(c,s,10,'#7a4a2a',n);
  c.fillStyle='#a8662f';c.fillRect(1.2*s,-6.2*s,.8*s,1.6*s);c.fillStyle='#fff';c.fillRect(1.1*s,-6.4*s,1*s,.3*s);
  for(let i=0;i<3;i++){const u=(t*.5+i/3)%1;c.fillStyle=`rgba(255,255,255,${.7*(1-u)})`;c.beginPath();c.arc((1.6+u*.9)*s,(-6.6-u*2.2)*s,(.3+u*.5)*s,0,7);c.fill()}
  c.fillStyle='#b9783f';c.fillRect(-2.7*s,-4*s,5.4*s,2.9*s);c.fillStyle='#8a5226';c.beginPath();c.moveTo(-3.3*s,-3.9*s);c.lineTo(0,-6.5*s);c.lineTo(3.3*s,-3.9*s);c.closePath();c.fill();
  c.fillStyle='#fff';for(let i=0;i<=8;i++){const u=i/8;for(const sd of[-1,1]){c.beginPath();c.arc(sd*(3.3-3.3*u)*s,(-3.9-2.6*u)*s,.32*s,0,7);c.fill()}}
  for(let x=-2.5;x<=2.5;x+=.5){c.beginPath();c.arc(x*s,-1.15*s,.2*s,Math.PI,0);c.fill()}
  c.fillStyle='#d6303f';c.beginPath();c.roundRect(-.55*s,-2.9*s,1.1*s,1.8*s,[.5*s,.5*s,0,0]);c.fill();c.fillStyle='#f2c444';c.beginPath();c.arc(.3*s,-1.9*s,.1*s,0,7);c.fill();
  for(const x of[-1.8,1.8]){c.fillStyle='#fff';c.fillRect((x-.55)*s,-3.3*s,1.1*s,1.1*s);c.fillStyle=n?'#ffd98a':'#9fd0ff';c.fillRect((x-.42)*s,-3.17*s,.84*s,.84*s);c.fillStyle='#fff';c.fillRect((x-.05)*s,-3.17*s,.1*s,.84*s);c.fillRect((x-.42)*s,-2.8*s,.84*s,.1*s)}
  for(let i=0;i<9;i++){c.fillStyle=['#e8455f','#3fa060','#f2c444','#7b6cff'][i%4];c.beginPath();c.arc((-4.4+i*1.1)*s,-1.1*s,.36*s,Math.PI,0);c.fill()}
  for(const x of[-4.1,4.1]){c.fillStyle='#a8662f';c.beginPath();c.arc(x*s,-2.75*s,.34*s,0,7);c.fill();c.fillRect((x-.3)*s,-2.5*s,.6*s,.9*s);c.fillRect((x-.75+Math.sin(t*4+x)*.08)*s,-2.4*s,1.5*s,.24*s);c.fillRect((x-.34)*s,-1.7*s,.26*s,.6*s);c.fillRect((x+.08)*s,-1.7*s,.26*s,.6*s);c.fillStyle='#fff';c.fillRect((x-.3)*s,-2.05*s,.6*s,.08*s)}
  drawChar(c,s,-3.1,-1.1,'goofy',t,{santa:1});if(n)FL.bulbs(c,s,[[-3.3,-3.9],[0,-6.5]],.45),FL.bulbs(c,s,[[0,-6.5],[3.3,-3.9]],.45)},
 // spinning peppermints and candy canes
 candy(c,s,t,n){FL.base(c,s,10,'#d6303f',n);
  for(const[x,y,r,dir]of[[-2.8,-3.3,1.5,1],[3,-2.9,1.15,-1]]){c.fillStyle='#fff';c.fillRect((x-.1)*s,y*s,.2*s,(-1.1-y)*s);for(let i=0;i<10;i++){const a=t*dir+i/10*6.283;c.fillStyle=i%2?'#fff':'#e8455f';c.beginPath();c.moveTo(x*s,y*s);c.arc(x*s,y*s,r*s,a,a+.64);c.closePath();c.fill()}c.fillStyle='#fff';c.beginPath();c.arc(x*s,y*s,r*.2*s,0,7);c.fill()}
  c.lineCap='round';for(const[x,h,sd]of[[-.7,4.6,1],[.9,3.8,-1],[4.4,2.6,-1],[-4.5,2.8,1]]){const path=()=>{c.beginPath();c.moveTo(x*s,-1.1*s);c.lineTo(x*s,-(1.1+h)*s);c.arc((x+sd*.6)*s,-(1.1+h)*s,.6*s,sd>0?Math.PI:0,sd>0?0:Math.PI,sd<0)};
   c.strokeStyle='#fff';c.lineWidth=.42*s;path();c.stroke();c.strokeStyle='#e8455f';c.setLineDash([.35*s,.45*s]);path();c.stroke();c.setLineDash([])}
  drawChar(c,s,2,-1.1,'donald',t,{santa:1});drawChar(c,s,-1.9,-1.1,'daisy',t,{santa:1});if(n)FL.bulbs(c,s,[[-4.4,-1.5],[4.4,-1.5]],.5)},
 // a toy box: building blocks, a jack-in-the-box, a toy drum and a teddy bear
 toybox(c,s,t,n){FL.base(c,s,10,'#2f4fa8',n);
  for(const[x,y,w,col]of[[-1.9,-1.1,1.3,'#f2c444'],[-.6,-1.1,1.3,'#e8455f'],[-1.25,-2.4,1.3,'#3fa060']]){c.fillStyle=col;c.fillRect((x-w/2)*s,(y-w)*s,w*s,w*s);c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=Math.max(.4,.09*s);c.strokeRect((x-w/2+.18)*s,(y-w+.18)*s,(w-.36)*s,(w-.36)*s)}
  {const x=-1.25,y=-3.7;c.fillStyle='#9a6a3c';for(const[dx,dy,r]of[[0,-.55,.5],[0,-1.3,.38],[-.3,-1.62,.15],[.3,-1.62,.15],[-.5,-.75,.17],[.5,-.75+Math.sin(t*4)*.12,.17]]){c.beginPath();c.arc((x+dx)*s,(y+dy)*s,r*s,0,7);c.fill()}c.fillStyle='#e9cfa6';c.beginPath();c.arc(x*s,(y-1.22)*s,.17*s,0,7);c.fill()}
  c.fillStyle='#c8323a';c.fillRect(-4.6*s,-2.3*s,1.7*s,1.2*s);c.fillStyle='#f6f2ea';c.beginPath();c.ellipse(-3.75*s,-2.3*s,.85*s,.25*s,0,0,7);c.fill();c.strokeStyle='#f2c444';c.lineWidth=Math.max(.4,.08*s);c.beginPath();for(let i=0;i<=6;i++)c.lineTo((-4.6+i*1.7/6)*s,(i%2?-1.25:-2.05)*s);c.stroke();
  const bob=Math.sin(t*3)*.35,bx=2.6;c.fillStyle='#d6303f';c.fillRect((bx-.95)*s,-2.8*s,1.9*s,1.7*s);c.fillStyle='#f2c444';c.fillRect((bx-.95)*s,-2.8*s,1.9*s,.2*s);c.fillRect((bx-.12)*s,-2.8*s,.24*s,1.7*s);
  c.strokeStyle='#9aa3ad';c.lineWidth=Math.max(.5,.12*s);c.beginPath();c.moveTo(bx*s,-2.8*s);for(let i=1;i<=6;i++)c.lineTo((bx+(i%2?.3:-.3))*s,(-2.8-i*(1.5+bob)/6)*s);c.stroke();
  const hy=-4.6-bob;c.fillStyle='#b06ae8';c.beginPath();c.moveTo((bx-.42)*s,(hy-.2)*s);c.lineTo((bx-.85)*s,(hy-1.05)*s);c.lineTo(bx*s,(hy-.4)*s);c.fill();c.fillStyle='#3fa060';c.beginPath();c.moveTo((bx+.42)*s,(hy-.2)*s);c.lineTo((bx+.85)*s,(hy-1.05)*s);c.lineTo(bx*s,(hy-.4)*s);c.fill();
  c.fillStyle='#f2c9a0';c.beginPath();c.arc(bx*s,hy*s,.45*s,0,7);c.fill();c.fillStyle='#f2c444';for(const sd of[-1,1]){c.beginPath();c.arc((bx+sd*.85)*s,(hy-1.05)*s,.12*s,0,7);c.fill()}
  drawChar(c,s,.6,-1.1,'chip',t,{santa:1});drawChar(c,s,1.25,-1.1,'dale',t,{santa:1});if(n)FL.bulbs(c,s,[[-4.6,-2.5],[-2.9,-2.5]],.4),FL.bulbs(c,s,[[1.65,-2.9],[3.55,-2.9]],.4)},
 // the finale: a sleigh on a snowbank, pulled by two reindeer, with Santa waving
 sleigh(c,s,t,n){c.fillStyle='rgba(255,255,255,.95)';for(const[x,r]of[[-4.2,1.1],[-2.3,1.4],[0,1.3],[2.2,1.4],[4.2,1.1]]){c.beginPath();c.arc(x*s,-.8*s,r*s,0,7);c.fill()}
  for(const[x,ph]of[[2.3,0],[4.2,1.6]]){const lg=Math.sin(t*6+ph)*.22,y=-2.2+Math.sin(t*6+ph)*.06;c.strokeStyle='#7a4f2c';c.lineWidth=Math.max(.5,.16*s);for(const[dx,d]of[[-.55,lg],[-.3,-lg],[.35,lg],[.6,-lg]]){c.beginPath();c.moveTo((x+dx)*s,(y+.3)*s);c.lineTo((x+dx+d)*s,(y+1.25)*s);c.stroke()}
   c.fillStyle='#9a6a3c';c.beginPath();c.ellipse(x*s,y*s,.85*s,.42*s,0,0,7);c.fill();c.beginPath();c.moveTo((x+.5)*s,(y-.1)*s);c.lineTo((x+.95)*s,(y-1)*s);c.lineTo((x+1.2)*s,(y-.8)*s);c.lineTo((x+.8)*s,(y+.2)*s);c.fill();c.beginPath();c.ellipse((x+1.2)*s,(y-1)*s,.36*s,.22*s,.3,0,7);c.fill();
   c.strokeStyle='#5d3d22';c.lineWidth=Math.max(.4,.08*s);for(const sd of[-.12,.1]){c.beginPath();c.moveTo((x+1.05+sd)*s,(y-1.2)*s);c.lineTo((x+.95+sd)*s,(y-1.8)*s);c.lineTo((x+1.2+sd)*s,(y-2.05)*s);c.moveTo((x+.95+sd)*s,(y-1.8)*s);c.lineTo((x+.72+sd)*s,(y-2)*s);c.stroke()}
   c.fillStyle='#d6303f';c.fillRect((x-.1)*s,(y-.45)*s,.22*s,.9*s);c.fillStyle='#f2c444';c.beginPath();c.arc(x*s,(y+.42)*s,.11*s,0,7);c.fill()}
  c.strokeStyle='#5d3d22';c.lineWidth=Math.max(.3,.05*s);c.beginPath();c.moveTo(-.7*s,-3.1*s);c.lineTo(2.3*s,-2.5*s);c.lineTo(4.2*s,-2.5*s);c.stroke();
  c.fillStyle='#3f7a45';c.beginPath();c.ellipse(-3.3*s,-3.5*s,1.05*s,1.25*s,0,0,7);c.fill();c.fillStyle='#f2c444';c.fillRect(-3.6*s,-4.75*s,.6*s,.25*s);
  c.fillStyle='#c8323a';c.beginPath();c.moveTo(-4.5*s,-3.9*s);c.quadraticCurveTo(-4.5*s,-1.5*s,-2.6*s,-1.5*s);c.lineTo(-.1*s,-1.5*s);c.quadraticCurveTo(.8*s,-1.6*s,.7*s,-3.2*s);c.quadraticCurveTo(.1*s,-2.5*s,-1*s,-2.5*s);c.lineTo(-2.9*s,-2.5*s);c.quadraticCurveTo(-3.5*s,-2.8*s,-3.7*s,-4.2*s);c.closePath();c.fill();
  c.strokeStyle='#f2c444';c.lineWidth=Math.max(.5,.14*s);c.beginPath();c.moveTo(-4.3*s,-1.05*s);c.lineTo(.2*s,-1.05*s);c.quadraticCurveTo(1.3*s,-1.1*s,1.1*s,-2.1*s);c.stroke();c.beginPath();c.moveTo(-3.4*s,-1.5*s);c.lineTo(-3.4*s,-1.05*s);c.moveTo(-.8*s,-1.5*s);c.lineTo(-.8*s,-1.05*s);c.stroke();
  {const x=-1.9,y=-2.5,w=Math.sin(t*4)*.3;c.fillStyle='#c8323a';c.beginPath();c.ellipse(x*s,(y-.75)*s,.62*s,.8*s,0,0,7);c.fill();c.fillStyle='#fff';c.fillRect((x-.62)*s,(y-.55)*s,1.24*s,.16*s);c.fillStyle='#1d1f2a';c.fillRect((x-.62)*s,(y-.8)*s,1.24*s,.18*s);
   c.strokeStyle='#c8323a';c.lineWidth=Math.max(.6,.26*s);c.beginPath();c.moveTo((x+.4)*s,(y-1.1)*s);c.lineTo((x+1)*s,(y-1.9+w)*s);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc((x+1.05)*s,(y-2+w)*s,.17*s,0,7);c.fill();
   c.fillStyle='#f2c9a0';c.beginPath();c.arc(x*s,(y-1.8)*s,.4*s,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x*s,(y-1.55)*s,.42*s,0,Math.PI);c.fill();
   c.fillStyle='#c8323a';c.beginPath();c.moveTo((x-.42)*s,(y-2)*s);c.quadraticCurveTo(x*s,(y-2.95)*s,(x-.75)*s,(y-2.75)*s);c.lineTo((x+.42)*s,(y-2)*s);c.fill();c.fillStyle='#fff';c.fillRect((x-.46)*s,(y-2.1)*s,.92*s,.18*s);c.beginPath();c.arc((x-.75)*s,(y-2.75)*s,.15*s,0,7);c.fill()}
  if(n)FL.bulbs(c,s,[[-4.3,-1.5],[.5,-1.5]],.45),FL.bulbs(c,s,[[-4.4,-.3],[4.6,-.3]],.6)},
 // characters on foot: [who, metres across, metres along, costume]; nearer ones are drawn last
 walk(c,s,t,list){for(const[who,x,d,o]of list.slice().sort((a,b)=>a[2]-b[2]))drawChar(c,s,x,d*.5+Math.abs(Math.sin(t*5+x))*-.06,who,t,o)},
 // a cavalcade's lead car: an open red jalopy with Mickey and Minnie standing in the back
 cavcar(c,s,t,n){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(.3*s,0,3.2*s,.6*s,0,0,7);c.fill();drawChar(c,s,-.9,-1.25,'mickey',t);drawChar(c,s,.5,-1.25,'minnie',t);
  c.fillStyle='#c8323a';c.beginPath();c.roundRect(-2.8*s,-1.7*s,5.6*s,1.2*s,.3*s);c.fill();c.fillStyle='#f2c444';c.fillRect(-2.8*s,-1.75*s,5.6*s,.14*s);c.fillStyle='#8f1f26';c.fillRect(1.6*s,-2.1*s,1.2*s,.5*s);
  for(const x of[-1.7,1.7]){c.fillStyle='#22222e';c.beginPath();c.arc(x*s,-.5*s,.55*s,0,7);c.fill();c.fillStyle='#f3ead3';c.beginPath();c.arc(x*s,-.5*s,.28*s,0,7);c.fill()}if(n)FL.bulbs(c,s,[[-2.8,-1.8],[2.8,-1.8]],.5)},
 royals(c,s,t,n){FL.walk(c,s,t,[['cinderella',-2.4,.4],['belle',-.9,-.5],['tiana',.6,.4],['rapunzel',2.1,-.4]])},
 pals(c,s,t,n){FL.walk(c,s,t,[['donald',-2.9,.6],['daisy',-1.8,-.6],['goofy',-.5,.5],['pluto',1.1,-.5],['chip',2.6,.6],['dale',3.2,-.3]])},
 pooh(c,s,t,n){FL.walk(c,s,t,[['aurora',-2.6,-.4],['pooh',-1.1,.5],['tigger',.4,-.5],['snow',2,.4]])},
 xpooh(c,s,t,n){FL.walk(c,s,t,[['pooh',-2,.5,{santa:1}],['tigger',-.6,-.5,{santa:1}],['pluto',1,.5,{santa:1}],['elsa',2.6,-.4],['anna',3.5,.5]])},
 villains(c,s,t,n){FL.walk(c,s,t,[['cruella',-3,.5],['hook',-1.6,-.5],['maleficent',-.1,.4],['queen',1.4,-.5],['jafar',2.9,.5]])},
 // walking units: a small troupe drawn around the unit's position
 troupe(c,s,t,kind,n){const cols={drum:['#c8323a','#f6f2ea'],dancers:['#ff8fc8','#7ec8f0','#ffd23f','#b06ae8'],stilts:['#3fa060','#ff8a3d'],flags:['#5a8ad6','#f2c444'],
   xdrum:['#1f7a3f','#c8323a'],soldiers:['#c8323a'],snow:['#ffffff','#cfe9fb','#a9d6f5'],elves:['#2f9a4a','#d6303f'],
   ghosts:['#ffffff'],diggers:['#6f7682','#565c68'],skeletons:['#1d1f2a'],scarecrows:['#c98a2c','#8a5a32','#b5463f']}[kind];
  const rows=kind==='drum'||kind==='xdrum'||kind==='soldiers'||kind==='diggers'||kind==='skeletons'?[[-1.5,-1],[0,-1],[1.5,-1],[-1.5,1],[0,1],[1.5,1]]:kind==='stilts'?[[-1.4,0],[1.4,0]]:[[-2,-.8],[-.7,.6],[.7,-.8],[2,.6]];
  rows.forEach(([dx,dy],i)=>{const step=Math.sin(t*6+i),x=dx*s,y=(dy*.5)*s,col=cols[i%cols.length],tall=kind==='stilts'?2.2:1;
   if(kind==='ghosts'){const b=(Math.sin(t*2+i*1.3)*.2-.5)*s,w=.5*s;c.save();c.globalAlpha=n?.95:.85;c.fillStyle=n?'#eaf6ff':'#fff';c.beginPath();c.moveTo(x-w,y+b);c.lineTo(x-w,y+b-1.1*s);c.arc(x,y+b-1.1*s,w,Math.PI,0);c.lineTo(x+w,y+b);for(let k=0;k<4;k++)c.quadraticCurveTo(x+w-(k+.5)*w/2,y+b-(k%2?.02:.28)*s,x+w-(k+1)*w/2,y+b);c.fill();c.restore();c.fillStyle='#2a2a3a';for(const e of[-.17,.17]){c.beginPath();c.ellipse(x+e*s,y+b-1.15*s,.07*s,.11*s,0,0,7);c.fill()}return}
   c.strokeStyle='#2d3550';c.lineWidth=Math.max(.5,.12*s);c.beginPath();c.moveTo(x-.12*s,y-.85*s*tall);c.lineTo(x-.12*s+step*.12*s,y);c.moveTo(x+.12*s,y-.85*s*tall);c.lineTo(x+.12*s-step*.12*s,y);c.stroke();
   c.fillStyle=col;c.fillRect(x-.25*s,y-(.85*tall+.6)*s,.5*s,.62*s);c.fillStyle='#f2c9a0';c.beginPath();c.arc(x,y-(.85*tall+.8)*s,.17*s,0,7);c.fill();
   if(kind==='diggers'){const up=Math.sin(t*3+i)*.25;c.strokeStyle='#7a5a3a';c.lineWidth=Math.max(.5,.08*s);c.beginPath();c.moveTo(x+.3*s,y-.9*s);c.lineTo(x+.45*s,y-(2.3+up)*s);c.stroke();c.fillStyle='#b9c0c8';c.beginPath();c.ellipse(x+.47*s,y-(2.5+up)*s,.16*s,.24*s,0,0,7);c.fill();c.fillStyle='#3a3f4a';c.fillRect(x-.22*s,y-(.85*tall+1.1)*s,.44*s,.14*s)}
   if(kind==='skeletons'){c.strokeStyle='#f4f1e6';c.lineWidth=Math.max(.4,.06*s);for(let k=0;k<3;k++){c.beginPath();c.moveTo(x-.17*s,y-(.85*tall+.45-k*.15)*s);c.lineTo(x+.17*s,y-(.85*tall+.45-k*.15)*s);c.stroke()}c.fillStyle='#f4f1e6';c.beginPath();c.arc(x,y-(.85*tall+.8)*s,.19*s,0,7);c.fill();c.fillStyle='#1d1f2a';c.fillRect(x-.11*s,y-(.85*tall+.86)*s,.07*s,.08*s);c.fillRect(x+.04*s,y-(.85*tall+.86)*s,.07*s,.08*s)}
   if(kind==='scarecrows'){c.fillStyle='#d9b45a';c.beginPath();c.moveTo(x-.42*s,y-(.85*tall+.9)*s);c.lineTo(x,y-(.85*tall+1.4)*s);c.lineTo(x+.42*s,y-(.85*tall+.9)*s);c.fill();c.strokeStyle='#e2c66a';c.lineWidth=Math.max(.4,.07*s);const w=Math.sin(t*4+i)*.15;c.beginPath();c.moveTo(x-.25*s,y-(.85*tall+.45)*s);c.lineTo(x-.7*s,y-(.85*tall+.5+w)*s);c.moveTo(x+.25*s,y-(.85*tall+.45)*s);c.lineTo(x+.7*s,y-(.85*tall+.5-w)*s);c.stroke()}
   if(kind==='soldiers'){c.fillStyle='#f6f2ea';c.fillRect(x-.25*s,y-(.85*tall+.6)*s+.25*s,.5*s,.1*s);c.fillStyle='#1d1f2a';c.fillRect(x-.17*s,y-(.85*tall+1.55)*s,.34*s,.62*s);c.fillStyle='#f2c444';c.fillRect(x-.17*s,y-(.85*tall+1.02)*s,.34*s,.08*s)}
   if(kind==='elves'){c.fillStyle=i%2?'#2f9a4a':'#d6303f';c.beginPath();c.moveTo(x-.2*s,y-(.85*tall+.92)*s);c.lineTo(x+.25*s,y-(.85*tall+1.5)*s);c.lineTo(x+.2*s,y-(.85*tall+.92)*s);c.fill();c.fillStyle='#f2c444';c.beginPath();c.arc(x+.25*s,y-(.85*tall+1.5)*s,.07*s,0,7);c.fill()}
   if(kind==='snow'){c.fillStyle=col;c.beginPath();c.moveTo(x-.55*s,y-.8*s);c.lineTo(x+.55*s,y-.8*s);c.lineTo(x+.22*s,y-1.3*s);c.lineTo(x-.22*s,y-1.3*s);c.fill();c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.9)';const a=t*1.5+i*1.6;c.beginPath();c.arc(x+Math.cos(a)*.8*s,y-(1.6+Math.sin(a)*.6)*s,Math.max(.5,.09*s),0,7);c.fill();c.restore()}
   if(kind==='drum'||kind==='xdrum'){c.fillStyle='#f6f2ea';c.beginPath();c.ellipse(x,y-(.85*tall+.3)*s,.26*s,.14*s,0,0,7);c.fill();c.fillStyle='#c8323a';c.fillRect(x-.28*s,y-(.85*tall+.3)*s,.56*s,.2*s)}
   if(kind==='dancers'){c.fillStyle=col;c.beginPath();c.moveTo(x-.5*s,y-.85*s);c.lineTo(x+.5*s,y-.85*s);c.lineTo(x+.25*s,y-1.3*s);c.lineTo(x-.25*s,y-1.3*s);c.fill()}
   if(kind==='flags'){const w=Math.sin(t*3+i)*.4;c.strokeStyle='#ddd';c.beginPath();c.moveTo(x+.25*s,y-1.4*s);c.lineTo(x+.25*s,y-3.2*s);c.stroke();c.fillStyle=i%2?'#f2c444':'#5a8ad6';c.beginPath();c.moveTo(x+.25*s,y-3.2*s);c.quadraticCurveTo(x+(1+w)*s,y-3*s,x+(1.6+w)*s,y-2.7*s);c.lineTo(x+.25*s,y-2.3*s);c.fill()}
   if(n){c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,240,200,.9)';c.beginPath();c.arc(x,y-(.85*tall+.6)*s,Math.max(.5,.1*s),0,7);c.fill();c.restore()}})}};
function drawUnit(c,u,s,t,night){const f=FL[u.k];if(f&&!['base','bulbs','rider','troupe','walk','jack'].includes(u.k))f(c,s,t,night);else FL.troupe(c,s,t,u.k,night)}
/* aerial map: units stand upright on the route (the map is a 3/4 view) */
function drawParadeMap(now){const us=paradeUnits();if(!us.length)return;const t=now/1000,s=OSM.S*2.1,n=nf>.35;/* drawn ~2x real size so floats read at map scale, like the castle */
 us.sort((a,b)=>a.y-b.y);for(const u of us){cx.save();cx.translate(u.x,u.y);if(Math.cos(u.a)<0)cx.scale(-1,1);drawUnit(cx,u,s,t,n);cx.restore()}}
/* Main Street view: units on Main Street, in perspective; returns draw items merged with the crowd so nearer things overlap */
function paradeStreetItems(){const out=[];for(const u of paradeUnits()){if(u.y<P_.hub[1]-60||Math.abs(u.x-P_.mainst[0])>70&&u.y<P_.hub[1]+50)continue;const[x,z]=simToWorld(u.x,u.y);if(z<30)continue;out.push([x*.15,z,u])}/* units that have passed the viewer drop out */return out}
/* ---------- soundtracks, synced like the fireworks: one per parade ---------- */
/* Each parade takes exactly as long as its soundtrack: first note at step-off, last float into Town Square as the music
   ends. (If you set a longer parade in the schedule, the music loops.) A soundtrack missing from audio/ can be picked
   with "Load soundtrack…" and is remembered in this browser. */
/* Disneyland: A Christmas Fantasy Parade steps off with the Christmas floats (an original line-up, like Walt Disney World's) to the
   owner's audio/a-christmas-fantasy-parade.mp3; the Walt Disney World parades have no event there and load nothing. Its saved copy
   is kept under its own key so the Florida track is never used for it. */
if(DL)for(const P of PARADES){if(P.id==='xmas'){P.n='A Christmas Fantasy';P.file='audio/a-christmas-fantasy-parade.mp3';P.key='dlxmas'}else P.file=null}
for(const P of PARADES){const A=P.a={audio:new Audio(),ready:false,name:P.file||'',auto:true,liveKey:null,src:P.file?'folder':'none'},a=A.audio;if(!P.file)continue;a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true;parBadge()});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,ev=paradeEv(P.id);if(!d||!isFinite(d)||!ev)return;if(!ev.userDur)ev.dur=Math.round(d/6)/10;a.loop=ev.dur*60>d+30;parBadge()});
 a.addEventListener('error',()=>{if(A.src==='folder'){A.src='none';A.name='';A.ready=false;parBadge();parLoadSaved(P)}});
 loadTrack(a,P.file)}
const PAR=PARADES[0].a; // Festival of Fantasy's soundtrack state (kept under its old name)
function parUse(P,blob,name){const A=P.a;A.src='picked';A.name=name||'parade soundtrack';A.audio.src=URL.createObjectURL(blob);A.audio.load();parBadge()}
async function parLoadSaved(P){try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get(P.key||P.id);r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob)parUse(P,v.blob,v.name)}catch(e){}}
async function parSave(P,f){try{const db=await IDB();await new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put({blob:f,name:f.name},P.key||P.id);t.oncomplete=res;t.onerror=()=>rej(t.error)})}catch(e){}}
function parPick(id){const P=parOf(id||'parade'),i=document.createElement('input');i.type='file';i.accept='audio/*,.mp3,.m4a,.wav,.ogg';i.onchange=()=>{const f=i.files[0];if(f){parUse(P,f,f.name);parSave(P,f)}};i.click()}
function parBadge(){for(const P of PARADES){const el=document.querySelector(`[data-par="${P.id}"] .pstat`),A=P.a;if(el)el.innerHTML=A.name?`<b>${esc(A.name)}</b> — ${A.ready?'ready':'loading…'}${A.audio.duration?` · ${Math.floor(A.audio.duration/60)}:${String(Math.round(A.audio.duration%60)).padStart(2,'0')}`:''}${A.blocked?' (tap Play to allow audio)':''}`:'No soundtrack loaded. The parade still runs, with a drum cadence.'}}
const parPlaying=id=>{const P=parOf(id);return!!P&&P.a.ready&&!P.a.audio.paused};
/* how loud the parade is where you are: nearest unit to the camera (map) or to Main Street (street view) */
function paradeNearness(){const us=paradeUnits();if(!us.length)return 0;let best=0;
 for(const u of us){let p;if(SV.on){const[,z]=simToWorld(u.x,u.y);p=u.y>P_.hub[1]-60&&Math.abs(u.x-P_.mainst[0])<70?Math.exp(-Math.max(0,z-20)/160):.15*prox(u.x,u.y,200)}else p=prox(u.x,u.y,260);if(p>best)best=p}return best}
function paradeSync(){const L=liveParade();for(const P of PARADES){const ev=paradeEv(P.id),A=P.a,a=A.audio;if(!ev)continue;const live=P===L,st=live?T-ev.key:null;
 if(live&&A.liveKey!==ev.key){A.liveKey=ev.key;if(A.ready&&A.auto&&speed!==1&&!FF){speed=1;sync();toast(P.n+' is stepping off — speed set to 1× so the music stays in sync')}}
 const want=live&&A.ready&&playing&&speed===1&&!FF;
 if(want){const dur=a.duration||0;a.loop=dur>0&&ev.dur*60>dur+30;if(!a.loop&&dur&&st>=dur-.3){if(!a.paused)a.pause();continue}const pos=dur?st%dur:st;setVol(a,(.62+.38*paradeNearness())*(AU.mute?0:AU.v.master)*1.1);/* clearly audible from step-off, fuller as floats come near */
  if(a.paused){a.currentTime=Math.max(0,pos);a.play().catch(()=>{A.blocked=true;parBadge()})}
  else if(dur){let d=a.currentTime-pos;if(d>dur/2)d-=dur;if(d<-dur/2)d+=dur;syncTrack(A,a,d,()=>{a.currentTime=pos})}}
 else if(!a.paused)a.pause()}}
function watchParade(id){const P=parOf(id)||PARADES[0],ev=paradeEv(P.id);if(!ev)return;ev.on=true;ev.userOn=true;const s=ev.t.find(x=>x>=T-60)??ev.t[0];if(!AU.ready)auInit();seek(s-20,s-20<T);P.a.liveKey=null;speed=1;playing=true;
 if(!SV.on){follow={k:'parade'};cam.tm=Math.max(cam.tm,2.4)}closeSheet();sync();if(!P.a.ready&&P.file)toast(`Add ${P.file} (or load it in Entertainment) to hear the parade`);
 P.a.audio.play().then(()=>P.a.audio.pause()).catch(()=>{})}
/* ---------- the welcome show's soundtrack ----------
   "Let the Magic Begin" (the owner's copy, audio/let-the-magic-begin.mp3, never committed) plays on the castle stage
   before opening. The show is as long as the track and ends right at opening time, and the music keeps time the same
   way the parades' does. If the file isn't on the site, the copy kept by Load audio folder is used. */
const WELC={file:'audio/let-the-magic-begin.mp3',a:{audio:new Audio(),ready:false,name:'audio/let-the-magic-begin.mp3',src:'folder',liveKey:null}};
{const A=WELC.a,a=A.audio,ev=()=>EV.find(e=>e.id==='welcome');a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,e=ev();if(!d||!isFinite(d)||!e)return;if(!e.userDur)e.dur=d/60;if(e.rel)e.rel[1]=-Math.round(d);relTimes()}); /* the show ends as the park opens */
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('welcome');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 loadTrack(a,WELC.file)}
/* ---------- the Flag Retreat: the national anthem ----------
   "The Star-Spangled Banner" played by the United States Navy Band (public domain, a US government recording;
   audio/anthem.mp3, credited in the app). Three minutes into the Flag Retreat the anthem plays and the flag comes down
   the Town Square pole as it does; the flag flies from an hour before opening until then. */
const ANTHEM={file:'audio/anthem.mp3',at:180,len:77.6,a:{audio:new Audio(),ready:false,src:'folder'}};
{const A=ANTHEM.a,a=A.audio;a.preload='auto';a.addEventListener('canplay',()=>{A.ready=true});a.addEventListener('loadedmetadata',()=>{if(isFinite(a.duration))ANTHEM.len=a.duration});loadTrack(a,ANTHEM.file)}
const anthemPos=()=>{const e=EV.find(x=>x.id==='flag');return e&&e.on!==false&&e.ph==='live'?T-e.key-ANTHEM.at:null};
const anthemPlaying=()=>ANTHEM.a.ready&&!ANTHEM.a.audio.paused;
/* how far up the pole the flag is, 0 to 1 */
function flagUp(){const e=EV.find(x=>x.id==='flag'),k=e&&e.t&&e.t[0]!=null?e.t[0]+ANTHEM.at:17*3600+ANTHEM.at;if(T<OPEN*3600-3600)return 0;if(T<k)return 1;return Math.max(0,1-(T-k)/ANTHEM.len)}
function anthemSync(){const pos=anthemPos(),A=ANTHEM.a,a=A.audio;
 if(pos!==null&&pos>=0&&pos<ANTHEM.len-.3&&A.ready&&playing&&speed<=1&&!FF){const fp=P_.flagpole||P_.townsq;setVol(a,(AU.mute?0:AU.v.master)*(SV.on?.4:.25+.75*prox(fp[0],fp[1],300)));
  if(a.paused){a.currentTime=Math.max(0,pos);a.play().catch(()=>{})}else if(Math.abs(a.currentTime-pos)>.8)a.currentTime=Math.max(0,pos)}
 else if(!a.paused)a.pause()}
const welcPlaying=()=>WELC.a.ready&&!WELC.a.audio.paused;
function welcomeSync(){const e=EV.find(x=>x.id==='welcome'),A=WELC.a,a=A.audio;if(!e)return;const live=e.on!==false&&e.ph==='live',pos=live?T-e.key:0,dur=a.duration||0;
 if(live&&A.liveKey!==e.key){A.liveKey=e.key;if(A.ready&&speed!==1&&!FF){speed=1;sync();toast('Let the Magic Begin is starting — speed set to 1× so the music stays in sync')}}
 if(live&&A.ready&&playing&&speed===1&&!FF&&(!dur||pos<dur-.3)){setVol(a,(AU.mute?0:AU.v.master)*(SV.on?.55:.3+.7*prox(EVPOS.welcome[0],EVPOS.welcome[1],320)));
  if(a.paused){a.currentTime=Math.max(0,pos);a.play().catch(()=>{})}else syncTrack(A,a,a.currentTime-pos,()=>{a.currentTime=Math.max(0,pos)})}
 else if(!a.paused)a.pause()}
/* ---------- the Kiss Goodnight's soundtrack ----------
   "A Kiss Goodnight" (the owner's copy, audio/kiss-goodnight.mp3, never committed) plays half an hour after closing
   while the castle shimmers; the moment lasts as long as the track. Kept in step like the other shows. */
const KISS={file:'audio/kiss-goodnight.mp3',a:{audio:new Audio(),ready:false,src:'folder',liveKey:null}};
{const A=KISS.a,a=A.audio,ev=()=>EV.find(e=>e.id==='kiss');a.preload='auto';
 a.addEventListener('canplay',()=>{A.ready=true});
 a.addEventListener('loadedmetadata',()=>{const d=a.duration,e=ev();if(d&&isFinite(d)&&e&&!e.userDur)e.dur=d/60});
 a.addEventListener('error',async()=>{if(A.src!=='folder')return;A.src='none';try{const db=await IDB();const v=await new Promise(res=>{const r=db.transaction('files').objectStore('files').get('kiss');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});if(v&&v.blob){A.src='picked';a.src=URL.createObjectURL(v.blob);a.load()}}catch(e){}});
 loadTrack(a,KISS.file)}
const kissPlaying=()=>KISS.a.ready&&!KISS.a.audio.paused;
function kissSync(){const e=EV.find(x=>x.id==='kiss'),A=KISS.a,a=A.audio;if(!e)return;const live=e.on!==false&&e.ph==='live',pos=live?T-e.key:0,dur=a.duration||0;
 if(live&&A.liveKey!==e.key){A.liveKey=e.key;if(A.ready&&speed!==1&&!FF){speed=1;sync();toast('A Kiss Goodnight — speed set to 1× so the music stays in sync')}}
 if(live&&A.ready&&playing&&speed===1&&!FF&&(!dur||pos<dur-.3)){setVol(a,(AU.mute?0:AU.v.master)*(SV.on?.7:.35+.65*prox(P_.castle[0],P_.castle[1],380)));
  if(a.paused){a.currentTime=Math.max(0,pos);a.play().catch(()=>{})}else syncTrack(A,a,a.currentTime-pos,()=>{a.currentTime=Math.max(0,pos)})}
 else if(!a.paused)a.pause()}
