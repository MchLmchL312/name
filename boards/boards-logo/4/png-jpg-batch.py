# png_batch_to_jpg_target_kb_gui.py
# GUI-tool: batch PNG -> JPG met doelgrootte (KB) via kwaliteitssearch + optioneel resizen.
#
# Install:
#   pip install pillow
#
# Start:
#   python png_batch_to_jpg_target_kb_gui.py

import os
import threading
import queue
from io import BytesIO
from dataclasses import dataclass
from typing import Optional, Tuple, List

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, colorchooser

from PIL import Image


@dataclass
class EncodeSettings:
    target_kb: int
    tolerance_pct: float
    min_quality: int
    max_quality: int
    allow_resize: bool
    min_quality_resize_trigger: int
    resize_min_long_side: int
    bg_color_rgb: Tuple[int, int, int]
    progressive: bool
    optimize: bool


def clamp(n, lo, hi):
    return max(lo, min(hi, n))


def flatten_to_rgb(img: Image.Image, bg_rgb: Tuple[int, int, int]) -> Image.Image:
    """
    JPEG ondersteunt geen alpha. Als de PNG transparant is, vlakken we af op bg-kleur.
    """
    if img.mode in ("RGBA", "LA") or ("A" in img.getbands()):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, bg_rgb + (255,))
        out = Image.alpha_composite(bg, rgba).convert("RGB")
        return out
    return img.convert("RGB")


def encode_jpeg_to_bytes(img_rgb: Image.Image, quality: int, progressive: bool, optimize: bool) -> bytes:
    bio = BytesIO()
    img_rgb.save(
        bio,
        format="JPEG",
        quality=int(quality),
        progressive=bool(progressive),
        optimize=bool(optimize),
    )
    return bio.getvalue()


def find_best_quality(img_rgb: Image.Image, settings: EncodeSettings) -> Tuple[int, bytes]:
    """
    Zoek een JPEG kwaliteit die zo dicht mogelijk bij target zit.
    We proberen binnen [min_quality, max_quality] de size te benaderen.
    """
    target_bytes = settings.target_kb * 1024
    tol = settings.tolerance_pct / 100.0
    lo_bytes = int(target_bytes * (1.0 - tol))
    hi_bytes = int(target_bytes * (1.0 + tol))

    q_lo = clamp(settings.min_quality, 1, 95)
    q_hi = clamp(settings.max_quality, 1, 95)
    if q_lo > q_hi:
        q_lo, q_hi = q_hi, q_lo

    best_q = q_lo
    best_blob = encode_jpeg_to_bytes(img_rgb, best_q, settings.progressive, settings.optimize)
    best_diff = abs(len(best_blob) - target_bytes)

    # Snelle checks
    blob_hi = encode_jpeg_to_bytes(img_rgb, q_hi, settings.progressive, settings.optimize)
    diff_hi = abs(len(blob_hi) - target_bytes)
    if diff_hi < best_diff:
        best_q, best_blob, best_diff = q_hi, blob_hi, diff_hi

    # Binary search op kwaliteit: niet perfect monotone, maar in praktijk goed genoeg.
    left, right = q_lo, q_hi
    visited = set()

    while left <= right:
        mid = (left + right) // 2
        if mid in visited:
            break
        visited.add(mid)

        blob = encode_jpeg_to_bytes(img_rgb, mid, settings.progressive, settings.optimize)
        size = len(blob)
        diff = abs(size - target_bytes)
        if diff < best_diff:
            best_q, best_blob, best_diff = mid, blob, diff

        # Als binnen tolerantie: probeer nog dichter (liefst iets hoger kwaliteit als het kan)
        if lo_bytes <= size <= hi_bytes:
            # Probeer een tikkeltje hoger om dichter bij target te komen zonder teveel te overschrijden
            left = mid + 1
            continue

        # Te groot -> kwaliteit omlaag
        if size > hi_bytes:
            right = mid - 1
        else:
            # Te klein -> kwaliteit omhoog
            left = mid + 1

    return best_q, best_blob


