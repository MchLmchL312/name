const sliderConfig = [
  { key: "hue", label: "Hue", min: -180, max: 180, step: 1, value: 0, format: v => `${v.toFixed(0)}°` },
  { key: "saturation", label: "Saturation", min: 0, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
  { key: "brightness", label: "Brightness", min: -1, max: 1, step: 0.01, value: 0, format: v => v.toFixed(2) },
  { key: "contrast", label: "Contrast", min: 0, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
  { key: "gamma", label: "Gamma", min: 0.1, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
  { key: "red", label: "Red multiplier", min: 0, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
  { key: "green", label: "Green multiplier", min: 0, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
  { key: "blue", label: "Blue multiplier", min: 0, max: 3, step: 0.01, value: 1, format: v => v.toFixed(2) },
];

const presets = {
  "Warm": { hue: -8, saturation: 1.15, brightness: 0.04, contrast: 1.08, gamma: 1, red: 1.12, green: 1.03, blue: 0.90, effect: "none" },
  "Cold": { hue: 8, saturation: 1.05, brightness: 0, contrast: 1.06, gamma: 1, red: 0.92, green: 1, blue: 1.14, effect: "none" },
  "Green Tint": { hue: 0, saturation: 1.05, brightness: 0, contrast: 1.04, gamma: 1, red: 0.92, green: 1.18, blue: 0.94, effect: "none" },
  "Red Boost": { hue: -2, saturation: 1.10, brightness: 0.01, contrast: 1.08, gamma: 1, red: 1.28, green: 0.98, blue: 0.95, effect: "none" },
  "Bleach": { hue: 0, saturation: 0.55, brightness: 0.08, contrast: 1.18, gamma: 0.95, red: 1.03, green: 1.03, blue: 1.03, effect: "bleach" },
  "Duotone": { hue: 0, saturation: 0.65, brightness: 0.02, contrast: 1.12, gamma: 1, red: 1, green: 0.95, blue: 0.90, effect: "duotone", duotoneShadow: "#1b2a49", duotoneHighlight: "#f2c14e" },
};

const els = {
  uploadForm: document.getElementById("upload-form"),
  videoInput: document.getElementById("video-input"),
  uploadInfo: document.getElementById("upload-info"),
  video: document.getElementById("source-video"),
  canvas: document.getElementById("preview-canvas"),
  frameSeek: document.getElementById("frame-seek"),
  frameTime: document.getElementById("frame-time"),
  captureFrameBtn: document.getElementById("capture-frame-btn"),
  sliders: document.getElementById("sliders"),
  presetButtons: document.getElementById("preset-buttons"),
  activePreset: document.getElementById("active-preset"),
  compareBtn: document.getElementById("compare-btn"),
  exportFrameBtn: document.getElementById("export-frame-btn"),
  saveMp4Btn: document.getElementById("save-mp4-btn"),
  singleExportResult: document.getElementById("single-export-result"),
  batchList: document.getElementById("batch-list"),
  batchExportBtn: document.getElementById("batch-export-btn"),
  batchStatus: document.getElementById("batch-status"),
  batchResults: document.getElementById("batch-results"),
  globalStatus: document.getElementById("global-status"),
  resetBtn: document.getElementById("reset-btn"),
};

const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
const state = {
  storedFilename: null,
  originalFilename: null,
  compareOriginal: false,
  activePresetName: "Custom",
  effect: "none",
  duotoneShadow: "#1b2a49",
  duotoneHighlight: "#f2c14e",
  values: Object.fromEntries(sliderConfig.map(s => [s.key, s.value])),
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function setStatus(text, kind = "") {
  els.globalStatus.textContent = text;
  els.globalStatus.className = `status ${kind}`.trim();
}
function setCustomState() {
  state.activePresetName = "Custom";
  els.activePreset.textContent = "(Custom)";
  document.querySelectorAll("#preset-buttons button").forEach(b => b.classList.remove("active"));
}

function createSliders() {
  sliderConfig.forEach(cfg => {
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <label for="slider-${cfg.key}">${cfg.label}</label>
      <input id="slider-${cfg.key}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${cfg.value}">
      <output id="value-${cfg.key}">${cfg.format(cfg.value)}</output>
    `;
    els.sliders.appendChild(row);

    const input = row.querySelector("input");
    const output = row.querySelector("output");
    input.addEventListener("input", () => {
      state.values[cfg.key] = clamp(parseFloat(input.value), cfg.min, cfg.max);
      output.textContent = cfg.format(state.values[cfg.key]);
      if (state.activePresetName !== "Custom") setCustomState();
      renderSelectedFrame();
    });
  });
}

function applyValues(values) {
  sliderConfig.forEach(cfg => {
    const v = clamp(Number(values[cfg.key]), cfg.min, cfg.max);
    state.values[cfg.key] = v;
    document.getElementById(`slider-${cfg.key}`).value = String(v);
    document.getElementById(`value-${cfg.key}`).textContent = cfg.format(v);
  });
}

function createPresetButtons() {
  Object.keys(presets).forEach(name => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.addEventListener("click", () => {
      const preset = presets[name];
      applyValues(preset);
      state.activePresetName = name;
      state.effect = preset.effect || "none";
      state.duotoneShadow = preset.duotoneShadow || "#1b2a49";
      state.duotoneHighlight = preset.duotoneHighlight || "#f2c14e";
      els.activePreset.textContent = `(${name})`;
      document.querySelectorAll("#preset-buttons button").forEach(b => b.classList.toggle("active", b === btn));
      renderSelectedFrame();
    });
    els.presetButtons.appendChild(btn);
  });
}

function createBatchCheckboxes() {
  Object.keys(presets).forEach(name => {
    const label = document.createElement("label");
    label.className = "batch-item";
    label.innerHTML = `<input type="checkbox" value="${name}"> ${name}`;
    els.batchList.appendChild(label);
  });
}

function resetAll() {
  state.effect = "none";
  state.duotoneShadow = "#1b2a49";
  state.duotoneHighlight = "#f2c14e";
  applyValues(Object.fromEntries(sliderConfig.map(s => [s.key, s.value])));
  setCustomState();
  renderSelectedFrame();
}

function syncFrameUI(currentTime) {
  els.frameSeek.value = String(currentTime);
  els.frameTime.textContent = `${Number(currentTime).toFixed(2)}s`;
}

function setupVideo() {
  els.video.addEventListener("loadedmetadata", () => {
    if (!els.video.videoWidth || !els.video.videoHeight) return;
    els.canvas.width = els.video.videoWidth;
    els.canvas.height = els.video.videoHeight;

    const duration = Number.isFinite(els.video.duration) ? els.video.duration : 0;
    els.frameSeek.max = String(duration);
    els.frameSeek.disabled = duration <= 0;
    syncFrameUI(0);
    renderSelectedFrame();
  });

  els.video.addEventListener("seeked", () => {
    syncFrameUI(els.video.currentTime);
    renderSelectedFrame();
  });

  els.video.addEventListener("timeupdate", () => {
    syncFrameUI(els.video.currentTime);
    if (!els.video.paused) renderSelectedFrame();
  });

  els.frameSeek.addEventListener("input", () => {
    if (!state.storedFilename) return;
    els.video.currentTime = clamp(parseFloat(els.frameSeek.value), 0, els.video.duration || 0);
  });

  els.captureFrameBtn.addEventListener("click", () => {
    if (!state.storedFilename) return setStatus("Upload eerst een video.", "error");
    els.video.pause();
    syncFrameUI(els.video.currentTime);
    renderSelectedFrame();
    setStatus(`Frame gekozen op ${els.video.currentTime.toFixed(2)}s`, "ok");
  });
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

function applyGamma(v, gamma) {
  return clamp(Math.pow(clamp(v / 255, 0, 1), 1 / gamma) * 255, 0, 255);
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  return { r: parseInt(raw.slice(0, 2), 16), g: parseInt(raw.slice(2, 4), 16), b: parseInt(raw.slice(4, 6), 16) };
}

function renderSelectedFrame() {
  if (!state.storedFilename || !els.video.videoWidth) return;
  ctx.drawImage(els.video, 0, 0, els.canvas.width, els.canvas.height);
  const frame = ctx.getImageData(0, 0, els.canvas.width, els.canvas.height);
  const data = frame.data;

  const hueShift = state.values.hue / 360;
  const satMult = clamp(state.values.saturation, 0, 3);
  const bright = clamp(state.values.brightness, -1, 1) * 255;
  const contrast = clamp(state.values.contrast, 0, 3);
  const gamma = clamp(state.values.gamma, 0.1, 3);
  const rMult = clamp(state.values.red, 0, 3);
  const gMult = clamp(state.values.green, 0, 3);
  const bMult = clamp(state.values.blue, 0, 3);
  const duotoneS = hexToRgb(state.duotoneShadow);
  const duotoneH = hexToRgb(state.duotoneHighlight);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    let [h, s, l] = rgbToHsl(r, g, b);
    h = (h + hueShift + 1) % 1;
    s = clamp(s * satMult, 0, 1);
    [r, g, b] = hslToRgb(h, s, l);

    r = ((r - 128) * contrast) + 128 + bright;
    g = ((g - 128) * contrast) + 128 + bright;
    b = ((b - 128) * contrast) + 128 + bright;

    r = applyGamma(r, gamma) * rMult;
    g = applyGamma(g, gamma) * gMult;
    b = applyGamma(b, gamma) * bMult;

    if (state.effect === "bleach") {
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      r = r * 0.65 + lum * 0.35 + 6;
      g = g * 0.65 + lum * 0.35 + 6;
      b = b * 0.65 + lum * 0.35 + 6;
    } else if (state.effect === "duotone") {
      const lum = clamp((0.299 * r + 0.587 * g + 0.114 * b) / 255, 0, 1);
      r = duotoneS.r + (duotoneH.r - duotoneS.r) * lum;
      g = duotoneS.g + (duotoneH.g - duotoneS.g) * lum;
      b = duotoneS.b + (duotoneH.b - duotoneS.b) * lum;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }

  ctx.putImageData(frame, 0, 0);
}

async function uploadVideo(file) {
  const fd = new FormData();
  fd.append("video", file);
  const res = await fetch("/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

function getExportPayload() {
  return {
    storedFilename: state.storedFilename,
    settings: {
      ...state.values,
      effect: state.effect,
      duotoneShadow: state.duotoneShadow,
      duotoneHighlight: state.duotoneHighlight,
    },
  };
}

async function handleSingleExport() {
  if (!state.storedFilename) return setStatus("Upload a video before exporting.", "error");
  els.singleExportResult.textContent = "Rendering MP4...";
  const res = await fetch("/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getExportPayload()),
  });
  const data = await res.json();
  if (!res.ok) {
    els.singleExportResult.textContent = data.error || "Export failed.";
    els.singleExportResult.className = "status error";
    return;
  }
  els.singleExportResult.innerHTML = `Done: <a href="${data.downloadUrl}">Download ${data.filename}</a>`;
  els.singleExportResult.className = "status ok";
}

async function handleBatchExport() {
  if (!state.storedFilename) return setStatus("Upload a video before batch export.", "error");
  const selected = Array.from(document.querySelectorAll("#batch-list input:checked")).map(n => n.value);
  if (selected.length === 0) return setStatus("Select at least one preset for batch export.", "error");

  els.batchStatus.textContent = `Rendering presets: ${selected.join(", ")}...`;
  els.batchStatus.className = "status";
  els.batchResults.innerHTML = "";

  const res = await fetch("/batch_export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storedFilename: state.storedFilename, presets: selected }),
  });
  const data = await res.json();
  if (!res.ok) {
    els.batchStatus.textContent = data.error || "Batch export failed.";
    els.batchStatus.className = "status error";
    return;
  }

  data.results.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = item.error
      ? `${item.preset}: failed (${item.error})`
      : `${item.preset}: <a href="${item.downloadUrl}">Download ${item.filename}</a>`;
    els.batchResults.appendChild(li);
  });
  els.batchStatus.textContent = "Batch export complete.";
  els.batchStatus.className = "status ok";
}

function exportCurrentFrame() {
  if (!state.storedFilename) return setStatus("Upload a video first.", "error");
  renderSelectedFrame();
  const a = document.createElement("a");
  const base = (state.originalFilename || "video").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]/gi, "_");
  const ts = els.video.currentTime.toFixed(2).replace(".", "p");
  a.download = `${base}_frame_${ts}s.png`;
  a.href = els.canvas.toDataURL("image/png");
  a.click();
  setStatus("Frame exported as PNG.", "ok");
}

els.uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = els.videoInput.files[0];
  if (!file) return setStatus("Select a video file to upload.", "error");
  try {
    setStatus("Uploading video...");
    const result = await uploadVideo(file);
    state.storedFilename = result.storedFilename;
    state.originalFilename = result.originalFilename;
    els.video.src = result.videoUrl;
    els.video.load();
    els.uploadInfo.textContent = `Uploaded: ${result.originalFilename}`;
    els.uploadInfo.className = "status ok";
    setStatus("Upload successful. Kies een frame en bewerk realtime.", "ok");
  } catch (err) {
    els.uploadInfo.textContent = err.message;
    els.uploadInfo.className = "status error";
    setStatus(err.message, "error");
  }
});

els.compareBtn.addEventListener("click", () => {
  state.compareOriginal = !state.compareOriginal;
  els.video.style.display = state.compareOriginal ? "block" : "none";
  els.canvas.style.display = state.compareOriginal ? "none" : "block";
  els.compareBtn.textContent = `Compare Original / Filtered: ${state.compareOriginal ? "ON" : "OFF"}`;
  els.compareBtn.classList.toggle("active", state.compareOriginal);
});

els.exportFrameBtn.addEventListener("click", exportCurrentFrame);
els.saveMp4Btn.addEventListener("click", () => handleSingleExport().catch(e => setStatus(e.message, "error")));
els.batchExportBtn.addEventListener("click", () => handleBatchExport().catch(e => setStatus(e.message, "error")));
els.resetBtn.addEventListener("click", resetAll);

createSliders();
createPresetButtons();
createBatchCheckboxes();
setupVideo();
resetAll();
