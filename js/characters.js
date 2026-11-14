/* ===== PARADE CHARACTERS =====
   Small drawn figures of the Disney characters who ride and walk in the parades (the owner asked for them).
   drawChar(c, s, x, y, who, t, o) draws one standing with its feet at (x, y) metres, s pixels per metre, waving in time t.
   o adds a costume: {santa:1} a Santa hat, {witch:1} a witch's hat, {cape:'#colour'} a cape.
   Figures are simple shapes sized to read at parade scale: about 1.5 m for the mice, 2 m for Goofy. */
const CHARS={
 mickey:{t:'mouse',shorts:'#d6303f'},minnie:{t:'mouse',dress:'#d6303f',bow:'#d6303f'},
 donald:{t:'duck',shirt:'#2f6fd6',hat:'#2f6fd6'},daisy:{t:'duck',shirt:'#b88ae8',bow:'#ff8fc8'},
 goofy:{t:'goof'},pluto:{t:'dog'},chip:{t:'chip',nose:'#2a1a12'},dale:{t:'chip',nose:'#d6303f'},
 pooh:{t:'bear',fur:'#f2b83a',shirt:'#d6303f'},tigger:{t:'bear',fur:'#f08a2c',stripes:1},
 cinderella:{t:'gown',gown:'#8fc4f2',hair:'#f2d16a',up:1},belle:{t:'gown',gown:'#f2c444',hair:'#6b4226',up:1},tiana:{t:'gown',gown:'#9fd88a',hair:'#2a1a12',skin:'#8a5a3a',up:1,tiara:1},
 rapunzel:{t:'gown',gown:'#b58ae8',hair:'#f2d16a',long:1},aurora:{t:'gown',gown:'#ff9fc8',hair:'#f2d16a',tiara:1},snow:{t:'gown',gown:'#f2d23f',top:'#2f4fa8',hair:'#1d1a1a',bowc:'#d6303f'},
 elsa:{t:'gown',gown:'#9fe0f5',hair:'#f6eecb',long:1,narrow:1},anna:{t:'gown',gown:'#3f5fb0',hair:'#b5562a',cape:'#c0307a'},wendy:{t:'gown',gown:'#9fc8f2',hair:'#8a5a32',narrow:1},
 tink:{t:'gown',gown:'#8fd84a',hair:'#f2d16a',up:1,narrow:1,short:1,wings:1,h:.8},ariel:{t:'mermaid'},
 prince:{t:'man',coat:'#f4efe2',legs:'#b3262e',hair:'#5a3a22'},peter:{t:'man',coat:'#5aa83c',legs:'#3f7a35',hair:'#c8642a',cap:'#4f9a3c'},hook:{t:'man',coat:'#b3262e',legs:'#2a2230',hair:'#1d1a1a',plume:1},
 maleficent:{t:'gown',gown:'#2a2230',hair:'#2a2230',skin:'#b8d89a',cape:'#5a2f7a',horns:1,narrow:1,staff:'#7dff5a'},queen:{t:'gown',gown:'#5a2f8a',hair:'#1d1a1a',cape:'#1d1a1a',crown:1,narrow:1},
 cruella:{t:'gown',gown:'#f4f1ea',hair:'#f4f1ea',hair2:'#1d1a1a',narrow:1,gloves:'#d6303f'},jafar:{t:'gown',gown:'#2a2230',top:'#b3262e',hair:'#2a2230',skin:'#c99a6a',narrow:1,tall:1,staff:'#f2c444'}};
