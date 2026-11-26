#!/usr/bin/env python3
"""
"What if you were the last human alive?" - chapters 1-2 as an animated explainer.

Look: hand-drawn ink + watercolor scenes on cream paper (AI backgrounds run through
tools/toonify.py), a stick figure animated drawing-by-drawing at 12 drawings per second
("on twos", like hand-drawn cartoons; one walk step cycle = 10 drawings), hand-lettered
keyword titles, offline narration (Piper TTS), generated music and sound effects.

Run:  python3 make_video.py            -> build/last_human_sample.mp4 (+ .srt subtitles)
      python3 make_video.py --sheet     -> build/walk_cycle_10_drawings.png
"""
import hashlib, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
os.makedirs(os.path.join(BUILD, "tts"), exist_ok=True)
VOICE = os.environ.get("PIPER_VOICE", "/tmp/claude-0/-home-user-bookish-octo-palm-tree/"
                       "a014b4f3-0de3-5f09-b465-e24ff547bf22/scratchpad/voice/en_US-ryan-high.onnx")
FONT_TITLE = os.path.join(HERE, "tools", "fonts", "PatrickHandSC-Regular.ttf")
FONT_HAND = os.path.join(HERE, "tools", "fonts", "PatrickHand-Regular.ttf")

W, H, FPS, AFPS = 1920, 1080, 24, 12          # video fps / drawings per second
INK = (40, 40, 46)
PAPER = (248, 244, 236)
SHIRT = (78, 138, 166)
SR = 44100
LENGTH_SCALE = 1.1                             # narrator pace (bigger = slower)


def clip01(x): return max(0.0, min(1.0, x))
def ease(x): x = clip01(x); return x * x * (3 - 2 * x)


# ----------------------------------------------------------------------------- narration
def tts(text):
    key = hashlib.md5(f"{text}|{LENGTH_SCALE}".encode()).hexdigest()[:12]
    path = os.path.join(BUILD, "tts", key + ".wav")
    if not os.path.exists(path):
        subprocess.run([sys.executable, "-m", "piper", "-m", VOICE, "-f", path,
                        "--length-scale", str(LENGTH_SCALE)], input=text.encode(),
                       check=True, capture_output=True)
    with wave.open(path) as wf:
        sr = wf.getframerate()
        a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    idx = np.nonzero(np.abs(a) > 0.012)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.06 * sr)]
    n = int(len(a) * SR / sr)                    # resample to 44.1 kHz
    return np.interp(np.arange(n) * sr / SR, np.arange(len(a)), a).astype(np.float32)


# ----------------------------------------------------------------------------- the stick figure
TORSO, HEAD_R, UPPER_ARM, FOREARM, THIGH, SHIN, FOOT = 58, 25, 30, 28, 38, 36, 11
BOX = (-170, 170, -345, 30)                    # drawing box around the ground point, in figure units


def vec(a, length):
    """Angle in degrees measured from straight down; positive = toward screen right."""
    r = math.radians(a)
    return np.array([math.sin(r) * length, math.cos(r) * length])


def base_pose(**kw):
    p = dict(lean=0.0, legs=[(-6, -4), (6, 4)], arms=[(-15, -8), (15, 8)], facing=0,
             eyes="dot", look=(0, 0), mouth="smile", brows=None, marks=(), prop=None,
             mask=False, yoff=0.0, tremble=False, sit=False, step=False)
    p.update(kw)
    return p


def stand(f=0, **kw):
    if f == 0:
        p = base_pose()
    else:
        p = base_pose(legs=[(-f * 3, -f * 3), (f * 4, f * 4)], arms=[(-f * 6, f * 4), (f * 8, f * 24)], facing=f)
    p.update(kw)
    return p


A_LEG = 26


def walk(phi, f, **kw):
    """One drawing of the walk cycle. phi = position in the cycle (0..2pi)."""
    legs, arms = [], []
    for i in range(2):
        ph = phi + i * math.pi
        th = A_LEG * math.sin(ph)
        knee = 8 + 44 * max(0.0, math.cos(ph)) ** 1.3      # knee bends while the leg swings forward
        legs.append((f * th, f * (th - knee)))
        au = -0.85 * A_LEG * math.sin(ph)                  # arms swing opposite to legs
        arms.append((f * au, f * (au + 22)))
    p = base_pose(legs=legs, arms=arms, facing=f, lean=f * 4)
    p.update(kw)
    return p


def _foot_x(legs): return [vec(t, THIGH)[0] + vec(s, SHIN)[0] for t, s in legs]


STEP_U = abs(np.subtract(*_foot_x(walk(math.pi / 2, 1)["legs"])))
WALK_SPEED_U = 2 * STEP_U / (10 / AFPS)       # figure units per second (10 drawings per cycle)


def walking(tq, f, t0=0.0, **kw):
    k = int(round((tq - t0) * AFPS))
    p = walk(2 * math.pi * (k % 10) / 10, f, **kw)
    p["step"] = (k % 5 == 2)                  # a foot lands twice per cycle
    return p


def idle(p, tq, amt=2.5):
    s = math.sin(2 * math.pi * tq / 2.2) * amt
    p["arms"] = [(p["arms"][0][0] - s, p["arms"][0][1] - s), (p["arms"][1][0] + s, p["arms"][1][1] + s)]
    return p


def joints(p):
    hip = np.zeros(2)
    legs = []
    for ta, sa in p["legs"]:
        knee = hip + vec(ta, THIGH)
        legs.append([knee, knee + vec(sa, SHIN)])
    low = max(l[1][1] for l in legs)
    shift = np.array([0.0, -low - 2.0 - p["yoff"]])           # lowest foot rests on the ground
    hip = hip + shift
    legs = [[k + shift, a + shift] for k, a in legs]
    lean = math.radians(p["lean"])
    up = np.array([math.sin(lean), -math.cos(lean)])
    nrm = np.array([-up[1], up[0]])
    neck = hip + up * TORSO
    head = neck + up * (HEAD_R * 0.92)
    f = p["facing"]
    off = 11 if f == 0 else 2
    shoulders = [neck - up * 9 - nrm * off, neck - up * 9 + nrm * off]
    arms = []
    for i, (ua, fa) in enumerate(p["arms"]):
        e = shoulders[i] + vec(ua, UPPER_ARM)
        arms.append([shoulders[i], e, e + vec(fa, FOREARM)])
    return dict(hip=hip, legs=legs, up=up, nrm=nrm, neck=neck, head=head, arms=arms)


def hand_pos(p, x, gy, s, i=1):
    h = joints(p)["arms"][i][2]
    return x + h[0] * s, gy + h[1] * s


