/* ===== RIDE THE MONORAIL: the view from the front cab =====
   Board a Resort or Express line train (its card: "Ride in the front cab") and the map gives way to the view out of the
   lead car's front window: a WebGL scene built once from the map data around the Seven Seas Lagoon -
   - the ground, painted from the map's lawns, forests, water, parking, roads and walkways;
   - every building as a solid block in the same land or resort colours the map uses, Space Mountain as a white cone and
     the Contemporary as its A-frame with the Grand Canyon Concourse inside, which the Resort line runs straight through;
   - Cinderella Castle (its picture, standing up), the trees as round crowns, the street lamps lit after dark;
   - the monorail beams on their pylons with platforms and canopies at the stations, and the other trains on them.
   The camera sits at the nose of the lead car, so it follows the train round the loop, easing into and out of each
   station. Drag to look around (it drifts back to straight ahead). The sky and the light follow the time of day. The
   onboard audio plays (audio/ride-monorail.mp3) and the panel shows the next stop. Leave with the button or Escape: the
   map comes back, following the train. */
const RIDE={on:false,i:-1,gl:null,built:false,yaw:null,look:0,pitch:0,drag:null,idle:0,dyn:null};
const RIDE_BH=9,RIDE_NOSE=27; /* beam top height, and the cab's distance ahead of a train's position, in map units */
function rideRegion(){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k of['resort','express'])for(const[x,y]of OSM.mono[k]||[]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 const M=900;return[Math.max(0,x0-M),Math.max(0,y0-M),Math.min(OSM.W,x1+M),Math.min(OSM.H,y1+M)]}
const rideHex=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
/* ---- small 3D helpers ---- */
function rideTri(A,a,b,c,col,t){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
 const f=t?t[6]:0;[a,b,c].forEach((p,i)=>A.push(p[0],p[1],p[2],col[0],col[1],col[2],nx,ny,nz,t?t[i*2]:0,t?t[i*2+1]:0,f))}
/* a quad; uv (optional) = [ua,va,ub,vb,uc,vc,ud,vd] in map units along the wall and up it, kind 1 = a wall with windows, 2 = a plain wall,
   3 = self-lit after dark (shop windows, the mosaic), 4 and 5 = as 1 and 2 but indoors, warmly lit after dark */
const rideQuad=(A,a,b,c,d,col,uv,k)=>{if(!uv){rideTri(A,a,b,c,col);rideTri(A,a,c,d,col);return}rideTri(A,a,b,c,col,[uv[0],uv[1],uv[2],uv[3],uv[4],uv[5],k]);rideTri(A,a,c,d,col,[uv[0],uv[1],uv[4],uv[5],uv[6],uv[7],k])};
/* a box along a segment (map x,y -> world x,z), w wide, from height y0 to y1; k (optional) its surface kind as for rideQuad */
function rideSeg(A,ax,az,bx,bz,w,y0,y1,col,ends,k){const L=Math.hypot(bx-ax,bz-az)||1,px=-(bz-az)/L*w/2,pz=(bx-ax)/L*w/2,Q=k?(a,b,c,d,cl)=>rideQuad(A,a,b,c,d,cl,[0,0,0,0,0,0,0,0],k):(a,b,c,d,cl)=>rideQuad(A,a,b,c,d,cl);
 const p=[[ax+px,az+pz],[bx+px,bz+pz],[bx-px,bz-pz],[ax-px,az-pz]];
 Q([p[0][0],y1,p[0][1]],[p[1][0],y1,p[1][1]],[p[2][0],y1,p[2][1]],[p[3][0],y1,p[3][1]],col);
 Q([p[0][0],y0,p[0][1]],[p[1][0],y0,p[1][1]],[p[1][0],y1,p[1][1]],[p[0][0],y1,p[0][1]],col);
 Q([p[3][0],y0,p[3][1]],[p[2][0],y0,p[2][1]],[p[2][0],y1,p[2][1]],[p[3][0],y1,p[3][1]],col);
 if(ends){Q([p[0][0],y0,p[0][1]],[p[3][0],y0,p[3][1]],[p[3][0],y1,p[3][1]],[p[0][0],y1,p[0][1]],col);Q([p[1][0],y0,p[1][1]],[p[2][0],y0,p[2][1]],[p[2][0],y1,p[2][1]],[p[1][0],y1,p[1][1]],col)}}
