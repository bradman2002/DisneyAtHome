# DisneyAtHome

A simulated, illustrated Magic Kingdom and the resort area around it: aerial map with wait-time
callouts, Seven Seas Lagoon, the monorail loop (Express and Resort lines) with the Contemporary,
Polynesian Village, Grand Floridian and the Ticket Center, Bay Lake with Wilderness Lodge, Discovery Island
and the Fort Wilderness marina, a street-level Main Street view,
day/night, guests, transportation and the Happily Ever After fireworks show synced to its soundtrack. Wait times, ride closures, show times and park hours are the real
ones when "Live" is on (see below); guests, crowds and vehicles are always simulated.

Getting around the map: drag to move, scroll or pinch to zoom, double-click or double-tap to zoom in on a spot
(Shift + double-click zooms out), tap anything for its details.

On a phone it works like an app: open ☰ → "Install as an app" (on iPhone and iPad: Safari's Share button → "Add to Home
Screen"). It gets its own icon, opens full screen without the browser's bars, and still opens with no signal once it has been
used (the live data and sounds need a connection; everything else is simulated anyway).

## Disneyland

The picker above "Wait Times" at the top switches between Walt Disney World and the Disneyland Resort in Anaheim. Each resort
is its own page: `index.html` is Walt Disney World and `disneyland.html` is Disneyland (for example `disneyland.html?tv` runs TV
mode on Disneyland). Once a page has settled, it quietly downloads the other resort's page and map data, so switching on a hosted
copy doesn't wait for the download. `disneyland.html` is made from `index.html` by `tools/make_disneyland_page.py`; run that after
changing `index.html`. Old `?resort=dl` links still open Disneyland.

The Disneyland map comes from OpenStreetMap like Walt Disney World's: Disneyland Park, Disney California Adventure, Downtown
Disney, the Esplanade and the three hotels, with the streets round them. Both parks are simulated (guests, queues, about 60
rides and 27 restaurants and shops), and with Live on, the wait times, closures and park hours are the real ones from the
ThemeParks.wiki feeds for both parks, on Pacific time. The castle is a drawing of Sleeping Beauty Castle made for this
site, and the Matterhorn is drawn on its real footprint. The Disneyland Railroad and the Disneyland Monorail run their
real routes, and the Mark Twain and the Sailing Ship Columbia sail round Tom Sawyer Island on the Rivers of
America while they're running (lit after dark; tap one for its wait). TV mode has its own Disneyland shots, and Sound & settings → TV mode picks Disneyland, California Adventure or
both.

In the holiday season Disneyland has **Believe… In Holiday Magic** over Sleeping Beauty Castle (snow falls on Main Street as it
ends) and **A Christmas Fantasy Parade** from “it’s a small world” down Main Street to Town Square, at the real times when Live is
on. Their music is your own copy, like the Walt Disney World shows: put `believe-in-holiday-magic.mp3` and
`a-christmas-fantasy-parade.mp3` in `audio/` (or use Load audio folder / Load soundtrack…). Until then they run silently; the
fireworks use Minnie's Christmas choreography as a stand-in until their bursts are timed to that track
(`tools/fireworks_from_audio.py`, making `CHOREO_BELIEVE`), and the parade uses the Christmas floats.

**Fantasmic!** plays on the Rivers of America from the south end of Tom Sawyer Island, with the guests along the New Orleans
Square and Frontierland waterfront: mist screens, fountains, Sorcerer Mickey, the dragon setting the river alight, the Columbia
sailing through the pirate scene and the Mark Twain carrying the characters in the finale. **World of Color** plays on Paradise
Bay in front of Paradise Gardens Park: rows of fountains in each scene's colours, the mist wall with its pictures, flame,
searchlights and lasers, and the Pixar Pal-A-Round lit up across the water (the Season of Light version in the holidays). Both run
at the real times when Live is on (otherwise 9 PM) and can be started from Entertainment. Put your own copies of their music in
`audio/` as `fantasmic-disneyland.mp3` and `world-of-color.mp3` (or use Load audio folder) to hear them.

Cars Land lights its neon at sunset, one sign after another down Route 66, to Sh-Boom (`audio/sh-boom.mp3`), and plays
Route 66 and Sh-Boom (`audio/route-66.mp3`, `audio/sh-boom.mp3`) as its music the rest of the time. Area music: Disneyland's lands play the Magic Kingdom loops of the same name (Main Street, Adventureland, Frontierland,
Fantasyland, Tomorrowland), New Orleans Square plays Liberty Square's, Bayou Country Frontierland's and Toontown Fantasyland's;
Galaxy's Edge plays `audio/area-gx.mp3` at both Disneyland and Hollywood Studios (the rest of Hollywood Studios keeps its one loop). All of California Adventure plays `audio/area-dca.mp3` (your Buena Vista Street loop) for now.
Disneyland's landmarks are drawn to look like the real ones (`js/map-art-dl.js`): the Haunted Mansion, "it's a small world",
the French Quarter, Big Thunder's rocks, Batuu's spires and the Millennium Falcon, Grizzly Peak, the Cadillac Range, Carthay Circle,
the Guardians' fortress, the Pal-A-Round and the Incredicoaster; the big show buildings are plain boxes, and Main Street has
Victorian colours. Sleeping Beauty Castle is the owner's illustration (`images/castle-dl.png`, cut out of its checkerboard with
`tools/checker_cutout.py`). Believe's bursts are timed to its soundtrack (`js/choreo-believe.js`). The Main Street street view stays Magic Kingdom's, and the rides that have a recording at Walt Disney
World (Haunted Mansion, Pirates, Space Mountain, Star Tours, Rise of the Resistance, Runaway Railway, “it’s a small world”,
Soarin’) play it.