def maybe_resize_to_meet_target(img_rgb: Image.Image, settings: EncodeSettings) -> Image.Image:
    """
    Als zelfs min_quality nog te groot is, dan kunnen we (optioneel) verkleinen.
    We schatten een schaalfactor op basis van huidige bytes vs target bytes.
    """
    target_bytes = settings.target_kb * 1024

    # Encode op min quality als referentie
    ref_blob = encode_jpeg_to_bytes(img_rgb, settings.min_quality, settings.progressive, settings.optimize)
    ref_size = len(ref_blob)

    if ref_size <= int(target_bytes * (1.0 + settings.tolerance_pct / 100.0)):
        return img_rgb  # Geen resize nodig

    if not settings.allow_resize:
        return img_rgb

    # Iteratief verkleinen (max 6 rondes)
    cur = img_rgb
    for _ in range(6):
        ref_blob = encode_jpeg_to_bytes(cur, settings.min_quality, settings.progressive, settings.optimize)
        ref_size = len(ref_blob)

        if ref_size <= int(target_bytes * (1.0 + settings.tolerance_pct / 100.0)):
            return cur

        # schaalfactor ~ sqrt(target/ref) (bytes ~ pixels * complexiteit)
        ratio = (target_bytes / max(ref_size, 1)) ** 0.5
        ratio *= 0.95  # kleine veiligheidsmarge
        if ratio >= 0.999:
            break

        w, h = cur.size
        new_w = max(1, int(w * ratio))
        new_h = max(1, int(h * ratio))

        # Bewaak minimum langste zijde indien ingesteld
        long_side = max(new_w, new_h)
        if long_side < settings.resize_min_long_side:
            # we willen niet kleiner dan dit; stop
            break

        cur = cur.resize((new_w, new_h), Image.LANCZOS)

    return cur


