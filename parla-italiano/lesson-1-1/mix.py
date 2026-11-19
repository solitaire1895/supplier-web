"""Parla Italiano! Lesson 1.1: soundtrack → out/mix.wav (48 kHz stereo, about −14 LUFS).
Narration (your voice) + Italian TTS + an original toy-box score (music box, pizzicato, glockenspiel, soft bass, brushes)
+ paper foley from events.json (pops, page turns, blips, ticks...). Music ducks under every voice line.
Run: LIB=<library> "$LIB/.venv/bin/python" mix.py"""
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt, sosfiltfilt, lfilter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
from sfx import SR, t_, bp, lp, hp

rng = np.random.default_rng(5)
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; N = int(round((DUR + .5) * SR)); TT = np.arange(N) / SR
E = ev['ev']
def nz(n): return rng.standard_normal(n)
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def place(buf, x, at, gain=1., pan=0.):
    s = int(at * SR); l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    if s >= len(buf) or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    e = min(len(buf), s + len(x)); buf[s:e, 0] += x[:e - s] * gain * l; buf[s:e, 1] += x[:e - s] * gain * r
def load(path):
    a, sr = sf.read(path, dtype='float32'); a = a.mean(1) if a.ndim > 1 else a
    return resample_poly(a, SR, sr) if sr != SR else a
def compress(x, thr=.18, ratio=3.):
    env = np.abs(x); env = lfilter([.002], [1, -.998], env)
    g = np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1.); return x * g
def reverb(x, secs=1.6, wet=.18, seed=3):
    r = np.random.default_rng(seed); n = int(secs * SR); tt = np.arange(n) / SR; out = np.zeros_like(x)
    for c in range(2):
        ir = r.standard_normal(n) * np.exp(-tt / (secs / 6.9)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum()); out[:, c] = fftconvolve(x[:, c], ir)[:len(x)]
    return x * (1 - wet) + out * wet

# ---------- voices ----------
voice = np.zeros((N, 2)); vmask = np.zeros(N)
for e in E:
    if e['type'] not in ('vo', 'it'): continue
    a = load(os.path.join(HERE, 'vo' if e['type'] == 'vo' else 'it', e['id'] + '.wav'))
    a = hp(a, 85); a = compress(a / (np.abs(a).max() + 1e-9) * .9)
    rms = np.sqrt(np.mean(a[np.abs(a) > .02] ** 2) + 1e-12); a *= .16 / rms           # every line at the same level
    if e['type'] == 'it': a *= .95
    place(voice, a, e['t'], 1., 0.)
    s = int(e['t'] * SR); vmask[s:s + len(a)] = 1
duck = 1 - .72 * np.clip(lfilter([.0004], [1, -.9996], np.convolve(vmask, np.ones(4800) / 4800, 'same')) * 2.5, 0, 1)

# ---------- score: toy box in F major, 104 bpm ----------
BPM = 104; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [46, 50, 53], [48, 52, 55]]   # F C Dm Bb F C Bb C
MEL = [[72, 0, 1], [74, 1, .5], [76, 1.5, .5], [77, 2, 1], [76, 3, 1], [74, 4, 1.5], [72, 5.5, .5], [69, 6, 2],
       [70, 8, 1], [72, 9, .5], [74, 9.5, .5], [76, 10, 1], [74, 11, 1], [72, 12, 1], [70, 13, 1], [72, 14, 2]]   # beats within 4 bars
