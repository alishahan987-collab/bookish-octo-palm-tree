"""
Episode engine: timeline (voices + word timings), audio mix, 60 fps frame rendering with
camera moves, transitions and captions, resumable parallel encoding, storyboard export.

Usage: python3 engine.py ep01_recorded_voice [--audio-only] [--frames t1,t2,...] [--workers 3]
"""
import importlib
import json
import math
import multiprocessing as mp
import os
import subprocess
import sys
import numpy as np
import soundfile as sf
from PIL import Image

import character as C
import captions as CAP
import sound as SND
import world as WD

FPS = 60
HERE = os.path.dirname(os.path.abspath(__file__))
TRANS = 0.32


# ----------------------------------------------------------------------------- script objects
class Line:
    def __init__(self, spk, text, say=None, speed=None, gap=0.0, mouth=None):
        self.spk, self.text, self.say, self.speed, self.gap = spk, text, say, speed, gap
        self.mouth = (spk in ("C", "CI")) if mouth is None else mouth


def N(text, **kw): return Line("N", text, **kw)
def CI(text, **kw): return Line("CI", text, **kw)
def CR(text, **kw): return Line("CR", text, **kw)
def CV(text, **kw): return Line("C", text, **kw)


class Beat:
    def __init__(self, id, part, env, lines, build, under=None, over=None, music="curious", pad=0.5,
                 trans="cut", notes=None, amb=None):
        self.id, self.part, self.env, self.lines, self.build = id, part, env, lines, build
        self.under, self.over, self.music, self.pad, self.trans = under, over, music, pad, trans
        self.notes, self.amb = notes or {}, amb


class Timing:
    def __init__(self, beat):
        self.b = beat
        self.dur = beat.dur

    def L(self, i):
        return self.b.lines[i].start

    def E(self, i):
        return self.b.lines[i].end

    def w(self, word, n=0, line=None, after=0.0):
        word = word.lower().strip("*")
        k = 0
        for li, ln in enumerate(self.b.lines):
            if line is not None and li != line:
                continue
            for wd in ln.words:
                if SND._norm(wd[0]) == SND._norm(word):
                    if k == n:
                        return wd[1] + ln.start + after
                    k += 1
        print(f"  [warn] word '{word}' not found in {self.b.id}", file=sys.stderr)
        return (self.b.lines[0].start if self.b.lines else 0.0) + after


# ----------------------------------------------------------------------------- timeline
def build_timeline(ep):
    t = 0.0
    for b in ep.BEATS:
        b.start = t
        tt = 0.12
        for ln in b.lines:
            tt += ln.gap
            voice = "N" if ln.spk == "N" else "C"
            a = SND.tts(voice, ln.say or ln.text.replace("*", ""), ln.speed)
            if ln.spk == "CI":
                a = SND.fx_inner(a)
            elif ln.spk == "CR":
                a = SND.fx_recorded(a)
            ln.audio = a
            ln.words = SND.align(a, ln.text)
            ln.env = SND.envelope(a, FPS)
            ln.start, ln.end = tt, tt + len(a) / SND.SR
            tt = ln.end + 0.26
        b.dur = (b.lines[-1].end if b.lines else 0) + b.pad
        if not b.lines:
            b.dur = b.pad
        t += b.dur
    total = t
    prev_pose, prev_cam = None, None
    for b in ep.BEATS:
        T = Timing(b)
        T.prev_pose, T.prev_cam = prev_pose, prev_cam
        b.T = T
        b.S = b.build(T)
        h = b.S.get("hero")
        prev_pose = h.raw(b.dur) if h else None
        prev_cam = b.S["cam"][-1] if b.S.get("cam") else None
    return total


def caption_chunks(ep):
    out = []
    for b in ep.BEATS:
        for ln in b.lines:
            words = CAP.parse_line(ln.text, ln.words, b.start + ln.start)
            out += CAP.build_chunks(words, b.start + ln.end)
    return out


def beat_at(ep, g):
    for i, b in enumerate(ep.BEATS):
        if g < b.start + b.dur:
            return i, b
    return len(ep.BEATS) - 1, ep.BEATS[-1]


# ----------------------------------------------------------------------------- frames
def hero_talk(b, t):
    for ln in b.lines:
        if ln.mouth and ln.start <= t <= ln.end:
            k = int((t - ln.start) * FPS)
            return float(ln.env[min(k, len(ln.env) - 1)])
    return None


def draw_actor(frame, cam, track, t, b=None, is_hero=False):
    p = track.pose(t)
    if is_hero and b is not None:
        a = hero_talk(b, t)
        if a is not None:
            p["mouth"], p["mouth_k"] = "talk", 0.25 + 0.75 * a
    if p.get("chatter", 0) > 0.5:
        p["mouth"], p["mouth_k"] = "talk", 0.25 + 0.6 * abs(math.sin(t * 13)) * abs(math.sin(t * 3.1 + 1))
    if p.get("alpha", 1.0) <= 0.01:
        return p
    img, (ox, oy) = C.render(p, p["scale"] * cam.z, extra=track.extra)
    sx, sy = cam.S(p["x"], p["y"])
    WD.paste(frame, img, sx + ox, sy + oy)
    return p