function drawChar(c,s,x,y,who,t,o){const d=CHARS[who];if(!d)return;o=o||{};t=t||0;const k=(d.h||1)*s,X=x*s,Y=y*s,wv=Math.sin(t*5+x*3)*.18,SK=d.skin||'#f2c9a0';
 const dot=(px,py,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(X+px*k,Y+py*k,r*k,0,7);c.fill()},ell=(px,py,rx,ry,col,a)=>{c.fillStyle=col;c.beginPath();c.ellipse(X+px*k,Y+py*k,rx*k,ry*k,a||0,0,7);c.fill()},
  box=(px,py,w,h,col)=>{c.fillStyle=col;c.fillRect(X+px*k,Y+py*k,w*k,h*k)},ln=(pts,col,w)=>{c.strokeStyle=col;c.lineWidth=Math.max(.5,w*k);c.lineCap='round';c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(X+px*k,Y+py*k):c.moveTo(X+px*k,Y+py*k));c.stroke()},
  tri=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([px,py],i)=>i?c.lineTo(X+px*k,Y+py*k):c.moveTo(X+px*k,Y+py*k));c.closePath();c.fill()};
 let top=-1.8; // where a hat sits
 c.save();c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(X+.1*k,Y,.42*k,.1*k,0,0,7);c.fill();
 if(o.cape||d.cape)tri([[-.2,-1.3],[.2,-1.3],[.5,-.1],[-.5,-.1]],o.cape||d.cape);
 switch(d.t){
  case'mouse':ell(-.2,-.07,.22,.1,'#f2c444');ell(.2,-.07,.22,.1,'#f2c444');ln([[-.13,-.15],[-.12,-.55]],'#1d1a1a',.1);ln([[.13,-.15],[.12,-.55]],'#1d1a1a',.1);box(-.2,-1.2,.4,.35,'#1d1a1a');
   if(d.dress){tri([[-.2,-1.05],[.2,-1.05],[.46,-.5],[-.46,-.5]],d.dress);for(const[px,py]of[[-.15,-.7],[.12,-.62],[0,-.9],[.26,-.78],[-.3,-.58]])dot(px,py,.045,'#fff')}
   else{c.fillStyle=d.shorts;c.beginPath();c.roundRect(X-.3*k,Y-.95*k,.6*k,.45*k,.12*k);c.fill();dot(-.1,-.78,.05,'#fff');dot(.1,-.78,.05,'#fff')}
   ln([[-.2,-1.12],[-.5,-.8]],'#1d1a1a',.09);ln([[.2,-1.12],[.55,-1.45+wv]],'#1d1a1a',.09);dot(-.52,-.78,.11,'#fff');dot(.57,-1.48+wv,.11,'#fff');
   dot(-.3,-1.82,.19,'#1d1a1a');dot(.3,-1.82,.19,'#1d1a1a');dot(0,-1.5,.3,'#1d1a1a');ell(0,-1.43,.2,.19,'#f6d9bd');dot(0,-1.4,.045,'#1d1a1a');
   if(d.bow){tri([[0,-1.82],[-.24,-2],[-.24,-1.66]],d.bow);tri([[0,-1.82],[.24,-2],[.24,-1.66]],d.bow)}top=-1.86;break;
  case'duck':ell(-.14,-.05,.18,.07,'#f29a2c');ell(.16,-.05,.18,.07,'#f29a2c');ln([[-.1,-.1],[-.1,-.35]],'#f29a2c',.07);ln([[.1,-.1],[.1,-.35]],'#f29a2c',.07);
   ell(0,-.72,.3,.4,'#fff');tri([[-.28,-.6],[-.5,-.72],[-.3,-.85]],'#fff');c.fillStyle=d.shirt;c.beginPath();c.roundRect(X-.3*k,Y-1.08*k,.6*k,.36*k,.1*k);c.fill();if(!d.bow)tri([[0,-1.02],[-.12,-.86],[.12,-.86]],'#d6303f');
   ln([[-.26,-.98],[-.48,-.7]],'#fff',.1);ln([[.26,-.98],[.52,-1.3+wv]],'#fff',.1);dot(0,-1.36,.27,'#fff');ell(.22,-1.31,.22,.09,'#f29a2c');dot(.08,-1.44,.04,'#1d1a1a');
   if(d.hat){ell(-.02,-1.62,.24,.1,d.hat);box(-.26,-1.6,.5,.06,'#1d1a1a')}if(d.bow){tri([[0,-1.64],[-.2,-1.8],[-.2,-1.5]],d.bow);tri([[0,-1.64],[.2,-1.8],[.2,-1.5]],d.bow)}top=-1.62;break;
  case'goof':ell(-.2,-.08,.3,.11,'#7a4a2a');ell(.24,-.08,.3,.11,'#7a4a2a');box(-.2,-1,.4,.9,'#2f4fa8');box(-.24,-1.6,.48,.62,'#f08a2c');box(-.24,-1.6,.12,.62,'#1d1a1a');box(.12,-1.6,.12,.62,'#1d1a1a');
   ln([[-.24,-1.5],[-.5,-1]],'#f08a2c',.1);ln([[.24,-1.5],[.6,-1.85+wv]],'#f08a2c',.1);dot(-.52,-.98,.1,'#fff');dot(.62,-1.88+wv,.1,'#fff');
   ln([[-.2,-1.9],[-.3,-1.5]],'#1d1a1a',.1);ln([[.18,-1.95],[.3,-1.55]],'#1d1a1a',.1);dot(0,-1.86,.24,'#1d1a1a');ell(.12,-1.78,.24,.13,'#e9cfa6');dot(.33,-1.82,.05,'#1d1a1a');
   box(-.13,-2.32,.26,.26,'#3fa060');box(-.2,-2.1,.4,.06,'#3fa060');top=-2.3;break;
  case'dog':{const g=Math.sin(t*7+x)*.12;for(const[px,q]of[[-.35,g],[-.2,-g],[.25,g],[.4,-g]])ln([[px,-.45],[px+q,-.02]],'#e9a53a',.09);ell(0,-.55,.5,.2,'#f2b83a');ln([[-.48,-.6],[-.7,-.95+wv]],'#1d1a1a',.04);
   ln([[.4,-.6],[.52,-.82]],'#f2b83a',.16);dot(.56,-.92,.2,'#f2b83a');ell(.76,-.86,.16,.1,'#f2b83a');dot(.9,-.88,.045,'#1d1a1a');ln([[.5,-1.05],[.4,-.7]],'#1d1a1a',.08);box(.4,-.76,.2,.06,'#3fa060');top=-1.1}break;
  case'chip':ell(0,-.38,.22,.32,'#9a6a3c');ell(0,-.34,.13,.22,'#e9cfa6');dot(-.18,-.96,.08,'#9a6a3c');dot(.18,-.96,.08,'#9a6a3c');dot(0,-.8,.2,'#9a6a3c');ell(0,-.75,.13,.1,'#e9cfa6');dot(0,-.78,.04,d.nose);
   ln([[-.2,-.5],[-.38,-.4]],'#9a6a3c',.07);ln([[.2,-.5],[.4,-.72+wv]],'#9a6a3c',.07);ln([[-.2,-.2],[-.45,-.5]],'#7a4f2c',.09);top=-1;break;
  case'bear':ell(-.18,-.1,.16,.12,d.fur);ell(.18,-.1,.16,.12,d.fur);ell(0,-.6,.36,.42,d.fur);if(d.shirt){c.fillStyle=d.shirt;c.beginPath();c.roundRect(X-.36*k,Y-.98*k,.72*k,.34*k,.14*k);c.fill()}
   ln([[-.32,-.8],[-.55,-.55]],d.shirt||d.fur,.13);ln([[.32,-.8],[.58,-1.05+wv]],d.shirt||d.fur,.13);dot(-.2,-1.42,.09,d.fur);dot(.2,-1.42,.09,d.fur);dot(0,-1.2,.28,d.fur);ell(0,-1.13,.13,.1,'#fbe7b8');dot(0,-1.17,.04,'#1d1a1a');
   if(d.stripes){for(const py of[-.75,-.55,-.35])ln([[-.3,py],[-.12,py+.04]],'#1d1a1a',.04);ln([[.3,-.3],[.6,-.55],[.5,-.85+wv]],d.fur,.07)}top=-1.48;break;
  case'mermaid':ln([[.05,-.5],[.5,-.3],[.85,-.55]],'#3fb07a',.2);tri([[.85,-.55],[1.15,-.85],[1.1,-.4]],'#3fb07a');ell(0,-.55,.2,.16,'#3fb07a');box(-.13,-1,.26,.45,'#f2c9a0');box(-.14,-.98,.28,.14,'#8a5ad6');
   ln([[-.13,-.95],[-.35,-.65]],'#f2c9a0',.07);ln([[.13,-.95],[.42,-1.25+wv]],'#f2c9a0',.07);dot(0,-1.18,.17,'#f2c9a0');c.fillStyle='#d6303f';c.beginPath();c.arc(X,Y-1.22*k,.2*k,Math.PI*.95,Math.PI*2.05);c.fill();ln([[-.17,-1.2],[-.25,-.75]],'#d6303f',.11);top=-1.42;break;
  case'man':box(-.17,-.85,.14,.85,d.legs);box(.03,-.85,.14,.85,d.legs);box(-.2,-1.4,.4,.6,d.coat);ln([[-.2,-1.32],[-.42,-.95]],d.coat,.09);ln([[.2,-1.32],[.5,-1.6+wv]],d.coat,.09);
   dot(0,-1.57,.16,SK);c.fillStyle=d.hair;c.beginPath();c.arc(X,Y-1.6*k,.17*k,Math.PI,0);c.fill();
   if(d.cap){tri([[-.22,-1.66],[.3,-1.66],[-.05,-1.95]],d.cap);ln([[.02,-1.75],[.3,-1.98]],'#d6303f',.04)}
   if(d.plume){ell(0,-1.74,.34,.08,'#1d1a1a');box(-.18,-1.9,.36,.16,'#1d1a1a');ln([[.1,-1.9],[.38,-2.08],[.5,-1.92]],'#fff',.07);ln([[-.42,-.95],[-.5,-.86]],'#c9ced6',.05)}top=d.plume?-1.92:-1.78;break;
  default:{const w=d.narrow?.3:.55,hem=d.short?-.55:0,tp=d.tall?.2:0;if(d.wings){c.globalAlpha=.6;ell(-.3,-1.25,.28,.14,'#dff6ff',-.5);ell(.3,-1.25,.28,.14,'#dff6ff',.5);c.globalAlpha=1}
   if(d.short){ln([[-.08,-.55],[-.08,0]],SK,.07);ln([[.08,-.55],[.08,0]],SK,.07)}
   c.fillStyle=d.gown;c.beginPath();c.moveTo(X-.12*k,Y-1*k);c.quadraticCurveTo(X-w*k,Y+(hem-.5)*k,X-w*k,Y+hem*k);c.lineTo(X+w*k,Y+hem*k);c.quadraticCurveTo(X+w*k,Y+(hem-.5)*k,X+.12*k,Y-1*k);c.fill();
   box(-.14,-1.32-tp,.28,.34+tp,d.top||d.gown);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(X-.14*k,Y-1.02*k,.28*k,.05*k);
   if(d.long)ln([[-.14,-1.5-tp],[-.24,-1],[-.2,-.35]],d.hair,.11);
   ln([[-.14,-1.26-tp],[-.36,-.92]],d.gloves||SK,.07);ln([[.14,-1.26-tp],[.44,-1.55-tp+wv]],d.gloves||SK,.07);
   if(d.staff){ln([[-.4,-.02],[-.4,-1.7]],'#3a2a1a',.05);dot(-.4,-1.78,.1,d.staff)}
   dot(0,-1.5-tp,.16,SK);c.fillStyle=d.hair;c.beginPath();c.arc(X,Y-(1.53+tp)*k,.175*k,Math.PI*.95,Math.PI*2.05);c.fill();if(d.hair2){c.fillStyle=d.hair2;c.beginPath();c.arc(X,Y-(1.53+tp)*k,.175*k,Math.PI*1.5,Math.PI*2.05);c.lineTo(X,Y-(1.53+tp)*k);c.fill()}
   if(!d.up&&!d.long&&!d.horns&&!d.tall){ln([[-.16,-1.5],[-.18,-1.28]],d.hair,.08);ln([[.16,-1.5],[.18,-1.28]],d.hair,.08)}
   if(d.up)dot(0,-1.72,.1,d.hair);if(d.tiara||d.crown)tri([[-.12,-1.66],[-.06,-1.8-(d.crown?.06:0)],[0,-1.68],[.06,-1.8-(d.crown?.06:0)],[.12,-1.66]],'#f2c444');if(d.bowc)tri([[-.14,-1.7],[.14,-1.62],[.14,-1.74],[-.14,-1.6]],d.bowc);
   if(d.horns){tri([[-.14,-1.6],[-.34,-2.02],[-.02,-1.68]],'#1d1a1a');tri([[.14,-1.6],[.34,-2.02],[.02,-1.68]],'#1d1a1a')}
   if(d.tall){tri([[-.17,-1.78],[.17,-1.78],[.1,-2.22],[-.1,-2.22]],'#2a2230');box(-.17,-1.84,.34,.07,'#b3262e');ln([[0,-2.2],[.12,-2.45]],'#d6303f',.04)}top=d.tall?-2.2:d.up?-1.8:-1.68}}
 if(o.santa){tri([[-.2,top+.06],[.2,top+.06],[.24,top-.34]],'#d6303f');box(-.22,top+.02,.44,.09,'#fff');dot(.24,top-.34,.07,'#fff')}
 if(o.witch){ell(0,top+.06,.36,.07,'#2a2230');tri([[-.2,top+.06],[.2,top+.06],[.06,top-.5]],'#2a2230');box(-.17,top-.02,.34,.06,'#f08a2c')}
 c.restore()}
