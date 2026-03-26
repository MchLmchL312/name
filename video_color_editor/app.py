import os
import shutil
import subprocess
import uuid
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory, url_for
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

PRESETS = {
    "Warm": {
        "hue": -8,
        "saturation": 1.15,
        "brightness": 0.04,
        "contrast": 1.08,
        "gamma": 1.00,
        "red": 1.12,
        "green": 1.03,
        "blue": 0.90,
        "effect": "none",
    },
    "Cold": {
        "hue": 8,
        "saturation": 1.05,
        "brightness": 0.00,
        "contrast": 1.06,
        "gamma": 1.00,
        "red": 0.92,
        "green": 1.00,
        "blue": 1.14,
        "effect": "none",
    },
    "Green Tint": {
        "hue": 0,
        "saturation": 1.05,
        "brightness": 0.00,
        "contrast": 1.04,
        "gamma": 1.00,
        "red": 0.92,
        "green": 1.18,
        "blue": 0.94,
        "effect": "none",
    },
    "Red Boost": {
        "hue": -2,
        "saturation": 1.10,
        "brightness": 0.01,
        "contrast": 1.08,
        "gamma": 1.00,
        "red": 1.28,
        "green": 0.98,
        "blue": 0.95,
        "effect": "none",
    },
    "Bleach": {
        "hue": 0,
        "saturation": 0.55,
        "brightness": 0.08,
        "contrast": 1.18,
        "gamma": 0.95,
        "red": 1.03,
        "green": 1.03,
        "blue": 1.03,
        "effect": "bleach",
    },
    "Duotone": {
        "hue": 0,
        "saturation": 0.65,
        "brightness": 0.02,
        "contrast": 1.12,
        "gamma": 1.00,
        "red": 1.00,
        "green": 0.95,
        "blue": 0.90,
        "effect": "duotone",
        "duotoneShadow": "#1b2a49",
        "duotoneHighlight": "#f2c14e",
    },
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def ffmpeg_exists() -> bool:
    return shutil.which("ffmpeg") is not None


def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def normalize_settings(payload: dict) -> dict:
    return {
        "hue": clamp(float(payload.get("hue", 0)), -180, 180),
        "saturation": clamp(float(payload.get("saturation", 1)), 0, 3),
        "brightness": clamp(float(payload.get("brightness", 0)), -1, 1),
        "contrast": clamp(float(payload.get("contrast", 1)), 0, 3),
        "gamma": clamp(float(payload.get("gamma", 1)), 0.1, 3),
        "red": clamp(float(payload.get("red", 1)), 0, 3),
        "green": clamp(float(payload.get("green", 1)), 0, 3),
        "blue": clamp(float(payload.get("blue", 1)), 0, 3),
        "effect": payload.get("effect", "none"),
        "duotoneShadow": payload.get("duotoneShadow", "#1b2a49"),
        "duotoneHighlight": payload.get("duotoneHighlight", "#f2c14e"),
    }


def build_base_chain(s: dict) -> str:
    brightness = clamp(s["brightness"], -1, 1)
    eq = (
        f"eq=contrast={s['contrast']:.4f}:brightness={brightness:.4f}:"
        f"saturation={s['saturation']:.4f}:gamma={s['gamma']:.4f}"
    )
    hue = f"hue=h={s['hue']:.4f}"
    channels = (
        "lutrgb="
        f"r='clip(val*{s['red']:.4f}\,0\,255)':"
        f"g='clip(val*{s['green']:.4f}\,0\,255)':"
        f"b='clip(val*{s['blue']:.4f}\,0\,255)'"
    )
    return f"{hue},{eq},{channels},format=yuv420p"


def hex_to_rgb_triplet(hex_color: str) -> tuple[int, int, int]:
    raw = hex_color.strip().lstrip("#")
    if len(raw) != 6:
        raise ValueError("Invalid duotone color")
    return int(raw[0:2], 16), int(raw[2:4], 16), int(raw[4:6], 16)


def run_ffmpeg(input_path: Path, output_path: Path, settings: dict) -> None:
    base_chain = build_base_chain(settings)
    effect = settings.get("effect", "none")

    if effect == "bleach":
        vf = f"{base_chain},eq=saturation=0.7:contrast=1.12:brightness=0.03"
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            vf,
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output_path),
        ]
    elif effect == "duotone":
        sr, sg, sb = hex_to_rgb_triplet(settings.get("duotoneShadow", "#1b2a49"))
        hr, hg, hb = hex_to_rgb_triplet(settings.get("duotoneHighlight", "#f2c14e"))
        complex_filter = (
            f"[0:v]{base_chain},split=2[base][masksrc];"
            "[masksrc]format=gray[mask];"
            f"color=c=#{sr:02x}{sg:02x}{sb:02x}:s=16x16[shadow0];"
            f"color=c=#{hr:02x}{hg:02x}{hb:02x}:s=16x16[highlight0];"
            "[shadow0][base]scale2ref[shadow][shadow_ref];"
            "[highlight0][base]scale2ref[highlight][highlight_ref];"
            "[shadow_ref]nullsink;[highlight_ref]nullsink;"
            "[shadow][highlight][mask]maskedmerge,format=yuv420p[vout]"
        )
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-filter_complex",
            complex_filter,
            "-map",
            "[vout]",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output_path),
        ]
    else:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            base_chain,
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output_path),
        ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        stderr_tail = "\n".join((exc.stderr or "").splitlines()[-12:])
        raise RuntimeError(stderr_tail or "FFmpeg failed") from exc


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/upload")
def upload():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided."}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use mp4, mov, avi, mkv, webm."}), 400

    original_name = secure_filename(file.filename)
    stem = Path(original_name).stem
    ext = Path(original_name).suffix.lower()
    unique_name = f"{stem}_{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name
    file.save(save_path)

    return jsonify(
        {
            "message": "Upload successful.",
            "videoUrl": url_for("serve_upload", filename=unique_name),
            "storedFilename": unique_name,
            "originalFilename": original_name,
        }
    )


