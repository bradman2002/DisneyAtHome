#!/bin/bash
# Double-click to run the simulator on a Mac. Keep this window open while you use it.
cd "$(dirname "$0")"
PORT=8000
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "Magic Kingdom Simulator running at http://localhost:$PORT"
echo "Close this window (or press Control-C) to stop it."
(sleep 1; open "http://localhost:$PORT/?v=$(date +%s)") &
# A tiny web server (tools/serve.py): never cached, so you always get the newest files; music streams.
python3 tools/serve.py "$PORT"
