"""Stickman characters (big round white heads, stick limbs), drawn in code so they stay sharp in 4K."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = (30, 30, 34)
HEAD_FILL = (254, 253, 249)
HEAD_R, TORSO, UPPER, FORE, THIGH, SHIN = 33.0, 54.0, 31.0, 29.0, 42.0, 40.0
LIMB_W, LINE_W = 3.6, 2.6
BOX = (-185, 185, -335, 26)            # drawing area around the ground point, in figure units

PEOPLE = {
    "jensen":     dict(hair="side", hair_col=(30, 30, 36), glasses=True, shirt=(112, 162, 216), jacket=False, tie=None, beard=None, mustache=False),
    "jensen_now": dict(hair="side", hair_col=(42, 42, 48), glasses=False, shirt=(38, 38, 42), jacket=True, tie=None, beard=None, mustache=False),
    "chris":      dict(hair="messy", hair_col=(124, 82, 46), glasses=False, shirt=(118, 176, 126), jacket=False, tie=None, beard=(124, 82, 46), mustache=False),
    "curtis":     dict(hair="swoop", hair_col=(218, 172, 98), glasses=False, shirt=(226, 124, 112), jacket=False, tie=None, beard=None, mustache=True),
    "boss":       dict(hair="short", hair_col=(168, 168, 172), glasses=False, shirt=(72, 92, 142), jacket=True, tie=(204, 52, 46), beard=None, mustache=False),
    "worker":     dict(hair="spiky", hair_col=(112, 74, 44), glasses=False, shirt=(242, 162, 82), jacket=False, tie=None, beard=None, mustache=False),
}


def vec(a, length):
    """Angle in degrees from straight down; positive = toward screen right."""
    r = math.radians(a)
    return np.array([math.sin(r) * length, math.cos(r) * length])


def shade(c, k):
    return tuple(int(max(0, min(255, v * k))) for v in c)


def pose(**kw):
    p = dict(facing=0, lean=0.0, legs=[(-7, -4), (7, 4)], arms=[(-16, -8), (16, 8)], yoff=0.0,
             mouth="smile", amp=0.0, brows="neutral", eyes="open", look=(0, 0), marks=(), prop=None, step=False)
    p.update(kw)
    return p


def stand(f=0, **kw):
    if f == 0:
        p = pose()
    else:
        p = pose(facing=f, legs=[(-f * 4, -f * 4), (f * 6, f * 6)], arms=[(-f * 6, -f * 2), (f * 10, f * 22)])
    p.update(kw)
    return p


A_LEG = 25


def walk(phi, f, **kw):
    legs, arms = [], []
    for i in range(2):
        ph = phi + i * math.pi
        th = A_LEG * math.sin(ph)
        knee = 6 + 42 * max(0.0, math.cos(ph)) ** 1.3
        legs.append((f * th, f * (th - knee)))
        au = -0.9 * A_LEG * math.sin(ph)
        arms.append((f * au, f * (au + 24)))
    p = pose(legs=legs, arms=arms, facing=f, lean=f * 3)
    p.update(kw)
    return p


def _foot_x(legs):
    return [vec(t, THIGH)[0] + vec(s, SHIN)[0] for t, s in legs]


STEP_U = abs(np.subtract(*_foot_x(walk(math.pi / 2, 1)["legs"])))


def joints(p):
    hip = np.zeros(2)
    f = p["facing"]
    lat = 5 if f == 0 else 2
    legs = []
    for i, (ta, sa) in enumerate(p["legs"]):
        top = hip + np.array([-lat if i == 0 else lat, 0.0])
        knee = top + vec(ta, THIGH)
        legs.append([top, knee, knee + vec(sa, SHIN)])
    low = max(l[2][1] for l in legs)
    shift = np.array([0.0, -low - 5.0 - p["yoff"]])
    hip = hip + shift
    legs = [[q + shift for q in l] for l in legs]
    lean = math.radians(p["lean"])
    up = np.array([math.sin(lean), -math.cos(lean)])
    nrm = np.array([-up[1], up[0]])
    neck = hip + up * TORSO
    head = neck + up * (HEAD_R * 0.92)
    sw = 11 if f == 0 else 4
    shoulders = [neck - up * 7 - nrm * sw, neck - up * 7 + nrm * sw]
    arms = []
    for i, (ua, fa) in enumerate(p["arms"]):
        e = shoulders[i] + vec(ua, UPPER)
        arms.append([shoulders[i], e, e + vec(fa, FORE)])
    return dict(hip=hip, legs=legs, up=up, nrm=nrm, neck=neck, head=head, arms=arms)


def head_point(p, x, gy, s, dy=-1.0):
    h = joints(p)["head"]
    return x + h[0] * s, gy + (h[1] + dy * HEAD_R) * s


_fonts = {}


def _font(path, size):
    k = (path, int(size))
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(path, int(size))
    return _fonts[k]


def render(who, p, scale, mark_font=None):
    """scale = output pixels per figure unit. Drawn 2x supersampled for clean edges."""
    c = PEOPLE[who]
    ss = scale * 2.0
    x0, x1, y0, y1 = BOX
    cw, ch = int((x1 - x0) * ss), int((y1 - y0) * ss)
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    lw = LINE_W * ss

    def P(q):
        return ((q[0] - x0) * ss, (q[1] - y0) * ss)

    def dot(q, r, fill):
        X, Y = P(q)
        d.ellipse([X - r, Y - r, X + r, Y + r], fill=fill)

    def stick(pts, width=LIMB_W):
        xy = [P(q) for q in pts]
        d.line(xy, fill=OUT, width=int(width * ss), joint="curve")
        for q in pts:
            dot(q, width * ss / 2, OUT)

    def ell(cx, cy, rx, ry, fill, outline=True, w=None):
        X, Y = P((cx, cy))
        w = lw if w is None else w * ss
        if outline:
            d.ellipse([X - rx * ss - w, Y - ry * ss - w, X + rx * ss + w, Y + ry * ss + w], fill=OUT)
        d.ellipse([X - rx * ss, Y - ry * ss, X + rx * ss, Y + ry * ss], fill=fill)

    def poly(pts, fill, outline=True, w=None):
        w = lw if w is None else w * ss
        d.polygon([P(q) for q in pts], fill=fill, outline=OUT if outline else None, width=int(w) if outline else 0)

    j = joints(p)
    f = p["facing"]
    hip, up, nrm = j["hip"], j["up"], j["nrm"]
    far_arm = 0 if f == 1 else (1 if f == -1 else None)
    near_arms = [i for i in (0, 1) if i != far_arm]

    sw = 30 * (1 - min(0.5, p["yoff"] / 120))
    X0, Y0 = P((hip[0] - sw, -4))
    X1, Y1 = P((hip[0] + sw, 4))
    d.ellipse([X0, Y0, X1, Y1], fill=(40, 34, 30, 40))

    def arm(i):
        s_, e_, h_ = j["arms"][i]
        stick([s_, e_, h_])
        ell(h_[0], h_[1], 4.4, 4.4, HEAD_FILL, w=2.0)

    if far_arm is not None:
        arm(far_arm)
    for li in ([0, 1] if f >= 0 else [1, 0]):
        top, knee, ankle = j["legs"][li]
        stick([top, knee, ankle])
        dirx = f if f != 0 else (-1 if li == 0 else 1)
        ell(ankle[0] + dirx * 5, ankle[1] + 1.5, 8.5, 4.6, HEAD_FILL, w=2.0)

    def tp(dd, hw):
        return hip + up * dd + nrm * hw

    # stick torso (neck to hip), then the shirt over it
    stick([hip + up * 2, j["neck"]])
    sh = 13 if f == 0 else 10
    shirt = [tp(TORSO - 4, -sh + 4), tp(TORSO - 10, -sh), tp(2, -sh + 1), tp(-5, -sh + 2),
             tp(-5, sh - 2), tp(2, sh - 1), tp(TORSO - 10, sh), tp(TORSO - 4, sh - 4)]
    poly(shirt, c["shirt"])
    co = f * 2.5
    if c["jacket"]:
        if c["tie"]:
            poly([tp(TORSO - 4, co - 6), tp(TORSO - 4, co + 6), tp(TORSO - 26, co)], (250, 250, 246), w=1.8)
            poly([tp(TORSO - 6, co - 2.4), tp(TORSO - 6, co + 2.4), tp(TORSO - 22, co + 3), tp(TORSO - 27, co), tp(TORSO - 22, co - 3)], c["tie"], w=1.6)
        else:
            d.line([P(tp(TORSO - 5, co)), P(tp(-3, co))], fill=(90, 90, 96), width=int(1.6 * ss))
        for s in (-1, 1):
            d.line([P(tp(TORSO - 4, co + s * 7)), P(tp(TORSO - 26, co + s * 1))], fill=shade(c["shirt"], 1.6) if c["shirt"][0] < 80 else OUT, width=int(1.6 * ss))
    for i in near_arms:
        arm(i)

    if p["prop"] == "box":
        h0, h1 = j["arms"][0][2], j["arms"][1][2]
        bc = (h0 + h1) / 2 + up * 8
        poly([bc + (-26, -20), bc + (26, -20), bc + (26, 16), bc + (-26, 16)], (214, 172, 120))
        poly([bc + (-26, -20), bc + (26, -20), bc + (20, -28), bc + (-20, -28)], (228, 190, 140))
        ell(bc[0] - 9, bc[1] - 33, 5.5, 9, (110, 178, 96))
        ell(bc[0] - 1, bc[1] - 37, 5.5, 10, (110, 178, 96))
        poly([bc + (8, -40), bc + (19, -40), bc + (18, -26), bc + (9, -26)], (240, 240, 236))
        for h_ in (h0, h1):
            ell(h_[0], h_[1], 4.4, 4.4, HEAD_FILL, w=2.0)

    # head
    hc = j["head"]
    R = HEAD_R
    fxo = f * 0.2 * R
    for s in ([-1, 1] if f == 0 else [-f]):
        ell(hc[0] + s * 0.97 * R, hc[1] + 0.1 * R, 0.16 * R, 0.21 * R, HEAD_FILL)
    ell(hc[0], hc[1], R, R, HEAD_FILL)

    def arc_pts(r, a0, a1, n=30):
        return [(hc[0] + math.cos(math.radians(a)) * r, hc[1] + math.sin(math.radians(a)) * r) for a in np.linspace(a0, a1, n)]

    hcol = c["hair_col"]
    fs = f * 0.12 * R
    if c["hair"] in ("side", "swoop"):
        cap = arc_pts(1.06 * R, 188, 352)
        fringe = [(hc[0] + 0.88 * R, hc[1] - 0.44 * R), (hc[0] + 0.5 * R + fs, hc[1] - 0.62 * R),
                  (hc[0] + 0.22 * R + fs, hc[1] - 0.76 * R), (hc[0] - 0.05 * R + fs, hc[1] - 0.6 * R),
                  (hc[0] - 0.5 * R + fs, hc[1] - 0.58 * R), (hc[0] - 0.9 * R, hc[1] - 0.38 * R)]
        poly(cap + fringe, hcol)
        if c["hair"] == "swoop":
            ell(hc[0] + 0.25 * R + fs, hc[1] - 0.92 * R, 0.6 * R, 0.28 * R, hcol)
            poly(arc_pts(1.03 * R, 200, 340), hcol, outline=False)
    elif c["hair"] == "messy":
        curls = [(hc[0] + math.cos(math.radians(a)) * 0.98 * R, hc[1] + math.sin(math.radians(a)) * 0.98 * R) for a in range(192, 352, 18)]
        for q in curls:
            ell(q[0], q[1], 0.26 * R, 0.26 * R, hcol)
        for q in curls:
            ell(q[0], q[1], 0.26 * R - LINE_W, 0.26 * R - LINE_W, hcol, outline=False)
        fringe = [(hc[0] + 0.85 * R, hc[1] - 0.38 * R), (hc[0] + 0.4 * R + fs, hc[1] - 0.62 * R), (hc[0] + fs, hc[1] - 0.52 * R),
                  (hc[0] - 0.4 * R + fs, hc[1] - 0.62 * R), (hc[0] - 0.85 * R, hc[1] - 0.38 * R)]
        poly(arc_pts(1.0 * R, 188, 352) + fringe, hcol, outline=False)
        d.line([P(q) for q in fringe], fill=OUT, width=int(lw), joint="curve")
    elif c["hair"] == "spiky":
        pts = arc_pts(1.04 * R, 192, 348, 9)
        spikes = []
        for i, q in enumerate(pts):
            spikes.append(q)
            if i < len(pts) - 1:
                a = math.radians(192 + (i + 0.5) * (156 / 8))
                spikes.append((hc[0] + math.cos(a) * 1.42 * R, hc[1] + math.sin(a) * 1.42 * R))
        fringe = [(hc[0] + 0.86 * R, hc[1] - 0.36 * R), (hc[0] + 0.35 * R + fs, hc[1] - 0.5 * R), (hc[0] + 0.05 * R + fs, hc[1] - 0.66 * R),
                  (hc[0] - 0.3 * R + fs, hc[1] - 0.48 * R), (hc[0] - 0.86 * R, hc[1] - 0.36 * R)]
        poly(spikes + fringe, hcol)
    elif c["hair"] == "short":
        cap = arc_pts(1.05 * R, 190, 350)
        fringe = [(hc[0] + 0.88 * R, hc[1] - 0.5 * R), (hc[0] + 0.4 * R + fs, hc[1] - 0.76 * R), (hc[0] + fs, hc[1] - 0.82 * R),
                  (hc[0] - 0.4 * R + fs, hc[1] - 0.76 * R), (hc[0] - 0.88 * R, hc[1] - 0.5 * R)]
        poly(cap + fringe, hcol)

    # face
    ey = hc[1] + 0.02 * R
    sep = 0.3 * R * (1 - 0.2 * abs(f))
    eyes_x = [hc[0] + fxo - sep, hc[0] + fxo + sep]
    lx, ly = p["look"]
    for ex in eyes_x:
        if p["eyes"] == "closed":
            X, Y = P((ex, ey))
            r = 0.12 * R * ss
            d.arc([X - r, Y - r, X + r, Y + r], 200, 340, fill=OUT, width=int(lw * 0.9))
        elif p["eyes"] == "wide":
            ell(ex, ey, 0.16 * R, 0.19 * R, (255, 255, 255), w=1.6)
            ell(ex + lx * 0.05 * R, ey + ly * 0.05 * R, 0.07 * R, 0.09 * R, OUT, outline=False)
        else:
            ell(ex + lx * 0.05 * R, ey + ly * 0.05 * R, 0.08 * R, 0.12 * R, OUT, outline=False)
            ell(ex + lx * 0.05 * R + 0.025 * R, ey + ly * 0.05 * R - 0.04 * R, 0.025 * R, 0.03 * R, (255, 255, 255), outline=False)
    if c["glasses"]:
        for ex in eyes_x:
            X0, Y0 = P((ex - 0.24 * R, ey - 0.18 * R))
            X1, Y1 = P((ex + 0.24 * R, ey + 0.18 * R))
            d.rounded_rectangle([X0, Y0, X1, Y1], radius=0.08 * R * ss, outline=OUT, width=int(lw * 0.75))
        d.line([P((eyes_x[0] + 0.24 * R, ey - 0.05 * R)), P((eyes_x[1] - 0.24 * R, ey - 0.05 * R))], fill=OUT, width=int(lw * 0.75))
    by = ey - (0.33 if c["glasses"] else 0.3) * R
    bcol = OUT if sum(hcol) < 450 else (120, 120, 126)
    din, dout = {"neutral": (0, 0), "worried": (-0.12, 0.04), "angry": (0.08, -0.08),
                 "raised": (-0.12, -0.12), "sad": (-0.08, 0.06)}[p["brows"]]
    for s, ex in zip((-1, 1), eyes_x):
        inner, outer = ex - s * 0.14 * R, ex + s * 0.15 * R
        d.line([P((inner, by + din * R)), P((outer, by + dout * R))], fill=bcol, width=int(0.075 * R * ss))
    nx, ny = hc[0] + fxo + f * 0.1 * R, hc[1] + 0.24 * R
    X, Y = P((nx, ny))
    r = 0.07 * R * ss
    a0, a1 = (20, 160) if f == 0 else ((-80, 80) if f > 0 else (100, 260))
    d.arc([X - r, Y - r, X + r, Y + r], a0, a1, fill=OUT, width=int(lw * 0.75))
    if c["beard"]:
        outer = arc_pts(1.0 * R, 10, 170)
        inner = [(hc[0] - 0.62 * R, hc[1] + 0.3 * R), (hc[0] + fxo - 0.24 * R, hc[1] + 0.4 * R),
                 (hc[0] + fxo + 0.24 * R, hc[1] + 0.4 * R), (hc[0] + 0.62 * R, hc[1] + 0.3 * R)]
        poly(outer + inner, c["beard"])
        ell(hc[0] + fxo, hc[1] + 0.58 * R, 0.22 * R, 0.13 * R, HEAD_FILL, outline=False)
    mx, my = hc[0] + fxo, hc[1] + 0.55 * R
    m = p["mouth"]
    mw = int(lw * 0.85)

    def mbox(a, b, cc, e):
        X0, Y0 = P((a, b))
        X1, Y1 = P((cc, e))
        return [X0, Y0, X1, Y1]
    if m == "smile":
        d.arc(mbox(mx - 0.19 * R, my - 0.15 * R, mx + 0.19 * R, my + 0.09 * R), 20, 160, fill=OUT, width=mw)
    elif m == "big":
        d.chord(mbox(mx - 0.24 * R, my - 0.17 * R, mx + 0.24 * R, my + 0.22 * R), 0, 180, fill=(150, 52, 52), outline=OUT, width=mw)
        d.rectangle(mbox(mx - 0.17 * R, my - 0.0 * R, mx + 0.17 * R, my + 0.06 * R), fill=(255, 255, 255))
    elif m == "talk":
        a = max(0.0, min(1.0, p["amp"]))
        ell(mx, my + 0.03 * R, 0.12 * R, (0.03 + 0.11 * a) * R, (150, 52, 52), w=1.6)
    elif m == "line":
        d.line([P((mx - 0.12 * R, my)), P((mx + 0.12 * R, my))], fill=OUT, width=mw)
    elif m == "frown":
        d.arc(mbox(mx - 0.17 * R, my, mx + 0.17 * R, my + 0.22 * R), 200, 340, fill=OUT, width=mw)
    elif m == "O":
        ell(mx, my + 0.02 * R, 0.07 * R, 0.09 * R, (130, 44, 44), w=1.6)
    if c["mustache"]:
        for s in (-1, 1):
            ell(mx + s * 0.12 * R, my - 0.14 * R, 0.14 * R, 0.042 * R, shade(hcol, 0.85), w=1.4)

    for mk in p["marks"]:
        if mk == "sweat":
            sx = hc[0] + (-f if f else 1) * 1.1 * R
            sy = hc[1] - 0.3 * R
            poly([(sx, sy - 10), (sx - 4.6, sy + 1), (sx + 4.6, sy + 1)], (150, 204, 244), outline=False)
            ell(sx, sy + 2, 4.8, 5.4, (150, 204, 244), w=1.4)
        elif mk in ("?", "!") and mark_font:
            d.text(P((hc[0] + 0.85 * R, hc[1] - 2.3 * R)), mk, font=_font(mark_font, 44 * ss), fill=OUT)
    return img.resize((cw // 2, ch // 2), Image.LANCZOS)
