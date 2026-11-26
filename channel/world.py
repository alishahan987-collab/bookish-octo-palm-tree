"""
Vertical (9:16) environments, camera and motion-graphics props for the channel.
Backgrounds are painted at 1.5x the output resolution so camera zooms stay sharp.
All coordinates are in "world" pixels of a 1080x1920 frame (wider worlds allow pans).
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_W, OUT_H = 1080, 1920
BGQ = 1.5                    # background resolution multiplier
FONTS = {}
import os
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_XB = os.path.join(HERE, "fonts", "Poppins-ExtraBold.ttf")
FONT_B = os.path.join(HERE, "fonts", "Poppins-Bold.ttf")
FONT_HAND = os.path.join(HERE, "fonts", "Kalam-Bold.ttf")


def font(path, size):
    k = (path, int(size))
    if k not in FONTS:
        FONTS[k] = ImageFont.truetype(path, int(size))
    return FONTS[k]


def clip01(x):
    return max(0.0, min(1.0, x))


def smooth(u):
    u = clip01(u)
    return u * u * (3 - 2 * u)


def back(u):
    u = clip01(u)
    s = 1.7
    u -= 1
    return u * u * ((s + 1) * u + s) + 1


# ----------------------------------------------------------------------------- painting backgrounds
class Painter:
    def __init__(self, ww, wh, color=(255, 255, 255)):
        self.k = BGQ * 2
        self.ww, self.wh = ww, wh
        self.img = Image.new("RGB", (int(ww * self.k), int(wh * self.k)), color)
        self.d = ImageDraw.Draw(self.img)

    def S(self, pts):
        return [(x * self.k, y * self.k) for x, y in pts]

    def rect(self, x0, y0, x1, y1, fill, outline=None, w=3, r=0):
        box = [x0 * self.k, y0 * self.k, x1 * self.k, y1 * self.k]
        kw = dict(fill=fill, outline=outline, width=int(w * self.k) if outline else 0)
        if r:
            self.d.rounded_rectangle(box, radius=r * self.k, **kw)
        else:
            self.d.rectangle(box, **kw)

    def poly(self, pts, fill, outline=None, w=3):
        self.d.polygon(self.S(pts), fill=fill, outline=outline, width=int(w * self.k) if outline else 0)

    def line(self, pts, col, w=3):
        self.d.line(self.S(pts), fill=col, width=max(1, int(w * self.k)), joint="curve")

    def ell(self, x0, y0, x1, y1, fill, outline=None, w=3):
        self.d.ellipse([x0 * self.k, y0 * self.k, x1 * self.k, y1 * self.k], fill=fill, outline=outline, width=int(w * self.k) if outline else 0)

    def vgrad(self, x0, y0, x1, y1, c0, c1):
        h = max(1, int((y1 - y0) * self.k))
        t = np.linspace(0, 1, h)[:, None]
        col = (np.array(c0)[None, :] * (1 - t) + np.array(c1)[None, :] * t).astype(np.uint8)
        strip = np.repeat(col[:, None, :], max(1, int((x1 - x0) * self.k)), axis=1)
        self.img.paste(Image.fromarray(strip, "RGB"), (int(x0 * self.k), int(y0 * self.k)))
        self.d = ImageDraw.Draw(self.img)

    def glow(self, cx, cy, rx, ry, color, alpha=90):
        """Soft radial light (blurred ellipse)."""
        k = self.k
        pad = int(max(rx, ry) * k * 0.6)
        w, h = int(rx * 2 * k) + 2 * pad, int(ry * 2 * k) + 2 * pad
        small = Image.new("L", (max(1, w // 8), max(1, h // 8)), 0)
        ImageDraw.Draw(small).ellipse([pad // 8, pad // 8, (w - pad) // 8, (h - pad) // 8], fill=alpha)
        mask = small.filter(ImageFilter.GaussianBlur(max(1, pad // 16))).resize((w, h), Image.BILINEAR)
        layer = Image.new("RGB", (w, h), color)
        self.img.paste(layer, (int((cx - rx) * k) - pad, int((cy - ry) * k) - pad), mask)
        self.d = ImageDraw.Draw(self.img)

    def overlay(self, fn):
        layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        fn(ImageDraw.Draw(layer), self.k)
        self.img = Image.alpha_composite(self.img.convert("RGBA"), layer).convert("RGB")
        self.d = ImageDraw.Draw(self.img)

    def text(self, x, y, s, path, size, col, anchor="mm"):
        self.d.text((x * self.k, y * self.k), s, font=font(path, size * self.k), fill=col, anchor=anchor)

    def done(self):
        return self.img.resize((int(self.ww * BGQ), int(self.wh * BGQ)), Image.LANCZOS)


FLOOR = 1300


def _buildings(p, x0, x1, base, hmin, hmax, colors, seed, windows=None):
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        w = int(rng.integers(70, 160))
        h = int(rng.integers(hmin, hmax))
        col = colors[int(rng.integers(0, len(colors)))]
        p.rect(x, base - h, x + w, base, col)
        if windows:
            for yy in range(base - h + 24, base - 16, 34):
                for xx in range(x + 14, x + w - 18, 26):
                    if rng.random() < 0.7:
                        p.rect(xx, yy, xx + 12, yy + 16, windows)
        x += w + int(rng.integers(4, 20))


def env_void():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (252, 246, 236), (243, 228, 206))
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (236, 220, 196), (226, 206, 178))
    p.glow(540, 880, 420, 520, (255, 252, 244), 140)
    p.line([(0, FLOOR), (OUT_W, FLOOR)], (214, 192, 160), 3)
    for i, y in enumerate(range(FLOOR + 60, OUT_H, 90)):
        p.line([(0, y), (OUT_W, y)], (230, 212, 186), 2)
    return p.done()


def env_apartment():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (226, 234, 240), (208, 220, 230))
    # window with city
    p.rect(110, 360, 560, 960, (250, 250, 248), (150, 160, 172), 4, r=8)
    p.vgrad(134, 384, 536, 936, (150, 200, 236), (214, 236, 248))
    _buildings(p, 136, 534, 936, 120, 330, [(176, 194, 214), (160, 180, 204), (190, 206, 222)], 4, windows=(232, 240, 248))
    p.rect(326, 384, 344, 936, (250, 250, 248))
    p.rect(134, 650, 536, 666, (250, 250, 248))
    p.poly([(96, 330), (200, 330), (180, 1000), (80, 1000)], (240, 150, 80), (200, 110, 50), 3)
    p.poly([(470, 330), (574, 330), (590, 1000), (490, 1000)], (240, 150, 80), (200, 110, 50), 3)
    # shelf + books, poster, clock
    p.rect(660, 520, 1010, 540, (186, 150, 116), (150, 116, 86), 3)
    rng = np.random.default_rng(3)
    x = 676
    for i in range(9):
        w = int(rng.integers(22, 36))
        h = int(rng.integers(70, 110))
        p.rect(x, 520 - h, x + w, 520, [(96, 140, 200), (230, 120, 90), (240, 200, 90), (120, 180, 140), (170, 120, 190)][i % 5], (60, 60, 70), 2)
        x += w + 4
    p.rect(700, 600, 960, 820, (250, 248, 240), (150, 160, 172), 4, r=6)
    p.ell(760, 640, 900, 780, (250, 200, 120))
    p.ell(860, 160, 990, 290, (250, 250, 248), (120, 126, 136), 5)
    p.line([(925, 225), (925, 180)], (60, 60, 70), 5)
    p.line([(925, 225), (958, 236)], (60, 60, 70), 5)
    # desk + lamp + plant
    p.rect(640, 1040, 1060, 1070, (196, 158, 120), (140, 108, 78), 3)
    p.rect(660, 1070, 690, FLOOR, (150, 116, 86))
    p.rect(1010, 1070, 1040, FLOOR, (150, 116, 86))
    p.line([(990, 1040), (990, 930), (930, 880)], (70, 74, 84), 8)
    p.poly([(890, 860), (970, 860), (950, 900), (910, 900)], (60, 66, 78))
    p.rect(700, 990, 780, 1040, (220, 120, 90), (160, 80, 60), 3, r=8)
    for dx, dy in ((-20, -40), (10, -60), (30, -36), (-6, -74)):
        p.ell(740 + dx - 22, 990 + dy - 30, 740 + dx + 22, 990 + dy + 30, (110, 176, 110), (70, 130, 80), 3)
    # floor
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (200, 164, 126), (176, 140, 104))
    for y in range(FLOOR + 70, OUT_H, 110):
        p.line([(0, y), (OUT_W, y)], (178, 142, 108), 3)
    p.rect(0, FLOOR - 16, OUT_W, FLOOR, (240, 242, 244))

    def beam(d, k):
        d.polygon([(134 * k, 384 * k), (536 * k, 384 * k), (1000 * k, FLOOR * k + 400 * k), (300 * k, FLOOR * k + 400 * k)], fill=(255, 250, 220, 30))
    p.overlay(beam)
    return p.done()


def env_science():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, OUT_H, (16, 28, 48), (26, 44, 70))
    for x in range(0, OUT_W, 60):
        p.line([(x, 0), (x, OUT_H)], (30, 46, 72), 1)
    for y in range(0, OUT_H, 60):
        p.line([(0, y), (OUT_W, y)], (30, 46, 72), 1)
    p.glow(540, 900, 520, 620, (40, 70, 110), 120)
    return p.done()


def env_booth():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (64, 72, 92), (48, 54, 72))
    for row, y in enumerate(range(120, FLOOR - 80, 130)):
        for col, x in enumerate(range(40 + (row % 2) * 60, OUT_W - 60, 120)):
            p.rect(x, y, x + 104, y + 110, (78, 88, 112), (40, 46, 62), 3, r=10)
            for k in range(3):
                p.line([(x + 18 + k * 30, y + 14), (x + 18 + k * 30, y + 96)], (66, 76, 98), 6)
    p.glow(540, 760, 420, 560, (255, 214, 150), 70)
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (52, 54, 62), (40, 42, 50))
    p.line([(0, FLOOR), (OUT_W, FLOOR)], (30, 32, 38), 4)
    return p.done()


def env_park():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, 1000, (150, 208, 240), (222, 240, 246))
    p.ell(760, 160, 940, 340, (255, 238, 170))
    p.glow(850, 250, 200, 200, (255, 246, 200), 80)
    for i, (cx, w) in enumerate(((180, 300), (520, 360), (880, 320))):
        p.ell(cx - w, 860, cx + w, 1240, (168, 212, 150) if i % 2 else (150, 200, 136))
    p.vgrad(0, 1000, OUT_W, OUT_H, (130, 190, 110), (104, 164, 90))
    p.poly([(470, 1000), (610, 1000), (900, OUT_H), (180, OUT_H)], (228, 214, 180))
    for cx, base in ((120, 1060), (960, 1040)):
        p.rect(cx - 18, base - 200, cx + 18, base + 60, (130, 96, 70), (96, 70, 50), 3)
        for dx, dy, r in ((0, -300, 130), (-80, -230, 100), (80, -240, 100)):
            p.ell(cx + dx - r, base + dy - r, cx + dx + r, base + dy + r, (96, 164, 96), (70, 130, 76), 3)
    p.rect(700, 1150, 1000, 1180, (170, 120, 80), (120, 84, 56), 3, r=6)
    p.rect(700, 1100, 1000, 1124, (170, 120, 80), (120, 84, 56), 3, r=6)
    for x in (720, 980):
        p.rect(x - 8, 1180, x + 8, 1250, (90, 90, 96))
    return p.done()


def env_lab1966():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (196, 224, 206), (176, 208, 190))
    p.rect(0, 0, OUT_W, 90, (166, 196, 178))
    for x in (130, 950):
        p.ell(x - 60, 20, x + 60, 70, (255, 252, 230))
    p.rect(80, 300, 420, 760, (232, 236, 230), (120, 140, 128), 4, r=6)
    for y in range(330, 740, 36):
        p.rect(100, y, 400, y + 22, (214, 222, 214))
    p.ell(760, 220, 920, 380, (250, 250, 244), (110, 120, 112), 5)
    p.line([(840, 300), (840, 250)], (60, 60, 64), 5)
    p.line([(840, 300), (880, 320)], (60, 60, 64), 5)
    p.rect(820, 480, 1000, 940, (150, 160, 150), (100, 110, 100), 3, r=6)
    for y in (520, 660, 800):
        p.rect(840, y, 980, y + 110, (170, 180, 170), (100, 110, 100), 3, r=4)
        p.rect(890, y + 46, 930, y + 58, (220, 220, 210))
    p.rect(60, 1000, 1020, 1036, (170, 120, 80), (120, 84, 56), 3)
    p.rect(90, 1036, 120, FLOOR, (130, 90, 60))
    p.rect(960, 1036, 990, FLOOR, (130, 90, 60))
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (150, 144, 128), (128, 122, 108))
    for x in range(-200, OUT_W + 200, 120):
        p.line([(x, FLOOR), (x - 160, OUT_H)], (140, 134, 118), 2)
    p.line([(0, FLOOR), (OUT_W, FLOOR)], (110, 104, 92), 4)
    return p.done()


def env_bathroom():
    p = Painter(OUT_W, OUT_H)
    p.rect(0, 0, OUT_W, FLOOR, (214, 236, 236))
    for y in range(0, FLOOR, 90):
        p.line([(0, y), (OUT_W, y)], (190, 218, 220), 3)
    for x in range(0, OUT_W, 90):
        p.line([(x, 0), (x, FLOOR)], (190, 218, 220), 3)
    p.rect(470, 260, 1010, 1060, (200, 206, 212), (110, 120, 130), 6, r=24)
    p.vgrad(490, 280, 990, 1040, (232, 242, 246), (206, 222, 230))

    def shine(d, k):
        d.polygon([(560 * k, 280 * k), (650 * k, 280 * k), (500 * k, 600 * k), (490 * k, 520 * k)], fill=(255, 255, 255, 70))
        d.polygon([(900 * k, 700 * k), (990 * k, 560 * k), (990 * k, 640 * k), (940 * k, 720 * k)], fill=(255, 255, 255, 50))
    p.overlay(shine)
    p.rect(440, 1080, 1040, 1130, (240, 240, 236), (150, 156, 160), 3, r=12)
    p.rect(470, 1130, 1010, FLOOR, (226, 228, 224), (150, 156, 160), 3)
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (196, 200, 204), (176, 180, 186))
    for x in range(0, OUT_W, 120):
        p.line([(x, FLOOR), (x, OUT_H)], (186, 190, 194), 2)
    return p.done()


MIRROR = (490, 280, 990, 1040)


def env_lab2013():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (242, 246, 248), (226, 234, 240))
    p.rect(140, 180, 940, 640, (36, 44, 58), (20, 24, 32), 6, r=18)
    p.rect(166, 206, 914, 614, (44, 56, 74))
    p.rect(80, 1010, 1000, 1040, (220, 226, 232), (150, 160, 170), 3, r=8)
    p.rect(110, 1040, 140, FLOOR, (150, 160, 170))
    p.rect(940, 1040, 970, FLOOR, (150, 160, 170))
    p.rect(640, 880, 900, 1010, (60, 66, 78), (30, 34, 42), 4, r=10)
    p.rect(658, 896, 882, 996, (80, 180, 200))
    p.rect(860, 940, 980, 1010, (110, 176, 110), (70, 130, 80), 3, r=10)
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (214, 220, 226), (196, 204, 212))
    p.line([(0, FLOOR), (OUT_W, FLOOR)], (170, 178, 186), 4)
    return p.done()


SCREEN_2013 = (166, 206, 914, 614)


def env_radio():
    p = Painter(OUT_W, OUT_H)
    p.vgrad(0, 0, OUT_W, FLOOR, (46, 52, 72), (36, 40, 58))
    for row, y in enumerate(range(380, FLOOR - 120, 120)):
        for x in range(30 + (row % 2) * 50, OUT_W - 40, 100):
            p.rect(x, y, x + 86, y + 100, (58, 66, 90), (30, 34, 48), 3, r=8)
    p.rect(330, 120, 750, 290, (60, 30, 30), (30, 20, 20), 5, r=20)
    p.glow(540, 780, 460, 500, (255, 190, 120), 60)
    p.rect(60, 1020, 1020, 1100, (70, 74, 90), (30, 32, 42), 4, r=10)
    for i in range(14):
        x = 110 + i * 62
        p.rect(x, 1040, x + 12, 1084, (30, 32, 40))
        p.rect(x - 8, 1050 + (i * 7) % 26, x + 20, 1060 + (i * 7) % 26, (240, 170, 80))
    p.vgrad(0, FLOOR, OUT_W, OUT_H, (40, 42, 52), (30, 32, 40))
    p.line([(0, FLOOR), (OUT_W, FLOOR)], (24, 26, 32), 4)
    return p.done()


ON_AIR = (330, 120, 750, 290)
STREET_W = 2600


def env_street():
    p = Painter(STREET_W, OUT_H)
    p.vgrad(0, 0, STREET_W, 1150, (255, 170, 110), (250, 214, 160))
    p.vgrad(0, 0, STREET_W, 520, (120, 96, 170), (238, 140, 120))
    p.ell(1700, 640, 2000, 940, (255, 228, 150))
    p.glow(1850, 790, 360, 360, (255, 220, 150), 90)
    _buildings(p, -40, STREET_W, 1150, 260, 640, [(176, 120, 150), (190, 130, 150), (160, 110, 140)], 7, windows=(255, 214, 150))
    _buildings(p, -60, STREET_W, 1220, 200, 460, [(98, 70, 104), (110, 78, 112), (86, 62, 96)], 9, windows=(255, 200, 120))
    p.rect(0, 1220, STREET_W, FLOOR, (150, 120, 130))
    p.vgrad(0, FLOOR, STREET_W, OUT_H, (110, 90, 108), (80, 64, 84))
    p.line([(0, FLOOR), (STREET_W, FLOOR)], (70, 56, 74), 4)
    for x in range(0, STREET_W, 180):
        p.line([(x, 1820), (x + 90, 1820)], (236, 210, 170), 6)
    for x in range(200, STREET_W, 520):
        p.rect(x - 6, 860, x + 6, FLOOR, (60, 50, 64))
        p.line([(x, 870), (x + 46, 860)], (60, 50, 64), 8)
        p.ell(x + 30, 854, x + 70, 884, (255, 236, 180))
        p.glow(x + 50, 900, 120, 140, (255, 220, 150), 60)
    return p.done()


ENV_BUILDERS = dict(void=env_void, apartment=env_apartment, science=env_science, booth=env_booth, park=env_park,
                    lab1966=env_lab1966, bathroom=env_bathroom, lab2013=env_lab2013, radio=env_radio, street=env_street)
_env_cache = {}


def environment(name):
    if name not in _env_cache:
        _env_cache[name] = ENV_BUILDERS[name]().convert("RGB")
    return _env_cache[name]


# ----------------------------------------------------------------------------- camera
class Cam:
    def __init__(self, cx=540.0, cy=960.0, z=1.0):
        self.cx, self.cy, self.z = cx, cy, z

    def S(self, x, y):
        return ((x - self.cx) * self.z + OUT_W / 2, (y - self.cy) * self.z + OUT_H / 2)

    def fit(self, ww, wh):
        """Keep the view inside a ww x wh world (never show past the painted edges)."""
        self.z = max(self.z, OUT_W / ww, OUT_H / wh)
        hw, hh = OUT_W / 2 / self.z, OUT_H / 2 / self.z
        self.cx = min(max(self.cx, hw), ww - hw)
        self.cy = min(max(self.cy, hh), wh - hh)
        return self

    def view(self, env_img):
        hw, hh = OUT_W / 2 / self.z, OUT_H / 2 / self.z
        box = ((self.cx - hw) * BGQ, (self.cy - hh) * BGQ, (self.cx + hw) * BGQ, (self.cy + hh) * BGQ)
        return env_img.resize((OUT_W, OUT_H), Image.BILINEAR, box=box)


def cam_at(keys, t):
    """keys = [(t, cx, cy, z)] with smooth easing between them."""
    if t <= keys[0][0]:
        return Cam(*keys[0][1:])
    for (t0, *a), (t1, *b) in zip(keys[:-1], keys[1:]):
        if t0 <= t <= t1:
            u = smooth((t - t0) / max(1e-6, t1 - t0))
            return Cam(*[x + (y - x) * u for x, y in zip(a, b)])
    return Cam(*keys[-1][1:])


# ----------------------------------------------------------------------------- frame drawing helpers
def paste(frame, img, x, y):
    x, y = int(round(x)), int(round(y))
    cx0, cy0 = max(0, -x), max(0, -y)
    cx1, cy1 = min(img.width, frame.width - x), min(img.height, frame.height - y)
    if cx1 <= cx0 or cy1 <= cy0:
        return
    if (cx0, cy0, cx1, cy1) != (0, 0, img.width, img.height):
        img = img.crop((cx0, cy0, cx1, cy1))
    frame.alpha_composite(img, (x + cx0, y + cy0))


class AA:
    """Supersampled drawing layer for a screen-space box; coordinates are screen pixels."""

    def __init__(self, box):
        x0, y0, x1, y1 = [int(v) for v in box]
        self.x0, self.y0 = max(-4000, x0), max(-4000, y0)
        self.w, self.h = max(2, x1 - x0), max(2, y1 - y0)
        self.img = Image.new("RGBA", (self.w * 2, self.h * 2), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def T(self, x, y):
        return ((x - self.x0) * 2, (y - self.y0) * 2)

    def pts(self, pts):
        return [self.T(*q) for q in pts]

    def done(self, frame, alpha=1.0):
        out = self.img.resize((self.w, self.h), Image.LANCZOS)
        if alpha < 0.999:
            out.putalpha(out.getchannel("A").point(lambda v: int(v * alpha)))
        paste(frame, out, self.x0, self.y0)


def text_img(text, path, size, fill, stroke=0, stroke_fill=(0, 0, 0), pad=10):
    f = font(path, size * 2)
    bb = f.getbbox(text, stroke_width=stroke * 2)
    w, h = bb[2] - bb[0] + pad * 4, bb[3] - bb[1] + pad * 4
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((pad * 2 - bb[0], pad * 2 - bb[1]), text, font=f, fill=fill, stroke_width=stroke * 2, stroke_fill=stroke_fill)
    return img.resize((w // 2, h // 2), Image.LANCZOS)


_labels = {}


def label_img(text, style="dark", size=54):
    k = (text, style, size)
    if k in _labels:
        return _labels[k]
    styles = {"dark": ((24, 24, 28), (255, 255, 255)), "orange": ((244, 126, 36), (255, 255, 255)),
              "light": ((255, 255, 255), (24, 24, 28)), "blue": ((52, 132, 232), (255, 255, 255)),
              "red": ((226, 64, 56), (255, 255, 255)), "green": ((44, 170, 100), (255, 255, 255)),
              "yellow": ((255, 210, 63), (24, 24, 28))}
    bg, fg = styles[style]
    f = font(FONT_XB, size * 2)
    tw = f.getlength(text)
    h = int(size * 2 * 1.55)
    img = Image.new("RGBA", (int(tw + size * 2 * 1.1), h + 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([4, 10, img.width - 4, h + 6], radius=h // 2, fill=(0, 0, 0, 60))
    d.rounded_rectangle([0, 0, img.width - 8, h - 4], radius=h // 2, fill=bg)
    d.text(((img.width - 8) / 2, (h - 4) / 2 + size * 0.06), text, font=f, fill=fg, anchor="mm")
    out = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    _labels[k] = out
    return out


def draw_label(frame, text, x, y, t, at, until=None, style="dark", size=54, rot=0):
    if t < at or (until is not None and t > until + 0.2):
        return
    u = back((t - at) / 0.32)
    a = 1.0 if until is None else clip01((until + 0.2 - t) / 0.2)
    img = label_img(text, style, size)
    s = max(0.05, u)
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
    if rot:
        im = im.rotate(rot * (1 - smooth((t - at) / 0.3)) + rot * 0.15, expand=True, resample=Image.BICUBIC)
    if a < 1:
        im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
    paste(frame, im, x - im.width / 2, y - im.height / 2)


# ----------------------------------------------------------------------------- motion-graphics props
INK = (22, 22, 26)
BLUE = (64, 156, 255)
ORANGE = (255, 140, 40)
PURPLE = (170, 110, 255)


def sound_arcs(frame, cam, x, y, t, direction=0.0, color=BLUE, n=3, speed=1.0, size=1.0, alpha=1.0, spread=50):
    """Concentric arcs moving outward from (x, y) world, pointing at `direction` degrees (0 = right)."""
    sx, sy = cam.S(x, y)
    R = 170 * size * cam.z
    aa = AA((sx - R - 20, sy - R - 20, sx + R + 20, sy + R + 20))
    for i in range(n):
        ph = (t * speed + i / n) % 1
        r = (25 + ph * 140) * size * cam.z
        a = int(255 * alpha * (1 - ph) ** 0.8)
        X, Y = aa.T(sx, sy)
        aa.d.arc([X - 2 * r, Y - 2 * r, X + 2 * r, Y + 2 * r], direction - spread, direction + spread, fill=color + (a,), width=int(12 * cam.z * size))
    aa.done(frame)


def waveform(frame, box, t, thick=1.0, color=BLUE, progress=None, seed=1, bars=36, bg=None):
    x0, y0, x1, y1 = box
    aa = AA((x0 - 6, y0 - 6, x1 + 6, y1 + 6))
    if bg:
        aa.d.rounded_rectangle(aa.pts([(x0, y0), (x1, y1)]), radius=(y1 - y0), fill=bg)
    rng = np.random.default_rng(seed)
    base = rng.uniform(0.25, 1.0, bars)
    cy = (y0 + y1) / 2
    bw = (x1 - x0 - 40) / bars
    for i in range(bars):
        live = 0.75 + 0.25 * math.sin(t * 9 + i * 0.7)
        h = (y1 - y0) * 0.42 * base[i] * live * (0.35 + 0.65 * thick)
        x = x0 + 20 + i * bw + bw / 2
        col = color if progress is None or i / bars <= progress else (200, 206, 214)
        w = max(2, bw * (0.25 + 0.45 * thick))
        aa.d.rounded_rectangle(aa.pts([(x - w / 2, cy - h), (x + w / 2, cy + h)]), radius=w, fill=col)
    aa.done(frame)


def freq_bars(frame, box, values, labels=("LOW", "HIGH"), color=ORANGE, t=0.0):
    x0, y0, x1, y1 = box
    aa = AA((x0 - 10, y0 - 10, x1 + 10, y1 + 60))
    n = len(values)
    bw = (x1 - x0) / n
    for i, v in enumerate(values):
        h = (y1 - y0) * clip01(v)
        aa.d.rounded_rectangle(aa.pts([(x0 + i * bw + 8, y1 - h), (x0 + (i + 1) * bw - 8, y1)]), radius=10, fill=color)
    aa.d.line(aa.pts([(x0, y1 + 4), (x1, y1 + 4)]), fill=(255, 255, 255, 200), width=6)
    f = font(FONT_XB, 84)
    aa.d.text(aa.T(x0 + 6, y1 + 34), labels[0], font=f, fill=(255, 255, 255, 230), anchor="lm")
    aa.d.text(aa.T(x1 - 6, y1 + 34), labels[1], font=f, fill=(255, 255, 255, 230), anchor="rm")
    aa.done(frame)


def mark(frame, kind, x, y, t, at, size=90):
    if t < at:
        return
    u = back((t - at) / 0.3)
    r = size * u
    aa = AA((x - size - 20, y - size - 20, x + size + 20, y + size + 20))
    if kind == "x":
        aa.d.ellipse(aa.pts([(x - r, y - r), (x + r, y + r)]), fill=(226, 64, 56))
        for a, b in (((-0.45, -0.45), (0.45, 0.45)), ((0.45, -0.45), (-0.45, 0.45))):
            aa.d.line(aa.pts([(x + a[0] * r, y + a[1] * r), (x + b[0] * r, y + b[1] * r)]), fill=(255, 255, 255), width=int(r * 0.32))
    elif kind == "check":
        aa.d.ellipse(aa.pts([(x - r, y - r), (x + r, y + r)]), fill=(44, 170, 100))
        aa.d.line(aa.pts([(x - 0.45 * r, y), (x - 0.12 * r, y + 0.34 * r), (x + 0.5 * r, y - 0.38 * r)]), fill=(255, 255, 255), width=int(r * 0.3), joint="curve")
    elif kind == "heart":
        pts = []
        for k in range(60):
            a = 2 * math.pi * k / 60
            hx = 16 * math.sin(a) ** 3
            hy = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
            pts.append((x + hx * r / 17, y + hy * r / 17))
        aa.d.polygon(aa.pts(pts), fill=(244, 80, 96))
    elif kind == "?":
        f = font(FONT_XB, int(r * 2.6))
        aa.d.text(aa.T(x, y), "?", font=f, fill=(255, 210, 63), anchor="mm", stroke_width=10, stroke_fill=INK)
    elif kind == "!":
        f = font(FONT_XB, int(r * 2.6))
        aa.d.text(aa.T(x, y), "!", font=f, fill=(255, 210, 63), anchor="mm", stroke_width=10, stroke_fill=INK)
    aa.done(frame)


def bubble(frame, x, y, w, h, t, at, until=None, tail=None, think=False, text=None, content=None, size=46):
    """Speech/thought bubble in screen space centred at (x, y). content(aa, box) draws inside."""
    if t < at or (until is not None and t > until + 0.2):
        return
    u = back((t - at) / 0.3)
    a = 1.0 if until is None else clip01((until + 0.2 - t) / 0.2)
    ww, hh = w * u, h * u
    pad = 80
    aa = AA((x - w / 2 - pad, y - h / 2 - pad, x + w / 2 + pad, y + h / 2 + pad + 200))
    if tail:
        tx, ty = tail
        if think:
            for k, rr in enumerate((18, 12, 8)):
                cx = x + (tx - x) * (0.55 + 0.17 * k)
                cy = y + h / 2 + (ty - y - h / 2) * (0.35 + 0.25 * k)
                aa.d.ellipse(aa.pts([(cx - rr * u, cy - rr * u), (cx + rr * u, cy + rr * u)]), fill=(255, 255, 255), outline=INK, width=6)
        else:
            bx = x + (tx - x) * 0.25
            aa.d.polygon(aa.pts([(bx - 22, y + hh / 2 - 6), (bx + 22, y + hh / 2 - 6), (tx, ty)]), fill=(255, 255, 255), outline=INK, width=6)
    aa.d.rounded_rectangle(aa.pts([(x - ww / 2, y - hh / 2), (x + ww / 2, y + hh / 2)]), radius=min(ww, hh) * (0.5 if think else 0.3), fill=(255, 255, 255), outline=INK, width=7)
    if u > 0.85:
        if text:
            f = font(FONT_B, size * 2)
            aa.d.multiline_text(aa.T(x, y), text, font=f, fill=INK, anchor="mm", align="center", spacing=6)
        if content:
            content(aa, (x - ww / 2, y - hh / 2, x + ww / 2, y + hh / 2))
    aa.done(frame, a)


def phone_ui(frame, x, y, t, state, s=1.0, rec_time=0.0, play=0.0, contact="Sam"):
    """Big phone motion graphic in screen space. state: 'record' | 'sent' | 'play'."""
    w, h = 470 * s, 860 * s
    aa = AA((x - w / 2 - 30, y - h / 2 - 30, x + w / 2 + 30, y + h / 2 + 30))
    aa.d.rounded_rectangle(aa.pts([(x - w / 2 + 10, y - h / 2 + 16), (x + w / 2 + 10, y + h / 2 + 16)]), radius=70 * s, fill=(0, 0, 0, 60))
    aa.d.rounded_rectangle(aa.pts([(x - w / 2, y - h / 2), (x + w / 2, y + h / 2)]), radius=70 * s, fill=(30, 32, 40))
    sx0, sy0, sx1, sy1 = x - w / 2 + 20 * s, y - h / 2 + 22 * s, x + w / 2 - 20 * s, y + h / 2 - 22 * s
    aa.d.rounded_rectangle(aa.pts([(sx0, sy0), (sx1, sy1)]), radius=54 * s, fill=(244, 246, 250))
    aa.d.rounded_rectangle(aa.pts([(x - 60 * s, sy0 + 14 * s), (x + 60 * s, sy0 + 40 * s)]), radius=14 * s, fill=(30, 32, 40))
    aa.d.rectangle(aa.pts([(sx0, sy0 + 60 * s), (sx1, sy0 + 150 * s)]), fill=(255, 255, 255))
    aa.d.ellipse(aa.pts([(sx0 + 30 * s, sy0 + 76 * s), (sx0 + 90 * s, sy0 + 136 * s)]), fill=(255, 196, 120))
    aa.d.text(aa.T(sx0 + 110 * s, sy0 + 106 * s), contact, font=font(FONT_B, 64 * s), fill=INK, anchor="lm")
    f = font(FONT_B, 40 * s)
    if state in ("sent", "play"):
        bx0, by0, bx1, by1 = sx0 + 60 * s, sy0 + 330 * s, sx1 - 24 * s, sy0 + 450 * s
        aa.d.rounded_rectangle(aa.pts([(bx0, by0), (bx1, by1)]), radius=46 * s, fill=(244, 126, 36))
        cx, cy = bx0 + 60 * s, (by0 + by1) / 2
        if state == "play" and play > 0:
            aa.d.rectangle(aa.pts([(cx - 14 * s, cy - 22 * s), (cx - 4 * s, cy + 22 * s)]), fill=(255, 255, 255))
            aa.d.rectangle(aa.pts([(cx + 4 * s, cy - 22 * s), (cx + 14 * s, cy + 22 * s)]), fill=(255, 255, 255))
        else:
            aa.d.polygon(aa.pts([(cx - 14 * s, cy - 24 * s), (cx - 14 * s, cy + 24 * s), (cx + 22 * s, cy)]), fill=(255, 255, 255))
        rng = np.random.default_rng(3)
        for i in range(22):
            hx = bx0 + 120 * s + i * 13 * s
            hh = (10 + 34 * rng.random()) * s
            col = (255, 255, 255) if (state != "play" or i / 22 <= play) else (255, 200, 160)
            aa.d.rounded_rectangle(aa.pts([(hx, cy - hh), (hx + 7 * s, cy + hh)]), radius=4 * s, fill=col)
        aa.d.text(aa.T(bx1 - 20 * s, by1 + 30 * s), "0:04", font=f, fill=(140, 146, 156), anchor="rm")
    if state == "record":
        rx, ry = x, sy1 - 150 * s
        pulse = 1 + 0.12 * math.sin(t * 8)
        aa.d.ellipse(aa.pts([(rx - 74 * s * pulse, ry - 74 * s * pulse), (rx + 74 * s * pulse, ry + 74 * s * pulse)]), fill=(255, 200, 196))
        aa.d.ellipse(aa.pts([(rx - 54 * s, ry - 54 * s), (rx + 54 * s, ry + 54 * s)]), fill=(232, 52, 52))
        aa.d.rounded_rectangle(aa.pts([(rx - 16 * s, ry - 32 * s), (rx + 16 * s, ry + 10 * s)]), radius=16 * s, fill=(255, 255, 255))
        aa.d.text(aa.T(rx, ry - 120 * s), f"0:0{min(9, int(rec_time))}", font=font(FONT_B, 56 * s), fill=(232, 52, 52), anchor="mm")
        rng = np.random.default_rng(int(t * 20))
        for i in range(16):
            hx = sx0 + 50 * s + i * 22 * s
            hh = (8 + 60 * rng.random()) * s
            aa.d.rounded_rectangle(aa.pts([(hx, sy0 + 420 * s - hh), (hx + 10 * s, sy0 + 420 * s + hh)]), radius=5 * s, fill=(232, 52, 52))
    aa.done(frame)
