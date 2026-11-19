"""Journey Through the Unknown · cinematic sound design, synthesized (numpy) from events.json → out/mix.wav (48 kHz stereo).
Engine drone, space ambience, pads and a brass-like swell, cut hits, riser, held breath, the jump's boom and whoosh, the flash, the tail.
Also normalises the mix to about −14 LUFS (BS.1770 K-weighted, gated) with a true-peak-safe ceiling, so the mux only encodes.
Run: LIB=<library> "$LIB/.venv/bin/python" mix.py"""
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, sosfilt, butter, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add

rng = np.random.default_rng(11)
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']; N = int(round(DUR * SR)); TT = np.arange(N) / SR
E = {}
for e in ev['ev']: E.setdefault(e['type'], []).append(e)
T_HOLD0, T_JUMP, T_FLASH = 11.35, 11.75, 12.45


def nz(n): return rng.standard_normal(n)
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)


def stereo(x, pan=0.0, width=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    out = np.stack([x * l, x * r], 1)
    if width > 0:   # a little decorrelation: a few ms delay on one side
        d = int(.011 * SR); out[d:, 1] = out[d:, 1] * (1 - width) + x[:-d] * r * width
    return out


def reverb(x, secs=2.8, wet=.3, seed=3):
    r = np.random.default_rng(seed); n = int(secs * SR); tt = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(x.shape[1]):
        ir = r.standard_normal(n) * np.exp(-tt / (secs / 6.9)); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = fftconvolve(x[:, c], ir)[:len(x)]
    return x * (1 - wet) + out * wet


def saw(f, tt, phase=0.0):
    ph = np.cumsum(np.broadcast_to(f, tt.shape) / SR) + phase
    return 2 * (ph % 1) - 1


def pad(notes, d, cut=900, det=.12):
    tt = t_(d); x = np.zeros(len(tt))
    for m in notes:
        for k in (-det, 0, det):
            x += saw(mtof(m + k), tt, rng.random()) / len(notes)
    return lp(x, cut, 2)


# ——— the engine drone: amplitude and pitch over the whole film ———
amp = (.35 + .25 * ss(seg(TT, 1.6, 4.8))) * (TT < 5)
amp += (.6 + .2 * ss(seg(TT, 6, 10))) * ((TT >= 5) & (TT < 10))
amp += (.75 + .55 * ss(seg(TT, 10, T_HOLD0))) * ((TT >= 10) & (TT < T_HOLD0))
amp += .06 * ((TT >= T_HOLD0) & (TT < T_JUMP))
amp = lp(amp, 6)
pitch = 1 + .45 * ss(seg(TT, 10, T_HOLD0)) * (TT < T_JUMP)
f0 = 41.2 * pitch
drone = (np.sin(2 * np.pi * np.cumsum(f0) / SR) + .55 * np.sin(2 * np.pi * np.cumsum(2 * f0) / SR) + .3 * np.sin(2 * np.pi * np.cumsum(3 * f0) / SR)
         + .5 * np.sin(2 * np.pi * np.cumsum(f0 * 1.012) / SR))
hum = lp(saw(f0 * 2, TT), 380) * .2          # the throaty body
drone = (drone * .5 + hum) * amp * (TT < T_JUMP)
mix = stereo(drone * .16, 0, .4)

# ——— space ambience: a low wide wash + a faint high shimmer, ducked in the held breath ———
duck = 1 - .93 * ss(seg(TT, T_HOLD0 - .08, T_HOLD0)) * (TT < T_JUMP)
amb = np.stack([bp(nz(N), 90, 420), bp(nz(N), 90, 420)], 1) * .035
amb += np.stack([bp(nz(N), 5500, 9000), bp(nz(N), 5500, 9000)], 1) * .006
mix += amb * duck[:, None] * ss(seg(TT, 0, 1.2))[:, None]

# ——— music: pads and the brass-like swell (with a long reverb) ———
mus = np.zeros((N, 2))
def place(buf, x, at, gain=1.0, pan=0.0, width=.5):
    s = int(at * SR); x = stereo(x, pan, width); e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * gain
for e in E.get('swellLow', []):   # scene 1: D minor (add 9), slow swell
    d = 5.6; x = pad([50, 57, 64, 65, 69], d, 1400) * np.sin(np.pi * np.clip(t_(d) / (d * 1.05), 0, 1)) ** 1.5
    place(mus, x, e['t'], .55)
# scene 2: lift to B-flat major 7 over D
x = pad([53, 58, 62, 69, 74], 5.4, 1800) * ss(seg(t_(5.4), 0, .6)) * (1 - ss(seg(t_(5.4), 4.6, 5.4)))
place(mus, x, 5.0, .5)
# scene 3: brass-like swell, low-pass opening as the engines climb
for e in E.get('engineRise', []):
    d = T_HOLD0 - e['t'] + .05; tt = t_(d); x = np.zeros(len(tt))
    for m in [50, 57, 62, 65, 69]:
        for k in (-.08, 0, .08): x += saw(mtof(m + k), tt, rng.random()) / 5
    cut = 300 + 3200 * (tt / d) ** 2
    y = np.zeros_like(x); hop = 480
    for i in range(0, len(x), hop):
        c = cut[i]; blk = lp(x[max(0, i - 2400):i + hop], c, 2)[-min(hop, len(x) - i):]; y[i:i + len(blk)] = blk
    place(mus, y * (tt / d) ** 1.4, e['t'], .7)
# after the jump: the resolving D major chord, shimmering out
for e in E.get('tail', []):
    d = DUR - e['t']; tt = t_(d)
    x = pad([50, 57, 62, 66, 69, 74], d, 2600, .08) * ss(seg(tt, 0, .5)) * np.exp(-tt / 1.6)
    sh = sum(np.sin(2 * np.pi * f * tt + rng.random() * 6) * a for f, a in [(1174.7, .3), (1480, .22), (1760, .16), (2349, .1)]) * np.exp(-tt / 1.2) * .25
    place(mus, x + sh, e['t'], .55)
mus *= duck[:, None]
HOLD = (1 - .97 * ss(seg(TT, T_HOLD0 - .06, T_HOLD0 + .04)) * (TT < T_JUMP))[:, None]   # held breath: tails cut too
mix += reverb(mus, 3.2, .4) * HOLD

# ——— foley and hits ———
fx = np.zeros((N, 2))
def boom(d, f_hi, f_lo, v, tau):
    tt = t_(d); f = f_lo + (f_hi - f_lo) * np.exp(-tt / (d * .18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / tau)
    crack = lp(nz(len(tt)), 2500) * np.exp(-tt / .06) * .5
    return (.55 * body + .45 * np.tanh(3 * body) + crack) * v
for e in E.get('cutHit', []):
    place(fx, boom(1.6, 90, 38, .9, .45), e['t'], .7, 0, .3)
for e in E.get('pass', []):   # the ship's hum swelling as it clears the limb (a slow Doppler-ish filter sweep)
    d = e['dur']; tt = t_(d); x = bp(nz(len(tt)), 120, 900) * np.sin(np.pi * tt / d) ** 2
    place(fx, x * .35, e['t'], 1, e.get('pan', 0), .3)
for e in E.get('hullHum', []):   # close to the hull: machinery
    d = e['dur']; tt = t_(d); x = (lp(saw(55 + 3 * np.sin(tt * 1.3), tt), 600) * .25 + bp(nz(len(tt)), 300, 1400) * .4) * ss(seg(tt, 0, .8)) * (1 - ss(seg(tt, d - .3, d)))
    place(fx, x * .25, e['t'], 1, .2, .4)
for e in E.get('beep', []):
    tt = t_(.22); x = (np.sin(2 * np.pi * 1760 * tt) * (tt < .08) + np.sin(2 * np.pi * 2349 * tt) * (tt >= .12)) * np.exp(-((tt % .12) / .06))
    place(fx, x * .05, e['t'], 1, e.get('pan', 0), .2)
for e in E.get('servo', []):
    tt = t_(.9); f = 140 + 90 * tt; x = (lp(saw(f, tt), 1200) * .5 + bp(nz(len(tt)), 900, 2600) * .3) * np.sin(np.pi * tt / .9)
    place(fx, x * .12, e['t'], 1, e.get('pan', 0), .2)
for e in E.get('engineRise', []):   # roar climbing into the held breath
    d = T_HOLD0 - e['t']; tt = t_(d); n = nz(len(tt)); y = np.zeros_like(n); hop = 480
    for i in range(0, len(n), hop):
        c = 250 + 4000 * (i / len(n)) ** 2; blk = lp(n[max(0, i - 2400):i + hop], c, 2)[-min(hop, len(n) - i):]; y[i:i + len(blk)] = blk
    place(fx, y * (tt / d) ** 1.6 * .9, e['t'], 1, 0, .5)
# reverse swell inside the held breath, sucked into the jump
rev = np.zeros((N, 2)); tt = t_(.32); x = bp(nz(len(tt)), 400, 5000) * (tt / .32) ** 3
place(rev, x * .5, T_JUMP - .32, 1, 0, .5)
for e in E.get('boom', []):   # the loudest sound in the film
    place(fx, boom(3.2, 110, 26, 1.0, 1.1), e['t'], 1.2, 0, .5)
for e in E.get('whoosh', []):
    d = e['dur']; tt = t_(d); n = nz(len(tt)); y = np.zeros_like(n); hop = 480
    for i in range(0, len(n), hop):
        fc = 6000 * (1 - i / len(n)) + 300; blk = bp(n[max(0, i - 2400):i + hop], fc * .6, fc * 1.4)[-min(hop, len(n) - i):]; y[i:i + len(blk)] = blk
    place(fx, y * np.sin(np.pi * np.clip(tt / d, 0, 1)) * .8, e['t'], 1, 0, .6)
# hyperspace roar: fluttering band noise while the stars stream
tt = t_(13.8 - T_JUMP); n = nz(len(tt))
w = ss(seg(tt, 0, .45)) * (1 - ss(seg(tt, 13.8 - T_JUMP - 1.2, 13.8 - T_JUMP)))
place(fx, bp(n, 500, 4500) * w * (1 + .3 * np.sin(2 * np.pi * 7 * tt)) * .35, T_JUMP, 1, 0, .7)
for e in E.get('flash', []):
    tt = t_(2.4)
    x = sum(np.sin(2 * np.pi * f * tt + rng.random() * 6) * a * np.exp(-tt / tau) for f, a, tau in [(2093, .4, .9), (2960, .3, .7), (3951, .22, .5), (5587, .15, .35)])
    place(fx, x * .18 + np.pad(boom(1.2, 70, 40, .4, .3), (0, len(x) - int(round(1.2 * SR)))) * .5, e["t"], 1, 0, .5)
mix += reverb(fx, 2.2, .22, 7) * HOLD + rev

# fade out with the picture
mix *= (1 - ss(seg(TT, 14.45, 15.0)))[:, None]
mix = np.stack([hp(mix[:, 0], 22), hp(mix[:, 1], 22)], 1)
# low shelf: keep 20–120 Hz near −3 dB of the rest (TECHNIQUE.md §5)
from scipy.signal import sosfiltfilt
_sh = butter(2, 110, 'low', fs=SR, output='sos')
mix = mix - .78 * sosfiltfilt(_sh, mix, axis=0)   # zero-phase, so the subtraction is a clean shelf


# ——— loudness: BS.1770 K-weighting, gated integrated loudness → −14 LUFS, then a true-peak-safe soft ceiling ———
def k_weight(x):
    # stage 1: high shelf (+4 dB above ~1.5 kHz); stage 2: RLB high-pass (~38 Hz) — coefficients for 48 kHz from the standard
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, .73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, .99007225036621]
    from scipy.signal import lfilter
    return lfilter(b2, a2, lfilter(b1, a1, x))
def lufs(x):
    k = np.stack([k_weight(x[:, 0]), k_weight(x[:, 1])], 1)
    blk, hop = int(.4 * SR), int(.1 * SR)
    z = np.array([(k[i:i + blk] ** 2).mean(0).sum() for i in range(0, len(k) - blk, hop)])
    l = -.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]; rel = -.691 + 10 * np.log10(z.mean()) - 10
    z = z[(-.691 + 10 * np.log10(z)) > rel]
    return -.691 + 10 * np.log10(z.mean())
