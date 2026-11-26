"""
Episode 1 - Why do we hate the sound of our own recorded voice?
Script, storyboard and per-scene animation. Rendered by engine.py.
"""
import math
from PIL import Image, ImageDraw
import character as C
import world as WD
import props as PR
from character import Track
from engine import Beat, N, CI, CR, CV

TITLE = "Why Do We Hate the Sound of Our Own Recorded Voice?"
HOOKS = [
    "There is a version of your voice that everyone you know has heard... except you.",
    "The moment you hear your own voice on a recording, your brain says: that's not me. Your brain is wrong.",
    "Why does your own voice make you cringe, when everyone else's sounds completely normal?",
]
HOOK_CHOICE = "1 — it opens a curiosity gap in the first 3 seconds and makes it personal to every viewer."
SOURCES = [
    "Scientific American — Why does my voice sound so different when it is recorded? https://scientificamerican.com/article/why-does-my-voice-sound-different",
    "Popular Science — Why your voice sounds weird on recordings https://www.popsci.com/science/why-your-voice-sounds-weird-on-recordings/",
    "The Conversation — Why do we hate the sound of our own voices? https://theconversation.com/why-do-we-hate-the-sound-of-our-own-voices-158376",
    "Holzman & Rousey (1966), 'The voice as a percept', J. Personality & Social Psychology 4, 79–86 (voice confrontation) https://en.wikipedia.com/wiki/Voice_confrontation",
    "Mita, Dermer & Knight (1977), 'Reversed facial images and the mere-exposure hypothesis', JPSP 35(8), 597–601",
    "Hughes & Harrison (2013), 'I like my voice better: self-enhancement bias in perceptions of voice attractiveness', Perception 42(9), 941–949 https://sciencedaily.com/releases/2013/09/130912112733.htm",
    "Live Science — Why people hate the sound of their own voice (habituation) https://www.livescience.com/55527-why-people-hate-the-sound-of-their-voice.html",
]
YT_TITLE = "Why Do You Hate Your Own Recorded Voice? (It's Not What You Think)"
YT_DESCRIPTION = """Everyone you know has heard a version of your voice... except you.

Why does your recorded voice sound so weird? In this animated explainer we follow one stickman's voice message to find out:
• the two roads your voice travels (through the air and through your bones)
• why a microphone can't hear the bass inside your skull
• the 1966 study that named "voice confrontation"
• the 1977 mirror-photo experiment and the mere exposure effect
• the 2013 twist: people rate their OWN voice as more attractive when they don't know it's theirs

Try it yourself: put your fingers in your ears and say something!

Sources:
- Holzman & Rousey (1966), The voice as a percept, Journal of Personality and Social Psychology
- Mita, Dermer & Knight (1977), Reversed facial images and the mere-exposure hypothesis, JPSP
- Hughes & Harrison (2013), I like my voice better, Perception
- Scientific American, Popular Science, The Conversation, Live Science

Do you hate your recorded voice? Tell me in the comments."""
HASHTAGS = ["#psychology", "#science", "#brain", "#voice", "#animation", "#stickman", "#didyouknow", "#explained"]

HX, HY, HS = 540, 1300, 2.0
BEATS = []


def beat(*a, **k):
    BEATS.append(Beat(*a, **k))


def K(t, pose, e="io"):
    return (t, pose, e)


def H(fn, x=HX, y=HY, s=HS, **kw):
    return fn(x=x, y=y, scale=s, **kw)


def hero(keys, walks=()):
    return Track(keys, walks, seed=1)


def extra(keys, walks=(), seed=5):
    return Track(keys, walks, seed=seed, extra=True)


def appear(fn, x, y, s, t_in, seed=5, t_out=None, **kw):
    p0 = fn(x=x, y=y, scale=s, alpha=0.0, **kw)
    p1 = fn(x=x, y=y, scale=s, alpha=1.0, **kw)
    keys = [K(0, p0), K(t_in, p0), K(t_in + 0.35, p1, "out")]
    if t_out is not None:
        keys += [K(t_out, p1), K(t_out + 0.35, p0)]
    return extra(keys, seed=seed)


def head_xy(track, t, cam):
    p = track.pose(t)
    j = C.joints(p)
    hx = p["x"] + j["head"][0] * p["scale"]
    hy = p["y"] + j["head"][1] * p["scale"]
    return cam.S(hx, hy), p


def lab(frame, text, x, y, t, at, style="dark", size=54, until=None):
    WD.draw_label(frame, text, x, y, t, at, until=until, style=style, size=size)


# ============================================================================= PART 1 — HOOK
def b01(T):
    return dict(cam=[(0, 540, 1010, 1.35), (T.dur, 540, 975, 1.05)],
                hero=hero([K(0, H(C.stand)), K(T.w("everyone"), H(C.stand, brow_raise=0.5)), K(T.dur, H(C.stand, brow_raise=0.5))]),
                sfx=[(0.0, "whoosh", 0.5), (T.w("everyone"), "impact", 0.45)])


def b01o(f, cam, t, T, S):
    WD.sound_arcs(f, cam, 572, 878, t, 0, WD.PURPLE, 3, 0.6, 0.7, 0.55)


beat("b01", "HOOK", "void", [N("There is a version of your voice that *everyone* you know has heard.")], b01, over=b01o, music="mystery",
     notes=dict(action="Stickman alone, facing the viewer; soft voice rings come from his mouth", camera="Close-up pulling back to medium",
                sound="Soft whoosh; low impact on 'everyone'"))

GROUPS = [("friends", [(150, 1250), (290, 1250)], -1), ("family", [(790, 1250), (930, 1250)], 1), ("teachers", [(380, 1170), (700, 1170)], 0)]


def b02(T):
    ex = []
    looks = []
    for gi, (word, pos, side) in enumerate(GROUPS):
        tw = T.w(word)
        for k, (x, y) in enumerate(pos):
            ex.append(appear(C.stand, x, y, 1.45 if y > 1200 else 1.2, tw + 0.08 * k, seed=20 + gi * 3 + k, facing=-0.6 * (1 if x > 540 else -1)))
        looks.append((tw, side))
    keys = [K(0, H(C.stand, brow_raise=0.5))]
    for tw, side in looks:
        keys.append(K(tw + 0.15, H(C.stand, look=(side, -0.3 if side == 0 else 0), facing=0.25 * side, brow_raise=0.4)))
    keys.append(K(T.dur, H(C.stand, look=(0, 0), brow_raise=0.4)))
    return dict(cam=[(0, 540, 960, 1.05), (T.dur, 540, 960, 1.0)], hero=hero(keys), extras=ex,
                sfx=[(T.w(w), "pop", 0.8, -0.5 + 0.5 * i) for i, (w, _, _) in enumerate(GROUPS)])


def b02o(f, cam, t, T, S):
    for gi, (word, pos, side) in enumerate(GROUPS):
        tw = T.w(word)
        if t > tw + 0.3:
            for (x, y) in pos:
                s = 1.45 if y > 1200 else 1.2
                WD.sound_arcs(f, cam, x + (40 if x < 540 else -40) * s / 1.45, y - 200 * s, t, 0 if x < 540 else 180, WD.BLUE, 2, 0.8, 0.45, 0.8)


beat("b02", "HOOK", "void", [N("Your friends. Your family. Your teachers.")], b02, over=b02o, music="mystery",
     notes=dict(action="Grey silhouettes of friends, family and teachers pop in; each 'hears' his voice (blue rings); he looks at each group",
                camera="Gentle pull-back", sound="Soft pop as each group appears"))


def b03(T):
    tx, ty = T.w("except"), T.w("you")
    ex = []
    for gi, (word, pos, side) in enumerate(GROUPS):
        for k, (x, y) in enumerate(pos):
            s = 1.45 if y > 1200 else 1.2
            p1 = C.stand(x=x, y=y, scale=s, facing=0.6 * (-1 if x > 540 else 1))
            p0 = C.stand(x=x, y=y, scale=s, facing=0.6 * (-1 if x > 540 else 1), alpha=0.3)
            ex.append(extra([K(0, p1), K(tx, p1), K(tx + 0.5, p0)], seed=20 + gi * 3 + k))
    keys = [K(0, H(C.stand, brow_raise=0.4)), K(ty - 0.1, H(C.stand, brow_raise=0.4)),
            K(ty + 0.25, H(C.point_self, brow_raise=1.0, eye_size=1.2, mouth="O", mouth_k=0.6), "back"), K(T.dur, H(C.point_self, brow_raise=1.0, eye_size=1.2, mouth="O", mouth_k=0.6))]
    return dict(cam=[(0, 540, 960, 1.0), (ty, 540, 960, 1.0), (ty + 0.5, 540, 900, 1.38)], hero=hero(keys), extras=ex,
                sfx=[(ty, "impact", 0.6)], tx=tx)


def b03o(f, cam, t, T, S):
    (sx, sy), _ = head_xy(S["hero"], t, cam)
    PR.spotlight(f, sx, sy + 200 * cam.z, 330 * cam.z, 0.8 * WD.smooth((t - S["tx"]) / 0.6))


beat("b03", "HOOK", "void", [N("Everyone... except *you*.")], b03, over=b03o, music="mystery",
     notes=dict(action="Everyone turns to him and fades; he points at himself, surprised", camera="Snap push-in on 'you'",
                sound="Deep cinematic impact on 'you'"))


def b04(T):
    th = T.w("hate")
    keys = [K(0, H(C.phone_ear)), K(th - 0.1, H(C.phone_ear)), K(th + 0.2, H(C.cringe), "back"), K(T.dur, H(C.cringe))]
    return dict(cam=[(0, 540, 900, 1.25), (T.dur, 540, 960, 1.05)], hero=hero(keys),
                sfx=[(0.0, "whoosh", 0.5), (T.w("voice"), "ding", 0.8)])


def b04o(f, cam, t, T, S):
    lab(f, "WHY DO WE HATE", 540, 300, t, T.w("why"), "dark", 62)
    lab(f, "OUR OWN VOICE?", 540, 410, t, T.w("voice"), "orange", 62)


beat("b04", "HOOK", "void", [N("So why do so many of us *hate* the sound of our own recorded voice?")], b04, over=b04o, music="mystery",
     notes=dict(action="He listens to his phone and cringes on 'hate'; title pops in", camera="Slow pull-back", sound="Whoosh; ding on title"))

# ============================================================================= PART 2 — THE VOICE MESSAGE
PX = 330


