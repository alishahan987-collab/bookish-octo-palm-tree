"""Build the Rome YouTube video: slow zooms, crossfades, captions, ambient music."""
import subprocess, math, numpy as np, wave
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, XF = 1920, 1080, 30, 0.8
FONT = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 54)
TITLE = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 130)

# (scene image number, [captions shown in order])
SCENES = [
 (1, ["Imagine a small village...", "...that eventually conquered almost the entire known world."]),
 (2, ["This is the story of Rome."]),
 (3, ["In 753 BC, according to legend, two brothers named Romulus and Remus", "founded a city near the Tiber River."]),
 (4, ["But their dream ended in blood", "when Romulus killed his own brother."]),
 (5, ["Rome began as a kingdom, but eventually its people overthrew their king", "and established something new: a Republic."]),
 (6, ["Instead of one ruler, power was shared", "between elected officials and the Senate."]),
 (7, ["But Rome wanted more."]),
 (8, ["It conquered Italy and defeated powerful enemies..."]),
 (9, ["...and fought three massive wars against Carthage."]),
 (10, ["Its greatest enemy was Hannibal, a brilliant general", "who crossed the freezing Alps with war elephants to attack Rome."]),
 (11, ["Yet Rome refused to surrender."]),
 (12, ["Then came Julius Caesar."]),
 (13, ["A brilliant military commander who conquered vast territories..."]),
 (14, ["...and eventually became dictator for life."]),
 (15, ["But in 44 BC, he was assassinated by Roman senators.", "His death changed history forever."]),
 (16, ["His adopted son, Augustus, eventually took control", "and became Rome's first emperor."]),
 (17, ["Rome entered its golden age."]),
 (18, ["It built magnificent roads, aqueducts, stadiums and cities."]),
 (19, ["But no empire lasts forever.", "Political instability, economic problems, invasions and internal conflicts weakened Rome."]),
 (20, ["In 476 AD, the Western Roman Empire finally collapsed.", "But Rome wasn't completely gone."]),
 (21, ["Its Eastern Empire survived for another thousand years,", "until Constantinople fell in 1453."]),
 (22, ["And even today, Roman law, architecture, language and political ideas", "continue to shape our world."]),
 (23, ["An empire that ruled the ancient world disappeared...", "But its legacy never did."]),
]

def cap_len(c): return max(2.8, len(c.split()) * 0.42 + 1.2)
plan, t = [], 0.0
for n, caps in SCENES:
    d = sum(cap_len(c) for c in caps) + 0.6
    plan.append(dict(n=n, caps=caps, start=t, dur=d)); t += d - XF
TOTAL = t + XF + 2.0   # 2s fade-out tail on last scene
plan[-1]["dur"] += 2.0

imgs = {p["n"]: Image.open(f"images/scene_{p['n']:02d}.jpg").convert("RGB").resize((int(W*1.2), int(H*1.2)), Image.LANCZOS) for p in plan}

def kenburns(p, lt):
    im = imgs[p["n"]]; k = lt / p["dur"]
    zin = p["n"] % 2 == 1
    z = 1.0 + 0.12 * (k if zin else 1 - k)
    cw, ch = im.width / (1.2 * z) * 1.0, im.height / (1.2 * z)
    pan = (p["n"] % 3 - 1) * 0.04 * (k - 0.5)
    cx = im.width / 2 + pan * im.width; cy = im.height / 2
    box = (cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2)
    return im.resize((W, H), Image.BILINEAR, box=box)

def wrap(txt, font, maxw, d):
    words, lines, cur = txt.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if d.textlength(test, font=font) > maxw and cur: lines.append(cur); cur = w_
        else: cur = test
    return lines + [cur]

def draw_caption(img, p, lt):
    acc = 0.3
    for c in p["caps"]:
        L = cap_len(c)
        if acc <= lt < acc + L:
            a = min(1, (lt-acc)/0.3, (acc+L-lt)/0.3)
            ov = Image.new("RGBA", img.size, (0,0,0,0)); d = ImageDraw.Draw(ov)
            lines = wrap(c, FONT, W*0.8, d)
            y = H - 90 - len(lines)*68
            for ln in lines:
                tw = d.textlength(ln, font=FONT); x = (W-tw)/2
                for dx, dy in [(-3,0),(3,0),(0,-3),(0,3),(3,3)]:
                    d.text((x+dx, y+dy), ln, font=FONT, fill=(0,0,0,int(230*a)))
                d.text((x, y), ln, font=FONT, fill=(255,240,210,int(255*a)))
                y += 68
            return Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
        acc += L
    return img

# bottom gradient for caption readability
grad = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(grad)
for y in range(H//2, H): gd.line([(0,y),(W,y)], fill=int(170*((y-H/2)/(H/2))**1.5))
black = Image.new("RGB", (W, H), (0,0,0))

def frame(t):
    act = [p for p in plan if p["start"] <= t < p["start"] + p["dur"]]
    out = None
    for p in act:
        lt = t - p["start"]
        im = draw_caption(Image.composite(black, kenburns(p, lt), grad), p, lt)
        if out is None: out = im
        else:
            a = min(1, lt / XF); out = Image.blend(out, im, a)
    if t < 1.0: out = Image.blend(black, out, t)
    if t > TOTAL - 2.0: out = Image.blend(out, black, min(1, (t-(TOTAL-2.0))/2.0))
    return out

# ambient music: slow minor-chord pad + soft drum hits at scene starts
SR = 44100; n = int(TOTAL*SR); tt = np.arange(n)/SR
chords = [[110,130.81,164.81],[87.31,130.81,174.61],[98,123.47,146.83],[110,130.81,164.81]]
mus = np.zeros(n)
seg = 8.0
for i in range(int(TOTAL/seg)+1):
    s, e = int(i*seg*SR), min(n, int((i+1)*seg*SR + 2*SR))
    if s >= n: break
    x = tt[s:e]-i*seg; env = np.minimum(1, x/2) * np.minimum(1, np.maximum(0, (seg+2-x)/2))
    for f in chords[i % 4]:
        mus[s:e] += env * (np.sin(2*np.pi*f*x) + 0.3*np.sin(2*np.pi*f*2*x+0.5) + 0.5*np.sin(2*np.pi*f/2*x)) * 0.05
for p in plan:
    s = int(p["start"]*SR); L = int(1.5*SR)
    if s+L < n:
        x = np.arange(L)/SR
        mus[s:s+L] += np.sin(2*np.pi*(60*np.exp(-x*3))*x) * np.exp(-x*4) * 0.35
mus *= np.minimum(1, tt/2) * np.minimum(1, (TOTAL-tt)/3)
mus = np.clip(mus/np.max(np.abs(mus))*0.6, -1, 1)
with wave.open("music.wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((mus*32767).astype(np.int16).tobytes())

ff = subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
    "-i","music.wav","-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-shortest",
    "rome_video.mp4"], stdin=subprocess.PIPE)
N = int(TOTAL*FPS)
for i in range(N):
    ff.stdin.write(frame(i/FPS).tobytes())
    if i % 300 == 0: print(f"{i}/{N}", flush=True)
ff.stdin.close(); ff.wait()
print("TOTAL seconds:", round(TOTAL,1))
