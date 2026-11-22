"""Make disneyland.html (the Disneyland Resort) from index.html (Walt Disney World): the same page with Disneyland's map data and
its own extra scripts. Run it after changing index.html:  python3 tools/make_disneyland_page.py"""
import os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(root,'index.html')).read()
def R(a,b):
    global s
    assert a in s,a;s=s.replace(a,b)
R("<title>DisneyAtHome</title>","<title>DisneyAtHome · Disneyland</title>")
R(s[s.index('<!-- Walt Disney World. The Disneyland Resort'):s.index('<!-- The scripts, in dependency order')],
  "<!-- The Disneyland Resort: made from index.html by tools/make_disneyland_page.py, so don't edit this file; change index.html. -->\n<script>var RESORT='dl'</script>\n")
R("'js/park-osm.js'","'js/park-osm-dl.js'")
R('/*DL:believe*/',"'js/choreo-believe.js'")
R('/*DL:mapart*/',"'js/map-art-dl.js'")
open(os.path.join(root,'disneyland.html'),'w').write(s)
print('wrote disneyland.html')