def draw_prop(d, kind, hx, hy, P, k):
    def rect(x0, y0, x1, y1, fill, r=2, w=1.0):
        d.rounded_rectangle([*P((x0, y0)), *P((x1, y1))], radius=r * k, fill=fill, outline=INK, width=max(1, int(w * k * 1.6)))
    if kind == "phone":
        rect(hx - 5, hy - 15, hx + 5, hy + 4, (45, 45, 52), 2)
        rect(hx - 3.6, hy - 13, hx + 3.6, hy + 1, (176, 214, 236), 1, 0.5)
    elif kind == "remote":
        rect(hx - 3, hy - 12, hx + 3, hy + 3, (60, 60, 66), 1.5)
        d.ellipse([*P((hx - 1.4, hy - 9.5)), *P((hx + 1.4, hy - 6.7))], fill=(214, 60, 50))
    elif kind == "bottle":
        rect(hx - 5, hy - 23, hx + 5, hy + 4, (160, 206, 238), 3)
        rect(hx - 3, hy - 28, hx + 3, hy - 22, (52, 112, 192), 1)
        rect(hx - 5, hy - 14, hx + 5, hy - 8, (240, 240, 235), 0, 0.5)
    elif kind == "sandwich":
        rect(hx - 10, hy - 7, hx + 10, hy + 3, (232, 196, 132), 3)
        d.line([P((hx - 9, hy - 2)), P((hx + 9, hy - 2))], fill=(104, 168, 80), width=max(2, int(k * 2.4)))
    elif kind == "fist":
        d.ellipse([*P((hx - 4.5, hy - 4.5)), *P((hx + 4.5, hy + 4.5))], fill=(253, 251, 246), outline=INK, width=max(2, int(k * 2.2)))
        d.line([P((hx + 1, hy - 4)), P((hx + 1, hy - 11))], fill=INK, width=max(2, int(k * 3)))


