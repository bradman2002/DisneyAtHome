#!/bin/bash
# Runs inside the container: a virtual screen and sound card, the site's own server, Chrome in kiosk TV mode, and ffmpeg
# sending the screen and the sound to YouTube. If Chrome or ffmpeg stops, the script exits and Docker restarts the container.
set -u

: "${YOUTUBE_KEY:?Set YOUTUBE_KEY in .env (YouTube Studio > Go live > Stream > Stream key)}"
W="${WIDTH:-1920}"; H="${HEIGHT:-1080}"; FPS="${FPS:-30}"
VBIT="${VIDEO_BITRATE:-4500k}"; ABIT="${AUDIO_BITRATE:-160k}"
PRESET="${X264_PRESET:-veryfast}"
URL_RTMP="${RTMP_URL:-rtmp://a.rtmp.youtube.com/live2}"
PAGE="${PAGE:-index.html}"            # index.html = Walt Disney World, disneyland.html = Disneyland
PARK="${TV_PARK:-}"                   # empty = all parks; mk, ep, hs or ak at WDW (mk/ep at Disneyland)
MUSIC="${MUSIC:-off}"                 # off = sound effects only (safe for YouTube); on = the soundtracks too

Q="tv"; [ -n "$PARK" ] && Q="tv=$PARK"
[ "$MUSIC" != "on" ] && Q="$Q&nomusic"
PAGEURL="http://127.0.0.1:8000/$PAGE?$Q"

export DISPLAY=:99
rm -f /tmp/.X99-lock
Xvfb :99 -screen 0 "${W}x${H}x24" -nolisten tcp -ac &
for i in $(seq 1 50); do [ -e /tmp/.X11-unix/X99 ] && break; sleep 0.2; done

# a sound card with nowhere to play: ffmpeg records what Chrome sends to it
pulseaudio --daemonize=yes --exit-idle-time=-1 --log-target=stderr
for i in $(seq 1 50); do pactl info >/dev/null 2>&1 && break; sleep 0.2; done
pactl load-module module-null-sink sink_name=stream sink_properties=device.description=stream >/dev/null
pactl set-default-sink stream

# the site, served the same way as on the Mac (no caching, byte ranges for the long music files)
( cd /site && exec python3 tools/serve.py 8000 ) &
for i in $(seq 1 50); do (echo > /dev/tcp/127.0.0.1/8000) 2>/dev/null && break; sleep 0.2; done

echo "Opening $PAGEURL at ${W}x${H}, ${FPS} fps"
chromium --no-sandbox --kiosk --start-fullscreen --window-position=0,0 --window-size="$W,$H" \
  --user-data-dir=/home/streamer/chrome --no-first-run --no-default-browser-check --noerrdialogs \
  --disable-infobars --disable-session-crashed-bubble --disable-translate --disable-features=Translate,MediaRouter \
  --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling \
  --disable-renderer-backgrounding --disable-backgrounding-occluded-windows \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
  --check-for-update-interval=31536000 "$PAGEURL" >/dev/null 2>&1 &
CHROME=$!

sleep "${WARMUP:-25}"   # let the map paint and TV mode start before going live

ffmpeg -hide_banner -loglevel warning -thread_queue_size 512 \
  -f x11grab -draw_mouse 0 -framerate "$FPS" -video_size "${W}x${H}" -i :99 \
  -thread_queue_size 512 -f pulse -i stream.monitor \
  -c:v libx264 -preset "$PRESET" -tune zerolatency -pix_fmt yuv420p -r "$FPS" -g "$((FPS*2))" \
  -b:v "$VBIT" -maxrate "$VBIT" -bufsize "$((${VBIT%k}*2))k" \
  -c:a aac -b:a "$ABIT" -ar 44100 -ac 2 \
  -f flv "$URL_RTMP/$YOUTUBE_KEY" &
FF=$!

# if either stops, stop the container (Docker's restart policy brings it back)
wait -n "$CHROME" "$FF"
echo "Chrome or ffmpeg stopped; exiting so Docker restarts the stream"
kill "$CHROME" "$FF" 2>/dev/null
exit 1
