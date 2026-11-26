"""
Audio for the channel: Kokoro voices, word timestamps (Whisper), voice effects,
generated (copyright-free) music cues, synthesized sound effects and the final mix.
"""
import hashlib
import json
import math
import os
import re
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "build", "tts")
os.makedirs(CACHE, exist_ok=True)
KOKORO_DIR = os.environ.get("KOKORO_DIR", "/tmp/claude-0/-home-user-bookish-octo-palm-tree/"
                            "a014b4f3-0de3-5f09-b465-e24ff547bf22/scratchpad/kokoro")
VOICES = {"N": ("am_michael", 0.96), "C": ("am_puck", 1.04)}

_kok = None
_whisper = None


def kokoro():
    global _kok
    if _kok is None:
        from kokoro_onnx import Kokoro
        _kok = Kokoro(os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
    return _kok


def resample(a, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return a.astype(np.float32)
    g = math.gcd(sr_in, sr_out)
    return signal.resample_poly(a, sr_out // g, sr_in // g).astype(np.float32)


def tts(voice_key, text, speed=None):
    voice, sp = VOICES[voice_key]
    sp = speed or sp
    key = hashlib.md5(f"{voice}|{sp}|{text}".encode()).hexdigest()[:14]
    path = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(path):
        a, sr = kokoro().create(text, voice=voice, speed=sp, lang="en-us")
        sf.write(path, a, sr)
    a, sr = sf.read(path, dtype="float32")
    idx = np.nonzero(np.abs(a) > 0.008)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.015 * sr)): idx[-1] + int(0.09 * sr)]
    a = resample(a, sr)
    return a / max(0.05, np.abs(a).max()) * 0.9


def _norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


NUM_WORDS = {"1966": "nineteen sixty six", "1977": "nineteen seventy seven", "2013": "twenty thirteen"}


def align(audio, display_text):
    """Word timings for display_text, from Whisper word timestamps on the generated audio."""
    global _whisper
    key = hashlib.md5((display_text + str(len(audio))).encode()).hexdigest()[:14]
    path = os.path.join(CACHE, key + ".align.json")
    words = [w for w in display_text.replace("*", "").split()]
    if os.path.exists(path):
        return json.load(open(path))
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("base.en", device="cpu", compute_type="int8")
    a16 = resample(audio, SR, 16000)
    segs, _ = _whisper.transcribe(a16, beam_size=1, word_timestamps=True, language="en")
    heard = [(w.word, w.start, w.end) for s in segs for w in (s.words or [])]
    # expand display words into the tokens they are spoken as (e.g. 1966 -> nineteen sixty six)
    tokens, owner = [], []
    for i, w in enumerate(words):
        n = _norm(w)
        for tkn in NUM_WORDS.get(n, n).split():
            tokens.append(tkn)
            owner.append(i)
    import difflib
    hn = [_norm(h[0]) for h in heard]
    sm = difflib.SequenceMatcher(a=tokens, b=hn, autojunk=False)
    t_start = [None] * len(words)
    t_end = [None] * len(words)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            i = owner[blk.a + k]
            h = heard[blk.b + k]
            t_start[i] = h[1] if t_start[i] is None else min(t_start[i], h[1])
            t_end[i] = h[2] if t_end[i] is None else max(t_end[i], h[2])
    total = len(audio) / SR
    known = [i for i in range(len(words)) if t_start[i] is not None]
    for i in range(len(words)):
        if t_start[i] is None:
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            a0 = t_end[prev] if prev is not None else 0.0
            a1 = t_start[nxt] if nxt is not None else total
            gap = [k for k in range(len(words)) if (prev is None or k > prev) and (nxt is None or k < nxt)]
            pos = gap.index(i)
            step = (a1 - a0) / max(1, len(gap))
            t_start[i], t_end[i] = a0 + pos * step, a0 + (pos + 1) * step
    res = [[words[i], float(t_start[i]), float(t_end[i])] for i in range(len(words))]
    json.dump(res, open(path, "w"))
    return res


def envelope(a, fps=60):
    hop = SR // fps
    n = max(1, len(a) // hop)
    rms = np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1))
    return np.clip(rms / max(np.percentile(rms, 92), 1e-4), 0, 1)


