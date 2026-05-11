from __future__ import annotations

import json
import struct
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps


PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
EXIF_DATE_TAGS = {0x9003, 0x9004, 0x0132}
WEB_DIR = "web"
DATA_FILE = "photos-data.json"
MAX_IMAGE_EDGE = 1600
JPEG_QUALITY = 82
EXIF_FORMATS = (
    "%Y:%m:%d %H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
)


def parse_exif_date(value: bytes | str | None) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, bytes):
        text = value.split(b"\x00", 1)[0].decode("ascii", errors="ignore").strip()
    else:
        text = value.strip("\x00").strip()

    if not text:
        return None

    for date_format in EXIF_FORMATS:
        try:
            return datetime.strptime(text, date_format).astimezone()
        except ValueError:
            pass

    try:
        return datetime.fromisoformat(text).astimezone()
    except ValueError:
        return None


def read_tiff_value(data: bytes, offset: int, endian: str) -> bytes | None:
    if offset + 2 > len(data):
        return None

    entry_count = struct.unpack_from(endian + "H", data, offset)[0]
    cursor = offset + 2

    for _ in range(entry_count):
        if cursor + 12 > len(data):
            return None

        tag, value_type, count, raw_value = struct.unpack_from(endian + "HHI4s", data, cursor)
        cursor += 12

        if tag not in EXIF_DATE_TAGS:
            continue

        # EXIF ASCII values are one byte each. Short values live directly in the 4-byte field.
        if value_type != 2:
            continue

        if count <= 4:
            return raw_value[:count]

        value_offset = struct.unpack(endian + "I", raw_value)[0]
        if value_offset + count > len(data):
            return None
        return data[value_offset:value_offset + count]

    return None


def find_exif_date_in_tiff(data: bytes) -> datetime | None:
    if len(data) < 8:
        return None

    if data[:2] == b"II":
        endian = "<"
    elif data[:2] == b"MM":
        endian = ">"
    else:
        return None

    if struct.unpack_from(endian + "H", data, 2)[0] != 42:
        return None

    first_ifd = struct.unpack_from(endian + "I", data, 4)[0]
    raw_date = read_tiff_value(data, first_ifd, endian)
    parsed = parse_exif_date(raw_date)
    if parsed is not None:
        return parsed

    # Look for the Exif IFD pointer in IFD0, then scan that sub-IFD for DateTimeOriginal.
    if first_ifd + 2 > len(data):
        return None

    entry_count = struct.unpack_from(endian + "H", data, first_ifd)[0]
    cursor = first_ifd + 2

    for _ in range(entry_count):
        if cursor + 12 > len(data):
            return None

        tag, _, _, raw_value = struct.unpack_from(endian + "HHI4s", data, cursor)
        cursor += 12

        if tag == 0x8769:
            exif_ifd = struct.unpack(endian + "I", raw_value)[0]
            raw_date = read_tiff_value(data, exif_ifd, endian)
            return parse_exif_date(raw_date)

    return None


def get_jpeg_exif_date(path: Path) -> datetime | None:
    if path.suffix.lower() not in {".jpg", ".jpeg"}:
        return None

    try:
        with path.open("rb") as file:
            if file.read(2) != b"\xff\xd8":
                return None

            while True:
                marker_start = file.read(1)
                if not marker_start:
                    return None
                if marker_start != b"\xff":
                    continue

                marker = file.read(1)
                while marker == b"\xff":
                    marker = file.read(1)

                if marker in {b"\xd9", b"\xda"}:
                    return None

                length_bytes = file.read(2)
                if len(length_bytes) != 2:
                    return None

                segment_length = struct.unpack(">H", length_bytes)[0]
                segment = file.read(segment_length - 2)

                if marker == b"\xe1" and segment.startswith(b"Exif\x00\x00"):
                    return find_exif_date_in_tiff(segment[6:])
    except OSError:
        return None