def b05(T):
    ts = T.w("sending")
    keys = [K(0, H(C.stand, x=PX, look=(0.5, 0))), K(ts, H(C.stand, x=PX, look=(0.5, 0))), K(ts + 0.4, H(C.phone_record, x=PX), "back"), K(T.dur, H(C.phone_record, x=PX))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 520, 940, 1.05)], hero=hero(keys), sfx=[(T.w("voice"), "rec_on", 1.0)])


def b05o(f, cam, t, T, S):
    if t > T.w("voice") - 0.1:
        WD.phone_ui(f, 770, 640, t, "record", 0.72, rec_time=0)


beat("b05", "VOICE MESSAGE", "apartment", [N("It usually starts with something simple. Like sending a *voice message*.")], b05, over=b05o,
     music="curious", trans="fade",
     notes=dict(action="In his apartment he lifts his phone and starts recording", camera="Slow push-in", sound="Record beep on 'voice message'"))


def b06(T):
    return dict(cam=[(0, 520, 940, 1.05), (T.dur, 500, 930, 1.1)], hero=hero([K(0, H(C.phone_record, x=PX)), K(T.dur, H(C.phone_record, x=PX, brow_raise=0.5))]),
                sfx=[(T.E(0) + 0.05, "rec_off", 1.0), (T.E(0) + 0.3, "send", 0.8)])


def b06o(f, cam, t, T, S):
    if t < T.E(0) + 0.3:
        WD.phone_ui(f, 770, 640, t, "record", 0.72, rec_time=(t - T.L(0)) * 1.2)
    else:
        WD.phone_ui(f, 770, 640, t, "sent", 0.72)
    WD.sound_arcs(f, cam, PX + 30, 870, t, -10, WD.PURPLE, 3, 0.9, 0.5, 0.7)


beat("b06", "VOICE MESSAGE", "apartment", [CI("Hey! It's me. Call me back when you get this!")], b06, over=b06o, music="curious",
     notes=dict(action="He records a cheerful voice message (mouth synced); phone shows the recording, then 'sent'",
                camera="Slight push-in", sound="Stop beep and send whoosh"))


def b07(T):
    tp = T.w("play")
    keys = [K(0, H(C.phone_record, x=PX, look=(0.6, 0.3))), K(tp, H(C.phone_record, x=PX, look=(0.6, 0.3))), K(tp + 0.45, H(C.phone_ear, x=PX), "back"), K(T.dur, H(C.phone_ear, x=PX))]
    return dict(cam=[(0, 500, 930, 1.1), (T.dur, 470, 920, 1.15)], hero=hero(keys), sfx=[(tp, "click", 1.0)], tp=tp)


def b07o(f, cam, t, T, S):
    WD.phone_ui(f, 770, 640, t, "play" if t > S["tp"] else "sent", 0.72, play=0.0 if t > S["tp"] else 0.0)


beat("b07", "VOICE MESSAGE", "apartment", [N("Then, just out of curiosity, you press *play*.")], b07, over=b07o, music="curious",
     notes=dict(action="He presses play and lifts the phone to his ear", camera="Push-in", sound="Click on 'play'"))


def b08(T):
    t0 = T.L(0)
    keys = [K(0, H(C.phone_ear, x=PX)), K(t0 + 0.5, H(C.phone_ear, x=PX)),
            K(t0 + 0.8, H(C.phone_ear, x=PX, eye_size=1.4, brow_raise=1.0, mouth="O", mouth_k=0.7), "back"),
            K(T.dur, H(C.phone_ear, x=PX, eye_size=1.4, brow_raise=1.0, mouth="O", mouth_k=0.9))]
    return dict(cam=[(0, 470, 920, 1.15), (t0 + 0.6, 470, 920, 1.15), (t0 + 1.0, 360, 880, 1.6), (T.dur, 360, 880, 1.65)],
                hero=hero(keys), sfx=[(T.E(0) + 0.05, "impact", 0.35)])


def b08o(f, cam, t, T, S):
    pr = WD.clip01((t - T.L(0)) / max(0.1, T.E(0) - T.L(0)))
    sx, sy = cam.S(PX + 70, 860)
    WD.sound_arcs(f, cam, PX + 75, 862, t, 0, WD.BLUE, 3, 1.1, 0.55, 0.8)


beat("b08", "VOICE MESSAGE", "apartment", [CR("Hey! It's me. Call me back when you get this!")], b08, over=b08o, music="curious",
     notes=dict(action="The thin playback version plays; his eyes go wide in shock", camera="Quick zoom into his face",
                sound="The recorded (thin, phone-like) version of his voice; soft impact"))


def b09(T):
    keys = [K(0, H(C.phone_ear, x=PX, eye_size=1.4, brow_raise=1.0)), K(0.35, H(C.confused, x=PX), "back"), K(T.dur, H(C.confused, x=PX, tilt=18))]
    return dict(cam=[(0, 360, 880, 1.65), (T.dur, 400, 900, 1.35)], hero=hero(keys), sfx=[(T.E(0) - 0.4, "pop", 0.8)])


def b09o(f, cam, t, T, S):
    (sx, sy), _ = head_xy(S["hero"], t, cam)
    WD.mark(f, "?", sx + 110 * cam.z, sy - 120 * cam.z, t, T.E(0) - 0.4, 60)


beat("b09", "VOICE MESSAGE", "apartment", [CI("Wait... is that what I sound like?")], b09, over=b09o, music="curious",
     notes=dict(action="Confused head tilt and shrug; a question mark pops", camera="Ease out from close-up", sound="Pop on the question mark"))


def b10(T):
    tl = T.w("lots")
    ex = [appear(C.hands_on_head, x, 1230, 1.4, tl + 0.12 * k, seed=40 + k) for k, x in enumerate((150, 330, 750, 930))]
    return dict(cam=[(0, 540, 960, 1.08), (T.dur, 540, 960, 1.0)], hero=hero([K(0, H(C.cringe)), K(T.dur, H(C.cringe))]), extras=ex,
                sfx=[(tl + 0.12 * k, "pop", 0.6, -0.6 + 0.4 * k) for k in range(4)] + [(T.w("alone"), "ding", 0.6)])


def b10o(f, cam, t, T, S):
    lab(f, "YOU'RE NOT ALONE", 540, 330, t, T.w("alone"), "orange", 60)


beat("b10", "VOICE MESSAGE", "void", [N("If that made you *cringe*, you're not alone. Lots of people can't stand hearing their own recorded voice.")],
     b10, over=b10o, music="curious", trans="fade",
     notes=dict(action="He cringes; a row of grey people appears, all grabbing their heads", camera="Slow pull-back", sound="Pops as people appear"))


def b11(T):
    tl = T.w("lying")
    keys = [K(0, H(C.phone_record, look=(0.5, 0.6))), K(tl - 0.2, H(C.phone_record, look=(0.5, 0.6))), K(tl + 0.2, H(C.think)), K(T.dur, H(C.think))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 920, 1.15)], hero=hero(keys), sfx=[(tl, "pop", 0.7)])


def b11o(f, cam, t, T, S):
    lab(f, "THE RECORDING", 540, 300, t, T.w("lying") - 0.15, "dark", 58)
    lab(f, "ISN'T LYING", 540, 400, t, T.w("lying"), "orange", 58)


beat("b11", "VOICE MESSAGE", "void", [N("But here's the strange part. The recording isn't *lying* to you.")], b11, over=b11o, music="curious",
     notes=dict(action="He stares at the phone, then thinks (hand under chin)", camera="Push-in", sound="Pop on the label"))


def b12(T):
    te = T.w("everyone")
    pos = [(170, 1250), (330, 1210), (750, 1210), (910, 1250)]
    ex = [appear(C.stand, x, y, 1.4, 0.3 + 0.1 * k, seed=60 + k, facing=0.5 if x < 540 else -0.5) for k, (x, y) in enumerate(pos)]
    keys = [K(0, H(C.think)), K(te, H(C.stand, eye_size=1.3, brow_raise=1.0, look=(-1, 0)), "back"), K(T.dur, H(C.stand, eye_size=1.2, brow_raise=0.8, look=(1, 0)))]
    return dict(cam=[(0, 540, 920, 1.15), (T.dur, 540, 960, 1.0)], hero=hero(keys), extras=ex, sfx=[(te, "ding", 0.8)], pos=pos, te=te)


def b12o(f, cam, t, T, S):
    for k, (x, y) in enumerate(S["pos"]):
        if t > 0.6:
            WD.sound_arcs(f, cam, x + (30 if x < 540 else -30), y - 300, t, 0 if x < 540 else 180, WD.BLUE, 2, 0.8, 0.45, 0.8)
        sx, sy = cam.S(x, y - 420)
        WD.mark(f, "check", sx, sy, t, S["te"] + 0.1 * k, 44)


beat("b12", "VOICE MESSAGE", "void", [N("It's actually much closer to how *everyone else* hears you.")], b12, over=b12o, music="curious",
     notes=dict(action="Other people appear around him with check marks: the recording is how they hear him", camera="Pull-back",
                sound="Ding on 'everyone else'"))

# ============================================================================= PART 3 — THE TWO ROADS
def b13(T):
    ts = T.w("speak")
    keys = [K(0, H(C.think)), K(ts - 0.2, H(C.think)), K(ts + 0.2, H(C.point_self), "back"), K(T.dur, H(C.point_self))]
    return dict(cam=[(0, 540, 960, 1.0), (ts, 540, 930, 1.15), (T.dur, 540, 850, 3.2)], hero=hero(keys),
                sfx=[(T.dur - 0.9, "whoosh_up", 0.7)])


beat("b13", "TWO ROADS", "void", [N("To understand why, let's look at what happens every time you *speak*.")], b13, music="discovery", trans="fade",
     notes=dict(action="He points at his own head", camera="Fast zoom straight into his head", sound="Rising whoosh into the transition"))

DIAG = dict(show=1.0)


def diag_cam(T, a=(540, 900, 1.0), b=(540, 900, 1.06)):
    return [(0, *a), (T.dur, *b)]


def b14(T):
    return dict(cam=diag_cam(T, (540, 880, 1.0), (580, 1000, 1.12)), sfx=[(T.w("vibrate") - 0.1, "buzz", 0.8)])


def b14u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(show=WD.smooth(t / 0.5), cords=T.w("vibrate") - 0.15))


