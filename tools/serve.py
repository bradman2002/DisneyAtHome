"""The tiny local web server used by "Start Simulator.command" and "Start TV.command" (and handy on its own):
   python3 tools/serve.py [port]      (run from the site folder; default port 8000)
It tells the browser never to cache, so you always get the newest files, and it answers byte-range requests, so
long music files stream and the player can jump straight to any point in them instead of downloading the whole
file into memory first."""
import http.server, os, re, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.webmanifest':'application/manifest+json','.js':'text/javascript','.mjs':'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, *a): pass

    def send_head(self):
        m = re.match(r'^bytes=(\d*)-(\d*)$', self.headers.get('Range', '').strip())
        path = self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        if a == '' and b == '':
            return super().send_head()
        if a == '':  # the last b bytes
            start, end = max(0, size - int(b)), size - 1
        else:
            start, end = int(a), min(int(b), size - 1) if b else size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None:
            return super().copyfile(src, dst)
        try:
            while left > 0:
                buf = src.read(min(65536, left))
                if not buf:
                    break
                dst.write(buf)
                left -= len(buf)
        except (BrokenPipeError, ConnectionResetError):
            pass  # the browser hung up mid-file (normal when it skips through music)
        finally:
            self._left = None


class Server(http.server.ThreadingHTTPServer):  # handles many requests at once (sounds load in parallel)
    allow_reuse_address = True
    request_queue_size = 64
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with Server(('127.0.0.1', port), Handler) as s:
        s.serve_forever()
