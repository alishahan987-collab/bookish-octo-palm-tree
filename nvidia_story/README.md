# The Near-Death of Nvidia (1-minute sample)

A cartoon story in the style of animated business-history videos: cartoon characters, speech bubbles,
handwritten captions and black typewriter screens.

- `build/nvidia_story_sample.mp4` is the finished video (1920×1080, about 1 minute).
- `build/nvidia_story_sample.srt` holds subtitles for YouTube.

## How it's made (all free)

| Part | How |
|---|---|
| Characters | `cartoon.py` draws each person in code: hair, glasses, beard and clothes, with poses, expressions and a walk cycle. Mouths move with the voice. |
| Backgrounds | `backgrounds.py` draws every scene in code (stage, 1993 diner, lab, Tokyo office, office, store), so it stays sharp at full HD |
| Voices | [Piper](https://github.com/rhasspy/piper) offline TTS: `en_US-ryan-high` (narrator), `en_US-joe-medium` (Jensen), `en_US-norman-medium` (Sega's boss) |
| Music & effects | Generated in code |
| Font | Kalam (SIL Open Font License, see `tools/fonts/`) |

## Rebuild

```bash
pip install piper-tts pillow numpy
# put the three voice files (.onnx + .onnx.json) from huggingface.co/rhasspy/piper-voices in one folder
export PIPER_VOICES=/path/to/voices
python3 make_video.py
```

The story is a list of `scene(...)` blocks in `make_video.py` (narration or dialogue lines, background, who is on screen and what they do),
so the next chapters (GeForce, CUDA, the AI boom) can be added the same way.