def b14o(f, cam, t, T, S):
    sx, sy = cam.S(*PR.CORDS)
    if t > T.w("vocal"):
        aa = WD.AA((sx - 20, sy - 20, sx + 260, sy + 200))
        aa.d.line(aa.pts([(sx + 30, sy + 10), (sx + 170, sy + 120)]), fill=(255, 255, 255, 220), width=8)
        aa.done(f)
    lab(f, "VOCAL CORDS", min(880, sx + 230), sy + 150, t, T.w("vocal"), "orange", 46)


beat("b14", "TWO ROADS", "science", [N("When you talk, your *vocal cords* vibrate.")], b14, under=b14u, over=b14o, music="discovery", trans="fade",
     notes=dict(action="X-ray head diagram; the vocal cords in the throat start vibrating", camera="Drift down toward the throat",
                sound="Soft vibration buzz"))


def b15(T):
    return dict(cam=diag_cam(T, (560, 960, 1.08), (540, 900, 1.0)), sfx=[(T.w("air"), "whoosh", 0.6)])


def b15u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=T.w("sound")))


def b15o(f, cam, t, T, S):
    lab(f, "ROAD 1: THROUGH THE AIR", 540, 250, t, T.w("air"), "blue", 50)


beat("b15", "TWO ROADS", "science", [N("Those vibrations push sound waves out of your mouth, through the air, and into your ears.")], b15, under=b15u, over=b15o,
     music="discovery", notes=dict(action="Blue sound waves leave the mouth and travel around through the air into the ear",
                                   camera="Ease out to show the whole head", sound="Whoosh on 'air'"))


def b16(T):
    return dict(cam=diag_cam(T, (540, 900, 1.0), (580, 960, 1.02)), sfx=[(T.w("other"), "pop", 0.7)])


def b16u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, listen=T.w("other")))


def b16o(f, cam, t, T, S):
    lab(f, "ROAD 1: THROUGH THE AIR", 540, 250, t, -1, "blue", 50)
    lab(f, "= HOW OTHERS HEAR YOU", 540, 350, t, T.w("other"), "light", 44)


beat("b16", "TWO ROADS", "science", [N("That's the *first road*. And it's exactly how other people hear you.")], b16, under=b16u, over=b16o, music="discovery",
     notes=dict(action="A second branch of air waves reaches a small listener", camera="Slight drift", sound="Pop as the listener appears"))


def b17(T):
    return dict(cam=diag_cam(T, (560, 920, 1.02), (520, 930, 1.06)), sfx=[(T.w("second"), "whoosh_up", 0.5)])


def b17u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, bone=T.w("second")))


def b17o(f, cam, t, T, S):
    lab(f, "ROAD 1: THROUGH THE AIR", 540, 250, t, -1, "blue", 50)
    lab(f, "ROAD 2: THROUGH YOUR BONES", 540, 350, t, T.w("second"), "orange", 50)


beat("b17", "TWO ROADS", "science", [N("But there's a *second road*. One that only you have.")], b17, under=b17u, over=b17o, music="discovery",
     notes=dict(action="Orange vibrations start moving inside the head", camera="Slow drift", sound="Soft riser"))

BONE_LABELS = [("throat", "THROAT", (690, 1260)), ("jaw", "JAW", (560, 1130)), ("skull", "SKULL", (240, 640)), ("inner", "INNER EAR", (520, 770))]


def b18(T):
    return dict(cam=diag_cam(T, (520, 930, 1.06), (500, 920, 1.1)), sfx=[(T.w(w), "pop", 0.6) for w, _, _ in BONE_LABELS])


def b18u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, bone=-2, merge=T.w("ear")))


def b18o(f, cam, t, T, S):
    for w, text, (x, y) in BONE_LABELS:
        sx, sy = cam.S(x, y)
        lab(f, text, sx, sy, t, T.w(w), "orange", 38)


beat("b18", "TWO ROADS", "science", [N("The same vibrations travel through your throat, your jaw, and the bones of your skull, straight to your inner ear.")],
     b18, under=b18u, over=b18o, music="discovery",
     notes=dict(action="Orange pulses travel throat → jaw → skull → inner ear; each part is labelled as it's named", camera="Slow push-in",
                sound="Small pops on each label"))


def b19(T):
    return dict(cam=diag_cam(T, (500, 920, 1.1), (520, 930, 1.04)), sfx=[(T.w("bone"), "ding", 0.9)])


def b19u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, bone=-2, merge=-1))


def b19o(f, cam, t, T, S):
    lab(f, "BONE CONDUCTION", 540, 300, t, T.w("bone"), "orange", 72)


beat("b19", "TWO ROADS", "science", [N("Scientists call this *bone conduction*.")], b19, under=b19u, over=b19o, music="discovery",
     notes=dict(action="Big title: BONE CONDUCTION", camera="Ease out", sound="Ding"))


def b20(T):
    return dict(cam=diag_cam(T, (520, 990, 1.04), (520, 990, 1.0)), sfx=[(T.w("low"), "bass_drop", 0.9)])


def b20u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, bone=-2, merge=-1, show=0.55))


def b20o(f, cam, t, T, S):
    u = WD.back((t - T.w("low")) / 0.6)
    vals = [0.95 * u, 0.85 * u, 0.62 * u, 0.4 * u, 0.24 * u, 0.15 * u]
    if t > T.w("skull") - 0.2:
        aa = WD.AA((150, 160, 930, 760))
        aa.d.rounded_rectangle(aa.pts([(170, 180), (910, 740)]), radius=60, fill=(10, 18, 34, 200), outline=(255, 140, 40, 200), width=8)
        aa.done(f)
        WD.freq_bars(f, (240, 280, 840, 620), vals, ("LOW", "HIGH"))
    lab(f, "SKULL = BASS BOOST", 540, 820, t, T.w("low"), "orange", 48)


beat("b20", "TWO ROADS", "science", [N("And your skull is especially good at carrying the *low, deep* notes.")], b20, under=b20u, over=b20o, music="discovery",
     notes=dict(action="Frequency bars: the low notes shoot up", camera="Static", sound="Deep bass note on 'low'"))

WORDS3 = [("deeper", "DEEPER"), ("fuller", "FULLER"), ("richer", "RICHER")]


def b21(T):
    return dict(cam=diag_cam(T, (520, 930, 1.0), (540, 900, 1.08)), sfx=[(T.w(w), "pop", 0.8) for w, _ in WORDS3])


def b21u(f, cam, t, T, S):
    PR.head_diagram(f, cam, t, dict(cords=0, air=-3, bone=-2, merge=T.w("mix") - 0.2))


def b21o(f, cam, t, T, S):
    for k, (w, text) in enumerate(WORDS3):
        lab(f, text, 540, 260 + k * 105, t, T.w(w), "dark" if k != 1 else "orange", 56)


beat("b21", "TWO ROADS", "science", [N("So the voice you hear in your head is a mix of both roads. *Deeper.* *Fuller.* *Richer.*")], b21, under=b21u, over=b21o,
     music="discovery", notes=dict(action="Blue and orange meet at the ear and glow purple; three words pop in", camera="Slow push-in",
                                   sound="Three pops"))


def b22(T):
    keys = [K(0, H(C.stand, happy_eyes=1.0, mouth="smile", mouth_k=0.9)), K(T.dur, H(C.stand, happy_eyes=1.0, mouth="smile", mouth_k=0.9, tilt=6))]
    return dict(cam=[(0, 540, 980, 1.0), (T.dur, 540, 960, 1.06)], hero=hero(keys), sfx=[(0.3 + 0.25 * k, "page", 0.7) for k in range(8)])


def b22o(f, cam, t, T, S):
    PR.calendar(f, 540, 420, t, 0.25, 1, 365)
    WD.sound_arcs(f, cam, 575, 875, t, 0, WD.PURPLE, 3, 0.6, 0.8, 0.7)
    WD.sound_arcs(f, cam, 505, 875, t, 180, WD.PURPLE, 3, 0.6, 0.8, 0.7)


beat("b22", "TWO ROADS", "void", [N("It's the voice you've heard every single day of your life.")], b22, over=b22o, music="discovery", trans="fade",
     notes=dict(action="He smiles with his eyes closed, wrapped in his familiar purple voice; calendar pages flip", camera="Slow push-in",
                sound="Pages flipping"))

# ============================================================================= PART 4 — THE MICROPHONE
MX = 790


def b23(T):
    keys = [K(0, H(C.stand, x=380, facing=0.6, chatter=1.0, look=(1, 0))), K(T.dur, H(C.stand, x=380, facing=0.6, chatter=1.0, look=(1, 0)))]
    return dict(cam=[(0, 580, 960, 1.0), (T.dur, 590, 950, 1.05)], hero=hero(keys), sfx=[(T.w("first"), "ding", 0.7)])


def b23o(f, cam, t, T, S):
    PR.mic_stand(f, cam, MX, 1300, 1.0, glow=WD.clip01((t - T.w("first")) / 0.3))
    WD.sound_arcs(f, cam, 450, 880, t, 0, WD.BLUE, 3, 1.0, 0.8, 0.9)
    sx, sy = cam.S(MX, 760)
    WD.mark(f, "check", sx, sy - 130, t, T.w("first"), 50)


beat("b23", "MICROPHONE", "booth", [N("A microphone, though, only catches the *first road*.")], b23, over=b23o, music="discovery", trans="fade",
     notes=dict(action="In a studio booth he talks into a mic; blue air waves reach it (check)", camera="Slight push-in", sound="Ding on 'first road'"))


def b24(T):
    keys = [K(0, H(C.stand, x=380, facing=0.6, chatter=1.0, look=(1, 0))), K(T.dur, H(C.stand, x=380, facing=0.6, chatter=1.0, look=(1, 0)))]
    return dict(cam=[(0, 590, 950, 1.05), (T.dur, 520, 930, 1.12)], hero=hero(keys), sfx=[(T.w("skull"), "buzz", 0.9)])


def b24o(f, cam, t, T, S):
    PR.mic_stand(f, cam, MX, 1300, 1.0)
    (sx, sy), _ = head_xy(S["hero"], t, cam)
    aa = WD.AA((sx - 160, sy - 160, sx + 160, sy + 160))
    for k in range(3):
        r = (75 + k * 24 + 6 * math.sin(t * 14 + k)) * cam.z
        aa.d.ellipse(aa.pts([(sx - r, sy - r), (sx + r, sy + r)]), outline=WD.ORANGE + (int(200 - 50 * k),), width=10)
    aa.done(f)
    mx, my = cam.S(MX - 20, 830)
    aa = WD.AA((sx, my - 30, mx, my + 30))
    for k in range(8):
        x0 = sx + 90 * cam.z + k * (mx - sx - 90 * cam.z) / 8
        aa.d.line(aa.pts([(x0, my), (x0 + 20, my)]), fill=WD.ORANGE + (200,), width=12)
    aa.done(f)
    WD.mark(f, "x", (sx + mx) / 2 + 40, my, t, T.w("skull"), 60)


