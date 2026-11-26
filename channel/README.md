# Stickman channel: production toolkit

Everything needed to produce premium, faceless, vertical (1080×1920, 60 fps) animated explainers with one consistent
original stickman. Everything is free and generated in code: art, animation, voices, music and sound effects.

## The brand character (`character.py`)

- Tall, slim stickman; every line has the same thickness; white circular head.
- **Minimal face:** two dot eyes and short eyebrows. A mouth appears only when an emotion or speech needs it.
- **Signature details:** an orange scarf whose tail flutters with movement (secondary motion), and one hair curl on top.
- Side characters ("extras") use the same rig in soft grey: faceless, with no scarf or curl, so the hero always stands out.
- Pose library: stand, think (hand under chin), confused (head tilt + shrug), shocked (hands up), excited (jump),
  point, point at self, sad, confident (hands on hips), phone to mouth / ear, fingers in ears, cringe, hands on head,
  wave, crossed arms, headphones, radio host. There's also a natural walk cycle.
- Animation: keyframes with easing and overshoot ("back"), breathing, blinks, head drift and the scarf's follow-through.
  Every frame at 60 fps is a unique pose, so motion stays smooth.

## Pipeline

| Step | File |
|---|---|
| Environments (painted at 1.5× resolution so camera zooms stay sharp), camera, labels, phone UI, waves | `world.py` |
| Props: animated head diagram (air vs bone conduction), tape recorder, mic, photo cards, graphs, rating screen… | `props.py` |
| Voices (Kokoro: `am_michael` narrator, `am_puck` stickman), Whisper word timing, voice effects, generated music cues, sound effects, mixing | `sound.py` |
| Mobile captions: 1–3 words at a time, spoken word in yellow, key words in orange | `captions.py` |
| Timeline, frame rendering, transitions, resumable parallel encoding, storyboard export | `engine.py` |
| An episode: script + storyboard + per-scene animation | `ep01_recorded_voice.py` |

## Make an episode

```bash
pip install kokoro-onnx soundfile faster-whisper scipy pillow numpy
# kokoro-v1.0.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
export KOKORO_DIR=/path/to/kokoro
python3 engine.py ep01_recorded_voice            # full render -> build/ep01_recorded_voice/ep01_recorded_voice.mp4
python3 engine.py ep01_recorded_voice --frames 10,20   # preview frames only
python3 engine.py ep01_recorded_voice --audio-only     # rebuild the soundtrack
```

The render is split into 10-second chunks, so if it is interrupted, running the same command again picks up where it stopped.

A new episode is a new `epNN_*.py` file with the same structure: `TITLE`, `HOOKS`, `SOURCES`, `YT_*`, `HASHTAGS` and a list of
`beat(...)` scenes (narration lines, environment, character keyframes, camera keys, props, sound effects, music cue).