@app.post("/export")
def export_single():
    if not ffmpeg_exists():
        return jsonify({"error": "FFmpeg is not installed or not in PATH."}), 500

    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Invalid JSON payload."}), 400

    stored_filename = payload.get("storedFilename")
    if not stored_filename:
        return jsonify({"error": "No uploaded video specified."}), 400

    input_path = (UPLOAD_DIR / stored_filename).resolve()
    if not input_path.exists() or input_path.parent != UPLOAD_DIR.resolve():
        return jsonify({"error": "Uploaded video was not found."}), 404

    settings = normalize_settings(payload.get("settings", {}))
    output_name = f"export_{Path(stored_filename).stem}_{uuid.uuid4().hex[:8]}.mp4"
    output_path = OUTPUT_DIR / output_name

    try:
        run_ffmpeg(input_path, output_path, settings)
    except Exception as exc:
        return jsonify({"error": f"Export failed: {str(exc)}"}), 500

    return jsonify(
        {
            "message": "Export complete.",
            "filename": output_name,
            "downloadUrl": url_for("download_output", filename=output_name),
        }
    )


@app.post("/batch_export")
def batch_export():
    if not ffmpeg_exists():
        return jsonify({"error": "FFmpeg is not installed or not in PATH."}), 500

    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Invalid JSON payload."}), 400

    stored_filename = payload.get("storedFilename")
    selected = payload.get("presets", [])

    if not stored_filename:
        return jsonify({"error": "No uploaded video specified."}), 400
    if not isinstance(selected, list) or len(selected) == 0:
        return jsonify({"error": "No presets selected."}), 400

    input_path = (UPLOAD_DIR / stored_filename).resolve()
    if not input_path.exists() or input_path.parent != UPLOAD_DIR.resolve():
        return jsonify({"error": "Uploaded video was not found."}), 404

    results = []
    for preset_name in selected:
        if preset_name not in PRESETS:
            return jsonify({"error": f"Unknown preset: {preset_name}"}), 400

        settings = normalize_settings(PRESETS[preset_name])
        safe_preset = secure_filename(preset_name.lower().replace(" ", "_"))
        output_name = f"batch_{Path(stored_filename).stem}_{safe_preset}_{uuid.uuid4().hex[:8]}.mp4"
        output_path = OUTPUT_DIR / output_name

        try:
            run_ffmpeg(input_path, output_path, settings)
            results.append(
                {
                    "preset": preset_name,
                    "filename": output_name,
                    "downloadUrl": url_for("download_output", filename=output_name),
                    "status": "ok",
                }
            )
        except Exception as exc:
            results.append({"preset": preset_name, "error": str(exc), "status": "failed"})

    return jsonify({"results": results})


@app.route("/uploads/<path:filename>")
def serve_upload(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/outputs/<path:filename>")
def download_output(filename: str):
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)