beat("b24", "MICROPHONE", "booth", [N("It can't hear the vibrations inside your *skull*.")], b24, over=b24o, music="discovery",
     notes=dict(action="Orange vibrations ring his head but never reach the mic (red X)", camera="Push-in", sound="Error buzz on 'skull'"))


def b25(T):
    keys = [K(0, H(C.stand, x=380, facing=0.4)), K(T.dur, H(C.stand, x=380, facing=0.4, brow_angle=-0.6, mouth="frown", mouth_k=0.5))]
    return dict(cam=[(0, 520, 930, 1.12), (T.dur, 540, 960, 1.0)], hero=hero(keys), sfx=[(T.w("gone"), "deflate", 1.0)])


def b25o(f, cam, t, T, S):
    PR.mic_stand(f, cam, MX, 1300, 1.0)
    u = WD.smooth((t - T.w("gone")) / 0.5)
    vals = [0.95 - 0.85 * u, 0.85 - 0.7 * u, 0.62 - 0.35 * u, 0.4, 0.3, 0.24]
    aa = WD.AA((150, 160, 930, 760))
    aa.d.rounded_rectangle(aa.pts([(170, 180), (910, 740)]), radius=60, fill=(16, 18, 28, 215), outline=(64, 156, 255, 220), width=8)
    aa.done(f)
    WD.freq_bars(f, (240, 280, 840, 620), vals, ("LOW", "HIGH"), color=WD.BLUE)
    lab(f, "BASS: GONE", 540, 820, t, T.w("gone"), "red", 54)


beat("b25", "MICROPHONE", "booth", [N("So when you play it back, those deep notes are *gone*.")], b25, over=b25o, music="discovery",
     notes=dict(action="The recording's low-frequency bars collapse", camera="Ease out", sound="Descending 'deflate' tone"))


def b26(T):
    tu = T.w("unfamiliar")
    keys = [K(0, H(C.stand, x=380, facing=0.4, brow_angle=-0.6)), K(tu, H(C.stand, x=380, facing=0.4, brow_angle=-0.6)), K(tu + 0.25, H(C.cringe, x=380), "back"), K(T.dur, H(C.cringe, x=380))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 520, 940, 1.06)], hero=hero(keys), sfx=[(T.w("thinner"), "pop", 0.7), (T.w("higher"), "pop", 0.7)])


def b26o(f, cam, t, T, S):
    PR.mic_stand(f, cam, MX, 1300, 1.0)
    WD.waveform(f, (150, 250, 930, 430), t, thick=0.15, color=WD.BLUE, bg=(255, 255, 255, 230))
    lab(f, "THINNER", 330, 540, t, T.w("thinner"), "blue", 54)
    lab(f, "HIGHER", 750, 540, t, T.w("higher"), "blue", 54)


beat("b26", "MICROPHONE", "booth", [N("What's left sounds *thinner*, *higher*, and strangely unfamiliar.")], b26, over=b26o, music="discovery",
     notes=dict(action="A thin waveform; THINNER / HIGHER pop; he cringes", camera="Slight push", sound="Two pops"))


def b27(T):
    ti = T.w("impression")
    hk = [K(0, H(C.cross_arms, x=330)), K(T.dur, H(C.cross_arms, x=330, brow_angle=0.9))]
    ik = [K(0, C.stand(x=760, y=1300, scale=2.0, facing=-0.4)), K(ti - 0.2, C.stand(x=760, y=1300, scale=2.0, facing=-0.4)),
          K(ti + 0.05, C.wave(k=0, x=760, y=1300, scale=2.0, facing=-0.4), "back"), K(ti + 0.3, C.wave(k=1, x=760, y=1300, scale=2.0, facing=-0.4)),
          K(ti + 0.55, C.wave(k=0, x=760, y=1300, scale=2.0, facing=-0.4)), K(ti + 0.8, C.wave(k=1, x=760, y=1300, scale=2.0, facing=-0.4)),
          K(T.dur, C.excited(x=760, y=1300, scale=2.0, yoff=10, facing=-0.4))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 940, 1.05)], hero=hero(hk), extras=[extra(ik, seed=77)], sfx=[(ti - 0.05, "wahwah", 1.0)])


def b27o(f, cam, t, T, S):
    (sx, sy), p = head_xy(S["extras"][0], t, cam)
    z = cam.z * 2.0
    aa = WD.AA((sx - 90 * z, sy - 70 * z, sx + 90 * z, sy + 120 * z))
    for s_ in (-1, 1):
        aa.d.ellipse(aa.pts([(sx + s_ * 11 * z - 9 * z, sy - 9 * z), (sx + s_ * 11 * z + 9 * z, sy + 9 * z)]), outline=WD.INK, width=int(5 * z))
    aa.d.line(aa.pts([(sx - 2 * z, sy), (sx + 2 * z, sy)]), fill=WD.INK, width=int(4 * z))
    aa.d.chord(aa.pts([(sx - 16 * z, sy + 6 * z), (sx + 16 * z, sy + 22 * z)]), 180, 360, fill=WD.INK)
    ny = sy + 32 * z
    aa.d.rectangle(aa.pts([(sx - 12 * z, ny), (sx + 12 * z, ny + 9 * z)]), fill=(250, 170, 120), outline=WD.INK, width=int(2 * z))
    aa.done(f)
    lab(f, "BAD IMPRESSION", 760, 380, t, T.w("impression"), "dark", 52)


beat("b27", "MICROPHONE", "void", [N("Like a stranger doing a *bad impression* of you.")], b27, over=b27o, music="curious", trans="fade",
     notes=dict(action="A grey impostor with fake glasses and mustache does an over-the-top impression; our stickman crosses his arms, unimpressed",
                camera="Static two-shot", sound="Comic 'wah-wah' trombone"))

CARD_IN, CARD_REC = (130, 230, 950, 470), (130, 530, 950, 770)


def cards(f, t, active, appear_at):
    if t < appear_at:
        return
    for k, (box, name, col, thick) in enumerate(((CARD_IN, "IN YOUR HEAD", WD.PURPLE, 1.0), (CARD_REC, "RECORDING", WD.BLUE, 0.15))):
        x0, y0, x1, y1 = box
        on = active == k
        aa = WD.AA((x0 - 20, y0 - 20, x1 + 20, y1 + 20))
        aa.d.rounded_rectangle(aa.pts([(x0, y0), (x1, y1)]), radius=40, fill=(255, 255, 255, 240 if on else 170),
                               outline=(col if on else (180, 186, 196)) + (255,), width=14 if on else 6)
        aa.d.text(aa.T(x0 + 40, y0 + 46), name, font=WD.font(WD.FONT_XB, 96), fill=WD.INK if on else (150, 156, 166), anchor="lm")
        aa.done(f)
        WD.waveform(f, (x0 + 30, y0 + 80, x1 - 30, y1 - 20), t if on else 0.0, thick=thick, color=col if on else (190, 196, 206), seed=3 + k)


def b28(T):
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 960, 1.03)], hero=hero([K(0, H(C.headphones_listen, y=1330)), K(T.dur, H(C.headphones_listen, y=1330))]),
                sfx=[(T.w("difference"), "pop", 0.7), (T.w("head"), "ding", 0.6)])


def b28o(f, cam, t, T, S):
    cards(f, t, 0 if t > T.w("head") else None, T.w("difference"))
    lab(f, "SIMULATION", 540, 150, t, T.w("rough"), "yellow", 40)


beat("b28", "MICROPHONE", "void", [N("Here's a rough idea of the difference. First, something like the voice in your head.")], b28, over=b28o,
     music="curious", trans="fade",
     notes=dict(action="He wears headphones; two cards appear: IN YOUR HEAD (thick purple wave) and RECORDING (thin blue wave)",
                camera="Static", sound="Pop, ding"))


def b29(T):
    return dict(cam=[(0, 540, 960, 1.03), (T.dur, 540, 960, 1.05)],
                hero=hero([K(0, H(C.stand, y=1330, headphones=1.0, happy_eyes=1.0)), K(T.dur, H(C.stand, y=1330, headphones=1.0, happy_eyes=1.0))]))


def b29o(f, cam, t, T, S):
    cards(f, t, 0, -1)
    lab(f, "SIMULATION", 540, 150, t, -1, "yellow", 40)
    WD.sound_arcs(f, cam, 575, 905, t, 0, WD.PURPLE, 3, 0.9, 0.7, 0.8)


beat("b29", "MICROPHONE", "void", [CI("This is how I sound to me.")], b29, over=b29o, music="curious",
     notes=dict(action="He speaks; the 'in your head' version plays (warm, bass-boosted simulation)", camera="Static", sound="His inner-voice simulation"))


def b30(T):
    return dict(cam=[(0, 540, 960, 1.05), (T.dur, 540, 960, 1.05)], hero=hero([K(0, H(C.stand, y=1330, headphones=1.0)), K(T.dur, H(C.stand, y=1330, headphones=1.0, brow_raise=0.4))]),
                sfx=[(T.w("recording"), "click", 0.9)])


def b30o(f, cam, t, T, S):
    cards(f, t, 1 if t > T.w("recording") else 0, -1)
    lab(f, "SIMULATION", 540, 150, t, -1, "yellow", 40)


beat("b30", "MICROPHONE", "void", [N("And now, the recording.")], b30, over=b30o, music="curious",
     notes=dict(action="The RECORDING card lights up", camera="Static", sound="Click"))


def b31(T):
    keys = [K(0, H(C.stand, y=1330, headphones=1.0)), K(T.E(0), H(C.stand, y=1330, headphones=1.0)),
            K(T.E(0) + 0.3, H(C.stand, y=1330, headphones=1.0, eye_size=1.4, brow_raise=1.0, mouth="O", mouth_k=0.8), "back"),
            K(T.dur, H(C.stand, y=1330, headphones=1.0, eye_size=1.4, brow_raise=1.0, mouth="O", mouth_k=0.8))]
    return dict(cam=[(0, 540, 960, 1.05), (T.E(0), 540, 940, 1.1), (T.dur, 540, 900, 1.25)], hero=hero(keys))