def true_peak(x): return np.abs(resample_poly(x, 4, 1, axis=0)).max()
def soft_limit(x, ceil):
    # smooth gain reduction with 5 ms look-ahead
    look = int(.005 * SR); pk = np.abs(x).max(1)
    pk = np.maximum.reduce([np.roll(pk, -i) for i in range(0, look, 16)])
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    sos = butter(1, 30, 'low', fs=SR, output='sos'); g = np.minimum(g, sosfilt(sos, g))
    return x * g[:, None]
for _ in range(4):
    L = lufs(mix); mix *= 10 ** ((-14 - L) / 20)
    mix = soft_limit(mix, 10 ** (-1.6 / 20))
L, TP = lufs(mix), 20 * np.log10(true_peak(mix))
OUTD = os.environ.get('OUTDIR', os.path.join(HERE, 'out')); os.makedirs(OUTD, exist_ok=True)
sf.write(os.path.join(OUTD, 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
# low-end balance check (20–120 Hz vs the rest)
spec = np.abs(np.fft.rfft(mix.mean(1))) ** 2; fr = np.fft.rfftfreq(len(mix), 1 / SR)
lo = 10 * np.log10(spec[(fr > 20) & (fr < 120)].mean() / spec[(fr > 120) & (fr < 8000)].mean())
print(f'mix.wav  {L:.1f} LUFS  true peak {TP:.1f} dBTP  low/rest {lo:.1f} dB (per-bin power)')
