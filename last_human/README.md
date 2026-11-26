# What If You Were the Last Human Alive? (sample)

An animated sample of the first two chapters of the script (00:00–01:20), in a hand-drawn explainer style:
ink-and-watercolor scenes on cream paper, a stick figure animated drawing by drawing, and big hand-lettered keyword titles.

- `build/last_human_sample.mp4` is the finished video (1920×1080).
- `build/last_human_sample.srt` holds subtitles you can upload to YouTube.
- `build/walk_cycle_10_drawings.png` shows the 10 drawings that make one walk cycle.

## How it's made (all free)

| Part | How |
|---|---|
| Backgrounds | Generated free with Pollinations (`gen_bg.sh`, prompts in `backgrounds.txt`), then turned into ink + watercolor on paper by `tools/toonify.py` |
| Character animation | `make_video.py` draws the stick figure in code. It runs at 12 drawings per second, each shown for 2 video frames, like classic hand-drawn cartoons. One walk cycle is 10 drawings. |
| Narration | [Piper](https://github.com/rhasspy/piper) offline text-to-speech, voice `en_US-ryan-high` |
| Music & sound effects | Generated in code (ambient pad, explosion, footsteps, TV static, wind, clicks) |
| Titles | Patrick Hand font (SIL Open Font License, see `tools/fonts/`) |

## Rebuild

```bash
pip install piper-tts opencv-python-headless pillow numpy
# download the voice (en_US-ryan-high.onnx + .onnx.json) from huggingface.co/rhasspy/piper-voices
export PIPER_VOICE=/path/to/en_US-ryan-high.onnx
python3 make_video.py           # renders build/last_human_sample.mp4
python3 make_video.py --sheet   # renders the walk-cycle sheet
```

Each scene is defined in `make_video.py` (`scene(...)`) with its narration lines, background, titles and what the figure does,
so adding the next chapters means adding more `scene(...)` blocks.