def b31o(f, cam, t, T, S):
    cards(f, t, 1, -1)
    lab(f, "SIMULATION", 540, 150, t, -1, "yellow", 40)


beat("b31", "MICROPHONE", "void", [CR("This is how I sound to everyone else.", mouth=True)], b31, over=b31o, music="curious", pad=0.6,
     notes=dict(action="The thin 'recorded' version plays; he looks shocked", camera="Push-in", sound="His recorded-voice simulation"))

# ============================================================================= PART 5 — TRY IT
def b32(T):
    tf = T.w("fingers")
    keys = [K(0, H(C.stand, x=-80)), K(1.7, H(C.stand, x=470, facing=0.2)), K(tf - 0.2, H(C.stand, x=470)),
            K(tf + 0.25, H(C.fingers_in_ears, x=470), "back"), K(T.dur, H(C.fingers_in_ears, x=470))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 520, 940, 1.08)], hero=hero(keys, walks=[(0.0, 1.6, -80, 470)]),
                sfx=[(T.w("test"), "pop", 0.8)])


def b32o(f, cam, t, T, S):
    lab(f, "TRY IT!", 540, 320, t, T.w("test"), "yellow", 70)


beat("b32", "TRY IT", "park", [N("You can test this right now. Put your *fingers in your ears* and say something.")], b32, over=b32o, music="curious",
     trans="fade", amb=("birds", 1.0),
     notes=dict(action="He walks into a park and plugs his ears with his fingers", camera="Tracking, then slight push-in",
                sound="Footsteps, birds, pop on TRY IT"))


def b33(T):
    keys = [K(0, H(C.fingers_in_ears, x=470)), K(0.4, H(C.fingers_in_ears, x=470, eyes=1.0, look=(-1, 0), mouth="flat")),
            K(0.9, H(C.fingers_in_ears, x=470, eyes=1.0, look=(1, 0), mouth="flat")),
            K(T.dur - 0.3, H(C.fingers_in_ears, x=470, eyes=1.0, eye_size=1.3, look=(1, 0), brow_raise=1.0, mouth="flat"))]
    ek = [K(0, C.stand(x=1180, y=1240, scale=1.6)), K(1.7, C.stand(x=800, y=1240, scale=1.6, facing=-0.8)), K(T.dur, C.stand(x=800, y=1240, scale=1.6, facing=-0.8))]
    return dict(cam=[(0, 520, 940, 1.08), (T.dur, 600, 960, 1.0)], hero=hero(keys), extras=[extra(ek, walks=[(0.1, 1.6, 1180, 800)], seed=88)])


def b33o(f, cam, t, T, S):
    (sx, sy), _ = head_xy(S["extras"][0], t, cam)
    if t > 1.7:
        WD.mark(f, "?", sx, sy - 90 * cam.z, t, 1.75, 40)


beat("b33", "TRY IT", "park", [N("Go on. Nobody's watching.")], b33, over=b33o, music="curious", amb=("birds", 1.0),
     notes=dict(action="He glances around... a passer-by stops and stares at him", camera="Slow pan", sound="Passer-by footsteps"))


def b34(T):
    return dict(cam=[(0, 600, 960, 1.0), (T.dur, 520, 930, 1.1)], hero=hero([K(0, H(C.fingers_in_ears, x=470, eyes=1.0, eye_size=1.2)), K(T.dur, H(C.fingers_in_ears, x=470))]),
                sfx=[(T.w("deep"), "bass_drop", 0.8), (T.w("cuts"), "buzz", 0.7), (T.w("bone", 0), "ding", 0.6)])


def b34o(f, cam, t, T, S):
    (sx, sy), _ = head_xy(S["hero"], t, cam)
    aa = WD.AA((sx - 260, sy - 260, sx + 260, sy + 260))
    for k in range(3):
        ph = (t * 0.9 + k / 3) % 1
        r = (90 + ph * 140) * cam.z
        aa.d.ellipse(aa.pts([(sx - r, sy - r), (sx + r, sy + r)]), outline=WD.ORANGE + (int(220 * (1 - ph)),), width=14)
    aa.done(f)
    aa = WD.AA((130, 170, 950, 560))
    aa.d.rounded_rectangle(aa.pts([(150, 190), (930, 540)]), radius=50, fill=(255, 255, 255, 235), outline=WD.INK, width=10)
    aa.d.text(aa.T(210, 285), "AIR ROAD", font=WD.font(WD.FONT_XB, 112), fill=WD.BLUE, anchor="lm")
    aa.d.text(aa.T(210, 445), "BONE ROAD", font=WD.font(WD.FONT_XB, 112), fill=WD.ORANGE, anchor="lm")
    aa.done(f)
    WD.mark(f, "x", 820, 285, t, T.w("cuts"), 52)
    WD.mark(f, "check", 820, 445, t, T.w("bone", 0), 52)


beat("b34", "TRY IT", "park", [N("Hear how *deep* and boomy it sounds? Blocking your ears cuts out most of the air road, so you mostly hear the bone road.")],
     b34, over=b34o, music="curious", amb=("birds", 0.8),
     notes=dict(action="Orange bass rings pulse around his head; panel shows AIR ROAD blocked, BONE ROAD open", camera="Push-in",
                sound="Bass hit, buzz on 'cuts', ding on 'bone road'"))


def b35(T):
    tb = T.w("bass")
    keys = [K(0, H(C.fingers_in_ears, x=470)), K(tb - 0.15, H(C.stand, x=470, yoff=-6)), K(tb + 0.15, H(C.excited, x=470, yoff=60), "out"),
            K(tb + 0.45, H(C.excited, x=470, yoff=0), "in"), K(T.dur, H(C.excited, x=470))]
    return dict(cam=[(0, 520, 930, 1.1), (T.dur, 540, 960, 1.0)], hero=hero(keys), sfx=[(T.w("hidden"), "ding", 0.9)])


def b35o(f, cam, t, T, S):
    lab(f, "HIDDEN BASS", 540, 330, t, T.w("hidden"), "orange", 70)


beat("b35", "TRY IT", "park", [N("That's the *hidden bass* you never knew was there.")], b35, over=b35o, music="curious", amb=("birds", 0.8),
     notes=dict(action="He jumps with excitement", camera="Ease out", sound="Ding"))

# ============================================================================= PART 6 — THE PSYCHOLOGY
def b36(T):
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 920, 1.12)], hero=hero([K(0, H(C.think)), K(T.dur, H(C.think, tilt=-8))]),
                sfx=[(T.w("different"), "pop", 0.7), (T.w("cringe"), "pop", 0.7)])


def b36o(f, cam, t, T, S):
    lab(f, "SOUNDS DIFFERENT", 500, 300, t, T.w("different"), "green", 54)
    WD.mark(f, "check", 880, 300, t, T.w("different") + 0.1, 46)
    lab(f, "BUT WHY THE CRINGE?", 540, 410, t, T.w("cringe"), "dark", 54)


beat("b36", "PSYCHOLOGY", "void", [N("But bone conduction only explains why a recording sounds *different*. It doesn't fully explain why it makes us *cringe*.")],
     b36, over=b36o, music="mystery", trans="fade",
     notes=dict(action="He thinks; labels: SOUNDS DIFFERENT ✓ / BUT WHY THE CRINGE?", camera="Slow push-in", sound="Pops"))

R1, R2 = (250, 1300), (830, 1300)


def b37(T):
    ex = [extra([K(0, C.stand(x=R1[0], y=R1[1], scale=1.9, facing=0.6)), K(T.dur, C.stand(x=R1[0], y=R1[1], scale=1.9, facing=0.6))], seed=91),
          extra([K(0, C.think(x=R2[0], y=R2[1], scale=1.9, facing=-0.6)), K(T.dur, C.think(x=R2[0], y=R2[1], scale=1.9, facing=-0.6))], seed=92)]
    return dict(cam=[(0, 540, 960, 1.05), (T.dur, 540, 960, 1.0)], extras=ex,
                sfx=[(0.1, "tape", 0.9), (T.w("1966"), "pop", 0.7)])


def b37o(f, cam, t, T, S):
    PR.tape_recorder(f, cam, 540, 915, t, True, 1.1)
    lab(f, "1966", 190, 170, t, T.w("1966"), "yellow", 64)
    lab(f, "PHILIP HOLZMAN", 290, 620, t, T.w("philip"), "light", 44)
    lab(f, "CLYDE ROUSEY", 800, 620, t, T.w("clyde"), "light", 44)


beat("b37", "PSYCHOLOGY", "lab1966", [N("In *1966*, two psychologists, Philip Holzman and Clyde Rousey, studied this exact feeling.")], b37, over=b37o,
     music="mystery", trans="fade",
     notes=dict(action="A retro psychology lab: two researchers and a spinning reel-to-reel tape recorder", camera="Slow pull-back",
                sound="Tape machine click and whir"))


def b38(T):
    ex = [extra([K(0, C.stand(x=R1[0], y=R1[1], scale=1.9, facing=0.6)), K(T.dur, C.stand(x=R1[0], y=R1[1], scale=1.9, facing=0.6))], seed=91),
          extra([K(0, C.think(x=R2[0], y=R2[1], scale=1.9, facing=-0.6)), K(T.dur, C.think(x=R2[0], y=R2[1], scale=1.9, facing=-0.6))], seed=92)]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 900, 1.12)], extras=ex, sfx=[(T.w("voice"), "ding", 0.9)])


def b38o(f, cam, t, T, S):
    PR.tape_recorder(f, cam, 540, 915, t, True, 1.1)
    lab(f, "VOICE", 540, 310, t, T.w("voice"), "dark", 76)
    lab(f, "CONFRONTATION", 540, 430, t, T.w("voice") + 0.12, "orange", 76)


beat("b38", "PSYCHOLOGY", "lab1966", [N("They called it *voice confrontation*.")], b38, over=b38o, music="mystery",
     notes=dict(action="Big title: VOICE CONFRONTATION", camera="Push-in", sound="Ding"))


def b39(T):
    ex = [extra([K(0, C.headphones_listen(x=270, y=1300, scale=1.9, facing=0.3)), K(T.dur, C.headphones_listen(x=270, y=1300, scale=1.9, facing=0.3))], seed=93)]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 520, 960, 1.03)], extras=ex, sfx=[(T.w("what"), "pop", 0.8)])


