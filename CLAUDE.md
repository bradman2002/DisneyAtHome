# Magic Kingdom Simulator — project brief

A personal website: an illustrated, simulated Walt Disney World Magic Kingdom, plus the resort area around
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
- Load order in index.html matters: park-osm → sim → audio → choreo → map-art → street → characters → parade → pageant → live → render → ui → tv.

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
- `js/choreo.js` — Happily Ever After fireworks cues derived offline from that soundtrack.
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
  `audio/once-upon-a-christmastime.mp3`, `audio/electrical-water-pageant.mp3` and the area loops `audio/area-*.mp3`.
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
- More of the resort area: the Epcot monorail line, and guests who actually stay at, eat at or travel between
  the resorts.
- Optional nicer painted map art (e.g. restyling a render of this map with a structure-locked image model).
- Real-ish show schedules per date; more entertainment (castle stage show, Main Street band) visuals.