/* a footprint without its repeated closing point or doubled points; and a polygon's signed area */
function rideClean(p){const P=[];for(const q of p){const l=P[P.length-1];if(!l||Math.hypot(q[0]-l[0],q[1]-l[1])>.05)P.push(q)}while(P.length>3&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<=.05)P.pop();return P}
function rideArea(P){let A=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];A+=a[0]*b[1]-b[0]*a[1]}return A/2}
/* ear clipping, for the flat roofs */
function rideEar(P0){const P=[];for(const q of P0){const l=P[P.length-1];if(!l||Math.hypot(q[0]-l[0],q[1]-l[1])>.05)P.push(q)}while(P.length>3&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<=.05)P.pop(); /* repeated points out */
 for(let i=0;i<P.length&&P.length>3;){const a=P[(i+P.length-1)%P.length],b=P[i],c=P[(i+1)%P.length];if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-6)P.splice(i,1);else i++} /* and points in a straight line */
 const n=P.length;if(n<3)return[];let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const s=A>0?1:-1,idx=[...Array(n).keys()],out=[];
 const cr=(a,b,c)=>((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*s,inT=(p,a,b,c)=>cr(a,b,p)>=0&&cr(b,c,p)>=0&&cr(c,a,p)>=0;let g=0;
 while(idx.length>3&&g<n*n){g++;let ok=false;for(let i=0;i<idx.length;i++){const ia=idx[(i+idx.length-1)%idx.length],ib=idx[i],ic=idx[(i+1)%idx.length],a=P[ia],b=P[ib],c=P[ic];
   if(cr(a,b,c)<=1e-9)continue;let e=true;for(const j of idx){if(j===ia||j===ib||j===ic)continue;if(inT(P[j],a,b,c)){e=false;break}}if(!e)continue;out.push([a,b,c]);idx.splice(i,1);ok=true;break}
  if(!ok)break}
 if(idx.length===3)out.push(idx.map(i=>P[i]));else for(let i=1;i<idx.length-1;i++)out.push([P[idx[0]],P[idx[i]],P[idx[i+1]]]); /* stuck (a self-touching outline): fan out what is left */
 return out}
/* ---- the ground: the map's areas, roads and walkways painted onto one texture ---- */
function rideGround(R,maxT){const w=R[2]-R[0],h=R[3]-R[1],K=Math.min(1.6,maxT/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.round(w*K);cv.height=Math.round(h*K);
 const c=cv.getContext('2d');c.scale(K,K);c.translate(-R[0],-R[1]);c.fillStyle='#8fbf5a';c.fillRect(R[0],R[1],w,h);
 const inR=o=>{const b=bbox(o);return b[2]>R[0]&&b[0]<R[2]&&b[3]>R[1]&&b[1]<R[3]},A=OSM.areas.filter(a=>a.o.length>2&&inR(a.o));
 const fill=(k,col)=>{for(const a of A)if(a.k===k){areaPath(c,a);c.fillStyle=col;c.fill('evenodd')}};
 fill('grass','#a6d36c');fill('scrub','#8db560');fill('sand','#eddcaa');fill('parking','#b4b8bf');fill('construction','#c9a77c');fill('garden','#93c862');fill('forest','#3f7330');
 for(const a of A)if(a.k==='water'){c.save();areaPath(c,a);c.clip('evenodd');areaPath(c,a);c.fillStyle='#4fb3d0';c.fill('evenodd');for(const[lw,col]of[[14,'#62c2da'],[5,'#9fe0e8'],[1.6,'#d8f3f2']]){c.strokeStyle=col;c.lineWidth=lw;areaPath(c,a);c.stroke()}c.restore()}
 fill('ped','#e6d9cc');
 const RW={road1:8.5,road2:6.5,road3:3.8};c.lineCap=c.lineJoin='round';
 for(const pass of[0,1])for(const l of OSM.lines)if(RW[l.k])for(const p of l.p){if(!inR(p))continue;c.strokeStyle=pass?(l.k==='road3'?'#c3c5cb':'#a9adb6'):'#7b8088';c.lineWidth=RW[l.k]+(pass?0:1.2);pathOf(c,p);c.stroke()}
 for(const q of OSM.paths){if(!inR(q.p))continue;if(q.a){c.fillStyle='#ede1d6';pathOf(c,q.p,1);c.fill()}else{c.strokeStyle=q.q?'#e3d6c8':'#ede1d6';c.lineWidth=q.w;pathOf(c,q.p);c.stroke()}}
 fill('bridge','#dccbb4');fill('pier','#b98e5e');
 for(const l of OSM.lines)if(l.k==='rail')for(const p of l.p){if(!inR(p))continue;c.strokeStyle='#8a7357';c.lineWidth=3;pathOf(c,p);c.stroke()}
 c.fillStyle='rgba(60,60,55,.35)';for(const q of OSM.buildings)if(q.p.length>2&&inR(q.p)){pathOf(c,q.p,1);c.fill()} /* a little shade at each building's foot */
 return cv}
/* the Contemporary: its A-frame along the footprint's longest side, open at both ends, and inside it the Grand Canyon
   Concourse the Resort line runs through - the two legs of rooms leaning together, the atrium between them with a
   balcony corridor on every floor (their doors lit after dark), a tiled concourse floor, a row of shops, the tall
   elevator core faced with a mosaic (an original pattern of mesas in bright tiles, not the real mural), glazed ends
   above the openings, and warm lights along the balconies at night */
function rideContemporary(A,q,b,cx_,cy_,S){let best=0,ux=1,uz=0;for(let i=0;i<q.p.length;i++){const a=q.p[i],c=q.p[(i+1)%q.p.length],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(l>best){best=l;ux=(c[0]-a[0])/l;uz=(c[1]-a[1])/l}}
 const vx=-uz,vz=ux;let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const[x,y]of q.p){const u=(x-cx_)*ux+(y-cy_)*uz,v=(x-cx_)*vx+(y-cy_)*vz;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
 /* which side the beams run on (the shops and the elevator core go on the other), and how far out the farther one is (sampled along the beams, which may be one long straight piece here):
    the legs of rooms are made thin enough to leave the trains a clear way through the atrium */
 const vm=(v0+v1)/2,hw=(v1-v0)/2,um=(u0+u1)/2,H=q.h*S,F=RIDE_BH-2.6;let vb=0,nb=0,bo=0;
 for(const k of['resort','express']){if(!OSM.mono[k])continue;const MP=mkPath(OSM.mono[k]);for(let d=0;d<MP.L;d+=4){const[x,y]=MP.at(d);if(!(x>b[0]&&x<b[2]&&y>b[1]&&y<b[3]))continue;const v=(x-cx_)*vx+(y-cy_)*vz;vb+=v;nb++;bo=Math.max(bo,Math.abs(v-vm))}}
 const sg=nb&&vb/nb>vm?-1:1,T=Math.max(2.5,Math.min(10,hw*(1-(RIDE_BH+5)/H)-bo-7));
 const P=(u,v,y)=>[cx_+ux*u+vx*v,y,cy_+uz*u+vz*v],yi=H*(1-T/hw),wi=y=>hw-T-hw*y/H; /* wi: the atrium's half-width at height y */
 const wall=rideHex('#d9dbd8'),glass=rideHex('#8a94a0'),inner=rideHex('#e6dfd2'),slab=rideHex('#c9c2b6'),rail=rideHex('#f3eee2'),steel=rideHex('#7d858c'),XL=RIDE.xl=[];
 const seg=(ua,va,ub,vb,w,y0,y1,col,e,k)=>{const a=P(ua,va,0),c=P(ub,vb,0);rideSeg(A,a[0],a[2],c[0],c[2],w,y0,y1,col,e,k)};
 /* the outside: the two sloping walls, and the balconies' dark bands */
 rideQuad(A,P(u0,v0,0),P(u1,v0,0),P(u1,vm,H),P(u0,vm,H),wall);rideQuad(A,P(u0,v1,0),P(u1,v1,0),P(u1,vm,H),P(u0,vm,H),wall);
 for(let k=1;k<14;k++){const f=k/14,y=H*f,va=v0+(vm-v0)*f,vb=v1+(vm-v1)*f;seg(u0,va,u1,va,.6,y-.5,y+.3,glass);seg(u0,vb,u1,vb,.6,y-.5,y+.3,glass)}
 /* the legs' ends, the lobby floors' end walls under the concourse, and the atrium's two sloping inner walls */
 for(const u of[u0,u1]){for(const s of[-1,1])rideQuad(A,P(u,vm+s*hw,0),P(u,vm,H),P(u,vm,yi),P(u,vm+s*(hw-T),0),wall,[s*hw,0,0,H,0,yi,s*(hw-T),0],1);
  rideQuad(A,P(u,vm-hw+T,0),P(u,vm+hw-T,0),P(u,vm+wi(F),F),P(u,vm-wi(F),F),wall,[-hw+T,0,hw-T,0,wi(F),F,-wi(F),F],1)}
 for(const s of[-1,1])rideQuad(A,P(u0,vm+s*wi(F),F),P(u1,vm+s*wi(F),F),P(u1,vm,yi),P(u0,vm,yi),inner,[u0,0,u1,0,u1,yi-F,u0,yi-F],4);
 /* a balcony corridor along each floor: its slab, its solid rail, and a light every so often */
 for(let k=1;;k++){const y=F+.6+3.4*k,w=wi(y);if(w<3)break;for(const s of[-1,1]){const vs=vm+s*(w-.65),vr=vm+s*(w-1.25);seg(u0+.5,vs,u1-.5,vs,1.3,y-.35,y,slab,false,5);seg(u0+.5,vr,u1-.5,vr,.16,y,y+1,rail,false,5);
   for(let u=u0+6;u<u1-4;u+=13){const p=P(u,vm+s*(w-.3),y+2.6);XL.push(p[0],p[1],p[2])}}}
 /* the concourse floor, in big tiles that glow a little at night */
 const fw=wi(F),fa=rideHex('#cdbfa6'),fb=rideHex('#bba98d'),ts=6;
 for(let u=u0,i=0;u<u1;u+=ts,i++)for(let v=-fw,j=0;v<fw;v+=ts,j++){const ue=Math.min(u1,u+ts),ve=Math.min(fw,v+ts);rideQuad(A,P(u,vm+v,F),P(ue,vm+v,F),P(ue,vm+ve,F),P(u,vm+ve,F),(i+j)%2?fa:fb,[0,0,0,0,0,0,0,0],3)}
 /* the shops: a row of low fronts facing the concourse, each with a coloured awning and lit windows */
 const SH=['#c8433a','#2f5d8a','#3fa7a3','#e8763a','#8a5a9e','#6fb36b'].map(rideHex),sb=rideHex("#ece4d6"),sa=15,sz=25,sh=3.6;
 for(let u=u0+10,n=0;u+13<u1-8;u+=16,n++){if(Math.abs(u+6.5-um)<12)continue;const ue=u+13,c=SH[n%SH.length];
  seg(u,vm+sg*(sa+sz)/2,ue,vm+sg*(sa+sz)/2,sz-sa,F,F+sh,sb,true,5);
  rideQuad(A,P(u,vm+sg*(sa-.03),F),P(ue,vm+sg*(sa-.03),F),P(ue,vm+sg*(sa-.03),F+sh*.72),P(u,vm+sg*(sa-.03),F+sh*.72),rideHex('#f6e3b4'),[0,0,0,0,0,0,0,0],3);
  for(let m=u+2.6;m<ue-1;m+=2.6)seg(m,vm+sg*(sa-.08),m+.01,vm+sg*(sa-.08),.18,F,F+sh*.72,sb,false,5);
  rideQuad(A,P(u-.2,vm+sg*sa,F+sh*.95),P(ue+.2,vm+sg*sa,F+sh*.95),P(ue+.2,vm+sg*(sa-1.4),F+sh*.72),P(u-.2,vm+sg*(sa-1.4),F+sh*.72),c,[0,0,0,0,0,0,0,0],5);
  const lp=P(u+6.5,vm+sg*(sa-.8),F+sh+.4);XL.push(lp[0],lp[1],lp[2])}
 /* the elevator core in the middle, faced with mosaic tiles up to the ninth floor or so, plain above */
 const MZ=['#e8763a','#f2c14e','#3fa7a3','#c8433a','#2f5d8a','#f4ead2','#8a5a9e','#6fb36b'].map(rideHex),ca=2,cb=12,cw=5,top=F+26,tile=1.4;
 const tc=(a,y)=>{const band=Math.floor(y/5),fy=(y%5)/5,fx=Math.abs(((a/7+band*.5)%1)*2-1),h=hsh(Math.round(a*13+y*71));return h%100<12?MZ[h%8]:fx<1-fy?MZ[(band*3)%8]:MZ[(band*3+5)%8]};
 const faces=[[um-cw,ca,um+cw,ca],[um+cw,ca,um+cw,cb],[um+cw,cb,um-cw,cb],[um-cw,cb,um-cw,ca]];let a0=0;
 for(const[ua,va,ub,vb2]of faces){const L=Math.hypot(ub-ua,vb2-va),n=Math.round(L/tile),du=(ub-ua)/n,dv=(vb2-va)/n;
  for(let i=0;i<n;i++)for(let y=0;y<top-F;y+=tile){const y1=Math.min(top-F,y+tile),A1=[ua+du*i,va+dv*i],B1=[ua+du*(i+1),va+dv*(i+1)];
   rideQuad(A,P(A1[0],vm+sg*A1[1],F+y),P(B1[0],vm+sg*B1[1],F+y),P(B1[0],vm+sg*B1[1],F+y1),P(A1[0],vm+sg*A1[1],F+y1),tc(a0+i*tile,y),[0,0,0,0,0,0,0,0],3)}a0+=L}
 seg(um-cw,vm+sg*(ca+cb)/2,um+cw,vm+sg*(ca+cb)/2,cb-ca,top,H*(1-(cb+.5)/hw)-1,inner,true,5);
 for(let i=0;i<4;i++){const p=P(um+(i<2?-1:1)*(cw+1.5),vm+sg*(i%2?cb:ca),top-1);XL.push(p[0],p[1],p[2])}
 /* the ends: steel mullions glazing the triangle above the openings the trains run through */
 const gy=RIDE_BH+7;for(const u of[u0+.2,u1-.2]){for(let y=gy;y<yi-1;y+=3.4){const w=wi(y);seg(u,vm-w,u,vm+w,.25,y-.12,y+.12,steel)}
  for(let v=-wi(gy)+2;v<wi(gy);v+=4){const yt=H*(1-T/hw-Math.abs(v)/hw);if(yt>gy){const a=P(u-.12,vm+v,0),c=P(u+.12,vm+v,0);rideSeg(A,a[0],a[2],c[0],c[2],.25,gy,yt,steel)}}
  seg(u,vm-wi(gy),u,vm+wi(gy),.6,gy-.3,gy+.3,steel)}}
/* Bay Lake Tower: a tall curved slab, white with rows of windows, a band of dark glass round its top floor (the lounge
   up there), and a flat roof with a low parapet */
function rideBayLakeTower(A,q,S){const P=rideClean(q.p);if(P.length<3)return;const H=q.h*S,G=3.6,wall=rideHex('#eceeec'),glass=rideHex('#4f6475'),roof=rideHex('#c4c9cc'),fin=rideHex('#dfe3e6');let u=0;
 for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);
  rideQuad(A,[a[0],0,a[1]],[c[0],0,c[1]],[c[0],H-G,c[1]],[a[0],H-G,a[1]],wall,[u,0,u+L,0,u+L,H-G,u,H-G],1);
  rideQuad(A,[a[0],H-G,a[1]],[c[0],H-G,c[1]],[c[0],H,c[1]],[a[0],H,a[1]],glass);
  rideQuad(A,[a[0],H,a[1]],[c[0],H,c[1]],[c[0],H+1.1,c[1]],[a[0],H+1.1,a[1]],fin,[u,H,u+L,H,u+L,H+1.1,u,H+1.1],2);u+=L}
 for(const[a,b,c]of rideEar(P))rideTri(A,[a[0],H,a[1]],[b[0],H,b[1]],[c[0],H,c[1]],roof)}