def photo_date(path: Path) -> tuple[datetime, str]:
    exif_date = get_jpeg_exif_date(path)
    if exif_date is not None:
        return exif_date, "metadata"

    timestamp = path.stat().st_mtime
    return datetime.fromtimestamp(timestamp).astimezone(), "file"


def sort_from_date(value: str) -> int:
    date = datetime.fromisoformat(value)
    return int(date.timestamp() * 1000)


def make_web_image(path: Path, output_dir: Path) -> Path:
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / path.name

    with Image.open(path) as original:
        exif = original.getexif()
        image = ImageOps.exif_transpose(original)
        image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)

        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        save_kwargs = {
            "format": "JPEG",
            "quality": JPEG_QUALITY,
            "optimize": True,
            "progressive": True,
        }

        if exif:
            # The pixels are already rotated above, so reset orientation while keeping date metadata.
            exif[0x0112] = 1
            save_kwargs["exif"] = exif.tobytes()

        image.save(output_path, **save_kwargs)

    return output_path


def load_photo_data(script_dir: Path) -> dict[str, dict[str, object]]:
    data_path = script_dir / DATA_FILE
    if not data_path.exists():
        return {}

    try:
        raw_data = json.loads(data_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    if not isinstance(raw_data, dict):
        return {}

    return {
        str(name): entry
        for name, entry in raw_data.items()
        if isinstance(entry, dict)
    }


def write_photo_data(script_dir: Path, photo_data: dict[str, dict[str, object]]) -> None:
    data_path = script_dir / DATA_FILE
    data_path.write_text(
        json.dumps(photo_data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def build_manifest(script_dir: Path) -> list[dict[str, object]]:
    output_dir = script_dir / WEB_DIR
    photo_data = load_photo_data(script_dir)

    for path in script_dir.iterdir():
        if not path.is_file() or path.suffix.lower() not in PHOTO_EXTENSIONS:
            continue

        date, source = photo_date(path)
        web_path = make_web_image(path, output_dir)
        photo_data[path.name] = {
            "web_name": web_path.name,
            "date": date.isoformat(),
            "sort": int(date.timestamp() * 1000),
            "source": source,
        }

    photos = []
    for original_name, entry in photo_data.items():
        web_name = str(entry.get("web_name") or original_name)
        web_path = output_dir / web_name
        if not web_path.exists():
            continue

        try:
            date = str(entry["date"])
            sort = sort_from_date(date)
            source = str(entry.get("source") or "metadata")
        except (KeyError, TypeError, ValueError):
            continue

        photos.append(
            {
                "src": "./" + quote(WEB_DIR) + "/" + quote(web_name),
                "date": date,
                "sort": sort,
                "source": source,
                "_name": original_name,
                "_web_name": web_name,
            }
        )

    photos.sort(key=lambda photo: (-int(photo["sort"]), str(photo["_name"]).lower()))
    write_photo_data(
        script_dir,
        {
            str(photo["_name"]): {
                "web_name": photo["_web_name"],
                "date": photo["date"],
                "sort": photo["sort"],
                "source": photo["source"],
            }
            for photo in photos
        },
    )
    return photos


def write_manifest(script_dir: Path, photos: list[dict[str, object]]) -> None:
    output_path = script_dir / "photos.js"
    lines = ["window.RAAM_LAAKKWARTIER_PHOTOS = ["]

    for photo in photos:
        lines.append(
            "  { src: %s, date: %s, sort: %s, source: %s },"
            % (
                json.dumps(photo["src"], ensure_ascii=False),
                json.dumps(photo["date"], ensure_ascii=False),
                photo["sort"],
                json.dumps(photo["source"], ensure_ascii=False),
            )
        )

    lines.append("];")
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    photos = build_manifest(script_dir)
    write_manifest(script_dir, photos)
    print(f"Updated photos.js with {len(photos)} photo(s).")


if __name__ == "__main__":
    main()
