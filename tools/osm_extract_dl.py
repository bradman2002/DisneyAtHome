"""Convert OpenStreetMap data for the Disneyland Resort in Anaheim (Disneyland Park, Disney California Adventure, Downtown
Disney, the Esplanade and the three Disney hotels, with the streets round them) into js/park-osm-dl.js, in the same shape as
js/park-osm.js (made by osm_extract.py for Walt Disney World), so the same simulator, map painter and UI run on it.
Disneyland Park takes Magic Kingdom's place (park 0: Main Street, the hub, the castle, the railroad, the parade route) and
California Adventure takes EPCOT's (park 1).

Input: dl.osm in the site folder (git-ignored). It came from api.openstreetmap.org/api/0.6/map in four pieces covering
bbox 33.7985,-117.9295,33.8175,-117.9095 (south,west,north,east), merged with duplicates dropped.
Run from the site folder:  python3 tools/osm_extract_dl.py"""
import xml.etree.ElementTree as ET, math, json, collections

OUT='js/park-osm-dl.js'
# pinned projection (not the file's bounds), so coordinates stay put when the data is refreshed
S=1.02; OX=40; OY=40
minlon=-117.9295; maxlat=33.8175; cl=math.cos(math.radians(33.808))
def proj(lon,lat): return (OX+(lon-minlon)*cl*111320*S, OY+(maxlat-lat)*111320*S)
W=int(proj(-117.9095,33.8)[0]+40); H=int(proj(-117.92,33.7985)[1]+40)
ND={}; NT={}; WAYS={}; RELS=[]
tags=lambda e:{x.get('k'):x.get('v') for x in e.findall('tag')}
root=ET.parse('dl.osm').getroot()
for n in root.findall('node'):
    ND[n.get('id')]=proj(float(n.get('lon')),float(n.get('lat')))
    t=tags(n)
    if t: NT[n.get('id')]=t
for w in root.findall('way'):
    WAYS[w.get('id')]={'ids':[x.get('ref') for x in w.findall('nd') if x.get('ref') in ND],'t':tags(w)}
for rl in root.findall('relation'):
    RELS.append({'id':rl.get('id'),'t':tags(rl),'m':[(m.get('type'),m.get('ref'),m.get('role')) for m in rl.findall('member')]})
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
    if len(p)<3: return p
    if len(p)>4 and math.dist(p[0],p[-1])<1e-6:
        far=max(range(len(p)),key=lambda i:math.dist(p[0],p[i]))
        return simplify(p[:far+1],tol)[:-1]+simplify(p[far:],tol)
    def rdp(a,b):
        x1,y1=p[a];x2,y2=p[b];L=math.hypot(x2-x1,y2-y1) or 1e-9;best=-1;bi=-1
        for i in range(a+1,b):
            d=abs((x2-x1)*(y1-p[i][1])-(x1-p[i][0])*(y2-y1))/L
            if d>best:best=d;bi=i
        return [a]+(rdp(a,bi)[:-1]+rdp(bi,b) if best>tol else [b])
    keep=rdp(0,len(p)-1);return [p[i] for i in keep]
def join(segs,closed_only=False):
    segs=[s[:] for s in segs if len(s)>1];rings=[]
    while segs:
        cur=segs.pop(0);changed=True
        while (cur[0]!=cur[-1] or not closed_only) and changed:
            changed=False
            for i,s in enumerate(segs):
                if s[0]==cur[-1]: cur+=s[1:];segs.pop(i);changed=True;break
                if s[-1]==cur[-1]: cur+=s[::-1][1:];segs.pop(i);changed=True;break
                if s[-1]==cur[0]: cur=s[:-1]+cur;segs.pop(i);changed=True;break
                if s[0]==cur[0]: cur=s[::-1][:-1]+cur;segs.pop(i);changed=True;break
            if closed_only and cur[0]==cur[-1]: break
        rings.append(cur)
    return rings
def rings_from(way_ids): return [pts(r) for r in join([WAYS[w]['ids'] for w in way_ids if w in WAYS],True)]
def chain(way_ids):
    r=join([WAYS[w]['ids'] for w in way_ids if w in WAYS])
    return pts(max(r,key=len)) if r else []
def rel(name=None,rid=None):
    return next((x for x in RELS if (rid and x['id']==rid) or (name and x['t'].get('name')==name)),None)