# ----------------------------------------------------------------------------- voice effects
def fx_inner(a):
    """Roughly how you hear yourself: extra low end (bone conduction) and a softer top."""
    b, aa = signal.butter(2, 320 / (SR / 2), "low")
    low = signal.lfilter(b, aa, a)
    b2, a2 = signal.butter(2, 7000 / (SR / 2), "low")
    out = signal.lfilter(b2, a2, a + 1.35 * low)
    return (out / max(1e-6, np.abs(out).max()) * 0.9).astype(np.float32)


def fx_recorded(a):
    """Roughly a phone recording: thin, band-limited, slightly compressed."""
    b, aa = signal.butter(4, [330 / (SR / 2), 3900 / (SR / 2)], "band")
    out = signal.lfilter(b, aa, a)
    out = np.tanh(out * 2.2) / np.tanh(2.2)
    out += np.random.default_rng(3).normal(0, 0.004, len(out))
    return (out / max(1e-6, np.abs(out).max()) * 0.85).astype(np.float32)


# ----------------------------------------------------------------------------- music
def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def _add(buf, at, sig, pan=0.0, g=1.0):
    s = int(at * SR)
    if s >= buf.shape[0] or s + len(sig) <= 0:
        return
    if s < 0:
        sig = sig[-s:]
        s = 0
    e = min(buf.shape[0], s + len(sig))
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    buf[s:e, 0] += sig[: e - s] * g * l * 1.414
    buf[s:e, 1] += sig[: e - s] * g * r * 1.414


def _t(d):
    return np.arange(int(d * SR)) / SR


def piano(f, dur, vel):
    x = _t(dur)
    out = np.zeros_like(x)
    for h, amp in ((1, 1.0), (2, 0.42), (3, 0.2), (4, 0.1), (5, 0.05)):
        out += amp * np.sin(2 * np.pi * f * h * x * (1 + 0.0004 * h)) * np.exp(-x * (1.1 + 0.55 * h))
    return out * np.minimum(1, x / 0.004) * vel


def epiano(f, dur, vel):
    x = _t(dur)
    car = np.sin(2 * np.pi * f * x + 1.3 * np.exp(-x * 5) * np.sin(2 * np.pi * f * x))
    return car * np.minimum(1, x / 0.005) * np.exp(-x * 1.4) * vel


def pluck(f, dur, vel):
    x = _t(dur)
    s = np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 4 * f * x) * np.exp(-x * 14)
    return s * np.minimum(1, x / 0.002) * np.exp(-x * 7) * vel


def bell(f, dur, vel):
    x = _t(dur)
    s = np.sin(2 * np.pi * f * x + 2.0 * np.exp(-x * 3) * np.sin(2 * np.pi * f * 3.5 * x))
    return s * np.minimum(1, x / 0.003) * np.exp(-x * 2.2) * vel


def pad(freqs, dur, vel, bright=0.3):
    x = _t(dur)
    out = np.zeros_like(x)
    for f in freqs:
        for det in (-0.35, 0.35):
            out += np.sin(2 * np.pi * (f + det) * x) + bright * np.sin(2 * np.pi * 2 * (f + det) * x + 0.6)
    env = np.clip(np.minimum(x / 0.9, (dur - x) / 0.9), 0, 1)
    return out * env * vel / len(freqs)


def kick(vel):
    x = _t(0.28)
    return np.sin(2 * np.pi * np.cumsum(42 + 80 * np.exp(-x * 32)) / SR) * np.exp(-x * 13) * vel


def hat(vel, rng):
    x = _t(0.05)
    n = rng.normal(0, 1, len(x))
    n = n - np.convolve(n, np.ones(4) / 4, "same")
    return n * np.exp(-x * 90) * vel


def brush(vel, rng):
    x = _t(0.16)
    return np.convolve(rng.normal(0, 1, len(x)), np.ones(10) / 10, "same") * np.exp(-x * 22) * vel


CUES = {
    # name: (bpm, chords (midi), style)
    "mystery":   (70, [[57, 60, 64, 71], [53, 57, 60, 64], [50, 53, 57, 64], [52, 56, 59, 62]], "mystery"),
    "curious":   (96, [[60, 64, 67, 71], [62, 66, 69, 72], [64, 67, 71, 74], [57, 60, 64, 67]], "curious"),
    "discovery": (100, [[62, 66, 69, 76], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]], "discovery"),
    "emotional": (72, [[53, 57, 60, 64], [57, 60, 64, 67], [55, 59, 62, 67], [48, 52, 55, 59]], "emotional"),
    "uplift":    (92, [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], "uplift"),
}


