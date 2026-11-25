"""Drop repeated points from the map data (js/park-osm.js, js/park-osm-dl.js).

The extractors clip shapes to the map, which leaves long runs of the same point (about 4 in 10 of all points at Walt
Disney World). They change nothing on screen but make the file bigger, slower to download and parse, and slower to
paint. Only outlines and lines are touched (areas, buildings, lines, paths, lands, the park outlines): never 'nodes'
(the walking graph, looked up by index) or anything else whose points are counted. Run after an extractor:
    python3 tools/dedupe_points.py js/park-osm.js js/park-osm-dl.js
"""
import json, sys

def dd(pts):
    if not isinstance(pts, list) or len(pts) < 3: return pts
    out = [pts[0]]
    for p in pts[1:]:
        if p != out[-1]: out.append(p)
    if len(out) > 2 and out[-1] == out[0] and pts[-1] != pts[0]: out.pop()
    return out if len(out) >= 3 else pts

for fn in sys.argv[1:]:
    s = open(fn).read(); i = s.find('{'); j = s.rfind('}')
    o = json.loads(s[i:j + 1]); before = len(s)
    for a in o.get('areas', []):
        a['o'] = dd(a['o'])
        if a.get('i'): a['i'] = [dd(h) for h in a['i']]
    for q in o.get('buildings', []): q['p'] = dd(q['p'])
    for l in o.get('lines', []): l['p'] = [dd(p) for p in l['p']]
    for p in o.get('paths', []): p['p'] = dd(p['p'])
    for k, v in o.get('lands', {}).items():
        if isinstance(v, list) and v and isinstance(v[0], list) and len(v[0]) == 2: o['lands'][k] = dd(v)
    for k in ('epcot', 'hs', 'ak', 'dca', 'crescent', 'springs'):
        v = o.get(k)
        if isinstance(v, list) and v and isinstance(v[0], list) and len(v[0]) == 2 and isinstance(v[0][0], (int, float)): o[k] = dd(v)
    out = s[:i] + json.dumps(o, separators=(',', ':'), ensure_ascii=False) + s[j + 1:]
    open(fn, 'w').write(out)
    print(fn, before, '->', len(out))