def render_core(ep, bi, t):
    b = ep.BEATS[bi]
    S = b.S
    cam = WD.cam_at(S["cam"], t) if S.get("cam") else WD.Cam()
    env = WD.environment(b.env)
    cam.fit(env.width / WD.BGQ, env.height / WD.BGQ)
    frame = cam.view(env).convert("RGBA")
    if b.under:
        b.under(frame, cam, t, b.T, S)
    actors = S.get("actors")
    if actors is None:
        actors = [("extra", e) for e in S.get("extras", [])] + ([("hero", S["hero"])] if S.get("hero") else [])
    for kind, tr in actors:
        draw_actor(frame, cam, tr, t, b, is_hero=(kind == "hero"))
    if b.over:
        b.over(frame, cam, t, b.T, S)
    return frame


def render_frame(ep, g, chunks):
    bi, b = beat_at(ep, g)
    t = g - b.start
    frame = render_core(ep, bi, t)
    if b.trans == "fade" and bi > 0 and t < TRANS:
        pb = ep.BEATS[bi - 1]
        prev = render_core(ep, bi - 1, pb.dur - 1.0 / FPS)
        frame = Image.blend(prev, frame, WD.smooth(t / TRANS))
    CAP.draw(frame, chunks, g)
    total = ep.BEATS[-1].start + ep.BEATS[-1].dur
    fade = min(1.0, g / 0.4, (total - g) / 0.8)
    rgb = frame.convert("RGB")
    if fade < 1:
        rgb = Image.eval(rgb, lambda v, k=max(0.0, fade): int(v * k))
    return rgb


# ----------------------------------------------------------------------------- audio
def build_audio(ep, total):
    SR = SND.SR
    n = int((total + 0.6) * SR)
    voice = np.zeros(n, np.float32)
    fx = np.zeros((n, 2), np.float32)
    amb = np.zeros((n, 2), np.float32)
    rng = np.random.default_rng(5)
    for b in ep.BEATS:
        for ln in b.lines:
            s = int((b.start + ln.start) * SR)
            e = min(n, s + len(ln.audio))
            voice[s:e] += ln.audio[: e - s] * (1.0 if ln.spk == "N" else 0.92)
        for item in b.S.get("sfx", []):
            at, name = item[0], item[1]
            g = item[2] if len(item) > 2 else 1.0
            pan = item[3] if len(item) > 3 else 0.0
            SND._add(fx, b.start + at, SND.sfx(name, rng), pan, g)
        for tr in ([b.S.get("hero")] if b.S.get("hero") else []) + list(b.S.get("extras", [])):
            for (w0, w1, x0, x1) in tr.walks:
                sc = tr.keys[0][1]["scale"]
                dist = abs(x1 - x0) / sc
                steps = max(1, int(dist / (C.STRIDE / 2)))
                for k in range(steps):
                    SND._add(fx, b.start + w0 + (w1 - w0) * (k + 0.5) / steps, SND.sfx("step", rng), 0.0, 0.5 if tr.extra else 0.8)
        if b.amb:
            name, g = b.amb
            clip = SND.sfx(name, rng)
            reps = int(b.dur / (len(clip) / SR)) + 1
            loop = np.tile(clip, reps)[: int(b.dur * SR)]
            fade = np.clip(np.minimum(np.arange(len(loop)) / (0.4 * SR), (len(loop) - np.arange(len(loop))) / (0.4 * SR)), 0, 1)
            SND._add(amb, b.start, loop * fade, 0.0, g)
    # music: one cue per run of beats, crossfaded
    music = np.zeros((n, 2), np.float32)
    runs = []
    for b in ep.BEATS:
        if runs and runs[-1][0] == b.music:
            runs[-1][2] = b.start + b.dur
        else:
            runs.append([b.music, b.start, b.start + b.dur])
    for i, (cue, a0, a1) in enumerate(runs):
        if cue is None:
            continue
        x0, x1 = max(0.0, a0 - 0.8), min(total + 0.6, a1 + 0.8)
        seg = SND.music_cue(cue, x1 - x0, seed=i)
        tt = np.arange(len(seg)) / SR
        env = np.clip(np.minimum(tt / 1.6, (len(seg) / SR - tt) / 1.6), 0, 1)
        s = int(x0 * SR)
        e = min(n, s + len(seg))
        music[s:e] += seg[: e - s] * env[: e - s, None]
    master = SND.mix(n, voice, music, fx, amb)
    return master


# ----------------------------------------------------------------------------- encoding
def _render_chunk(args):
    ep_name, i, f0, f1, out = args
    ep = EP_CACHE
    chunks = CHUNKS
    tmp = out + ".part.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1080x1920",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-profile:v", "high",
                           "-pix_fmt", "yuv420p", "-g", "120", "-threads", "2", "-movflags", "+faststart", tmp], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        ff.stdin.write(render_frame(ep, f / FPS, chunks).tobytes())
    ff.stdin.close()
    if ff.wait() == 0:
        os.replace(tmp, out)
        return i
    return -1