def music_cue(name, dur, seed=0):
    bpm, chords, style = CUES[name]
    rng = np.random.default_rng(seed + len(name))
    beat = 60 / bpm
    bar = 4 * beat
    buf = np.zeros((int(dur * SR) + SR, 2), np.float32)
    nb = int(dur / bar) + 2
    for b in range(nb):
        t0 = b * bar
        ch = chords[b % 4]
        root = ch[0] - 24 if style != "mystery" else ch[0] - 24
        _add(buf, t0, pad([mtof(m) for m in ch], bar + 0.9, 0.055 if style != "emotional" else 0.04, 0.25), pan=0)
        bx = _t(bar)
        bass = (np.sin(2 * np.pi * mtof(root) * bx) + 0.2 * np.sin(2 * np.pi * 2 * mtof(root) * bx)) * np.minimum(1, bx / 0.03) * np.exp(-bx * 0.5)
        _add(buf, t0, bass, 0, 0.13 if style != "mystery" else 0.09)
        if style == "mystery":
            for k in range(2):
                m = [69, 72, 76, 79, 81][rng.integers(0, 5)]
                _add(buf, t0 + k * 2 * beat + rng.uniform(0, 0.2), bell(mtof(m), 3.0, 0.05), rng.uniform(-0.6, 0.6))
        elif style == "curious":
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            for k, idx in enumerate(pattern):
                m = ch[idx] + 12
                _add(buf, t0 + k * beat / 2, pluck(mtof(m), 0.6, 0.075 * (1.0 if k % 2 == 0 else 0.7)), -0.35 + 0.1 * (k % 4))
            for k in range(8):
                _add(buf, t0 + k * beat / 2, hat(0.025 if k % 2 else 0.035, rng), 0.4)
            for k in (0, 2):
                _add(buf, t0 + k * beat, kick(0.2), 0)
        elif style == "discovery":
            seq = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 1, 2]
            for k, idx in enumerate(seq):
                m = ch[idx] + 12
                _add(buf, t0 + k * beat / 4, pluck(mtof(m), 0.35, 0.05), 0.3 if k % 2 else -0.3)
            for k in range(4):
                _add(buf, t0 + k * beat, kick(0.16), 0)
                _add(buf, t0 + k * beat + beat / 2, hat(0.03, rng), 0.3)
        elif style == "emotional":
            for k, m in enumerate(ch):
                _add(buf, t0 + k * 0.03, piano(mtof(m), 3.5, 0.06), -0.2 + 0.13 * k)
            if b % 2 == 1:
                for k in range(3):
                    m = ch[rng.integers(1, 4)] + 12
                    _add(buf, t0 + (k + 1) * beat + rng.uniform(0, 0.05), piano(mtof(m), 2.5, 0.05), 0.2)
        elif style == "uplift":
            for k, m in enumerate(ch):
                _add(buf, t0 + k * 0.02, piano(mtof(m), 2.4, 0.05), -0.2 + 0.12 * k)
                _add(buf, t0 + 2 * beat + k * 0.02, piano(mtof(m), 1.8, 0.035), -0.2 + 0.12 * k)
            for k in range(4):
                _add(buf, t0 + k * beat, kick(0.18 if k in (0, 2) else 0.0), 0)
                if k in (1, 3):
                    _add(buf, t0 + k * beat, brush(0.06, rng), 0.1)
                _add(buf, t0 + k * beat + beat / 2, hat(0.025, rng), 0.35)
            if b % 2 == 0:
                for k in range(4):
                    m = [72, 74, 76, 79, 81][rng.integers(0, 5)]
                    _add(buf, t0 + k * beat + beat / 2, bell(mtof(m), 1.4, 0.03), 0.25)
    # gentle room reverb
    L = int(1.8 * SR)
    ir = rng.normal(0, 1, L) * np.exp(-np.arange(L) / SR / 0.55)
    ir = np.convolve(ir, np.ones(16) / 16, "same")
    ir /= np.sqrt(np.sum(ir ** 2))
    for c in range(2):
        wet = signal.fftconvolve(buf[:, c], ir, mode="full")[: len(buf)]
        buf[:, c] = buf[:, c] + 0.3 * wet
    buf = buf[: int(dur * SR)]
    return buf / max(1e-6, np.abs(buf).max())


