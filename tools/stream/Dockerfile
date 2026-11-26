# DisneyAtHome live stream: Chrome shows the site in TV mode on a virtual screen, ffmpeg sends picture and sound to YouTube.
# Built and run by docker-compose.yml in this folder; see README.md here.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium xvfb pulseaudio pulseaudio-utils ffmpeg python3 \
      fonts-noto-core fonts-noto-color-emoji fonts-liberation ca-certificates tzdata procps \
    && rm -rf /var/lib/apt/lists/*

# run everything as an ordinary user (Chrome and PulseAudio both prefer not to run as root)
RUN useradd -m -u 1000 streamer
COPY --chmod=755 stream.sh /usr/local/bin/stream.sh
USER streamer
WORKDIR /home/streamer

ENTRYPOINT ["/usr/local/bin/stream.sh"]