def musicbox(f, d, v=1.):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * k * tt + rng.random()) * np.exp(-tt * (2.6 + k * 1.4)) for k, a in [(1, 1), (2.01, .35), (3.98, .18), (5.4, .06)]) * v
def pluck(f, d, v=1.):   # Karplus–Strong pizzicato
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return lp(out, 3000) * v * np.exp(-t_(d) * 2.2)
def glock(f, d=1.2, v=1.):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 3.2) * v
def bass(f, d, v=1.):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + .25 * np.sin(4 * np.pi * f * tt)) * np.minimum(1, tt * 40) * np.exp(-tt * 1.6) * v
mus = np.zeros((N, 2))
start = next(e['t'] for e in E if e['type'] == 'music'); end = next(e['t'] for e in E if e['type'] == 'closeBook')
bars = int((end - start) / BAR) + 1
for b in range(bars):
    t0 = start + b * BAR; ch = PROG[b % 8]
    if t0 > end: break
    place(mus, bass(mtof(ch[0] - 12), BAR * .9, .55), t0, 1, 0)
    place(mus, bass(mtof(ch[0] - 12 + 7), BEAT * 1.8, .35), t0 + 2 * BEAT, 1, 0)
    for k in range(4):                                     # pizzicato off-beat chords
        for j, m in enumerate(ch): place(mus, pluck(mtof(m), .35, .22), t0 + k * BEAT + BEAT / 2 + j * .012, 1, -.35 + j * .3)
    for k in range(8): place(mus, bp(nz(int(.06 * SR)), 2500, 8000) * np.exp(-t_(.06) * 60) * (.05 if k % 2 else .03), t0 + k * BEAT / 2, 1, .2)   # brushes
    # melody: one 4-bar phrase per 4 bars, alternating the two halves
    if b % 4 == 0 and b >= 1:
        half = (b // 4) % 2
        for m, bt, d in MEL[half * 8:(half + 1) * 8]:
            bt2 = bt - 8 * half
            if t0 + bt2 * BEAT < end - .5: place(mus, musicbox(mtof(m), d * BEAT + .8, .32), t0 + bt2 * BEAT, 1, .25)
# final chord on the close
for j, m in enumerate([65, 69, 72, 77]): place(mus, musicbox(mtof(m), 2.5, .3), end + j * .07, 1, -.3 + j * .2)
place(mus, bass(mtof(41), 2.5, .6), end, 1, 0)
mus = reverb(mus, 1.8, .25) * duck[:, None]
# music fades in at the start
mus *= ss(seg(TT, 0, 1.0))[:, None]

# ---------- paper foley ----------
fx = np.zeros((N, 2))
def crinkle(d, v): n = int(d * SR); x = bp(nz(n), 1800, 7000) * (rng.random(n) < .08) * 3; return lp(x, 9000) * np.exp(-t_(d) * 14) * v
def pop(v=1.):
    tt = t_(.18); s = np.sin(2 * np.pi * np.cumsum(900 - 2800 * tt) / SR) * np.exp(-tt * 30) * .5
    return (s + crinkle(.18, .5)) * v
def swish(d=.5, v=1.):
    n = int(d * SR); x = nz(n); y = np.zeros(n); hop = 480
    for i in range(0, n, hop):
        f = 600 + 5000 * (i / n); blk = bp(x[max(0, i - 2400):i + hop], f * .6, f * 1.4)[-min(hop, n - i):]; y[i:i + len(blk)] = blk
    return y * np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) * v
