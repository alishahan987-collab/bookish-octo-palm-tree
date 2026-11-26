"""
The channel's brand character: one original, tall, slim stickman.

Design rules (keep identical in every episode):
- black strokes, all the same thickness (LINE units); white circular head
- minimal face: two dot eyes + short brows; a mouth only when an emotion needs it
- signature details: an orange scarf whose tail flutters (secondary motion) and a single hair curl
- tall proportions: head is about 1/4.3 of total height
Side characters ("extras") use the same rig in soft grey, faceless, without scarf or curl.
"""
import math
import numpy as np
from PIL import Image, ImageDraw

INK = (22, 22, 26)
HEAD_FILL = (255, 255, 255)
SCARF = (244, 126, 36)
SCARF_SHADE = (214, 98, 24)
EXTRA_INK = (126, 130, 140)
EXTRA_FILL = (236, 238, 243)

HEAD_R, TORSO, UPPER, FORE, THIGH, SHIN = 30.0, 80.0, 44.0, 42.0, 56.0, 54.0
SHOULDER_DROP = 12.0
LINE = 5.0
HAND_R = 5.4
BOX = (-190, 190, -330, 24)          # drawing area around the ground point, in units


def vec(a, length):
    r = math.radians(a)
    return np.array([math.sin(r) * length, math.cos(r) * length])


# ----------------------------------------------------------------------------- poses
BASE = dict(x=540.0, y=1280.0, facing=0.0, lean=0.0, tilt=0.0, yoff=0.0,
            arms=((-22.0, -12.0), (22.0, 12.0)), legs=((-9.0, -5.0), (9.0, 5.0)),
            eyes=1.0, look=(0.0, 0.0), brow_raise=0.0, brow_angle=0.0, brow_tilt=0.0,
            mouth=None, mouth_k=0.0, eye_size=1.0, happy_eyes=0.0, scale=2.0,
            prop=None, prop_hand=1, headphones=0.0, alpha=1.0, chatter=0.0)


def ik(target, side):
    """Two-bone IK. target = hand position relative to the shoulder (units, y down).
    side=+1 puts the elbow to the right, -1 to the left. Returns (upper, fore) angles."""
    tx, ty = target
    d = math.hypot(tx, ty)
    d = max(abs(UPPER - FORE) + 1e-3, min(UPPER + FORE - 1e-3, d))
    theta = math.degrees(math.atan2(tx, ty))
    alpha = math.degrees(math.acos((UPPER ** 2 + d ** 2 - FORE ** 2) / (2 * UPPER * d)))
    best = None
    for a in (theta + alpha, theta - alpha):
        e = vec(a, UPPER)
        f = math.degrees(math.atan2(tx - e[0], ty - e[1]))
        score = e[0] * side
        if best is None or score > best[0]:
            best = (score, (a, f))
    return best[1]


# hand targets relative to the shoulder (front view, no lean): head centre is (0,-44)
HEAD_C = (0.0, -(SHOULDER_DROP + 2 + HEAD_R) - 0.0)


def P(**kw):
    p = dict(BASE)
    p.update(kw)
    return p


def stand(**kw):
    return P(**kw)


def think(**kw):
    return P(**{**dict(arms=(ik((22, 34), -1), ik((5, -12), 1)), look=(-0.6, -0.8), brow_raise=0.25, tilt=-4), **kw})


def confused(**kw):
    return P(**{**dict(arms=((-48, -104), (48, 104)), tilt=14, brow_tilt=1.0, mouth="flat", mouth_k=0.6, look=(0.3, 0)), **kw})


def shocked(**kw):
    return P(**{**dict(arms=((-150, -172), (150, 172)), eyes=1.0, eye_size=1.35, brow_raise=1.0, mouth="O", mouth_k=1.0, yoff=0), **kw})


def excited(**kw):
    return P(**{**dict(arms=((-138, -160), (138, 160)), happy_eyes=1.0, mouth="smile", mouth_k=1.0, brow_raise=0.4), **kw})


def point_right(**kw):
    return P(**{**dict(arms=((-22, -12), (96, 90)), look=(1, -0.1), brow_raise=0.3), **kw})


def point_left(**kw):
    return P(**{**dict(arms=((-96, -90), (22, 12)), look=(-1, -0.1), brow_raise=0.3), **kw})


def point_self(**kw):
    return P(**{**dict(arms=((-22, -12), ik((-3, 16), 1)), brow_raise=0.6, look=(0, -0.2)), **kw})


