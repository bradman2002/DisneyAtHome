#!/bin/bash
# Double-click to run the simulator on a Mac. Keep this window open while you use it.
cd "$(dirname "$0")"
PORT=8000
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "Magic Kingdom Simulator running at http://localhost:$PORT"
echo "Close this window (or press Control-C) to stop it."
(sleep 1; open "http://localhost:$PORT/?v=$(date +%s)") &
# A tiny web server that tells the browser never to cache, so you always get the newest files.
python3 - "$PORT" <<'PY'
import http.server, socketserver, sys
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
class Server(http.server.ThreadingHTTPServer):   # handles many requests at once (sounds load in parallel)
    allow_reuse_address = True
    request_queue_size = 64
    daemon_threads = True
with Server(('127.0.0.1', int(sys.argv[1])), NoCache) as s:
    s.serve_forever()
PY