/* the Skyway Bridge from Bay Lake Tower to the Contemporary: an enclosed walkway up at the concourse's level on posts */
function rideSkyway(A,q){const P=rideClean(q.p);if(P.length<3)return;const y0=RIDE_BH-2.6,y1=y0+3.8,wall=rideHex('#dfe3e6'),deck=rideHex('#b8bcc0'),post=rideHex('#d4d9df');let u=0;
 for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);
  rideQuad(A,[a[0],y0-.6,a[1]],[c[0],y0-.6,c[1]],[c[0],y1,c[1]],[a[0],y1,a[1]],wall,[u,0,u+L,0,u+L,y1-y0+.6,u,y1-y0+.6],1);u+=L}
 for(const[a,b,c]of rideEar(P))for(const y of[y0-.6,y1])rideTri(A,[a[0],y,a[1]],[b[0],y,b[1]],[c[0],y,c[1]],deck);
 const h=Math.floor(P.length/2);for(let i=2;i<h-1;i+=4){const a=P[i],c=P[P.length-1-i]||a,x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;rideSeg(A,x-.45,z,x+.45,z,.9,0,y0-.6,post,true)}}
/* ---- everything solid: buildings, landmarks, beams, pylons, stations ---- */
function rideSolids(R){const A=[],S=OSM.S||1.02,inR=(x,y)=>x>R[0]&&x<R[2]&&y>R[1]&&y<R[3];
 const castleB=OSM.buildings.find(q=>q.n==='Cinderella Castle');
 for(const q of OSM.buildings){if(q.p.length<3)continue;const b=bbox(q.p),cx_=(b[0]+b[2])/2,cy_=(b[1]+b[3])/2;if(!inR(cx_,cy_))continue;
  if(q===castleB||(castleB&&ptIn(cx_,cy_,castleB.p)))continue;
  if(q.n==='Space Mountain'){const r=(b[2]-b[0])/2,H=r*1.3,N=28,col=rideHex('#eef1f5');for(let i=0;i<N;i++){const a0=i/N*6.2832,a1=(i+1)/N*6.2832;rideTri(A,[cx_+Math.cos(a0)*r,0,cy_+Math.sin(a0)*r],[cx_,H,cy_],[cx_+Math.cos(a1)*r,0,cy_+Math.sin(a1)*r],i%2?col:rideHex('#dfe4ea'))}continue}
  if(/^Disney['’]s Contemporary Resort$/.test(q.n||'')&&q.h>30){rideContemporary(A,q,b,cx_,cy_,S);continue} /* the name exactly: Bay Lake Tower's ends the same way */
  if(/^Bay Lake Tower/.test(q.n||'')){rideBayLakeTower(A,q,S);continue}
  if(q.n==='Skyway Bridge'){rideSkyway(A,q);continue}
  const land=Object.keys(OSM.lands||{}).find(k=>ptIn(cx_,cy_,OSM.lands[k]))||resortOf(cx_,cy_)||'none',st=LANDSTYLE[land]||LANDSTYLE.none,hs=hsh(Math.round(cx_*31+cy_*17));
  const wall=rideHex(st[0][hs%st[0].length]),roof=rideHex(q.c&&/^#/.test(q.c)?q.c:st[1][(hs>>>4)%st[1].length]),H=Math.max(3,(q.k==='roof'?Math.min(q.h,4):q.h)*S);
  const P=rideClean(q.p);if(P.length<3)continue;const win=H>=5&&q.k!=='roof'?1:2;let u=0;
  for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);rideQuad(A,[a[0],0,a[1]],[c[0],0,c[1]],[c[0],H,c[1]],[a[0],H,a[1]],wall,[u,0,u+L,0,u+L,H,u,H],win);u+=L}
  let cx2=0,cz2=0;for(const[x,y]of P){cx2+=x;cz2+=y}cx2/=P.length;cz2/=P.length;
  let sg=0,convex=true;for(let i=0;i<P.length;i++){const a=P[i],b2=P[(i+1)%P.length],c=P[(i+2)%P.length],cr=(b2[0]-a[0])*(c[1]-b2[1])-(b2[1]-a[1])*(c[0]-b2[0]);if(Math.abs(cr)<1e-6)continue;const s2=Math.sign(cr);if(sg&&s2!==sg)convex=false;sg=s2}
  const span=Math.sqrt(Math.abs(rideArea(P))),pitched=convex&&P.length<=14&&H<30&&q.k!=='roof'&&land!=='cont'&&land!=='tom'&&span<70;
  if(pitched){ /* a hipped roof: eaves a little out from the walls, sloping up to a short ridge */
   const rise=Math.min(9,span*.32),out=P.map(([x,y])=>{const d=Math.hypot(x-cx2,y-cz2)||1,k=1+.7/d;return[cx2+(x-cx2)*k,cz2+(y-cz2)*k]}),inn=P.map(([x,y])=>[cx2+(x-cx2)*.28,cz2+(y-cz2)*.28]),dk=roof.map(v=>v*.82);
   for(let i=0;i<P.length;i++){const j=(i+1)%P.length;rideQuad(A,[out[i][0],H,out[i][1]],[out[j][0],H,out[j][1]],[inn[j][0],H+rise,inn[j][1]],[inn[i][0],H+rise,inn[i][1]],roof);
    rideQuad(A,[out[i][0],H-.35,out[i][1]],[out[j][0],H-.35,out[j][1]],[out[j][0],H,out[j][1]],[out[i][0],H,out[i][1]],dk)} /* the eaves' edge */
   for(const[a,b2,c]of rideEar(inn))rideTri(A,[a[0],H+rise,a[1]],[b2[0],H+rise,b2[1]],[c[0],H+rise,c[1]],roof)}
  else{ /* a flat roof inside a low parapet, with a little rooftop plant on the bigger ones */
   for(const[a,b2,c]of rideEar(P))rideTri(A,[a[0],H,a[1]],[b2[0],H,b2[1]],[c[0],H,c[1]],roof.map(v=>v*.92));u=0;
   for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);rideQuad(A,[a[0],H,a[1]],[c[0],H,c[1]],[c[0],H+.9,c[1]],[a[0],H+.9,a[1]],wall,[u,H,u+L,H,u+L,H+.9,u,H+.9],2);u+=L}
   if(span>22&&q.k!=='roof'){const g=rideHex('#9aa0a6');rideSeg(A,cx2-2,cz2,cx2+2,cz2,3,H,H+2,g,true)}}}
 /* the beams (the lines the trains run on), their pylons, and the stations' platforms and canopies */
 const beam=rideHex('#eef1f4'),pyl=rideHex('#d4d9df'),MI=OSM.monoIn;
 for(const k of['resort','express','epcot']){if(!OSM.mono[k])continue;const P=mkPath(OSM.mono[k]);let last=null,acc=0;
  for(let d=0;d<=P.L;d+=6){const[x,y]=P.at(Math.min(d,P.L-.01));if(last&&(inR(x,y)||inR(last[0],last[1]))){const inside=MI&&x>MI[0]-6&&x<MI[2]+6&&y>MI[1]-6&&y<MI[3]+6;rideSeg(A,last[0],last[1],x,y,1.5,RIDE_BH-1.9,RIDE_BH,beam,false,inside?5:0);acc+=6; /* lit like the concourse inside the Contemporary */
   if(acc>=36&&!inside){acc=0;rideSeg(A,x-.6,y,x+.6,y,1.2,0,RIDE_BH-1.9,pyl,true)}}last=[x,y]}}
 const plat=rideHex('#cfc8bd'),can=rideHex('#f4f4f2');
 for(const s of['ttc','poly','gf','mk','cont']){const q=P_[s];if(!q)continue;for(const k of['resort','express']){const l=MLINE[k];if(!l||l.stops.indexOf(s)<0)continue;const d=l.p.proj(...q);
   const a=l.p.at(Math.max(0,d-32)),b=l.p.at(Math.min(l.p.L-.01,d+32)),L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;
   for(const o of[-3.6]){rideSeg(A,a[0]+nx*o,a[1]+nz*o,b[0]+nx*o,b[1]+nz*o,4,RIDE_BH-1.4,RIDE_BH-.9,plat,true,s==='cont'?5:0)}
   if(s!=='cont')rideSeg(A,a[0]-nx*1,a[1]-nz*1,b[0]-nx*1,b[1]-nz*1,11,RIDE_BH+5.2,RIDE_BH+5.8,can,true)}}

 return A}