def thump(v=1.): tt = t_(.25); return (np.sin(2 * np.pi * np.cumsum(140 - 300 * tt) / SR) * np.exp(-tt * 18) + lp(nz(len(tt)), 600) * np.exp(-tt * 30) * .4) * v
def tink(f=2600, v=1.): tt = t_(.6); return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 9) * v
def blip(f, v=1.): tt = t_(.05); return np.sign(np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 70) * v * .5
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'pop': place(fx, pop(.35), t, 1, e.get('pan', 0))
    elif ty == 'turn': place(fx, swish(.7, .55), t, 1, -.2); place(fx, crinkle(.5, .5), t + .1, 1, .3); place(fx, thump(.25), t + .7, 1, 0)
    elif ty == 'open': place(fx, swish(.8, .4), t, 1, 0); place(fx, thump(.5), t + .85, 1, 0)
    elif ty == 'closeBook': place(fx, swish(.6, .4), t, 1, 0); place(fx, thump(.8), t + .9, 1, 0)
    elif ty == 'plink': place(fx, tink(1800, .25), t, 1, .4); place(fx, thump(.15), t, 1, .4)
    elif ty == 'swish': place(fx, swish(.6, .6), t, 1, 0); place(fx, pop(.3), t + .6, 1, 0)
    elif ty == 'scooter':
        d = 1.8; tt = t_(d); f = 85 + 25 * np.sin(2 * np.pi * 11 * tt); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + bp(nz(len(tt)), 300, 1500) * .3
        place(fx, lp(x, 1800) * np.sin(np.pi * np.clip(tt / d, 0, 1)) * .32, t, 1, 0)
    elif ty == 'keytink': place(fx, tink(3100, .35), t, 1, -.3)
    elif ty == 'tink': place(fx, tink(2400, .18), t, 1, .2)
    elif ty == 'stamp': place(fx, thump(.8), t, 1, 0); place(fx, crinkle(.2, .7), t, 1, 0)
    elif ty == 'tick': place(fx, bp(nz(int(.03 * SR)), 2000, 6000) * np.exp(-t_(.03) * 120) * .5, t, 1, 0)
    elif ty == 'ding': place(fx, glock(mtof(84), 1.4, .45), t, 1, 0); place(fx, glock(mtof(88), 1.4, .35), t + .08, 1, 0)
    elif ty == 'sparkle':
        for j, m in enumerate([84, 88, 91, 96]): place(fx, glock(mtof(m), 1., .22), t + j * .07, 1, -.4 + j * .25)
    elif ty == 'bubble':
        f0 = 260 if e['who'] == 'orso' else 520; n = e['n']; d = e['dur']
        for k in range(0, n, 2): place(fx, blip(f0 * (1 + .12 * ((k * 7) % 5) / 5), .07), t + d * k / max(1, n), 1, -.2 if e['who'] == 'orso' else .2)
fx = reverb(fx, 1.0, .12, 7)

mix = voice + mus * .55 + fx * .8
mix *= (1 - ss(seg(TT, DUR - .3, DUR + .3)))[:, None]
mix = np.stack([hp(mix[:, 0], 30), hp(mix[:, 1], 30)], 1)

# ---------- loudness: BS.1770 gated → −14 LUFS, soft ceiling ----------
def k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, .73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, .99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x))
def lufs(x):
    k = np.stack([k_weight(x[:, 0]), k_weight(x[:, 1])], 1); blk, hop = int(.4 * SR), int(.1 * SR)
    z = np.array([(k[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(k) - blk, hop)])
    z = z[-.691 + 10 * np.log10(z + 1e-12) > -70]; rel = -.691 + 10 * np.log10(z.mean()) - 10
    z = z[(-.691 + 10 * np.log10(z)) > rel]; return -.691 + 10 * np.log10(z.mean())
def soft_limit(x, ceil):
    look = int(.005 * SR); pk = np.abs(x).max(1); pk = np.maximum.reduce([np.roll(pk, -i) for i in range(0, look, 16)])
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9)); sos = butter(1, 30, 'low', fs=SR, output='sos'); g = np.minimum(g, sosfilt(sos, g)); return x * g[:, None]
for _ in range(4):
    L = lufs(mix); mix *= 10 ** ((-14 - L) / 20); mix = soft_limit(mix, 10 ** (-2.4 / 20))
L, TP = lufs(mix), 20 * np.log10(np.abs(resample_poly(mix, 4, 1, axis=0)).max())
OUTD = os.environ.get('OUTDIR', os.path.join(HERE, 'out')); os.makedirs(OUTD, exist_ok=True)
sf.write(os.path.join(OUTD, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR, subtype='PCM_24')
print(f'mix.wav  {L:.1f} LUFS  true peak {TP:.1f} dBTP  ({DUR:.1f} s)')
