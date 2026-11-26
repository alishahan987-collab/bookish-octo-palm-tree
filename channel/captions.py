"""Mobile captions: 1-3 words at a time, the spoken word highlighted, key words in brand orange."""
import re
from PIL import Image, ImageDraw
from world import font, FONT_XB, paste, back, clip01

CAP_Y = 1575
SIZE = 78
WHITE, YELLOW, ORANGE, INK = (255, 255, 255), (255, 214, 64), (255, 140, 40), (16, 16, 20)


def chunk_words(words):
    """words: [(text, start, end, key)] -> chunks of up to 3 words, breaking after punctuation."""
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        chars = sum(len(x[0]) for x in cur)
        if re.search(r"[.,?!:;…]$", w[0]) or len(cur) >= 3 or chars >= 15:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    # avoid a lonely 1-word chunk after a 3-word one when they can merge
    return chunks


def parse_line(text, timings, offset):
    """text with *key words*; timings = [[word, start, end], ...] for the same words (asterisks removed)."""
    raw = text.split()
    out = []
    key = False
    for i, tok in enumerate(raw):
        starts = tok.startswith("*")
        ends = tok.rstrip(".,?!:;…\"'").endswith("*")
        k = key or starts
        clean = tok.replace("*", "")
        if i < len(timings):
            _, s, e = timings[i]
        else:
            s, e = timings[-1][1], timings[-1][2]
        out.append((clean, s + offset, e + offset, k))
        if starts and not ends:
            key = True
        if ends:
            key = False
    return out


_cache = {}


def _render(chunk, active):
    k = (tuple(w[0] for w in chunk), active)
    if k in _cache:
        return _cache[k]
    f = font(FONT_XB, SIZE * 2)
    space = f.getlength(" ")
    items = [w[0].upper() for w in chunk]
    widths = [f.getlength(x) for x in items]
    maxw = 920 * 2
    lines, cur, cw = [], [], 0
    for i, wdt in enumerate(widths):
        if cur and cw + space + wdt > maxw:
            lines.append(cur)
            cur, cw = [], 0
        cur.append(i)
        cw += wdt + (space if len(cur) > 1 else 0)
    lines.append(cur)
    lh = SIZE * 2 * 1.18
    W = int(max(sum(widths[i] for i in ln) + space * (len(ln) - 1) for ln in lines) + 80)
    H = int(lh * len(lines) + 60)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for li, ln in enumerate(lines):
        lw = sum(widths[i] for i in ln) + space * (len(ln) - 1)
        x = (W - lw) / 2
        y = 30 + li * lh
        for i in ln:
            col = YELLOW if i == active else (ORANGE if chunk[i][3] else WHITE)
            d.text((x + 6, y + 8), items[i], font=f, fill=(0, 0, 0, 120), stroke_width=18, stroke_fill=(0, 0, 0, 120))
            d.text((x, y), items[i], font=f, fill=col, stroke_width=16, stroke_fill=INK)
            x += widths[i] + space
    out = img.resize((W // 2, H // 2), Image.LANCZOS)
    _cache[k] = out
    return out


def draw(frame, chunks, t, y=CAP_Y):
    """chunks: list of (words, t_start, t_end)."""
    for words, t0, t1 in chunks:
        if t0 <= t < t1:
            active = None
            for i, w in enumerate(words):
                if w[1] - 0.04 <= t:
                    active = i
            img = _render(words, active if active is not None else 0)
            u = back((t - t0) / 0.14)
            s = 0.86 + 0.14 * u
            if s < 0.999:
                img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
            paste(frame, img, 540 - img.width / 2, y - img.height / 2)
            return


def build_chunks(line_words, line_end):
    """line_words: parsed words of one line (absolute times). Returns chunk list with display windows."""
    chunks = chunk_words(line_words)
    out = []
    for i, ch in enumerate(chunks):
        t0 = ch[0][1] - 0.06
        t1 = chunks[i + 1][0][1] - 0.06 if i + 1 < len(chunks) else line_end + 0.25
        out.append((ch, t0, t1))
    return out