def present(**kw):
    return P(**{**dict(arms=((-58, -96), (58, 96)), brow_raise=0.3, mouth="smile", mouth_k=0.5), **kw})


def sad(**kw):
    return P(**{**dict(arms=((-14, -8), (14, 8)), lean=0, look=(0, 1), brow_angle=-1, mouth="frown", mouth_k=0.6, tilt=-6), **kw})


def confident(**kw):
    return P(**{**dict(arms=(ik((-14, 64), -1), ik((14, 64), 1)), look=(0, -0.3), mouth="smile", mouth_k=0.7, brow_angle=0.35), **kw})


def phone_record(**kw):
    return P(**{**dict(arms=((-22, -12), ik((16, -26), 1)), prop="phone", look=(0.6, 0.2)), **kw})


def phone_ear(**kw):
    return P(**{**dict(arms=((-22, -12), ik((31, -40), 1)), prop="phone", look=(0.2, 0)), **kw})


def fingers_in_ears(**kw):
    return P(**{**dict(arms=(ik((-31, -44), -1), ik((31, -44), 1)), eyes=0.0, mouth="open", mouth_k=0.8), **kw})


def cringe(**kw):
    return P(**{**dict(arms=(ik((-12, 20), -1), ik((12, 20), 1)), eyes=0.0, mouth="grimace", mouth_k=1.0, brow_angle=-1, yoff=-6), **kw})


def hands_on_head(**kw):
    return P(**{**dict(arms=(ik((-24, -66), -1), ik((24, -66), 1)), eye_size=1.25, mouth="O", mouth_k=0.8, brow_raise=1.0), **kw})


def wave(k=0.0, **kw):
    return P(**{**dict(arms=((-22, -12), (128 + 10 * k, 166 + 22 * k)), mouth="smile", mouth_k=0.8, brow_raise=0.4), **kw})


def cross_arms(**kw):
    return P(**{**dict(arms=(ik((22, 22), -1), ik((-22, 26), 1)), brow_angle=0.6, mouth="flat", mouth_k=0.6), **kw})


def headphones_listen(**kw):
    return P(**{**dict(arms=(ik((-30, -40), -1), ik((30, -40), 1)), headphones=1.0, eyes=0.0, mouth=None), **kw})


def talk_mic(**kw):
    return P(**{**dict(arms=((-12, -6), ik((20, -18), 1)), headphones=1.0, mouth="smile", mouth_k=0.8), **kw})


A_LEG = 24.0


def walk_cycle(phase, f):
    legs, arms = [], []
    for i in range(2):
        ph = phase + i * math.pi
        th = A_LEG * math.sin(ph)
        knee = 6 + 40 * max(0.0, math.cos(ph)) ** 1.3
        legs.append((f * th, f * (th - knee)))
        au = -0.9 * A_LEG * math.sin(ph)
        arms.append((f * au, f * (au + 18)))
    return tuple(legs), tuple(arms)


STRIDE = 2 * abs(vec(A_LEG, THIGH)[0] + vec(A_LEG - 6, SHIN)[0]) * 1.02    # units per half cycle * 2


# ----------------------------------------------------------------------------- interpolation
def _lerp(a, b, u):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a + (b - a) * u
    if isinstance(a, tuple) and isinstance(b, tuple) and len(a) == len(b):
        return tuple(_lerp(x, y, u) for x, y in zip(a, b))
    return b if u >= 0.5 else a


def blend(p0, p1, u):
    out = {}
    for k in p1:
        if k in ("mouth", "prop", "prop_hand"):
            continue
        out[k] = _lerp(p0.get(k, p1[k]), p1[k], u)
    m0, m1 = p0.get("mouth"), p1.get("mouth")
    if m0 == m1:
        out["mouth"], out["mouth_k"] = m1, _lerp(p0.get("mouth_k", 0), p1.get("mouth_k", 0), u)
    elif u < 0.5:
        out["mouth"], out["mouth_k"] = m0, p0.get("mouth_k", 0) * (1 - 2 * u)
    else:
        out["mouth"], out["mouth_k"] = m1, p1.get("mouth_k", 0) * (2 * u - 1)
    out["prop"] = p1["prop"] if u >= 0.35 else p0.get("prop")
    out["prop_hand"] = p1.get("prop_hand", 1)
    return out


