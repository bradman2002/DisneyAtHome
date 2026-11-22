"""Make disneyland.html (the Disneyland Resort) from index.html (Walt Disney World): the same page with Disneyland's map data and
its own extra scripts. Run it after changing index.html:  python3 tools/make_disneyland_page.py"""
import os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(root,'index.html')).read()
def R(a,b):
    global s
    assert a in s,a;s=s.replace(a,b)
R("<title>DisneyAtHome</title>","<title>DisneyAtHome · Disneyland</title>")
R(s[s.index('<!-- Walt Disney World. The Disneyland Resort'):s.index('<script src="js/park-osm.js"></script>')],
  "<!-- The Disneyland Resort: made from index.html by tools/make_disneyland_page.py, so don't edit this file; change index.html. -->\n<script>var RESORT='dl'</script>\n")
R('<script src="js/park-osm.js"></script>','<script src="js/park-osm-dl.js"></script>')
R('<!--DL:believe-->','<script src="js/choreo-believe.js"></script>')
R('<!--DL:mapart-->','<script src="js/map-art-dl.js"></script>')
open(os.path.join(root,'disneyland.html'),'w').write(s)
print('wrote disneyland.html')
