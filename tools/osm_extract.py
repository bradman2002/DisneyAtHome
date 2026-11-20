"""Convert OpenStreetMap data for the Magic Kingdom resort area (the park, Seven Seas Lagoon, the monorail
loop, the Transportation and Ticket Center, the monorail resorts, and Bay Lake with Wilderness Lodge, Discovery
Island and the Fort Wilderness marina) into js/park-osm.js for the simulator.
Map units: metres * S on a W x H canvas (north up, x east, y south).

Input: map.osm in the current folder, plus epcot.osm for Epcot if present (Overpass bbox 28.3590,-81.5620,28.3810,-81.5360),
and gap.osm for all the land between and around them (bbox 28.3645,-81.5905,28.4240,-81.5450).
The map has two filled-in regions, the Magic Kingdom resort area and Epcot; everything between them is left out (blank)
for now: areas are clipped to the regions, lines are cut where they leave them.
Input details: the area is too big The area is too big for openstreetmap.org's Export button; fetch it
from the Overpass API instead (this is the query used; the bbox is south,west,north,east):
  [out:xml][timeout:180][bbox:28.4005,-81.5925,28.4240,-81.5585];(node;way;);(._;>;);out body;rel;out body;
Run from the site folder:  python3 tools/osm_extract.py"""
import xml.etree.ElementTree as ET, math, json, collections, heapq

import os
SRCS=['map.osm']+(['epcot.osm'] if os.path.exists('epcot.osm') else [])+(['gap.osm'] if os.path.exists('gap.osm') and os.path.exists('epcot.osm') else [])+(['muppets.osm'] if os.path.exists('muppets.osm') and os.path.exists('hs.osm') and os.path.exists('gap.osm') else [])+(['hs.osm'] if os.path.exists('hs.osm') and os.path.exists('gap.osm') else [])+(['east.osm'] if os.path.exists('east.osm') and os.path.exists('hs.osm') else [])+(['springs.osm'] if os.path.exists('springs.osm') and os.path.exists('east.osm') else [])+(['ak.osm'] if os.path.exists('ak.osm') and os.path.exists('springs.osm') else []);  # hs.osm: Hollywood Studios and the land round it, from api.openstreetmap.org/api/0.6/map in pieces (bbox 28.3490,-81.5905,28.3660,-81.5360), merged
  # ak.osm: Animal Kingdom, its resorts (Animal Kingdom Lodge, Coronado Springs, the All-Stars) and the land round them: a strip west of
  # the rest (bbox 28.3330,-81.6125,28.4240,-81.5900) and one along the south (28.3330,-81.5900,28.3495,-81.5090), merged the same way
  # springs.osm: Disney Springs, Typhoon Lagoon and the land north of them (bbox 28.3490,-81.5330,28.4240,-81.5090), merged the same way
  # east.osm: a strip east of EPCOT, its parking lots and roads (bbox 28.3490,-81.5450,28.4240,-81.5330), merged the same way
  # muppets.osm: Muppets Courtyard on Grand Avenue as it was before it closed in 2024 (OpenStreetMap history at 2023-06-01 from
  # Overpass, bbox 28.3522,-81.5608,28.3556,-81.5580, only the ways whose middle is in that box). Read before hs.osm so its copies win;
  # today's construction site and the theatre's new name (SKIP_WAYS) are left out
  # gap.osm: everything between (bbox 28.3645,-81.5905,28.4240,-81.5450)
OUT='js/park-osm.js'
# The projection is pinned to a fixed corner (not the file's bounds), so coordinates stay put when the data is refreshed.
# OX/OY place that corner on the canvas: the park sits in the north, the lagoon and resorts to the south, west and east.
S=1.02; OX=470; OY=62; W=3090; H=2290
# with Animal Kingdom the map reaches further west: everything moves right by DX (the JS reads it as OSM.dx for its few fixed spots)
DX=2210 if 'ak.osm' in SRCS else 0; OX+=DX; W+=DX
minlon=-81.58572; maxlat=28.42266; cl=math.cos(math.radians(28.4187))
def proj(lon,lat): return (OX+(lon-minlon)*cl*111320*S, OY+(maxlat-lat)*111320*S)
ND={}; NT={}; WAYS={}; RELS=[]; seen_rel=set()
tags=lambda e:{x.get('k'):x.get('v') for x in e.findall('tag')}
roots=[ET.parse(f).getroot() for f in SRCS]
for r in roots:
    for n in r.findall('node'):
        if n.get('id') in ND: continue
        ND[n.get('id')]=proj(float(n.get('lon')),float(n.get('lat')))
        t={x.get('k'):x.get('v') for x in n.findall('tag')}
        if t: NT[n.get('id')]=t
SKIP_WAYS={'1416883582','1576253220'} if 'muppets.osm' in SRCS else set()  # the Monsters, Inc. construction site and "The Glob Theater"
for r in roots:
    for w in r.findall('way'):
        if w.get('id') in WAYS or w.get('id') in SKIP_WAYS: continue  # the first file's copy wins, so newer overlapping downloads don't reshape what is already mapped
        WAYS[w.get('id')]={'ids':[x.get('ref') for x in w.findall('nd') if x.get('ref') in ND],'t':tags(w)}
    for rl in r.findall('relation'):
        if rl.get('id') in seen_rel: continue
        seen_rel.add(rl.get('id'));RELS.append({'t':tags(rl),'m':[(m.get('type'),m.get('ref'),m.get('role')) for m in rl.findall('member')]})
pts=lambda ids:[ND[i] for i in ids]
R1=lambda p:[round(p[0],1),round(p[1],1)]
def inside(pt,poly):
    x,y=pt;c=False;n=len(poly)
    for i in range(n):
        x1,y1=poly[i];x2,y2=poly[(i+1)%n]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
def area(p): return sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2
def centroid(p):
    a=area(p)
    if abs(a)<1e-6: return (sum(q[0] for q in p)/len(p),sum(q[1] for q in p)/len(p))
    cx=cy=0
    for i in range(len(p)):
        x1,y1=p[i];x2,y2=p[(i+1)%len(p)];f=x1*y2-x2*y1;cx+=(x1+x2)*f;cy+=(y1+y2)*f
    return (cx/(6*a),cy/(6*a))