## Live: the real park

When the page opens it fetches Magic Kingdom's current wait times, ride closures, today's show times and
park hours from the free ThemeParks.wiki API (https://themeparks.wiki, not affiliated with Disney), and
refreshes them every five minutes. The red "Live" button on the clock bar means the clock is following the
real time in Orlando and every wait time is the posted one. Scrub the time, pause or change speed and it
becomes a plain simulation again; press "Go live" to return. Add `?sim` to the address to start simulated.
If the data can't be reached, everything stays simulated.

## Muppets Courtyard, as it was

Grand Avenue at Hollywood Studios is shown as it was before Muppets Courtyard closed in 2024, from OpenStreetMap's history
(`muppets.osm`, the map as of June 2023; today's map has the Monsters, Inc. construction site there). Muppet*Vision 3D runs
with a fixed placeholder wait of 15 minutes, since there are no real waits for it, next to PizzeRizzo, Mama Melrose's and the
courtyard fountain.

## TV mode: leave it running on a screen

Press the screen button at the top right of the map (or the T key). The controls disappear and the
simulator directs itself: the camera glides between the park, each land, a monorail, the ferry, Main Street
and the resorts; it cuts to the parade, the fireworks and the water pageant when they are on; and a board
pages through the live wait times and what's coming up. While the park is closed overnight it replays the
day as a time-lapse, slowing to real time for each show. Esc or T leaves.

To show just one park, open ☰ Sound & settings and pick **All parks**, **Magic Kingdom**, **EPCOT** or
**Hollywood Studios** under TV mode (it's remembered). The camera, the shows it cuts to, the wait-time board and
"Coming up" then stick to that park. `?tv=mk`, `?tv=ep` or `?tv=hs` in the address does the same.

For a screen that runs all day, also tick **Keep the whole map in memory** in ☰ Sound & settings. The map is
normally drawn piece by piece as you reach each part and let go after 90 seconds away. With this on, every part is
painted in the background in the first 20 seconds or so and kept, so panning and zooming anywhere is instant. It uses
about half a gigabyte of memory, and it's remembered.
On short phones (the iPhone Duo folded, about 466 × 678; the iPhone SE) the header, tab bar and clock panel are slimmer
and sheets open taller, so more of the screen is map.
Both memory settings are off unless you tick them. **Keep the audio in memory** (☰ Sound & settings, under Your music)
fetches each recording whole and holds on to it, so music and ride tracks start and jump instantly and aren't fetched
again; off, recordings stream, a ride's track is let go when it fades out and area music is let go after a minute of
silence (picking up where it was when it comes back). It's remembered and applies when the page next loads.

To put it on a TV:
- Simplest: connect this Mac to the TV (cable or AirPlay) and double-click **Start TV.command**. It starts the
  site and opens Google Chrome full screen in TV mode with sound, on the TV if one is connected, and keeps the
  Mac awake. Press Command-Q in that window to stop. It uses its own Chrome profile, so your normal Chrome
  windows are untouched. (Without Chrome it opens your default browser: click the page once and press T.)
- A TV or streaming box with a web browser on the same Wi-Fi: on this computer run
  `python3 -m http.server 8000` in this folder, then on the TV open
  `http://<this computer's name>.local:8000/?tv`. The `?tv` starts TV mode by itself. Browsers only allow
  sound and true full screen after one click or button press on the page.
- Apple TV: double-click **Start Stream Server.command**, stream to it from OBS, and watch in the VLC app on the Apple
  TV, music included. Setup: `tools/stream/README.md`, "Watching on Apple TV from a Mac".
- The GitHub Pages copy (`….github.io/DisneyAtHome/`) opens in TV mode by itself, with no `?tv` needed. Add `?map` to
  the address there for the plain map.

## Streaming it to YouTube

`tools/stream/` has a Docker setup for a server: Chrome shows TV mode on a virtual screen and ffmpeg sends it to YouTube
Live. Follow `tools/stream/README.md`. It streams with the music off by default (`?nomusic`: sound effects only), because
YouTube's Content ID catches Disney's music.

## Folder layout

    index.html          the page
    css/style.css       styling
    js/park-osm.js      park geometry from OpenStreetMap (generated)
    js/sim.js           park data + guest/ride/transport simulation
    js/audio.js         ambient sound engine (loads files from audio/)
    js/choreo.js        fireworks timing derived from the soundtrack
    js/map-art.js       the painted aerial map
    js/street.js        Main Street view + fireworks show engine
    js/render.js        drawing the map, callouts and fireworks
    js/ui.js            top bar, sheets, bottom navigation, controls
    images/castle.png   castle illustration used on the map (swap in another image with the same name to change it)
    audio/              all sound files (see below)

## The soundtrack

Put your copy of the show audio at:

    audio/happily-ever-after.mp3

(exactly that name). If it's missing, the show still runs silently, and you can pick the
file from Entertainment → "Load soundtrack…" — the browser remembers it.

Note: the soundtrack is Disney's copyrighted music. Keeping it on a private or
password-protected site is the safe choice; hosting it publicly may get the site a
takedown notice.

## Sound

Sound starts by itself when the page opens, wherever the browser allows it (it does once you've used the site a
few times, and the TV launchers always allow it). Otherwise a "Click anywhere for sound" reminder shows, and the first
click, tap or key press starts everything.

## Area music

Each land's background music plays as you look at it: put your copies at `audio/area-ms.mp3` (Main Street,
which also covers the hub), `area-adv.mp3`, `area-fr.mp3`, `area-lib.mp3`, `area-fan.mp3`, `area-tom.mp3`, `area-ep.mp3` (plays anywhere over EPCOT), and `area-hs.mp3` (the Hollywood Boulevard loop, plays anywhere over Hollywood Studios), and `area-ak.mp3` (the Tree of Life loop, plays anywhere over Animal Kingdom during its hours). Ride audio is `audio/ride-<name>.mp3`, heard when you zoom in on the ride: Hollywood Studios has
`ride-tot.mp3` (Tower of Terror), `ride-rotr.mp3` (Rise of the Resistance), `ride-railway.mp3` (Mickey & Minnie's Runaway
Railway), `ride-startours.mp3` (Star Tours), `ride-indy.mp3` (Indiana Jones Epic Stunt Spectacular!) and `ride-muppets.mp3`
(Muppet*Vision 3D); EPCOT has `ride-lwtl.mp3` (Living with the Land), `ride-soarin.mp3` (Soarin'),
`ride-spaceship.mp3` (Spaceship Earth), `ride-cosmic.mp3` (Cosmic Rewind), `ride-testtrack.mp3` (Test Track), `ride-missionspace.mp3`
(Mission: SPACE), `ride-remy.mp3` (Remy's Ratatouille Adventure), `ride-fiesta.mp3` (Gran Fiesta Tour) and `ride-seas.mp3` (The Seas with
Nemo & Friends); Hollywood Studios also has `ride-rnrc.mp3` (Rock 'n' Roller Coaster), and Magic Kingdom `ride-tron.mp3` (TRON Lightcycle / Run) `ride-buzz.mp3` (Buzz Lightyear's Space Ranger Spin) and `ride-jungle.mp3` (Jungle Cruise; the owner's Jingle Cruise ride-through with its first 1:30 cut).
**Ride the monorail.** Tap a Resort or Express line train and press **Ride in the front cab**: the map gives way to the view
out of the lead car's front window, a 3D scene built from the map data around the Seven Seas Lagoon (the ground, every
building in its land or resort colours, Space Mountain, the Contemporary's A-frame with the Grand Canyon Concourse inside it, the castle,
the trees, the beams and pylons and the other trains). The train eases into each station, opens its doors and moves on;
the panel shows the next stop, the onboard audio plays, and the sky and light follow the time of day. Drag to look around;
**Leave the monorail** (or Escape) brings the map back, following the train.
The **Disney Skyliner** runs between EPCOT, the Riviera, Caribbean Beach, Pop Century/Art of Animation and Hollywood Studios
on its real cables and pylons, its cabins gliding along each line from an hour before those parks open until an hour after
they close (lit after dark). Zoom in on a line to hear `ride-skyliner.mp3`.
Neighbouring lands blend at their edges, the music fades as you zoom out over the lakes, and while any show plays
its own music (a parade, the fireworks, the water pageant, Luminous, the welcome show, the Flag Retreat or the Kiss
Goodnight) the park's own sound fades right out: land music, ride audio, nature and the background crowd. It also
stops after closing. The Main
Street view always plays Main Street. "Area music" in the ☰ menu sets its volume. These files are Disney's
music and are kept out of git; a missing one is simply skipped.

## Christmas party fireworks

On Mickey's Very Merry Christmas Party nights the park shows Minnie's Wonderful Christmastime Fireworks instead
of Happily Ever After. With Live on, the site switches to it automatically when the park lists it for the night;
Entertainment → Fireworks show can also force either show. Its music goes at
`audio/minnies-christmas-fireworks.mp3`. The bursts were timed from that soundtrack by
`tools/fireworks_from_audio.py`, which can do the same for another show.

## The parade soundtrack

Put your copy of the parade music at:

    audio/festival-of-fantasy.mp3

(exactly that name). It starts when the parade steps off, stays in sync with it, loops if it's shorter
than the parade, and gets louder as floats come near. Without it the parade runs with a drum cadence.
As with the fireworks music, this is Disney's copyrighted audio: keep it on a private site.

## The Christmas parade

Once Upon a Christmastime steps off at 7:00 PM on dates from 8 November to 31 December, with its own
floats (a decorated tree, a gingerbread house, candy canes, a toy box, toy soldiers and a sleigh finale).
On any other date, Entertainment → "Watch the parade" plays it anyway. Put your copy of its music at:

    audio/once-upon-a-christmastime.mp3

It behaves like the Festival of Fantasy soundtrack, and it is also Disney's copyrighted audio.

## Bay Lake

The map runs east across Bay Lake: Wilderness Lodge, Discovery Island and the Fort Wilderness marina. Boats run
their real routes: Magic Kingdom to Fort Wilderness, Magic Kingdom to Wilderness Lodge, and the launch that
circles Fort Wilderness, the Contemporary and Wilderness Lodge. The large bare area on the east shore is a
construction site in the map data, drawn as it is. Fire Rock Geyser, beside Wilderness Lodge, erupts at the top of every hour
from 7 AM to 10 PM, about 120 feet high, as the real one does.

## EPCOT

Hollywood Studios is on the map too, south-west of EPCOT past the Swan and Dolphin, with the land around it (Caribbean

Animal Kingdom is on the map too, west of Hollywood Studios with all the land between, plus its resorts: Animal
Kingdom Lodge and Kidani Village, Coronado Springs, the All-Star resorts and Blizzard Beach. Its lands (Oasis, Discovery
Island, Pandora, Africa and Asia) have their own colours; the Tree of Life, Expedition Everest's snowy peaks, Pandora's
floating mountains and Blizzard Beach's Mount Gushmore are drawn by hand, and the safari trucks drive Kilimanjaro Safaris' road through the savannas past giraffes, zebras, elephants, rhinos, lions, hippos and more. Its rides, trails and shows have waits and
guests (the park opens 8 am to 7 pm unless Live gives today's hours), Live mode reads its real waits, and TV mode can
show it on its own (Sound & settings → TV mode → Animal Kingdom). Its map data is `ak.osm` (not committed).

Disney Springs is on the map as well, east of EPCOT past the land between them, with its lake, its shops in their mix of colours, the tethered balloon going up and down, and Typhoon Lagoon next door. It's scenery: guests in the simulation stay in the three parks.

The Friendship boats sail their real routes: from EPCOT's International Gateway past the BoardWalk, the Yacht & Beach Club and the Swan & Dolphin and down the canal to Hollywood Studios, and across World Showcase Lagoon from Showcase Plaza to Germany and to Morocco, pausing at each dock (shown only; no guests ride them). The map data comes from `springs.osm` (and `east.osm` for the land in between), downloaded from OpenStreetMap like the others.
Beach, Pop Century and Art of Animation): its seven areas, its rides and stage shows with live wait times, its own guests and
hours, and its landmarks (the Hollywood Tower Hotel, the Chinese Theatre, Rock 'n' Roller Coaster's guitar, Galaxy's Edge's
spires and the Millennium Falcon). TV mode visits it.
Fantasmic! plays in the Hollywood Hills Amphitheater at the real show times (8:00 and 9:30 PM most nights): the seats fill
with the Studios' guests, then Sorcerer Mickey on the mountain, the lit mist screen and fountains, the villains, the dragon
setting the lagoon on fire, the riverboat with the characters circling the island, and fireworks to finish. Add your own
copy of the soundtrack as audio/fantasmic.mp3 (or in Load audio folder) to hear it; it is never committed. With it, the show
follows the music: the lagoon stays dark through the opening announcement, each scene starts where the music changes, the
fountains pulse with its beats and the closing fireworks go up on them. Entertainment →
"Start Fantasmic! now" starts it any time.

EPCOT is on the map at its real place, south-east of the Magic Kingdom (scroll or zoom out to find it; TV mode
visits it too), drawn from OpenStreetMap: Spaceship Earth, The Land under its great glass roof, the other pavilions and each World Showcase
country in its own colours. All the land between and around the two parks is on the map too: the Ticket Center's
parking, World Drive and the highways, the EPCOT monorail line (four trains run it: from the Ticket Center round over
Future World into EPCOT's station and back, about 17 minutes a lap), golf courses, lakes and miles of forest (drawn as a
canopy of tree tops, painted as you look at it). The resorts on Crescent Lake, by EPCOT's back entrance, look like
themselves: the Yacht Club in grey-blue clapboard with its lighthouse on the dock, the Beach Club in sea-foam green with
Stormalong Bay's shipwreck, the BoardWalk's seaside facades and its wooden boardwalk along the shore, the Dolphin's coral
triangle tower with its cascade and two dolphin statues, and the Swan's arched block with a swan at each end. EPCOT has its own guests and wait times for its 18 main rides, in four neighbourhoods (World
Celebration, Discovery, Nature and Showcase) you can filter like the Magic Kingdom's lands. Its guests arrive at the
main entrance and stay in EPCOT; it keeps its own hours (9 AM to 9 PM, or today's real hours when live), and with live
data on, its waits and closures are the real ones too.

**Luminous: The Symphony of Us** plays on World Showcase Lagoon at EPCOT's closing time (today's real show time when
live): fireworks go up from barges and from all round the shore on the music's beats (the bigger ones in mirrored
pairs), each barge's fans of water jets rise and fall with the music in patterns that change with each section, the
bursts flash on the water, flame bursts from the barges on the biggest beats and searchlights rake the sky. EPCOT's guests gather round the promenade to watch. Put your copy of the soundtrack at
`audio/luminous.mp3` (or include it in Load audio folder); like the other Disney music it is never committed.
Animal Kingdom has **Tree of Life Awakenings** after dark: every quarter hour from half an hour after sunset until the park
closes, light washes over the Tree of Life, glowing spirit animals rise out of its bark and fireflies swirl through its
canopy. Its soundtrack is `audio/tree-of-life.mp3` (your own copy, never committed), heard when the map is close to the tree.
Entertainment lists today's showtimes, with **Jump to the next show**: the clock goes to just before it, at 1×, and the map
flies to the tree. When both
nighttime shows run at once, you hear the one the map is looking at, and TV mode cuts between them. To see it any time, press
**Start Luminous now** (in Entertainment, or on the show's star on the map): it starts a few seconds later, right
where the clock is, and the map flies to the lagoon.

## Crowds

Guests move as parties of one to six. Each party on the map stands for about 12 real guests, so a busy day has
around 2,500 parties (8,000 dots) in the park. They keep to the right, walk in a loose line behind a leader,
bunch up when they stop, slow down where it is crowded and step off the path to rest. Zoom in and tap a party
to see what it is doing, where it has been and when it plans to leave, or to follow it. The **Crowds** layer
(in the menu at the top) shows where people are gathered, from green to red, with a count for each land.

With Live on, the crowd follows the real park: arrivals scale with how long the real waits are, and guests
drift toward the rides whose real lines are longer, so the queues you see track the posted times.

## The day's rituals

- **Welcome show and rope drop:** in the last 50 minutes before opening, guests are let in as far as the hub.
  Five minutes before opening the characters appear on the castle stage, daytime fireworks go off, and the
  crowd spreads out to the rides.
- **Adventure Friends Cavalcade:** a short procession down the parade route at 11:05 AM and 1:15 PM.
- **Flag Retreat:** at 5:00 PM the flag comes down the Town Square pole while the band plays.
- **Kiss Goodnight:** half an hour after closing the castle shimmers for a few minutes.

With Live on, the cavalcade and Flag Retreat use the park's real times for the day.

## Characters

The parades carry drawn Disney characters: Mickey, Minnie, Donald, Daisy, Goofy, Pluto, Chip and Dale, Pooh
and Tigger, the princesses, Peter Pan and Captain Hook, and the villains at Halloween. Like the music, the
characters belong to Disney, so a private site is the safe place for this.

## The Electrical Water Pageant

Every night fourteen barges of lights cross Seven Seas Lagoon and Bay Lake, keeping the real timetable:
Polynesian Village 9:00 PM, Grand Floridian 9:15, Wilderness Lodge 9:35, Fort Wilderness 9:45 and the
Contemporary 10:10. (The Wilderness Lodge showing is cut short, because the barges need the time to reach
Fort Wilderness.)
Its music is heard when the map is near the barges, and goes at:

    audio/electrical-water-pageant.mp3

Entertainment → "Watch the pageant" jumps to the next showing.

## The Halloween parade

Boo to You steps off at 7:30 PM on dates from 15 August to 31 October, led by a headless horseman, with
a pumpkin patch, a haunted house, a bubbling cauldron, giant sweets and a spider's web, plus ghosts,
gravediggers, skeletons and scarecrows on foot. Its music goes at:

    audio/boo-to-you.mp3

## Running it on a Mac

Double-click **Start Simulator.command**. The first time, macOS may say it can't be opened:
right-click it → Open → Open. If macOS asks to install command line developer tools, click
Install, then double-click the file again. Keep the Terminal window open while you use the site.

## Running it on Windows

Double-click **Start Simulator.bat** to open the site, or **Start TV.bat** for TV mode: full screen in
Microsoft Edge (or Chrome) with sound, keeping the PC awake. Nothing needs installing; a small built-in
PowerShell script serves the files. If Windows warns about the file the first time, choose More info → Run
anyway. Press Alt+F4 in the full-screen window to stop. It opens on the main display, so make the TV the
main display or duplicate the screens. Copy the whole folder, including your audio files, to the PC.

## Putting it online (GitHub Pages)

The site works from GitHub Pages as it is (Settings → Pages → Deploy from a branch → main, / (root)). The Disney
music is never uploaded: it is Disney's, and a public site would be giving it away. To hear it on the hosted
site, open ☰ → **Load audio folder…** on each device (the TV included) and pick your `audio` folder. That
browser keeps the soundtracks and land music from then on. Use the same browser each time, and avoid private
windows, which don't keep anything.

## Running it anywhere else

Browsers block loading sound files from a page opened by double-clicking, so use a web
server. Locally, from this folder:

    python3 -m http.server 8000

then open http://localhost:8000. To publish, upload the whole folder as-is to any static
host (GitHub Pages, Netlify, your own server).

## Map data

The layout of the park and the resort area (buildings, walkways, roads, water, gardens, trees, lamps,
railroad, monorail beams and stations, ferry routes, parade route) comes from OpenStreetMap: © OpenStreetMap contributors, licensed under the ODbL
(https://www.openstreetmap.org/copyright). The credit shown in the corner of the map must stay visible.

To refresh the map after something changes, download the area again as `map.osm` into this folder and run:

    python3 tools/osm_extract.py

It rewrites js/park-osm.js. The area is too large for the Export button on openstreetmap.org; use the
Overpass API instead (for example https://overpass-turbo.eu → Export → raw OSM data). The exact query is
at the top of tools/osm_extract.py. map.osm is about 8 MB and is not kept in git.

## Sound effect credits

See Menu (☰) → Sound credits inside the app. Oculus Audio Pack 01 sounds are CC BY 4.0
(credit required — already shown in the app); the rest are CC0.
