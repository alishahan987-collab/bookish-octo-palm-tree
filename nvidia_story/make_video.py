#!/usr/bin/env python3
"""
"The Near-Death of Nvidia" - a 1-minute animated story sample.

Style: flat 2D cartoon (characters + backgrounds drawn in code, so everything is sharp at 1080p),
speech bubbles for dialogue, handwritten captions, black typewriter cards.
Voices: Piper offline TTS (narrator, Jensen, Sega's boss). Music and sound effects are generated.

Run: python3 make_video.py   ->  build/nvidia_story_sample.mp4 (+ .srt)
"""
import hashlib, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cartoon as C
import backgrounds as B

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
os.makedirs(os.path.join(BUILD, "tts"), exist_ok=True)
VOICE_DIR = os.environ.get("PIPER_VOICES", "/tmp/claude-0/-home-user-bookish-octo-palm-tree/"
                           "a014b4f3-0de3-5f09-b465-e24ff547bf22/scratchpad/voice")
VOICES = {"N": ("en_US-ryan-high.onnx", 1.0), "J": ("en_US-joe-medium.onnx", 1.0), "B": ("en_US-norman-medium.onnx", 1.1)}
FONT = os.path.join(HERE, "tools", "fonts", "Kalam-Bold.ttf")
W, H, FPS, AFPS, SR = 1920, 1080, 24, 12, 44100
OUT = (32, 30, 34)


def clip01(x): return max(0.0, min(1.0, x))
def ease(x): x = clip01(x); return x * x * (3 - 2 * x)


_fonts = {}


def font(size):
    if size not in _fonts:
        _fonts[size] = ImageFont.truetype(FONT, size)
    return _fonts[size]


# ----------------------------------------------------------------------------- voices
def tts(spk, text):
    model, ls = VOICES[spk]
    key = hashlib.md5(f"{spk}|{text}|{ls}".encode()).hexdigest()[:12]
    path = os.path.join(BUILD, "tts", key + ".wav")
    if not os.path.exists(path):
        subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(VOICE_DIR, model), "-f", path,
                        "--length-scale", str(ls)], input=text.encode(), check=True, capture_output=True)
    with wave.open(path) as wf:
        sr = wf.getframerate()
        a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    idx = np.nonzero(np.abs(a) > 0.012)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.06 * sr)]
    n = int(len(a) * SR / sr)
    a = np.interp(np.arange(n) * sr / SR, np.arange(len(a)), a).astype(np.float32)
    return a / max(0.05, np.abs(a).max()) * 0.85