EP_CACHE, CHUNKS = None, None


def render_video(ep, ep_name, total, workers=3, chunk_frames=600):
    global EP_CACHE, CHUNKS
    out_dir = os.path.join(HERE, "build", ep_name, "chunks")
    os.makedirs(out_dir, exist_ok=True)
    nfr = int(round(total * FPS))
    jobs = []
    for i, f0 in enumerate(range(0, nfr, chunk_frames)):
        out = os.path.join(out_dir, f"c{i:04d}.mp4")
        if not os.path.exists(out):
            jobs.append((ep_name, i, f0, min(nfr, f0 + chunk_frames), out))
    EP_CACHE, CHUNKS = ep, caption_chunks(ep)
    print(f"frames {nfr}, chunks to render: {len(jobs)}", flush=True)
    if jobs:
        ctx = mp.get_context("fork")
        with ctx.Pool(workers) as pool:
            for k, r in enumerate(pool.imap_unordered(_render_chunk, jobs)):
                print(f"chunk done {r} ({k + 1}/{len(jobs)})", flush=True)
    files = sorted(f for f in os.listdir(out_dir) if f.endswith(".mp4") and not f.endswith(".part.mp4"))
    with open(os.path.join(out_dir, "list.txt"), "w") as fh:
        for f in files:
            fh.write(f"file '{f}'\n")
    return out_dir


def export_storyboard(ep, ep_name, total):
    rows = []
    for k, b in enumerate(ep.BEATS, 1):
        vo = " / ".join((("[character] " if ln.spk != "N" else "") + ln.text.replace("*", "")) for ln in b.lines)
        n = b.notes
        rows.append(f"| {k} | {b.part} | {b.start:5.1f}–{b.start + b.dur:5.1f}s | {vo} | {n.get('action', '')} | {b.env} | "
                    f"{n.get('camera', '')} | {n.get('sound', '')} | {b.music} |")
    head = ("| # | Part | Time | Voiceover | Character action / animation | Environment | Camera | Sound effects | Music |\n"
            "|---|---|---|---|---|---|---|---|---|")
    md = [f"# {ep.TITLE}", "", f"**Length:** {int(total // 60)}:{int(total % 60):02d}  ·  **Format:** 1080×1920, 60 fps, H.264 + AAC", ""]
    md += ["## Hook options", ""] + [f"{i}. {h}" for i, h in enumerate(ep.HOOKS, 1)] + ["", f"**Chosen:** {ep.HOOK_CHOICE}", ""]
    md += ["## Script", ""]
    for b in ep.BEATS:
        for ln in b.lines:
            who = "Narrator" if ln.spk == "N" else ("Stickman (inner voice)" if ln.spk == "CI" else ("Stickman (as recorded)" if ln.spk == "CR" else "Stickman"))
            md.append(f"- **{who}:** {ln.text.replace('*', '')}")
    md += ["", "## Storyboard", "", head] + rows
    md += ["", "## Sources", ""] + [f"- {s}" for s in ep.SOURCES]
    md += ["", "## YouTube", "", f"**Title:** {ep.YT_TITLE}", "", "**Description:**", "", ep.YT_DESCRIPTION, "", "**Hashtags:** " + " ".join(ep.HASHTAGS)]
    path = os.path.join(HERE, "build", ep_name, "production_notes.md")
    open(path, "w").write("\n".join(md) + "\n")
    return path


def main():
    ep_name = sys.argv[1]
    ep = importlib.import_module(ep_name)
    os.makedirs(os.path.join(HERE, "build", ep_name), exist_ok=True)
    total = build_timeline(ep)
    print(f"{ep_name}: {len(ep.BEATS)} beats, {total:.1f}s ({int(total // 60)}:{int(total % 60):02d})", flush=True)
    if "--frames" in sys.argv:
        ts = [float(x) for x in sys.argv[sys.argv.index("--frames") + 1].split(",")]
        chunks = caption_chunks(ep)
        for g in ts:
            render_frame(ep, g, chunks).save(os.path.join(HERE, "build", ep_name, f"frame_{g:07.2f}.jpg"), quality=90)
        print("frames saved", flush=True)
        return
    nb = export_storyboard(ep, ep_name, total)
    print("storyboard:", nb, flush=True)
    wav = os.path.join(HERE, "build", ep_name, "mix.wav")
    if not os.path.exists(wav) or "--audio-only" in sys.argv or "--remix" in sys.argv:
        audio = build_audio(ep, total)
        sf.write(wav, audio, SND.SR, subtype="PCM_16")
        print("audio:", wav, flush=True)
    if "--audio-only" in sys.argv:
        return
    workers = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else 3
    out_dir = render_video(ep, ep_name, total, workers)
    final = os.path.join(HERE, "build", ep_name, f"{ep_name}.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(out_dir, "list.txt"),
                    "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                    "-shortest", "-movflags", "+faststart", final], check=True)
    print("done:", final, flush=True)


if __name__ == "__main__":
    main()