/* the trees (the map's own, with its kinds: crown, pine, palm) and the street lamps. Any tree that would reach the
   beams is left out. Crowns are a cluster of leafy round points on a trunk; pines stacked cones; palms a tall thin trunk
   with drooping fronds. Trees deep in a forest get no trunk (it can't be seen) */
function ridePoints(R,A){const T_=[],L_=[],inR=(x,y)=>x>R[0]&&x<R[2]&&y>R[1]&&y<R[3],G=['#3f7a35','#4f8a3e','#5a9a44','#46803a','#6aa84c','#3a6e30'].map(rideHex);
 const grid=new Map(),cell=24,key=(i,j)=>i*100000+j;for(const k of['resort','express','epcot']){if(!OSM.mono[k])continue;const P=mkPath(OSM.mono[k]);for(let d=0;d<P.L;d+=4){const[x,y]=P.at(Math.min(d,P.L-.01));if(!inR(x,y))continue;const kk=key(Math.floor(x/cell),Math.floor(y/cell));(grid.get(kk)||grid.set(kk,[]).get(kk)).push([x,y])}}
 const nearBeam=(x,y,r)=>{const i=Math.floor(x/cell),j=Math.floor(y/cell);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const L=grid.get(key(i+a,j+b));if(L)for(const p of L)if((p[0]-x)**2+(p[1]-y)**2<r*r)return true}return false};
 const src=MAP.crowns&&MAP.crowns.length?MAP.crowns:OSM.trees.map(([x,y])=>[x,y,3.4,'crown',0,false]),trunk=rideHex('#6b5040'),palmT=rideHex('#8a7356'),frond=rideHex('#4f8f3a'),pineC=rideHex('#2f5e2c');let cones=0;
 for(const t of src){const[x,y,r0,k,,inF]=t;if(!inR(x,y))continue;const r=(r0||3.4)*.95,h=hsh(Math.round(x*7+y*13)),seed=(h%1000)/1000,c=G[h%G.length];
  if(nearBeam(x,y,(k==='palm'?r*1.7:r*1.25)+2.2))continue; /* clear of the track */
  if(k==='palm'){const H=r*2.6,lx=(seed-.5)*1.2,lz=((h>>>10)%100/100-.5)*1.2,tx=x+lx,tz=y+lz;rideSeg(A,x,y,x+.01,y,.55,0,H,palmT);rideSeg(A,x,y,tx,tz,.45,H*.6,H,palmT);
   for(let f=0;f<7;f++){const an=f/7*6.283+seed*6,L=r*1.7,ex=tx+Math.cos(an)*L,ez=tz+Math.sin(an)*L,mx=tx+Math.cos(an)*L*.5,mz=tz+Math.sin(an)*L*.5,px=-Math.sin(an)*.55,pz=Math.cos(an)*.55;
    rideTri(A,[tx,H+.2,tz],[mx+px,H+.35,mz+pz],[mx-px,H+.35,mz-pz],frond);rideQuad(A,[mx+px,H+.35,mz+pz],[ex,H-L*.45,ez],[ex,H-L*.45,ez],[mx-px,H+.35,mz-pz],frond)}continue}
  if(k==='pine'&&cones<20000){cones++;const H=r*3.2,N=7;if(!inF)rideSeg(A,x,y,x+.01,y,.5,0,H*.3,trunk);
   for(const[y0,y1,rr]of[[H*.22,H*.7,r*1.05],[H*.5,H,r*.7]]){for(let i=0;i<N;i++){const a0=i/N*6.283,a1=(i+1)/N*6.283;rideTri(A,[x+Math.cos(a0)*rr,y0,y+Math.sin(a0)*rr],[x,y1,y],[x+Math.cos(a1)*rr,y0,y+Math.sin(a1)*rr],pineC.map(v=>v*(.85+.3*((i+h)%3)/2)))}}continue}
  const top=r*1.55;if(!inF)rideSeg(A,x,y,x+.01,y,.45,0,top,trunk);
  T_.push(x,top,y,r*2.1,c[0],c[1],c[2],seed);
  for(let n=0;n<(inF?1:3);n++){const an=seed*6.283+n*2.1,o=r*.5,c2=G[(h>>>(n*3+4))%G.length];T_.push(x+Math.cos(an)*o,top+(n-1)*r*.28,y+Math.sin(an)*o,r*1.45,c2[0],c2[1],c2[2],(seed*7+n*.37)%1)}}
 const xl=RIDE.xl||[];for(let i=0;i<xl.length;i+=3)L_.push(xl[i],xl[i+1],xl[i+2],.9,1,.86,.58,0); /* the Contemporary's inside lights */
 for(const[x,y]of OSM.lamps||[])if(inR(x,y)){L_.push(x,4.2,y,1.4,1,.9,.62,0);A&&rideSeg(A,x,y,x+.01,y,.32,0,4,rideHex('#3f4640'));rideSeg(A,x-.35,y,x+.35,y,.5,3.9,4.5,rideHex('#e8e2cc'),true)}
 return{t:new Float32Array(T_),l:new Float32Array(L_)}}