def ease(u, kind="io"):
    u = max(0.0, min(1.0, u))
    if kind == "io":
        return u * u * (3 - 2 * u)
    if kind == "out":
        return 1 - (1 - u) ** 3
    if kind == "in":
        return u ** 3
    if kind == "back":                         # overshoot then settle
        s = 1.7
        u -= 1
        return u * u * ((s + 1) * u + s) + 1
    return u


class Track:
    """Keyframed performance for one character: keys = [(t, pose, ease)], walks = [(t0, t1, x0, x1)]."""

    def __init__(self, keys, walks=(), seed=0, extra=False):
        self.keys = sorted(keys, key=lambda k: k[0])
        self.walks = list(walks)
        self.seed = seed
        self.extra = extra

    def raw(self, t):
        ks = self.keys
        if t <= ks[0][0]:
            p = dict(ks[0][1])
        elif t >= ks[-1][0]:
            p = dict(ks[-1][1])
        else:
            for (t0, p0, _), (t1, p1, e1) in zip(ks[:-1], ks[1:]):
                if t0 <= t <= t1:
                    p = blend(p0, p1, ease((t - t0) / max(1e-6, t1 - t0), e1))
                    break
        for (w0, w1, x0, x1) in self.walks:
            if w0 <= t <= w1:
                u = (t - w0) / max(1e-6, w1 - w0)
                p["x"] = x0 + (x1 - x0) * u
                f = 1 if x1 > x0 else -1
                dist = abs(p["x"] - x0) / p["scale"]
                legs, arms = walk_cycle(2 * math.pi * dist / STRIDE, f)
                p["legs"], p["arms"] = legs, arms
                p["facing"] = 0.75 * f
                p["lean"] = 3 * f
                p["walking"] = True
            elif t > w1 and abs(t - w1) < 1e-9:
                p["x"] = x1
        return p

    def pose(self, t):
        p = self.raw(t)
        # secondary motion: breathing, head drift, blinks, scarf follow-through
        br = math.sin(2 * math.pi * (t + self.seed * 0.37) / 3.6)
        if not p.get("walking"):
            a0, a1 = p["arms"]
            p["arms"] = ((a0[0] - 1.6 * br, a0[1] - 1.2 * br), (a1[0] + 1.6 * br, a1[1] + 1.2 * br))
            p["yoff"] = p["yoff"] + 0.7 * br
        p["tilt"] = p["tilt"] + 1.3 * math.sin(2 * math.pi * (t + self.seed) / 5.3)
        rng = np.random.default_rng(self.seed + 11)
        times = np.cumsum(rng.uniform(2.4, 4.6, 200))
        k = np.searchsorted(times, t)
        for tb in times[max(0, k - 1): k + 1]:
            dt = t - tb
            if 0 <= dt < 0.14:
                p["eyes"] = min(p["eyes"], abs(dt - 0.07) / 0.07)
        x_prev = self.raw(t - 0.22)["x"]
        vel = (p["x"] - x_prev) / 0.22 / p["scale"]
        p["scarf"] = -0.9 * vel + 8 * math.sin(2 * math.pi * t * 0.9 + self.seed) + (14 * math.sin(t * 9) if p.get("walking") else 0)
        return p


# ----------------------------------------------------------------------------- geometry + drawing
def joints(p):
    hip = np.zeros(2)
    f = p["facing"]
    legs = []
    for (ta, sa) in p["legs"]:
        knee = hip + vec(ta, THIGH)
        legs.append([hip.copy(), knee, knee + vec(sa, SHIN)])
    low = max(l[2][1] for l in legs)
    shift = np.array([0.0, -low - 3.0 - p["yoff"]])
    hip = hip + shift
    legs = [[q + shift for q in l] for l in legs]
    lean = math.radians(p["lean"])
    up = np.array([math.sin(lean), -math.cos(lean)])
    neck = hip + up * TORSO
    shoulder = hip + up * (TORSO - SHOULDER_DROP)
    tl = math.radians(p["lean"] + p["tilt"])
    hup = np.array([math.sin(tl), -math.cos(tl)])
    head = neck + hup * (HEAD_R + 2)
    arms = []
    for (ua, fa) in p["arms"]:
        e = shoulder + vec(ua + p["lean"], UPPER)
        arms.append([shoulder, e, e + vec(fa + p["lean"], FORE)])
    return dict(hip=hip, legs=legs, neck=neck, shoulder=shoulder, head=head, hup=hup, up=up, arms=arms)


