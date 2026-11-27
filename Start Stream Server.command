#!/bin/bash
# Double-click to run a private stream server on this Mac, for watching DisneyAtHome on an Apple TV (VLC) with its music.
# OBS sends the picture and sound here (Settings > Stream > Custom: rtmp://localhost/disney); the Apple TV plays it back.
# Nothing leaves your home network. Full setup: tools/stream/README.md, "Watching on Apple TV from a Mac".
# To stop: close this window (or press Control-C).
cd "$(dirname "$0")"
DIR="tools/stream/mac"
BIN="$DIR/bin/mediamtx"

# MediaMTX: use one that's installed (Homebrew), else the copy in tools/stream/mac/bin, else download it once
MTX="$(command -v mediamtx)"
if [ -z "$MTX" ] && [ ! -x "$BIN" ]; then
  echo "Downloading MediaMTX (one time, from github.com/bluenviron/mediamtx)..."
  TAG=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/bluenviron/mediamtx/releases/latest | sed 's#.*/tag/##')
  case "$(uname -m)" in arm64) ARCH=arm64 ;; *) ARCH=amd64 ;; esac
  mkdir -p "$DIR/bin"
  if [ -z "$TAG" ] || ! curl -fsSL "https://github.com/bluenviron/mediamtx/releases/download/$TAG/mediamtx_${TAG}_darwin_${ARCH}.tar.gz" | tar -xz -C "$DIR/bin" mediamtx; then
    echo "Couldn't download MediaMTX. Install it with Homebrew (brew install mediamtx) and try again."
    read -n 1 -s -r -p "Press any key to close."; exit 1
  fi
  xattr -d com.apple.quarantine "$BIN" 2>/dev/null
fi
[ -z "$MTX" ] && MTX="$BIN"

# the site's own web server on port 8000 for OBS's browser source, unless something is already serving it
if ! lsof -i :8000 >/dev/null 2>&1; then
  python3 tools/serve.py 8000 >/dev/null 2>&1 &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
fi
caffeinate -dis -w $$ &          # keep the Mac awake while the stream server runs

NAME="$(scutil --get LocalHostName 2>/dev/null || hostname -s).local"
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)"
cat <<MSG

DisneyAtHome stream server is running.

  OBS browser source:   http://localhost:8000/index.html?tv
  OBS Settings > Stream: Service "Custom...", Server rtmp://localhost/disney, Stream Key empty
  Then click Start Streaming in OBS.

  On the Apple TV, in VLC > Network Stream, open:
    http://$NAME:8888/disney/index.m3u8
  ${IP:+(or by address: http://$IP:8888/disney/index.m3u8)}

Leave this window open. Close it (or press Control-C) to stop.

MSG
"$MTX" "$DIR/mediamtx.yml"