/* ---- WebGL ---- */
const RIDE_VS_LIT='attribute vec3 p;attribute vec3 c;attribute vec3 n;attribute vec3 t;uniform mat4 M;uniform vec3 E;varying vec3 vc;varying vec3 vn;varying vec3 vp;varying vec3 vt;void main(){gl_Position=M*vec4(p,1.);vc=c;vn=n;vp=p;vt=t;}';
const RIDE_FS_LIT='precision highp float;varying vec3 vc;varying vec3 vn;varying vec3 vp;varying vec3 vt;uniform vec3 E;uniform vec3 L;uniform vec3 SC;uniform vec3 AC;uniform vec3 FC;uniform vec2 FR;uniform float NI;float hs(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);}void main(){float vf=distance(vp,E);float d=abs(dot(normalize(vn),L));vec3 base=vc;vec3 em=vec3(0.);float ind=step(3.5,vt.z),kz=vt.z-3.*ind;if(kz>2.5)em=base*NI*.85;else if(kz>.5){if(ind<.5)base*=.72+.28*smoothstep(0.,3.5,vt.y);if(kz<1.5&&vt.y>1.4){vec2 g=vec2(vt.x/3.1,(vt.y-.6)/3.4);vec2 f=fract(g);float w=step(.24,f.x)*step(f.x,.76)*step(.28,f.y)*step(f.y,.78);float r=hs(floor(g));vec3 gl=mix(vec3(.2,.27,.34),vec3(.42,.52,.6),r*.6+.2*d);base=mix(base,gl,w*.9);em=w*NI*step(.42,r)*vec3(1.,.8,.48)*(.55+.45*r);}}em+=ind*NI*base*vec3(.78,.6,.4);vec3 col=base*(AC+SC*d)+em;float f=clamp((vf-FR.x)/(FR.y-FR.x),0.,1.);gl_FragColor=vec4(mix(col,FC,f),1.);}';
const RIDE_VS_TEX='attribute vec3 p;attribute vec2 u;uniform mat4 M;uniform vec3 E;varying vec2 vu;varying vec3 vp;void main(){gl_Position=M*vec4(p,1.);vu=u;vp=p;}';
const RIDE_FS_TEX='precision highp float;varying vec2 vu;varying vec3 vp;uniform vec3 E;uniform sampler2D T;uniform vec3 SC;uniform vec3 AC;uniform vec3 FC;uniform vec2 FR;uniform vec3 G;uniform float MODE;float hs(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);}float vn(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}void main(){vec3 col;if(MODE<.5){col=texture2D(T,vu).rgb;col*=.9+.14*vn(vp.xz*.12)+.08*vn(vp.xz*1.1);}else if(MODE<1.5)col=G;else{vec4 t=texture2D(T,vu);if(t.a<.45)discard;col=t.rgb;}col*=AC+SC*.9;float vf=distance(vp,E);float f=clamp((vf-FR.x)/(FR.y-FR.x),0.,1.);gl_FragColor=vec4(mix(col,FC,f),1.);}';
const RIDE_VS_PT='attribute vec3 p;attribute float s;attribute vec3 c;attribute float q;uniform mat4 M;uniform vec3 E;uniform float K;uniform float MX;varying vec3 vc;varying float vf;varying float vq;void main(){vec4 o=M*vec4(p,1.);gl_Position=o;vf=distance(p,E);gl_PointSize=clamp(s*K/max(o.w,.1),1.,MX);vc=c;vq=q;}';
const RIDE_FS_PT='precision highp float;varying vec3 vc;varying float vf;varying float vq;uniform vec3 SC;uniform vec3 AC;uniform vec3 FC;uniform vec2 FR;uniform float EM;float hs(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);}float vn(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}void main(){vec2 d=gl_PointCoord-.5;float r=length(d);vec3 col;if(EM>.5){if(r>.5)discard;col=vc*(1.-r*r*4.);}else{vec2 o=vec2(vq*31.,vq*17.);float n=vn(gl_PointCoord*6.+o),m=vn(gl_PointCoord*15.+o*1.7);if(r>.5-.13*n)discard;float sh=.9+.55*(-d.x-d.y*1.3)-r*.45;col=vc*sh*(.72+.45*m)*(AC+SC*.85);}float f=clamp((vf-FR.x)/(FR.y-FR.x),0.,1.);gl_FragColor=vec4(mix(col,FC,EM>.5?f*.5:f),1.);}';
const RIDE_VS_SKY='attribute vec2 p;varying float vy;void main(){gl_Position=vec4(p,.9999,1.);vy=p.y;}';
const RIDE_FS_SKY='precision mediump float;varying float vy;uniform vec3 TC;uniform vec3 HC;uniform float HY;void main(){float f=clamp((vy-HY)/max(.05,1.-HY),0.,1.);gl_FragColor=vec4(mix(HC,TC,pow(f,.7)),1.);}';
function rideProg(gl,vs,fs){const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
 const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
 const u={},a={};const nu=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS),na=gl.getProgramParameter(p,gl.ACTIVE_ATTRIBUTES);for(let i=0;i<nu;i++){const n=gl.getActiveUniform(p,i).name;u[n]=gl.getUniformLocation(p,n)}for(let i=0;i<na;i++){const n=gl.getActiveAttrib(p,i).name;a[n]=gl.getAttribLocation(p,n)}return{p,u,a}}