# ----------------------------------------------------------------------------- sound effects
def sfx(name, rng=None):
    rng = rng or np.random.default_rng(len(name))

    def lp(x, k):
        return np.convolve(x, np.ones(k) / k, "same")
    if name == "pop":
        x = _t(0.1)
        return np.sin(2 * np.pi * (500 + 1300 * x / 0.1) * x) * np.exp(-x * 45) * 0.45
    if name == "whoosh":
        x = _t(0.55)
        env = np.sin(np.pi * np.clip(x / 0.55, 0, 1)) ** 2
        n = rng.normal(0, 1, len(x))
        b, a = signal.butter(2, [300 / (SR / 2), 3000 / (SR / 2)], "band")
        return signal.lfilter(b, a, n) * env * 0.5
    if name == "whoosh_up":
        x = _t(0.9)
        n = rng.normal(0, 1, len(x))
        out = np.zeros_like(x)
        for i in range(0, len(x), 2048):
            f = 300 + 3000 * (i / len(x))
            b, a = signal.butter(2, [f * 0.7 / (SR / 2), min(0.99, f * 1.4 / (SR / 2))], "band")
            out[i:i + 2048] = signal.lfilter(b, a, n[i:i + 2048])
        return out * (x / 0.9) ** 2 * 0.45
    if name == "impact":
        x = _t(1.6)
        boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-x * 6)) / SR) * np.exp(-x * 3.2)
        return (boom + lp(rng.normal(0, 1, len(x)), 40) * np.exp(-x * 9) * 1.5) * 0.6
    if name == "ding":
        x = _t(1.4)
        return (np.sin(2 * np.pi * 1568 * x) + 0.5 * np.sin(2 * np.pi * 2349 * x)) * np.exp(-x * 4) * 0.16
    if name == "rec_on":
        x = _t(0.22)
        return (np.sin(2 * np.pi * 880 * x) * (x < 0.09) + np.sin(2 * np.pi * 1320 * x) * (x >= 0.11)) * 0.18
    if name == "rec_off":
        x = _t(0.22)
        return (np.sin(2 * np.pi * 1320 * x) * (x < 0.09) + np.sin(2 * np.pi * 880 * x) * (x >= 0.11)) * 0.18
    if name == "send":
        return np.concatenate([sfx("whoosh", rng)[: int(0.35 * SR)] * 0.7, sfx("pop", rng)])
    if name == "click":
        x = _t(0.03)
        return (rng.normal(0, 1, len(x)) * np.exp(-x * 250) * 0.35 + np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 200) * 0.2)
    if name == "shutter":
        x = _t(0.18)
        n = rng.normal(0, 1, len(x))
        return (n * (np.exp(-x * 60) + 0.7 * np.exp(-np.clip(x - 0.07, 0, None) * 70) * (x > 0.07))) * 0.3
    if name == "tape":
        x = _t(2.6)
        hum = (np.sin(2 * np.pi * 110 * x) * 0.2 + lp(rng.normal(0, 1, len(x)), 3) * 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * x))
        clk = np.zeros_like(x)
        clk[: int(0.03 * SR)] = rng.normal(0, 1, int(0.03 * SR)) * np.exp(-_t(0.03) * 150)
        return (hum * np.clip(np.minimum(x / 0.2, (2.6 - x) / 0.5), 0, 1) * 0.25 + clk * 0.5) * 0.7
    if name == "buzz":
        x = _t(0.35)
        return np.sign(np.sin(2 * np.pi * 110 * x)) * np.exp(-x * 6) * 0.08
    if name == "deflate":
        x = _t(0.8)
        return np.sin(2 * np.pi * np.cumsum(330 * np.exp(-x * 2.2) + 60) / SR) * np.exp(-x * 2.5) * 0.25
    if name == "bass_drop":
        x = _t(1.2)
        return np.sin(2 * np.pi * 55 * x) * np.exp(-x * 2.2) * 0.55
    if name == "wahwah":
        out = []
        for k, f in enumerate((392, 370, 349, 330)):
            x = _t(0.32 if k < 3 else 0.7)
            vib = 1 + (0.015 * np.sin(2 * np.pi * 6 * x) if k == 3 else 0)
            tone = sum(np.sin(2 * np.pi * f * h * vib * x) / h for h in (1, 2, 3, 4))
            out.append(tone * np.minimum(1, x / 0.03) * np.clip((len(x) / SR - x) / 0.08, 0, 1))
        return np.concatenate(out) * 0.07
    if name == "sparkle":
        x = _t(1.2)
        out = np.zeros_like(x)
        for k in range(7):
            f = rng.uniform(2500, 5000)
            d = int(k * 0.09 * SR)
            xx = x[: len(x) - d]
            out[d:] += np.sin(2 * np.pi * f * xx) * np.exp(-xx * 9)
        return out * 0.06
    if name == "riser":
        x = _t(1.6)
        tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * (x / 1.6) ** 2) / SR)
        wu = sfx("whoosh_up", rng)
        air = np.zeros_like(x)
        air[len(x) - len(wu):] = wu
        return tone * 0.12 * (x / 1.6) ** 2 + air * 0.6
    if name == "page":
        x = _t(0.18)
        return lp(rng.normal(0, 1, len(x)), 6) * np.sin(np.pi * np.clip(x / 0.18, 0, 1)) * 0.15
    if name == "step":
        x = _t(0.09)
        return lp(rng.normal(0, 1, len(x)), 25) * np.exp(-x * 55) * 0.5
    if name == "on_air":
        x = _t(0.6)
        hum = (np.sin(2 * np.pi * 60 * x) * 0.1 + rng.normal(0, 1, len(x)) * 0.01) * np.exp(-x * 4)
        clk = sfx("click", rng)
        hum[: len(clk)] += clk
        return hum
    if name == "birds":
        x = _t(6.0)
        out = np.zeros_like(x)
        for k in range(10):
            s = int(rng.uniform(0, 5.4) * SR)
            f0 = rng.uniform(2800, 4200)
            xx = _t(0.18)
            chirp = np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(2 * np.pi * 14 * xx)) / SR) * np.sin(np.pi * xx / 0.18)
            out[s:s + len(xx)] += chirp
        return out * 0.03
    if name == "city":
        x = _t(8.0)
        n = rng.normal(0, 1, len(x))
        b, a = signal.butter(2, 400 / (SR / 2), "low")
        return signal.lfilter(b, a, n) * 0.06 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.2 * x))
    if name == "crowd":
        x = _t(3.0)
        n = rng.normal(0, 1, len(x))
        b, a = signal.butter(2, [250 / (SR / 2), 1600 / (SR / 2)], "band")
        return signal.lfilter(b, a, n) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 1.7 * x))) * 0.05
    raise ValueError(name)


