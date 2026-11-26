"""Motion-graphics props used across episodes (all drawn in code, sharp at any zoom)."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import character as C
from world import (AA, paste, font, FONT_XB, FONT_B, FONT_HAND, clip01, smooth, back, BGQ, OUT_W, OUT_H,
                   INK, BLUE, ORANGE, PURPLE)


# ----------------------------------------------------------------------------- paths
def catmull(points, n=12):
    pts = [np.array(p, float) for p in points]
    pts = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-2])
    return np.array(out)


class Path:
    def __init__(self, points, n=14):
        self.p = catmull(points, n)
        seg = np.linalg.norm(np.diff(self.p, axis=0), axis=1)
        self.cum = np.concatenate([[0], np.cumsum(seg)])
        self.L = self.cum[-1]

    def at(self, u):
        s = clip01(u) * self.L
        i = min(len(self.cum) - 2, int(np.searchsorted(self.cum, s) - 1))
        i = max(0, i)
        f = (s - self.cum[i]) / max(1e-6, self.cum[i + 1] - self.cum[i])
        pos = self.p[i] + (self.p[i + 1] - self.p[i]) * f
        tan = self.p[i + 1] - self.p[i]
        tan = tan / max(1e-6, np.linalg.norm(tan))
        return pos, tan

    def upto(self, u):
        s = clip01(u) * self.L
        k = int(np.searchsorted(self.cum, s))
        pts = list(self.p[:k])
        pts.append(self.at(u)[0])
        return pts


# ----------------------------------------------------------------------------- world layers (static art that moves with the camera)
_layers = {}


def world_layer(name, builder, ww=OUT_W, wh=OUT_H):
    if name not in _layers:
        k = BGQ * 2
        img = Image.new("RGBA", (int(ww * k), int(wh * k)), (0, 0, 0, 0))
        builder(ImageDraw.Draw(img), k, img)
        _layers[name] = img.resize((int(ww * BGQ), int(wh * BGQ)), Image.LANCZOS)
    return _layers[name]


def view_layer(frame, cam, layer, alpha=1.0):
    hw, hh = OUT_W / 2 / cam.z, OUT_H / 2 / cam.z
    box = ((cam.cx - hw) * BGQ, (cam.cy - hh) * BGQ, (cam.cx + hw) * BGQ, (cam.cy + hh) * BGQ)
    im = layer.resize((OUT_W, OUT_H), Image.BILINEAR, box=box)
    if alpha < 0.999:
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(im)


# ----------------------------------------------------------------------------- the head diagram (science scenes)
HEAD_OUTLINE = [(330, 1400), (330, 1180), (262, 1020), (222, 840), (290, 600), (470, 470), (660, 520), (760, 640),
                (786, 735), (772, 775), (852, 862), (792, 888), (806, 920), (786, 946), (806, 972), (792, 1040),
                (742, 1092), (642, 1112), (652, 1180), (668, 1240), (652, 1400)]
SKULL = [(300, 1000), (262, 840), (318, 640), (470, 520), (640, 560), (730, 660), (752, 760)]
JAW = [(440, 930), (500, 1060), (620, 1090), (760, 1050), (782, 1010)]
EAR = (420, 862)
COCHLEA = (505, 880)
CORDS = (632, 1238)
MOUTH = (812, 946)
AIR_PATH = Path([MOUTH, (900, 962), (985, 890), (1005, 700), (910, 470), (660, 350), (390, 395), (205, 560), (160, 770), (270, 880), (395, 868)])
LISTEN_PATH = Path([MOUTH, (900, 975), (960, 1060), (985, 1160)])
BONE_PATH = Path([CORDS, (642, 1150), (560, 1080), (470, 1030), (340, 975), (282, 845), (330, 760), (430, 800), COCHLEA])


def _diagram_static(d, k, img):
    def S(pts):
        return [(x * k, y * k) for x, y in pts]
    outline = catmull(HEAD_OUTLINE, 10)
    d.polygon(S(outline), fill=(220, 234, 255, 46))
    d.line(S(outline), fill=(235, 244, 255, 235), width=int(7 * k), joint="curve")
    skull = catmull(SKULL, 10)
    d.line(S(skull), fill=(255, 236, 205, 120), width=int(16 * k), joint="curve")
    jaw = catmull(JAW, 10)
    d.line(S(jaw), fill=(255, 236, 205, 120), width=int(16 * k), joint="curve")
    ex, ey = EAR
    d.arc([(ex - 34) * k, (ey - 52) * k, (ex + 34) * k, (ey + 52) * k], 90, 290, fill=(235, 244, 255, 220), width=int(7 * k))
    d.line(S([(ex + 10, ey + 6), (COCHLEA[0] - 20, COCHLEA[1])]), fill=(235, 244, 255, 160), width=int(6 * k))
    cx, cy = COCHLEA
    pts = []
    for i in range(80):
        a = i / 80 * 4.2 * math.pi
        r = 26 * (1 - i / 95)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    d.line(S(pts), fill=(235, 244, 255, 210), width=int(6 * k), joint="curve")
    for x in (604, 662):
        d.line(S([(x, 1150), (x, 1400)]), fill=(235, 244, 255, 120), width=int(5 * k))
    vx, vy = CORDS
    d.line(S([(vx - 24, vy - 14), (vx, vy + 14), (vx + 24, vy - 14)]), fill=(255, 210, 160, 230), width=int(7 * k), joint="curve")


def head_diagram(frame, cam, t, st):
    """st: dict(show=alpha, cords=t_on, air=t_on, listen=t_on, bone=t_on, merge=t_on, blocked_air=t_on)."""
    a = st.get("show", 1.0)
    if a <= 0:
        return
    view_layer(frame, cam, world_layer("head_diagram", _diagram_static), a)
    z = cam.z
    if st.get("cords") is not None and t >= st["cords"]:
        sx, sy = cam.S(*CORDS)
        aa = AA((sx - 90 * z, sy - 70 * z, sx + 90 * z, sy + 70 * z))
        amp = 6 + 5 * math.sin(t * 40)
        for side in (-1, 1):
            for k in range(3):
                r = (28 + k * 16) * z
                X, Y = aa.T(sx, sy)
                aa.d.arc([X - 2 * r, Y - 2 * r, X + 2 * r, Y + 2 * r], (0 if side > 0 else 180) - 30, (0 if side > 0 else 180) + 30,
                         fill=(255, 200, 120, int(200 - 50 * k)), width=int(5 * z * 2))
        aa.done(frame)

    def glyphs(path, t_on, color, kind, n=9, speed=0.35, upto=1.0, blocked_at=None):
        if t_on is None or t < t_on:
            return
        rev = clip01((t - t_on) / 1.2)
        pts = [cam.S(*q) for q in path.upto(rev * upto)]
        xs, ys = [q[0] for q in pts], [q[1] for q in pts]
        aa = AA((min(xs) - 60, min(ys) - 60, max(xs) + 60, max(ys) + 60))
        if len(pts) > 1:
            aa.d.line(aa.pts(pts), fill=color + (90,), width=int(10 * z), joint="curve")
        for i in range(n):
            u = ((t - t_on) * speed + i / n) % 1.0
            if u > rev * upto:
                continue
            if blocked_at is not None and u > blocked_at:
                continue
            pos, tan = path.at(u)
            sx, sy = cam.S(*pos)
            X, Y = aa.T(sx, sy)
            fade = min(1.0, u / 0.08, (upto - u) / 0.1 if upto < 1 else 1.0)
            if kind == "air":
                ang = math.degrees(math.atan2(tan[1], tan[0]))
                r = 26 * z * 2
                aa.d.arc([X - r, Y - r, X + r, Y + r], ang - 55, ang + 55, fill=color + (int(255 * fade),), width=int(8 * z * 2))
            else:
                r = 13 * z * 2 * (1 + 0.25 * math.sin(t * 12 + i))
                aa.d.ellipse([X - r * 1.8, Y - r * 1.8, X + r * 1.8, Y + r * 1.8], fill=color + (int(70 * fade),))
                aa.d.ellipse([X - r, Y - r, X + r, Y + r], fill=color + (int(255 * fade),))
        aa.done(frame)

    glyphs(AIR_PATH, st.get("air"), BLUE, "air", blocked_at=st.get("air_block"))
    glyphs(LISTEN_PATH, st.get("listen"), BLUE, "air", n=5)
    glyphs(BONE_PATH, st.get("bone"), ORANGE, "bone", n=8, speed=0.3)
    if st.get("merge") is not None and t >= st["merge"]:
        sx, sy = cam.S(*COCHLEA)
        u = smooth((t - st["merge"]) / 0.6)
        aa = AA((sx - 160 * z, sy - 160 * z, sx + 160 * z, sy + 160 * z))
        for k, al in ((150, 50), (100, 90), (60, 170)):
            r = k * z * u * (1 + 0.06 * math.sin(t * 6))
            X, Y = aa.T(sx, sy)
            aa.d.ellipse([X - r * 2, Y - r * 2, X + r * 2, Y + r * 2], fill=PURPLE + (al,))
        aa.done(frame)
    if st.get("listen") is not None and t >= st["listen"]:
        u = smooth((t - st["listen"]) / 0.4)
        p = dict(C.stand(look=(-1, 0)))
        p["scarf"] = 0
        img, (ox, oy) = C.render(p, 0.75 * cam.z, extra=True)
        sx, sy = cam.S(985, 1420)
        img.putalpha(img.getchannel("A").point(lambda v: int(v * u)))
        paste(frame, img, sx + ox, sy + oy)


# ----------------------------------------------------------------------------- other props
def tape_recorder(frame, cam, x, y, t, spinning=True, s=1.0):
    sx, sy = cam.S(x, y)
    z = cam.z * s
    aa = AA((sx - 190 * z, sy - 140 * z, sx + 190 * z, sy + 90 * z))
    aa.d.rounded_rectangle(aa.pts([(sx - 170 * z, sy - 120 * z), (sx + 170 * z, sy + 70 * z)]), radius=18 * z * 2, fill=(120, 96, 76), outline=INK, width=int(6 * z))
    aa.d.rounded_rectangle(aa.pts([(sx - 150 * z, sy + 10 * z), (sx + 150 * z, sy + 56 * z)]), radius=10 * z * 2, fill=(70, 56, 44))
    for kx in (-80, 80):
        cx, cy = sx + kx * z, sy - 50 * z
        X, Y = aa.T(cx, cy)
        r = 58 * z * 2
        aa.d.ellipse([X - r, Y - r, X + r, Y + r], fill=(210, 210, 214), outline=INK, width=int(6 * z))
        rot = t * (240 if spinning else 0) + kx
        for k in range(3):
            a = math.radians(rot + k * 120)
            aa.d.line([(X, Y), (X + math.cos(a) * r * 0.8, Y + math.sin(a) * r * 0.8)], fill=(90, 90, 96), width=int(10 * z))
        aa.d.ellipse([X - 12 * z, Y - 12 * z, X + 12 * z, Y + 12 * z], fill=INK)
    aa.d.line(aa.pts([(sx - 80 * z, sy - 108 * z), (sx + 80 * z, sy - 108 * z)]), fill=(60, 44, 36), width=int(5 * z))
    aa.done(frame)


def mic_stand(frame, cam, x, y, s=1.0, glow=0.0):
    sx, sy = cam.S(x, y)
    z = cam.z * s
    aa = AA((sx - 120 * z, sy - 560 * z, sx + 120 * z, sy + 20 * z))
    aa.d.line(aa.pts([(sx, sy), (sx, sy - 380 * z)]), fill=(70, 74, 86), width=int(14 * z))
    aa.d.line(aa.pts([(sx - 90 * z, sy), (sx + 90 * z, sy)]), fill=(70, 74, 86), width=int(16 * z))
    if glow > 0:
        X, Y = aa.T(sx, sy - 450 * z)
        r = 110 * z * 2
        aa.d.ellipse([X - r, Y - r, X + r, Y + r], fill=(80, 200, 120, int(80 * glow)))
    aa.d.rounded_rectangle(aa.pts([(sx - 44 * z, sy - 530 * z), (sx + 44 * z, sy - 380 * z)]), radius=44 * z * 2, fill=(150, 156, 170), outline=INK, width=int(7 * z))
    for k in range(4):
        yy = sy - (505 - k * 30) * z
        aa.d.line(aa.pts([(sx - 34 * z, yy), (sx + 34 * z, yy)]), fill=(110, 116, 130), width=int(5 * z))
    aa.done(frame)


def calendar(frame, x, y, t, t0, n0=1, n1=9125):
    if t < t0:
        return
    u = clip01((t - t0) / 2.4)
    n = int(n0 + (n1 - n0) * u ** 2)
    flip = (t * 10) % 1
    aa = AA((x - 190, y - 220, x + 190, y + 200))
    aa.d.rounded_rectangle(aa.pts([(x - 160, y - 180), (x + 160, y + 170)]), radius=36, fill=(255, 255, 255), outline=INK, width=12)
    aa.d.rounded_rectangle(aa.pts([(x - 160, y - 180), (x + 160, y - 90)]), radius=36, fill=(226, 64, 56), outline=INK, width=12)
    aa.d.text(aa.T(x, y - 135), "DAY", font=font(FONT_XB, 80), fill=(255, 255, 255), anchor="mm")
    aa.d.text(aa.T(x, y + 40), f"{n:,}", font=font(FONT_XB, 150 if n < 1000 else 118), fill=INK, anchor="mm")
    if u < 1:
        h = 250 * (1 - flip)
        aa.d.polygon(aa.pts([(x - 160, y - 90), (x + 160, y - 90), (x + 150, y - 90 + h * 0.6), (x - 150, y - 90 + h * 0.6)]), fill=(240, 240, 236, 160))
    aa.done(frame)


def hero_portrait(flipped, size=230):
    p = dict(C.stand(look=(0.15, 0), mouth="smile", mouth_k=0.6, facing=0.25))
    p["scarf"] = -6
    img, (ox, oy) = C.render(p, 3.2)
    hc = C.joints(p)["head"]
    cx = (hc[0] - C.BOX[0]) * 3.2
    cy = (hc[1] - C.BOX[2]) * 3.2
    r = 150
    crop = img.crop((int(cx - r), int(cy - r * 1.05), int(cx + r), int(cy + r * 0.95)))
    if flipped:
        crop = crop.transpose(Image.FLIP_LEFT_RIGHT)
    return crop.resize((size, size), Image.LANCZOS)


_portraits = {}


def photo_card(frame, x, y, t, at, flipped, label, heart_at=None, heart_col=None, glow=0.0):
    if t < at:
        return
    if flipped not in _portraits:
        _portraits[flipped] = hero_portrait(flipped)
    u = back((t - at) / 0.35)
    w, h = 300 * u, 370 * u
    aa = AA((x - 200, y - 240, x + 200, y + 260))
    if glow > 0:
        aa.d.rounded_rectangle(aa.pts([(x - w / 2 - 22, y - h / 2 - 22), (x + w / 2 + 22, y + h / 2 + 22)]), radius=40, fill=(255, 214, 64, int(140 * glow)))
    aa.d.rounded_rectangle(aa.pts([(x - w / 2 + 8, y - h / 2 + 12), (x + w / 2 + 8, y + h / 2 + 12)]), radius=18, fill=(0, 0, 0, 70))
    aa.d.rounded_rectangle(aa.pts([(x - w / 2, y - h / 2), (x + w / 2, y + h / 2)]), radius=18, fill=(255, 255, 255), outline=INK, width=10)
    aa.done(frame)
    if u > 0.6:
        por = _portraits[flipped]
        s = min(1.0, u)
        im = por.resize((max(1, int(por.width * s)), max(1, int(por.height * s))), Image.BILINEAR)
        bg = Image.new("RGBA", im.size, (232, 240, 250, 255))
        bg.alpha_composite(im)
        paste(frame, bg, x - im.width / 2, y - h / 2 + 24 * s)
        f = font(FONT_XB, int(40 * s))
        d = ImageDraw.Draw(frame)
        d.text((x, y + h / 2 - 44 * s), label, font=f, fill=INK, anchor="mm")
    if heart_at is not None and t >= heart_at:
        from world import mark
        mark(frame, "heart", x + 120, y - 170, t, heart_at, 56)


def graph_rising(frame, box, t, t0, xlabel="FAMILIARITY", ylabel="LIKING"):
    if t < t0:
        return
    x0, y0, x1, y1 = box
    u = smooth((t - t0) / 1.6)
    aa = AA((x0 - 80, y0 - 60, x1 + 40, y1 + 90))
    aa.d.rounded_rectangle(aa.pts([(x0 - 60, y0 - 40), (x1 + 30, y1 + 80)]), radius=40, fill=(255, 255, 255, 235), outline=INK, width=10)
    aa.d.line(aa.pts([(x0, y0), (x0, y1), (x1, y1)]), fill=INK, width=12, joint="curve")
    pts = [(x0 + (x1 - x0) * k / 40, y1 - (y1 - y0) * 0.85 * (k / 40) ** 0.75) for k in range(int(40 * u) + 1)]
    if len(pts) > 1:
        aa.d.line(aa.pts(pts), fill=ORANGE, width=18, joint="curve")
    aa.d.text(aa.T((x0 + x1) / 2, y1 + 44), xlabel, font=font(FONT_XB, 84), fill=INK, anchor="mm")
    aa.d.text(aa.T(x0 + 24, y0 + 18), ylabel, font=font(FONT_XB, 84), fill=INK, anchor="lm")
    aa.done(frame)


def cringe_meter(frame, x, y, t, level, plays):
    aa = AA((x - 330, y - 110, x + 330, y + 120))
    aa.d.rounded_rectangle(aa.pts([(x - 300, y - 90), (x + 300, y + 100)]), radius=50, fill=(255, 255, 255, 240), outline=INK, width=10)
    aa.d.text(aa.T(x - 260, y - 40), "CRINGE", font=font(FONT_XB, 92), fill=INK, anchor="lm")
    aa.d.text(aa.T(x + 260, y - 40), f"PLAY x{plays}", font=font(FONT_XB, 80), fill=(120, 126, 136), anchor="rm")
    aa.d.rounded_rectangle(aa.pts([(x - 260, y + 10), (x + 260, y + 60)]), radius=24, fill=(230, 232, 236))
    w = 520 * clip01(level)
    col = (226, 64, 56) if level > 0.6 else ((255, 170, 60) if level > 0.3 else (44, 170, 100))
    if w > 10:
        aa.d.rounded_rectangle(aa.pts([(x - 260, y + 10), (x - 260 + w, y + 60)]), radius=24, fill=col)
    aa.done(frame)


def comment_icon(frame, x, y, t, at):
    if t < at:
        return
    u = back((t - at) / 0.35)
    r = 120 * u
    aa = AA((x - 200, y - 180, x + 200, y + 200))
    aa.d.rounded_rectangle(aa.pts([(x - r * 1.3, y - r), (x + r * 1.3, y + r * 0.7)]), radius=r * 0.6, fill=(255, 255, 255), outline=INK, width=12)
    aa.d.polygon(aa.pts([(x - r * 0.5, y + r * 0.62), (x - r * 0.9, y + r * 1.25), (x - r * 0.05, y + r * 0.62)]), fill=(255, 255, 255), outline=INK, width=12)
    aa.d.rectangle(aa.pts([(x - r * 0.5, y + r * 0.5), (x - r * 0.06, y + r * 0.72)]), fill=(255, 255, 255))
    for k in (-1, 0, 1):
        X, Y = aa.T(x + k * r * 0.5, y - r * 0.15)
        rr = r * 0.13 * 2
        aa.d.ellipse([X - rr, Y - rr, X + rr, Y + rr], fill=ORANGE)
    aa.done(frame)


_spots = {}


def spotlight(frame, x, y, r, strength):
    if strength <= 0.01:
        return
    key = (int(x / 8), int(y / 8), int(r / 8), round(strength, 2))
    if key not in _spots:
        if len(_spots) > 40:
            _spots.clear()
        small = Image.new("L", (OUT_W // 8, OUT_H // 8), int(200 * strength))
        ImageDraw.Draw(small).ellipse([(x - r) / 8, (y - r * 1.25) / 8, (x + r) / 8, (y + r * 1.25) / 8], fill=0)
        mask = small.filter(ImageFilter.GaussianBlur(10)).resize((OUT_W, OUT_H), Image.BILINEAR)
        layer = Image.new("RGBA", (OUT_W, OUT_H), (8, 10, 18, 255))
        layer.putalpha(mask)
        _spots[key] = layer
    frame.alpha_composite(_spots[key])


def flash(frame, amount):
    if amount <= 0.01:
        return
    frame.alpha_composite(Image.new("RGBA", frame.size, (255, 255, 255, int(255 * clip01(amount)))))


def on_air(frame, cam, box, lit):
    x0, y0, x1, y1 = box
    sx0, sy0 = cam.S(x0, y0)
    sx1, sy1 = cam.S(x1, y1)
    aa = AA((sx0 - 80, sy0 - 80, sx1 + 80, sy1 + 80))
    if lit > 0:
        aa.d.rounded_rectangle(aa.pts([(sx0 - 40, sy0 - 40), (sx1 + 40, sy1 + 40)]), radius=60, fill=(255, 60, 60, int(70 * lit)))
    aa.d.rounded_rectangle(aa.pts([(sx0, sy0), (sx1, sy1)]), radius=40, fill=(int(90 + 150 * lit), int(30 + 20 * lit), int(30 + 20 * lit)), outline=INK, width=10)
    aa.d.text(aa.T((sx0 + sx1) / 2, (sy0 + sy1) / 2), "ON AIR", font=font(FONT_XB, int(110 * cam.z)),
              fill=(255, 255, 255, int(110 + 145 * lit)), anchor="mm")
    aa.done(frame)


def rating_screen(frame, cam, box, t, st):
    """Voice-rating study on the 2013 lab screen. st: rows_at, you_at, bars_at, medal_at."""
    x0, y0, x1, y1 = box
    sx0, sy0 = cam.S(x0, y0)
    sx1, sy1 = cam.S(x1, y1)
    aa = AA((sx0, sy0, sx1, sy1))
    W_, H_ = sx1 - sx0, sy1 - sy0
    if st.get("bars_at") is None or t < st["bars_at"]:
        rows = 5
        for i in range(rows):
            at = st.get("rows_at", 0) + i * 0.12
            if t < at:
                continue
            yy = sy0 + H_ * (0.12 + i * 0.17)
            is_you = (i == 3)
            you = is_you and st.get("you_at") is not None and t >= st["you_at"]
            col = (255, 140, 40) if you else (120, 170, 220)
            aa.d.rounded_rectangle(aa.pts([(sx0 + W_ * 0.05, yy), (sx0 + W_ * 0.95, yy + H_ * 0.13)]), radius=20, fill=(60, 74, 96) if not you else (90, 70, 50))
            name = "YOU (secret)" if you else f"VOICE {i + 1 if i < 3 else i}"
            aa.d.text(aa.T(sx0 + W_ * 0.09, yy + H_ * 0.065), name, font=font(FONT_XB, int(78 * cam.z)), fill=(255, 255, 255), anchor="lm")
            rng = np.random.default_rng(i + 4)
            for k in range(16):
                hx = sx0 + W_ * (0.5 + k * 0.026)
                hh = H_ * 0.045 * (0.3 + rng.random()) * (0.8 + 0.2 * math.sin(t * 7 + k))
                aa.d.rounded_rectangle(aa.pts([(hx, yy + H_ * 0.065 - hh), (hx + W_ * 0.012, yy + H_ * 0.065 + hh)]), radius=6, fill=col)
    else:
        u = smooth((t - st["bars_at"]) / 0.9)
        base = sy0 + H_ * 0.82
        for k, (lab, val, col) in enumerate((("OTHER LISTENERS", 0.55, (150, 160, 176)), ("YOU", 0.88, (255, 140, 40)))):
            cx = sx0 + W_ * (0.3 + 0.4 * k)
            hh = H_ * 0.62 * val * u
            aa.d.rounded_rectangle(aa.pts([(cx - W_ * 0.12, base - hh), (cx + W_ * 0.12, base)]), radius=16, fill=col)
            aa.d.text(aa.T(cx, base + H_ * 0.08), lab, font=font(FONT_XB, int(66 * cam.z)), fill=(255, 255, 255), anchor="mm")
        aa.d.text(aa.T((sx0 + sx1) / 2, sy0 + H_ * 0.1), "HOW ATTRACTIVE IS THIS VOICE?", font=font(FONT_XB, int(66 * cam.z)), fill=(255, 255, 255), anchor="mm")
        if st.get("medal_at") is not None and t >= st["medal_at"]:
            m = back((t - st["medal_at"]) / 0.35)
            cx, cy = sx0 + W_ * 0.7, base - H_ * 0.62 * 0.88 - H_ * 0.12
            r = 52 * m * cam.z * 2
            X, Y = aa.T(cx, cy)
            aa.d.ellipse([X - r, Y - r, X + r, Y + r], fill=(255, 210, 63), outline=INK, width=10)
            aa.d.text((X, Y), "1", font=font(FONT_XB, int(60 * m * cam.z * 2)), fill=INK, anchor="mm")
    aa.done(frame)


def thought_mini_hero(frame, x, y, t, at, until, pose_fn, scale=0.9):
    """A small version of the hero inside a thought bubble (e.g. imagining a confident self)."""
    if t < at or t > until:
        return
    p = dict(pose_fn())
    p["scarf"] = 6 * math.sin(t * 3)
    img, (ox, oy) = C.render(p, scale)
    u = clip01((t - at) / 0.3)
    img.putalpha(img.getchannel("A").point(lambda v: int(v * u)))
    paste(frame, img, x + ox, y + oy)


def burst(frame, x, y, t, at, color=(255, 255, 255)):
    if t < at or t > at + 0.5:
        return
    u = (t - at) / 0.5
    aa = AA((x - 260, y - 260, x + 260, y + 260))
    for k in range(10):
        a = 2 * math.pi * k / 10
        r0, r1 = 60 + 160 * u, 100 + 180 * u
        aa.d.line(aa.pts([(x + math.cos(a) * r0, y + math.sin(a) * r0), (x + math.cos(a) * r1, y + math.sin(a) * r1)]),
                  fill=color + (int(255 * (1 - u)),), width=14)
    aa.done(frame)


def magnifier(frame, x, y, r=110):
    aa = AA((x - r - 40, y - r - 40, x + r * 2.2, y + r * 2.2))
    aa.d.ellipse(aa.pts([(x - r, y - r), (x + r, y + r)]), fill=(230, 244, 255, 90), outline=INK, width=22)
    aa.d.line(aa.pts([(x + r * 0.72, y + r * 0.72), (x + r * 1.7, y + r * 1.7)]), fill=INK, width=40)
    aa.done(frame)
