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
- Load order in index.html matters: park-osm → sim → audio → choreo → choreo-minnie → map-art → street → characters → parade → pageant → live → render → ui → tv (choreo-luminous, luminous, choreo-fantasmic and fantasmic load just before live).

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
  Friends) and rnrc (Rock ’n’ Roller Coaster; the owner's choice of track). 20 Nov: tron (TRON Lightcycle / Run).
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
