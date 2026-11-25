# Project notes for Claude

## Contents
- `night-float.html`: Night Float, a clinical shift simulator for USMLE practice (one self-contained HTML file).
- `agents/video-explainer-maker.json`: the user's "Video explainer maker" agent config. It turns a topic into a 30–60 s captioned video with music generated in code. The pipeline is a storyboard of 4–8 scenes, then parallel scene agents plus a music agent, then one reviewer, then at most one fix, then an ffmpeg join. Outputs are explainer.mp4, a preview GIF and a stills PNG.
- `agents/video-explainer-maker.prompt.md`: the user's current, preferred video brief. It refines the config's system prompt with a storyboard approval step, a font check, safe areas and other lessons learned. When the user asks for a video, follow this brief. It takes precedence over the `system` field in the JSON.

## Notes on the agent config
- It is a record only. Editing the file does not update the live agent.
- Effort is set to `low`. Consider `medium` or `high` for planning quality.
- It contains account and agent IDs. Remove them before making the repository public or reusing the file as a template.