def b39o(f, cam, t, T, S):
    PR.tape_recorder(f, cam, 640, 915, t, True, 1.0)

    def content(aa, box):
        x0, y0, x1, y1 = box
        aa.d.text(aa.T((x0 + x1) / 2, y0 + 70), "WHAT is said", font=WD.font(WD.FONT_XB, 100), fill=WD.INK, anchor="mm")
        for k in range(3):
            yy = y0 + 150 + k * 46
            aa.d.rounded_rectangle(aa.pts([(x0 + 60, yy), (x1 - 60 - k * 70, yy + 22)]), radius=11, fill=(170, 176, 188))
    WD.bubble(f, 330, 360, 480, 330, t, 0.3, tail=(300, 600), think=True, content=content)


beat("b39", "PSYCHOLOGY", "lab1966", [N("When people heard someone else's recording, they paid attention to *what* was being said.")], b39, over=b39o,
     music="mystery", notes=dict(action="A grey listener with headphones thinks about the WORDS", camera="Static", sound="Pop on 'what'"))


def b40(T):
    td = T.w("didn't")
    ex = [extra([K(0, C.headphones_listen(x=270, y=1300, scale=1.9, facing=0.3)), K(T.dur, C.headphones_listen(x=270, y=1300, scale=1.9, facing=0.3))], seed=93)]
    keys = [K(0, H(C.headphones_listen, x=800, alpha=0.0)), K(0.2, H(C.headphones_listen, x=800, alpha=0.0)), K(0.55, H(C.headphones_listen, x=800)),
            K(td - 0.1, H(C.headphones_listen, x=800)), K(td + 0.25, H(C.cringe, x=800, headphones=1.0), "back"), K(T.dur, H(C.cringe, x=800, headphones=1.0))]
    return dict(cam=[(0, 520, 960, 1.03), (T.dur, 640, 940, 1.08)], extras=ex, hero=hero(keys),
                sfx=[(T.w("how"), "pop", 0.8), (td, "buzz", 0.8)])


def b40o(f, cam, t, T, S):
    def content(aa, box):
        x0, y0, x1, y1 = box
        aa.d.text(aa.T((x0 + x1) / 2, y0 + 70), "HOW it sounds", font=WD.font(WD.FONT_XB, 100), fill=WD.INK, anchor="mm")
    WD.bubble(f, 760, 380, 480, 330, t, T.w("how") - 0.1, tail=(790, 620), think=True, content=content)
    if t > T.w("how"):
        WD.waveform(f, (580, 430, 940, 510), t, thick=0.25, color=WD.BLUE)
    WD.mark(f, "x", 940, 250, t, T.w("didn't"), 56)


beat("b40", "PSYCHOLOGY", "lab1966", [N("But when they heard their own voice, they focused on *how* it sounded. And they didn't like it.")], b40, over=b40o,
     music="mystery", notes=dict(action="Our stickman listens to HIS voice, thinks about how it SOUNDS, and cringes", camera="Pan right",
                                 sound="Pop; buzz on 'didn't like it'"))

CLUES = [("nervous", "NERVOUS?"), ("hesitation", "UMM..."), ("clues", "LITTLE CLUES")]


def b41(T):
    keys = [K(0, H(C.stand, x=540, look=(0, -1), brow_angle=-0.8)), K(T.dur, H(C.stand, x=540, look=(0.5, -1), brow_angle=-1.0, mouth="frown", mouth_k=0.4))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 940, 1.06)], hero=hero(keys), sfx=[(T.w(w), "pop", 0.8) for w, _ in CLUES])


def b41o(f, cam, t, T, S):
    WD.waveform(f, (110, 250, 970, 470), t, thick=0.5, color=WD.BLUE, bg=(255, 255, 255, 235), seed=9)
    u = WD.clip01((t - T.w("reveal")) / max(0.5, T.w("clues") - T.w("reveal") + 0.5))
    PR.magnifier(f, 200 + 640 * u, 360, 95)
    for k, (w, text) in enumerate(CLUES):
        lab(f, text, 230 + k * 310, 590, t, T.w(w), "red" if k < 2 else "dark", 42)


beat("b41", "PSYCHOLOGY", "lab1966", [N("The researchers suggested that recordings reveal things we don't notice while we're talking. A *nervous* tone. A hesitation. Little clues about how we come across.")],
     b41, over=b41o, music="mystery",
     notes=dict(action="A magnifying glass scans his voice waveform and finds NERVOUS? / UMM... / LITTLE CLUES; he looks worried",
                camera="Slow push-in", sound="A pop per clue"))


def b42(T):
    te = T.E(0)
    keys = [K(0, H(C.stand, look=(0, -1))), K(te - 0.4, H(C.stand, look=(0, -1), brow_raise=0.5, mouth="smile", mouth_k=0.5)), K(te, H(C.sad), "io"), K(T.dur, H(C.sad))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 940, 1.06)], hero=hero(keys), sfx=[(T.E(0) - 0.25, "pop", 1.0)], te=te)


def b42o(f, cam, t, T, S):
    end = S["te"] - 0.25
    WD.bubble(f, 540, 420, 520, 470, t, 0.2, until=end, tail=(560, 700), think=True)
    PR.thought_mini_hero(f, 540, 600, t, 0.45, end, lambda: C.confident(), 0.85)
    PR.burst(f, 540, 420, t, end)


beat("b42", "PSYCHOLOGY", "void", [N("Things that don't match the *confident* voice we hear in our heads.")], b42, over=b42o, music="mystery", trans="fade",
     notes=dict(action="He imagines a confident version of himself in a thought bubble — the bubble pops and he deflates", camera="Static",
                sound="Bubble pop"))

# ============================================================================= MIRROR
MIR_X0 = WD.MIRROR[0]


def mirror_pose(p):
    q = dict(p)
    q["x"] = 2 * MIR_X0 - p["x"]
    q["facing"] = -p["facing"]
    q["lean"], q["tilt"] = -p["lean"], -p["tilt"]
    a0, a1 = p["arms"]
    q["arms"] = ((-a1[0], -a1[1]), (-a0[0], -a0[1]))
    l0, l1 = p["legs"]
    q["legs"] = ((-l1[0], -l1[1]), (-l0[0], -l0[1]))
    q["look"] = (-p["look"][0], p["look"][1])
    q["scarf"] = -p.get("scarf", 0)
    return q


def draw_reflection(f, cam, track, t):
    p = mirror_pose(track.pose(t))
    img, (ox, oy) = C.render(p, p["scale"] * cam.z)
    layer = Image.new("RGBA", f.size, (0, 0, 0, 0))
    sx, sy = cam.S(p["x"], p["y"])
    WD.paste(layer, img, sx + ox, sy + oy)
    x0, y0, x1, y1 = WD.MIRROR
    a, b = cam.S(x0 + 6, y0 + 6)
    c, d = cam.S(x1 - 6, y1 - 6)
    box = (int(a), int(b), int(c), int(d))
    region = layer.crop(box)
    region.putalpha(region.getchannel("A").point(lambda v: int(v * 0.85)))
    f.alpha_composite(region, (box[0], box[1]))


def b43(T):
    return dict(cam=[(0, 600, 960, 1.0), (T.dur, 580, 940, 1.06)], hero=hero([K(0, H(C.stand, x=300, facing=0.7, look=(1, 0))), K(T.dur, H(C.stand, x=300, facing=0.7, look=(1, 0), mouth="smile", mouth_k=0.6))]),
                sfx=[(T.w("photos"), "shutter", 1.0)])


def b43u(f, cam, t, T, S):
    draw_reflection(f, cam, S["hero"], t)


def b43o(f, cam, t, T, S):
    PR.flash(f, 0.8 * max(0.0, 1 - abs(t - T.w("photos") - 0.05) / 0.18))


beat("b43", "MIRROR", "bathroom", [N("Something similar happens with *photos*.")], b43, under=b43u, over=b43o, music="curious", trans="fade",
     notes=dict(action="He checks himself in the mirror (reflection mirrored); camera flash", camera="Slight push-in", sound="Camera shutter"))


def b44(T):
    return dict(cam=[(0, 580, 940, 1.06), (T.dur, 580, 960, 1.0)], hero=hero([K(0, H(C.stand, x=300, facing=0.7, look=(1, 0))), K(T.dur, H(C.stand, x=300, facing=0.5, look=(0.5, -1)))]),
                sfx=[(T.w("1977"), "pop", 0.7), (T.w("normal"), "shutter", 0.9), (T.w("mirror-flipped"), "shutter", 0.9)])


def b44u(f, cam, t, T, S):
    draw_reflection(f, cam, S["hero"], t)


def b44o(f, cam, t, T, S):
    lab(f, "1977", 170, 160, t, T.w("1977"), "yellow", 60)
    PR.photo_card(f, 330, 520, t, T.w("normal"), False, "NORMAL")
    PR.photo_card(f, 750, 520, t, T.w("mirror-flipped"), True, "FLIPPED")


beat("b44", "MIRROR", "bathroom", [N("In a *1977* experiment, researchers showed a group of students two photos of their own face: a normal one, and a *mirror-flipped* one.")],
     b44, under=b44u, over=b44o, music="curious",
     notes=dict(action="Two photo cards pop up: NORMAL and FLIPPED (his hair curl and scarf swap sides)", camera="Ease out", sound="Shutter clicks"))


def b45(T):
    tf, tn = T.w("flipped"), T.w("normal")
    fr = appear(C.stand, 870, 1300, 1.9, T.w("friends") - 0.2, seed=101, facing=-0.5)
    keys = [K(0, H(C.stand, x=300, facing=0.5, look=(0.5, -1))), K(tf, H(C.stand, x=300, facing=0.5, look=(1, -1), mouth="smile", mouth_k=0.8)), K(T.dur, H(C.stand, x=300, facing=0.5, look=(0.5, -1), mouth="smile", mouth_k=0.8))]
    return dict(cam=[(0, 580, 960, 1.0), (T.dur, 600, 960, 1.0)], hero=hero(keys), extras=[fr], sfx=[(tf, "pop", 0.8), (tn, "pop", 0.8)])


def b45u(f, cam, t, T, S):
    draw_reflection(f, cam, S["hero"], t)


def b45o(f, cam, t, T, S):
    PR.photo_card(f, 330, 520, t, -1, False, "NORMAL", heart_at=T.w("normal"))
    PR.photo_card(f, 750, 520, t, -1, True, "FLIPPED", heart_at=T.w("flipped"))


beat("b45", "MIRROR", "bathroom", [N("Most preferred the *flipped* one: the face they see in the mirror every day. But their close friends preferred the *normal* photo.")],
     b45, under=b45u, over=b45o, music="curious",
     notes=dict(action="A heart goes on FLIPPED (his pick); a friend appears and hearts NORMAL", camera="Static", sound="Two pops"))


