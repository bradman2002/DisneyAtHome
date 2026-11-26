# DisneyAtHome — project brief

A personal website: an illustrated, simulated Walt Disney World Magic Kingdom (plus EPCOT and Hollywood Studios), plus the resort area around
Seven Seas Lagoon and Bay Lake (the monorail loop, the Transportation and Ticket Center, the Contemporary,
Polynesian Village and Grand Floridian, Wilderness Lodge, Discovery Island and the Fort Wilderness marina), that runs live at any time of day. Aerial map (default) plus a street-level
Main Street view; guests, rides, wait times, transport (six monorails on the Express and Resort loops,
ferries, resort launches, buses),
day/night lighting, the Festival of Fantasy parade, the seasonal evening parades (Boo to You for
Halloween, Once Upon a Christmastime for Christmas) and the Happily Ever After fireworks, all synced to the owner's soundtracks. With "Live" on (the default when the data loads) the clock follows real Orlando time
and wait times, closures, show times and park hours are real; guests, crowds and vehicles are always simulated.
The end goal is a background display: TV mode runs the whole thing unattended on a screen.

## How to run and test
- Static site, no build step. Plain classic `<script>` files sharing globals (no modules), so it also
  opens from disk — but sounds only load over HTTP.
- For the TV: `Start TV.command` serves the site and opens Chrome in kiosk mode at `/?tv` (own profile in
  `~/Library/Application Support/MagicKingdomTV`, autoplay allowed, second screen if present, `caffeinate`).
- Windows: `Start Simulator.bat` / `Start TV.bat` run `tools/serve.ps1` (a PowerShell HttpListener static server with
  no-cache and Range support; `-Tv` opens Edge or Chrome in kiosk mode with its own profile and keeps the display
  awake). Not yet tested on a real Windows PC.
- Run locally: double-click `Start Simulator.command` (Mac; a no-cache Python server, picks a free port
  from 8000) or `python3 -m http.server 8000` and open http://localhost:8000.
- Always test changes in a real browser (map renders, no console errors, ~60 fps). Check day (12:00),
  night (21:10 during the fireworks), a parade (12:00 or 15:00), the Main Street view, a phone-sized
  window (390×844), and the whole resort area zoomed all the way out (monorails stopping at all five stations).
- Use a no-cache server while editing (`Start Simulator.command` is one); plain `python3 -m http.server` lets the
  browser keep stale .js files.
- These files pack many statements onto one long line. Never add a `//` comment in the middle of such a line: it
  silently comments out everything after it (this has broken the speed button and guest arrivals). Use `/* */`,
  or put the comment on its own line.
- Scripts are listed in `BOOT_JS` in index.html and added (async=false, in order) only after the loading screen `#boot` has
  been drawn (plain script tags held back the first picture); disneyland.html is regenerated from it. Load order matters: park-osm → sim → audio → choreo → choreo-minnie → map-art → street → characters → parade → pageant → live → render → ui → tv (choreo-luminous, luminous, choreo-fantasmic, fantasmic and worldofcolor load just before live).

## Files
- `js/park-osm.js` — GENERATED geometry for the park and resort area from OpenStreetMap (buildings, walkways,
  roads, water, gardens, trees, lamps, routes, the two monorail loops, stations, walk graph, named positions).
  Regenerate with `tools/osm_extract.py` from a fresh `map.osm` (Overpass API query at the top of that
  script; `map.osm` is git-ignored); never hand-edit.
- `js/sim.js` — park data (attractions/venues reference OSM names), walk-graph routing (Dijkstra per
  destination, cached), guests, queues, breakdowns, transport (`MLINE` = the monorail lines, `MONO` = trains,
  `RESORTS` = the five stations, `monoEta()`), events, `seek()`/`SEEKGEN`.
- `js/audio.js` — ambience engine; real recordings loaded from `audio/*.m4a`, loop points in `LOOP_POINTS`. Also the
  area music (`AREA`, `areaTick`): one looping HTML audio element per land, mixed by the camera's distance to each
  land (the hub counts as Main Street), ducked under show music, volume `AU.v.music`.
  Always set a music player's level with `setVol(a,v)`, never `a.volume`: iPhones ignore `volume`, so `setVol`
  routes the player through a Web Audio gain node.
- Ride audio uses ONE shared audio element (`RA.one`), unlocked on the first tap (`unlockRide`, called from `soundKick`
  and `tvStart`), because iPhones only allow players started from a tap. Only one ride plays at a time.
- Ride audio (`RIDEAUD`, `rideTick` in `audio.js`): `audio/ride-<key>.mp3` fades in when the camera is zoomed in close to
  that ride (TV mode has shots for them) or its sheet is open, only while it runs; area music steps aside via
  `rideLevel`. Files are the owner's copies, git-ignored like the other Disney audio. `ride-monorail.mp3` is the monorail's
  onboard audio: it plays while TV mode follows a train, a train's card is open, or the mouse hovers one (`MONOHOVER`).
- `js/choreo.js` — Happily Ever After fireworks cues derived offline from that soundtrack (`var CHOREO`).
- `js/choreo-minnie.js` — GENERATED cues for Minnie's Wonderful Christmastime Fireworks (`CHOREO_MINNIE`), made by
  `tools/fireworks_from_audio.py` from the soundtrack (decode with `afconvert` first; pure Python, no numpy). The
  engine switches shows with `fwSet()`/`fwAuto()` in `street.js` (`FW`): automatic = Minnie's when the live data lists
  it tonight (party nights), otherwise Happily Ever After; Entertainment can force either. Never switches mid-show.
  Tinker Bell only flies in Happily Ever After.
- `js/map-art.js` — paints the aerial map from OSM data into cached canvases, painterly style. `paintMap()`
  paints any rectangle at any resolution: `MAP.base`/`MAP.glow` cover the whole map at a modest resolution,
  and `MAP.detail` holds sharper layers for the park and each monorail stop, painted just after start-up and
  drawn when zoomed in. Castle image placement; drawn-castle fallback (`castleArt`); the Contemporary's
  A-frame (`aframe`).
- `js/street.js` — Main Street street view (buildings are the real ones, listed in `STREET_BLDG`: Emporium to
  Casey's Corner on the west side, Confectionery to the Plaza Restaurant on the east; its castle is `images/castle.png`, the same illustration as
  the map), fireworks engine (`HEA`), shared soundtrack helpers
  (`loadTrack`, `syncTrack`, IndexedDB fallback for picked files).