def envelope(a):
    """Mouth opening per drawing (12 per second), from the voice loudness."""
    hop = SR // AFPS
    n = max(1, len(a) // hop)
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    ref = np.percentile(rms, 90) if len(rms) else 1
    return np.clip(rms / max(ref, 1e-4), 0, 1)


# ----------------------------------------------------------------------------- drawing helpers
def aa_draw(frame, box, fn):
    """Draw with 2x supersampling inside box (x0,y0,x1,y1) of the frame, for smooth edges."""
    x0, y0, x1, y1 = [int(v) for v in box]
    layer = Image.new("RGBA", ((x1 - x0) * 2, (y1 - y0) * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    fn(d, lambda x, y: ((x - x0) * 2, (y - y0) * 2))
    frame.alpha_composite(layer.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))


def wrap(text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if f.getlength(test) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = test
    return lines + [cur]


_bubbles = {}


def bubble_image(text, size=46):
    if text in _bubbles:
        return _bubbles[text]
    f = font(size * 2)
    lines = wrap(text, f, 1240)
    lh = f.size * 1.12
    tw = max(f.getlength(l) for l in lines)
    pad = 60
    w, h = int(tw + 2 * pad), int(lh * len(lines) + 2 * pad - 10)
    img = Image.new("RGBA", (w + 20, h + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([10, 10, 10 + w, 10 + h], radius=80, fill=(255, 255, 255), outline=OUT, width=10)
    for i, l in enumerate(lines):
        d.text((10 + w / 2, 10 + pad - 6 + i * lh + lh / 2), l, font=f, fill=OUT, anchor="mm")
    img = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    _bubbles[text] = img
    return img


def draw_bubble(frame, b, t):
    if t < b["at"] or t > b["until"]:
        return
    u = clip01((t - b["at"]) / 0.16)
    s = 0.85 + 0.15 * (1 - (1 - u) ** 3)
    img = bubble_image(b["text"])
    bw, bh = img.width * s, img.height * s
    cx, cy = b["cx"], b["cy"]
    tx, ty = b["tip"]
    bx = min(max(tx, cx - bw / 2 + 60), cx + bw / 2 - 60)
    base_y = cy + bh / 2 - 14 if ty > cy else cy - bh / 2 + 14

    def tail(d, T):
        pts = [T(bx - 26, base_y), T(bx + 26, base_y), T(tx, ty)]
        d.polygon(pts, fill=(255, 255, 255))
        d.line([pts[0], pts[2], pts[1]], fill=OUT, width=10, joint="curve")
    aa_draw(frame, (min(tx, bx) - 40, min(ty, base_y) - 20, max(tx, bx) + 40, max(ty, base_y) + 20), tail)
    if s != 1:
        img = img.resize((max(1, int(bw)), max(1, int(bh))), Image.BILINEAR)
    frame.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


_caps = {}


def caption_image(text, dark):
    k = (text, dark)
    if k not in _caps:
        f = font(104)
        lines = wrap(text, f, 3100)
        lh = f.size * 1.08
        tw = max(f.getlength(l) for l in lines)
        img = Image.new("RGBA", (int(tw + 80), int(lh * len(lines) + 70)), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        fill, stroke = ((255, 255, 255), (20, 20, 24)) if dark else ((30, 30, 34), (255, 255, 255))
        for i, l in enumerate(lines):
            d.text((img.width / 2, 35 + i * lh + lh / 2), l, font=f, fill=fill, anchor="mm", stroke_width=6 if dark else 5, stroke_fill=stroke)
        _caps[k] = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    return _caps[k]


def label_image(text, size=40, fill=(252, 222, 92)):
    f = font(size * 2)
    tw = f.getlength(text)
    img = Image.new("RGBA", (int(tw + 70), int(size * 2 * 1.5)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, img.width - 5, img.height - 5], fill=fill, outline=OUT, width=8)
    d.text((img.width / 2, img.height / 2 + 4), text, font=f, fill=OUT, anchor="mm")
    return img.resize((img.width // 2, img.height // 2), Image.LANCZOS)


_labels = {}


def fx_label(text, x, y, at=0.15, size=40):
    def f(frame, sc, t, tq, af):
        if t < at:
            return
        if text not in _labels:
            _labels[text] = label_image(text, size)
        img = _labels[text]
        u = clip01((t - at) / 0.15)
        if u < 1:
            img = img.resize((max(1, int(img.width * (0.8 + 0.2 * u))), max(1, int(img.height * (0.8 + 0.2 * u)))), Image.BILINEAR)
        frame.alpha_composite(img, (int(x - img.width / 2), int(y - img.height / 2)))
    return f


# ----------------------------------------------------------------------------- props & effects
def fx_overlay(img_fn):
    cache = {}

    def f(frame, sc, t, tq, af):
        if "img" not in cache:
            cache["img"] = img_fn(FONT)
        frame.alpha_composite(cache["img"])
    return f


def fx_chart(x0=400, y0=90, x1=1520, y1=570, done=None):
    def f(frame, sc, t, tq, af):
        k = 1.0 if done else ease((t - 0.2) / max(0.5, sc["dur"] - 0.6))

        def draw(d, T):
            d.line([T(470, 190), T(470, 520), T(1470, 520)], fill=(60, 60, 70), width=8)
            for gy in (260, 330, 400, 470):
                d.line([T(474, gy), T(1470, gy)], fill=(214, 218, 226), width=3)
            n = int(6 + 90 * k)
            xs = np.linspace(480, 480 + 980 * k, n)
            ys = [512 - 310 * ((x - 480) / 980) ** 3 - 8 * math.sin((x - 480) / 37) for x in xs]
            pts = [T(x, y) for x, y in zip(xs, ys)]
            if len(pts) > 1:
                d.line(pts, fill=(62, 176, 88), width=14, joint="curve")
                d.ellipse([pts[-1][0] - 14, pts[-1][1] - 14, pts[-1][0] + 14, pts[-1][1] + 14], fill=(62, 176, 88))
            d.text(T(490, 160), "MARKET VALUE", font=font(64), fill=(60, 60, 70), anchor="lm")
            if k > 0.82:
                d.text(T(1150, 250), "$ TRILLIONS", font=font(116), fill=(46, 150, 70), anchor="mm")
        aa_draw(frame, (x0, y0, x1, y1), draw)
    return f


_glow = {}


def fx_chip(text, cx, cy, size=190, glow_from=None, smoke=False, x_from=None):
    def f(frame, sc, t, tq, af):
        if glow_from is not None and t >= glow_from:
            if size not in _glow:
                r = int(size * 1.6)
                yy, xx = np.mgrid[-r:r, -r:r]
                a = np.clip(1 - np.sqrt(xx ** 2 + yy ** 2) / r, 0, 1) ** 2 * 200
                g = np.zeros((2 * r, 2 * r, 4), np.uint8)
                g[..., 0], g[..., 1], g[..., 2], g[..., 3] = 120, 230, 120, a.astype(np.uint8)
                _glow[size] = Image.fromarray(g, "RGBA")
            gimg = _glow[size]
            pulse = 0.85 + 0.15 * math.sin(tq * 5)
            gi = gimg.copy()
            gi.putalpha(gi.getchannel("A").point(lambda v: int(v * pulse)))
            frame.alpha_composite(gi, (int(cx - gi.width / 2), int(cy - gi.height / 2)))

        def draw(d, T):
            s = size
            for k in range(7):
                o = -s * 0.36 + k * s * 0.12
                for (ax, ay, bx, by) in ((cx + o, cy - s / 2 - 22, cx + o, cy - s / 2), (cx + o, cy + s / 2, cx + o, cy + s / 2 + 22),
                                         (cx - s / 2 - 22, cy + o, cx - s / 2, cy + o), (cx + s / 2, cy + o, cx + s / 2 + 22, cy + o)):
                    d.line([T(ax, ay), T(bx, by)], fill=(196, 198, 204), width=14)
            d.rounded_rectangle([*T(cx - s / 2, cy - s / 2), *T(cx + s / 2, cy + s / 2)], radius=24, fill=(38, 40, 46), outline=OUT, width=10)
            d.rounded_rectangle([*T(cx - s / 2 + 24, cy - s / 2 + 24), *T(cx + s / 2 - 24, cy + s / 2 - 24)], radius=12, outline=(84, 88, 96), width=6)
            d.text(T(cx, cy), text, font=font(int(size * 0.62 if len(text) < 5 else size * 0.4)), fill=(236, 240, 236), anchor="mm")
            if x_from is not None and t >= x_from:
                u = ease((t - x_from) / 0.2)
                r = s * 0.55 * u
                d.line([T(cx - r, cy - r), T(cx + r, cy + r)], fill=(214, 48, 40), width=26)
                d.line([T(cx + r, cy - r), T(cx - r, cy + r)], fill=(214, 48, 40), width=26)
        aa_draw(frame, (cx - size, cy - size, cx + size, cy + size), draw)
        if smoke:
            rng = np.random.default_rng(1)
            for k in range(7):
                ph = (tq * 0.45 + k / 7) % 1
                x = cx + rng.uniform(-40, 40) + 30 * math.sin(ph * 5 + k)
                y = cy - size * 0.4 - ph * 300
                r = 24 + ph * 70
                a = int(150 * (1 - ph))
                lay = Image.new("RGBA", (int(2 * r + 4), int(2 * r + 4)), (0, 0, 0, 0))
                ImageDraw.Draw(lay).ellipse([2, 2, 2 * r + 2, 2 * r + 2], fill=(120, 120, 126, a))
                frame.alpha_composite(lay, (int(x - r), int(y - r)))
    return f


def fx_diagram(t_tri, t_mark):
    def f(frame, sc, t, tq, af):
        def draw(d, T):
            blue, green, red = (46, 88, 200), (40, 150, 70), (214, 48, 40)
            k = ease(t / 0.6)
            cx, cy, r = 560, 600, 250
            if k > 0:
                d.arc([*T(cx - r, cy - r), *T(cx + r, cy + r)], 180, 180 + 180 * k, fill=blue, width=14)
                for j in range(1, 4):
                    rr = r * j / 4
                    d.arc([*T(cx - r, cy - rr), *T(cx + r, cy + rr)], 180, 180 + 180 * k, fill=blue, width=8)
                d.line([T(cx - r, cy), T(cx - r + 2 * r * k, cy)], fill=blue, width=10)
                d.text(T(cx, cy + 120), "NV1: CURVES", font=font(120), fill=blue, anchor="mm")
            if t >= t_tri:
                u = ease((t - t_tri) / 0.5)
                tx, ty, s = 1360, 600, 250
                pts = []
                for row in range(4):
                    yy = ty - s + row * s / 3
                    half = s * (0.35 + 0.65 * row / 3)
                    pts.append([(tx - half + j * 2 * half / (row + 1), yy) for j in range(row + 2)])
                n = 0
                for row in range(3):
                    a, b = pts[row], pts[row + 1]
                    for j in range(len(a)):
                        for q in (b[j], b[j + 1]):
                            n += 1
                            if n / 12 <= u:
                                d.line([T(*a[j]), T(*q)], fill=green, width=9)
                    if n / 12 <= u:
                        d.line([T(*b[0]), T(*b[-1])], fill=green, width=9)
                d.line([T(*pts[0][0]), T(*pts[0][-1])], fill=green, width=9)
                d.text(T(tx, ty + 120), "EVERYONE ELSE:", font=font(96), fill=green, anchor="mm")
                d.text(T(tx, ty + 215), "TRIANGLES", font=font(120), fill=green, anchor="mm")
            if t >= t_mark:
                u = ease((t - t_mark) / 0.2)
                r = 190 * u
                d.line([T(560 - r, 470 - r), T(560 + r, 470 + r)], fill=red, width=30)
                d.line([T(560 + r, 470 - r), T(560 - r, 470 + r)], fill=red, width=30)
                d.line([T(1260, 300), T(1330, 370), T(1330 + 160 * u, 370 - 190 * u)], fill=green, width=30, joint="curve")
        aa_draw(frame, (180, 140, 1760, 960), draw)
    return f


def fx_nameplates(items):
    cache = {}

    def f(frame, sc, t, tq, af):
        for text, x, y, at in items:
            at = at(sc) if callable(at) else at
            if t < at:
                continue
            if text not in cache:
                cache[text] = B.nameplate(FONT, text)
            img = cache[text]
            u = clip01((t - at) / 0.15)
            if u < 1:
                img = img.resize((max(1, int(img.width * (0.8 + 0.2 * u))), max(1, int(img.height * (0.8 + 0.2 * u)))), Image.BILINEAR)
            frame.alpha_composite(img, (int(x - img.width / 2), int(y - img.height / 2)))
    return f


def fx_money(at_fn, x, y):
    def f(frame, sc, t, tq, af):
        at = at_fn(sc)
        if t < at:
            return
        u = ease((t - at) / 0.35)
        yy = y - 260 * (1 - u)

        def draw(d, T):
            for k in range(5):
                top = yy - k * 22
                d.rounded_rectangle([*T(x - 120, top - 26), *T(x + 120, top)], radius=8, fill=(124, 190, 110), outline=OUT, width=8)
                d.ellipse([*T(x - 18, top - 22), *T(x + 18, top - 4)], outline=(70, 130, 60), width=5)
            if u >= 1:
                d.text(T(x, yy - 170), "$5,000,000", font=font(104), fill=(36, 120, 50), anchor="mm",
                       stroke_width=10, stroke_fill=(255, 255, 255))
        aa_draw(frame, (x - 260, y - 520, x + 260, y + 20), draw)
    return f


def fx_counter(t0_fn, t1_fn, x=1180, y=330):
    def f(frame, sc, t, tq, af):
        t0, t1 = t0_fn(sc), t1_fn(sc)
        if t < t0 - 0.3:
            return
        u = ease((t - t0) / max(0.1, t1 - t0))
        n = int(round(1_000_000 * u, -3)) if u < 1 else 1_000_000

        def draw(d, T):
            bx, by = 560, y + 20
            d.rounded_rectangle([*T(bx - 140, by - 150), *T(bx + 140, by + 150)], radius=16, fill=(40, 44, 48), outline=OUT, width=10)
            d.rounded_rectangle([*T(bx - 140, by - 150), *T(bx + 140, by - 60)], radius=16, fill=(118, 185, 0), outline=OUT, width=10)
            d.text(T(bx, by - 104), "RIVA 128", font=font(70), fill=(255, 255, 255), anchor="mm")
            d.rounded_rectangle([*T(bx - 60, by - 30), *T(bx + 60, by + 90)], radius=10, fill=(26, 28, 32), outline=(170, 170, 176), width=6)
            d.text(T(x, y - 30), f"{n:,}", font=font(200), fill=(36, 120, 50), anchor="mm", stroke_width=12, stroke_fill=(255, 255, 255))
            d.text(T(x, y + 110), "SOLD!" if u >= 1 else "SOLD", font=font(110), fill=(214, 60, 40), anchor="mm",
                   stroke_width=10, stroke_fill=(255, 255, 255))
        aa_draw(frame, (380, y - 200, 1560, y + 200), draw)
    return f


# ----------------------------------------------------------------------------- story
SCENES = []


def scene(**kw):
    kw.setdefault("lines", [])
    kw.setdefault("fx", [])
    kw.setdefault("post", [])
    kw.setdefault("bubbles", [])
    kw.setdefault("zoom", 0.03)
    kw.setdefault("mood", "tense")
    SCENES.append(kw)


def Pt(sc, i, d=0.0): return sc["P"][i] + d
def Et(sc, i, d=0.0): return sc["E"][i] + d


def speaking(sc, t, spk):
    """Mouth opening (0..1) if `spk` is talking at time t in this scene, else None."""
    for (s, *_), p0, e0, env in zip(sc["lines"], sc["P"], sc["E"], sc["env"]):
        if s == spk and p0 <= t <= e0:
            k = int((t - p0) * AFPS)
            return float(env[min(k, len(env) - 1)])
    return None


def mouth_for(sc, t, spk, default="smile"):
    a = speaking(sc, t, spk)
    return ("talk", a) if a is not None else (default, 0.0)


def blink(p, tq, seed):
    if p["eyes"] == "open" and ((tq + seed * 0.71) % 3.4) < 0.17:
        p = dict(p, eyes="closed")
    return p


STAGE_GY = 880


def cast_stage(sc, t, tq):
    s = math.sin(tq * 2.2) * 3
    p = C.stand(0, arms=[(-102 + s, -126 + s), (16, 8)], mouth="big" if (tq % 3) < 2.2 else "smile", look=(-0.6, -0.4))
    return [("jensen_now", p, 1000, STAGE_GY, 1.7)]


scene(name="today", bg="stage", lines=[("N", "Today, Nvidia is worth trillions of dollars.")], mood="bright",
      fx=[fx_chart()], sfx=[(0.0, "applause")], cast=cast_stage)
scene(name="almost", bg="black", card=True, lines=[("N", "But in 1996, it almost died.")], pad=0.6, sfx=[(0.3, "heartbeat")])
scene(name="title", bg="black", silent=1.8, title="The Near-Death of Nvidia", sfx=[(0.0, "whoosh")])

DINER_GY = 940


def cast_diner(sc, t, tq, talk=False):
    jm, ja = mouth_for(sc, t, "J")
    jarms = [(-14, -6), (66, 164)] if talk and ja > 0 else [(-14, -6), (14, 6)]
    react = talk and t > Pt(sc, 0, 0.6)
    return [("chris", C.stand(1, look=(1, 0), brows="raised" if react else "neutral", mouth="big" if react and t > Et(sc, 0, -0.6) else "smile"), 520, DINER_GY, 1.85),
            ("jensen", C.stand(0, mouth=jm, amp=ja, arms=jarms, brows="raised" if talk else "neutral"), 960, DINER_GY, 1.85),
            ("curtis", C.stand(-1, look=(-1, 0), brows="raised" if react else "neutral", mouth="big" if react and t > Et(sc, 0, -0.6) else "smile"), 1400, DINER_GY, 1.85)]


plates = fx_nameplates([("JENSEN HUANG", 960, 842, lambda sc: Pt(sc, 0, 2.0)), ("CHRIS MALACHOWSKY", 520, 842, lambda sc: Pt(sc, 0, 2.3)),
                        ("CURTIS PRIEM", 1400, 842, lambda sc: Pt(sc, 0, 2.6))])
scene(name="dennys", bg="diner", lines=[("N", "It started in 1993, when three engineers sat down at a Denny's in San Jose.")],
      post=[fx_overlay(B.diner_table), plates, fx_label("SAN JOSE, 1993", 250, 200)], cast=cast_diner)
_jd = C.head_point(C.stand(0), 960, DINER_GY, 1.85)
scene(name="idea", bg="diner", lines=[("J", "Video games will need 3D graphics. Let's build the chip!")], pad=0.5, zoom=0.1, focus=(960, 520),
      post=[fx_overlay(B.diner_table), fx_nameplates([("JENSEN HUANG", 960, 842, 0), ("CHRIS MALACHOWSKY", 520, 842, 0), ("CURTIS PRIEM", 1400, 842, 0)])],
      bubbles=[dict(line=0, cx=1300, cy=290, tip=(_jd[0] + 50, _jd[1] - 10))],
      cast=lambda sc, t, tq: cast_diner(sc, t, tq, talk=True), sfx=[(0.0, "pop")])

LAB_GY = 1012


def cast_nv1(sc, t, tq):
    bad = t > Pt(sc, 0, 1.4)
    return [("jensen", C.stand(1, brows="worried", mouth="frown" if bad else "line", look=(1, 0.3), marks=("sweat",) if bad else ()), 620, LAB_GY, 1.85),
            ("chris", C.stand(-1, brows="worried", mouth="O" if bad else "line", look=(-1, 0.3)), 1300, LAB_GY, 1.85)]


scene(name="nv1", bg="lab", lines=[("N", "Their first chip, the NV1, was a disaster.")], pad=0.4,
      fx=[fx_chip("NV1", 960, 610, 190, smoke=True, x_from=None)], post=[fx_label("1995", 180, 200)], cast=cast_nv1)
scene(name="curves", bg="board", lines=[("N", "It drew curves, but the industry chose triangles.")], pad=0.7, zoom=0.0,
      fx=[fx_diagram(1.3, 2.4)])

TOKYO_J_GY, BOSS_X, BOSS_GY = 1015, 1390, 905


def cast_tokyo(sc, t, tq, mode):
    jx = 520
    jp = C.stand(1, look=(1, -0.2), brows="worried", mouth="line", marks=("sweat",))
    bm, ba = mouth_for(sc, t, "B", "line")
    bp = C.stand(-1, look=(-1, 0), mouth=bm, amp=ba)
    if mode == "walk":
        t_stop = 1.3
        if tq < t_stop:
            k = int(round(tq * AFPS))
            jp = C.walk(2 * math.pi * (k % 10) / 10, 1, brows="worried", mouth="line", marks=("sweat",))
            jp["step"] = k % 5 == 2
            jx = 520 + (C.STEP_U * 2 / (10 / AFPS)) * 1.9 * tq
        else:
            jx = 520 + (C.STEP_U * 2 / (10 / AFPS)) * 1.9 * t_stop
    elif mode in ("talk1", "talk2", "okay", "paid"):
        jx = 520 + (C.STEP_U * 2 / (10 / AFPS)) * 1.9 * 1.3
        jm, ja = mouth_for(sc, t, "J", "line")
        if mode == "talk1":
            jp = C.stand(1, arms=[(-4, -2), (40, 126)], brows="worried", mouth=jm, amp=ja, marks=("sweat",))
            bp["brows"] = "raised"
        elif mode == "talk2":
            jp = C.stand(1, arms=[(28, 96), (34, 102)], brows="sad", mouth=jm, amp=ja, marks=("sweat",))
            bp["brows"] = "raised"
        elif mode == "okay":
            waiting = t < Pt(sc, 0)
            jp = C.stand(1, brows="sad" if waiting else "raised", eyes="open" if waiting else "wide", mouth="line" if waiting else "O")
            if speaking(sc, t, "B") is not None:
                bp["lean"] = -4 if int(tq * 6) % 2 else 0
        else:
            up = t > Pt(sc, 0, 0.5)
            jy = 46 * math.sin(math.pi * clip01((t - Pt(sc, 0, 0.5)) / 0.5)) if up else 0
            jp = C.stand(1, arms=[(150, 165), (150, 165)] if up else [(-4, -2), (8, 18)], eyes="closed" if up else "open",
                         mouth="big" if up else "smile", yoff=jy)
            bp["mouth"] = "smile"
    return [("jensen", jp, jx, TOKYO_J_GY, 1.9), ("boss", bp, BOSS_X, BOSS_GY, 1.75)]


tokyo_post = [fx_overlay(B.tokyo_desk), fx_nameplates([("SEGA'S BOSS", 1500, 806, 0)])]
_jt = C.head_point(C.stand(1), 520 + (C.STEP_U * 2 / (10 / AFPS)) * 1.9 * 1.3, TOKYO_J_GY, 1.9)
_bt = C.head_point(C.stand(-1), BOSS_X, BOSS_GY, 1.75)
scene(name="sega", bg="tokyo", lines=[("N", "Even worse, Sega had paid them to build the chip for its next console.")],
      post=tokyo_post + [fx_label("TOKYO", 200, 200)], cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "stand"))
scene(name="truth", bg="tokyo", lines=[("N", "So Jensen told Sega's boss the truth.")], pad=0.3,
      post=tokyo_post, cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "walk"))
scene(name="talk1", bg="tokyo", lines=[("J", "Our design is wrong. You should find another partner.")], pad=0.35, zoom=0.05, focus=(900, 560),
      post=tokyo_post, bubbles=[dict(line=0, cx=780, cy=250, tip=(_jt[0] + 30, _jt[1] - 10))], sfx=[(0.0, "pop")],
      cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "talk1"))
scene(name="talk2", bg="tokyo", lines=[("J", "But if you don't pay us, we're finished.")], pad=0.3, zoom=0.05, focus=(900, 560),
      post=tokyo_post, bubbles=[dict(line=0, cx=780, cy=250, tip=(_jt[0] + 30, _jt[1] - 10))], sfx=[(0.0, "pop")],
      cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "talk2"))
scene(name="okay", bg="tokyo", lines=[("B", "...Okay.", dict(say="Okay.", delay=0.8))], pad=0.6, zoom=0.06, focus=(1250, 560),
      post=tokyo_post, bubbles=[dict(line=0, cx=1080, cy=300, tip=(_bt[0] - 50, _bt[1] - 6))], sfx=[("line0+0", "pop")],
      cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "okay"))
scene(name="paid", bg="tokyo", lines=[("N", "Sega paid. Those five million dollars kept Nvidia alive.")], pad=0.4,
      post=tokyo_post + [fx_money(lambda sc: Pt(sc, 0, 0.3), 1180, 790)], sfx=[("line0+0.62", "cash")],
      cast=lambda sc, t, tq: cast_tokyo(sc, t, tq, "paid"))


def cast_layoff(sc, t, tq):
    k = int(round(tq * AFPS))
    wp = C.walk(2 * math.pi * (k % 10) / 10, -1, prop="box", arms=[(8, -82), (-8, -82)], mouth="frown", brows="sad")
    wp["step"] = k % 5 == 2
    wx = 1180 - (C.STEP_U * 2 / (10 / AFPS)) * 1.8 * tq
    jp = C.stand(-1, brows="sad", mouth="frown", look=(-1, 0.2))
    return [("worker", wp, wx, 1000, 1.8), ("jensen", jp, 1620, 1015, 1.9)]


scene(name="layoffs", bg="office", lines=[("N", "But Nvidia still had to lay off more than half its people.")], pad=0.4,
      post=[fx_label("1996", 180, 200)], cast=cast_layoff)


def cast_last(sc, t, tq):
    return [("jensen", C.stand(1, brows="angry", mouth="line", look=(1, 0.4)), 600, LAB_GY, 1.85),
            ("chris", C.stand(-1, brows="worried", mouth="line", look=(-1, 0.4)), 1290, LAB_GY, 1.85),
            ("curtis", C.stand(-1, brows="worried", mouth="line", look=(-1, 0.3), marks=("sweat",)), 1580, LAB_GY, 1.85)]


scene(name="lastchip", bg="lab", lines=[("N", "They had money for just one last chip.")], pad=0.5,
      fx=[fx_chip("RIVA 128", 960, 610, 190, glow_from=0.2)], cast=cast_last)
scene(name="dead", bg="black", card=True, lines=[("N", "If it failed, Nvidia was dead.")], pad=0.8, sfx=[(0.2, "heartbeat")])


def cast_store(sc, t, tq):
    out = []
    start = Pt(sc, 0, 1.2)
    for i, (who, x) in enumerate((("chris", 560), ("jensen", 960), ("curtis", 1360))):
        if t < start:
            p = C.stand(0, mouth="smile", look=(0, -1))
        else:
            u = ((t - start) / 0.62 + i * 0.33) % 1
            p = C.stand(0, arms=[(-150, -165), (150, 165)], mouth="big", eyes="closed", yoff=58 * math.sin(math.pi * u))
            p["step"] = u < 1 / 7.4
        out.append((who, p, x, 1015, 1.8))
    return out


scene(name="success", bg="store", lines=[("N", "In 1997, the RIVA 128 sold a million units in four months.")], pad=0.5,
      mood="bright", post=[fx_counter(lambda sc: Pt(sc, 0, 1.2), lambda sc: Et(sc, 0, -0.3)), fx_label("1997", 180, 200)],
      sfx=[("line0+1.2", "chime"), ("line0+1.2", "cheer")], cast=cast_store)
scene(name="beginning", bg="stage", lines=[("N", "Nvidia survived. And that was only the beginning.")], pad=0.8, mood="bright",
      fx=[fx_chart(done=True)], sfx=[(0.0, "applause")], cast=cast_stage)
scene(name="end", bg="black", silent=2.0, card_text="To be continued...", mood="bright")


# ----------------------------------------------------------------------------- timeline
LEAD, GAP, PAD = 0.12, 0.18, 0.25


def build_timeline():
    t = 0.0
    for sc in SCENES:
        sc["start"] = t
        P, E, A, ENV = [], [], [], []
        tt = LEAD
        for spk, text, *opt in sc["lines"]:
            opt = opt[0] if opt else {}
            tt += opt.get("delay", 0.0)
            a = tts(spk, opt.get("say", text))
            P.append(tt)
            E.append(tt + len(a) / SR)
            A.append(a)
            ENV.append(envelope(a))
            tt = E[-1] + GAP
        sc["P"], sc["E"], sc["audio"], sc["env"] = P, E, A, ENV
        sc["dur"] = sc["silent"] if "silent" in sc else E[-1] + sc.get("pad", PAD)
        for b in sc["bubbles"]:
            b["text"] = sc["lines"][b["line"]][1]
            b["at"] = P[b["line"]] - 0.05
            b["until"] = sc["dur"] + 1
        t += sc["dur"]
    return t


def scene_at(t):
    for sc in SCENES:
        if t < sc["start"] + sc["dur"]:
            return sc
    return SCENES[-1]


# ----------------------------------------------------------------------------- frames
BGS = {}
_figs = {}


def background(name):
    if name not in BGS:
        BGS[name] = getattr(B, "bg_" + name)(FONT).convert("RGBA")
    return BGS[name]


def card_text(frame, text, t, t0, t1, size=84):
    n = len(text) if t1 <= t0 else int(len(text) * clip01((t - t0) / (t1 - t0)))
    if n <= 0:
        return
    f = font(size)
    lines = wrap(text, f, 1500)
    shown, left = [], n
    for l in lines:
        shown.append(l[:max(0, left)])
        left -= len(l) + 1
    d = ImageDraw.Draw(frame)
    lh = size * 1.25
    y0 = H / 2 - lh * (len(lines) - 1) / 2
    for i, (full, part) in enumerate(zip(lines, shown)):
        x = W / 2 - f.getlength(full) / 2
        d.text((x, y0 + i * lh), part, font=f, fill=(245, 245, 240), anchor="lm")


def render_frame(Tg, TOTAL):
    sc = scene_at(Tg)
    t = Tg - sc["start"]
    tq = math.floor(t * AFPS + 1e-6) / AFPS
    af = int(math.floor(Tg * AFPS + 1e-6))
    frame = background(sc["bg"]).copy()
    for fx in sc["fx"]:
        fx(frame, sc, t, tq, af)
    if "cast" in sc:
        for i, (who, p, x, gy, s) in enumerate(sc["cast"](sc, t, tq)):
            p = blink(p, tq, i + len(sc["name"]))
            key = (who, repr(sorted(p.items())), round(s, 3))
            if key not in _figs:
                if len(_figs) > 200:
                    _figs.clear()
                _figs[key] = C.render(who, p, s, FONT)
            img = _figs[key]
            frame.alpha_composite(img, (int(round(x + C.BOX[0] * s)), int(round(gy + C.BOX[2] * s))))
    for fx in sc["post"]:
        fx(frame, sc, t, tq, af)
    for b in sc["bubbles"]:
        draw_bubble(frame, b, t)
    z = 1 + sc["zoom"] * ease(t / sc["dur"])
    if z != 1:
        fx_, fy_ = sc.get("focus", (W / 2, H / 2))
        bw, bh = W / z, H / z
        cx = W / 2 + (fx_ - W / 2) * (1 - 1 / z)
        cy = H / 2 + (fy_ - H / 2) * (1 - 1 / z)
        x0, y0 = min(max(cx - bw / 2, 0), W - bw), min(max(cy - bh / 2, 0), H - bh)
        frame = frame.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + bw, y0 + bh))
    if sc.get("card"):
        card_text(frame, sc["lines"][0][1], t, sc["P"][0], sc["E"][0] - 0.15)
    elif "card_text" in sc:
        card_text(frame, sc["card_text"], t, 0.3, 1.5)
    elif "title" in sc:
        u = ease(t / 0.5)
        f = font(120)
        d = ImageDraw.Draw(frame)
        v = int(245 * u)
        d.text((W / 2, H / 2), sc["title"], font=f, fill=(v, v, v - 5), anchor="mm")
        d.line([(W / 2 - 480 * u, H / 2 + 95), (W / 2 + 480 * u, H / 2 + 95)], fill=(118, 185, 0), width=8)
    else:
        for (spk, text, *_), p0, e0 in zip(sc["lines"], sc["P"], sc["E"]):
            if spk == "N" and p0 - 0.05 <= t <= e0 + 0.35:
                img = caption_image(text, dark=sc["bg"] in ("stage",))
                frame.alpha_composite(img, (int(W / 2 - img.width / 2), 18))
    rgb = frame.convert("RGB")
    fade = min(1.0, Tg / 0.5, (TOTAL - Tg) / 1.2)
    if fade < 1:
        rgb = Image.eval(rgb, lambda v, k=max(0.0, fade): int(v * k))
    return rgb


# ----------------------------------------------------------------------------- sound
def synth(name, rng):
    def tv(d): return np.arange(int(d * SR)) / SR
    def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
    if name == "pop":
        x = tv(0.12)
        return np.sin(2 * np.pi * (600 + 900 * x / 0.12) * x) * np.exp(-x * 40) * 0.5
    if name == "whoosh":
        x = tv(1.0)
        return lp(rng.normal(0, 1, len(x)), 16) * np.sin(np.pi * np.clip(x, 0, 1)) ** 2 * 0.6 + np.sin(2 * np.pi * 50 * x) * np.exp(-x * 4) * 0.4
    if name == "heartbeat":
        out = np.zeros(int(3.6 * SR))
        x = tv(0.18)
        beat = np.sin(2 * np.pi * 52 * x) * np.exp(-x * 26)
        for k in range(3):
            for off, g in ((0.0, 1.0), (0.26, 0.7)):
                s = int((k * 1.05 + off) * SR)
                out[s:s + len(beat)] += beat * g
        return out * 0.9
    if name == "cash":
        x = tv(0.9)
        return (np.sin(2 * np.pi * 1318 * x) * np.exp(-x * 7) + np.sin(2 * np.pi * 1760 * np.clip(x - 0.09, 0, None)) * np.exp(-np.clip(x - 0.09, 0, None) * 7) * (x > 0.09)) * 0.3
    if name == "chime":
        x = tv(2.0)
        out = np.zeros(len(x))
        for k, fr in enumerate((523.25, 659.25, 783.99, 1046.5)):
            xx = np.clip(x - k * 0.09, 0, None)
            out += np.sin(2 * np.pi * fr * xx) * np.exp(-xx * 2.5) * (x > k * 0.09)
        return out * 0.18
    if name in ("applause", "cheer"):
        d = 3.2 if name == "applause" else 3.0
        x = tv(d)
        out = np.zeros(len(x))
        clap = np.exp(-np.arange(int(0.02 * SR)) / SR * 300)
        for s in rng.integers(0, len(x) - len(clap), int(d * 70)):
            out[s:s + len(clap)] += clap * rng.uniform(0.3, 1) * rng.choice([-1, 1])
        out = lp(out, 3) + (lp(rng.normal(0, 1, len(x)), 6) * 0.25 if name == "cheer" else 0)
        env = np.clip(np.minimum(x / 0.4, (d - x) / 1.2), 0, 1)
        return out * env * 0.22
    if name == "type":
        x = tv(0.03)
        return rng.normal(0, 1, len(x)) * np.exp(-x * 300) * 0.25
    if name == "step":
        x = tv(0.08)
        return lp(rng.normal(0, 1, len(x)), 30) * np.exp(-x * 60) * 0.45
    raise ValueError(name)


def music(n, spans):
    t = np.arange(n) / SR
    tense = [[146.83, 174.61, 220.0], [116.54, 146.83, 174.61], [130.81, 164.81, 196.0], [110.0, 138.59, 164.81]]
    bright = [[146.83, 185.0, 220.0], [110.0, 138.59, 164.81], [123.47, 146.83, 185.0], [98.0, 123.47, 146.83]]

    def bed(chords, pulse):
        out = np.zeros(n)
        seg = 4.0
        for i in range(int(n / SR / seg) + 1):
            s, e = int(i * seg * SR), min(n, int(((i + 1) * seg + 1.5) * SR))
            if s >= n:
                break
            x = t[s:e] - i * seg
            env = np.clip(x / 1.2, 0, 1) * np.clip((seg + 1.5 - x) / 1.5, 0, 1)
            for fr in chords[i % 4]:
                out[s:e] += env * 0.026 * (np.sin(2 * np.pi * fr * x) + 0.3 * np.sin(2 * np.pi * 2 * fr * x + 0.7))
            out[s:e] += env * 0.05 * np.sin(2 * np.pi * chords[i % 4][0] / 2 * x)
        beat = (t * pulse) % 1
        out += np.sin(2 * np.pi * 55 * t) * np.exp(-beat * 14) * 0.08
        return out
    a, b = bed(tense, 1.6), bed(bright, 2.0)
    gb = np.zeros(n)
    for t0, t1 in spans:
        gb = np.maximum(gb, np.clip(np.minimum((t - t0) / 0.8 + 0.5, (t1 - t) / 0.8 + 0.5), 0, 1))
    mix = a * (1 - gb) + b * gb
    return mix * np.clip(np.minimum(t / 1.0, (n / SR - t) / 2.0), 0, 1)


def build_audio(TOTAL, steps):
    n = int((TOTAL + 0.5) * SR)
    voice, sfx = np.zeros(n, np.float32), np.zeros(n, np.float32)
    rng = np.random.default_rng(8)
    subs, bright = [], []

    def add(buf, at, a, g=1.0):
        s = int(at * SR)
        if 0 <= s < n:
            e = min(n, s + len(a))
            buf[s:e] += a[: e - s] * g
    for sc in SCENES:
        st = sc["start"]
        for (spk, text, *_), p0, e0, a in zip(sc["lines"], sc["P"], sc["E"], sc["audio"]):
            add(voice, st + p0, a, 1.0 if spk == "N" else 0.95)
            subs.append((st + p0, st + e0, text))
        if sc["mood"] == "bright":
            bright.append((st, st + sc["dur"]))
        for when, name in sc.get("sfx", []):
            if isinstance(when, str):
                li, off = when[4:].split("+")
                when = sc["P"][int(li)] + float(off)
            add(sfx, st + when, synth(name, rng))
        if sc.get("card"):
            text, p0, e0 = sc["lines"][0][1], sc["P"][0], sc["E"][0] - 0.15
            for k in range(len(text)):
                if text[k] != " ":
                    add(sfx, st + p0 + (e0 - p0) * k / len(text), synth("type", rng))
        if "card_text" in sc:
            text = sc["card_text"]
            for k in range(len(text)):
                if text[k] != " ":
                    add(sfx, st + 0.3 + 1.2 * k / len(text), synth("type", rng))
    for at in steps:
        add(sfx, at, synth("step", rng), 0.6)
    mix = voice + music(n, bright) * 0.9 + sfx
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    return mix.astype(np.float32), subs


def srt_time(x):
    h, x = divmod(x, 3600)
    m, x = divmod(x, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(x):02d},{int((x % 1) * 1000):03d}"


def main():
    TOTAL = build_timeline()
    print(f"length {TOTAL:.1f}s", flush=True)
    steps, last = [], -9
    for af in range(int(TOTAL * AFPS)):
        Tg = af / AFPS
        sc = scene_at(Tg)
        if "cast" not in sc:
            continue
        t = Tg - sc["start"]
        for _, p, *_ in sc["cast"](sc, t, math.floor(t * AFPS + 1e-6) / AFPS):
            if p.get("step") and af - last > 1:
                steps.append(Tg)
                last = af
    mix, subs = build_audio(TOTAL, steps)
    wav = os.path.join(BUILD, "mix.wav")
    with wave.open(wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((mix * 32767).astype(np.int16).tobytes())
    with open(os.path.join(BUILD, "nvidia_story_sample.srt"), "w") as f:
        for i, (a, b, txt) in enumerate(subs, 1):
            f.write(f"{i}\n{srt_time(a)} --> {srt_time(b + 0.15)}\n{txt}\n\n")
    out = os.path.join(BUILD, "nvidia_story_sample.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", out], stdin=subprocess.PIPE)
    N = int(TOTAL * FPS)
    for i in range(N):
        ff.stdin.write(render_frame(i / FPS, TOTAL).tobytes())
        if i % 240 == 0:
            print(f"frame {i}/{N}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("done:", out, flush=True)


if __name__ == "__main__":
    main()