function rideBuf(gl,data,dyn){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,dyn?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);return b}
function rideAttrs(gl,P,buf,spec){for(let i=0;i<5;i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,buf);const st=spec.reduce((s,x)=>s+x[1],0)*4;let o=0;for(const[n,k]of spec){const l=P.a[n];if(l!==undefined&&l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,k,gl.FLOAT,false,st,o)}o+=k*4}}
function rideBuild(){const cv=document.getElementById('rideCv');let gl=cv.getContext('webgl2',{antialias:true,alpha:false})||cv.getContext('webgl',{antialias:true,alpha:false});if(!gl)return false;
 const R=rideRegion(),G={gl,R,v2:typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext};
 G.lit=rideProg(gl,RIDE_VS_LIT,RIDE_FS_LIT);G.tex=rideProg(gl,RIDE_VS_TEX,RIDE_FS_TEX);G.pt=rideProg(gl,RIDE_VS_PT,RIDE_FS_PT);G.sky=rideProg(gl,RIDE_VS_SKY,RIDE_FS_SKY);
 const maxT=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)),gc=rideGround(R,maxT);G.gt=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,G.gt);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,gc);
 if(G.v2){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR)}else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 gc.width=gc.height=0;
 const[x0,y0,x1,y1]=R,E=7000;G.ground=rideBuf(gl,new Float32Array([x0,0,y0,0,0,x1,0,y0,1,0,x1,0,y1,1,1,x0,0,y0,0,0,x1,0,y1,1,1,x0,0,y1,0,1]));
 G.outer=rideBuf(gl,new Float32Array([x0-E,-.3,y0-E,0,0,x1+E,-.3,y0-E,0,0,x1+E,-.3,y1+E,0,0,x0-E,-.3,y0-E,0,0,x1+E,-.3,y1+E,0,0,x0-E,-.3,y1+E,0,0]));
 const SA=rideSolids(R),pts=ridePoints(R,SA),S=new Float32Array(SA);G.solid=rideBuf(gl,S);G.nSolid=S.length/12;G.trees=rideBuf(gl,pts.t);G.nTrees=pts.t.length/8;G.lamps=rideBuf(gl,pts.l);G.nLamps=pts.l.length/8;
 G.dyn=rideBuf(gl,new Float32Array(12),true);G.skyB=rideBuf(gl,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]));
 const ci=typeof CASTLE_IMG!=='undefined'&&CASTLE_IMG&&CASTLE_IMG.naturalWidth?CASTLE_IMG:(MAP.castle||null),cb=OSM.buildings.find(q=>q.n==='Cinderella Castle');
 if(ci&&cb){G.ct=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,G.ct);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ci);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const b=bbox(cb.p),H=58*(OSM.S||1.02),Wd=H*(ci.naturalWidth||ci.width)/(ci.naturalHeight||ci.height);G.castle={x:(b[0]+b[2])/2,z:(b[1]+b[3])/2+(b[3]-b[1])*.2,H,W:Wd};G.cb=rideBuf(gl,new Float32Array(30),true)}
 G.ptMax=(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)||[1,64])[1];RIDE.gl=G;RIDE.built=true;return true}
