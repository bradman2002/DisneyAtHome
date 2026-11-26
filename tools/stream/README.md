# Streaming DisneyAtHome to YouTube

One Docker container runs everything:

- a virtual 1080p screen and sound card;
- the site's own little web server;
- Chrome in kiosk TV mode (`?tv`);
- ffmpeg, sending the picture and sound to YouTube Live.

If Chrome or ffmpeg ever stops, the container restarts by itself.

## Before you start

**Turn on live streaming.** In [YouTube Studio](https://studio.youtube.com), click **Create → Go live**. The first time,
YouTube can take up to 24 hours to enable it.

**Copy your stream key.** Under **Stream**, copy the **Stream key**. Keep it private: anyone with it can stream to your
channel. Set **Stream latency** to Normal, and turn on **Enable Auto-start** and **Enable Auto-stop**. With those on,
the broadcast starts by itself whenever the container connects.

**Music and Content ID.** With `MUSIC=off`, the default, the stream has only the site's sound effects. These are
free-licensed recordings: crowd, birds, water, trains, fireworks bangs. With `MUSIC=on`, it also has the Disney
soundtracks, area loops and ride audio from your `audio/` folder. YouTube's Content ID will very likely match those. The
stream can then be muted or blocked, and the channel can get copyright strikes, which can take away live streaming.

**CPU.** The map is drawn without a graphics card, so streaming at 1920×1080 at 30 fps needs about 4 CPU cores for the
VM. At 1280×720 (`WIDTH=1280`, `HEIGHT=720`, `VIDEO_BITRATE=2500k`) it needs about 2.

## On the Ubuntu server

1. Install Docker (once):

   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker $USER    # then log out and back in
   ```

2. Get the site onto the server: clone your GitHub repository, or copy the folder over. If you want `MUSIC=on`, the
   `audio/` folder needs to be there too.

   ```bash
   git clone https://github.com/bradman2002/DisneyAtHome.git
   cd DisneyAtHome/tools/stream
   ```

3. Put in your stream key:

   ```bash
   cp .env.example .env
   nano .env        # set YOUTUBE_KEY=..., and change any other settings you want
   ```

4. Start it:

   ```bash
   docker compose up -d --build
   ```

   The first build downloads Chrome and ffmpeg, which takes a few minutes. About 25 seconds after the container
   starts, the stream appears in YouTube Studio.

## Everyday use

| What | Command (from `tools/stream`) |
|---|---|
| See what it's doing | `docker compose logs -f` |
| Stop streaming | `docker compose down` |
| Start again | `docker compose up -d` |
| After updating the site (`git pull`) | `docker compose restart` |
| After changing `.env` | `docker compose up -d` |
| Check CPU use | `docker stats` |

The site folder is mounted read-only, so after `git pull` a restart is enough. You only need `--build` again if the
Dockerfile or `stream.sh` changes. The container starts again after the server reboots (`restart: unless-stopped`).

## Both resorts

TV mode follows the sun. When Walt Disney World's parks close and Disneyland is still open (it's 3 hours behind), it moves over to
Disneyland, and it comes back when Walt Disney World opens in the morning. The board also has a "Meanwhile at …" card with the other
resort's time, hours, next big show and top waits. To keep the stream on one resort, add `&stay` to the address.

## Settings (`.env`)

| Setting | Meaning |
|---|---|
| `YOUTUBE_KEY` | your stream key (required) |
| `PAGE` | `index.html` (Walt Disney World) or `disneyland.html` (Disneyland) |
| `TV_PARK` | empty for all parks; `mk`, `ep`, `hs`, `ak` at Walt Disney World; `mk`, `ep` at Disneyland |
| `MUSIC` | `off` (sound effects only) or `on` (with the soundtracks) |
| `WIDTH`, `HEIGHT`, `FPS` | picture size and frame rate |
| `VIDEO_BITRATE`, `AUDIO_BITRATE` | YouTube suggests about 4500k for 1080p30 and 2500k for 720p30; write them as `…k` |
| `X264_PRESET` | `veryfast` by default; `superfast` or `ultrafast` if the CPU can't keep up |
| `RTMP_URL` | change it only to stream somewhere other than YouTube |
| `TZ` | time zone for the container; the site keeps the parks' own time itself |

## If something's wrong

- **YouTube says "no data", or the logs show `Connection refused` / `Input/output error`.** Check that the key is right,
  that live streaming is enabled on the channel, and that the server can reach the internet on port 1935.
- **The stream stutters, or YouTube says the bitrate is low.** The CPU can't keep up. Try 720p, a lower `FPS`
  (for example 24), or `X264_PRESET=superfast`. Watch `docker stats`.
- **There's no sound.** Look in `docker compose logs` for PulseAudio errors. Also note that with `MUSIC=off`, quiet
  moments really are quiet: only crowds and nature sounds are playing.