def safe_output_name(input_path: str) -> str:
    base = os.path.splitext(os.path.basename(input_path))[0]
    return base + ".jpg"


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Batch PNG → JPG (doelgrootte in KB)")
        self.geometry("900x600")
        self.minsize(850, 560)

        self.files: List[str] = []
        self.out_dir: Optional[str] = None
        self.worker_thread: Optional[threading.Thread] = None
        self.q = queue.Queue()

        # Defaults
        self.target_kb_var = tk.StringVar(value="250")
        self.tolerance_var = tk.StringVar(value="5")  # %
        self.min_q_var = tk.StringVar(value="35")
        self.max_q_var = tk.StringVar(value="92")
        self.allow_resize_var = tk.BooleanVar(value=True)
        self.resize_min_long_side_var = tk.StringVar(value="800")
        self.bg_color = (255, 255, 255)
        self.bg_color_hex_var = tk.StringVar(value="#FFFFFF")
        self.progressive_var = tk.BooleanVar(value=True)
        self.optimize_var = tk.BooleanVar(value=True)

        self._build_ui()
        self.after(100, self._poll_queue)

    def _build_ui(self):
        root = ttk.Frame(self, padding=12)
        root.pack(fill="both", expand=True)

        # Top: file list + buttons
        top = ttk.Frame(root)
        top.pack(fill="both", expand=True)

        left = ttk.Frame(top)
        left.pack(side="left", fill="both", expand=True)

        ttk.Label(left, text="Geselecteerde PNG-bestanden:").pack(anchor="w")
        self.listbox = tk.Listbox(left, selectmode=tk.EXTENDED, height=14)
        self.listbox.pack(fill="both", expand=True, pady=(6, 0))

        btns = ttk.Frame(top)
        btns.pack(side="right", fill="y", padx=(12, 0))

        ttk.Button(btns, text="PNG's toevoegen…", command=self.add_files).pack(fill="x", pady=4)
        ttk.Button(btns, text="Selectie verwijderen", command=self.remove_selected).pack(fill="x", pady=4)
        ttk.Button(btns, text="Lijst leegmaken", command=self.clear_files).pack(fill="x", pady=4)
        ttk.Separator(btns).pack(fill="x", pady=10)
        ttk.Button(btns, text="Output-map kiezen…", command=self.choose_out_dir).pack(fill="x", pady=4)
        self.out_label = ttk.Label(btns, text="Nog geen output-map gekozen", wraplength=220)
        self.out_label.pack(fill="x", pady=(4, 0))

        # Settings
        settings = ttk.LabelFrame(root, text="Instellingen", padding=10)
        settings.pack(fill="x", pady=(12, 8))

        grid = ttk.Frame(settings)
        grid.pack(fill="x")

        def row(r, label, widget, w2=None):
            ttk.Label(grid, text=label).grid(row=r, column=0, sticky="w", padx=(0, 10), pady=4)
            widget.grid(row=r, column=1, sticky="w", pady=4)
            if w2:
                w2.grid(row=r, column=2, sticky="w", padx=(10, 0), pady=4)

        # Row 0
        row(0, "Doelgrootte (KB):", ttk.Entry(grid, textvariable=self.target_kb_var, width=10),
            ttk.Label(grid, text="(per bestand)"))

        # Row 1
        row(1, "Tolerantie (%):", ttk.Entry(grid, textvariable=self.tolerance_var, width=10),
            ttk.Label(grid, text="(bv. 5 = ±5%)"))

        # Row 2
        row(2, "JPEG kwaliteit min / max:", ttk.Entry(grid, textvariable=self.min_q_var, width=10),
            ttk.Entry(grid, textvariable=self.max_q_var, width=10))
        ttk.Label(grid, text="min").grid(row=2, column=2, sticky="w", padx=(10, 0))
        ttk.Label(grid, text="max").grid(row=2, column=3, sticky="w", padx=(10, 0))
        grid.columnconfigure(4, weight=1)

        # Row 3: background
        bg_row = ttk.Frame(grid)
        bg_btn = ttk.Button(bg_row, text="Kies…", command=self.choose_bg)
        bg_entry = ttk.Entry(bg_row, textvariable=self.bg_color_hex_var, width=10, state="readonly")
        bg_entry.pack(side="left")
        bg_btn.pack(side="left", padx=(8, 0))
        ttk.Label(bg_row, text="(voor transparante PNG’s)").pack(side="left", padx=(8, 0))
        row(3, "Achtergrondkleur:", bg_row)

        # Row 4: checkboxes
        cb_row = ttk.Frame(grid)
        ttk.Checkbutton(cb_row, text="progressive", variable=self.progressive_var).pack(side="left")
        ttk.Checkbutton(cb_row, text="optimize", variable=self.optimize_var).pack(side="left", padx=(10, 0))
        row(4, "JPEG opties:", cb_row)

        # Row 5: resize
        resize_row = ttk.Frame(grid)
        ttk.Checkbutton(resize_row, text="Automatisch verkleinen als nodig", variable=self.allow_resize_var).pack(side="left")
        ttk.Label(resize_row, text="Minimum langste zijde (px):").pack(side="left", padx=(12, 6))
        ttk.Entry(resize_row, textvariable=self.resize_min_long_side_var, width=8).pack(side="left")
        row(5, "Resizing:", resize_row)

        # Run controls + progress
        run = ttk.Frame(root)
        run.pack(fill="x", pady=(4, 6))

        self.start_btn = ttk.Button(run, text="Start conversie", command=self.start)
        self.start_btn.pack(side="left")

        self.stop_btn = ttk.Button(run, text="Stop", command=self.stop, state="disabled")
        self.stop_btn.pack(side="left", padx=(8, 0))

        self.pbar = ttk.Progressbar(run, orient="horizontal", mode="determinate")
        self.pbar.pack(side="left", fill="x", expand=True, padx=(12, 0))

        # Log
        log_frame = ttk.LabelFrame(root, text="Log", padding=10)
        log_frame.pack(fill="both", expand=True)

        self.log = tk.Text(log_frame, height=10, wrap="word")
        self.log.pack(fill="both", expand=True)

    def add_files(self):
        paths = filedialog.askopenfilenames(
            title="Selecteer PNG-bestanden",
            filetypes=[("PNG", "*.png"), ("Alle bestanden", "*.*")]
        )
        if not paths:
            return
        for p in paths:
            if p.lower().endswith(".png") and p not in self.files:
                self.files.append(p)
                self.listbox.insert(tk.END, p)

    def remove_selected(self):
        sel = list(self.listbox.curselection())
        if not sel:
            return
        for idx in reversed(sel):
            path = self.listbox.get(idx)
            self.listbox.delete(idx)
            if path in self.files:
                self.files.remove(path)

    def clear_files(self):
        self.files.clear()
        self.listbox.delete(0, tk.END)

    def choose_out_dir(self):
        d = filedialog.askdirectory(title="Kies output-map")
        if not d:
            return
        self.out_dir = d
        self.out_label.config(text=d)

    def choose_bg(self):
        rgb, hexv = colorchooser.askcolor(color=self.bg_color, title="Kies achtergrondkleur")
        if rgb is None or hexv is None:
            return
        self.bg_color = (int(rgb[0]), int(rgb[1]), int(rgb[2]))
        self.bg_color_hex_var.set(hexv.upper())

    def _log(self, msg: str):
        self.log.insert(tk.END, msg + "\n")
        self.log.see(tk.END)

    def _read_settings(self) -> Optional[EncodeSettings]:
        try:
            target_kb = int(self.target_kb_var.get().strip())
            tolerance_pct = float(self.tolerance_var.get().strip())
            min_q = int(self.min_q_var.get().strip())
            max_q = int(self.max_q_var.get().strip())
            resize_min_long = int(self.resize_min_long_side_var.get().strip())
        except ValueError:
            messagebox.showerror("Fout", "Controleer je getallen (KB, %, kwaliteit, px).")
            return None

        if target_kb <= 1:
            messagebox.showerror("Fout", "Doelgrootte moet > 1 KB zijn.")
            return None

        min_q = clamp(min_q, 1, 95)
        max_q = clamp(max_q, 1, 95)
        tolerance_pct = max(0.0, tolerance_pct)

        return EncodeSettings(
            target_kb=target_kb,
            tolerance_pct=tolerance_pct,
            min_quality=min_q,
            max_quality=max_q,
            allow_resize=bool(self.allow_resize_var.get()),
            min_quality_resize_trigger=min_q,
            resize_min_long_side=max(50, resize_min_long),
            bg_color_rgb=self.bg_color,
            progressive=bool(self.progressive_var.get()),
            optimize=bool(self.optimize_var.get()),
        )

    def start(self):
        if self.worker_thread and self.worker_thread.is_alive():
            return

        if not self.files:
            messagebox.showwarning("Geen bestanden", "Selecteer eerst één of meer PNG-bestanden.")
            return
        if not self.out_dir:
            messagebox.showwarning("Geen output-map", "Kies eerst een output-map.")
            return

        settings = self._read_settings()
        if settings is None:
            return

        self._stop_flag = False
        self.start_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.pbar["value"] = 0
        self.pbar["maximum"] = len(self.files)
        self._log("Start…")

        self.worker_thread = threading.Thread(
            target=self._worker,
            args=(list(self.files), self.out_dir, settings),
            daemon=True
        )
        self.worker_thread.start()

    def stop(self):
        self._stop_flag = True
        self._log("Stop gevraagd…")

    def _worker(self, files: List[str], out_dir: str, settings: EncodeSettings):
        for i, path in enumerate(files, start=1):
            if getattr(self, "_stop_flag", False):
                self.q.put(("done", "Gestopt door gebruiker."))
                return

            try:
                with Image.open(path) as img:
                    img_rgb = flatten_to_rgb(img, settings.bg_color_rgb)

                # Eventueel verkleinen als min_quality nog te groot is
                img_rgb = maybe_resize_to_meet_target(img_rgb, settings)

                q_best, blob = find_best_quality(img_rgb, settings)

                out_name = safe_output_name(path)
                out_path = os.path.join(out_dir, out_name)

                # Als naam bestaat: suffix toevoegen
                if os.path.exists(out_path):
                    base = os.path.splitext(out_name)[0]
                    n = 2
                    while True:
                        candidate = os.path.join(out_dir, f"{base}_{n}.jpg")
                        if not os.path.exists(candidate):
                            out_path = candidate
                            break
                        n += 1

                with open(out_path, "wb") as f:
                    f.write(blob)

                size_kb = len(blob) / 1024.0
                msg = f"[{i}/{len(files)}] OK: {os.path.basename(path)} -> {os.path.basename(out_path)} | {size_kb:.1f} KB | q={q_best}"
                self.q.put(("progress", msg))

            except Exception as e:
                self.q.put(("progress", f"[{i}/{len(files)}] FOUT: {os.path.basename(path)} | {e}"))

        self.q.put(("done", "Klaar."))

    def _poll_queue(self):
        try:
            while True:
                kind, msg = self.q.get_nowait()
                if kind == "progress":
                    self._log(msg)
                    self.pbar["value"] = self.pbar["value"] + 1
                elif kind == "done":
                    self._log(msg)
                    self.start_btn.config(state="normal")
                    self.stop_btn.config(state="disabled")
        except queue.Empty:
            pass
        self.after(100, self._poll_queue)


if __name__ == "__main__":
    app = App()
    app.mainloop()
