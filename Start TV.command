#!/bin/bash
# Double-click to run the simulator in TV mode on this Mac: full screen, running by itself, with sound.
# If a TV or second screen is connected it opens there; otherwise on the Mac's own screen.
# To stop: press Command-Q in the full-screen window (this window then closes the server too).
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8000
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
URL="http://localhost:$PORT/?tv&v=$(date +%s)"

# the same tiny no-cache web server as Start Simulator.command, in the background
python3 - "$PORT" <<'PY' &
import http.server, sys
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    request_queue_size = 64
    daemon_threads = True
with Server(('127.0.0.1', int(sys.argv[1])), NoCache) as s:
    s.serve_forever()
PY
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
caffeinate -dis -w $$ &          # keep the Mac and its screen awake while this is running
sleep 1

if [ ! -x "$CHROME" ]; then
  # no Chrome: open the default browser instead (click the page once, then press T, for full screen and sound)
  echo "Google Chrome not found. Opening your default browser: click the page once and press T."
  open "$URL"
  echo "Leave this window open. Close it (or press Control-C) to stop."
  wait $SERVER
  exit
fi

# where to put the window: the top-left corner of the second screen if there is one, else of the main screen
POS=$(osascript -l JavaScript -e 'ObjC.import("AppKit");var s=$.NSScreen.screens,m=s.objectAtIndex(0).frame,t=s.objectAtIndex(s.count>1?1:0).frame;Math.round(t.origin.x)+","+Math.round(m.size.height-(t.origin.y+t.size.height))' 2>/dev/null)
echo "Magic Kingdom Simulator: TV mode at $URL"
echo "Press Command-Q in the full-screen window to stop."
# its own Chrome profile, so this never touches your normal Chrome windows; kiosk = full screen with no browser bars;
# the autoplay setting lets the sound start without a click
"$CHROME" --user-data-dir="$HOME/Library/Application Support/MagicKingdomTV" --no-first-run --no-default-browser-check \
  --kiosk --window-position="${POS:-0,0}" --autoplay-policy=no-user-gesture-required --disable-session-crashed-bubble \
  "$URL" >/dev/null 2>&1