- `js/characters.js` — `drawChar()`: small drawn figures of the characters in the parades (Mickey and friends,
  princesses, Peter Pan, Pooh, villains), with optional costumes (Santa hat, witch's hat, cape). `CHARS` lists them.
- `js/parade.js` — the parades (`PARADES`: Festival of Fantasy, Halloween, Christmas), their line-ups, float
  artwork (both views) and per-parade soundtrack sync (`P.a`; `PAR` is Festival of Fantasy's). A new parade is a
  `PARADES` entry, a line-up, an event in `sim.js` with the same id, and an `EVPOS` entry in `audio.js`.
- `js/pageant.js` — the Electrical Water Pageant: the barges' course (A* over the real water), timetable
  (`EWP_KEYS`), light figures, drawing and soundtrack (`EWP`). It is a pure function of the clock (`ewpState(T)`),
  not an `EV` event, so no park guests gather for it.
- `js/live.js` — live data from the ThemeParks.wiki API (`LIVE`, refreshed every 5 minutes): matches rides by name,
  sets `a.live`, today's show times on the `EV` events and park hours via `setHours()`; `liveTick()` keeps `T` on
  the real park time. `LIVENOW` (in `sim.js`) says whether live numbers apply this instant. Any manual time
  change calls `liveUnfollow()` (through a wrapper around `seek`).
- `js/tv.js` — TV mode (`TV`): the shot list, the director (`tvNext`, `tvTick`), the on-screen board, the
  after-hours replay, screen wake lock. `?tv` in the address starts it.
- `js/render.js` — per-frame drawing for the aerial view (live elements, night tint, projections,
  fireworks, wait-time callouts/pins).
- `js/ui.js` — app shell: top bar, sheets, bottom nav, time controls, input, boot.
- `images/castle.png` — castle illustration (owner's Gemini image, checkerboard removed).
- `audio/` — 30 credited real-recording effects (.m4a) plus the owner's soundtracks (see below).

## Decisions already made (keep them unless the owner says otherwise)
- Layout comes from OpenStreetMap, not hand placement. Earlier hand-made layouts were wrong; the owner
  cared most about accuracy. Rivers of America is drawn as the current construction site ("Piston Peak",
  per the OSM data) — that is correct, not a bug.
- The map covers the monorail loop and Bay Lake (W×H = 3090×2290 map units; the east edge is just past the Fort
  Wilderness marina). Boat routes are `BOATR` in `sim.js`, from `OSM.boats`. Guests are simulated
  inside the park only; the resorts, roads and lagoon are scenery with working transport. Map coordinates are
  pinned to a fixed corner in `osm_extract.py`, so they don't shift when the data is refreshed. Zoom 1 still
  means "the park fills the screen"; zoom goes below 1 to show the whole area.
- Epcot (owner, 16 Nov 2026: "For now just the park. Just add in a blank space between magic kingdom for now, we
  will fill that in later"). `epcot.osm` (git-ignored, bbox in the extractor) is merged in; the map now has two
  filled regions, `OSM.regions` = [Magic Kingdom area (= `MKR`), Epcot (= `EPR`)], at their real positions, and
  W×H grew to 4847×6577. Each
  region is its own base/glow layer (`MAP.layers`) at the old sharpness, plus an Epcot close-up layer. Epcot is
  simulated too (owner, 16 Nov 2026: "Add guests and wait times to Epcot"): guests and rides carry a park `pk` (0 MK,
  1 EPCOT; lands wc/wd/wn/ws via `parkOf`), EPCOT has its own hours `EOPEN/ECLOSE` (`setHoursEP`), gate `EPGATE`, arrivals
  (`spE`, `EPATT` × MK attendance), `decideEP`, its own `PAVE` mask, and its walkways are in the same graph (a separate
  component, from the extractor). Live data fetches EPCOT's feed too (`LIVE.epApi`, names via `LIVE_ALIAS`); shows,
  parades and transport stay Magic Kingdom only, except Luminous (`js/luminous.js`, event `lum` with `pk:1`, at
  `rel:['eclose',0]`; cues `CHOREO_LUM` in `js/choreo-luminous.js` from `tools/fireworks_from_audio.py <wav> <out> CHOREO_LUM`;
  owner's audio `audio/luminous.mp3`, git-ignored). Its shells go through the shared fireworks engine (`HEA.rk`); it
  only drives the clock when Happily Ever After isn't playing; each show's volume follows where the map is looking
  (`lumNear`). Art: `EPCOT` in `map-art.js` has the pavilion anchors and styles
  (`ep_*` in `LANDSTYLE`), Spaceship Earth is drawn as a sphere, Mexico gets its pyramid (`mexicoPyramid`: lined up with the building's angled footprint by its main axis, staircase toward the lagoon, temple on top; owner, 16 Nov 2026: "The mexico pavilion looks weird"). TV mode visits Epcot
  (three shots) and cuts, rather than glides, between the parks. Tree/shadow masks are kept at reduced scale `HS`.
  The land between was filled in (owner, 16 Nov 2026: "Fill in the space between epcot and magic kingdom now"): `gap.osm`
  (git-ignored, bbox in the extractor) adds a third region = the whole map, so nothing is clipped; outside the parks
  shapes are simplified 3× coarser. In `map-art.js` (`FULL`, `PARKR`) the two park layers stay as they were (their
  edges faded into the land around them), the rest is `MAP.tiles` (1100-unit tiles at 0.6× sharpness, painted when in
  view and freed after 90 s, via `detailTick`), and forests outside the parks are a canopy pattern (`canopy()`), not
  individual crowns (the park's crowns thin out over it near the edges). Map data ~3.5 MB; startup canvases ~144 MB.
  The EPCOT monorail is `MLINE.epcot` (stops `ttc`, `epst`; from the 'Epcot Monorail' relation, run so the loop over
  Future World comes on the way in); its loads are scenery only, EPCOT's guests still start at its gate.
  The Crescent Lake resorts (owner, 16 Nov 2026: "Make swan and dolphin, beach and yacht club, and boardwalk look more
  correct"): `CRES`/`cresOf` in `map-art.js` give their buildings the real colours (`yc`, `bc`, `bcv`, `bwi`, `bwv`, `dol`, `swan`,
  `swr` in `LANDSTYLE`; clapboard trim or Graves wave bands via `extrude`'s `deco` hook); `dolphinResort`/`dolphinTower`, `swanResort`/`swanCentre` (with the
  statues; owner, 18 Nov 2026, compared with the Disney app: OSM has no heights for either hotel, so their parts are placed by hand
  from the footprint's bbox corner: the Swan is a low podium, two 7-storey wings and the 12-storey centre block along its NE–SW axis
  with its curved roofline; the Dolphin, from the owner's photo: a long 12-storey coral NE–SW block, the great turquoise pyramid
  (`dolphinPyramid`: square-window grid, dark glass panel) on its lake side, lower wings ending in round turquoise towers with
  shell basins (`dolphinTowerEnd`; dolphins on the outer two), and the tiered `shellFountain` in the driveway circle's pool, found at run time as the nearest small water area), `lighthouse`, `shipwreck` and `coasterSlide` are drawn by name; the boardwalk's planks are walkways inside the
  BoardWalk outline near the lake (`onBoardwalk`). The extractor exports `OSM.crescent` (BoardWalk outline, lake, pools) and
  dock places, sets their heights in `HEIGHTS`, and the map now runs to H=6730 so the Swan and Swan Reserve fit whole.
  Map tiles overlap by 3 units so no seam shows between them. Art that clips (`c.save();…clip()`) must `c.restore()`: a
  missed restore hides everything painted after it in that tile.
  The Land (owner, 16 Nov 2026: "make the land pavilion look correct") is `landPavilion` in `map-art.js`: sandstone walls in
  earth-tone strata bands (`strataDeco`), a hipped glass roof over the atrium and a glass entrance (`glassHall`), the round
  greenhouse dome and the Living with the Land greenhouses' sawtooth glass, placed at fixed map positions (the projection is pinned).
- Hollywood Studios (owner, 17 Nov 2026: "Add Hollywood studios, the land in between and all the rides"): `hs.osm` (git-ignored)
- Land east of EPCOT (owner, 17 Nov 2026: "Add some land to the right of epcot"): `east.osm` (git-ignored, api.openstreetmap.org/api/0.6/map in 12 pieces, bbox 28.3490,-81.5450,28.4240,-81.5330) widens the map to lon -81.5340 (W 5634). Building outlines keep full detail everywhere (only areas/paths between parks are coarsened). Zooming in anywhere outside the fixed close-ups paints a sharp temporary patch (`d.tmp` in `MAP.detail`, at most 4, dropped by `dropDetail` after 90 s away), so the Crescent Lake resorts and the land between parks are as sharp as the parks.
- Disney Springs (owner, 17 Nov 2026: "Add disney springs area"): `springs.osm` (git-ignored, 24 pieces, bbox 28.3490,-81.5330,28.4240,-81.5090) widens the map to lon -81.5095 (W 8081). Exports `OSM.springs` (the district outline) and places `ds`, `dsballoon`, `dscoke`, `dsmarket`, `typhoon`. Shops inside the outline use `LANDSTYLE.ds` via `dsOf()` (garages stay grey). `dsBalloon(z)` in render.js draws the tethered balloon (10-minute up/down cycle, 8:30 am–11 pm, glows at night). Labels: DISNEY SPRINGS and Typhoon Lagoon pills; a TV shot. No guests or sim there: it's scenery only.
- Friendship boats (owner, 17 Nov 2026: "add the friendship boats"): the extractor exports `OSM.boats.fsc` (International Gateway → BoardWalk → Yacht & Beach Club → Swan & Dolphin → Hollywood Studios, legs joined end-to-nearest-end by `chain_near`), `fsw`/`fse` (closed loops across World Showcase Lagoon from Showcase Plaza; the far end decides Germany or Morocco), and places `igdock`, `hsdock`. They're `BOATR` routes with `fs:true` (2 boats each via `LAUNCH`), drawn as bigger teal-canopy boats in render.js. Shown only: no guests ride them.
  is merged from api.openstreetmap.org/api/0.6/map pieces (Overpass kept failing; bbox in the extractor) and covers the park
  plus the land round it (Caribbean Beach, Pop Century, Art of Animation). It is park 2: `OSM.regions` = [MKR, EPR, HSR, whole
  map], `OSM.nparks`=3, H=8425. In the extractor, earlier files win for overlapping ways/nodes and `rel_chain(...,box=)` keeps
  long routes (the Magic Kingdom bus) to the part near here, so the older parks' data didn't move. `sim.js`: lands hb/el/ga/sw/
  ts/ac/sb (`HSL`, from the map's locality outlines), 17 rides and stage shows and 18 venues, hours `HOPEN/HCLOSE` (`setHoursHS`),
  gate `HSGATE` (`hsout` = the outside direction), arrivals `spH`/`HSATT`; `decideEP` serves every park other than Magic Kingdom
  (`PGATE`, `pOpen`, `pClose`). Live data adds `LIVE.hsApi`. Art (`map-art.js`): land palettes, `towerHotel`, `chineseTheatre`
  (front of Runaway Railway), `bigGuitar`, `falcon` (the Millennium Falcon from its outline), tall sandy Batuu spires. TV mode has
  five Studios shots. It has no area music, and its daytime stage shows aren't events (they run as attractions).
  Fantasmic! (owner, 17 Nov 2026: "Yes, add Fantasmic!") is `js/fantasmic.js`, event `fmic` (`pk:2`, `rel:['hclose',-3600]`,
  real times from the Studios feed as `LIVE.shows.fmic`). The amphitheater comes from the map (`fmGeo`: the lagoon round the
  'Fantasmic' stage building, the seats' side found from the aisles, `shore(a)` for the seat rows); the extractor joins the
  amphitheater's walkway pieces to the park's network (they are separate in the data). The show is a fixed running order
  (`FM_SCENES`, fractions of its length): Sorcerer Mickey, mist screen, fountains (`lumJet`), villains, the dragon and the
  lagoon on fire, the Steamboat Willie boat with characters, and a finale through the shared fireworks engine (`fmCues`).
  Owner's soundtrack `audio/fantasmic.mp3` (git-ignored; 29:23, added 17 Nov 2026 with "The first minute or so is an intro
  schpeel") plays in time and sets the length. `js/choreo-fantasmic.js` (`CHOREO_FM`, from `tools/fireworks_from_audio.py` plus
  scene times read off the track) maps it: pre-show announcement 0–85 s (lagoon dark; was 60 until the owner found the lights came on 25 s before the music, 19 Nov), intro 85, imagine 175, adventure 470,
  villains 799 (the silent breaks), dragon 1101, Mickey 1241, riverboat finale 1300, ending 1547; fountains follow its
  loudness (`env`) and beats; the ending's fireworks are its beats after 1555 s. A different recording (another length)
  falls back to `FM_SCENES` fractions. Guests sit in the
  seats (`spot0` 'fmic'; `spot()` skips the pavement test there). Start it by hand from Entertainment or its sheet.
- Mobile app (owner, 17 Nov 2026: "make it so it can act more like an app on mobile"): `manifest.webmanifest` (name
  "DisneyAtHome", short "DisneyAtHome", standalone, relative start_url/scope so GitHub Pages works), icons in `images/`
  (an original castle-and-fireworks drawing, made in code; no Disney artwork), iOS meta tags, and `sw.js`: network first for
  the site's own files with a cached copy for offline, never storing `audio/` or byte-range requests (the owner's music stays
  off it). It registers 3 s after start-up, not on the load event (streaming music can hold that off). ☰ has "Install as an
  app" (`installApp`: Chrome's prompt, or the Share → Add to Home Screen hint on iPhone). App-feel CSS: no tap flash,
  no long-press selection, `touch-action:manipulation` on buttons; a pinch outside the map doesn't zoom the page on iPhone.
  The Mac server sends `.webmanifest` as application/manifest+json (`tools/serve.py`, and `serve.ps1` on Windows).
- The monorail recording's silent station stops are skipped when its audio starts (`RIDEGAP`/`rideSkip` in `audio.js`,
  measured from the owner's 672 s file; another file length is left alone).
- Memory (owner asked to cut browser RAM, 16 Nov 2026): close-up map layers are painted on demand and freed after
  90 s away (`detailTick` in `map-art.js`; the park's own close-up stays). `paintMap` culls to its rectangle after the
  first paint (`cull`/`vis`), so a close-up takes ~50–150 ms instead of ~12 s — keep new map art culled the same way; night-light (glow) canvases are half the
  base sharpness (`GLOWK`); long music streams via `streamUrl` (`audio.js`) when the server answers byte ranges, else it
  is fetched whole as before, and a whole-fetched ride track is freed after it fades out. The Mac launchers use
  `tools/serve.py` (no-cache + byte ranges); `tools/serve.ps1` already did ranges. Map canvases went ~404 → ~179 MB.
- OpenStreetMap has no usable heights for the resort landmarks, so `HEIGHTS` in `osm_extract.py` sets them.
  Misspelled names in the live data are handled with `ALIAS` there.
- Exaggerations, like the official guide map: the castle image is drawn ~1.6× its OSM footprint width;
  parade floats ~2× real size on the map. Everything else is to scale.
- Visual style: the painted 3/4 bird's-eye look of the My Disney Experience app map (dense lit tree
  canopies, turquoise water with pale rims, pinkish-beige paving, soft shadows from the upper left).
  The owner wanted that art style; the app-style UI shell (Filter / Wait Times ⌄ / Show List, bubble
  callouts, bottom nav) is current but negotiable.
- Disney characters are welcome (the owner lifted the earlier "no Disney characters" rule on 13 Nov 2026): the
  parades carry drawn characters from `js/characters.js`, and the fireworks include three-circle "Mickey" shells.
  Everything is still drawn in code for this site; no Disney artwork or logo files are copied in.
- Fireworks: `choreo.js` holds the cues derived from the soundtrack; `street.js` adds partner shells, loudness-driven
  extras and the Mickey shells at load (about 2,200 cues). Sparks draw their own short trails on a layer that is
  cleared every frame; do not go back to fading the previous frame, which leaves ghost images.
- Sound: every effect is a real, credited recording (CC0 / CC BY 4.0, credits in the app and
  audio/CREDITS.txt). No synthesized sounds.
- Hosted copies (GitHub Pages) get the music through ☰ → Load audio folder (`pickAudioFolder` in `audio.js`): files are
  kept in IndexedDB per browser and used whenever the site's own file is missing. The owner asked to publish the
  music with the site on 14 Nov 2026; declined (redistributing Disney's recordings), this was built instead.
- Soundtracks are the owner's copies of Disney's music, never committed or bundled:
  `audio/happily-ever-after.mp3`, `audio/festival-of-fantasy.mp3`, `audio/boo-to-you.mp3`,
  `audio/once-upon-a-christmastime.mp3`, `audio/electrical-water-pageant.mp3`, `audio/minnies-christmas-fireworks.mp3`, `audio/kiss-goodnight.mp3` (`KISS` in `parade.js`; the Kiss Goodnight lasts the track's length), `audio/let-the-magic-begin.mp3` (the
  welcome show; `WELC` in `parade.js`, the show is the track's length and ends at opening) and the area loops `audio/area-*.mp3`.
  Keep them out of git and out of any zip. The parade's length auto-matches its soundtrack (18:49).
- Soundtrack sync: the music is the master clock. `syncTrack()` moves the music only after a deliberate
  time jump (`SEEKGEN` changes); otherwise it fast-forwards the simulation to the music (background tabs
  pause animation but not audio). Tracks are fetched fully into blobs so seeking works on any server.
- The Halloween and Christmas parades are seasonal (`season` on their events: 15 Aug – 31 Oct at 19:30, and
  8 Nov – 31 Dec at 19:00), earlier than the real party-night times so they fit before the 21:00 fireworks and
  the 22:00 close. Their floats are original designs (headless horseman, pumpkins, haunted house; Santa, reindeer,
  toy soldiers, gingerbread); with Disney characters riding and walking alongside. Parades after dark
  are drawn a second time over the night tint so they look lit.
- The water pageant keeps its real showing times (21:00 Polynesian, 21:15 Grand Floridian, 21:35 Wilderness Lodge,
  21:45 Fort Wilderness, 22:10 Contemporary),
  so it overlaps the 21:00 fireworks as it does in real life; its music is only heard near the barges and the
  fireworks music ducks there. Barges cruise at up to 3.6 units a second, so the Wilderness Lodge showing ends early.
- Crowds: a guest object is a party (`g.n` people, 1–6) standing for `K` = 12 real guests. `render.js` draws
  every member (a line behind the leader when walking, a knot when stopped, one dot per party when zoomed far
  out). Movement keeps right (`g.lane`), slows with density (`DENS`, `crowdSlow`), and breaks are taken off to the
  side (`rest`). In live mode `CROWDX` scales arrivals and ride choice leans toward rides whose real waits exceed
  the simulated queue. The Crowds layer draws `DENS`; tapping a party (`sel.k==='g'`) opens its sheet.
- Guests only ever stop on pavement. `PAVE` in `sim.js` is a mask of the paved places in the map data (minus
  buildings and the Speedway track); ride entrances (`a.dx`,`a.dy`), show spots, the gate crowd and arrivals all go
  through `paved()`. Rides are entered at the nearest open-air point of the path network, never at the ride's
  centre (which can be the middle of a track). Queues are drawn along the real queue paths (`QLINE`). The walk
  network runs from the park out to the monorail station, ferry dock and bus loop.
- During the fireworks the wait-time callouts are hidden unless Filter → "Wait times during the fireworks" is on.
  Tinker Bell flies from the castle toward Tomorrowland at 17:20 into the show, on "You Can Fly" (`TINK` in `street.js`).
- Live data: keep the "Live data: ThemeParks.wiki" credit visible while live, and don't poll faster than every
  five minutes. `OPEN`/`CLOSE` are variables now (live mode sets the day's real hours, capped at 23:45); don't
  hard-code 9 or 22. On party nights the day's last closing time is used and the ticketed party isn't modelled.
  When the park has no Happily Ever After that day, any show with "fireworks" in its name sets the fireworks time.
- Daily rituals are `EV` events: `welcome` (5 minutes before opening; guests are held at the hub from 50 minutes
  before, then released), `caval` (a small parade in `PARADES` with no soundtrack), `flag`, and `kiss` (30 minutes
  after closing). Events with `rel` take their time from the park's hours (`relTimes()`).
- OpenStreetMap attribution must stay visible on the map (ODbL).

- Disneyland Resort (owner, 21 Nov 2026: "I want a selector at the top that I can change to disneyland. Lets get started with
  disneyland now"). One engine, two resorts, two pages (owner, 21 Nov: "make it a different page ... switching between them is really slow"):
  `index.html` = Walt Disney World (`RESORT='wdw'`, `js/park-osm.js`; an old `?resort=dl` link is sent to disneyland.html) and
  `disneyland.html` = the Disneyland Resort, GENERATED from index.html by `tools/make_disneyland_page.py` (run it after any
  index.html change; it swaps the data file and adds choreo-believe.js and map-art-dl.js at the `<!--DL:...-->` markers). The
  `.resortPick` pill opens the other page (`RESORT_PAGE` in ui.js); 20 s after start the other page and its data file are
  prefetched. Start-up cost measured locally: WDW ~0.9 s files + ~3.2 s map paint + ~4.9 s catching the sim up to now; Disneyland
  ~0.4 + 1.4 + 2.5 s. Then (owner: "Yes, do it" to showing the map first): big forward jumps go through `seekLater(t)` (sim.js):
  start-up, `liveFollow` and liveTick's forward jumps set `BGSEEK` and `frame()` runs `bgSeekTick(30)` per frame (a time-lapse,
  target moving with the clock; liveTick only updates the target meanwhile; FF stays on so sounds/shows wait); a normal `seek`
  cancels it; jumps ≤15 min still seek at once.
  First open (owner: "It still takes a long time before anything loads when I open it for the first time"): the tree placement
  in paintMap called landOf (≈0.4 ms, every land outline) for ~300,000 trees: about a minute. Now `landFast` (lands rasterised
  once at 0.25 px/unit, per-6-unit memo) and the building loop uses `landBld` (raster, confirmed by one ptIn); the filler grid
  only covers the parks' boxes +72. Only `MAP.layers[0]` is painted before the first frame; `MAP.paintLayer` does the rest 60 ms
  apart, then detail[0] (OCC rebuilt after each). performance marks dah-scripts/-paint-start/-crowns0/-crowns-placed/-map.
  Measured visible, locally: Disneyland map at ~3.0 s, WDW ~8.7 s (the first paint still draws the whole map for its masks).
  `OSM.resort==='dl'` sets the global `DL` (sim.js). Disneyland Park takes Magic Kingdom's slot (park 0: GATE,
  hub, castle, Main Street, `routes.rail`, `routes.parade`, `setHours`) and California Adventure takes EPCOT's (park 1: `epgate`,
  `EPR`, `setHoursEP`, `decideEP`, `LIVE.epApi`); `HSL`/`AKL` are empty. Data: `tools/osm_extract_dl.py` reads `dl.osm`
  (git-ignored; api.openstreetmap.org/api/0.6/map in 4 pieces, bbox 33.7985,-117.9295,33.8175,-117.9095) and writes the same
  schema (pinned projection, W×H 1966×2237, regions [Disneyland bbox, DCA bbox, whole map], lands by place=locality names with
  codes ms adv nos bc fr gx fan tt tom / bv hl av cl pp pg gp sf, gates = outline point nearest the Esplanade's middle, `dlout`/
  `dcaout` = outward directions, `routes.dlmono` (Disneyland Monorail loop), `routes.riverboat`/`columbia`, `parade2` (DCA)).
  Everyone walks in (MODE 3); no ferry, buses or boats (`FERRY=[]`; `mkPath` of an empty route returns a far-off point).
  Tables `DL_A`, `DL_V`, `DL_EV` in sim.js (band, Royal Theatre storytelling, Flag Retreat only; live names via the DL
  `LIVE_SHOWS`/`LIVE_ALIAS`). `TZ` in live.js is America/Los_Angeles. `MLINE.dl` (stops `dlm`, `ddm`); RESORTS = the two
  monorail stations and the three hotels. Art: `SBC` spec drawn by `castleArt(...,CS)` (Sleeping Beauty Castle fallback drawing;
  normally `images/castle-dl.png`, see below), `matterhorn()`, LANDSTYLE palettes for the new lands, big show
  buildings in Disneyland get plain roofs. TV: `tvShotsDL` (37 shots; TV parks all/mk/ep = both/Disneyland/DCA). Off at DL:
  pageant, Main Street view (`setView` forces the map, `#views` hidden), the front-cab ride button, the WDW monorail onboard
  audio, area music over DCA. Riverboats (owner, 21 Nov:
  "Riverboats"; "We dont have to do mainstreet view"): `RBOAT`/`rbPos`/`drawRiverboat` in render.js, the Mark Twain and the Columbia on
  `routes.riverboat` started at Frontierland Landing, 12 min sail + 3 min docked, Columbia half a trip behind; pure function of the
  clock while the ride isn't Closed (live status when Live); otherwise docked (Columbia in Fowler's Harbor, `colDock()`: along the harbor's water outline's long axis, bow toward the end that meets the river; owner, 25 Nov: it was "orientated wrong", pointing due north); lights
  in the night pass; `hitMap` opens the ride. Next: parades, fireworks, Fantasmic!, World of Color (no Main Street view wanted).
  DL holiday shows (owner, 21 Nov: "Add the Disneyland fireworks and parades", picked the holiday ones, audio later): EV `fire`
  = Believe… In Holiday Magic (`FW.shows.believe`, file audio/believe-in-holiday-magic.mp3, IDB key 'believe', `blvUse`/`blvPick`;
  `fwAuto` forces it at DL; choreography `CHOREO_BELIEVE` if a js/choreo-believe.js is added (load it after choreo-minnie and
  run augmentChoreo like Minnie's), else CHOREO_MINNIE; heaInit and Minnie's track are skipped at DL), `dlSnow` in render.js
  (Main Street snow from 2 min before the end to 5 after). EV `xmas` = A Christmas Fantasy Parade: PARADES 'xmas' renamed with file
  audio/a-christmas-fantasy-parade.mp3 and IDB key `P.key`='dlxmas'; other parades get file null at DL. Both season [1108,1231];
  live via DL LIVE_SHOWS (/^.?believe/, /christmas fantasy parade/). The extractor de-duplicates relation members (the parade route
  lists ways twice; that had cut it short at the hub). TV uses map shots for both (no street view at DL).
  Shared ride audio at DL: RIDEAUD matches by osm name (Mansion, Pirates, Space Mountain, Star Tours, Rise, Runaway Railway); DL's
  differently spelled small world and Soarin' are added to RIDEAUD when DL (owner, 21 Nov: "add small world and soarin").
  DL water shows (owner, 21 Nov: "Add Fantasmic and World of Color"): EV `fmic` (pk 0, 22 min, 21:00) reuses fantasmic.js:
  `fmGeoDL` (Rivers of America, stage at the island's south tip, audience direction u fixed toward the NOS/Frontierland bend,
  jets filtered to open water, `G.wet`), file audio/fantasmic-disneyland.mp3 / IDB 'fantasmic-dl' (WDW's fantasmic.mp3 is ignored
  at DL), fixed FM_SCENES (CHOREO_FM is WDW's track). `fmBoatPos(b)` overrides rbPos: Columbia in 'adventure', Mark Twain (with
  characters drawn in fmDraw) in 'finale'; fountains drop to 30% while a boat passes. Spots at DL use the normal pavement check.
  EV `woc` (pk 1) is js/worldofcolor.js (`WOC`, `wocGeo` finds the widest open band in Paradise Bay's north half, jets in 4 rows,
  `wocWall` mist pictures per scene, Pal-A-Round ring, holiday scenes `WOC_XMAS` 15 Nov to 6 Jan), file audio/world-of-color.mp3 /
  IDB 'woc', spot0 'woc' along the Paradise Gardens shore. Live: fmic via DL LIVE_SHOWS, woc from the DCA feed (`ep`). TV cuts
  between them (DL keys 'fmic'/'woc'); TV's upcoming list now maps events to parks by `e.pk`.
  DL audio (owner, 21 Nov, gave the four show tracks + "Buena Vista St California Adventure.mp3"; "Add the magic kingdom ambient
  music to the applicable spots in disneyland. Use the california adventure audio that i gave for that whole park for now"):
  `DLAREA` in audio.js maps DL lands to MK loops (nos→lib, bc→fr, tt→fan, gx silent but still weighted so neighbours fade);
  `AREA.dca` = audio/area-dca.mp3 over the whole DCA outline on EOPEN/ECLOSE. `js/choreo-believe.js` (`CHOREO_BELIEVE`, 808 s,
  from the owner's 13:29 "Master Mix") is loaded only at DL via document.write in index.html. Track lengths: Fantasmic DL 26:29,
  World of Color 30:05 (shows take these lengths), Christmas Fantasy parade 16:09.
  DL castle image (owner, 21 Nov: "Here is the disneyland castle", an AI picture with a baked-in checkerboard): `images/castle-dl.png`,
  cut out by `tools/checker_cutout.py` (grid-aware flood fill from the border, plus enclosed pockets holding both checker colours).
  `loadCastleImage` picks it at DL; drawn `w=SBC.box[0]*k*1.1`, lifted so its bottom 5% (drawbridge and path) reaches in front of the
  footprint. The drawn `SBC` castle remains the fallback if the file is missing.
  DL building realism (owner, 21 Nov: "Make the buildings in disneyland look more like the real thing"): `js/map-art-dl.js`
  (loaded only at DL via document.write after map-art.js). `dlBuilding(q,bb,land,hh,hs)` is called per building in paintMap
  (returns a draw fn, false = skip, null = normal): big in-park buildings (>1500 sq units, not ms/bv, not hotels/parking) are
  windowless greige show boxes (`dlShowBox`, rooftop units); `hauntedMansion` (white columned house at the footprint's NE),
  `smallWorld` (white/gold tower façade + clock tower on the south edge), `frenchQuarter` (Pirates: pastel balconied houses
  along the edge facing NOS), `guardiansFortress`, `carthay`; the Falcon/Grizzly Peak/BTM show buildings/Racers are skipped.
  `dlLandmarks(c,e,B,vis,S2)` after the loop: Big Thunder red spires round `places.btmpeak` over the BTM coaster's bbox plus its
  track, Batuu spires in open ground of `lands.gx`, `grizzly` at `places.grizzlypk`, the Cadillac Range fins along the Racers
  building to `places.cadillac`, `palAround`, open-air coaster tracks (`OSM.coasters`; Pixar Pier's high on white posts, ones
  inside buildings or Fantasyland skipped). LANDSTYLE.ms/nos are overridden at DL (Victorian colours; `nosDeco` balconies).
  Space Mountain's dome is a building:part in the data: the extractor writes `places.spacemtn` [x,y,r] and dlBuilding draws
  `spaceDome` on it over a low show box for the unnamed building round it.
  The extractor now writes `falcon`, `coasters` ([name, tunnel, pts]) and peak places btmpeak/cadillac/grizzlypk.
  Second pass (owner, 21 Nov: Grand Californian, around Pirates and the Haunted Mansion looked weird, "so many grey buildings",
  "make sure the orientation of everything looks good"; "The ferris wheel looks wrong"): show boxes only for NAMED ride/backstage
  buildings (AT osm names or show building/warehouse/... names); unnamed big outlines are façade blocks (NOS's French Quarter
  is one) and keep their land style. Show boxes are "go-away green" (sage walls, pale roofs, max 9 m) painted at y=bb[1] so
  façades on or against them draw over them (`dlBuilding` may return a list of {y,f}). The Mansion house is its own outline
  (`dlMansionHouse`: the biggest unnamed outline beside the HM show building, outside it, east of the railroad), drawn by
  extrude with columns on every visible wall. small world's façade follows the polygon's longest south-facing edge. Grand
  Californian: `grandCal` (brown shingle walls, cream trim, shingled roof with sparse dormers and chimneys). Pal-A-Round: kind
  'wheel' (not 'spin', whose spinning-seat art sat on it), R=22 (49 m tall), WoC's lit ring matches.
  Third pass (owner, 21 Nov: "How can I see the back of the buildings if that's the ride building?", "The ferris wheel is oriented
  wrong. Go through every building"): show boxes are painted at y=bb[3] again; façades touching them (a corner inside or within
  1.5 of a wall; NOS's French Quarter wraps into the Pirates outline) raise the box to their roofline (max 16 m) and are
  clipped out of the box only at their roofs, so their backs are hidden. The Pal-A-Round uses `places.palwheel` (centre,
  plane direction, diameter from its OSM strip; the plane runs NW-SE) and `palPt(θ,f)`: a leaning oval; WoC's ring uses palPt.
  Carthay's tower stands at the corner nearest `places.carthaycircle`. The Cadillac Range fills its two unnamed 28 m rockwork
  outlines in Cars Land (`dlIsRange`); the Racers show building is a normal show box again. Queue dots (render.js `qHidden`,
  `QIN`) skip spots indoors or on the ground behind a tall building (replaced next by OCC).
- What buildings hide (owner, 21 Nov: "I can see people clipping through buildings. Go through all buildings and fix this"; both
  resorts): `OCC`/`occBuild`/`occ(x,y)` in render.js. One mask per park region (`OSM.regions` up to `nparks`; K = 1 px/unit at
  Disneyland, 0.5 at WDW), built once (~60 ms) after the map is painted: every building outline (not canopies 'roof' ≤5 m, not
  Space Mountain) filled and smeared upward by its drawn height (bucketed, doubling shifts), plus the castle picture's alpha down
  to its front. Height = `q._dh` when the art sets it (DL show boxes, Mansion, Guardians, small world) else q.h*OSM.S*.78. Guests,
  queue dots and the night lamp glows (`OCC.L`) skip hidden spots; the map's own lamp posts are now painted in depth order (in B).
  New tall art that differs from q.h should set `q._dh`.
- The Disneyland Monorail goes THROUGH the Grand Californian (owner, 21 Nov: "It should go through"): `dlMonoThrough` (map-art-dl.js,
  called right after the monorail beams in paintMap) repaints the hotel (`grandCal`) clipped to a 5-unit corridor round the
  beams, so the beam vanishes into the wall; `dlInGCH(x,y)` hides train cars inside/behind it (render.js, like `OSM.monoIn`).
- Cars Land (owner, 21 Nov: "Add the lighting ceremony for cars land. Make it play sh boom at that and add both these as ambient
  music for cars land"; gave John Mayer's Route 66 and The Chords' Sh-Boom → audio/route-66.mp3, audio/sh-boom.mp3, git-ignored,
  IDB keys 'route66'/'shboom'). `js/carsland.js` (`CLN`): ceremony at sunset rounded to 5 min (`clStart`; `CLN.force` for
  "Watch it now"), length = Sh-Boom's; a clock function like Tree of Life (no EV, no crowd). `clBuildings` = Cars Land buildings
  (not the range, not ride buildings) ordered along their principal axis; each one's neon (roofline tubes on its view-facing walls,
  a sign, Cozy Cone outlines) flickers on in order over the song's first 2/3 (`clOnAt`) and stays lit to ECLOSE+30 min
  (`clLitAll`). `clSync`/`clDraw` hooked in render.js; in `showOn`; TV key 'cl'; Entertainment card `#clStart`. Area music:
  `AREA.cl` with `AREA_PL.cl` = playlist (Route 66 then Sh-Boom, next on 'ended'), weighted inside `OSM.lands.cl` (fading over
  45 units outside it) against `area-dca`.
- Cars Land look (owner, 21 Nov: "Make the cars lands building look correct. When the lighting happens, mute all other music when we
  are watching it"): `dlCarsLand` in map-art-dl.js (called from dlBuilding for land 'cl'): Cozy Cones = the five named cone
  outlines (Churros, Chillie-Cone-Carne, Ice Cream Cone, Cone-Cactions, Pop-Cone; `dlIsCone`/`dlConeGeo`, also used by the neon),
  Sarge's `quonset` along the outline's principal axis (`pAxis`), Fillmore's `geoDome`, `tireTower`, `flos` (sign at the corner
  nearest the street middle), `ramones`, `luigis`, `courthouse`, `butte` (Willy's Butte, Radiator Cap); LANDSTYLE.cl desert pastels.
  Ceremony order (owner, 21 Nov: "start from the main street and work out. Also make it faster. Also make the watch the show
  just jump to the next one"): buildings ranked by distance to Route 66 (the widest Cars Land walkways, `CLN.street`), all lit
  3–29 s in (`CL_RUN`); "Watch the next one" (`clStartNow`) unfollows live and seeks to 8 s before the next ceremony, moving
  `dateStr` to tomorrow (reset) when tonight's is over. `CLN.force` is no longer set.
  Muting: `setVol` (audio.js) multiplies every player except Sh-Boom by 1-`clFocus()` (1 while the ceremony is on and the map is
  on Cars Land).
- audio/area-dca.mp3 (owner's, git-ignored) was cut to 95 MB / 66 min (owner: "Trim area dca to not be over 100mb", GitHub's
  file limit) at an MP3 frame boundary, with its Info header's frame and byte counts fixed.

- Galaxy's Edge music (owner, 25 Nov, their own file, cut to 95 MB / 66 min at a frame boundary with the Info header fixed):
  `AREA.gx` = audio/area-gx.mp3 at both resorts. Disneyland: `DLAREA.gx`. Hollywood Studios: within about 70 units of
  (5070,7875) (round Oga's Cantina) it fades from `area-hs` to `area-gx` over 60 units (areaTargets, audio.js).
- Faster first paint (owner, 25 Nov: "Try that new approach, make sure it still loads the rest after the first is loaded"):
  the first `paintMap` makes the whole map's no-tree mask in its own quick pass (`maskAll`, map-art.js) and then draws only
  its own rectangle (it used to draw all four parks onto the first canvas). Tree placement still uses the whole-map water
  and forest lists. The first park's layer is split (buildMap): the park itself (railroad box plus the entrance) paints
  before the map appears; the land round it follows in up to four strips (3-unit overlap) with the other parks, via
  `rest()`. `fade` fades only a park's outer edges (`L.r`), not the seams between its pieces. WDW first paint went from about
  2.0 s to 1.2 s on the Mac; Disneyland is about 0.7 s.
- Bus lanes (owner, 25 Nov: "Magic Kingdom bus depot has a road issue"): the bus station's bays are `highway=service`
  `service=driveway` tagged `bus=yes`, which the extractor dropped with all driveways, so buses drove over grass. Driveways
  tagged bus/psv are now kept as road3. Only `lines` was swapped into park-osm.js (a full rerun renumbers Animal Kingdom's
  walk graph, because the graph is built from unordered sets).
- Night glare (owner, 25 Nov: "The castles both get super bright at night when you zoom in"): close-up layers overlap (the park's
  and a sharper `d.tmp` patch), and their glow canvases were all added with 'lighter', so the castle's glow copy doubled. render.js
  now draws each spot's glow from the topmost close-up only (reverse order, each clipped outside those already drawn). The castle
  uplight rectangle also covers its whole gradient circle now (it showed a square edge, plainest at Disneyland).
- Walt Disney World buildings less generic (owner, 25 Nov: "Make the disney world buildings look less generic as well now. Start
  with magic kingdom area"): `js/map-art-wdw.js` (after map-art.js in BOOT_JS, loaded at both resorts but does nothing at DL).
  `wdwBuilding(q,bb,land,hh,hs)` is called in paintMap like dlBuilding, for buildings inside the Magic Kingdom's railroad in lib/fan/
  fr/adv/tom (Main Street keeps its storefronts). Façade decos per land (`MKFRONT`): libDeco (white cornice, corner boards, shutters),
  fanDeco (half-timbering), frDeco (board-and-batten, porch roof, false front), advDeco (plinth, terracotta band, lintels), tomDeco
  (blue bands, fins). Big fan/lib/fr/adv roofs are split into rows of gabled roofs along the footprint's long axis (`wdwRoofs`);
  Tomorrowland roofs get a blue trim, seams and finned spires (`tomRoof`). Landmarks: `hauntedManorWDW` (brick manor with a tower on
  the part of the outline within 19 units of the entrance, go-away green show building behind), `smallWorldWDW` (show box + a short
  white/pastel façade on the wall nearest the entrance), `hallOfPresidents` (brick, cupola with clock), `beOurGuest` (stone, battlements,
  slate-capped towers at the back), `ericsCastle` (rockwork + sandy towers), `cambodianTemple`, the Tiki Room's thatch. At WDW it
  overrides LANDSTYLE.fan/tom/lib (muted Fantasyland roofs, pale metal Tomorrowland roofs).
  EPCOT (owner, 25 Nov: "Yes, EPCOT next"): `epBuilding` for `ep_*` lands (The Land, Test Track, Spaceship Earth, Mexico, Imagination and
  greenhouses stay in map-art.js). Pavilion decos `EPFRONT` (canada stone courses, uk/germany half-timber, france iron balconies + mansard
  band, morocco green tile + arches, japan posts, italy, china red columns + gold band, norway planks, usa colonial); roofs over 400 sq
  units split (`wdwRoofs`). Landmarks by name: `pagoda` (Goju-no-to), `torii`, `campanile` (Saint Mark's), `staveChurch`, `templeOfHeaven`
  on the China Pavilion, `cupola` on the American Adventure, `eiffel` behind Impressions de France and `minaret` by Spice Road Table
  (`behind()`: open ground on the side away from `EPLAGOON()`, the water the torii stands in; both are painted at y+40 so the trees and
  shops round them don't cover them), Mission: SPACE's red planet by its entrance, Cosmic Rewind's blue show building. LANDSTYLE.ep_japan
  roofs are grey-blue at WDW.
  Hollywood Studios (owner, 25 Nov: "Yes, Studios next"): `hsBuilding` for HSL_ART lands (the Tower, Muppet*Vision, PizzeRizzo,
  Runaway Railway, Rock 'n' Roller Coaster, Smugglers Run, Rise, Fantasmic and Theater of the Stars keep map-art.js). `HSFRONT`: decoDeco
  (hb/sb/el: pilasters, speed lines, stepped parapet, neon line), studioDeco (ac soundstages: ribs, stage door; cream walls, pale roofs),
  brickDeco (ga), toyDeco (ts: big bordered toy-block squares), batuuDeco (sw: streaks, round windows; domes on roofs). Boulevard roofs
  split flat in pale tones (`wdwFlatRoofs`). Toy Story Mania and Star Tours are go-away green show boxes. Landmarks: `atat` at Star Tours'
  entrance (x1.7, painted after the box), `gertie` on Echo Lake (faces the nearest water), `steamer` (Min and Bill's).
  Animal Kingdom (owner, 25 Nov: "Yes, Animal Kingdom"): `akBuilding` for AKL_ART lands (Tree of Life, Everest's show building, roofs,
  the train station and the backstage animal houses stay as they were). `AKFRONT`: harambeDeco (stained plaster, carved door), anandapurDeco
  (stains, painted band), discoveryDeco (painted boards, bright eave band, medallions), pandoraDeco (vines). Harambe Theatre and some
  Harambe/Discovery Island roofs are `thatch`; other big roofs split. Asia buildings carry `prayerFlags`; Pandora buildings and Flight of
  Passage's rock show building get `bioGlow` (cyan/magenta spots on the glow layer); the Rainforest Cafe is rockwork with plants and a
  waterfall.
  Resorts (owner, 25 Nov: "Yes, the resorts"): hotels that fell to LANDSTYLE.none get `resortBuilding` via `wdwResort(x,y)` (`WDWRES`,
  centres from their named buildings): riv (Riviera, terracotta + shutters), pop (Pop Century: white, coloured stair towers, decade band),
  aoa (Art of Animation, bold colours), porm (Port Orleans Riverside mansions: white columns), porb (Alligator Bayou: plank lodges, tin),
  pofq (French Quarter pastels, iron balconies, mixed slate/tin), ssrt (Saratoga Treehouse Villas: wood), okw (Old Key West pastel
  clapboard, pale tin), ssr (Saratoga Springs: clapboard, green roofs), cbr (Caribbean Beach: bright walls, red/teal/gold tin). `RESSTYLE`
  holds each one's walls, roofs, deco and flat/gabled split. Hotels already styled elsewhere (Crescent Lake, monorail resorts, Wilderness
  Lodge, AKL, Coronado Springs `csr`, All-Stars) are untouched. Not done: non-Disney hotels round the edges stay plain.
- Map data: `tools/dedupe_points.py` dropped repeated points (43% of all points at WDW, left by clipping in the extractors):
  park-osm.js 9.7 MB to 5.9 MB, park-osm-dl.js 3.3 MB to 2.2 MB, with no change on screen. Never touches `nodes` (indexed).
  Run it again after either extractor.
- Disneyland polish (25 Nov): `LANDSTYLE.hl` cream/rose/mint art-deco fronts with pale studio roofs (was slate grey);
  `LANDSTYLE.av` brick and concrete with metal/rust roofs; open shade canopies (`q.k==='roof'`, e.g. the Fantasyland
  Theatre's) are pale fabric (dlBuilding). A show box for the courtyard dark-ride building behind the castle was tried
  and dropped: it read as a plain grey slab, which the owner has disliked.
- Duo: the Screen line (☰ menu) is only on GitHub Pages once the owner pushes from GitHub Desktop; ui.js was still
  uncommitted there on 25 Nov, which is why the owner didn't see it.

## Ideas not done yet
- Sync the monorail's onboard audio (`ride-monorail.mp3`) to each train's place on the track: needs the owner to say
  which line the recording is and give rough timestamps for each station announcement; then jump the audio at each
  departure and match the trains' run times to the recording.
- More of the resort area: the Epcot monorail line, and guests who actually stay at, eat at or travel between
  the resorts.
- Optional nicer painted map art (e.g. restyling a render of this map with a structure-locked image model).
- Real-ish show schedules per date; more entertainment (castle stage show, Main Street band) visuals.
- Keep the whole map in memory (owner, 18 Nov 2026: "cache the map to ram so that it loads faster"): `MAP.keep` in `map-art.js`, a
  checkbox in Sound & settings (`mk-keepmap` in localStorage). `detailTick` then never lets tiles or close-ups go, keeps up to 12
  temporary patches, and with nothing wanted on screen paints the next unpainted close-up or tile (all 69 in about 20 s). It
  costs about 0.3 GB at MSS 2 and about 0.5 GB at MSS 3. It doesn't speed up the first open (that's the 7.5 MB data file and the park layers).
- Keep the audio in memory (owner, 20 Nov 2026: "Add an option to keep the audio in memory. The default for that and map
  should be not kept in memory"): `AUDKEEP` in audio.js (`mk-keepaudio`, read at load, so it applies on the next load), checkbox
  `#keepAudio` in the Your music card. On: `streamUrl` fetches whole files into blob URLs held in `AUDKEEP.mem` (show tracks at
  startup, rides/area when first heard), `rideFree` keeps them. Off (default): streaming as before; area music silent 60 s is
  released (`AM.pos` remembers its place, `dataset.gone` stops its error handler). Both memory options default to off.
- Muppets Courtyard before it closed (owner, 18 Nov 2026): `muppets.osm` is OpenStreetMap at 2023-06-01 (Overpass `[date:...]`) for
  the ways whose middle is in 28.3522,-81.5608,28.3556,-81.5580; the extractor reads it before `hs.osm` and drops today's construction
  site (way 1416883582) and "The Glob Theater" (1576253220) via `SKIP_WAYS`. Muppet*Vision 3D is attraction land `ga` with a fixed
  placeholder wait (`a.ph`=15, sim.js; liveText says so); PizzeRizzo and Mama Melrose's are venues. Art: `muppetDeco`, `muppetSign`
  (plain lettering, not the logo), `courtyardFountain`, brick for the building holding PizzeRizzo. Ride audio keys added in
  `RIDEAUD`: soarin, tot, rotr, railway, startours, indy, muppets (the owner's files, git-ignored).
  Later the same day: spaceship, cosmic, testtrack, missionspace, remy, fiesta (EPCOT). 19 Nov: seas (The Seas with Nemo &
  Friends) and rnrc (Rock ’n’ Roller Coaster; the owner's choice of track). 20 Nov: tron (TRON Lightcycle / Run). 25 Nov: jungle (Jungle Cruise; the owner's 2026 Jingle Cruise POV with the first 1:30 cut at a frame boundary, 10:31). Also buzz (Buzz Lightyear's Space Ranger Spin, the owner's full ride audio).
- Animal Kingdom (owner, 19 Nov 2026: "Time for animal kingdom and all the land in between", "add the resorts as well"):
  `ak.osm` (git-ignored; api.openstreetmap.org/api/0.6/map in 34 pieces: a west strip 28.3330,-81.6125,28.4240,-81.5900 and a
  south strip 28.3330,-81.5900,28.3495,-81.5090) is read last. The map grew west, so the extractor shifts everything right by
  `DX=2210` (`OSM.dx`; the Magic Kingdom region now starts at x=DX); W×H 10291×10185. Fixed map spots in the JS add it:
  `MDX` in sim.js (Cosmic Rewind's wait, the Friendship boat's Germany/Morocco test), `landPavilion` translates by `OSM.dx`,
  the Land greenhouse skip test. Anything else written as absolute map coordinates must add `OSM.dx` too. Park 3:
  `OSM.regions`=[MKR, EPR, HSR, AKR, whole map], `OSM.nparks`=4; lands oa/di/pa/af/as (`AKL`; Discovery Island from its
  place=island outline inside the park, not Bay Lake's); 13 rides/trails/shows (Festival of the Lion King = 'Harambe Theatre',
  Finding Nemo = 'Theater In The Wild'; DinoLand is closed) and 8 restaurants; hours `AOPEN/ACLOSE` 8–19 (`setHoursAK`, ride
  times written against that day), gate `AKGATE` (outline point nearest its bus station, `akout`), arrivals `spA`/`AKATT`.
  Live: `LIVE.akApi` (themeparks.wiki 1c84a229-…). Art: `AKL_ART` palettes, resorts by `akResOf` (akl, csr, asr), `treeOfLife`,
  `everestMtn` (replaces Everest's show building, drawn inside that building's footprint set back from the walkway; owner, 19 Nov:
  it sat on the path), Kilimanjaro Safaris' road (`OSM.routes.safari`: its one-way grade1 track pieces followed from the dock, a
  closed loop ~3.1 km) painted as dirt, with 20 trucks driven live by `drawSafari` in render.js (22 min round, still while down,
  gone when closed) and its animals (`SAFAN`/`drawSafariAnimals`: herds placed beside the road in ride order, hippos, crocs
  and flamingos only inside OSM water, land animals kept out of water/forest), `floatingMtns` over Pandora, `gushmore` at Blizzard Beach; labels in
  render.js. TV park 'ak' with six shots. Area music `audio/area-ak.mp3` (owner's Tree of Life loop, git-ignored), one loop over the whole
  park like EPCOT's and the Studios', on Animal Kingdom's own hours (checked before Magic Kingdom's hours in `areaTargets`). No ride
  audio yet. Nighttime show: Tree of Life Awakenings (`js/treeoflife.js`, not an EV event, so no guest gathering): every
  `tolPeriod()` (15 min) from `tolFirst()` (sunset+30 min, on the quarter hour) until ACLOSE; `tolClock`/`tolSync`/`tolDraw`
  (wash, shimmering carvings, a spirit animal per 42 s section from `safAnimal` tinted on a small canvas, canopy fireflies),
  geometry from `TOL_AT` set in `treeOfLife`; audio `audio/tree-of-life.mp3` (owner's, git-ignored; Load audio folder key
  'treeoflife'); in `showOn`.
- Test Track (20 Nov, from the owner's aerial photos): `ttBuilding` (dark round walls, white pie-panel roof), the outdoor
  track `OSM.routes.testtrack` (OSM way 'Test Track' roller_coaster=track) on white stilts via `ttTrack` in short painter-order
  pieces, `ttPad` (round pad, blue disc) inside the loop; `TTSKIP` drops the map's unnamed duplicate building and the 'roof'
  over the whole track.
- Space Mountain: `spaceDome` is one cone rising from its round base; the PeopleMover beam is clipped out of its footprint
  (it runs indoors) and its cars hidden there (`SMB` in render.js).
- Tree of Life jump (20 Nov): `tolTimes`/`tolJump`/`tolLook` in treeoflife.js; an Entertainment card (`#tolJump`) built in
  ui.js before the EV cards.
- Disney Skyliner (20 Nov, owner's `audio/ride-skyliner.mp3`, git-ignored): `out['skyliner']` from osm_extract.py (gondola ways
  named 'Disney Skyliner' chained between stops = way ends of degree != 2 or near a named aerialway=station; 5 lines; pylons
  near the cables). `skylinerArt` (map-art, with the elevated beams: cable pairs at ±3 via `skyOff`, `SKY_E()` = 12 m up,
  pylons with crossbars), `drawSkyliner` (render.js, cabins out on one cable and back on the other, 55 apart at 5 m/s,
  `skyOpen()` = min(EOPEN,HOPEN)-1 to max(ECLOSE,HCLOSE)+1; `drawSkyliner(true)` after the night tint lights the windows);
  audio key `skyliner` in `rideTargets` (zoom × distance to the nearest cable, `RA.skyPts`).
- Monorail cab ride (owner, 20 Nov: "I want to ride the monorail around the resort loop", chose the front-cab window view):
  `js/ride.js`, raw WebGL (webgl2, else webgl1), no library. Built once on first boarding (`rideBuild`): region = resort +
  express loops + 900; ground texture painted from OSM areas/roads/paths (`rideGround`, ≤4096 px); solids (`rideSolids`:
  buildings extruded with the map's LANDSTYLE colours and ear-clipped roofs `rideEar`, Space Mountain cone, Contemporary
  A-frame via `rideContemporary`, beams from `OSM.mono` at `RIDE_BH`=9, pylons every 36, station platforms/canopies); trees and
  lamps as point sprites (`MAP.crowns` or `OSM.trees`); castle billboard from `CASTLE_IMG`. Fog is per-pixel (vp varying).
  `rideFrame` is called from the render loop instead of the map when `RIDE.on`; eye at `monoXY(m,RIDE_NOSE)`; drag looks
  around. Boarding sets `follow={k:'m',i}` (so the onboard audio plays) and speed 1; `#ride` overlay in index.html, HUD
  `#rideTtl/#rideSt`, `body.riding` hides the bar and nav. Trains now ease in/out of stations in `transport` (`m.v`, so
  monoEta is a few seconds optimistic). The card button `#dRide` is on Resort/Express trains only (EPCOT's line runs outside
  the ground texture).
- Contemporary interior in the cab ride (owner, 20 Nov: "is the interior of contemporary modeled" -> "Yes, model it"):
  `rideContemporary` builds two room legs with an atrium between (leg thickness T is sized from the beams, sampled along
  `OSM.mono`, so trains clear the walls), balcony slabs/rails per floor, tiled concourse floor at `RIDE_BH-2.6`, shops and
  an elevator core with an ORIGINAL mosaic (mesas in bright tiles; never copy the real Mary Blair mural) on the side away
  from the beams, steel mullions on the ends, and lights pushed to `RIDE.xl` (drawn with the lamps after dark). Surface
  kinds in the lit shader: 1 windows, 2 plain, 3 self-lit at night, 4/5 = 1/2 indoors (warm glow at night); `rideSeg`
  takes an optional kind. Beams and the `cont` platform inside `OSM.monoIn` use kind 5.
- Bay Lake Tower in the cab ride (owner, 20 Nov: "the contemporary vacation club building doesnt look correct at all"):
  the A-frame test must match `Disney's Contemporary Resort` EXACTLY - "Bay Lake Tower at Disney's Contemporary Resort" also
  ends in "Contemporary Resort" and was being drawn as a second A-frame. `rideBayLakeTower` = curved white slab with
  windows, a dark glass top-floor band and parapet; `rideSkyway` raises the Skyway Bridge (OSM kind roof) to the concourse
  level on posts.
  Realism pass (owner, 20 Nov: "make the buildings and trees look more realistic ... some trees clip through the track"):
  vertex = p,c,n,t(u,v,kind) (12 floats); walls carry u/v so the lit shader draws window grids (lit at random after dark,
  `NI`) and a darker foot; convex footprints get hipped roofs with eaves (not cont/tom/roof kinds), others a flat roof with a
  parapet. Trees use the map's kinds: crowns = trunk + 3-4 leafy noise point sprites (seed attribute `q`), pines = 2 stacked
  cones, palms = trunk + 7 drooping fronds; any tree within ~r+2 of a beam (grid of beam samples) is dropped. Ground texture
  gets world-space noise.
- Sound only on screen (owner, 25 Nov: "Sometimes the audio will keep playing even after closing it"): an inline script in
  index.html wraps `Audio` (a registry of every player) and on visibilitychange-hidden/pagehide pauses all playing ones and
  suspends `AU.ctx`; on return resumes the ones it paused. auTick/areaTick/rideTick intervals skip while `document.hidden`.
- Status-bar area (owner, 25 Nov, Duo cover screen held sideways: "can it not fill the screen on the right?"): the home-screen app
  uses `apple-mobile-web-app-status-bar-style` black-translucent, so the page runs under the status bar/side rail. `--sl/--sr`
  (safe-area insets) pad #bar/#nav and push #views/#time/#fsBar/#osmc clear; #sbL/#sbR darken the side rails and #bar's top
  inset is a dark band, so the white status text stays readable. Untested on the device; iOS may need the app re-added.
- Short phones (owner, 20 Nov: "optimize ... for the closed iPhone Duo screen", about 466 x 678 points): a
  `@media(max-width:760px) and (max-height:760px)` block at the end of style.css (slimmer #bar/#nav/#time, sheet 80%).
- Friendship boats pass under bridges: `fsBridges` in render.js finds every walkway/road/bridge deck crossing their routes
  (away from docks) once and repaints those pieces over the boats.
- Fantasmic's Sorcerer Mickey is his own drawing, `fmSorcerer` (fantasmic.js): red robe, raised white gloves, blue hat with moon
  and stars, sparkles from his hands; not the parade figure from characters.js.
- The project is named DisneyAtHome (renamed 19 Nov 2026): page title, app name and short name, readme. The launcher file
  names (`Start Simulator.command` etc.) and folder names were left as they are.
- Cosmic Rewind's wait sits at (4240,5450), over its pavilion (sim.js): its map outline runs out to the show building backstage.
- Spaceship Earth at night: the baked glow is only a faint halo and uplighting; `sseNight` (render.js) draws a slow colour
  wash and 150 twinkling lights live each frame, from `SSE_AT` (set when map-art paints the sphere). Remy's osm name has a curly
  apostrophe (’); RIDEAUD keys must match the osm name exactly.
