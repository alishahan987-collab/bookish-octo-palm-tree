# The Near-Death of Nvidia (1-minute sample)

An animated stickman story in 4K, in the style of stickman explainer channels: big round heads, stick limbs,
soft pastel scenes, speech bubbles, handwritten captions and black typewriter screens.

- `build/nvidia_story_4k.mp4` is the finished video (3840×2160, about 1 minute).
- `build/nvidia_story_4k.srt` holds subtitles for YouTube.
- `build/nvidia_story_sample.mp4` is the earlier 1080p version with full cartoon people (`cartoon.py`).
- `build/voice_samples.mp4` has the voice options; Michael (voice 1) was chosen.

## How it's made (all free)

| Part | How |
|---|---|
| Characters | `stickman.py` draws each person in code: hair, glasses, beard, shirt, with poses, expressions and a 10-drawing walk cycle. Mouths move with the voice. |
| Backgrounds | `backgrounds.py` draws every scene in code with a soft pastel palette, so it stays sharp in 4K |
| Voices | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0, fine for monetized YouTube): `am_michael` (narrator), `am_puck` (Jensen), `am_fenrir` (Sega's boss) |
| Music | A soft lo-fi electric-piano tune generated in code (no copyright claims). It plays quietly and dips further whenever someone speaks. |
| Sound effects | Generated in code (applause, heartbeat, typing, cash register, cheering, footsteps) |
| Font | Kalam (SIL Open Font License, see `tools/fonts/`) |

## Rebuild

```bash
pip install kokoro-onnx soundfile pillow numpy
# download kokoro-v1.0.onnx and voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
export KOKORO_DIR=/path/to/kokoro/files
python3 make_video.py               # 4K video (takes ~10 minutes)
python3 make_video.py --audio-only  # just the soundtrack + subtitles
```

The story is a list of `scene(...)` blocks in `make_video.py` (narration or dialogue lines, background, who is on screen and what they do),
so the next chapters (GeForce, CUDA, the AI boom) can be added the same way.