def b46(T):
    fr = extra([K(0, C.stand(x=870, y=1300, scale=1.9, facing=-0.5)), K(T.dur, C.stand(x=870, y=1300, scale=1.9, facing=-0.5, tilt=-10))], seed=101)
    keys = [K(0, H(C.stand, x=300, facing=0.5, mouth="smile", mouth_k=0.8)), K(T.dur * 0.5, H(C.stand, x=300, facing=0.5, tilt=10, mouth="smile", mouth_k=0.8)), K(T.dur, H(C.stand, x=300, facing=0.5, mouth="smile", mouth_k=0.8))]
    return dict(cam=[(0, 600, 960, 1.0), (T.dur, 590, 950, 1.03)], hero=hero(keys), extras=[fr])


def b46u(f, cam, t, T, S):
    draw_reflection(f, cam, S["hero"], t)


def b46o(f, cam, t, T, S):
    g = 0.5 + 0.5 * math.sin(t * 5)
    PR.photo_card(f, 330, 520, t, -1, False, "NORMAL", heart_at=-1, glow=g)
    PR.photo_card(f, 750, 520, t, -1, True, "FLIPPED", heart_at=-1, glow=g)


beat("b46", "MIRROR", "bathroom", [N("Each side liked the version they were *used to*.")], b46, under=b46u, over=b46o, music="curious",
     notes=dict(action="Both photos glow; he and his friend nod", camera="Static", sound="—"))


def b47(T):
    keys = [K(0, H(C.stand, x=840, s=1.8)), K(T.w("familiar") - 0.2, H(C.stand, x=840, s=1.8)), K(T.w("familiar") + 0.2, H(C.point_left, x=840, s=1.8), "back"), K(T.dur, H(C.point_left, x=840, s=1.8))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 960, 1.02)], hero=hero(keys), sfx=[(T.w("mere"), "ding", 0.9)])


def b47o(f, cam, t, T, S):
    lab(f, "MERE EXPOSURE", 540, 200, t, T.w("mere"), "orange", 64)
    lab(f, "EFFECT", 540, 310, t, T.w("mere") + 0.15, "orange", 64)
    PR.graph_rising(f, (160, 470, 680, 880), t, T.w("familiar") - 0.2)


beat("b47", "MIRROR", "void", [N("Psychologists call this the *mere exposure effect*. The more familiar something is, the more we tend to like it.")],
     b47, over=b47o, music="curious", trans="fade",
     notes=dict(action="Title MERE EXPOSURE EFFECT; he points at a graph: familiarity up → liking up", camera="Static", sound="Ding"))


def b48(T):
    tw = T.w("wrong")
    keys = [K(0, H(C.phone_record, look=(0.5, 0.5))), K(tw - 0.2, H(C.phone_record, look=(0.5, 0.5))), K(tw + 0.2, H(C.phone_record, brow_angle=-1, mouth="frown", mouth_k=0.6))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 940, 1.06)], hero=hero(keys), sfx=[(tw, "buzz", 0.9)])


def b48o(f, cam, t, T, S):
    def inner(aa, box):
        x0, y0, x1, y1 = box
        aa.d.text(aa.T((x0 + x1) / 2, y0 + 60), "IN MY HEAD", font=WD.font(WD.FONT_XB, 92), fill=WD.PURPLE, anchor="mm")
    WD.bubble(f, 330, 360, 440, 300, t, 0.3, tail=(470, 700), think=True, content=inner)
    if t > 0.6:
        WD.waveform(f, (160, 400, 500, 480), t, thick=1.0, color=WD.PURPLE)
        WD.mark(f, "check", 520, 260, t, 0.7, 40)
    lab(f, "THE REAL ONE", 740, 560, t, T.w("real"), "blue", 46)
    if t > T.w("real"):
        WD.waveform(f, (620, 620, 960, 700), t, thick=0.15, color=WD.BLUE)
    WD.mark(f, "x", 1000, 640, t, T.w("wrong"), 44)


beat("b48", "MIRROR", "void", [N("And your voice works the same way. You're used to the version in your head, so the real one sounds *wrong*.")],
     b48, over=b48o, music="curious",
     notes=dict(action="Thought bubble: IN MY HEAD (thick wave ✓) vs THE REAL ONE (thin wave ✗)", camera="Slight push-in", sound="Buzz on 'wrong'"))

# ============================================================================= PART 7 — THE TWIST
def b49(T):
    tt = T.w("twist")
    keys = [K(0, H(C.stand)), K(tt - 0.1, H(C.stand)), K(tt + 0.2, H(C.shocked), "back"), K(T.dur, H(C.shocked))]
    return dict(cam=[(0, 540, 960, 1.0), (tt, 540, 950, 1.05), (tt + 0.3, 540, 880, 1.4), (T.dur, 540, 880, 1.42)], hero=hero(keys),
                sfx=[(0.0, "riser", 0.9), (tt, "impact", 0.7)], tt=tt)


def b49o(f, cam, t, T, S):
    (sx, sy), _ = head_xy(S["hero"], t, cam)
    PR.spotlight(f, sx, sy + 120 * cam.z, 320 * cam.z, 0.75)
    lab(f, "THE TWIST", 540, 330, t, S["tt"], "yellow", 80)


beat("b49", "TWIST", "void", [N("But here's the *twist*.")], b49, over=b49o, music="curious", trans="fade", pad=0.5,
     notes=dict(action="Spotlight; he's shocked; THE TWIST", camera="Snap zoom", sound="Riser into impact"))


def b50(T):
    keys = [K(0, H(C.headphones_listen, x=330, y=1320, s=1.9)), K(T.dur, H(C.headphones_listen, x=330, y=1320, s=1.9))]
    return dict(cam=[(0, 540, 960, 1.04), (T.dur, 540, 940, 1.0)], hero=hero(keys),
                sfx=[(0.3 + 0.12 * k, "click", 0.4) for k in range(5)] + [(T.w("secretly"), "ding", 0.9), (T.w("eighty"), "pop", 0.7)])


def b50o(f, cam, t, T, S):
    PR.rating_screen(f, cam, WD.SCREEN_2013, t, dict(rows_at=0.3, you_at=T.w("secretly")))
    lab(f, "2013", 900, 120, t, T.w("2013"), "yellow", 56)
    lab(f, "80 PEOPLE", 760, 760, t, T.w("eighty"), "dark", 50)


beat("b50", "TWIST", "lab2013", [N("In *2013*, researchers asked *eighty* people to rate how attractive a set of recorded voices sounded. Their own voice was *secretly* mixed in.")],
     b50, over=b50o, music="uplift", trans="fade",
     notes=dict(action="He rates voices with headphones in a modern lab; one row secretly turns out to be YOU", camera="Gentle pull-back",
                sound="UI clicks; ding on 'secretly'"))


def b51(T):
    ta = T.w("attractive")
    keys = [K(0, H(C.headphones_listen, x=330, y=1320, s=1.9)), K(ta, H(C.stand, x=330, y=1320, s=1.9, headphones=1.0, eye_size=1.3, brow_raise=1.0, look=(1, -1)), "back"),
            K(T.dur, H(C.stand, x=330, y=1320, s=1.9, headphones=1.0, eye_size=1.3, brow_raise=1.0, look=(1, -1), mouth="O", mouth_k=0.6))]
    return dict(cam=[(0, 540, 940, 1.0), (T.dur, 540, 900, 1.08)], hero=hero(keys), sfx=[(T.w("result"), "whoosh_up", 0.6)])


def b51o(f, cam, t, T, S):
    PR.rating_screen(f, cam, WD.SCREEN_2013, t, dict(rows_at=-5, you_at=-5, bars_at=T.w("result")))


beat("b51", "TWIST", "lab2013", [N("The result? People rated their own voice as *more attractive* than other listeners did.")], b51, over=b51o, music="uplift",
     notes=dict(action="Bar chart: YOU rated your voice higher than OTHER LISTENERS did; he's surprised", camera="Push-in", sound="Soft riser"))


def b52(T):
    te = T.w("everyone")
    keys = [K(0, H(C.stand, x=330, y=1320, s=1.9, headphones=1.0, eye_size=1.3, brow_raise=1.0)), K(te, H(C.stand, x=330, y=1320, s=1.9, headphones=1.0, yoff=-6)),
            K(te + 0.25, H(C.excited, x=330, y=1320, s=1.9, headphones=1.0, yoff=50), "out"), K(te + 0.55, H(C.excited, x=330, y=1320, s=1.9, headphones=1.0), "in"),
            K(T.dur, H(C.excited, x=330, y=1320, s=1.9, headphones=1.0))]
    return dict(cam=[(0, 540, 900, 1.08), (T.dur, 540, 940, 1.0)], hero=hero(keys), sfx=[(te, "sparkle", 1.0)])


def b52o(f, cam, t, T, S):
    PR.rating_screen(f, cam, WD.SCREEN_2013, t, dict(rows_at=-5, you_at=-5, bars_at=-5, medal_at=T.w("everyone")))


beat("b52", "TWIST", "lab2013", [N("And more attractive than *everyone else's* voice.")], b52, over=b52o, music="uplift",
     notes=dict(action="A #1 medal lands on YOU; he jumps", camera="Ease out", sound="Sparkle"))


def b53(T):
    tk = T.w("knowing")
    keys = [K(0, H(C.phone_record, look=(0.5, 0.6))), K(tk - 0.3, H(C.phone_record, look=(0.5, 0.6))), K(tk + 0.2, H(C.stand, look=(0, 0), brow_raise=0.4, mouth="smile", mouth_k=0.4)),
            K(T.dur, H(C.stand, look=(0, 0), brow_raise=0.4, mouth="smile", mouth_k=0.5))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 900, 1.3)], hero=hero(keys))


beat("b53", "TWIST", "void", [N("So maybe the problem isn't your voice at all. Maybe it's *knowing* that it's yours.")], b53, music="emotional", trans="fade",
     notes=dict(action="He looks at his phone, then up at us with a small smile", camera="Slow emotional push-in", sound="Music turns to soft piano"))

# ============================================================================= PART 8 — ENDING
def b54(T):
    keys = [K(0, H(C.talk_mic, x=440, chatter=1.0)), K(T.dur, H(C.talk_mic, x=440, chatter=1.0))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 520, 940, 1.06)], hero=hero(keys), sfx=[(T.w("radio"), "on_air", 1.0)])