/* ---- matrices ---- */
function rideMat(fovy,asp,eye,yaw,pitch){const n=.5,f=9000,t=1/Math.tan(fovy/2),P=[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];
 const fx=Math.cos(pitch)*Math.cos(yaw),fy=Math.sin(pitch),fz=Math.cos(pitch)*Math.sin(yaw);let rx=-fz,rz=fx;const rl=Math.hypot(rx,rz)||1;rx/=rl;rz/=rl;const ux=-rz*fy,uy=rz*fx-rx*fz,uz=rx*fy;
 const V=[rx,ux,-fx,0,0,uy,-fy,0,rz,uz,-fz,0,-(rx*eye[0]+rz*eye[2]),-(ux*eye[0]+uy*eye[1]+uz*eye[2]),fx*eye[0]+fy*eye[1]+fz*eye[2],1],M=new Float32Array(16);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=P[k*4+j]*V[i*4+k];M[i*4+j]=s}return M}
/* ---- the light and the sky at this time of day ---- */
function rideLight(){const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),n=Math.min(1,nf),g=gf;
 let TC=mix([.36,.62,.88],[.4,.45,.72],g),HC=mix([.82,.91,.96],[.97,.7,.48],g),AC=mix([.58,.6,.64],[.55,.48,.48],g),SC=mix([.5,.48,.42],[.62,.42,.28],g);
 TC=mix(TC,[.02,.04,.1],n);HC=mix(HC,[.1,.14,.26],n);AC=mix(AC,[.16,.18,.28],n);SC=mix(SC,[.06,.06,.1],n);return{TC,HC,AC,SC}}
/* ---- each frame ---- */
function rideFrame(dt){const G=RIDE.gl,m=MONO[RIDE.i];if(!G||!m){rideLeave();return}const gl=G.gl,cv=gl.canvas,dpr=Math.min(2,devicePixelRatio||1),W=Math.round(cv.clientWidth*dpr),H=Math.round(cv.clientHeight*dpr);
 if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}gl.viewport(0,0,W,H);
 const[ex,ez]=monoXY(m,RIDE_NOSE),a=monoXY(m,RIDE_NOSE-6),b=monoXY(m,RIDE_NOSE+20),hd=Math.atan2(b[1]-a[1],b[0]-a[0]);
 if(RIDE.yaw===null)RIDE.yaw=hd;let dd=hd-RIDE.yaw;dd=Math.atan2(Math.sin(dd),Math.cos(dd));RIDE.yaw+=dd*Math.min(1,dt*5);
 if(!RIDE.drag){RIDE.idle+=dt;if(RIDE.idle>2.5){RIDE.look*=Math.max(0,1-dt*1.2);RIDE.pitch*=Math.max(0,1-dt*1.2)}}
 const asp=W/H,fovy=asp<1?1.25:Math.max(.75,2*Math.atan(Math.tan(.62)/asp)),pitch=-.09+RIDE.pitch,eye=[ex,RIDE_BH+3.1,ez],M=rideMat(fovy,asp,eye,RIDE.yaw+RIDE.look,pitch),Lt=rideLight(),FR=[350,3200];
 gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(...Lt.HC,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 /* sky */
 {const P=G.sky;gl.useProgram(P.p);gl.depthMask(false);rideAttrs(gl,P,G.skyB,[['p',2]]);gl.uniform3fv(P.u.TC,Lt.TC);gl.uniform3fv(P.u.HC,Lt.HC);gl.uniform1f(P.u.HY,Math.tan(-pitch)/Math.tan(fovy/2));gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true)}
 const common=P=>{gl.useProgram(P.p);gl.uniformMatrix4fv(P.u.M,false,M);gl.uniform3fv(P.u.E,eye);gl.uniform3fv(P.u.FC,Lt.HC);gl.uniform2fv(P.u.FR,FR);if(P.u.AC)gl.uniform3fv(P.u.AC,Lt.AC);if(P.u.SC)gl.uniform3fv(P.u.SC,Lt.SC)};
 /* ground */
 {const P=G.tex;common(P);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,G.gt);gl.uniform1i(P.u.T,0);gl.uniform3fv(P.u.G,[.32,.5,.24]);
  gl.uniform1f(P.u.MODE,1);rideAttrs(gl,P,G.outer,[['p',3],['u',2]]);gl.drawArrays(gl.TRIANGLES,0,6);
  gl.uniform1f(P.u.MODE,0);rideAttrs(gl,P,G.ground,[['p',3],['u',2]]);gl.drawArrays(gl.TRIANGLES,0,6)}
 /* solids, then the other trains */
 {const P=G.lit;common(P);gl.uniform3fv(P.u.L,[.42,.8,.43]);gl.uniform1f(P.u.NI,Math.max(0,Math.min(1,(nf-.25)*1.6)));rideAttrs(gl,P,G.solid,[['p',3],['c',3],['n',3],['t',3]]);gl.drawArrays(gl.TRIANGLES,0,G.nSolid);
  const D=[],wh=rideHex('#f7f7f4'),glass=rideHex('#26303c');for(const o of MONO){if(o===m||o.l==='epcot'&&!G.v2)continue;const col=rideHex(o.col);
   for(let k=0;k<6;k++){const[cx_,cz]=monoXY(o,22.5-k*9),q0=monoXY(o,22.5-k*9-4.1),q1=monoXY(o,22.5-k*9+4.1);if(Math.hypot(cx_-ex,cz-ez)>2600)continue;
    const MI=OSM.monoIn;if(MI&&cx_>MI[0]&&cx_<MI[2]&&cz>MI[1]&&cz<MI[3]&&Math.hypot(cx_-ex,cz-ez)>60)continue;
    rideSeg(D,q0[0],q0[1],q1[0],q1[1],2.9,RIDE_BH,RIDE_BH+3.3,wh,true);rideSeg(D,q0[0],q0[1],q1[0],q1[1],3.0,RIDE_BH+1.1,RIDE_BH+1.7,col,true);rideSeg(D,q0[0],q0[1],q1[0],q1[1],3.0,RIDE_BH+2.1,RIDE_BH+2.8,glass,true)}}
  if(D.length){gl.bindBuffer(gl.ARRAY_BUFFER,G.dyn);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(D),gl.DYNAMIC_DRAW);rideAttrs(gl,P,G.dyn,[['p',3],['c',3],['n',3],['t',3]]);gl.drawArrays(gl.TRIANGLES,0,D.length/12)}}
 /* the castle, standing up and turned to face the train */
 if(G.castle){const c=G.castle,P=G.tex,yw=Math.atan2(c.z-ez,c.x-ex),rx=-Math.sin(yw)*c.W/2,rz=Math.cos(yw)*c.W/2;
  const v=new Float32Array([c.x-rx,0,c.z-rz,0,1,c.x+rx,0,c.z+rz,1,1,c.x+rx,c.H,c.z+rz,1,0,c.x-rx,0,c.z-rz,0,1,c.x+rx,c.H,c.z+rz,1,0,c.x-rx,c.H,c.z-rz,0,0]);
  common(P);gl.bindTexture(gl.TEXTURE_2D,G.ct);gl.uniform1i(P.u.T,0);gl.uniform1f(P.u.MODE,2);if(nf>.4)gl.uniform3fv(P.u.AC,[.55,.5,.75]);gl.bindBuffer(gl.ARRAY_BUFFER,G.cb);gl.bufferData(gl.ARRAY_BUFFER,v,gl.DYNAMIC_DRAW);rideAttrs(gl,P,G.cb,[['p',3],['u',2]]);gl.drawArrays(gl.TRIANGLES,0,6)}
 /* trees, then the lamps after dark */
 {const P=G.pt;common(P);gl.uniform1f(P.u.K,H/2/Math.tan(fovy/2));gl.uniform1f(P.u.MX,G.ptMax);gl.uniform1f(P.u.EM,0);rideAttrs(gl,P,G.trees,[['p',3],['s',1],['c',3],['q',1]]);gl.drawArrays(gl.POINTS,0,G.nTrees);
  if(nf>.3&&G.nLamps){gl.uniform1f(P.u.EM,1);rideAttrs(gl,P,G.lamps,[['p',3],['s',1],['c',3],['q',1]]);gl.drawArrays(gl.POINTS,0,G.nLamps)}}
 rideHud(m)}
