# Interactive Video Color Editor (Flask + Vanilla JS)

A local desktop-first web app to upload video, preview live color edits in-browser (`<video>` + `<canvas>`), compare original vs filtered, export the current filtered frame as PNG, render edited MP4 output with FFmpeg, and batch export multiple presets.

## Project structure

```text
app.py
requirements.txt
README.md
templates/
  index.html
static/
  styles.css
  app.js
uploads/
outputs/
```

## Features

- Upload common video formats (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`)
- Live browser-side pixel processing (no backend call on slider drag)
- Sliders for hue/saturation/brightness/contrast/gamma/RGB multipliers
- Presets: Warm, Cold, Green Tint, Red Boost, Bleach, Duotone
- Active preset indicator + automatic `Custom` state after manual slider edits
- Compare toggle: `Compare Original / Filtered`
- Export current filtered frame as PNG
- Single export: save current settings as MP4 (H.264 + AAC)
- Batch export: one MP4 per selected preset
- Download links for generated outputs
- Basic error handling for invalid upload, missing FFmpeg, bad requests, and export failures

## Requirements

- Windows 10/11 (also works on macOS/Linux)
- Python 3.10+
- FFmpeg installed and available in `PATH`

## Setup (Windows)

### 1) Create and activate a virtual environment

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Command Prompt:

```cmd
python -m venv .venv
.venv\Scripts\activate
```

### 2) Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3) Install FFmpeg on Windows

Option A (winget):

```powershell
winget install --id Gyan.FFmpeg -e
```

Option B (manual):

1. Download FFmpeg static build from https://www.gyan.dev/ffmpeg/builds/
2. Extract to a folder, e.g. `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system `PATH`
4. Restart terminal and verify:

```bash
ffmpeg -version
```

## Run the app

From the project folder:

```bash
python app.py
```

Open:

- http://127.0.0.1:5000

## How to use

1. Upload a video.
2. Play video and tweak sliders for live filtered preview.
3. Use presets and then refine sliders manually (`Custom` appears).
4. Toggle compare mode to instantly switch original vs filtered view.
5. Export current frame with **Export Current Frame as PNG**.
6. Render edited video with **Save as MP4**.
7. Use **Batch Presets** and export multiple preset outputs.

## Preview vs export differences

- Preview uses JavaScript pixel processing on canvas per frame.
- Export uses FFmpeg filter graphs to approximate the same look.
- Due to implementation differences between browser pixel math and FFmpeg internals, exact pixel-perfect parity is not guaranteed.
- Duotone export is implemented with an FFmpeg mask + color merge approximation; it should be visually close to browser duotone, but not mathematically identical.

## Limitations

- Very high-resolution videos can reduce live preview FPS due to per-pixel JavaScript processing.
- Browser codec support for upload playback varies by installed codecs/browser.
- Batch export runs sequentially in one request (simple implementation).
- Generated files are stored locally in `uploads/` and `outputs/` until manually removed.

## Troubleshooting

- **"FFmpeg is not installed or not in PATH."**
  - Run `ffmpeg -version` in the same terminal where Flask runs.
  - Ensure `...\ffmpeg\bin` is in PATH and restart terminal.
- **Upload rejected**
  - Confirm extension is one of supported formats.
- **Export fails**
  - Check terminal output for FFmpeg errors (codec/container issues).
- **No preview after upload**
  - Try MP4/H.264 source first, ensure browser can decode the video.

## Notes

- This app is local-first and intended for desktop usage.
- Slider changes are processed entirely in-browser for responsive feedback.