# ----------------------------------------------------------------------------- mix
def mix(n, voice, music, fx, amb):
    """voice: mono; music/fx/amb: stereo. Returns stereo float32 at a YouTube-friendly level."""
    v = voice.astype(np.float64)
    win = int(0.03 * SR)
    env = np.sqrt(signal.fftconvolve(v ** 2, np.ones(win) / win, mode="same").clip(0)) + 1e-6
    thr = 0.09
    gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.6), 1.0)
    gain = signal.fftconvolve(gain, np.ones(int(0.04 * SR)) / (0.04 * SR), mode="same")
    v = v * gain
    v = v / max(1e-6, np.abs(v).max()) * 0.9
    venv = signal.fftconvolve(np.abs(v), np.ones(int(0.3 * SR)) / (0.3 * SR), mode="same")
    duck = 1 - 0.5 * np.clip(venv / 0.06, 0, 1)
    duck = signal.fftconvolve(duck, np.ones(int(0.25 * SR)) / (0.25 * SR), mode="same")
    out = np.zeros((n, 2))
    out[:, 0] = v
    out[:, 1] = v
    out += music * 0.11 * duck[:, None] + fx + amb
    peak = np.abs(out).max()
    out = np.tanh(out / max(peak, 1e-6) * 1.4) / np.tanh(1.4) * 0.93
    return out.astype(np.float32)