def render_figure(p, scale, seed):
    """Draw one drawing of the figure (2x supersampled, then shrunk for smooth lines)."""
    ss = scale * 2.0
    x0, x1, y0, y1 = BOX
    cw, ch = int((x1 - x0) * ss), int((y1 - y0) * ss)
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(seed)

    def P(q): return ((q[0] - x0) * ss, (q[1] - y0) * ss)
    lw = max(2, int(3.0 * ss))

    def line(pts, width=lw, color=INK, wob=0.55):
        pts = [np.asarray(q, float) for q in pts]
        out = []
        for a, b in zip(pts[:-1], pts[1:]):
            out += [a, (a + b) / 2 + rng.normal(0, wob, 2)]
        out.append(pts[-1])
        xy = [P(q) for q in out]
        d.line(xy, fill=color, width=width, joint="curve")
        for q in (xy[0], xy[-1]):
            r = width / 2
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=color)

    j = joints(p)
    J = lambda: rng.normal(0, 0.45, 2)          # the "boil" of hand-drawn lines
    hip, up, nrm, f = j["hip"], j["up"], j["nrm"], p["facing"]
    legs = [[k + J(), a + J()] for k, a in j["legs"]]
    arms = [[s, e + J(), h + J()] for s, e, h in j["arms"]]
    head = j["head"] + J() * 0.5

    # shadow + crate
    sw = 26 * (1 - min(0.5, p["yoff"] / 120))
    d.ellipse([*P((hip[0] - sw, -4)), *P((hip[0] + sw, 4))], fill=(30, 25, 20, 46))
    if p["sit"]:
        cx, top = hip[0], hip[1] + 4
        d.rectangle([*P((cx - 25, top)), *P((cx + 25, 0))], fill=(178, 126, 76), outline=INK, width=int(lw * 0.7))
        for fr in (0.36, 0.68):
            yy = top + (0 - top) * fr
            line([(cx - 23, yy), (cx + 23, yy)], width=int(lw * 0.45), wob=0.3)

    back, front = ([], [0, 1]) if f == 0 else ([0], [1])
    for i in back:
        line(arms[i])
    for li, (k, a) in enumerate(legs):
        line([hip, k, a])
        dirx = f if f != 0 else (-1 if li == 0 else 1)
        line([a, a + np.array([dirx * FOOT, 0.6])], width=int(lw * 1.3), wob=0.2)

    def tp(dd, hw): return hip + up * dd + nrm * hw + rng.normal(0, 0.35, 2)
    shirt = [tp(TORSO - 3, -11), tp(TORSO - 11, -15), tp(6, -14), tp(-9, -16),
             tp(-9, 16), tp(6, 14), tp(TORSO - 11, 15), tp(TORSO - 3, 11)]
    d.polygon([P(q) for q in shirt], fill=SHIRT, outline=INK, width=int(lw * 0.8))
    for i in front:
        line(arms[i])

    # head
    R = HEAD_R
    hb = [*P(head - R), *P(head + R)]
    d.ellipse(hb, fill=(253, 251, 246), outline=INK, width=lw)
    for dx in (-5, 0, 5):                       # little hair tuft
        s0 = head + up * (R - 1) + nrm * dx
        line([s0, s0 + up * 7 + nrm * (dx * 0.5 + 2)], width=int(lw * 0.75), wob=0.3)

    if p["eyes"] != "none":
        fx = f * 0.36 * R
        cx, cy = head[0] + fx, head[1]
        sep = 0.30 * R * (1 - 0.3 * abs(f))
        lx, ly = p["look"]
        ey = cy - 0.08 * R
        for s in (-1, 1):
            ex = cx + s * sep
            if p["eyes"] == "dot":
                r, ox, oy = 0.11 * R, lx * 0.08 * R, ly * 0.08 * R
                d.ellipse([*P((ex + ox - r, ey + oy - r)), *P((ex + ox + r, ey + oy + r))], fill=INK)
            elif p["eyes"] == "wide":
                r = 0.2 * R
                d.ellipse([*P((ex - r, ey - r)), *P((ex + r, ey + r))], fill=(255, 255, 255), outline=INK, width=int(lw * 0.5))
                r2, ox, oy = 0.085 * R, lx * 0.07 * R, ly * 0.07 * R
                d.ellipse([*P((ex + ox - r2, ey + oy - r2)), *P((ex + ox + r2, ey + oy + r2))], fill=INK)
            elif p["eyes"] == "closed":
                r = 0.13 * R
                d.arc([*P((ex - r, ey - r)), *P((ex + r, ey + r))], 200, 340, fill=INK, width=int(lw * 0.6))
            b = p["brows"]
            if b:
                ix, ox_ = ex - s * 0.15 * R, ex + s * 0.15 * R
                iy, oy_ = {"worried": (-0.40, -0.27), "angry": (-0.22, -0.36), "raised": (-0.44, -0.40)}[b]
                line([(ix, ey + iy * R), (ox_, ey + oy_ * R)], width=int(lw * 0.6), wob=0.15)
        my = cy + 0.44 * R
        m = p["mouth"]
        mw = int(lw * 0.65)
        if p["mask"]:
            d.rounded_rectangle([*P((cx - 0.46 * R, cy + 0.1 * R)), *P((cx + 0.46 * R, cy + 0.8 * R))], radius=0.2 * R * ss,
                                fill=(128, 138, 130), outline=INK, width=int(lw * 0.6))
            cc = (cx + (f * 0.42 * R if f else 0), cy + 0.62 * R)
            d.ellipse([*P((cc[0] - 0.22 * R, cc[1] - 0.22 * R)), *P((cc[0] + 0.22 * R, cc[1] + 0.22 * R))],
                      fill=(88, 94, 90), outline=INK, width=int(lw * 0.5))
            line([(cx - 0.46 * R, cy + 0.3 * R), (head[0] - R * 0.97, cy + 0.05 * R)], width=int(lw * 0.5), wob=0.1)
            line([(cx + 0.46 * R, cy + 0.3 * R), (head[0] + R * 0.97, cy + 0.05 * R)], width=int(lw * 0.5), wob=0.1)
        elif m == "smile":
            d.arc([*P((cx - 0.22 * R, my - 0.18 * R)), *P((cx + 0.22 * R, my + 0.12 * R))], 20, 160, fill=INK, width=mw)
        elif m == "big":
            d.chord([*P((cx - 0.27 * R, my - 0.22 * R)), *P((cx + 0.27 * R, my + 0.24 * R))], 0, 180, fill=(132, 44, 44), outline=INK, width=mw)
        elif m == "O":
            d.ellipse([*P((cx - 0.1 * R, my - 0.1 * R)), *P((cx + 0.1 * R, my + 0.15 * R))], fill=(96, 34, 34), outline=INK, width=mw)
        elif m == "line":
            line([(cx - 0.15 * R, my), (cx + 0.15 * R, my)], width=mw, wob=0.1)
        elif m == "frown":
            d.arc([*P((cx - 0.2 * R, my)), *P((cx + 0.2 * R, my + 0.3 * R))], 200, 340, fill=INK, width=mw)

    if p["prop"]:
        hx, hy = arms[1][2]
        draw_prop(d, p["prop"], hx, hy, P, ss)
    for mk in p["marks"]:
        if mk in ("?", "!"):
            font = ImageFont.truetype(FONT_HAND, int(44 * ss))
            d.text(P((head[0] + R * 0.75, head[1] - R * 2.4)), mk, font=font, fill=INK)
        elif mk == "sweat":
            sx = head[0] + (-f if f else 1) * R * 1.12
            sy = head[1] - R * 0.3
            d.polygon([P((sx, sy - 9)), P((sx - 4.2, sy + 1)), P((sx + 4.2, sy + 1))], fill=(150, 200, 240))
            d.ellipse([*P((sx - 4.4, sy - 3)), *P((sx + 4.4, sy + 5.5))], fill=(150, 200, 240), outline=INK, width=int(lw * 0.35))
    return img.resize((cw // 2, ch // 2), Image.LANCZOS)


_fig_cache = {}


def paste_figure(frame, p, x, gy, s, seed):
    key = (repr(sorted(p.items())), round(s, 3), seed)
    if key not in _fig_cache:
        if len(_fig_cache) > 64:
            _fig_cache.clear()
        _fig_cache[key] = render_figure(p, s, seed)
    img = _fig_cache[key]
    if p["tremble"]:
        x += (2.5 if seed % 2 else -2.5) * s
    frame.alpha_composite(img, (int(round(x + BOX[0] * s)), int(round(gy + BOX[2] * s))))


# ----------------------------------------------------------------------------- titles
_title_cache = {}


def title_image(text, style, size):
    key = (text, style, size)
    if key in _title_cache:
        return _title_cache[key]
    font = ImageFont.truetype(FONT_TITLE, size)
    bb = font.getbbox(text)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    pad = int(size * 0.4)
    img = Image.new("RGBA", (tw + 2 * pad, th + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    org = (pad - bb[0], pad - bb[1])
    if style == "box":
        rng = np.random.default_rng(len(text))
        m = pad * 0.45
        w_, h_ = img.size
        pts = [(m, m), (w_ - m, m), (w_ - m, h_ - m), (m, h_ - m)]
        pts = [(a + rng.normal(0, 2), b + rng.normal(0, 2)) for a, b in pts]
        d.polygon(pts, fill=(250, 246, 234), outline=INK, width=max(3, size // 24))
        d.text(org, text, font=font, fill=INK, stroke_width=max(1, size // 45), stroke_fill=INK)
    elif style == "light":
        d.text(org, text, font=font, fill=(250, 246, 236), stroke_width=max(3, size // 13), stroke_fill=(32, 32, 38))
    else:
        col = (196, 46, 38) if style == "red" else INK
        d.text(org, text, font=font, fill=(250, 246, 236, 200), stroke_width=max(4, size // 11), stroke_fill=(250, 246, 236, 200))
        d.text(org, text, font=font, fill=col, stroke_width=max(1, size // 45), stroke_fill=col)
    _title_cache[key] = img
    return img


def draw_title(frame, spec, t):
    at = spec["at"]
    if t < at or ("until" in spec and t > spec["until"]):
        return
    u = clip01((t - at) / 0.18)
    a = u if "until" not in spec else u * clip01((spec["until"] - t) / 0.12)
    img = title_image(spec["text"], spec.get("style", "ink"), spec.get("size", 118))
    sc = 0.8 + 0.2 * (1 - (1 - u) ** 3)
    if sc != 1:
        img = img.resize((max(1, int(img.width * sc)), max(1, int(img.height * sc))), Image.BILINEAR)
    if a < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
    cx = spec.get("x", W / 2)
    cy = spec.get("y", 120)
    frame.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


# ----------------------------------------------------------------------------- scene effects
def fx_ground(y, x0=0.22 * W, x1=0.78 * W):
    def f(img, sc, t, tq, af):
        rng = np.random.default_rng(af % 997)
        pts = [(x, y + rng.normal(0, 0.9)) for x in np.linspace(x0, x1, 14)]
        ImageDraw.Draw(img).line(pts, fill=(98, 90, 82), width=4, joint="curve")
    return f


def fx_tv(cx, cy, on_key, w=440, h=320):
    def f(img, sc, t, tq, af):
        d = ImageDraw.Draw(img)
        top = cy - h / 2
        d.line([(cx - 40, top), (cx - 120, top - 120)], fill=INK, width=6)
        d.line([(cx + 30, top), (cx + 100, top - 135)], fill=INK, width=6)
        d.rounded_rectangle([cx - w / 2, top, cx + w / 2, cy + h / 2], radius=34, fill=(164, 114, 78), outline=INK, width=7)
        sx0, sy0, sx1, sy1 = cx - w / 2 + 32, top + 32, cx + w / 2 - 104, cy + h / 2 - 32
        if tq >= on_key(sc):
            noise = np.random.default_rng(af).integers(50, 240, (36, 56)).astype(np.uint8)
            img.paste(Image.fromarray(noise, "L").resize((int(sx1 - sx0), int(sy1 - sy0)), Image.NEAREST).convert("RGBA"), (int(sx0), int(sy0)))
            d.rounded_rectangle([sx0, sy0, sx1, sy1], radius=20, outline=INK, width=6)
        else:
            d.rounded_rectangle([sx0, sy0, sx1, sy1], radius=20, fill=(44, 50, 56), outline=INK, width=6)
        for k in range(2):
            d.ellipse([cx + w / 2 - 78, top + 52 + k * 86, cx + w / 2 - 36, top + 94 + k * 86], fill=(96, 72, 56), outline=INK, width=5)
        d.line([(cx - w / 2 + 60, cy + h / 2), (cx - w / 2 + 38, cy + h / 2 + 58)], fill=INK, width=7)
        d.line([(cx + w / 2 - 60, cy + h / 2), (cx + w / 2 - 38, cy + h / 2 + 58)], fill=INK, width=7)
    return f


def fx_big_phone(cx, cy, at_key):
    def f(img, sc, t, tq, af):
        at = at_key(sc)
        if t < at:
            return
        s = 0.75 + 0.25 * ease((t - at) / 0.2)
        w, h = 250 * s, 450 * s
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], radius=38 * s, fill=(48, 48, 54), outline=INK, width=7)
        d.rounded_rectangle([cx - w / 2 + 16 * s, cy - h / 2 + 40 * s, cx + w / 2 - 16 * s, cy + h / 2 - 40 * s], radius=14 * s, fill=(222, 236, 244))
        bx, by = cx - 70 * s, cy - 20 * s
        for k in range(4):
            bh = (24 + k * 26) * s
            d.rectangle([bx + k * 34 * s, by - bh, bx + k * 34 * s + 22 * s, by], outline=(70, 70, 78), width=5)
        d.line([(cx + 66 * s, cy - 120 * s), (cx + 112 * s, cy - 74 * s)], fill=(206, 50, 42), width=int(11 * s))
        d.line([(cx + 112 * s, cy - 120 * s), (cx + 66 * s, cy - 74 * s)], fill=(206, 50, 42), width=int(11 * s))
        font = ImageFont.truetype(FONT_HAND, int(44 * s))
        d.text((cx, cy + 70 * s), "No Service", font=font, fill=(70, 70, 78), anchor="mm")
    return f


_glow = None


def fx_bulb(bx, by, on_key):
    def f(img, sc, t, tq, af):
        global _glow
        on = tq >= on_key(sc)
        d = ImageDraw.Draw(img)
        if on:
            if _glow is None:
                yy, xx = np.mgrid[-330:330, -330:330]
                a = np.clip(1 - np.sqrt(xx ** 2 + yy ** 2) / 330, 0, 1) ** 2 * 150
                g = np.zeros((660, 660, 4), np.uint8)
                g[..., 0], g[..., 1], g[..., 2], g[..., 3] = 255, 226, 120, a.astype(np.uint8)
                _glow = Image.fromarray(g, "RGBA")
            img.alpha_composite(_glow, (int(bx - 330), int(by - 330)))
            rng = np.random.default_rng(af)
            for k in range(10):
                ang = 2 * math.pi * k / 10 + 0.3
                r0, r1 = 95 + rng.normal(0, 3), 140 + rng.normal(0, 5)
                d.line([(bx + math.cos(ang) * r0, by + math.sin(ang) * r0), (bx + math.cos(ang) * r1, by + math.sin(ang) * r1)],
                       fill=(232, 170, 40), width=7)
        d.line([(bx, 0), (bx, by - 95)], fill=INK, width=6)
        d.rectangle([bx - 28, by - 100, bx + 28, by - 55], fill=(150, 150, 150), outline=INK, width=6)
        d.ellipse([bx - 62, by - 70, bx + 62, by + 58], fill=(255, 228, 112) if on else (226, 224, 214), outline=INK, width=7)
        d.arc([bx - 30, by - 30, bx + 30, by + 20], 200, 340, fill=(150, 110, 60) if on else (140, 140, 140), width=5)
    return f


def fx_clock(cx, cy, r=150):
    def f(img, sc, t, tq, af):
        d = ImageDraw.Draw(img)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(252, 249, 240), outline=INK, width=9)
        for k in range(12):
            a = 2 * math.pi * k / 12
            d.line([(cx + math.sin(a) * r * 0.78, cy - math.cos(a) * r * 0.78), (cx + math.sin(a) * r * 0.9, cy - math.cos(a) * r * 0.9)], fill=INK, width=6)
        am, ah = 2 * math.pi * tq / 0.5, 2 * math.pi * tq / 6.0
        d.line([(cx, cy), (cx + math.sin(am) * r * 0.72, cy - math.cos(am) * r * 0.72)], fill=INK, width=8)
        d.line([(cx, cy), (cx + math.sin(ah) * r * 0.48, cy - math.cos(ah) * r * 0.48)], fill=INK, width=12)
        d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=INK)
    return f


def fx_trefoil(cx, cy, at_key, r=70):
    def f(img, sc, t, tq, af):
        at = at_key(sc)
        if t < at:
            return
        s = r * (0.7 + 0.3 * ease((t - at) / 0.2))
        d = ImageDraw.Draw(img)
        d.ellipse([cx - s, cy - s, cx + s, cy + s], fill=(250, 206, 50), outline=INK, width=6)
        for k in range(3):
            st = -90 + k * 120 - 30
            d.pieslice([cx - s * 0.85, cy - s * 0.85, cx + s * 0.85, cy + s * 0.85], st, st + 60, fill=INK)
        d.ellipse([cx - s * 0.26, cy - s * 0.26, cx + s * 0.26, cy + s * 0.26], fill=(250, 206, 50))
        d.ellipse([cx - s * 0.17, cy - s * 0.17, cx + s * 0.17, cy + s * 0.17], fill=INK)
    return f


def fx_ash(n=170, wind=0.0, seed=3):
    rng = np.random.default_rng(seed)
    x0, y0 = rng.uniform(0, W, n), rng.uniform(0, H, n)
    vy, vx = rng.uniform(35, 85, n), wind * rng.uniform(0.7, 1.3, n)
    sway, r = rng.uniform(0, 6.28, n), rng.uniform(2.0, 6.0, n)
    shade = rng.uniform(0, 1, n)

    def f(img, sc, t, tq, af):
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        x = (x0 + vx * tq + 16 * np.sin(tq * 1.4 + sway)) % (W + 40) - 20
        y = (y0 + vy * tq) % (H + 40) - 20
        for i in range(n):
            c = (214, 214, 206, 190) if shade[i] > 0.35 else (118, 120, 112, 170)
            d.ellipse([x[i] - r[i], y[i] - r[i], x[i] + r[i], y[i] + r[i]], fill=c)
        if wind:
            rng2 = np.random.default_rng(7)
            for k in range(7):
                yy = rng2.uniform(0.15, 0.85) * H
                xx = (rng2.uniform(0, W) + wind * 2.2 * tq) % (W + 600) - 300
                pts = [(xx + s_, yy + 14 * math.sin(s_ / 45 + k)) for s_ in np.linspace(0, 260, 12)]
                d.line(pts, fill=(250, 250, 245, 150), width=5, joint="curve")
        img.alpha_composite(layer)
    return f


def fx_stripe(x0, x1, y0, y1):
    def f(img, sc, t, tq, af):
        ImageDraw.Draw(img).rectangle([x0, y0, x1, y1], fill=(206, 50, 44))
    return f


def fx_red_cross(cx, cy, s=58):
    def f(img, sc, t, tq, af):
        d = ImageDraw.Draw(img)
        d.rectangle([cx - s * 0.32, cy - s, cx + s * 0.32, cy + s], fill=(206, 50, 44), outline=INK, width=4)
        d.rectangle([cx - s, cy - s * 0.32, cx + s, cy + s * 0.32], fill=(206, 50, 44), outline=INK, width=4)
        d.rectangle([cx - s * 0.32 + 2, cy - s * 0.32 + 2, cx + s * 0.32 - 2, cy + s * 0.32 - 2], fill=(206, 50, 44))
    return f


_phone_img = None


def fx_falling_phone(start_key, x, y0, gy):
    g = 2600.0

    def f(img, sc, t, tq, af):
        global _phone_img
        t0 = start_key(sc)
        if tq < t0:
            return
        if _phone_img is None:
            ph = Image.new("RGBA", (40, 70), (0, 0, 0, 0))
            dd = ImageDraw.Draw(ph)
            dd.rounded_rectangle([2, 2, 37, 67], radius=7, fill=(45, 45, 52), outline=INK, width=3)
            dd.rounded_rectangle([7, 9, 32, 58], radius=3, fill=(176, 214, 236))
            _phone_img = ph
        dt = tq - t0
        t_hit = math.sqrt(2 * (gy - 20 - y0) / g)
        if dt < t_hit:
            yy, ang = y0 + 0.5 * g * dt * dt, 620 * dt
        else:
            yy, ang = gy - 20, 90
        rot = _phone_img.rotate(ang, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(rot, (int(x - rot.width / 2), int(yy - rot.height / 2)))
    return f


# ----------------------------------------------------------------------------- the story
PAPER_GY = 0.86 * H
SCENES = []


def scene(**kw):
    kw.setdefault("titles", [])
    kw.setdefault("fx", [])
    kw.setdefault("post", [])
    kw.setdefault("zoom", 0.035)
    SCENES.append(kw)


def T(sc, i, d=0.0): return sc["P"][i] + d          # time of phrase i (+offset), seconds into the scene
def END(sc, i, d=0.0): return sc["E"][i] + d


# --- hook
scene(name="hook", bg="paper", lines=["What if you were the last human alive?"], pad=0.7, zoom=0.0,
      titles=[dict(at=0.1, text="WHAT IF YOU WERE", y=150, size=104),
              dict(at=0.7, text="THE LAST HUMAN ALIVE?", y=290, size=132)],
      fx=[fx_ground(PAPER_GY)],
      fig=lambda sc, t, tq: [(idle(stand(0, mouth="line", brows="worried",
                                         look=(-1, 0) if tq < 1.1 else ((1, 0) if tq < 2.2 else (0, 0))), tq),
                              W / 2, PAPER_GY, 2.2)])

# --- chapter 1
scene(name="ch1", bg="paper", silent=1.8, zoom=0.0, sfx=[(0.0, "whoosh")],
      titles=[dict(at=0.05, text="CHAPTER 1", y=430, size=70),
              dict(at=0.25, text="THE DAY EVERYTHING ENDED", y=560, size=124, style="box")])


def _wake(sc, t, tq):
    k = max(0.0, ease((tq - 0.25) / 0.6) - ease((tq - 2.0) / 0.5))
    p = stand(0, arms=[(-15 - 150 * k, -8 - 160 * k), (15 + 150 * k, 8 + 160 * k)],
              eyes="closed" if k > 0.35 else "dot", mouth="O" if k > 0.6 else "smile")
    return [(p, 0.63 * W, 0.975 * H, 2.1)]


scene(name="wake", bg="bedroom", lines=["Imagine waking up one morning."],
      titles=[dict(at=0.3, text="ONE MORNING...", y=120, style="box", size=100)], fig=_wake)


def _window(sc, t, tq):
    q = tq >= T(sc, 1, 0.3)
    p = idle(stand(0, eyes="none", mouth="none", marks=("?",) if q else ()), tq)
    return [(p, 0.52 * W, 0.985 * H, 2.1)]


scene(name="window", bg="bedroom", lines=["You look outside your window,", "and something feels different."],
      zoom=0.06, focus=(0.52 * W, 0.45 * H), fig=_window)

scene(name="empty", bg="street", lines=["No cars.", "No people.", "No noise."], pad=0.45, zoom=0.04,
      titles=[dict(at_line=0, text="NO CARS.", y=110, size=104),
              dict(at_line=1, text="NO PEOPLE.", y=235, size=104),
              dict(at_line=2, text="NO NOISE.", y=360, size=104)])


def _tv(sc, t, tq):
    sad = tq >= T(sc, 1)
    p = stand(1, arms=[(-6, 4), (74, 90)], prop="remote", look=(1, 0),
              mouth="frown" if sad else "smile", brows="worried" if sad else None)
    return [(p, 0.33 * W, PAPER_GY, 2.05)]


scene(name="tv", bg="paper", lines=["You turn on your television.", "Nothing."], pad=0.7, zoom=0.0,
      fx=[fx_ground(PAPER_GY, 0.15 * W, 0.85 * W), fx_tv(0.67 * W, PAPER_GY - 248, lambda sc: T(sc, 0, 1.0), w=520, h=380)],
      titles=[dict(at_line=1, text="NOTHING.", y=120, size=118)],
      sfx=[("line0+0.95", "click"), ("line0+1.0", "static")], fig=_tv)


def _phone(sc, t, tq):
    sad = tq >= T(sc, 1)
    p = stand(0, arms=[(-15, -8), (36, 166)], prop="phone", look=(0.8, -0.3),
              mouth="frown" if sad else "line", brows="worried" if sad else None)
    return [(p, 0.33 * W, PAPER_GY, 2.05)]


scene(name="phone", bg="paper", lines=["You check your phone.", "No signal."], pad=0.6, zoom=0.0,
      fx=[fx_ground(PAPER_GY, 0.15 * W, 0.55 * W), fx_big_phone(0.68 * W, 0.56 * H, lambda sc: T(sc, 0, 0.6))],
      titles=[dict(at_line=1, text="NO SIGNAL", y=110, size=110, style="red")], fig=_phone)


def _walkout(sc, t, tq):
    s, gy, xs = 2.0, 0.94 * H, 0.47 * W
    t_stop = T(sc, 1, 0.35)
    if tq < t_stop:
        x = xs - WALK_SPEED_U * s * (t_stop - tq)
        return [(walking(tq, 1), x, gy, s)]
    p = stand(0, arms=[(-140, -168), (140, 168)], eyes="wide", mouth="O", brows="raised",
              marks=("!", "sweat"), tremble=True)
    return [(p, xs, gy, s)]


scene(name="walkout", bg="street", lines=["You walk outside,", "and suddenly you realize something terrifying."],
      zoom=0.03, sfx=[("line1+0.35", "sting")], fig=_walkout)

scene(name="silent", bg="skyline", lines=["The entire world has gone silent."], pad=0.8, zoom=0.05, music="mute",
      titles=[dict(at=0.9, text="SILENCE.", y=120, size=118)],
      fig=lambda sc, t, tq: [(idle(stand(0, mouth="line"), tq), 0.5 * W, 0.955 * H, 0.95)])

scene(name="nuke", bg="mushroom", lines=["A nuclear war has destroyed civilization."], pad=0.4, zoom=0.05, shake=(0.0, 1.4),
      titles=[dict(at=0.35, text="NUCLEAR WAR", y=110, size=124, style="red")], sfx=[(0.0, "boom")],
      fig=lambda sc, t, tq: [(stand(0, eyes="none", mouth="none", tremble=tq < 1.2), 0.2 * W, 0.975 * H, 2.1)])

scene(name="billions", bg="ruins", lines=["Billions of people are dead."], pad=0.35, zoom=0.07,
      titles=[dict(at=0.25, text="BILLIONS", y=120, size=124)])


def _alive(sc, t, tq):
    if tq < T(sc, 1):
        p = stand(0, arms=[(-22, 108), (22, -108)], look=(0, 1), mouth="line")
    else:
        p = idle(stand(0, brows="raised", mouth="O"), tq)
    return [(p, 0.5 * W, 0.95 * H, 2.0)]


scene(name="alive", bg="ruins", lines=["And somehow...", "You're still alive."], pad=0.5, zoom=0.05,
      titles=[dict(at_line=1, text="STILL ALIVE", y=120, size=118)], fig=_alive)

scene(name="worse", bg="mushroom", lines=["But what happens next might be even worse than the explosion itself."],
      pad=0.6, zoom=0.06, focus=(0.6 * W, 0.6 * H),
      titles=[dict(at=1.6, text="EVEN WORSE?", y=110, size=118, style="light")],
      fig=lambda sc, t, tq: [(idle(stand(-1, brows="worried", mouth="line", marks=("sweat",), look=(-1, -0.3)), tq),
                              0.8 * W, 0.975 * H, 2.0)])

# --- chapter 2
scene(name="ch2", bg="paper", silent=2.0, zoom=0.0, sfx=[(0.0, "whoosh")],
      fx=[fx_clock(W / 2, 0.66 * H, 150)],
      titles=[dict(at=0.05, text="CHAPTER 2", y=140, size=70),
              dict(at=0.25, text="THE FIRST 24 HOURS", y=270, size=124, style="box")])


def _lucky(sc, t, tq):
    up = tq >= 0.7
    p = stand(0, arms=[(-15, -8), (62, 172) if up else (15, 8)], prop="fist" if up else None,
              mouth="big" if up else "smile", eyes="closed" if up else "dot")
    return [(idle(p, tq, 1.2), 0.5 * W, PAPER_GY, 2.2)]


scene(name="lucky", bg="paper", lines=["At first, you might think you're lucky."], zoom=0.0,
      fx=[fx_ground(PAPER_GY)], titles=[dict(at=1.2, text="LUCKY?", y=150, size=130)], fig=_lucky)


def _food(sc, t, tq):
    c = (tq % 0.75) / 0.75
    up = c < 0.42
    p = stand(1, arms=[(-6, 4), (70, -150) if up else (22, 62)], prop="sandwich",
              mouth=("O" if int(tq * 6) % 2 else "line") if not up else "smile", look=(1, 0))
    return [(p, 0.38 * W, 0.975 * H, 2.0)]


scene(name="food", bg="kitchen", lines=["You have food in your refrigerator."], zoom=0.04,
      titles=[dict(at=0.5, text="FOOD", y=120, size=124)], fig=_food)


def _power(sc, t, tq):
    on = tq >= 0.45
    p = stand(0, look=(1, -1), mouth="big" if on else "smile", eyes="dot")
    return [(idle(p, tq), 0.42 * W, PAPER_GY, 2.2)]


scene(name="power", bg="paper", lines=["You have electricity."], pad=0.4, zoom=0.0,
      fx=[fx_ground(PAPER_GY, 0.2 * W, 0.65 * W), fx_bulb(0.76 * W, 0.42 * H, lambda sc: 0.45)],
      titles=[dict(at=0.45, text="ELECTRICITY", y=120, size=118, x=0.42 * W)], sfx=[(0.42, "click")], fig=_power)


def _city(sc, t, tq):
    u = (tq % 0.7) / 0.7
    yoff = 62 * math.sin(math.pi * u)
    p = stand(0, arms=[(-150, -162), (150, 162)], legs=[(-12, -6), (12, 6)], mouth="big", eyes="closed", yoff=yoff)
    p["step"] = u < 1 / 8.4                      # landing
    return [(p, 0.5 * W, 0.94 * H, 1.9)]


scene(name="city", bg="street", lines=["You have an entire city to yourself."], zoom=0.03,
      titles=[dict(at=0.9, text="THE ENTIRE CITY", y=120, size=118)], fig=_city)


def _fallout(sc, t, tq):
    late = tq >= T(sc, 1)
    p = stand(0, look=(0, -1), brows="worried", mouth="O" if late else "line", eyes="wide" if late else "dot",
              marks=("sweat",) if late else ())
    return [(idle(p, tq), 0.5 * W, 0.94 * H, 2.0)]


scene(name="fallout", bg="ash", lines=["But nuclear explosions leave behind something invisible and extremely dangerous:",
                                       "radioactive fallout."], pad=0.5, zoom=0.04,
      post=[fx_ash(170, 0.0, 3), fx_trefoil(0.5 * W, 0.33 * H, lambda sc: T(sc, 1))],
      titles=[dict(at_line=1, text="RADIOACTIVE FALLOUT", y=110, size=110, style="box")],
      sfx=[(0.0, "wind_soft")], fig=_fallout)


def _wind(sc, t, tq):
    p = stand(1, lean=13, arms=[(-30, -12), (118, 200)], brows="angry", mouth="line", look=(1, 0), tremble=True)
    return [(p, 0.42 * W, 0.94 * H, 2.0)]


scene(name="wind", bg="ash", lines=["Depending on where you are and the direction of the wind,",
                                    "the surrounding environment could be contaminated."], pad=0.3, zoom=0.03,
      post=[fx_ash(230, -420.0, 5)],
      titles=[dict(at_line=0, at_off=2.2, until_line=1, text="WIND", y=120, size=124),
              dict(at_line=1, at_off=1.2, text="CONTAMINATED", y=120, size=118, style="red")],
      sfx=[(0.0, "wind_strong")], fig=_wind)


def _shelter(sc, t, tq):
    s, gy, xs, t_stop = 2.0, 0.93 * H, 0.45 * W, 1.0
    if tq < t_stop:
        return [(walking(tq, 1), xs - WALK_SPEED_U * s * (t_stop - tq), gy, s)]
    return [(idle(stand(1, look=(1, 0)), tq), xs, gy, s)]


scene(name="shelter", bg="shelter", lines=["You need shelter."], pad=0.35, zoom=0.03,
      titles=[dict(at=0.3, text="SHELTER", y=120, size=118, style="box")], fig=_shelter)

scene(name="water", bg="shelter", lines=["You need clean water."], pad=0.35, zoom=0.03,
      titles=[dict(at=0.3, text="CLEAN WATER", y=120, size=118, style="box")],
      fig=lambda sc, t, tq: [(stand(0, arms=[(-15, -8), (122, 176)], prop="bottle", look=(1, -1)), 0.45 * W, 0.93 * H, 2.0)])

scene(name="mask", bg="ash", lines=["And most importantly, you need to avoid radioactive dust."], pad=0.4, zoom=0.05,
      post=[fx_ash(190, -60.0, 9)], titles=[dict(at=1.3, text="AVOID THE DUST", y=120, size=118)],
      fig=lambda sc, t, tq: [(idle(stand(0, mask=True, brows="angry"), tq), 0.5 * W, 0.94 * H, 2.0)])


def _useless(sc, t, tq):
    if tq < 0.9:
        p = stand(0, arms=[(-15, -8), (36, 166)], prop="phone", look=(0.8, -0.3), mouth="line")
    else:
        p = stand(0, arms=[(-15, -8), (30, 40)], look=(0.4, 1), mouth="frown", brows="worried")
    return [(p, 0.5 * W, PAPER_GY, 2.2)]


_ph = stand(0, arms=[(-15, -8), (36, 166)], prop="phone")
_phx, _phy = hand_pos(_ph, 0.5 * W, PAPER_GY, 2.2)
scene(name="useless", bg="paper", lines=["Your phone is useless."], pad=0.7, zoom=0.0,
      fx=[fx_ground(PAPER_GY)], post=[fx_falling_phone(lambda sc: 0.9, _phx, _phy - 8, PAPER_GY)],
      titles=[dict(at=0.9, text="USELESS", y=130, size=124)], sfx=[(0.9 + math.sqrt(2 * (PAPER_GY - 20 - _phy + 8) / 2600), "clunk")],
      fig=_useless)

scene(name="hospital", bg="hospital", lines=["Hospitals are empty."], pad=0.35, zoom=0.05,
      titles=[dict(at=0.5, text="EMPTY", y=120, size=124, style="box")],
      fig=lambda sc, t, tq: [(stand(0, brows="worried", mouth="line", look=(-1, 0) if (tq % 1.6) < 0.8 else (1, 0)),
                              0.5 * W, 0.975 * H, 1.6)])

scene(name="ems", bg="ambulance", lines=["Emergency services no longer exist."], pad=0.45, zoom=0.05,
      fx=[fx_stripe(0.40 * W, 0.826 * W, 0.586 * H, 0.601 * H), fx_red_cross(0.655 * W, 0.665 * H, 32)], titles=[dict(at=0.8, text="NO HELP", y=120, size=124)])


def _nobody(sc, t, tq):
    b = math.sin(2 * math.pi * tq / 3.0) * 1.5
    p = stand(1, sit=True, legs=[(88, 2), (92, -2)], arms=[(36 + b, 96), (42 + b, 102)], lean=12,
              look=(0.3, 1), mouth="frown", brows="worried")
    return [(p, 0.3 * W, 0.93 * H, 2.0)]


scene(name="nobody", bg="dusk", lines=["For the first time in human history,", "there is nobody coming to save you."],
      pad=2.6, zoom=0.07, focus=(0.33 * W, 0.78 * H), music="end",
      titles=[dict(at_line=1, at_off=0.8, text="NOBODY IS COMING.", y=120, size=118, style="box")], fig=_nobody)


# ----------------------------------------------------------------------------- timeline
LEAD, GAP, PAD = 0.15, 0.2, 0.25


def build_timeline():
    t = 0.0
    for sc in SCENES:
        sc["start"] = t
        if "silent" in sc:
            sc["P"], sc["E"], sc["audio"] = [], [], []
            sc["dur"] = sc["silent"]
        else:
            P, E, A = [], [], []
            tt = LEAD
            for line in sc["lines"]:
                a = tts(line)
                P.append(tt)
                E.append(tt + len(a) / SR)
                A.append(a)
                tt = E[-1] + GAP
            sc["P"], sc["E"], sc["audio"] = P, E, A
            sc["dur"] = E[-1] + sc.get("pad", PAD)
        for ti in sc["titles"]:
            if "at_line" in ti:
                ti["at"] = sc["P"][ti["at_line"]] + ti.get("at_off", 0.05)
            if "until_line" in ti:
                ti["until"] = sc["P"][ti["until_line"]] + 0.6
        t += sc["dur"]
    return t


def scene_at(t):
    for sc in SCENES:
        if t < sc["start"] + sc["dur"]:
            return sc
    return SCENES[-1]


# ----------------------------------------------------------------------------- frames
BGS = {}


def background(name):
    if name not in BGS:
        if name == "paper":
            rng = np.random.default_rng(11)
            low = Image.fromarray((rng.normal(0, 1, (30, 54)) * 6 + 128).clip(0, 255).astype(np.uint8), "L").resize((W, H), Image.BICUBIC)
            grain = (rng.normal(0, 1, (H, W)) * 5).astype(np.float32)
            base = np.array(PAPER, np.float32)[None, None, :] + (np.asarray(low, np.float32)[..., None] - 128) * 0.5 + grain[..., None]
            yy, xx = np.mgrid[0:H, 0:W]
            vig = 1 - 0.07 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
            BGS[name] = Image.fromarray(np.clip(base * vig[..., None], 0, 255).astype(np.uint8), "RGB").convert("RGBA")
        else:
            BGS[name] = Image.open(os.path.join(HERE, "backgrounds", name + ".jpg")).convert("RGB").resize((W, H), Image.LANCZOS).convert("RGBA")
    return BGS[name]


def render_frame(Tg, TOTAL):
    sc = scene_at(Tg)
    t = Tg - sc["start"]
    tq = math.floor(t * AFPS + 1e-6) / AFPS
    af = int(math.floor(Tg * AFPS + 1e-6))
    frame = background(sc["bg"]).copy()
    for fx in sc["fx"]:
        fx(frame, sc, t, tq, af)
    if "fig" in sc:
        for p, x, gy, s in sc["fig"](sc, t, tq):
            if p["eyes"] == "dot" and ((tq + 0.37 * len(sc["name"])) % 3.3) < 0.17:
                p = dict(p, eyes="closed")
            paste_figure(frame, p, x, gy, s, af * 31 + 7)
    for fx in sc["post"]:
        fx(frame, sc, t, tq, af)
    z = 1 + sc["zoom"] * ease(t / sc["dur"])
    dx = dy = 0.0
    if "shake" in sc and sc["shake"][0] <= t < sc["shake"][1]:
        amp = 16 * (1 - (t - sc["shake"][0]) / (sc["shake"][1] - sc["shake"][0]))
        rng = np.random.default_rng(af)
        dx, dy = rng.uniform(-amp, amp, 2)
    if z != 1 or dx or dy:
        fx_, fy_ = sc.get("focus", (W / 2, H / 2))
        cx = W / 2 + (fx_ - W / 2) * (1 - 1 / z) + dx
        cy = H / 2 + (fy_ - H / 2) * (1 - 1 / z) + dy
        bw, bh = W / z, H / z
        x0 = min(max(cx - bw / 2, 0), W - bw)
        y0 = min(max(cy - bh / 2, 0), H - bh)
        frame = frame.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + bw, y0 + bh))
    for ti in sc["titles"]:
        draw_title(frame, ti, t)
    rgb = frame.convert("RGB")
    fade = min(1.0, Tg / 0.6, (TOTAL - Tg) / 1.6)
    if fade < 1:
        rgb = Image.eval(rgb, lambda v, k=max(0.0, fade): int(v * k))
    return rgb


# ----------------------------------------------------------------------------- sound
def synth(name, rng):
    def tvec(d): return np.arange(int(d * SR)) / SR
    def lowpass(x, k): return np.convolve(x, np.ones(k) / k, "same")
    if name == "boom":
        x = tvec(3.5)
        ph = 2 * np.pi * np.cumsum(28 + 70 * np.exp(-x * 2.2)) / SR
        n = lowpass(rng.normal(0, 1, len(x)), 120) * 5
        return (np.sin(ph) * np.exp(-x * 1.1) + n * np.exp(-x * 1.6) * 0.6) * 0.9
    if name == "whoosh":
        x = tvec(0.9)
        env = np.sin(np.pi * np.clip(x / 0.9, 0, 1)) ** 2
        return lowpass(rng.normal(0, 1, len(x)), 18) * env * 0.5 + np.sin(2 * np.pi * 55 * x) * np.exp(-x * 5) * 0.35
    if name == "sting":
        x = tvec(1.6)
        return (np.sin(2 * np.pi * 220 * x) + np.sin(2 * np.pi * 233 * x) + 0.6 * np.sin(2 * np.pi * 110 * x)) * np.exp(-x * 2.2) * 0.12
    if name == "click":
        x = tvec(0.04)
        return (rng.normal(0, 1, len(x)) * np.exp(-x * 220) * 0.5 + np.sin(2 * np.pi * 2200 * x) * np.exp(-x * 160) * 0.3)
    if name == "step":
        x = tvec(0.09)
        return lowpass(rng.normal(0, 1, len(x)), 30) * np.exp(-x * 60) * 0.5 + np.sin(2 * np.pi * 95 * x) * np.exp(-x * 45) * 0.12
    if name == "clunk":
        x = tvec(0.25)
        return np.sin(2 * np.pi * 180 * x) * np.exp(-x * 30) * 0.4 + rng.normal(0, 1, len(x)) * np.exp(-x * 80) * 0.25
    raise ValueError(name)


def music_bed(n, mute_spans, end_span):
    t = np.arange(n) / SR
    chords = [[110.0, 130.81, 164.81], [87.31, 110.0, 130.81], [73.42, 110.0, 146.83], [82.41, 103.83, 123.47]]
    out = np.zeros(n)
    seg = 6.0
    for i in range(int(n / SR / seg) + 1):
        s, e = int(i * seg * SR), min(n, int(((i + 1) * seg + 2.5) * SR))
        if s >= n:
            break
        x = t[s:e] - i * seg
        env = np.clip(x / 2.0, 0, 1) * np.clip((seg + 2.5 - x) / 2.5, 0, 1)
        for fr in chords[i % 4]:
            for det in (-0.5, 0.5):
                out[s:e] += env * 0.028 * (np.sin(2 * np.pi * (fr + det) * x) + 0.22 * np.sin(2 * np.pi * 2 * (fr + det) * x + 1.0))
        out[s:e] += env * 0.045 * np.sin(2 * np.pi * chords[i % 4][0] / 2 * x)
    out *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * t)
    gain = np.ones(n)
    for a, b in mute_spans:
        ramp = np.clip(np.minimum((t - a) / 0.3, (b - t) / 0.6), 0, 1)
        gain = np.minimum(gain, 1 - 0.95 * ramp)
    gain *= np.clip(np.minimum(t / 1.5, (n / SR - t) / 2.5), 0, 1)
    return out * gain


def build_audio(TOTAL, steps):
    n = int((TOTAL + 0.5) * SR)
    voice, sfx = np.zeros(n, np.float32), np.zeros(n, np.float32)
    rng = np.random.default_rng(4)

    def add(buf, at, a, g=1.0):
        s = int(at * SR)
        if s >= n:
            return
        e = min(n, s + len(a))
        buf[s:e] += a[: e - s] * g

    mute = []
    subs = []
    for sc in SCENES:
        for p0, e0, a, txt in zip(sc["P"], sc["E"], sc["audio"], sc.get("lines", [])):
            add(voice, sc["start"] + p0, a)
            subs.append((sc["start"] + p0, sc["start"] + e0, txt))
        if sc.get("music") == "mute":
            mute.append((sc["start"], sc["start"] + sc["dur"]))
        for when, name in sc.get("sfx", []):
            if isinstance(when, str):
                li, off = when[4:].split("+")
                when = sc["P"][int(li)] + float(off)
            at = sc["start"] + when
            if name == "static":
                d = sc["dur"] - when
                x = np.arange(int(d * SR)) / SR
                add(sfx, at, rng.normal(0, 1, len(x)) * 0.05 * np.clip(np.minimum(x / 0.05, (d - x) / 0.2), 0, 1))
            elif name.startswith("wind"):
                d = sc["dur"]
                x = np.arange(int(d * SR)) / SR
                k = 60 if name == "wind_soft" else 25
                wn = np.convolve(rng.normal(0, 1, len(x)), np.ones(k) / k, "same") * (6 if name == "wind_soft" else 7)
                mod = 0.55 + 0.45 * np.sin(2 * np.pi * x / 2.3) * np.sin(2 * np.pi * x / 0.9 + 1)
                env = np.clip(np.minimum(x / 0.4, (d - x) / 0.4), 0, 1)
                add(sfx, at, wn * mod * env * (0.10 if name == "wind_soft" else 0.2))
            else:
                add(sfx, at, synth(name, rng), {"boom": 0.9, "whoosh": 0.6, "sting": 1.0, "click": 0.6, "clunk": 0.7}[name])
    for at in steps:
        add(sfx, at, synth("step", rng), 0.35)
    music = music_bed(n, mute, None)
    mix = voice * 1.0 + music * 0.8 + sfx
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    return mix.astype(np.float32), subs


def srt_time(x):
    h, x = divmod(x, 3600); m, x = divmod(x, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(x):02d},{int((x % 1) * 1000):03d}"


def main():
    TOTAL = build_timeline()
    print(f"length: {TOTAL:.1f}s, scenes: {len(SCENES)}", flush=True)
    # pre-pass: footstep times (one per landing drawing)
    steps, last = [], None
    for af in range(int(TOTAL * AFPS)):
        Tg = af / AFPS
        sc = scene_at(Tg)
        if "fig" not in sc:
            continue
        t = Tg - sc["start"]
        for p, *_ in sc["fig"](sc, t, math.floor(t * AFPS + 1e-6) / AFPS):
            if p.get("step") and last != af - 1:
                steps.append(Tg)
                last = af
    mix, subs = build_audio(TOTAL, steps)
    wav_path = os.path.join(BUILD, "mix.wav")
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((mix * 32767).astype(np.int16).tobytes())
    with open(os.path.join(BUILD, "last_human_sample.srt"), "w") as f:
        for i, (a, b, txt) in enumerate(subs, 1):
            f.write(f"{i}\n{srt_time(a)} --> {srt_time(b + 0.15)}\n{txt}\n\n")
    out = os.path.join(BUILD, "last_human_sample.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", wav_path, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", out], stdin=subprocess.PIPE)
    N = int(TOTAL * FPS)
    for i in range(N):
        ff.stdin.write(render_frame(i / FPS, TOTAL).tobytes())
        if i % 240 == 0:
            print(f"frame {i}/{N}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("done:", out, flush=True)


def walk_sheet():
    """The 10 drawings of one walk cycle, side by side."""
    s = 1.0
    cell_w, cell_h = 250, 400
    sheet = Image.new("RGBA", (cell_w * 10, cell_h), PAPER + (255,))
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(FONT_TITLE, 44)
    for k in range(10):
        p = walk(2 * math.pi * k / 10, 1)
        img = render_figure(p, s, 100 + k)
        gx, gy = k * cell_w + cell_w / 2, cell_h - 50
        sheet.alpha_composite(img, (int(gx + BOX[0] * s), int(gy + BOX[2] * s)))
        d.line([(k * cell_w + 20, gy + 2), ((k + 1) * cell_w - 20, gy + 2)], fill=(120, 112, 104), width=3)
        d.text((gx, 40), str(k + 1), font=font, fill=INK, anchor="mm")
        if k:
            d.line([(k * cell_w, 0), (k * cell_w, cell_h)], fill=(215, 205, 190), width=2)
    out = os.path.join(BUILD, "walk_cycle_10_drawings.png")
    sheet.convert("RGB").save(out)
    print(out)


if __name__ == "__main__":
    walk_sheet() if "--sheet" in sys.argv else main()