def render(p, scale, extra=False):
    """Draw one frame of the character. Returns (RGBA image, anchor offset in px from ground point)."""
    ss = scale * 2.0
    x0, x1, y0, y1 = BOX
    cw, ch = int((x1 - x0) * ss), int((y1 - y0) * ss)
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = EXTRA_INK if extra else INK
    fill = EXTRA_FILL if extra else HEAD_FILL
    lw = LINE * ss

    def Pt(q):
        return ((q[0] - x0) * ss, (q[1] - y0) * ss)

    def dot(q, r, col):
        X, Y = Pt(q)
        d.ellipse([X - r, Y - r, X + r, Y + r], fill=col)

    def stroke(pts, col=ink, w=lw):
        xy = [Pt(q) for q in pts]
        d.line(xy, fill=col, width=int(w), joint="curve")
        for q in pts:
            dot(q, w / 2, col)

    j = joints(p)
    f = max(-1.0, min(1.0, p["facing"]))
    hc, hup = j["head"], j["hup"]
    hr = np.array([-hup[1], hup[0]])                  # head "right" axis (rotates with tilt)

    def H(u, v):                                      # point in head space (u right, v down) in units of R
        return hc + hr * (u * HEAD_R) - hup * (v * HEAD_R)

    # ground shadow
    sw = 34 * (1 - min(0.5, max(0.0, p["yoff"]) / 140))
    X0, Y0 = Pt((j["hip"][0] - sw, -4))
    X1, Y1 = Pt((j["hip"][0] + sw, 4))
    d.ellipse([X0, Y0, X1, Y1], fill=(0, 0, 0, 34))

    far = 0 if f > 0.2 else (1 if f < -0.2 else None)
    order = ([far] if far is not None else []) + [i for i in (0, 1) if i != far]

    def arm(i):
        s_, e_, h_ = j["arms"][i]
        stroke([s_, e_, h_])
        dot(h_, HAND_R * ss, ink)

    def scarf_tail():
        if extra:
            return
        side = -1 if f >= 0 else 1
        knot = j["neck"] + np.array([side * 7.0, 4.0])
        ang = side * 30 + p.get("scarf", 0)
        a1 = knot + vec(ang - 8, 22)
        a2 = knot + vec(ang + 6, 34)
        pts = [knot + np.array([-3.5, 0]), a1 + np.array([-4, 0]), a2, a1 + np.array([4, 2]), knot + np.array([3.5, 1])]
        d.polygon([Pt(q) for q in pts], fill=SCARF_SHADE, outline=ink, width=int(lw * 0.45))

    if far is not None:
        arm(far)
    for leg in j["legs"]:
        stroke(leg)
        ft = leg[2]
        dirx = (1 if f >= 0 else -1) if abs(f) > 0.2 else (1 if leg[2][0] >= j["hip"][0] else -1)
        stroke([ft, ft + np.array([dirx * 11.0, 0.5])], w=lw * 1.15)
    stroke([j["hip"], j["neck"]])
    scarf_tail()
    for i in order:
        if i != far:
            arm(i)

    # head
    X, Y = Pt(hc)
    r = HEAD_R * ss
    d.ellipse([X - r - lw / 2, Y - r - lw / 2, X + r + lw / 2, Y + r + lw / 2], fill=ink)
    d.ellipse([X - r + lw / 2, Y - r + lw / 2, X + r - lw / 2, Y + r - lw / 2], fill=fill)

    if not extra:
        # signature hair curl
        base = H(0.12 * f, -1.0)
        c1 = H(0.12 * f + 0.05, -1.32)
        c2 = H(0.12 * f + 0.32, -1.42)
        c3 = H(0.12 * f + 0.38, -1.22)
        c4 = H(0.12 * f + 0.22, -1.16)
        stroke([base, c1, c2, c3, c4], w=lw * 0.8)
        # scarf band
        n = j["neck"]
        band = [n + np.array([-11, -3]), n + np.array([11, -3]), n + np.array([12, 6]), n + np.array([-12, 6])]
        d.polygon([Pt(q) for q in band], fill=SCARF, outline=ink, width=int(lw * 0.45))
        # face
        fx = 0.34 * f
        sep = 0.33 * (1 - 0.35 * abs(f))
        lx, ly = p["look"]
        es = p["eye_size"]
        for s_ in (-1, 1):
            ex, ey = fx + s_ * sep, 0.02
            c = H(ex + lx * 0.07, ey + ly * 0.06)
            X, Y = Pt(c)
            if p["happy_eyes"] > 0.5:
                rr = 0.13 * HEAD_R * ss
                d.arc([X - rr, Y - rr * 0.6, X + rr, Y + rr * 1.2], 200, 340, fill=ink, width=int(lw * 0.7))
            elif p["eyes"] < 0.18:
                if p.get("mouth") == "grimace":
                    q1, q2, q3 = H(ex - 0.12 * s_, ey - 0.08), H(ex + 0.1 * s_, ey), H(ex - 0.12 * s_, ey + 0.08)
                    stroke([q1, q2, q3], w=lw * 0.6)
                else:
                    stroke([H(ex - 0.11, ey + 0.02), H(ex + 0.11, ey + 0.02)], w=lw * 0.6)
            else:
                rx = 0.105 * HEAD_R * ss * es
                ry = 0.15 * HEAD_R * ss * es * max(0.15, p["eyes"])
                d.ellipse([X - rx, Y - ry, X + rx, Y + ry], fill=ink)
            # brows
            bt = p["brow_tilt"] * (0.12 if s_ < 0 else -0.04)
            by = ey - 0.33 - 0.1 * p["brow_raise"] - bt
            inner = ex - s_ * 0.13
            outer = ex + s_ * 0.13
            ang = p["brow_angle"] * 0.08
            stroke([H(inner, by + ang), H(outer, by - ang)], w=lw * 0.62)
        m, k = p.get("mouth"), p.get("mouth_k", 0.0)
        if m and k > 0.05:
            mc = H(fx * 0.9, 0.46)
            X, Y = Pt(mc)
            u = HEAD_R * ss
            if m == "smile":
                d.arc([X - 0.2 * u, Y - 0.16 * u * k, X + 0.2 * u, Y + 0.1 * u * k + 1], 15, 165, fill=ink, width=int(lw * 0.62))
            elif m == "frown":
                d.arc([X - 0.17 * u, Y, X + 0.17 * u, Y + 0.2 * u * k + 1], 200, 340, fill=ink, width=int(lw * 0.62))
            elif m == "flat":
                stroke([H(fx * 0.9 - 0.11, 0.46), H(fx * 0.9 + 0.11, 0.47)], w=lw * 0.6)
            elif m in ("O", "open", "talk"):
                rx = 0.085 * u * (1.0 if m != "talk" else 1.2)
                ry = (0.03 + 0.11 * k) * u
                d.ellipse([X - rx, Y - ry, X + rx, Y + ry], fill=(36, 18, 20))
            elif m == "grimace":
                d.rounded_rectangle([X - 0.2 * u, Y - 0.07 * u, X + 0.2 * u, Y + 0.08 * u], radius=0.04 * u, fill=(255, 255, 255), outline=ink, width=int(lw * 0.5))
                for q in (-0.07, 0.0, 0.07):
                    d.line([(X + q * u, Y - 0.07 * u), (X + q * u, Y + 0.08 * u)], fill=ink, width=int(lw * 0.35))
        if p["headphones"] > 0.05:
            band = [H(-1.02, -0.1), H(-0.9, -0.9), H(0.0, -1.28), H(0.9, -0.9), H(1.02, -0.1)]
            stroke(band, col=(60, 64, 74), w=lw * 1.1)
            for s_ in (-1, 1):
                c = H(s_ * 1.02, 0.02)
                X, Y = Pt(c)
                rr = 0.26 * HEAD_R * ss
                d.rounded_rectangle([X - rr * 0.75, Y - rr, X + rr * 0.75, Y + rr], radius=rr * 0.5, fill=(244, 126, 36), outline=ink, width=int(lw * 0.5))

    # held prop
    if p.get("prop") == "phone":
        h_ = j["arms"][p.get("prop_hand", 1)][2]
        c = h_ + np.array([0, -7])
        X, Y = Pt(c)
        w_, h2 = 9 * ss, 16 * ss
        d.rounded_rectangle([X - w_, Y - h2, X + w_, Y + h2], radius=3 * ss, fill=(40, 44, 52), outline=ink, width=int(lw * 0.45))
        d.rounded_rectangle([X - w_ + 2.5 * ss, Y - h2 + 4 * ss, X + w_ - 2.5 * ss, Y + h2 - 4 * ss], radius=2 * ss, fill=(120, 196, 255))
        dot(h_, HAND_R * ss, ink)
    out = img.resize((cw // 2, ch // 2), Image.LANCZOS)
    if p.get("alpha", 1.0) < 0.999:
        a = out.getchannel("A").point(lambda v, k=p["alpha"]: int(v * k))
        out.putalpha(a)
    return out, (x0 * scale, y0 * scale)