def rel_outline(rl):
    rg=rings_from([ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')]) if rl else []
    return max(rg,key=lambda r:abs(area(r))) if rg else None
def rel_chain(rl): return chain(list(dict.fromkeys(ref for ty,ref,role in rl['m'] if ty=='way'))) if rl else []  # some ways are listed twice (the parade route), which would close a loop and cut the chain short
# ---------------- the two parks: their outlines and regions ----------------
DLP=rel_outline(rel(rid='5586855'));DCA=rel_outline(rel(rid='15626312'))
print('Disneyland outline',len(DLP),'California Adventure outline',len(DCA))
def bbox(p,m): xs=[q[0] for q in p];ys=[q[1] for q in p];return (min(xs)-m,min(ys)-m,max(xs)+m,max(ys)+m)
REGIONS=[bbox(DLP,70),bbox(DCA,70),(0,0,W,H)]
PARKS=REGIONS[:2]
def inreg(x,y,m=0): return 0-m<=x<=W+m and 0-m<=y<=H+m
def clip_box(p,m=60): return any(inreg(x,y,m) for x,y in p)
def runs(p,m=30):
    out_=[[]]
    for q in p:
        if inreg(q[0],q[1],m): out_[-1].append(q)
        elif out_[-1]: out_.append([])
    return [r for r in out_ if len(r)>=2]
out=collections.defaultdict(list)
# ---------------- areas & buildings ----------------
AREA_KIND=lambda t:('water' if t.get('natural')=='water' or t.get('water') or t.get('leisure')=='swimming_pool' else 'forest' if t.get('landuse')=='forest' or t.get('natural')=='wood' else
 'grass' if t.get('landuse') in('grass','meadow','village_green','vineyard') or t.get('leisure') in('park','pitch') else 'garden' if t.get('leisure')=='garden' else
 'sand' if t.get('natural') in('sand','beach','shingle') else 'rock' if t.get('natural') in('bare_rock','cliff') else 'scrub' if t.get('natural')=='scrub' else
 'parking' if t.get('amenity') in('parking',) else 'construction' if t.get('landuse')=='construction' else 'ped' if (t.get('highway') in('pedestrian','footway','living_street') and t.get('area')=='yes') or t.get('area:highway') in('pedestrian','footway') or t.get('place')=='square' else None)
# OpenStreetMap's heights here are mostly missing or only the queue roofs', so the landmarks are set here, in metres
HEIGHTS={'Sleeping Beauty Castle':23,'Matterhorn Bobsleds':44,'Space Mountain':36,'Big Thunder Mountain Railroad':20,'Grizzly Peak':34,
 'Guardians of the Galaxy: Mission Breakout':56,"Disney's Grand Californian Hotel":30,'Pixar Place Hotel':55,'Star Wars: Rise of the Resistance':18,
 "Mickey and Minnie's Runaway Railway":14,'Indiana Jones Adventure':14,'Haunted Mansion':14,'The Haunted Mansion':14}
def bheight(t):
    if t.get('name') in HEIGHTS: return HEIGHTS[t['name']]
    for k in('height',):
        if k in t:
            try: return float(t[k].split(';')[0].split()[0])
            except: pass
    if 'building:levels' in t:
        try: return float(t['building:levels'].split(';')[0])*4
        except: pass
    b=t.get('building')
    if b=='roof': return 4
    if b=='tent': return 7
    if b in('shed','garages'): return 4
    if b=='parking': return 16
    if b=='train_station': return 11
    if t.get('tourism')=='attraction' or t.get('attraction'): return 14
    return 9
for wid,w in WAYS.items():
    t=w['t'];ids=w['ids']
    if len(ids)<3: continue
    p=pts(ids)
    if not clip_box(p): continue
    closed=ids[0]==ids[-1]
    if 'building' in t and closed:
        if t.get('layer','0').startswith('-') or t.get('location')=='underground': continue
        out['buildings'].append({'p':[R1(q) for q in simplify(p[:-1],.25)],'h':bheight(t),'k':t.get('building'),'n':t.get('name',''),
          'a':t.get('attraction') or ('attraction' if t.get('tourism')=='attraction' else ''),'c':t.get('roof:colour') or t.get('building:colour') or ''})
        continue
    k=AREA_KIND(t)
    if k and closed: out['areas'].append({'k':k,'o':[R1(q) for q in simplify(p[:-1],.3)],'i':[]})
for rl in RELS:
    t=rl['t']
    if t.get('type')!='multipolygon': continue
    outer=[ref for ty,ref,role in rl['m'] if ty=='way' and role in('outer','')];inner=[ref for ty,ref,role in rl['m'] if ty=='way' and role=='inner']
    ro=rings_from(outer);ri=rings_from(inner)
    if 'building' in t:
        for o in ro:
            if clip_box(o): out['buildings'].append({'p':[R1(q) for q in simplify(o[:-1] if o[0]==o[-1] else o,.25)],'h':bheight(t),'k':t.get('building'),'n':t.get('name',''),'a':'','c':''})
        continue
    k=AREA_KIND(t)
    if not k:
        for ref in outer:
            if ref in WAYS: k=AREA_KIND(WAYS[ref]['t']) or k
    if not k: continue
    for o in ro:
        if not clip_box(o): continue
        ins=[[R1(q) for q in simplify(i,.3)] for i in ri if inside(i[0],o)]
        out['areas'].append({'k':k,'o':[R1(q) for q in simplify(o,.3)],'i':ins,'n':t.get('name','')})
# ---------------- lines ----------------
LINES=collections.defaultdict(list)
ROAD={'motorway':1,'trunk':1,'primary':1,'secondary':1,'motorway_link':2,'secondary_link':2,'primary_link':2,'tertiary':2,'tertiary_link':2,'unclassified':2,'residential':2,'service':3}
for wid,w in WAYS.items():
    t=w['t'];p=pts(w['ids'])
    if len(p)<2 or not clip_box(p): continue
    rw=t.get('railway');hw=t.get('highway');wwy=t.get('waterway')
    if rw=='narrow_gauge': LINES['rail'].append(p)
    elif rw=='monorail': LINES['mono'].append(p)
    elif hw in ROAD and t.get('tunnel')!='yes' and t.get('covered')!='yes' and t.get('area')!='yes' and t.get('service') not in('parking_aisle','driveway') and not t.get('layer','0').startswith('-'):
        LINES['road'+str(ROAD[hw])].append(p)
    elif rw=='tram': LINES['tram'].append(p)
    elif hw=='raceway': LINES['race'].append(p)
    elif wwy in('canal','stream','river','ditch'): LINES['stream'].append(p)
    elif t.get('man_made') in('bridge','pier') and w['ids'][0]==w['ids'][-1]: out['areas'].append({'k':'pier' if t.get('man_made')=='pier' else 'bridge','o':[R1(q) for q in p[:-1]],'i':[]})
    elif t.get('man_made')=='pier': LINES['pier'].append(p)
    elif t.get('barrier') in('hedge',): LINES['hedge'].append(p)
for k,v in LINES.items(): out['lines'].append({'k':k,'p':[[R1(q) for q in simplify(r_,.3)] for l in v for r_ in runs(l)]})
# ---------------- walkways (art) + guest graph ----------------
WALK={'footway':4.0,'pedestrian':9.0,'living_street':13.0,'path':3.0,'steps':3.5}
ESPL=next(pts(w['ids']) for w in WAYS.values() if w['t'].get('name')=='Disneyland Resort Esplanade')
print('esplanade outline',len(ESPL))
def in_park(q): return inside(q,DLP) or inside(q,DCA) or inside(q,ESPL)
paths=[];G=collections.defaultdict(set)
for wid,w in WAYS.items():
    t=w['t'];hw=t.get('highway')
    if hw not in WALK: continue
    if t.get('indoor')=='yes' or t.get('level','0').startswith('-') or t.get('tunnel')=='yes' and hw!='footway': continue
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
print('walk graph',len(G),'nodes; components',[len(c) for c in comps[:8]])
# join stray pieces inside the parks to the network at their closest point, when they're within a short step
left=[c_ for c_ in comps[1:] if len(c_)>=8];grew=True;mainl=list(main)
while grew:
    grew=False
    for c_ in left[:]:
        best=min(((math.dist(ND[a],ND[b]),a,b) for a in c_[::2] for b in mainl[::3]),default=None)
        if best and best[0]<25: G[best[1]].add(best[2]);G[best[2]].add(best[1]);main|=set(c_);mainl+=c_;left.remove(c_);grew=True;print('  joined a piece of',len(c_),'nodes, gap',round(best[0],1))
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
out['nodes']=NODES;out['edges']=EDGES
out['trees']=[R1(ND[i]) for i,t in NT.items() if t.get('natural')=='tree']
out['lamps']=[R1(ND[i]) for i,t in NT.items() if t.get('highway')=='street_lamp']
# ---------------- named places ----------------
def find_named(name,pref=('attraction','tourism','amenity','shop','building')):
    best=None
    for wid,w in WAYS.items():
        if w['t'].get('name')==name and len(w['ids'])>1:
            p=pts(w['ids']);c=centroid(p[:-1]) if w['ids'][0]==w['ids'][-1] and len(p)>3 else (sum(q[0] for q in p)/len(p),sum(q[1] for q in p)/len(p))
            sc=(2 if any(k in w['t'] for k in pref) else 1)+(1 if w['ids'][0]==w['ids'][-1] else 0)
            if not best or sc>best[0]: best=(sc,c,p)
    if not best:
        for i,t in NT.items():
            if t.get('name')==name: c=ND[i];best=(1,c,[c]);break
    if not best:
        rl=rel(name);o=rel_outline(rl) if rl else None
        if o: best=(1,centroid(o[:-1] if o[0]==o[-1] else o),o)
    return best
def place(name):
    b=find_named(name)
    if not b: print('  MISSING',name)
    return b
nearest=lambda q:min(range(len(NODES)),key=lambda i:math.dist(NODES[i],q))
PLACES={}
for key,name in {'castle':'Sleeping Beauty Castle','hub':'Partners','townsq':'Town Square','station':'Main Street Station','flagpole':'Town Square Flag Pole',
  'ms':'Main Street U.S.A.','adv':'Adventureland','fr':'Frontierland','fan':'Fantasyland','tom':'Tomorrowland','espl':'Disneyland Resort Esplanade',
  'dlmono':'Tomorrowland Monorail Station','ddmono':'Downtown Disney Monorail Station','dd':'Downtown Disney','fmic':'Fantasmic!','woc':'World of Color - One',
  'dlh':'The Disneyland Hotel','gch':"Disney's Grand Californian Hotel",'pph':'Pixar Place Hotel','matterhorn':'Matterhorn Bobsleds','grizzly':'Grizzly Peak',
  'rivers':'Rivers of America','fowler':"Fowler's Harbor",'pbay':'Paradise Bay','palaround':'Pixar Pal-A-Round'}.items():
    b=place(name)
    if b: PLACES[key]=R1(b[1])
# Main Street: the middle of the street, between Town Square and the hub
if 'townsq' in PLACES and 'hub' in PLACES:
    a,b=PLACES['townsq'],PLACES['hub'];PLACES['mainst']=R1(((a[0]+b[0])/2,(a[1]+b[1])/2))
# the castle's forecourt stage: just in front of (south of) the castle, toward the hub
c_,h_=PLACES['castle'],PLACES['hub'];PLACES['stage']=R1((c_[0]+(h_[0]-c_[0])*.45,c_[1]+(h_[1]-c_[1])*.45))
# the gates: where each park's outline comes nearest the middle of the Esplanade, a little way in toward the park's middle
ec=centroid(ESPL);KEYS={}
for key,poly,out_k in (('gate',DLP,'dlout'),('epgate',DCA,'dcaout')):
    pc=centroid(poly);e_=min(poly,key=lambda q:math.dist(q,ec));d_=math.dist(e_,pc) or 1;ux,uy=(pc[0]-e_[0])/d_,(pc[1]-e_[1])/d_
    KEYS[key]=nearest((e_[0]+ux*22,e_[1]+uy*22));PLACES[out_k]=[round(-ux,3),round(-uy,3)];PLACES[key+'xy']=R1(e_)
    print(key,'node',KEYS[key],NODES[KEYS[key]],'outward',PLACES[out_k])
# the Magic Kingdom code meets arriving guests at its monorail, ferry and bus stops: here they all arrive on the Esplanade
for k in('monostation','busstation'): PLACES[k]=R1(((ec[0]+PLACES['gatexy'][0])/2,(ec[1]+PLACES['gatexy'][1])/2))
KEYS['townsq']=nearest(PLACES['townsq']);KEYS['mainst']=nearest(PLACES['mainst']);KEYS['hub']=nearest(PLACES['hub'])
# ---------------- attractions and venues (OpenStreetMap names) ----------------
ATTR=['Jungle Cruise','Indiana Jones Adventure','Pirates of the Caribbean',"Walt Disney's Enchanted Tiki Room",'Adventureland Treehouse',
 'The Haunted Mansion',"Tiana's Bayou Adventure","Davy Crockett's Explorer Canoes",'The Many Adventures of Winnie the Pooh','Big Thunder Mountain Railroad','Mark Twain Riverboat','Sailing Ship Columbia',
 'Star Wars: Rise of the Resistance','Millennium Falcon: Smuggler’s Run',
 "Peter Pan's Flight","Mr. Toad's Wild Ride","Snow White's Enchanted Wish","Pinocchio's Daring Journey",'Alice in Wonderland','Mad Tea Party','King Arthur Carrousel','Dumbo the Flying Elephant',
 'Casey Jr. Circus Train','Storybook Land Canal Boats','"It\'s a Small World"','Matterhorn Bobsleds','Sleeping Beauty Castle Walkthrough',
 "Mickey and Minnie's Runaway Railway","Roger Rabbit's Car Toon Spin","Chip ‘n’ Dale’s GADGETcoaster","Mickey's House","Minnie's House",
 'Space Mountain','Star Tours: The Adventures Continue','Buzz Lightyear Astro Blasters','Autopia','Astro Orbitor','Finding Nemo Submarine Voyage',
 # California Adventure
 'Guardians of the Galaxy: Mission Breakout','WEB SLINGERS: A Spider-Man Adventure','Monsters, Inc. Mike & Sulley to the Rescue!','Radiator Springs Racers',"Mater's Junkyard Jamboree","Luigi's Rollickin' Roadsters",
 'Incredicoaster','Toy Story Midway Mania!','Pixar Pal-A-Round',"Jessie’s Critter Carousel",'Inside Out: Emotional Whirlwind',"Jumpin' Jellyfish",
 'Little Mermaid: Ariel\'s Undersea Adventure','Golden Zephyr','Silly Symphony Swings',"Goofy's Sky School",'Grizzly River Run',"Soarin' Around the World",'Redwood Creek Challenge Trail',
 'The Bakery Tour','Animation Academy','Hyperion Theater']
VEN=['Plaza Inn','Carnation Café','Blue Bayou','Café Orléans','Hungry Bear Barbecue Jamboree','Red Rose Taverne','Tomorrowland Terrace',"Galactic Grill","Docking Bay 7 Food and Cargo","Oga's Cantina",'The Golden Horseshoe','Refreshment Corner','Jolly Holiday Bakery Café','Bengal Barbecue','Tiana’s Palace','The Gibson Girl Ice Cream Parlor',
 'Emporium','Main Street Magic Shop',
 'Carthay Circle Restaurant','Smokejumpers Grill','Lamplight Lounge','Pym Test Kitchen','Flo\'s V8 Café','Cozy Cone Motel','Fiddler, Fifer, & Practical Café','Pacific Wharf Café','Award Wieners','Paradise Garden Grill','Wine Country Trattoria','Aunt Cass Café','Elias & Co.']
POS={};ATTR_OK=[];VEN_OK=[]
PLACE_ALIAS={'Mark Twain Riverboat':'Frontierland Landing','Sailing Ship Columbia':'Frontierland Landing'}  # the boats are routes on the river; they board at the landing
for n in ATTR+VEN:
    b=place(PLACE_ALIAS.get(n,n))
    if not b: continue
    c=b[1];poly=b[2]
    best=min(range(len(NODES)),key=lambda i:min(math.dist(NODES[i],q) for q in poly[::max(1,len(poly)//24)]+[c]))
    POS[n]={'c':R1(c),'nd':best};(ATTR_OK if n in ATTR else VEN_OK).append(n)
# ---------------- lands (place=locality outlines) ----------------
LANDNAMES={'Main Street U.S.A.':'ms','Adventureland':'adv','New Orleans Square':'nos','Frontierland':'fr','Bayou Country':'bc','Fantasyland':'fan',"Mickey's Toontown":'tt',
 'Tomorrowland':'tom','Star Wars: Galaxy’s Edge':'gx',
 'Buena Vista Street':'bv','Hollywood Land':'hl','Avengers Campus':'av','Cars Land':'cl','Pixar Pier':'pp','Paradise Gardens Park':'pg','San Fransokyo Square':'sf','Grizzly Peak Airfield':'gp'}
LANDS={}
for wid,w in WAYS.items():
    t=w['t'];k=LANDNAMES.get(t.get('name'))
    if t.get('place') in('locality','neighbourhood','quarter') and k and w['ids'][0]==w['ids'][-1] and len(w['ids'])>3:
        p=pts(w['ids'])[:-1]
        if k not in LANDS or abs(area(p))>abs(area(LANDS[k])): LANDS[k]=p
for rl in RELS:
    t=rl['t'];k=LANDNAMES.get(t.get('name'))
    if t.get('place') and k and k not in LANDS:
        o=rel_outline(rl)
        if o: LANDS[k]=o
LANDS={k:[R1(q) for q in simplify(v,1)] for k,v in LANDS.items()}
print('land polygons',sorted(LANDS))
# ---------------- routes ----------------
rr_=rel_chain(rel(rid='1796774'));print('railroad',len(rr_),'pts, closing gap',round(math.dist(rr_[0],rr_[-1]),1) if rr_ else None)
pr_=[c for c in (rel_chain(rel(rid=i)) for i in('14713303','14713304')) if c]
pr_dl=max([c for c in pr_ if sum(inside(q,DLP) for q in c)>len(c)*.6],key=len,default=[])
pr_dca=max([c for c in pr_ if sum(inside(q,DCA) for q in c)>len(c)*.6],key=len,default=[])
print('parade routes',[len(c) for c in pr_],'disneyland',len(pr_dl),'california adventure',len(pr_dca))
mono_=rel_chain(rel(rid='1721168'))
tram_=rel_chain(rel(rid='1784170'))
rv_=rel_chain(rel(rid='16491364'));col_=rel_chain(rel(rid='16491365'))
out['routes']={'rail':[R1(q) for q in simplify(rr_,.4)],'parade':[R1(q) for q in simplify(pr_dl,.5)],'parade2':[R1(q) for q in simplify(pr_dca,.5)],
 'tram':[R1(q) for q in simplify(tram_,.4)],'pm':[],'race':[],'ferry':[],'launch':[],
 'riverboat':[R1(q) for q in simplify(rv_,.4)],'columbia':[R1(q) for q in simplify(col_,.4)],'dlmono':[R1(q) for q in simplify(mono_,.4)]}
for k,v in out['routes'].items(): print('route',k,len(v),'pts')
out['monoLines']=[[R1(q) for q in simplify(p,.5)] for p in LINES['mono']]
for k,v in KEYS.items(): print('key',k,v)
data={'W':W,'H':H,'S':S,'resort':'dl','areas':out['areas'],'buildings':out['buildings'],'lines':out['lines'],'paths':out['paths'],'trees':out['trees'],'lamps':out['lamps'],
 'routes':out['routes'],'monoLines':out['monoLines'],'nodes':NODES,'edges':EDGES,'skyliner':None,'crescent':{},'springs':None,
 'regions':[[round(v) for v in r] for r in REGIONS],'nparks':2,'dlp':[R1(q) for q in simplify(DLP,.8)],'dca':[R1(q) for q in simplify(DCA,.8)],'espl':[R1(q) for q in simplify(ESPL,.8)],
 'dx':0,'lands':LANDS,'mono':{},'monoIn':None,'ferryPath':[],'launchPath':[],'boats':{},'busPath':[],'places':PLACES,'pos':POS,'attr':ATTR_OK,'ven':VEN_OK,
 'keys':{'gate':KEYS['gate'],'epgate':KEYS['epgate'],'hsgate':None,'akgate':None,'townsq':KEYS['townsq'],'mainst':KEYS['mainst'],'hub':KEYS['hub']}}
js='/* Disneyland Resort geometry from OpenStreetMap (© OpenStreetMap contributors, ODbL — openstreetmap.org/copyright).\n   Converted to map units (1 unit = '+str(round(1/S,3))+' m), north up. Generated by osm_extract_dl.py. */\nconst OSM='+json.dumps(data,separators=(',',':'))+';\n'
open(OUT,'w').write(js)
print('map',W,'x',H,'bytes',len(js),'buildings',len(out['buildings']),'areas',collections.Counter(a['k'] for a in out['areas']),'paths',len(paths),'trees',len(out['trees']),'lamps',len(out['lamps']))
print(json.dumps(PLACES))