def simplify(p,tol):
    # between the parks (once that land is filled in) shapes are kept coarser: it is seen from further out, and it keeps the data small
    # (buildings, tol .25, keep their full shape everywhere: the resorts out here are looked at close up too)
    if FULL and tol>.25 and p and not any(inpark(*q) for q in p[::max(1,len(p)//6)]): tol*=3
    return _simplify(p,tol)
FULL=False;inpark=lambda x,y:True
def _simplify(p,tol):
    if len(p)<3: return p
    if len(p)>4 and math.dist(p[0],p[-1])<1e-6:  # closed ring: split at the farthest point so the ends aren't degenerate
        far=max(range(len(p)),key=lambda i:math.dist(p[0],p[i]))
        return _simplify(p[:far+1],tol)[:-1]+_simplify(p[far:],tol)
    def rdp(a,b):
        x1,y1=p[a];x2,y2=p[b];L=math.hypot(x2-x1,y2-y1) or 1e-9;best=-1;bi=-1
        for i in range(a+1,b):
            d=abs((x2-x1)*(y1-p[i][1])-(x1-p[i][0])*(y2-y1))/L
            if d>best:best=d;bi=i
        return [a]+(rdp(a,bi)[:-1]+rdp(bi,b) if best>tol else [b])
    keep=rdp(0,len(p)-1);return [p[i] for i in keep]
def rings_from(way_ids):
    """join member ways into closed rings"""
    segs=[WAYS[w]['ids'][:] for w in way_ids if w in WAYS and len(WAYS[w]['ids'])>1];rings=[]
    while segs:
        cur=segs.pop(0)
        changed=True
        while cur[0]!=cur[-1] and changed:
            changed=False
            for i,s in enumerate(segs):
                if s[0]==cur[-1]: cur+=s[1:];segs.pop(i);changed=True;break
                if s[-1]==cur[-1]: cur+=s[::-1][1:];segs.pop(i);changed=True;break
                if s[-1]==cur[0]: cur=s[:-1]+cur;segs.pop(i);changed=True;break
                if s[0]==cur[0]: cur=s[::-1][:-1]+cur;segs.pop(i);changed=True;break
        rings.append(pts(cur))
    return rings
def chain(way_ids):
    """join route ways into one ordered polyline (longest chain)"""
    segs=[WAYS[w]['ids'][:] for w in way_ids if w in WAYS and len(WAYS[w]['ids'])>1]
    if not segs: return []
    cur=segs.pop(0);changed=True
    while changed:
        changed=False
        for i,s in enumerate(segs):
            if s[0]==cur[-1]: cur+=s[1:];segs.pop(i);changed=True;break
            if s[-1]==cur[-1]: cur+=s[::-1][1:];segs.pop(i);changed=True;break
            if s[-1]==cur[0]: cur=s[:-1]+cur;segs.pop(i);changed=True;break
            if s[0]==cur[0]: cur=s[::-1][:-1]+cur;segs.pop(i);changed=True;break
    return pts(cur)
# ---------------- regions: the Magic Kingdom area, and Epcot (from its theme-park outline) ----------------
REGIONS=[(DX,0,W,H)]  # the Magic Kingdom area (from DX: the strip west of it is Animal Kingdom's)
def epcot_outline(key='epcot'):
    for wid,w in WAYS.items():
        t=w['t']
        if t.get('tourism')=='theme_park' and key in t.get('name','').lower() and len(w['ids'])>3: return pts(w['ids'])
    for rl in RELS:
        t=rl['t']
        if t.get('tourism')=='theme_park' and key in t.get('name','').lower():
            rg=rings_from([ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')])
            if rg: return max(rg,key=len)
    return None
EPC=epcot_outline() if 'epcot.osm' in SRCS else None
if EPC:
    xs=[q[0] for q in EPC];ys=[q[1] for q in EPC];M=70
    REGIONS.append((min(xs)-M,min(ys)-M,max(xs)+M,max(ys)+M))
    W=max(W,int(max(xs)+M+40));H=max(H,int(max(ys)+M+40))
    print('Epcot region',[round(v) for v in REGIONS[1]],'map',W,'x',H)
HSC=epcot_outline('hollywood studios') if 'hs.osm' in SRCS else None
if HSC:  # Hollywood Studios: a third park region, south-west of EPCOT past the Swan and Dolphin
    xs=[q[0] for q in HSC];ys=[q[1] for q in HSC];M=70
    REGIONS.append((min(xs)-M,min(ys)-M,max(xs)+M,max(ys)+M))
    W=max(W,int(max(xs)+M+40));H=max(H,int(max(ys)+M+40))
    print('Hollywood Studios region',[round(v) for v in REGIONS[-1]],'map',W,'x',H)
AKC=epcot_outline('animal kingdom') if 'ak.osm' in SRCS else None
if AKC:  # Animal Kingdom: a fourth park region, west of Hollywood Studios
    xs=[q[0] for q in AKC];ys=[q[1] for q in AKC];M=70
    REGIONS.append((min(xs)-M,min(ys)-M,max(xs)+M,max(ys)+M))
    W=max(W,int(max(xs)+M+40));H=max(H,int(max(ys)+M+40))
    print('Animal Kingdom region',[round(v) for v in REGIONS[-1]],'map',W,'x',H)
PARKS=list(REGIONS)
def inpark(x,y): return any(r[0]<=x<=r[2] and r[1]<=y<=r[3] for r in PARKS)
if EPC and 'gap.osm' in SRCS:  # the land between the parks is filled in too: content everywhere on the map
    H=max(H,6730)  # a little further south than Epcot needs, so the Swan and the Swan Reserve fit whole
    if HSC: H=max(H,int(proj(-81.56,28.3490)[1]))  # down to the bottom of the Hollywood Studios data
    if 'springs.osm' in SRCS: W=max(W,int(proj(-81.5095,28.4)[0]))  # out to the east end of Disney Springs
    if 'east.osm' in SRCS: W=max(W,int(proj(-81.5340,28.4)[0]))  # land east of EPCOT, so its edge isn't the end of the world
    if AKC: H=max(H,int(proj(-81.56,28.3335)[1]))  # down past the All-Star resorts
    FULL=True;REGIONS.append((0,0,W,H));print('filled in: whole map',W,'x',H)
def inreg(x,y,m=0): return any(r[0]-m<=x<=r[2]+m and r[1]-m<=y<=r[3]+m for r in REGIONS)
def clip_box(p,m=60): return any(inreg(x,y,m) for x,y in p)
def runs(p,m=30):
    """split a line into the pieces that lie inside the regions"""
    out_=[[]]
    for q in p:
        if inreg(q[0],q[1],m): out_[-1].append(q)
        elif out_[-1]: out_.append([])
    return [r for r in out_ if len(r)>=2]
def clip_poly(poly,rect):
    """Sutherland-Hodgman: the part of a polygon inside a rectangle"""
    x0,y0,x1,y1=rect;P=list(poly)
    for edge in range(4):
        if not P: break
        Q=[];inside_=lambda q:(q[0]>=x0,q[1]>=y0,q[0]<=x1,q[1]<=y1)[edge]
        def cut(a,b):
            if edge in(0,2): X=(x0,0,x1)[edge];t=(X-a[0])/((b[0]-a[0]) or 1e-9);return (X,a[1]+(b[1]-a[1])*t)
            Y=(0,y0,0,y1)[edge];t=(Y-a[1])/((b[1]-a[1]) or 1e-9);return (a[0]+(b[0]-a[0])*t,Y)
        for i in range(len(P)):
            a=P[i-1];b=P[i]
            if inside_(b):
                if not inside_(a): Q.append(cut(a,b))
                Q.append(b)
            elif inside_(a): Q.append(cut(a,b))
        P=Q
    return P
def regionize(o):
    """a polygon, kept whole when it lies in one region, otherwise cut to each region it reaches"""
    for r in REGIONS:
        if all(r[0]<=x<=r[2] and r[1]<=y<=r[3] for x,y in o): return [o]
    return [c for c in (clip_poly(o,r) for r in REGIONS) if len(c)>=3]
out=collections.defaultdict(list)
# ---------------- areas & buildings from ways ----------------
AREA_KIND=lambda t:('water' if t.get('natural')=='water' or t.get('water') else 'forest' if t.get('landuse')=='forest' or t.get('natural')=='wood' else
 'grass' if t.get('landuse') in('grass','meadow','village_green') or t.get('leisure') in('park',) else 'garden' if t.get('leisure')=='garden' else
 'sand' if t.get('natural') in('sand','beach','shingle') else 'rock' if t.get('natural')=='bare_rock' else 'scrub' if t.get('natural')=='scrub' else
 'parking' if t.get('amenity') in('parking',) else 'construction' if t.get('landuse')=='construction' else 'ped' if (t.get('highway') in('pedestrian','footway','living_street') and t.get('area')=='yes') or t.get('area:highway') in('pedestrian','footway') or t.get('place')=='square' else None)
# OpenStreetMap has no usable heights for the resort landmarks (the Contemporary is tagged 0.1 levels), so these are set here, in metres
HEIGHTS={"Disney's Contemporary Resort":56,"Bay Lake Tower at Disney's Contemporary Resort":46,'Contemporary Convention Center':12,"Disney's Grand Floridian Resort & Spa":24,
 "The Villas at Disney's Grand Floridian Resort & Spa":20,"Disney's Wilderness Lodge":24,"The Villas at Disney's Wilderness Lodge":18,'Pioneer Hall':9,'Grand Floridian Convention Center':12,'Disney Polynesian Village Resort':13,'The Grand Floridian Station':9,'The Polynesian Village Station':9,
 # the Epcot resorts on Crescent Lake: the Dolphin's triangle tower and the Swan's arched centre block are drawn taller on top of these (map-art.js)
 'The Twilight Zone Tower of Terror':20,'Rock ’n’ Roller Coaster Starring The Muppets':16,'Star Wars: Rise of the Resistance':18,'Fantasmic':12,  # Hollywood Studios (the Tower's 61 m tower is drawn on top in map-art.js)
 'Walt Disney World Dolphin Resort':30,'Walt Disney World Swan Resort':26,'Walt Disney World Swan Reserve':44,'Walt Disney World Dolphin Convention Center':13,'Walt Disney World Swan Convention Center':12,
 "Disney's Yacht Club Resort":21,"Disney's Beach Club Resort":21,"Disney's Beach Club Villas":18,'Disney Yacht & Beach Club Convention Center':13,
 "Disney's BoardWalk Inn":19,"Disney's BoardWalk Villas":17,"Disney's BoardWalk Convention Center":13}
def bheight(t):
    if t.get('name') in HEIGHTS: return HEIGHTS[t['name']]
    if 'height' in t:
        try: return float(t['height'].split()[0])
        except: pass
    if 'building:levels' in t:
        try: return float(t['building:levels'])*4
        except: pass
    b=t.get('building');n=t.get('name','')
    if b=='roof': return 4
    if b=='tent': return 7
    if b in('shed','garages'): return 4
    if b=='train_station': return 11
    if t.get('tourism')=='attraction' or t.get('attraction'): return 14
    return 9
used_in_rel=set()
for rl in RELS:
    if rl['t'].get('type')=='multipolygon':
        for ty,ref,role in rl['m']:
            if ty=='way': used_in_rel.add(ref)
for wid,w in WAYS.items():
    t=w['t'];ids=w['ids']
    if len(ids)<3: continue
    p=pts(ids)
    if not clip_box(p): continue
    closed=ids[0]==ids[-1]
    if 'building' in t and closed:
        c_=centroid(p[:-1]) if len(p)>3 else p[0]
        if not inreg(*c_): continue
        out['buildings'].append({'p':[R1(q) for q in simplify(p[:-1],.25)],'h':bheight(t),'k':t.get('building'),'n':t.get('name',''),
          'a':t.get('attraction') or ('attraction' if t.get('tourism')=='attraction' else ''),'c':t.get('roof:colour') or t.get('building:colour') or ''})
        continue
    k=AREA_KIND(t)
    if k and closed:
        for o_ in regionize(p[:-1]): out['areas'].append({'k':k,'o':[R1(q) for q in simplify(o_,.3)],'i':[]})
        continue
# multipolygons
for rl in RELS:
    t=rl['t']
    if t.get('type')!='multipolygon': continue
    outer=[ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')];inner=[ref for ty,ref,role in rl['m'] if ty=='way' and role=='inner']
    ro=rings_from(outer);ri=rings_from(inner)
    if 'building' in t:
        for o in ro:
            if clip_box(o) and inreg(*centroid(o[:-1] if o[0]==o[-1] else o)): out['buildings'].append({'p':[R1(q) for q in simplify(o[:-1] if o[0]==o[-1] else o,.25)],'h':bheight(t),'k':t.get('building'),'n':t.get('name',''),'a':'','c':''})
        continue
    k=AREA_KIND(t)
    if not k:
        # untagged multipolygon: inherit from its outer way's tags
        for ref in outer:
            if ref in WAYS: k=AREA_KIND(WAYS[ref]['t']) or k
    if not k: continue
    for o in ro:
        if not clip_box(o): continue
        ins=[i for i in ri if inside(i[0],o)]
        for o_ in regionize(o):
            ins_=[[R1(q) for q in simplify(i,.3)] for i in ins if any(inside(q,o_) for q in i[::max(1,len(i)//8)])]
            out['areas'].append({'k':k,'o':[R1(q) for q in simplify(o_,.3)],'i':ins_,'n':t.get('name','')})
# ---------------- lines ----------------
LINES=collections.defaultdict(list)
ROAD={'motorway':1,'trunk':1,'primary':1,'secondary':1,'motorway_link':2,'secondary_link':2,'tertiary':2,'tertiary_link':2,'unclassified':2,'residential':2,'service':3}
for wid,w in WAYS.items():
    t=w['t'];p=pts(w['ids'])
    if len(p)<2 or not clip_box(p): continue
    rw=t.get('railway');hw=t.get('highway');wwy=t.get('waterway')
    if rw=='narrow_gauge': LINES['rail'].append(p)
    elif rw=='monorail': LINES['monoIn' if t.get('tunnel')=='yes' else 'mono'].append(p)
    elif hw in ROAD and t.get('tunnel')!='yes' and t.get('covered')!='yes' and t.get('area')!='yes' and t.get('service') not in('parking_aisle','driveway'):
        LINES['road'+str(ROAD[hw])].append(p)
    elif rw=='light_rail': LINES['pm'].append(p)
    elif rw=='tram': LINES['tram'].append(p)
    elif hw=='raceway': LINES['race'].append(p)
    elif wwy in('canal','stream','river','ditch'): LINES['stream'].append(p)
    elif t.get('man_made') in('bridge','pier') and w['ids'][0]==w['ids'][-1]: out['areas'].append({'k':'pier' if t.get('man_made')=='pier' else 'bridge','o':[R1(q) for q in p[:-1]],'i':[]})
    elif t.get('man_made')=='pier': LINES['pier'].append(p)
    elif t.get('barrier') in('hedge',): LINES['hedge'].append(p)
for k,v in LINES.items(): out['lines'].append({'k':k,'p':[[R1(q) for q in simplify(r_,.3)] for l in v for r_ in runs(l)]})
# ---------------- walkways (art) + graph ----------------
WALK={'footway':4.0,'pedestrian':9.0,'living_street':13.0,'path':3.0,'steps':3.5}
# park boundary for the guest graph: the railroad loop, plus the entrance plaza south of the station out to the
# monorail station, the ferry dock and the bus loop (so arriving guests walk in along the real paths)
rr_rel=next(rl for rl in RELS if rl['t'].get('name')=='Walt Disney World Railroad' and rl['t'].get('type')=='route')
RRP=chain([ref for ty,ref,role in rr_rel['m'] if ty=='way'])
print('railroad chain points',len(RRP),'closed gap',round(math.dist(RRP[0],RRP[-1]),1))
st_main=proj(-81.58122,28.41665) # placeholder, replaced below
def in_park(q):
    x,y=q
    return inside(q,RRP) or (OX+300*S<x<OX+800*S and OY+650*S<y<OY+856*S) or bool(EPC and inside(q,EPC)) or bool(HSC and inside(q,HSC)) or bool(AKC and inside(q,AKC))  # EPCOT, Hollywood Studios: inside their park outlines
paths=[];G=collections.defaultdict(set)
for wid,w in WAYS.items():
    t=w['t'];hw=t.get('highway')
    if hw not in WALK: continue
    p=pts(w['ids']);name=t.get('name','')
    closed=w['ids'][0]==w['ids'][-1] and len(w['ids'])>3
    if not clip_box(p): continue
    queue='queue' in name.lower() or 'exit' in name.lower() or t.get('attraction')=='queue'
    for r_ in runs(p): paths.append({'w':round(WALK[hw]*S*(.45 if queue else 1),1),'p':[R1(q) for q in simplify(r_,.3)],'a':1 if closed and t.get('area')=='yes' and len(r_)==len(p) else 0,'q':1 if queue else 0})
    if queue or t.get('access') in('private','no'): continue
    ids=w['ids']
    for a,b in zip(ids,ids[1:]):
        if in_park(ND[a]) and in_park(ND[b]): G[a].add(b);G[b].add(a)
out['paths']=paths
# largest component
seen=set();comps=[]
for s in G:
    if s in seen: continue
    q=[s];seen.add(s);c=[]
    while q:
        u=q.pop();c.append(u)
        for v in G[u]:
            if v not in seen: seen.add(v);q.append(v)
    comps.append(c)
comps.sort(key=len,reverse=True);main=set(comps[0])
if EPC:  # EPCOT's own walkways: its largest connected piece (the two parks aren't joined by a walk)
    epc=next((c for c in comps if inside(ND[c[0]],EPC)),None)
    if epc: main|=set(epc);print('EPCOT walk graph',len(epc),'nodes')
if HSC:  # and Hollywood Studios' own
    hsc=next((c for c in comps if inside(ND[c[0]],HSC)),None)
    if hsc:
        main|=set(hsc);print('Hollywood Studios walk graph',len(hsc),'nodes')
        # pieces of the Studios' walkways that the map data leaves unjoined (the Fantasmic! amphitheater's): join each to the
        # main network at the closest pair of points, when they are within a short step of each other
        left=[c_ for c_ in comps if c_ is not hsc and len(c_)>=12 and inside(ND[c_[0]],HSC)];grew=True
        while grew:  # repeat, so a piece can join through another that joined before it
            grew=False
            for c_ in left[:]:
                best=min(((math.dist(ND[a],ND[b]),a,b) for a in c_[::2] for b in hsc[::3]),default=None)
                if best and best[0]<60: G[best[1]].add(best[2]);G[best[2]].add(best[1]);main|=set(c_);hsc=hsc+c_;left.remove(c_);grew=True;print('  joined a piece of',len(c_),'nodes, gap',round(best[0],1))
if AKC:  # and Animal Kingdom's, joining stray pieces the same way
    akc=max((c for c in comps if inside(ND[c[0]],AKC)),key=len,default=None)
    if akc:
        main|=set(akc);print('Animal Kingdom walk graph',len(akc),'nodes')
        left=[c_ for c_ in comps if c_ is not akc and len(c_)>=12 and inside(ND[c_[0]],AKC)];grew=True
        while grew:
            grew=False
            for c_ in left[:]:
                best=min(((math.dist(ND[a],ND[b]),a,b) for a in c_[::2] for b in akc[::3]),default=None)
                if best and best[0]<60: G[best[1]].add(best[2]);G[best[2]].add(best[1]);main|=set(c_);akc=akc+c_;left.remove(c_);grew=True;print('  joined a piece of',len(c_),'nodes, gap',round(best[0],1))
print('walk graph',len(G),'nodes; components',[len(c) for c in comps[:6]])
# collapse degree-2 chains, keeping a node every ~14 units so walking follows the curves
keep={u for u in main if len(G[u])!=2}
idx={};NODES=[];EDGES=[]
def nid(u):
    if u not in idx: idx[u]=len(NODES);NODES.append(R1(ND[u]))
    return idx[u]
done=set()
for u in list(keep) or [next(iter(main))]:
    for v in G[u]:
        if (u,v) in done: continue
        path=[u,v];prev=u;cur=v
        while cur not in keep:
            nxt=[x for x in G[cur] if x!=prev and x in main]
            if not nxt: break
            prev,cur=cur,nxt[0];path.append(cur)
            if cur==u: break
        done.add((path[-1],path[-2]));done.add((u,v))
        # resample: keep points at least 14 units apart (plus the ends)
        sel=[path[0]];acc=0
        for a,b in zip(path,path[1:]):
            acc+=math.dist(ND[a],ND[b])
            if acc>=14 and b!=path[-1]: sel.append(b);acc=0
        sel.append(path[-1])
        for a,b in zip(sel,sel[1:]):
            if a==b: continue
            ia,ib=nid(a),nid(b)
            if ia!=ib: EDGES.append((min(ia,ib),max(ia,ib)))
EDGES=sorted(set(EDGES))
print('simplified graph',len(NODES),'nodes',len(EDGES),'edges')
# ---------------- named places ----------------
def find_named(name,pref=('attraction','tourism','amenity','shop','building')):
    best=None
    for wid,w in WAYS.items():
        if w['t'].get('name')==name and len(w['ids'])>1:
            p=pts(w['ids']);c=centroid(p[:-1]) if w['ids'][0]==w['ids'][-1] and len(p)>3 else (sum(q[0] for q in p)/len(p),sum(q[1] for q in p)/len(p))
            sc=(2 if any(k in w['t'] for k in pref) else 1)
            if not best or sc>best[0]: best=(sc,c,p)
    for i,t in NT.items():
        if t.get('name')==name:
            c=ND[i]
            if not best: best=(1,c,[c])
    return best
ALIAS={"Mickey's PhilharMagic":["Mickey's PhillarMagic"]}  # misspellings seen in the live data
def place(name):
    b=find_named(name) or next((x for x in map(find_named,ALIAS.get(name,[])) if x),None)
    if not b:  # mapped as a multipolygon (Soarin', Journey of Water): its largest outer ring
        rl=next((x for x in RELS if x['t'].get('name')==name),None)
        rg=rings_from([ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')]) if rl else []
        if rg: o=max(rg,key=len);b=(1,centroid(o[:-1] if o[0]==o[-1] else o),o)
    if not b: print('  MISSING',name);return None
    return b
out['nodes']=NODES;out['edges']=EDGES
out['trees']=[R1(ND[i]) for i,t in NT.items() if t.get('natural')=='tree' and in_park(ND[i]) or t.get('natural')=='tree' and inreg(*ND[i])]
out['lamps']=[R1(ND[i]) for i,t in NT.items() if t.get('highway')=='street_lamp' and inreg(*ND[i])]
# routes
def rel_chain(name,typ=None,box=None):
    rl=next((x for x in RELS if x['t'].get('name')==name and (typ is None or x['t'].get('type')==typ)),None)
    if not rl: return []
    ws=[ref for ty,ref,role in rl['m'] if ty=='way']
    if box: ws=[w for w in ws if w in WAYS and any(box[0]<=ND[i][0]<=box[2] and box[1]<=ND[i][1]<=box[3] for i in WAYS[w]['ids'])]  # only the part of a long route near here
    return chain(ws)
out['routes']={'rail':[R1(q) for q in simplify(RRP,.4)],'parade':[R1(q) for q in simplify(rel_chain('Festival of Fantasy Parade'),.5)],
 'pm':[R1(q) for q in simplify(rel_chain('Tomorrowland Transit Authority PeopleMover'),.4)],'race':[R1(q) for q in simplify(rel_chain('Tomorrowland Speedway','circuit'),.4)],
 'tram':[R1(q) for q in simplify(rel_chain('Horse Drawn Street Car'),.4)],
 'ferry':[R1(q) for q in simplify(chain([wid for wid,w in WAYS.items() if w['t'].get('name')=='Magic Kingdom - TTC' and w['t'].get('route')=='ferry']),.5)],
 'launch':[R1(q) for q in simplify(chain([wid for wid,w in WAYS.items() if w['t'].get('name','').startswith('Magic Kingdom - Grand Floridian') and w['t'].get('route')=='ferry']),.5)]}
# the Jungle Cruise boats' own route: an unnamed ferry route lying inside the Jungle Cruise river
jr=next((rl for rl in RELS if rl['t'].get('name')=='Jungle Cruise' and rl['t'].get('natural')=='water'),None)
if jr:
    rings=rings_from([ref for ty,ref,role in jr['m'] if ty=='way' and role in('outer','')]);outer=max(rings,key=len) if rings else []
    jw=[wid for wid,w in WAYS.items() if w['t'].get('route')=='ferry' and not w['t'].get('name') and len(w['ids'])>4 and outer and sum(inside(ND[i],outer) for i in w['ids'])>.8*len(w['ids'])]
    out['routes']['jungle']=[R1(q) for q in simplify(chain(jw),.3)]
    print('jungle cruise route ways',jw,len(out['routes']['jungle']),'pts')
for k,v in out['routes'].items(): print('route',k,len(v),'pts', v[0] if v else None, v[-1] if v else None)
# monorail: the line through Magic Kingdom station (choose the two long ways and join through the station)
# beams to paint: every monorail way except the stretch inside the Contemporary (tunnel=yes)
mono=[w for w in WAYS.values() if w['t'].get('railway')=='monorail' and w['t'].get('tunnel')!='yes']
monopts=[p for p in (pts(w['ids']) for w in mono) if clip_box(p)]
out['monoLines']=[[R1(q) for q in simplify(r_,.5)] for p in monopts for r_ in runs(p)]
json.dump(out,open('osm_raw.json','w'))
# names for the simulator
PLACES={}
for key,name in {'castle':'Cinderella Castle','stage':'Cinderella Castle Stage','hub':'Partners','hea':'Happily Ever After Fireworks Spectacular','townsq':'Town Square','station':'Main Street Station',
  'monostation':'Magic Kingdom Monorail Station','busstation':'Magic Kingdom Bus Station','mainst':'Main Street',
  'ms':'Main Street, U.S.A.','adv':'Adventureland','fr':'Frontierland','lib':'Liberty Square','fan':'Fantasyland','tom':'Tomorrowland'}.items():
    b=place(name)
    if b: PLACES[key]=R1(b[1])
ATTR=['Jungle Cruise','Pirates of the Caribbean','The Magic Carpets of Aladdin',"Walt Disney's Enchanted Tiki Room",'Swiss Family Treehouse','Big Thunder Mountain Railroad',"Tiana's Bayou Adventure",'Country Bear Musical Jamboree',
 'The Haunted Mansion','The Hall of Presidents','Seven Dwarfs Mine Train',"Peter Pan's Flight",'"it\'s a small world"','The Many Adventures of Winnie the Pooh','Under the Sea: Journey of the Little Mermaid',"Mickey's PhilharMagic",'Dumbo the Flying Elephant',
 'Mad Tea Party','Prince Charming Regal Carrousel','The Barnstormer','Space Mountain','TRON Lightcycle / Run',"Buzz Lightyear's Space Ranger Spin",'Tomorrowland Speedway','Tomorrowland Transit Authority PeopleMover',"Walt Disney's Carousel of Progress",'Astro Orbiter','Monsters, Inc. Laugh Floor','Town Square Theater']
# EPCOT (when its map data is there)
EP_ATTR=['Spaceship Earth','Guardians Of The Galaxy: Cosmic Rewind','Test Track','Mission: SPACE',"Soarin' Around The World",'Living with the Land','The Seas with Nemo & Friends','Turtle Talk with Crush',
 'Journey Into Imagination With Figment','Journey of Water, Inspired by Moana','Awesome Planet','Frozen Ever After','Remy’s Ratatouille Adventure','Gran Fiesta Tour Starring The Three Caballeros','Reflections of China',
 'Canada Far and Wide','Impressions de France;Beauty and the Beast Sing-Along','The American Adventure']
EP_VEN=['Sunshine Seasons','Regal Eagle Smokehouse: Craft Drafts & Barbecue','Katsura Grill','Les Halles Boulangerie & Pâtisserie','Via Napoli Ristorante e Pizzeria','La Cantina de San Angel','Lotus Blossom Cafe',
 'Yorkshire County Fish Shop','Space 220 Restaurant','Sommerfest','Tangierine Cafe','Kringla Bakeri Og Kafe']
if EPC: ATTR=ATTR+EP_ATTR
# Hollywood Studios: its rides and theatre shows, restaurants and shops (names as in OpenStreetMap)
HS_ATTR=['The Twilight Zone Tower of Terror','Rock ’n’ Roller Coaster Starring The Muppets',"Mickey and Minnie's Runaway Railway",'Star Wars: Rise of the Resistance','Millennium Falcon: Smugglers Run',
 'Star Tours: The Adventures Continue','Slinky Dog Dash','Toy Story Mania!','Alien Swirling Saucers','Indiana Jones Epic Stunt Spectacular!','Theater of the Stars','Voyage of the Little Mermaid',
 'Hyperion Theater','Walt Disney Presents','Mickey Shorts Theater','Disney Junior Dance Party!','The Magic of Disney Animation',"Jim Henson's Muppet*Vision 3-D"]
HS_VEN=['Pizza Rizzo',"Mama Melrose's Ristorante Italiano","50's Prime Time Cafe",'Hollywood and Vine','The Hollywood Brown Derby','ABC Commissary','Roundup Rodeo BBQ','Sci-Fi Dine-In Theater','Docking Bay 7 Food and Cargo','Ronto Roasters',"Woody's Lunch Box",
 'Backlot Express',"Oga's Cantina","Min and Bill's Dockside Diner","Rosie's All-American Café","Catalina Eddie's","Mickey's of Hollywood",'Tower Hotel Gifts','Dok-Ondar’s Den of Antiquities','Celebrity 5 & 10']
if HSC: ATTR=ATTR+HS_ATTR
# Animal Kingdom: its rides, trails and theatre shows (names as in OpenStreetMap; Harambe Theatre is Festival of the Lion King's,
# Theater In The Wild is Finding Nemo's), and its restaurants
AK_ATTR=['Avatar Flight of Passage',"Na'vi River Journey",'Kilimanjaro Safaris','Expedition Everest: Legend of the Forbidden Mountain','Kali River Rapids',
 'Zootopia: Better Zoogether!','Wildlife Express Train','Gorilla Falls Exploration Trail','Maharajah Jungle Trek','Harambe Theatre','Theater In The Wild',
 'The Oasis Exhibits','Discovery Island Trails']
AK_VEN=["Satu'li Canteen",'Flame Tree Barbecue','Pizzafari','Harambe Market','Yak & Yeti Restaurant','Tiffins','Yak & Yeti Local Foods Cafe','Tamu Tamu Refreshments']
if AKC: ATTR=ATTR+AK_ATTR
VEN=(AK_VEN if AKC else [])+(HS_VEN if HSC else [])+(EP_VEN if EPC else [])+['Emporium','Main Street Confectionery',"Casey's Corner",'The Plaza Restaurant','The Crystal Palace','Agrabah Bazaar','Columbia Harbor House','Pecos Bill Tale Tale Inn and Café','Frontier Trading Post','Be Our Guest Restaurant','Storybook Treats',"Cosmic Ray's Starlight Café","Mickey's Star Traders"]
POS={}
for n in ATTR+VEN:
    b=place(n)
    if not b: continue
    c=b[1]
    if n=="Tiana's Bayou Adventure": c=(OX+70*S,OY+388*S)
    if n=='Tomorrowland Speedway': c=find_named('Tomorrowland Speedway',('tourism',))[1]
    if n=='Tomorrowland Transit Authority PeopleMover': c=ND[next(i for i,t in NT.items() if t.get('name')==n)]
    # door = nearest graph node to the building outline
    poly=b[2]
    best=min(range(len(NODES)),key=lambda i:min(math.dist(NODES[i],q) for q in poly[::max(1,len(poly)//24)]+[c]))
    POS[n]={'c':R1(c),'nd':best}
nearest=lambda q:min(range(len(NODES)),key=lambda i:math.dist(NODES[i],q))
gate=nearest((OX+443*S,OY+725*S));townsq=nearest((OX+443*S,OY+650*S));mainst=nearest((OX+443*S,OY+540*S));hub=nearest((OX+443*S,OY+425*S))
epgate=None
if EPC:  # EPCOT's main entrance: just inside the ticket booths, south of the monorail station
    tb=[centroid(pts(w['ids'])[:-1]) for w in WAYS.values() if w['t'].get('name')=='Epcot Ticket Booths' and len(w['ids'])>3]
    if tb: c_=(sum(q[0] for q in tb)/len(tb),sum(q[1] for q in tb)/len(tb)+14);epgate=nearest(c_);print('EPCOT gate node',epgate,NODES[epgate])
hsgate=None
if HSC:  # Hollywood Studios' entrance: just inside its ticket booths (toward the park's middle)
    b_=place('Hollywood Studios Ticket Booths')
    if b_:
        hc=centroid(HSC);bx,by=b_[1];d_=math.dist((bx,by),hc) or 1;ux,uy=(hc[0]-bx)/d_,(hc[1]-by)/d_
        hsgate=nearest((bx+ux*16,by+uy*16));PLACES['hsout']=[round(-ux,3),round(-uy,3)];PLACES['hsbooth']=R1(b_[1]);print('Hollywood Studios gate node',hsgate,NODES[hsgate],'outward',PLACES['hsout'])
akgate=None
if AKC:  # Animal Kingdom's entrance: where its outline comes nearest the bus station, a little way in toward the park's middle
    bs_=next((ND[i] for i,t in NT.items() if t.get('name')=="Disney's Animal Kingdom Bus Station"),None) or (lambda b:b and b[1])(find_named("Disney's Animal Kingdom Bus Station"))
    ac=centroid(AKC)
    if bs_:
        e_=min(AKC,key=lambda q:math.dist(q,bs_));d_=math.dist(e_,ac) or 1;ux,uy=(ac[0]-e_[0])/d_,(ac[1]-e_[1])/d_
        akgate=nearest((e_[0]+ux*20,e_[1]+uy*20));PLACES['akout']=[round(-ux,3),round(-uy,3)];PLACES['akbooth']=R1(e_);PLACES['akbus']=R1(bs_)
        print('Animal Kingdom gate node',akgate,NODES[akgate],'outward',PLACES['akout'])
landnodes={k:nearest(PLACES[k]) for k in('adv','fr','lib','fan','tom') if k in PLACES}
json.dump({'places':PLACES,'pos':POS,'gate':gate,'townsq':townsq,'mainst':mainst,'hub':hub,'land':landnodes},open('osm_places.json','w'),indent=0)
# land boundaries (place=locality polygons named after the lands)
LANDNAMES={'Main Street, U.S.A.':'ms','Adventureland':'adv','Frontierland':'fr','Liberty Square':'lib','Fantasyland':'fan','Tomorrowland':'tom',
 # Animal Kingdom's lands (Discovery Island is an island, found below; DinoLand is closed for its rebuild)
 'Oasis':'oa','Pandora: The World of Avatar':'pa','Africa':'af','Asia':'as',
 # Hollywood Studios' areas (Commissary Lane and Pixar Place are folded into their neighbours)
 'Hollywood Boulevard':'hb','Echo Lake':'el','Grand Avenure':'ga','Grand Avenue':'ga','Star Wars: Galaxy’s Edge':'sw',"Star Wars: Galaxy's Edge":'sw','Toy Story Land':'ts','Animation Courtyard':'ac','Sunset Boulevard':'sb'}
LANDS={}
for wid,w in WAYS.items():
    t=w['t']
    if t.get('place')=='locality' and t.get('name') in LANDNAMES and w['ids'][0]==w['ids'][-1]:
        LANDS[LANDNAMES[t['name']]]=[R1(q) for q in simplify(pts(w['ids'])[:-1],1)]
for rl in RELS:
    t=rl['t']
    if t.get('place')=='locality' and t.get('name') in LANDNAMES and LANDNAMES[t['name']] not in LANDS:
        rg=rings_from([ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')])
        if rg: LANDS[LANDNAMES[t['name']]]=[R1(q) for q in simplify(max(rg,key=len),1)]
if AKC:  # Discovery Island, the island in the middle of Animal Kingdom (not Bay Lake's)
    for wid,w in WAYS.items():
        t=w['t']
        if t.get('place')=='island' and t.get('name')=='Discovery Island' and w['ids'][0]==w['ids'][-1] and inside(centroid(pts(w['ids'])[:-1]),AKC):
            LANDS['di']=[R1(q) for q in simplify(pts(w['ids'])[:-1],1)];break
print('land polygons',list(LANDS))
# monorail: the two passenger loops around Seven Seas Lagoon, each as one closed line.
# Express (outer beam): TTC -> Magic Kingdom -> TTC.  Resort (inner beam): TTC -> Polynesian -> Grand Floridian -> Magic Kingdom -> Contemporary -> TTC.
def station(name):
    i=next((i for i,t in NT.items() if t.get('name')==name and t.get('railway')=='station' and t.get('station')=='monorail'),None)
    if i is None: i=next(i for i,t in NT.items() if t.get('name')==name and t.get('railway')=='station')
    return ND[i]
STN={'ttc':station('Transportation and Ticket Center'),'poly':station('The Polynesian Village'),'gf':station('The Grand Floridian'),'mk':station('Magic Kingdom'),'cont':station("Disney's Contemporary Resort")}
def loop(name,order):
    p=rel_chain(name)
    print(name,'points',len(p),'closing gap',round(math.dist(p[0],p[-1]),1))
    if math.dist(p[0],p[-1])<1e-6: p=p[:-1]
    near=lambda q:min(range(len(p)),key=lambda i:math.dist(p[i],q))
    k=near(STN[order[0]]);p=p[k:]+p[:k]           # start at the first station
    if near(STN[order[1]])>near(STN[order[2]]): p=[p[0]]+p[:0:-1]   # run in the direction the trains do
    idx=[near(STN[o]) for o in order];assert idx==sorted(idx),(name,idx)
    return [R1(q) for q in simplify(p+[p[0]],.4)]
MONO={'express':loop('Magic Kingdom Express Monorail',['ttc','cont','mk']),'resort':loop('Bay Lake Resort Monorail',['ttc','poly','gf','mk','cont'])}
# EPCOT line (once EPCOT and the land between are on the map): Ticket Center -> round over Future World -> EPCOT station
# -> back to the Ticket Center. Run it the way that makes the trip in the long one (the loop over the park comes first).
if FULL:
    ep=rel_chain('Epcot Monorail');esi=next((i for i,t in NT.items() if t.get('name')=='EPCOT' and t.get('railway')=='station'),None)
    if ep and esi:
        STN['epst']=ND[esi];print('Epcot Monorail points',len(ep),'closing gap',round(math.dist(ep[0],ep[-1]),1))
        if math.dist(ep[0],ep[-1])<1e-6: ep=ep[:-1]
        near=lambda q:min(range(len(ep)),key=lambda i:math.dist(ep[i],q))
        k=near(STN['ttc']);ep=ep[k:]+ep[:k]
        if near(STN['epst'])<len(ep)/2: ep=[ep[0]]+ep[:0:-1]  # TTC to EPCOT should be the longer leg
        MONO['epcot']=[R1(q) for q in simplify(ep+[ep[0]],.4)]
        print('  TTC->EPCOT share of the loop',round(near(STN['epst'])/len(ep),2))
tun=[q for l in LINES['monoIn'] for q in l]
monoIn=[round(min(q[0] for q in tun)-3,1),round(min(q[1] for q in tun)-3,1),round(max(q[0] for q in tun)+3,1),round(max(q[1] for q in tun)+3,1)] if tun else None
for k,v in STN.items(): PLACES[k]=R1(v)
# Bay Lake: Wilderness Lodge and its dock, the Fort Wilderness marina (where the boats land), Discovery Island
for key,name in {'wl':"Disney's Wilderness Lodge",'pioneer':'Pioneer Hall','disc':'Discovery Island'}.items():
    b_=place(name)
    if b_: PLACES[key]=R1(b_[1])
wd=next((ND[i] for i,t in NT.items() if t.get('name')=='Wilderness Lodge Dock'),None)
# the Town Square flagpole (the US flagpole nearest Town Square), for the Flag Retreat
fps=[ND[i] for i,t in NT.items() if t.get('man_made')=='flagpole']
if fps and 'townsq' in PLACES: PLACES['flagpole']=R1(min(fps,key=lambda q:math.dist(q,PLACES['townsq'])))
gz=next((ND[i] for i,t in NT.items() if t.get('name')=='Fire Rock Geyser'),None)  # the geyser itself (a point), not the rock field around it
if gz: PLACES['geyser']=R1(gz)
if wd: PLACES['wldock']=R1(wd)
# the boat services on Bay Lake, each as one line starting from its Magic Kingdom (or, for the resort-to-resort boat, Fort Wilderness) end
def boat(prefix): return [R1(q) for q in simplify(chain([wid for wid,w in WAYS.items() if w['t'].get('route')=='ferry' and w['t'].get('name','').lower().startswith(prefix)]),.5)]
BOATS={'fw':boat('magic kingdom - fort wilderness'),'wl':boat('wilderness lodge - magic kingdom'),'blue':boat('fort wilderness - contemporary')}
def from_pt(p,q): return p[::-1] if p and math.dist(p[-1],q)<math.dist(p[0],q) else p
BOATS['fw']=from_pt(BOATS['fw'],PLACES['monostation']);BOATS['wl']=from_pt(BOATS['wl'],PLACES['monostation'])
if BOATS['fw']: PLACES['fw']=BOATS['fw'][-1];BOATS['blue']=from_pt(BOATS['blue'],PLACES['fw'])
# the Friendship boats: the Crescent Lake line (EPCOT's International Gateway, the BoardWalk, the Yacht & Beach Club, the
# Swan & Dolphin, and down the canal to Hollywood Studios), and the two across World Showcase Lagoon from Showcase Plaza.
# The Crescent Lake legs are separate ways whose docks don't always share a node, so they're joined end to nearest end.
def chain_near(lines,start,tol=60):
    segs=[l for l in lines if len(l)>1]
    if not segs: return []
    i,rev=min(((i,r) for i in range(len(segs)) for r in (0,1)),key=lambda t:math.dist(segs[t[0]][-1 if t[1] else 0],start))
    cur=segs.pop(i);cur=cur[::-1] if rev else cur
    while segs:
        i,rev=min(((i,r) for i in range(len(segs)) for r in (0,1)),key=lambda t:math.dist(segs[t[0]][-1 if t[1] else 0],cur[-1]))
        s_=segs[i];s_=s_[::-1] if rev else s_
        if math.dist(s_[0],cur[-1])>tol: break
        segs.pop(i);cur=cur+s_[1:]
    return cur
def dock(name): return next((ND[i] for i,t in NT.items() if t.get('name')==name),None)
if EPC and FULL:
    ig=dock('EPCOT International Gateway Dock');hd=dock('Hollywood Studios Dock')
    if ig: PLACES['igdock']=R1(ig)
    if hd: PLACES['hsdock']=R1(hd)
    legs=[pts(w['ids']) for w in WAYS.values() if w['t'].get('route')=='ferry' and w['t'].get('name') in('EPCOT-Boardwalk','Beach/Yacht Club-BoardWalk','Beach/Yacht Club-Swan/Dolphin','Swan/Dolphin-Hollywood Studios')]
    if ig and legs: BOATS['fsc']=[R1(q) for q in simplify(chain_near(legs,ig),.5)]
    for k,wid in (('fsw','45086801'),('fse','117143427')):  # each starts at its Showcase Plaza end, the lagoon's north end
        if wid in WAYS: l_=pts(WAYS[wid]['ids']);BOATS[k]=[R1(q) for q in simplify(l_ if l_[0][1]<l_[-1][1] else l_[::-1],.5)]
for k,v in BOATS.items(): print('boat',k,len(v),v[0] if v else None,v[-1] if v else None)
# ferries: start each path at its Magic Kingdom end
def from_mk(p): return p[::-1] if p and math.dist(p[-1],PLACES['monostation'])<math.dist(p[0],PLACES['monostation']) else p
ferry=from_mk(out['routes']['ferry']);launch=from_mk(out['routes']['launch'])
print('ferry',len(ferry),ferry[0],ferry[-1],'launch',len(launch),launch[0] if launch else None,launch[-1] if launch else None)
# buses: the real road from the edge of the map to the Magic Kingdom bus loop (from a bus route relation)
bs=PLACES.get('busstation')
R0=REGIONS[0];bus=[q for q in rel_chain('Pop Century → Magic Kingdom',box=(R0[0]-40,R0[1]-40,R0[2]+40,R0[3]+40)) if R0[0]-40<q[0]<R0[2]+40 and R0[1]-40<q[1]<R0[3]+40]
if bus and math.dist(bus[0],bs)<math.dist(bus[-1],bs): bus=bus[::-1]
bruns=[[]]
for a_,b_ in zip(bus,bus[1:]+bus[-1:]):
    bruns[-1].append(a_)
    if math.dist(a_,b_)>150: bruns.append([])
brun=max((r_ for r_ in bruns if len(r_)>1),key=lambda r_:(-round(math.dist(r_[-1],bs)/20),len(r_)),default=bruns[-1])  # the stretch that arrives at the Magic Kingdom bus station (more of the route is mapped once Hollywood Studios is on)
bus=[R1(q) for q in simplify(brun,.6)] if bus else [[R0[2]+40,bs[1]-6],[bs[0]+30,bs[1]-6],[bs[0],bs[1]]]
print('bus path',len(bus),bus[0],bus[-1],'station',bs)
# Epcot: its outline, its middle, and Spaceship Earth
if EPC:
    PLACES['epcot']=R1(centroid(EPC));out['epcot']=[R1(q) for q in simplify(EPC,.8)]
    se=next((w for w in WAYS.values() if w['t'].get('name')=='Spaceship Earth' and w['ids'][0]==w['ids'][-1]),None)
    if se: PLACES['sse']=R1(centroid(pts(se['ids'])[:-1]))
    wsl=next((w for w in WAYS.values() if 'world showcase lagoon' in w['t'].get('name','').lower()),None)
    if wsl: PLACES['wslagoon']=R1(centroid(pts(wsl['ids'])[:-1]))
    print('epcot places',PLACES.get('epcot'),PLACES.get('sse'),PLACES.get('wslagoon'))
if HSC:  # Hollywood Studios: its outline and its middle, and the Millennium Falcon parked in Galaxy's Edge (its outline)
    PLACES['hs']=R1(centroid(HSC));out['hs']=[R1(q) for q in simplify(HSC,.8)]
    f_=find_named('Millenium Falcon') or find_named('Millennium Falcon',('tourism',))
    if f_ and len(f_[2])>3: out['falcon']=[R1(q) for q in simplify(f_[2],.3)];print('Millennium Falcon outline',len(out['falcon']))
# the Epcot resorts on Crescent Lake: the BoardWalk's outline and the lake (to lay the boardwalk's planks along the shore),
# Stormalong Bay and the Beach/Yacht Club dock (the Yacht Club's lighthouse), for the painted details in map-art.js
if AKC:  # Animal Kingdom: its outline and middle, the Tree of Life and Expedition Everest's mountain (for the painted landmarks)
    PLACES['ak']=R1(centroid(AKC));out['ak']=[R1(q) for q in simplify(AKC,.8)]
    for key,name in {'tol':'Tree of Life','everest':'Expedition Everest: Legend of the Forbidden Mountain','akl':"Disney's Animal Kingdom Lodge-Jambo House",'kidani':"Disney's Animal Kingdom Villas - Kidani Village",'csr':"Disney's Coronado Springs Resort",'blizzard':"Disney's Blizzard Beach",'asports':"Disney's All-Star Sports Resort",'amusic':"Disney's All-Star Music Resort",'amovies':"Disney's All-Star Movies Resort"}.items():
        b_=place(name)
        if b_: PLACES[key]=R1(b_[1])
    # Kilimanjaro Safaris: the one-way truck road through the savannas (its named and unnamed one-way grade1 track pieces), followed
    # in its direction from the loading dock round to where it comes back, for the safari trucks drawn in render.js
    sw_=[w for w in WAYS.values() if w['t'].get('highway')=='track' and w['t'].get('oneway')=='yes' and w['t'].get('tracktype')=='grade1' and inside(centroid(pts(w['ids'])),[(q[0],q[1]) for q in AKC]) ]
    nxt=collections.defaultdict(list)
    for w in sw_:
        for a,b in zip(w['ids'],w['ids'][1:]): nxt[a].append((b,1 if w['t'].get('name')=='Kilimanjaro Safaris' else 0))
    dk=place('Kilimanjaro Safaris')
    if dk and nxt:
        cur=min(nxt,key=lambda i:math.dist(ND[i],dk[1]));route=[cur];seen_=set([cur])
        while True:
            opts=[(b,nm) for b,nm in nxt.get(cur,[]) if b not in seen_]
            if not opts: break
            cur=max(opts,key=lambda o:o[1])[0];route.append(cur);seen_.add(cur)
        sp_=[ND[i] for i in route];print('safari road',len(sp_),'points, length',round(sum(math.dist(a,b) for a,b in zip(sp_,sp_[1:]))),'gap back to start',round(math.dist(sp_[0],sp_[-1])))
        if len(sp_)>10: out['routes']['safari']=[R1(q) for q in simplify(sp_,.4)]
    print('animal kingdom places',{k:PLACES.get(k) for k in('ak','tol','everest','akl','kidani','csr','blizzard')})
CRES={}
if FULL:
    for key,name in {'bw':"Disney's BoardWalk",'lake':'Crescent Lake','storm':'Stormalong Bay','luna':'Luna Park Pool'}.items():
        b_=place(name)
        if b_ and len(b_[2])>3: CRES[key]=[R1(q) for q in simplify(b_[2],.6)];PLACES[key]=R1(b_[1])
    for key,name in {'bydock':'Beach/Yacht Club Dock','bwdock':'Boardwalk Dock','sddock':'Swan/Dolphin Dock'}.items():
        n_=next((ND[i] for i,t in NT.items() if t.get('name')==name),None)
        if n_: PLACES[key]=R1(n_)
    print('crescent lake',{k:len(v) for k,v in CRES.items()},{k:PLACES.get(k) for k in('bydock','bwdock','sddock','storm')})
out['crescent']=CRES
# Disney Springs: its outline (the shopping district's multipolygon), the Aerophile balloon, and Typhoon Lagoon's middle, for labels and the balloon
if 'springs.osm' in SRCS:
    rl=next((x for x in RELS if x['t'].get('name')=='Disney Springs' and x['t'].get('landuse')=='retail'),None)
    rg=rings_from([ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')]) if rl else []
    if rg: o=max(rg,key=len);out['springs']=[R1(q) for q in simplify(o,.8)];PLACES['ds']=R1(centroid(o[:-1] if o[0]==o[-1] else o))
    for key,name in {'dsballoon':'Aerophile','dscoke':'Coca-Cola Store','dsmarket':'Marketplace','dswest':'West Side','dslanding':'The Landing'}.items():
        n_=next((ND[i] for i,t in NT.items() if t.get('name')==name),None) or (lambda b:b and b[1])(find_named(name))
        if n_: PLACES[key]=R1(n_)
    tl=next((w for w in WAYS.values() if w['t'].get('name')=="Disney's Typhoon Lagoon" and w['t'].get('leisure')=='water_park'),None)
    if tl: PLACES['typhoon']=R1(centroid(pts(tl['ids'])[:-1]))
    print('disney springs',len(out.get('springs',[])),{k:PLACES.get(k) for k in('ds','dsballoon','dscoke','dsmarket','dswest','typhoon')})
data_extra={'crescent':out.get('crescent'),'springs':out.get('springs'),'regions':[[round(v) for v in r] for r in REGIONS],'nparks':len(PARKS),'epcot':out.get('epcot'),'hs':out.get('hs'),'ak':out.get('ak'),'dx':DX,'falcon':out.get('falcon'),'lands':LANDS,'mono':MONO,'monoIn':monoIn,'ferryPath':ferry,'launchPath':launch,'boats':BOATS,'busPath':bus,'places':PLACES,'pos':POS,
 'keys':{'epgate':epgate,'hsgate':hsgate,'akgate':akgate,'gate':gate,'townsq':townsq,'mainst':mainst,'hub':hub,**{'land_'+k:v for k,v in landnodes.items()}}}
# compact JS
data={'W':W,'H':H,'S':S,'areas':out['areas'],'buildings':out['buildings'],'lines':out['lines'],'paths':out['paths'],'trees':out['trees'],'lamps':out['lamps'],'routes':out['routes'],'monoLines':out['monoLines'],'nodes':NODES,'edges':EDGES,**data_extra}
js='/* Magic Kingdom resort-area geometry from OpenStreetMap (© OpenStreetMap contributors, ODbL — openstreetmap.org/copyright).\n   Converted to map units (1 unit = '+str(round(1/S,3))+' m), north up. Generated by osm_extract.py. */\nconst OSM='+json.dumps(data,separators=(',',':'))+';\n'
open(OUT,'w').write(js);print('bytes',len(js),'buildings',len(out['buildings']),'areas',collections.Counter(a['k'] for a in out['areas']),'paths',len(paths),'trees',len(out['trees']),'lamps',len(out['lamps']))
print(json.dumps(PLACES));print({k:v['c'] for k,v in POS.items()})
