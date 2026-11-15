"""Derive a fireworks choreography (used for Minnie's Wonderful Christmastime Fireworks) from a soundtrack (pure Python: no numpy here).
Output: a JS file defining CHOREO_MINNIE in the same format as choreo.js:
  cue = [burst time s, shell type, x -1..1, altitude 0..1, hue, size]; sec = section starts; pal = section hue pairs; env = loudness at 2 Hz."""
import wave, array, math, json, sys
# usage: afconvert -f WAVE -d LEI16@11025 -c 1 soundtrack.mp3 /tmp/s.wav   then   python3 tools/fireworks_from_audio.py /tmp/s.wav js/choreo-minnie.js
wav, out = sys.argv[1], sys.argv[2]
w = wave.open(wav); sr = w.getframerate(); n = w.getnframes()
x = array.array('h', w.readframes(n)); w.close()
HOP = 512; nf = n // HOP; fps = sr / HOP
E = []; D = []
for i in range(nf):
    seg = x[i*HOP:(i+1)*HOP]; e = 0.0; d = 0.0; p = seg[0]
    for v in seg: e += v*v; d += (v-p)*(v-p); p = v
    E.append(e/HOP); D.append(d/HOP)
L = [math.log10(e+1) for e in E]; B = [math.log10(d+1)-math.log10(e+1) for e, d in zip(E, D)]   # loudness, brightness
dur = n / sr; end = int(dur) - 1
# loudness at 2 Hz, normalised so the loud passages sit near 0.8
env = []
for k in range(int(dur*2)):
    a, b = int(k*fps/2), int((k+1)*fps/2); seg = E[a:b] or [0]
    env.append(math.sqrt(sum(seg)/len(seg)))
srt = sorted(env); hi = srt[int(len(srt)*.97)] or 1
env = [round(min(1, (v/hi)**.8), 2) for v in env]
# onset strength: rise of loudness over the recent past, weighted by brightness
O = [0.0]*nf
for i in range(8, nf):
    O[i] = max(0, L[i] - sum(L[i-8:i])/8) * (1 + max(0, B[i]))
# peak picking with an adaptive threshold
peaks = []; W = int(fps*1.5)
for i in range(6, nf-6):
    if O[i] <= 0 or O[i] != max(O[i-5:i+6]): continue
    win = O[max(0, i-W):i+W]; m = sum(win)/len(win); sd = math.sqrt(sum((v-m)**2 for v in win)/len(win))
    if O[i] > m + .8*sd: peaks.append((i/fps, O[i]))
pk = []
for t, s in peaks:
    if pk and t - pk[-1][0] < .28:
        if s > pk[-1][1]: pk[-1] = (t, s)
        continue
    pk.append((t, s))
# keep the strongest, about 0.8 a second overall, more where it is loud
smax = sorted(s for _, s in pk)[int(len(pk)*.98)] or 1
cand = sorted(pk, key=lambda p: -p[1] * (.4 + env[min(len(env)-1, int(p[0]*2))]))[:int(dur*.8)]
cand.sort()
# sections: the largest changes in the smoothed loudness, at least 30 s apart, about one a minute
sm = [sum(env[max(0, k-10):k+10])/len(env[max(0, k-10):k+10]) for k in range(len(env))]
nov = [(abs(sm[min(len(sm)-1, k+12)] - sm[max(0, k-12)]), k/2) for k in range(len(sm))]
secs = [0]
for v, t in sorted(nov, reverse=True):
    if t > 15 and t < end - 15 and all(abs(t - s) >= 30 for s in secs): secs.append(t)
    if len(secs) >= max(8, int(dur/60)): break
secs = sorted(round(s) for s in secs) + [end]
PAL = [[0,120],[45,0],[200,45],[120,45],[0,45],[200,0],[45,120],[330,200],[0,120],[45,200],[120,0],[200,330],[0,45],[45,0],[120,200],[0,120]]
def sec_of(t):
    i = 0
    while i < len(secs)-2 and t >= secs[i+1]: i += 1
    return i
bth = sorted(B)[int(len(B)*.85)]   # the brightest 15% of moments get strobes and crossettes
cues = []
for j, (t, s) in enumerate(cand):
    e = env[min(len(env)-1, int(t*2))]; f = min(1, s/smax); si = sec_of(t); pal = PAL[si % len(PAL)]
    br = B[min(nf-1, int(t*fps))]
    if e < .3: kind = ['comet', 'willow', 'mine', 'comet'][j % 4]
    elif f > .55 and e > .6: kind = ['chrys', 'peony', 'ring'][j % 3]
    elif br > bth: kind = ['strobe', 'crossette'][j % 2]
    else: kind = ['peony', 'comet', 'chrys', 'peony', 'willow', 'mine'][j % 6]
    phase = (t - secs[si]) / 6.0                                     # sweep left and right within a section
    xx = round(math.sin(phase + si) * .7 + (((j*37) % 11) / 11 - .5) * .4, 2)
    alt = round(min(1, max(.2, .3 + .6*e + (((j*53) % 7)/7 - .5)*.25)), 2) if kind != 'mine' else round(.2 + .3*e, 2)
    hue = pal[j % 2] + ((j*17) % 21) - 10
    size = round(.6 + .9*f*(.5 + .5*e), 2)
    cues.append([round(t, 2), kind, max(-1, min(1, xx)), alt, hue, size])
data = {'end': end, 'sec': secs, 'pal': [PAL[i % len(PAL)] for i in range(len(secs)-1)], 'cues': cues, 'env': env}
hdr = "/* Minnie's Wonderful Christmastime Fireworks choreography, derived from the soundtrack by tools/fireworks_from_audio.py\n   (beats + loudness), same format as choreo.js: cue = [burst time s, shell type, x -1..1, altitude 0..1, hue, size];\n   sec = section start times; pal = section hues (Christmas reds, greens, golds and icy blues); env = loudness at 2 Hz. */\n"
open(out, 'w').write(hdr + 'var CHOREO_MINNIE=' + json.dumps(data, separators=(',', ':')) + ';\n')
from collections import Counter
print('dur', round(dur), 'peaks', len(pk), 'cues', len(cues), 'sections', secs, Counter(c[1] for c in cues), 'env median', sorted(env)[len(env)//2])