const rideTime=s=>{s=Math.max(0,Math.round(s));return s>=60?`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`:`${s} s`};
function rideHud(m){const l=MLINE[m.l],L=l.p.L,t=document.getElementById('rideTtl'),s=document.getElementById('rideSt');if(!t)return;
 t.textContent=`Monorail ${m.nm} · ${l.n} line`;
 if(m.st==='dwell')s.textContent=`Doors open at ${STOPNAME[l.stops[m.at]]} · leaving in ${rideTime(m.tm)}`;
 else{const gap=((l.sd[m.nx]-m.x)%L+L)%L;s.textContent=`Next stop: ${STOPNAME[l.stops[m.nx]]} · about ${rideTime(gap/MSPEED+3)}`}}
/* ---- boarding and leaving ---- */
function rideBoard(i){const m=MONO[i];if(!m||m.l==='epcot'){console.warn('rideBoard: no such train',i);return}const box=document.getElementById('ride');
 if(!RIDE.built){toast('Boarding…');setTimeout(()=>{let ok=false;try{ok=rideBuild()}catch(e){console.warn('Ride view could not start',e)}if(!ok){toast('This browser can’t show the cab view (no WebGL)');return}rideBoard(i)},30);return}
 if(typeof TV!=='undefined'&&TV.on&&typeof tvStop==='function')tvStop();if(SV.on)setView(false);
 RIDE.on=true;RIDE.i=i;RIDE.yaw=null;RIDE.look=RIDE.pitch=0;follow={k:'m',i};sel=null;if(typeof closeSheet==='function')closeSheet();
 if(typeof liveUnfollow==='function'&&typeof LIVE!=='undefined'&&LIVE.follow&&speed!==1)liveUnfollow();speed=1;playing=true;if(typeof sync==='function')sync();
 if(typeof AU!=='undefined'&&!AU.ready&&typeof auInit==='function')auInit();if(typeof unlockRide==='function')unlockRide();
 box.hidden=false;document.body.classList.add('riding')}
function rideLeave(){if(!RIDE.on)return;RIDE.on=false;const box=document.getElementById('ride');if(box)box.hidden=true;document.body.classList.remove('riding');
 const m=MONO[RIDE.i];if(m){follow={k:'m',i:RIDE.i};const[x,y]=monoXY(m);cam.x=cam.tx=x;cam.y=cam.ty=y;cam.tm=Math.max(cam.tm,3);cam.m=cam.tm}}
/* drag to look around; Escape leaves */
{const cv=document.getElementById('rideCv');if(cv){
 cv.addEventListener('pointerdown',e=>{RIDE.drag={x:e.clientX,y:e.clientY,l:RIDE.look,p:RIDE.pitch};RIDE.idle=0;cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{const d=RIDE.drag;if(!d)return;const k=2.4/Math.max(320,cv.clientWidth);RIDE.look=Math.max(-2.6,Math.min(2.6,d.l-(e.clientX-d.x)*k*1.6));RIDE.pitch=Math.max(-.6,Math.min(.45,d.p+(e.clientY-d.y)*k));RIDE.idle=0});
 for(const ev of['pointerup','pointercancel'])cv.addEventListener(ev,()=>{RIDE.drag=null;RIDE.idle=0})}
 const lv=document.getElementById('rideLeave');if(lv)lv.onclick=rideLeave;
 document.addEventListener('keydown',e=>{if(RIDE.on&&e.key==='Escape'){e.stopPropagation();rideLeave()}},true)}