def b54o(f, cam, t, T, S):
    PR.on_air(f, cam, WD.ON_AIR, WD.clip01((t - T.w("radio")) / 0.2) * (0.85 + 0.15 * math.sin(t * 4)))
    lab(f, "THE CRINGE FADES", 540, 460, t, T.w("fades"), "orange", 56)


beat("b54", "ENDING", "radio", [N("The good news? The cringe *fades*. Radio hosts, singers, YouTubers... people who hear their own voice every day often get *used to it*.")],
     b54, over=b54o, music="emotional", trans="fade",
     notes=dict(action="He hosts a radio show; ON AIR lights up", camera="Slight push-in", sound="ON AIR click"))


def b55(T):
    keys = [K(0, H(C.talk_mic, x=440, chatter=1.0)), K(T.dur, H(C.talk_mic, x=440, chatter=1.0, mouth="smile"))]
    return dict(cam=[(0, 520, 940, 1.06), (T.dur, 540, 960, 1.0)], hero=hero(keys), sfx=[(0.2 + 0.45 * k, "click", 0.5) for k in range(5)])


def b55o(f, cam, t, T, S):
    PR.on_air(f, cam, WD.ON_AIR, 0.9)
    k = min(4, int(t / 0.45))
    lvl = max(0.08, 1.0 - 0.22 * k - 0.22 * WD.smooth((t - k * 0.45) / 0.3))
    PR.cringe_meter(f, 540, 480, t, lvl, k + 1)


beat("b55", "ENDING", "radio", [N("The more you hear it, the more normal it sounds.")], b55, over=b55o, music="emotional",
     notes=dict(action="A CRINGE meter drops with every replay", camera="Ease out", sound="Replay clicks"))

SX0, SX1 = 500, 1400


def b56(T):
    keys = [K(0, H(C.stand, x=SX0)), K(T.dur, H(C.stand, x=SX1, facing=0.6))]
    cam = [(0, SX0 + 80, 960, 1.0), (T.dur, SX1 + 80, 960, 1.0)]
    return dict(cam=cam, hero=hero(keys, walks=[(0.0, T.dur, SX0, SX1)]))


beat("b56", "ENDING", "street", [N("So next time you hear a recording of yourself, remember: that voice isn't worse. It's just the one you've never heard from the *outside*.")],
     b56, music="emotional", trans="fade", amb=("city", 1.0),
     notes=dict(action="He walks down a sunset street; camera tracks with him", camera="Tracking shot", sound="Footsteps, soft city ambience"))


def b57(T):
    keys = [K(0, H(C.stand, x=SX1)), K(2.0, H(C.stand, x=1700, facing=0.5)), K(T.dur, H(C.stand, x=1700, facing=0.5, mouth="smile", mouth_k=0.6))]
    fk = [K(0, C.stand(x=2050, y=1300, scale=1.9)), K(T.dur, C.stand(x=2250, y=1300, scale=1.9))]
    return dict(cam=[(0, SX1 + 80, 960, 1.0), (T.dur, 1900, 960, 1.0)], hero=hero(keys, walks=[(0.0, 2.0, SX1, 1700)]),
                extras=[extra(fk, walks=[(0.0, T.dur, 2050, 2250)], seed=111)])


beat("b57", "ENDING", "street", [N("It's the voice your friends recognize *instantly*.")], b57, music="emotional", amb=("city", 1.0),
     notes=dict(action="He spots a friend walking ahead", camera="Tracking shot", sound="Footsteps"))


def b58(T):
    tc = T.L(0)
    tturn = T.E(0) + 0.35
    keys = [K(0, H(C.stand, x=1700, facing=0.5)), K(tc, H(C.wave, k=0, x=1700)), K(tc + 0.25, H(C.wave, k=1, x=1700)), K(tc + 0.5, H(C.wave, k=0, x=1700)),
            K(tc + 0.75, H(C.wave, k=1, x=1700)), K(T.dur, H(C.stand, x=1700, facing=0.5, mouth="smile", mouth_k=1.0))]
    fk = [K(0, C.stand(x=2250, y=1300, scale=1.9)), K(tturn, C.stand(x=2250, y=1300, scale=1.9, facing=0.2)), K(tturn + 0.35, C.stand(x=2250, y=1300, scale=1.9, facing=-0.7)),
          K(tturn + 0.8, C.wave(k=0, x=2250, y=1300, scale=1.9, facing=-0.7)), K(tturn + 1.05, C.wave(k=1, x=2250, y=1300, scale=1.9, facing=-0.7)),
          K(T.dur, C.wave(k=0, x=2250, y=1300, scale=1.9, facing=-0.7))]
    return dict(cam=[(0, 1900, 960, 1.0), (T.dur, 1980, 960, 1.0)], hero=hero(keys), extras=[extra(fk, seed=111)],
                sfx=[(tturn + 0.9, "pop", 0.7)], tturn=tturn)


def b58o(f, cam, t, T, S):
    if T.L(0) <= t <= T.E(0) + 0.6:
        WD.sound_arcs(f, cam, 1760, 870, t, 0, WD.BLUE, 3, 1.2, 0.9, 0.9)
    sx, sy = cam.S(2250, 800)
    WD.mark(f, "heart", sx, sy - 40, t, S["tturn"] + 0.9, 46)


beat("b58", "ENDING", "street", [CV("Hey!"), N("That's the voice that makes someone *turn around* when you call their name.")], b58, over=b58o,
     music="emotional", amb=("city", 1.0),
     notes=dict(action="He calls 'Hey!'; his friend turns around and waves back; a heart pops", camera="Slow pan", sound="His call, pop"))


def b59(T):
    pos = [(1960, 1300), (2420, 1290), (2100, 1240)]
    ex = [extra([K(0, C.wave(k=0, x=2250, y=1300, scale=1.9, facing=-0.7)), K(T.dur, C.stand(x=2250, y=1300, scale=1.9, facing=-0.7))], seed=111)]
    ex += [appear(C.stand, x, y, 1.8 if y > 1260 else 1.6, 0.3 + 0.25 * k, seed=120 + k, facing=-0.4) for k, (x, y) in enumerate(pos)]
    keys = [K(0, H(C.stand, x=1700, facing=0.5, mouth="smile", mouth_k=1.0)), K(T.dur, H(C.stand, x=1780, facing=0.5, happy_eyes=1.0, mouth="smile", mouth_k=1.0))]
    return dict(cam=[(0, 1980, 960, 1.0), (T.dur, 2000, 940, 1.04)], hero=hero(keys, walks=[(0.2, 1.0, 1700, 1780)]), extras=ex,
                sfx=[(0.3 + 0.25 * k, "pop", 0.5) for k in range(3)] + [(0.2, "crowd", 0.7)])


def b59o(f, cam, t, T, S):
    for k, (x, y) in enumerate([(1960, 1300), (2420, 1290), (2100, 1240), (2250, 1300)]):
        sx, sy = cam.S(x, y - 520)
        WD.mark(f, "heart", sx, sy, t, 0.6 + 0.2 * k, 34)


beat("b59", "ENDING", "street", [N("Everyone in your life already *knows* that voice.")], b59, over=b59o, music="emotional", amb=("city", 0.8),
     notes=dict(action="More friends gather around, hearts above them", camera="Slow push-in", sound="Pops, friendly crowd murmur"))


def b60(T):
    tn = T.w("know")
    keys = [K(0, H(C.phone_ear, mouth="smile", mouth_k=0.3)), K(tn - 0.2, H(C.phone_ear, mouth="smile", mouth_k=0.3)),
            K(tn + 0.3, H(C.phone_ear, tilt=10, happy_eyes=1.0, mouth="smile", mouth_k=1.0)), K(T.dur, H(C.phone_ear, tilt=-4, happy_eyes=1.0, mouth="smile", mouth_k=1.0))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 900, 1.22)], hero=hero(keys), sfx=[(0.2, "click", 0.6)])


def b60o(f, cam, t, T, S):
    WD.sound_arcs(f, cam, 612, 862, t, 0, WD.BLUE, 3, 0.8, 0.6, 0.6)


beat("b60", "ENDING", "void", [N("Maybe it's time *you* got to know it too.")], b60, over=b60o, music="uplift", trans="fade",
     notes=dict(action="Alone, he plays his message again — and smiles", camera="Emotional push-in", sound="Click; music lifts"))


def b61(T):
    tc = T.w("comments")
    keys = [K(0, H(C.present, x=430)), K(tc - 0.2, H(C.present, x=430)), K(tc + 0.2, H(C.point_right, x=430, mouth="smile", mouth_k=0.8), "back"), K(T.dur, H(C.point_right, x=430, mouth="smile", mouth_k=0.8))]
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 960, 1.0)], hero=hero(keys), sfx=[(tc, "pop", 0.9)])


def b61o(f, cam, t, T, S):
    lab(f, "DO YOU HATE", 540, 280, t, 0.1, "dark", 66)
    lab(f, "YOUR RECORDED VOICE?", 540, 390, t, 0.3, "orange", 60)
    PR.comment_icon(f, 830, 840, t, T.w("comments"))


beat("b61", "ENDING", "void", [N("So... do you hate your recorded voice? Tell me in the *comments*.")], b61, over=b61o, music="uplift",
     notes=dict(action="He asks the viewer, then points at a comment bubble", camera="Static", sound="Pop"))


def b62(T):
    keys = [K(0, H(C.stand))]
    for k in range(6):
        keys.append(K(0.4 + k * 0.28, H(C.wave, k=k % 2)))
    keys.append(K(T.dur, H(C.stand, mouth="smile", mouth_k=1.0, happy_eyes=1.0)))
    return dict(cam=[(0, 540, 960, 1.0), (T.dur, 540, 940, 1.05)], hero=hero(keys), sfx=[(0.3, "pop", 0.8), (1.2, "ding", 0.6)])


def b62o(f, cam, t, T, S):
    lab(f, "FOLLOW FOR MORE", 540, 280, t, 0.3, "orange", 64)
    lab(f, "NEXT: WHY DOES TIME", 540, 420, t, 1.2, "dark", 48)
    lab(f, "FLY AS WE GET OLDER?", 540, 510, t, 1.35, "dark", 48)


beat("b62", "ENDING", "void", [N("And follow for more strange questions about your brain.")], b62, over=b62o, music="uplift", pad=2.2,
     notes=dict(action="He waves goodbye; teaser for the next episode", camera="Slow push-in", sound="Pop, ding; music resolves"))
