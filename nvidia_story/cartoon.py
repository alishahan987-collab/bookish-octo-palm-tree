"""Cartoon people for the Nvidia story, drawn in code so they stay sharp and consistent at full HD."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = (32, 30, 34)                     # outline color
HEAD_R, TORSO, UPPER, FORE, THIGH, SHIN = 41.0, 58.0, 29.0, 27.0, 33.0, 31.0
ARM_W, LEG_W, OUTLINE_W = 12.0, 15.0, 3.0
BOX = (-190, 190, -345, 30)            # drawing area around the ground point, in figure units

PEOPLE = {
    "jensen":     dict(skin=(236, 198, 160), hair="side", hair_col=(30, 30, 36), glasses=True, shirt=(164, 192, 222),
                       jacket=None, tie=None, pants=(66, 72, 88), shoes=(42, 38, 36), beard=None, mustache=False),
    "jensen_now": dict(skin=(236, 198, 160), hair="side", hair_col=(44, 44, 50), glasses=False, shirt=(52, 52, 58),
                       jacket=(28, 28, 32), tie=None, pants=(34, 34, 38), shoes=(24, 24, 26), beard=None, mustache=False),
    "chris":      dict(skin=(240, 205, 174), hair="messy", hair_col=(106, 70, 42), glasses=False, shirt=(98, 134, 100),
                       jacket=None, tie=None, pants=(86, 74, 64), shoes=(62, 46, 36), beard=(106, 70, 42), mustache=False),
    "curtis":     dict(skin=(244, 212, 182), hair="swoop", hair_col=(198, 158, 94), glasses=False, shirt=(148, 64, 62),
                       jacket=None, tie=None, pants=(72, 76, 86), shoes=(46, 42, 40), beard=None, mustache=True),
    "boss":       dict(skin=(232, 196, 158), hair="short", hair_col=(160, 160, 164), glasses=False, shirt=(244, 244, 240),
                       jacket=(46, 56, 88), tie=(184, 44, 42), pants=(46, 56, 88), shoes=(30, 30, 32), beard=None, mustache=False),
    "worker":     dict(skin=(226, 186, 150), hair="short", hair_col=(72, 52, 38), glasses=False, shirt=(212, 132, 62),
                       jacket=None, tie=None, pants=(70, 80, 96), shoes=(44, 40, 38), beard=None, mustache=False),
}


def vec(a, length):
    """Angle in degrees from straight down; positive = toward screen right."""
    r = math.radians(a)
    return np.array([math.sin(r) * length, math.cos(r) * length])


def shade(c, k):
    return tuple(int(max(0, min(255, v * k))) for v in c)


def pose(**kw):
    p = dict(facing=0, lean=0.0, legs=[(-4, -2), (4, 2)], arms=[(-14, -6), (14, 6)], yoff=0.0,
             mouth="smile", amp=0.0, brows="neutral", eyes="open", look=(0, 0), marks=(), prop=None, step=False)
    p.update(kw)
    return p


def stand(f=0, **kw):
    if f == 0:
        p = pose()
    else:
        p = pose(facing=f, legs=[(-f * 3, -f * 3), (f * 4, f * 4)], arms=[(-f * 4, -f * 2), (f * 8, f * 18)])
    p.update(kw)
    return p


A_LEG = 24


def walk(phi, f, **kw):
    legs, arms = [], []
    for i in range(2):
        ph = phi + i * math.pi
        th = A_LEG * math.sin(ph)
        knee = 6 + 40 * max(0.0, math.cos(ph)) ** 1.3
        legs.append((f * th, f * (th - knee)))
        au = -0.8 * A_LEG * math.sin(ph)
        arms.append((f * au, f * (au + 20)))
    p = pose(legs=legs, arms=arms, facing=f, lean=f * 3)
    p.update(kw)
    return p


def _foot_x(legs):
    return [vec(t, THIGH)[0] + vec(s, SHIN)[0] for t, s in legs]


STEP_U = abs(np.subtract(*_foot_x(walk(math.pi / 2, 1)["legs"])))


def joints(p):
    hip = np.zeros(2)
    f = p["facing"]
    lat = 8 if f == 0 else 3
    legs = []
    for i, (ta, sa) in enumerate(p["legs"]):
        top = hip + np.array([-lat if i == 0 else lat, 0.0])
        knee = top + vec(ta, THIGH)
        legs.append([top, knee, knee + vec(sa, SHIN)])
    low = max(l[2][1] for l in legs)
    shift = np.array([0.0, -low - 7.0 - p["yoff"]])
    hip = hip + shift
    legs = [[q + shift for q in l] for l in legs]
    lean = math.radians(p["lean"])
    up = np.array([math.sin(lean), -math.cos(lean)])
    nrm = np.array([-up[1], up[0]])
    neck = hip + up * TORSO
    head = neck + up * (HEAD_R * 0.86 + 2)
    sw = 21 if f == 0 else 11
    shoulders = [neck - up * 8 - nrm * sw, neck - up * 8 + nrm * sw]
    arms = []
    for i, (ua, fa) in enumerate(p["arms"]):
        e = shoulders[i] + vec(ua, UPPER)
        arms.append([shoulders[i], e, e + vec(fa, FORE)])
    return dict(hip=hip, legs=legs, up=up, nrm=nrm, neck=neck, head=head, arms=arms)


def head_point(p, x, gy, s, dy=-1.0):
    """Screen position of the top (dy=-1) or centre (dy=0) of the head."""
    h = joints(p)["head"]
    return x + h[0] * s, gy + (h[1] + dy * HEAD_R) * s


_font_cache = {}


def _font(path, size):
    k = (path, int(size))
    if k not in _font_cache:
        _font_cache[k] = ImageFont.truetype(path, int(size))
    return _font_cache[k]


def render(who, p, scale, mark_font=None):
    c = PEOPLE[who]
    ss = scale * 2.0
    x0, x1, y0, y1 = BOX
    cw, ch = int((x1 - x0) * ss), int((y1 - y0) * ss)
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ow = OUTLINE_W * ss

    def P(q):
        return ((q[0] - x0) * ss, (q[1] - y0) * ss)

    def dot(q, r, fill):
        X, Y = P(q)
        d.ellipse([X - r, Y - r, X + r, Y + r], fill=fill)

    def limb(pts, width, fill):
        xy = [P(q) for q in pts]
        wo = width * ss + 2 * ow
        d.line(xy, fill=OUT, width=int(wo), joint="curve")
        for q in pts:
            dot(q, wo / 2, OUT)
        d.line(xy, fill=fill, width=int(width * ss), joint="curve")
        for q in pts:
            dot(q, width * ss / 2, fill)

    def ell(cx, cy, rx, ry, fill, outline=True):
        X, Y = P((cx, cy))
        if outline:
            d.ellipse([X - rx * ss - ow, Y - ry * ss - ow, X + rx * ss + ow, Y + ry * ss + ow], fill=OUT)
        d.ellipse([X - rx * ss, Y - ry * ss, X + rx * ss, Y + ry * ss], fill=fill)

    def poly(pts, fill, outline=True):
        d.polygon([P(q) for q in pts], fill=fill, outline=OUT if outline else None, width=int(ow) if outline else 0)

    j = joints(p)
    f = p["facing"]
    hip, up, nrm = j["hip"], j["up"], j["nrm"]
    far_arm = 0 if f == 1 else (1 if f == -1 else None)
    near_arms = [i for i in (0, 1) if i != far_arm]
    sleeve = c["jacket"] or c["shirt"]

    # shadow
    sw = 34 * (1 - min(0.5, p["yoff"] / 120))
    X0, Y0 = P((hip[0] - sw, -5))
    X1, Y1 = P((hip[0] + sw, 5))
    d.ellipse([X0, Y0, X1, Y1], fill=(20, 18, 16, 46))

    def arm(i):
        s_, e_, h_ = j["arms"][i]
        limb([s_, e_, h_], ARM_W, sleeve)
        ell(h_[0], h_[1], 6.8, 6.8, c["skin"])

    if far_arm is not None:
        arm(far_arm)
    for li in ([0, 1] if f >= 0 else [1, 0]):
        top, knee, ankle = j["legs"][li]
        limb([top, knee, ankle], LEG_W, c["pants"])
        dirx = f if f != 0 else (-1 if li == 0 else 1)
        ell(ankle[0] + dirx * 6, ankle[1] + 3, 12.5, 6.5, c["shoes"])

    def tp(dd, hw):
        return hip + up * dd + nrm * hw

    # neck, torso, collar / jacket
    poly([tp(TORSO + 10, -6), tp(TORSO + 10, 6), tp(TORSO - 4, 6), tp(TORSO - 4, -6)], c["skin"])
    shw = 23 if f == 0 else 18
    torso = [tp(TORSO - 2, -shw + 7), tp(TORSO - 9, -shw), tp(4, -shw + 3), tp(-7, -shw + 2),
             tp(-7, shw - 2), tp(4, shw - 3), tp(TORSO - 9, shw), tp(TORSO - 2, shw - 7)]
    poly(torso, c["jacket"] or c["shirt"])
    cx_off = f * 3
    if c["jacket"]:
        poly([tp(TORSO - 2, cx_off - 8), tp(TORSO - 2, cx_off + 8), tp(TORSO - 30, cx_off)], c["shirt"])
        if c["tie"]:
            poly([tp(TORSO - 4, cx_off - 3), tp(TORSO - 4, cx_off + 3), tp(TORSO - 25, cx_off + 4),
                  tp(TORSO - 31, cx_off), tp(TORSO - 25, cx_off - 4)], c["tie"])
        for s in (-1, 1):
            d.line([P(tp(TORSO - 2, cx_off + s * 10)), P(tp(TORSO - 34, cx_off + s * 1))], fill=OUT, width=int(ow * 0.8))
    else:
        light = shade(c["shirt"], 1.15)
        poly([tp(TORSO - 1, cx_off - 10), tp(TORSO - 1, cx_off), tp(TORSO - 10, cx_off - 5)], light)
        poly([tp(TORSO - 1, cx_off + 10), tp(TORSO - 1, cx_off), tp(TORSO - 10, cx_off + 5)], light)

    for i in near_arms:
        arm(i)

    # held props
    if p["prop"] == "box":
        h0, h1 = j["arms"][0][2], j["arms"][1][2]
        bc = (h0 + h1) / 2 + up * 10
        poly([bc + (-28, -22), bc + (28, -22), bc + (28, 18), bc + (-28, 18)], (198, 158, 108))
        poly([bc + (-28, -22), bc + (28, -22), bc + (22, -30), bc + (-22, -30)], (214, 176, 124))
        ell(bc[0] - 10, bc[1] - 36, 6, 10, (90, 160, 80))
        ell(bc[0] - 2, bc[1] - 40, 6, 11, (90, 160, 80))
        poly([bc + (8, -44), bc + (20, -44), bc + (19, -28), bc + (9, -28)], (236, 236, 232))
        for h_ in (h0, h1):
            ell(h_[0], h_[1], 6.8, 6.8, c["skin"])
    elif p["prop"] == "chip":
        hn = j["arms"][near_arms[-1]][2]
        poly([hn + (-11, -24), hn + (11, -24), hn + (11, -4), hn + (-11, -4)], (36, 38, 42))
        ell(hn[0], hn[1], 6.8, 6.8, c["skin"])

    # head
    hc = j["head"]
    R = HEAD_R
    fxo = f * 0.2 * R
    for s in ([-1, 1] if f == 0 else [-f]):
        ell(hc[0] + s * 0.96 * R, hc[1] + 0.08 * R, 0.2 * R, 0.24 * R, c["skin"])
    ell(hc[0], hc[1], R, R * 1.02, c["skin"])

    def arc_pts(r, a0, a1, n=28, cx=None, cy=None):
        cx = hc[0] if cx is None else cx
        cy = hc[1] if cy is None else cy
        return [(cx + math.cos(math.radians(a)) * r, cy + math.sin(math.radians(a)) * r) for a in np.linspace(a0, a1, n)]

    hcol = c["hair_col"]
    fs = f * 0.12 * R
    if c["hair"] in ("side", "swoop"):
        cap = arc_pts(1.07 * R, 186, 354)
        fringe = [(hc[0] + 0.9 * R, hc[1] - 0.3 * R), (hc[0] + 0.5 * R + fs, hc[1] - 0.5 * R),
                  (hc[0] + 0.22 * R + fs, hc[1] - 0.64 * R), (hc[0] - 0.05 * R + fs, hc[1] - 0.48 * R),
                  (hc[0] - 0.5 * R + fs, hc[1] - 0.44 * R), (hc[0] - 0.92 * R, hc[1] - 0.22 * R)]
        poly(cap + fringe, hcol)
        if c["hair"] == "swoop":
            ell(hc[0] + 0.25 * R + fs, hc[1] - 0.92 * R, 0.62 * R, 0.3 * R, hcol)
            poly(arc_pts(1.04 * R, 200, 340), hcol, outline=False)
    elif c["hair"] == "messy":
        curls = [(hc[0] + math.cos(math.radians(a)) * 0.98 * R, hc[1] + math.sin(math.radians(a)) * 0.98 * R)
                 for a in range(192, 352, 18)]
        for q in curls:
            ell(q[0], q[1], 0.27 * R, 0.27 * R, hcol)
        for q in curls:
            ell(q[0], q[1], 0.27 * R - OUTLINE_W, 0.27 * R - OUTLINE_W, hcol, outline=False)
        cap = arc_pts(1.0 * R, 188, 352)
        fringe = [(hc[0] + 0.85 * R, hc[1] - 0.35 * R), (hc[0] + 0.4 * R + fs, hc[1] - 0.6 * R),
                  (hc[0] + fs, hc[1] - 0.5 * R), (hc[0] - 0.4 * R + fs, hc[1] - 0.6 * R), (hc[0] - 0.85 * R, hc[1] - 0.35 * R)]
        poly(cap + fringe, hcol, outline=False)
        d.line([P(q) for q in fringe], fill=OUT, width=int(ow), joint="curve")
    elif c["hair"] == "short":
        cap = arc_pts(1.06 * R, 188, 352)
        fringe = [(hc[0] + 0.88 * R, hc[1] - 0.48 * R), (hc[0] + 0.4 * R + fs, hc[1] - 0.74 * R),
                  (hc[0] + fs, hc[1] - 0.8 * R), (hc[0] - 0.4 * R + fs, hc[1] - 0.74 * R), (hc[0] - 0.88 * R, hc[1] - 0.48 * R)]
        poly(cap + fringe, hcol)

    # face
    ey = hc[1] - 0.02 * R
    sep = 0.3 * R * (1 - 0.2 * abs(f))
    eyes_x = [hc[0] + fxo - sep, hc[0] + fxo + sep]
    lx, ly = p["look"]
    for ex in eyes_x:
        if p["eyes"] == "closed":
            X, Y = P((ex, ey))
            r = 0.11 * R * ss
            d.arc([X - r, Y - r, X + r, Y + r], 200, 340, fill=OUT, width=int(ow * 0.9))
        elif p["eyes"] == "wide":
            ell(ex, ey, 0.15 * R, 0.17 * R, (255, 255, 255))
            ell(ex + lx * 0.05 * R, ey + ly * 0.05 * R, 0.06 * R, 0.08 * R, OUT, outline=False)
        else:
            ell(ex + lx * 0.05 * R, ey + ly * 0.05 * R, 0.075 * R, 0.11 * R, OUT, outline=False)
    if c["glasses"]:
        for ex in eyes_x:
            X0, Y0 = P((ex - 0.23 * R, ey - 0.17 * R))
            X1, Y1 = P((ex + 0.23 * R, ey + 0.17 * R))
            d.rounded_rectangle([X0, Y0, X1, Y1], radius=0.07 * R * ss, outline=OUT, width=int(ow * 0.8))
        d.line([P((eyes_x[0] + 0.23 * R, ey - 0.05 * R)), P((eyes_x[1] - 0.23 * R, ey - 0.05 * R))], fill=OUT, width=int(ow * 0.8))
    by = ey - (0.36 if c["glasses"] else 0.3) * R
    bcol = shade(hcol, 0.75) if sum(hcol) < 450 else (110, 110, 116)
    din, dout = {"neutral": (0, 0), "worried": (-0.12, 0.04), "angry": (0.08, -0.07),
                 "raised": (-0.12, -0.12), "sad": (-0.08, 0.06)}[p["brows"]]
    for s, ex in zip((-1, 1), eyes_x):
        inner, outer = ex - s * 0.14 * R, ex + s * 0.14 * R
        d.line([P((inner, by + din * R)), P((outer, by + dout * R))], fill=bcol, width=int(0.08 * R * ss))
    nx, ny = hc[0] + fxo + f * 0.12 * R, hc[1] + 0.2 * R
    X, Y = P((nx, ny))
    r = 0.08 * R * ss
    a0, a1 = (20, 160) if f == 0 else ((-80, 80) if f > 0 else (100, 260))
    d.arc([X - r, Y - r, X + r, Y + r], a0, a1, fill=OUT, width=int(ow * 0.8))
    if c["beard"]:
        outer = arc_pts(1.0 * R, 8, 172)
        inner = [(hc[0] - 0.6 * R, hc[1] + 0.22 * R), (hc[0] + fxo - 0.25 * R, hc[1] + 0.34 * R),
                 (hc[0] + fxo + 0.25 * R, hc[1] + 0.34 * R), (hc[0] + 0.6 * R, hc[1] + 0.22 * R)]
        poly(outer + inner, c["beard"])
        ell(hc[0] + fxo, hc[1] + 0.54 * R, 0.24 * R, 0.15 * R, c["skin"], outline=False)
    mx, my = hc[0] + fxo, hc[1] + 0.52 * R
    m = p["mouth"]
    mw = int(ow * 0.9)

    def mbox(a, b, cc, e):
        X0, Y0 = P((a, b))
        X1, Y1 = P((cc, e))
        return [X0, Y0, X1, Y1]
    if m == "smile":
        d.arc(mbox(mx - 0.2 * R, my - 0.16 * R, mx + 0.2 * R, my + 0.1 * R), 20, 160, fill=OUT, width=mw)
    elif m == "big":
        d.chord(mbox(mx - 0.25 * R, my - 0.18 * R, mx + 0.25 * R, my + 0.24 * R), 0, 180, fill=(124, 40, 40), outline=OUT, width=mw)
        d.rectangle(mbox(mx - 0.18 * R, my - 0.01 * R, mx + 0.18 * R, my + 0.06 * R), fill=(250, 250, 250))
    elif m == "talk":
        a = max(0.0, min(1.0, p["amp"]))
        ell(mx, my + 0.03 * R, 0.13 * R, (0.03 + 0.12 * a) * R, (124, 40, 40))
    elif m == "line":
        d.line([P((mx - 0.13 * R, my)), P((mx + 0.13 * R, my))], fill=OUT, width=mw)
    elif m == "frown":
        d.arc(mbox(mx - 0.18 * R, my, mx + 0.18 * R, my + 0.24 * R), 200, 340, fill=OUT, width=mw)
    elif m == "O":
        ell(mx, my + 0.02 * R, 0.07 * R, 0.1 * R, (110, 34, 34))
    if c["mustache"]:
        for s in (-1, 1):
            ell(mx + s * 0.12 * R, my - 0.15 * R, 0.15 * R, 0.045 * R, shade(hcol, 0.8))

    # little marks
    for mk in p["marks"]:
        if mk == "sweat":
            sx = hc[0] + (-f if f else 1) * 1.08 * R
            sy = hc[1] - 0.35 * R
            poly([(sx, sy - 11), (sx - 5, sy + 1), (sx + 5, sy + 1)], (150, 200, 240), outline=False)
            ell(sx, sy + 2, 5.2, 6, (150, 200, 240))
        elif mk in ("?", "!") and mark_font:
            font = _font(mark_font, 46 * ss)
            d.text(P((hc[0] + 0.85 * R, hc[1] - 2.3 * R)), mk, font=font, fill=OUT)
    return img.resize((cw // 2, ch // 2), Image.LANCZOS)
