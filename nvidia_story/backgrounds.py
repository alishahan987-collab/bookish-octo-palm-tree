"""Sharp flat-cartoon backgrounds, drawn in code (2x supersampled) instead of blurry upscaled AI images."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, Q = 1920, 1080, 2               # design size; output is Q times bigger (Q=2 -> 4K 3840x2160)
K = 2 * Q                              # drawing scale (2x supersampled)
CREAM = (252, 246, 234)
OUT = (32, 30, 34)
OW = 5 * K                            # outline width


def pastel(col, k):
    """Soften a fill colour toward warm cream (the tutorial's pastel look); outlines stay dark."""
    if col is None or tuple(col[:3]) == OUT or k <= 0:
        return col
    lum = sum(col[:3]) / 3
    rgb = [c * 0.88 + lum * 0.12 for c in col[:3]]
    rgb = tuple(int(c * (1 - k) + w * k) for c, w in zip(rgb, CREAM))
    return rgb + tuple(col[3:])


class Painter:
    def __init__(self, color, soft=0.2):
        self.k = soft
        self.img = Image.new("RGB", (W * K, H * K), pastel(color, soft))
        self.d = ImageDraw.Draw(self.img)

    def pc(self, col):
        return pastel(col, self.k)

    @staticmethod
    def s(pts):
        return [(x * K, y * K) for x, y in pts]

    def rect(self, x0, y0, x1, y1, fill, outline=True, w=OW, r=0):
        box = [x0 * K, y0 * K, x1 * K, y1 * K]
        if r:
            self.d.rounded_rectangle(box, radius=r * K, fill=self.pc(fill), outline=OUT if outline else None, width=w if outline else 0)
        else:
            self.d.rectangle(box, fill=self.pc(fill), outline=OUT if outline else None, width=w if outline else 0)

    def poly(self, pts, fill, outline=True, w=OW):
        self.d.polygon(self.s(pts), fill=self.pc(fill), outline=OUT if outline else None, width=w if outline else 0)

    def line(self, pts, col=OUT, w=OW):
        self.d.line(self.s(pts), fill=self.pc(col), width=int(w), joint="curve")

    def ell(self, x0, y0, x1, y1, fill, outline=True, w=OW):
        self.d.ellipse([x0 * K, y0 * K, x1 * K, y1 * K], fill=self.pc(fill), outline=OUT if outline else None, width=w if outline else 0)

    def grad(self, x0, y0, x1, y1, c0, c1):
        h = int((y1 - y0) * K)
        t = np.linspace(0, 1, h)[:, None]
        col = (np.array(self.pc(c0))[None, :] * (1 - t) + np.array(self.pc(c1))[None, :] * t).astype(np.uint8)
        strip = np.repeat(col[:, None, :], int((x1 - x0) * K), axis=1)
        self.img.paste(Image.fromarray(strip, "RGB"), (int(x0 * K), int(y0 * K)))
        self.d = ImageDraw.Draw(self.img)

    def overlay(self, draw_fn):
        layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        draw_fn(ImageDraw.Draw(layer))
        self.img = Image.alpha_composite(self.img.convert("RGBA"), layer).convert("RGB")
        self.d = ImageDraw.Draw(self.img)

    def text(self, x, y, txt, font_path, size, col=OUT, anchor="mm"):
        self.d.text((x * K, y * K), txt, font=ImageFont.truetype(font_path, int(size * K)), fill=self.pc(col), anchor=anchor)

    def done(self):
        return self.img.resize((W * Q, H * Q), Image.LANCZOS)


def crt(p, x, y, w=230, h=180, on=True):
    p.rect(x - w / 2, y - h, x + w / 2, y, (224, 216, 196), r=14)
    p.rect(x - w / 2 + 22, y - h + 20, x + w / 2 - 22, y - 36, (34, 54, 46) if on else (54, 58, 62), r=8)
    if on:
        for k in range(4):
            p.line([(x - w / 2 + 40, y - h + 44 + k * 22), (x - w / 2 + 40 + (110 - 22 * (k % 3)), y - h + 44 + k * 22)], (96, 222, 126), 4 * K)
    p.rect(x - 16, y - 30, x + 16, y - 18, (190, 182, 160), outline=False)


def bg_stage(font):
    p = Painter((20, 22, 34), soft=0.12)
    p.grad(0, 0, W, 800, (12, 14, 26), (42, 46, 66))
    p.rect(-10, -10, W + 10, 36, (30, 30, 36))
    for x in (260, 1660):
        p.poly([(x - 30, 30), (x + 30, 30), (x + 20, 80), (x - 20, 80)], (64, 64, 70))
        p.ell(x - 14, 70, x + 14, 90, (255, 242, 204), outline=False)
    p.rect(380, 70, 1540, 590, (16, 16, 20), w=OW)
    p.rect(400, 90, 1520, 570, (232, 236, 242), outline=False)
    p.poly([(-10, 790), (W + 10, 790), (W + 10, 960), (-10, 960)], (68, 66, 74))
    p.line([(0, 792), (W, 792)], (112, 110, 120), 4 * K)
    p.rect(-10, 960, W + 10, H + 10, (40, 38, 44))

    def beams(d):
        for x, tx in ((260, 880), (1660, 1040)):
            d.polygon([((x - 12) * K, 86 * K), ((x + 12) * K, 86 * K), ((tx + 170) * K, 880 * K), ((tx - 170) * K, 880 * K)], fill=(255, 244, 210, 22))
        d.ellipse([740 * K, 845 * K, 1180 * K, 935 * K], fill=(255, 244, 210, 46))
    p.overlay(beams)
    rng = np.random.default_rng(3)
    for x in range(-40, W + 120, 92):
        xx, hh = x + rng.uniform(-14, 14), rng.uniform(0, 20)
        p.ell(xx - 60, 1030 - hh, xx + 60, 1150, (14, 14, 18), outline=False)
        p.ell(xx - 34, 975 - hh, xx + 34, 1045 - hh, (20, 20, 24), outline=False)
    return p.done()


def bg_diner(font):
    p = Painter((240, 220, 172))
    p.grad(0, 0, W, 600, (247, 230, 186), (232, 206, 156))
    for i, x in enumerate(range(0, W, 40)):
        p.rect(x, 600, x + 40, 628, (34, 34, 38) if i % 2 else (246, 246, 240), outline=False)
    p.rect(-10, 628, W + 10, H + 10, (152, 98, 62), outline=False)
    for x in range(30, W, 70):
        p.line([(x, 640), (x, H)], (124, 78, 48), 3 * K)
    p.line([(0, 600), (W, 600)])
    p.line([(0, 628), (W, 628)])
    p.rect(360, 88, 1560, 522, (120, 78, 50))
    p.grad(384, 112, 1536, 498, (150, 196, 228), (216, 234, 242))
    for x0, w, h, col in [(400, 160, 170, (172, 182, 198)), (560, 120, 120, (188, 196, 208)), (700, 190, 214, (160, 170, 190)),
                          (900, 150, 150, (180, 188, 202)), (1060, 210, 236, (152, 164, 184)), (1290, 130, 160, (174, 182, 198)),
                          (1410, 126, 118, (188, 194, 206))]:
        p.rect(x0, 498 - h, x0 + w, 498, col, outline=False)
        for yy in range(int(498 - h + 22), 486, 34):
            for xx in range(x0 + 16, x0 + w - 20, 34):
                p.rect(xx, yy, xx + 14, yy + 16, (226, 232, 240), outline=False)
    p.line([(1340, 498), (1330, 400), (1346, 300)], (120, 86, 56), 12 * K)
    for dx, dy in ((-90, 30), (80, 26), (-60, -24), (64, -30), (0, -40)):
        p.poly([(1346, 300), (1346 + dx, 300 + dy), (1346 + dx * 0.5, 300 + dy * 0.2 - 18)], (76, 140, 84), w=3 * K)
    for x in (760, 1150):
        p.rect(x - 10, 112, x + 10, 498, (120, 78, 50), outline=False)
    p.line([(384, 498), (1536, 498)])

    def glare(d):
        for x in (520, 1000, 1290):
            d.polygon([(x * K, 112 * K), ((x + 60) * K, 112 * K), ((x - 120) * K, 498 * K), ((x - 180) * K, 498 * K)], fill=(255, 255, 255, 40))
    p.overlay(glare)
    p.rect(110, 520, 1810, 930, (186, 52, 48), r=60)
    for x in range(250, 1800, 170):
        p.line([(x, 590), (x, 900)], (152, 38, 36), 5 * K)
    p.rect(110, 520, 1810, 590, (208, 74, 66), r=34)
    for x in (560, 960, 1360):
        p.line([(x, 0), (x, 118)], OUT, 4 * K)
        p.poly([(x - 64, 192), (x + 64, 192), (x + 30, 118), (x - 30, 118)], (46, 98, 78))
        p.ell(x - 24, 182, x + 24, 212, (255, 238, 172), outline=False)
    return p.done()


def diner_table(font, names=None):
    """Foreground table (drawn over the seated characters)."""
    layer = Painter((0, 0, 0))
    layer.img = Image.new("RGBA", (W * K, H * K), (0, 0, 0, 0))
    layer.d = ImageDraw.Draw(layer.img)
    layer.poly([(40, 770), (1880, 770), (1960, 870), (-40, 870)], (236, 214, 176))
    layer.rect(-20, 870, W + 20, 896, (198, 200, 206))
    layer.rect(-20, 896, W + 20, H + 20, (122, 82, 54))
    for x in (540, 1380):
        layer.rect(x - 36, 744, x + 36, 820, (246, 246, 242), r=8)
        layer.ell(x - 30, 744, x + 30, 760, (96, 60, 38), w=3 * K)
        layer.d.arc([(x + 26) * K, 760 * K, (x + 62) * K, 800 * K], -90, 90, fill=OUT, width=OW)
    layer.ell(1180, 790, 1330, 846, (250, 250, 248))
    for k in range(3):
        layer.ell(1210, 792 - k * 12, 1300, 822 - k * 12, (214, 160, 96), w=3 * K)
    layer.poly([(760, 800), (930, 788), (946, 858), (772, 868)], (250, 250, 246), w=3 * K)
    layer.rect(812, 806, 870, 846, (250, 250, 246), w=3 * K)
    layer.d.rectangle([826 * K, 818 * K, 856 * K, 836 * K], fill=(40, 90, 200))
    for k in range(4):
        for a, b in (((812 + 12 * k + 6, 800), (812 + 12 * k + 6, 806)), ((812 + 12 * k + 6, 846), (812 + 12 * k + 6, 852))):
            layer.line([a, b], (40, 90, 200), 3 * K)
    return layer.img.resize((W * Q, H * Q), Image.LANCZOS)


def nameplate(font, text, size=30):
    f = ImageFont.truetype(font, size * K)
    tw = f.getlength(text)
    img = Image.new("RGBA", (int(tw + 50 * K), int(size * 1.7 * K)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([2, 2, img.width - 3, img.height - 3], radius=10 * K, fill=(250, 248, 240), outline=OUT, width=4 * K)
    d.text((img.width / 2, img.height / 2 + 2 * K), text, font=f, fill=OUT, anchor="mm")
    return img.resize((img.width * Q // K, img.height * Q // K), Image.LANCZOS)


def bg_lab(font):
    p = Painter((190, 196, 202))
    p.grad(0, 0, W, 820, (200, 206, 212), (176, 182, 190))
    p.rect(-10, -10, W + 10, 36, (152, 156, 162))
    p.rect(140, 100, 880, 440, (248, 248, 246))
    p.rect(140, 440, 880, 456, (172, 172, 178))
    blue, red = (46, 88, 200), (200, 60, 50)
    p.line([(210, 300), (310, 160), (410, 300), (210, 300)], blue, 5 * K)
    p.d.arc([470 * K, 150 * K, 650 * K, 330 * K], 180, 360, fill=red, width=5 * K)
    p.line([(470, 240), (650, 240)], red, 3 * K)
    p.rect(690, 180, 820, 300, (248, 248, 246), outline=False)
    p.line([(690, 180), (820, 180), (820, 300), (690, 300), (690, 180)], blue, 5 * K)
    for k in range(4):
        x = 704 + k * 32
        p.line([(x, 168), (x, 180)], blue, 4 * K)
        p.line([(x, 300), (x, 312)], blue, 4 * K)
    p.text(510, 380, "3D?!", font, 54, red)
    p.rect(1180, 100, 1780, 430, (150, 118, 88))
    for yy in (210, 320):
        p.line([(1180, yy), (1780, yy)])
    rng = np.random.default_rng(5)
    for row, (y0, y1) in enumerate(((112, 206), (222, 316), (332, 426))):
        x = 1196
        while x < 1750:
            w = rng.integers(26, 46)
            col = [(200, 70, 60), (60, 110, 190), (80, 160, 90), (230, 190, 70), (130, 90, 170), (230, 230, 225)][rng.integers(0, 6)]
            h = rng.integers(60, 90)
            p.rect(x, y1 - h, x + w, y1, col, w=3 * K)
            x += w + 4
    p.rect(-10, 820, W + 10, H + 10, (128, 132, 138), outline=False)
    p.line([(0, 820), (W, 820)])
    p.rect(90, 700, 1830, 738, (216, 216, 210))
    p.rect(90, 738, 1830, 762, (172, 172, 168))
    for x in (110, 935, 1780):
        p.rect(x, 762, x + 30, 820, (96, 96, 102))
    crt(p, 280, 700)
    crt(p, 1640, 700)
    p.rect(1150, 560, 1390, 700, (150, 154, 160), r=10)
    p.rect(1172, 580, 1300, 680, (28, 40, 36), r=6)
    xs = np.linspace(1180, 1292, 40)
    p.line([(x, 630 + 26 * np.sin((x - 1180) / 9)) for x in xs], (96, 222, 126), 4 * K)
    for k in range(3):
        p.ell(1320, 590 + k * 34, 1350, 620 + k * 34, (90, 90, 96), w=3 * K)
    p.poly([(470, 712), (640, 712), (660, 732), (490, 732)], (46, 126, 72), w=3 * K)
    for k in range(5):
        p.line([(490 + k * 30, 716), (500 + k * 30, 728)], (226, 190, 90), 3 * K)
    return p.done()


def bg_board(font):
    p = Painter((120, 124, 128))
    p.rect(60, 40, 1860, 1000, (110, 112, 118), r=14)
    p.rect(84, 64, 1836, 976, (248, 248, 246), outline=False)
    p.rect(60, 1000, 1860, 1030, (150, 150, 156))
    p.rect(300, 990, 420, 1006, (200, 60, 50), r=6)
    p.rect(450, 990, 570, 1006, (46, 88, 200), r=6)
    return p.done()


def bg_tokyo(font):
    p = Painter((214, 208, 198))
    p.grad(0, 0, W, 860, (222, 216, 206), (204, 198, 188))
    p.rect(80, 60, 1840, 640, (72, 76, 84))
    p.grad(100, 80, 1820, 620, (176, 206, 230), (234, 240, 246))
    rng = np.random.default_rng(9)
    x = 100
    while x < 1810:
        w = int(rng.integers(70, 160))
        h = int(rng.integers(120, 360))
        col = tuple(int(v) for v in rng.integers(130, 190, 3) * np.array([0.92, 0.96, 1.08]))
        p.rect(x, 620 - h, min(x + w, 1820), 620, col, outline=False)
        for yy in range(620 - h + 18, 604, 30):
            for xx in range(x + 12, min(x + w, 1820) - 16, 26):
                p.rect(xx, yy, xx + 12, yy + 14, (222, 230, 240), outline=False)
        x += w + int(rng.integers(0, 16))
    tx, ty = 1460, 620
    p.poly([(tx - 70, ty), (tx + 70, ty), (tx + 8, ty - 330), (tx - 8, ty - 330)], (214, 70, 50), w=3 * K)
    for k, yy in enumerate((ty - 90, ty - 180, ty - 250)):
        hw = 70 - (ty - yy) * 0.19
        p.rect(tx - hw - 8, yy - 12, tx + hw + 8, yy, (240, 240, 236) if k % 2 else (214, 70, 50), w=3 * K)
    for x in (680, 1240):
        p.rect(x - 10, 80, x + 10, 620, (72, 76, 84), outline=False)
    p.rect(-10, 860, W + 10, H + 10, (122, 118, 114), outline=False)
    p.line([(0, 860), (W, 860)])
    p.rect(40, 720, 160, 860, (176, 112, 72), r=10)
    for dx, dy, rx, ry in ((-40, -60, 50, 90), (40, -70, 50, 95), (0, -110, 46, 100)):
        p.ell(100 + dx - rx, 720 + dy - ry, 100 + dx + rx, 720 + dy + ry, (84, 146, 88), w=4 * K)
    return p.done()


def tokyo_desk(font):
    layer = Painter((0, 0, 0))
    layer.img = Image.new("RGBA", (W * K, H * K), (0, 0, 0, 0))
    layer.d = ImageDraw.Draw(layer.img)
    layer.poly([(900, 780), (1860, 780), (1900, 830), (860, 830)], (134, 90, 60))
    layer.rect(870, 830, 1890, H + 20, (108, 72, 48))
    layer.line([(870, 900), (1890, 900)], (90, 58, 38), 4 * K)
    layer.poly([(1010, 790), (1190, 790), (1206, 822), (994, 822)], (250, 250, 246), w=3 * K)
    layer.text(1100, 806, "CONTRACT", font, 20)
    layer.rect(1600, 760, 1700, 800, (60, 60, 66), r=6)
    layer.rect(1612, 748, 1688, 766, (40, 40, 44), r=6)
    return layer.img.resize((W * Q, H * Q), Image.LANCZOS)


def bg_office(font):
    p = Painter((198, 200, 196))
    p.grad(0, 0, W, 660, (206, 208, 204), (186, 188, 184))
    p.rect(-10, -10, W + 10, 40, (226, 226, 222))
    for x in (300, 860, 1420):
        p.rect(x, 52, x + 240, 76, (250, 250, 240), w=3 * K)
    p.rect(-10, 660, W + 10, H + 10, (150, 150, 146), outline=False)
    p.line([(0, 660), (W, 660)])
    p.rect(60, 240, 230, 660, (150, 120, 92))
    p.ell(196, 440, 214, 458, (220, 200, 120), w=3 * K)
    p.rect(70, 170, 220, 222, (200, 50, 44), r=6)
    p.text(145, 197, "EXIT", font, 34, (255, 255, 255))

    def desk(x, y, s, box=False, monitor=True):
        p.rect(x - 110 * s, y - 10 * s, x + 110 * s, y + 6 * s, (214, 204, 184), w=int(4 * K * s + 1))
        p.rect(x - 104 * s, y + 6 * s, x + 104 * s, y + 70 * s, (176, 166, 146), w=int(4 * K * s + 1))
        if monitor:
            crt(p, x - 40 * s, y - 10 * s, 120 * s, 100 * s, on=False)
        if box:
            p.rect(x + 20 * s, y - 70 * s, x + 96 * s, y - 10 * s, (198, 158, 108), w=int(4 * K * s + 1))
            p.rect(x + 20 * s, y - 50 * s, x + 96 * s, y - 42 * s, (220, 190, 140), outline=False)
        p.rect(x + 60 * s, y + 20 * s, x + 110 * s, y + 70 * s, (70, 72, 80), w=int(4 * K * s + 1))
        p.rect(x + 62 * s, y - 30 * s, x + 108 * s, y + 20 * s, (84, 86, 96), w=int(4 * K * s + 1))
    for i, x in enumerate((420, 760, 1100, 1440, 1760)):
        desk(x, 560, 0.75, box=i in (1, 3), monitor=i != 2)
    for i, x in enumerate((560, 1020, 1480)):
        desk(x, 700, 1.0, box=i != 1, monitor=True)
    return p.done()


def bg_store(font):
    p = Painter((228, 224, 216))
    p.grad(0, 0, W, 780, (234, 230, 222), (218, 214, 206))
    p.rect(-10, -10, W + 10, 36, (238, 238, 232))
    p.rect(-10, 780, W + 10, H + 10, (204, 200, 192), outline=False)
    for x in range(0, W, 160):
        p.line([(x, 780), (x - 120, H)], (186, 182, 174), 3 * K)
    p.line([(0, 780), (W, 780)])
    rng = np.random.default_rng(12)
    palette = [(60, 110, 190), (200, 70, 60), (230, 190, 70), (130, 90, 170), (230, 230, 225), (90, 170, 110)]
    for sx in (60, 680, 1300):
        p.rect(sx, 160, sx + 560, 780, (150, 118, 88))
        for yy in (300, 440, 580, 720):
            p.rect(sx + 10, yy, sx + 550, yy + 14, (176, 140, 104), w=3 * K)
            x = sx + 22
            while x < sx + 530:
                w = int(rng.integers(40, 74))
                h = int(rng.integers(70, 118))
                if x + w > sx + 540:
                    break
                p.rect(x, yy - h, x + w, yy, palette[int(rng.integers(0, len(palette)))], w=3 * K)
                p.rect(x + 6, yy - h + 10, x + w - 6, yy - h + 24, (250, 250, 246), outline=False)
                x += w + 6
    return p.done()


def bg_black(font):
    return Image.new("RGB", (W * Q, H * Q), (10, 10, 12))
