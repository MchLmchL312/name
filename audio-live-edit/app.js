const els = {
  fileInput: document.querySelector("#fileInput"),
  status: document.querySelector("#status"),
  playPause: document.querySelector("#playPause"),
  randomJump: document.querySelector("#randomJump"),
  setSample: document.querySelector("#setSample"),
  toggleLoop: document.querySelector("#toggleLoop"),
  stutter: document.querySelector("#stutter"),
  reverseSample: document.querySelector("#reverseSample"),
  glitchMode: document.querySelector("#glitchMode"),
  speed: document.querySelector("#speed"),
  loopLength: document.querySelector("#loopLength"),
  jumpIntensity: document.querySelector("#jumpIntensity"),
  repeatCount: document.querySelector("#repeatCount"),
  volume: document.querySelector("#volume"),
  speedValue: document.querySelector("#speedValue"),
  loopLengthValue: document.querySelector("#loopLengthValue"),
  jumpValue: document.querySelector("#jumpValue"),
  repeatValue: document.querySelector("#repeatValue"),
  volumeValue: document.querySelector("#volumeValue"),
  positionReadout: document.querySelector("#positionReadout"),
  sampleReadout: document.querySelector("#sampleReadout"),
  modeReadout: document.querySelector("#modeReadout"),
  progressBar: document.querySelector("#progressBar"),
};

const state = {
  audioContext: null,
  masterGain: null,
  buffer: null,
  reversedBuffer: null,
  source: null,
  sourceGain: null,
  playStartedAt: 0,
  playStartPosition: 0,
  playSpeed: 1,
  pausedAt: 0,
  samplePoint: 0,
  isPlaying: false,
  isLooping: false,
  isReverse: false,
  isGlitching: false,
  activeGrains: new Set(),
  schedulerTimer: null,
  nextGrainTime: 0,
  currentGrainOffset: 0,
  glitchOffset: 0,
  glitchLength: 0.12,
  glitchRepeatsLeft: 0,
  grainStartedAt: 0,
  grainOffset: 0,
  grainLength: 0,
  lastVisualTick: 0,
};

const LOOKAHEAD_SECONDS = 0.18;
const SCHEDULER_MS = 25;
const FADE_SECONDS = 0.012;

setControlsEnabled(false);
updateSliderLabels();
requestAnimationFrame(updateVisuals);

els.fileInput.addEventListener("change", handleFile);
els.playPause.addEventListener("click", togglePlay);
els.randomJump.addEventListener("click", randomJump);
els.setSample.addEventListener("click", setSampleFromCurrentPosition);
els.toggleLoop.addEventListener("click", toggleLoop);
els.stutter.addEventListener("click", stutter);
els.reverseSample.addEventListener("click", reverseSample);
els.glitchMode.addEventListener("click", toggleGlitchMode);

for (const slider of [els.speed, els.loopLength, els.jumpIntensity, els.repeatCount, els.volume]) {
  slider.addEventListener("input", updateSliderLabels);
}

els.speed.addEventListener("input", () => {
  if (!state.isPlaying) return;

  if (state.source) {
    const position = getCurrentPosition();
    state.pausedAt = position;
    startLinearPlayback(position);
  }
});

els.volume.addEventListener("input", () => {
  if (state.masterGain) {
    state.masterGain.gain.setTargetAtTime(Number(els.volume.value), state.audioContext.currentTime, 0.01);
  }
});

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  await ensureAudioContext();
  stopEverything(false);

  try {
    const arrayBuffer = await file.arrayBuffer();
    state.buffer = await state.audioContext.decodeAudioData(arrayBuffer);
    state.reversedBuffer = createReversedBuffer(state.buffer);
    state.pausedAt = 0;
    state.samplePoint = 0;
    state.isReverse = false;
    state.isLooping = false;
    state.isGlitching = false;
    setControlsEnabled(true);
    updateButtonStates();
    els.status.textContent = `${file.name} geladen.`;
    els.modeReadout.textContent = "Ready";
  } catch (error) {
    console.error(error);
    els.status.textContent = "Dit audiobestand kon niet worden geladen.";
  }
}

async function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = Number(els.volume.value);
    state.masterGain.connect(state.audioContext.destination);
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }
}

async function togglePlay() {
  if (!state.buffer) return;
  await ensureAudioContext();

  if (state.isPlaying) {
    pausePlayback();
    return;
  }

  state.isPlaying = true;
  els.playPause.textContent = "Pause";
  if (state.isLooping || state.isGlitching) {
    startGrainMode();
  } else {
    startLinearPlayback(state.pausedAt);
  }
  updateButtonStates();
}

function startLinearPlayback(offset) {
  stopGrainScheduler();
  stopSource();

  const buffer = getActiveBuffer();
  const source = state.audioContext.createBufferSource();
  const gain = state.audioContext.createGain();
  const playOffset = clampOffset(offset);

  source.buffer = buffer;
  source.playbackRate.value = getSpeed();
  gain.gain.setValueAtTime(0, state.audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(1, state.audioContext.currentTime + FADE_SECONDS);
  source.connect(gain).connect(state.masterGain);
  source.start(0, toBufferOffset(playOffset));

  state.source = source;
  state.sourceGain = gain;
  state.playStartedAt = state.audioContext.currentTime;
  state.playStartPosition = playOffset;
  state.playSpeed = getSpeed();
  state.pausedAt = playOffset;

  source.onended = () => {
    if (state.source !== source || state.isLooping || state.isGlitching) return;
    state.isPlaying = false;
    state.pausedAt = clampOffset(getCurrentPosition());
    if (state.pausedAt >= state.buffer.duration - 0.02) state.pausedAt = 0;
    stopSource();
    updateButtonStates();
  };

  els.modeReadout.textContent = state.isReverse ? "Reverse" : "Play";
}

function pausePlayback() {
  state.pausedAt = clampOffset(getCurrentPosition());
  state.isPlaying = false;
  stopEverything(false);
  updateButtonStates();
  els.modeReadout.textContent = "Paused";
}

function stopEverything(resetPosition) {
  stopSource();
  stopGrainScheduler();
  stopActiveGrains();
  state.isPlaying = false;
  if (resetPosition) state.pausedAt = 0;
  updateButtonStates();
}

function stopSource() {
  if (!state.source) return;

  const now = state.audioContext.currentTime;
  const source = state.source;
  const gain = state.sourceGain;

  try {
    const currentGain = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(currentGain, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    source.stop(now + FADE_SECONDS + 0.003);
  } catch {
    // A source can already be stopped when rapidly hammering buttons live.
  }

  state.source = null;
  state.sourceGain = null;

  window.setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // Already disconnected.
    }
  }, (FADE_SECONDS + 0.03) * 1000);
}

function startGrainMode() {
  stopSource();
  stopGrainScheduler();
  stopActiveGrains();

  const now = state.audioContext.currentTime;
  state.nextGrainTime = now + 0.02;
  state.currentGrainOffset = clampOffset(state.samplePoint);
  prepareNextGlitchSlice();
  runScheduler();
  state.schedulerTimer = window.setInterval(runScheduler, SCHEDULER_MS);
  els.modeReadout.textContent = state.isGlitching ? "Glitch" : "Loop";
}

function runScheduler() {
  if (!state.buffer || !state.isPlaying || (!state.isLooping && !state.isGlitching)) return;

  const now = state.audioContext.currentTime;
  while (state.nextGrainTime < now + LOOKAHEAD_SECONDS) {
    if (state.isGlitching) {
      if (state.glitchRepeatsLeft <= 0) prepareNextGlitchSlice();
      scheduleGrain(state.glitchOffset, state.glitchLength, state.nextGrainTime);
      state.glitchRepeatsLeft -= 1;
      state.nextGrainTime += state.glitchLength / getSpeed();
    } else {
      const length = getLoopLength();
      state.currentGrainOffset = clampOffset(state.samplePoint);
      scheduleGrain(state.currentGrainOffset, length, state.nextGrainTime);
      state.nextGrainTime += length / getSpeed();
    }
  }
}

function scheduleGrain(offset, length, when) {
  const buffer = getActiveBuffer();
  const source = state.audioContext.createBufferSource();
  const gain = state.audioContext.createGain();
  const safeLength = Math.max(0.02, Math.min(length, state.buffer.duration));
  const safeOffset = clampOffset(offset, safeLength);
  const fade = Math.min(FADE_SECONDS, safeLength / 4);
  const duration = safeLength / getSpeed();

  source.buffer = buffer;
  source.playbackRate.value = getSpeed();
  source.connect(gain).connect(state.masterGain);

  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(1, when + fade);
  gain.gain.setValueAtTime(1, Math.max(when + fade, when + duration - fade));
  gain.gain.linearRampToValueAtTime(0, when + duration);

  source.start(when, toBufferOffset(safeOffset, safeLength), safeLength);
  source.stop(when + duration + 0.01);
  const grain = { source, gain };
  state.activeGrains.add(grain);

  source.onended = () => {
    state.activeGrains.delete(grain);
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // Already disconnected.
    }
  };

  state.pausedAt = safeOffset;
  state.grainStartedAt = when;
  state.grainOffset = safeOffset;
  state.grainLength = safeLength;
}

function stopGrainScheduler() {
  if (state.schedulerTimer) {
    window.clearInterval(state.schedulerTimer);
    state.schedulerTimer = null;
  }
}

function stopActiveGrains() {
  if (!state.audioContext) return;
  const now = state.audioContext.currentTime;

  for (const grain of state.activeGrains) {
    try {
      const currentGain = grain.gain.gain.value;
      grain.gain.gain.cancelScheduledValues(now);
      grain.gain.gain.setValueAtTime(currentGain, now);
      grain.gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
      grain.source.stop(now + FADE_SECONDS + 0.003);
    } catch {
      // Grain may have ended naturally.
    }
  }
  state.activeGrains.clear();
}

function randomJump() {
  if (!state.buffer) return;

  const intensity = Number(els.jumpIntensity.value) / 100;
  const duration = state.buffer.duration;
  const current = getCurrentPosition();
  const maxDistance = duration * Math.max(0.05, intensity);
  const delta = (Math.random() * 2 - 1) * maxDistance;
  const fallback = Math.random() * duration;
  const target = intensity >= 0.98 ? fallback : wrap(current + delta, duration);

  jumpTo(target);
}

function jumpTo(target) {
  state.pausedAt = clampOffset(target);
  if (!state.isPlaying) {
    updateVisuals();
    return;
  }

  if (state.isLooping || state.isGlitching) {
    state.samplePoint = state.pausedAt;
    startGrainMode();
  } else {
    startLinearPlayback(state.pausedAt);
  }
}

function setSampleFromCurrentPosition() {
  if (!state.buffer) return;
  state.samplePoint = clampOffset(getCurrentPosition());
  els.status.textContent = `Samplepunt gezet op ${formatTime(state.samplePoint)}.`;
  if (state.isPlaying && state.isLooping) startGrainMode();
}

function toggleLoop() {
  if (!state.buffer) return;
  state.isLooping = !state.isLooping;
  if (state.isLooping) state.isGlitching = false;

  if (state.isPlaying) {
    state.pausedAt = getCurrentPosition();
    state.samplePoint = state.samplePoint || state.pausedAt;
    state.isLooping ? startGrainMode() : startLinearPlayback(state.pausedAt);
  }

  updateButtonStates();
  els.modeReadout.textContent = state.isLooping ? "Loop" : state.isPlaying ? "Play" : "Ready";
}

function stutter() {
  if (!state.buffer) return;

  state.isGlitching = false;
  state.isLooping = true;
  state.samplePoint = clampOffset(getCurrentPosition());
  state.glitchRepeatsLeft = 0;

  if (!state.isPlaying) {
    state.isPlaying = true;
    els.playPause.textContent = "Pause";
  }

  startTemporaryStutter();
  updateButtonStates();
}

function startTemporaryStutter() {
  stopSource();
  stopGrainScheduler();
  stopActiveGrains();

  const repeats = getRepeatCount();
  const length = Math.min(getLoopLength(), 0.5);
  let when = state.audioContext.currentTime + 0.02;

  for (let i = 0; i < repeats; i += 1) {
    scheduleGrain(state.samplePoint, length, when);
    when += length / getSpeed();
  }

  window.setTimeout(() => {
    if (!state.isPlaying || state.isGlitching) return;
    startGrainMode();
  }, Math.max(40, (when - state.audioContext.currentTime) * 1000));
  els.modeReadout.textContent = "Stutter";
}

function reverseSample() {
  if (!state.buffer) return;
  const position = getCurrentPosition();
  state.isReverse = !state.isReverse;
  state.pausedAt = clampOffset(position);

  if (state.isPlaying) {
    if (state.isLooping || state.isGlitching) startGrainMode();
    else startLinearPlayback(state.pausedAt);
  }

  updateButtonStates();
}

function toggleGlitchMode() {
  if (!state.buffer) return;
  state.isGlitching = !state.isGlitching;
  if (state.isGlitching) state.isLooping = false;

  if (state.isPlaying) {
    state.pausedAt = getCurrentPosition();
    state.isGlitching ? startGrainMode() : startLinearPlayback(state.pausedAt);
  }

  updateButtonStates();
  els.modeReadout.textContent = state.isGlitching ? "Glitch" : state.isPlaying ? "Play" : "Ready";
}

function prepareNextGlitchSlice() {
  if (!state.buffer) return;

  const minLength = 0.05;
  const maxLength = 0.5;
  const length = minLength + Math.random() * (maxLength - minLength);
  const maxOffset = Math.max(0, state.buffer.duration - length);
  const intensity = Number(els.jumpIntensity.value) / 100;
  const center = Math.random() < intensity ? Math.random() * maxOffset : getCurrentPosition();
  const spread = Math.max(length, state.buffer.duration * (0.05 + intensity * 0.45));

  state.glitchLength = length;
  state.glitchOffset = clampOffset(center + (Math.random() * 2 - 1) * spread, length);
  state.glitchRepeatsLeft = getRepeatCount();
}

function getCurrentPosition() {
  if (!state.buffer) return 0;

  if (!state.isPlaying) return clampOffset(state.pausedAt);
  if (state.isLooping || state.isGlitching) {
    const elapsed = Math.max(0, state.audioContext.currentTime - state.grainStartedAt) * getSpeed();
    const position = state.isReverse
      ? state.grainOffset + state.grainLength - elapsed
      : state.grainOffset + elapsed;
    return clampOffset(position);
  }

  const elapsed = (state.audioContext.currentTime - state.playStartedAt) * state.playSpeed;
  return clampOffset(state.isReverse ? state.playStartPosition - elapsed : state.playStartPosition + elapsed);
}

function getActiveBuffer() {
  return state.isReverse ? state.reversedBuffer : state.buffer;
}

function createReversedBuffer(buffer) {
  const reversed = state.audioContext.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const input = buffer.getChannelData(channel);
    const output = reversed.getChannelData(channel);
    for (let i = 0, j = input.length - 1; i < input.length; i += 1, j -= 1) {
      output[i] = input[j];
    }
  }

  return reversed;
}

function toBufferOffset(position, length = 0) {
  if (!state.isReverse || !state.buffer) return clampOffset(position);
  return Math.max(0, state.buffer.duration - position - length);
}

function clampOffset(value, neededLength = 0.02) {
  if (!state.buffer) return 0;
  const max = Math.max(0, state.buffer.duration - neededLength);
  return Math.min(Math.max(0, value), max);
}

function wrap(value, duration) {
  if (!duration) return 0;
  return ((value % duration) + duration) % duration;
}

function getSpeed() {
  return Number(els.speed.value);
}

function getLoopLength() {
  return Number(els.loopLength.value);
}

function getRepeatCount() {
  return Number(els.repeatCount.value);
}

function updateButtonStates() {
  const loaded = Boolean(state.buffer);
  els.playPause.textContent = state.isPlaying ? "Pause" : "Play";
  els.toggleLoop.classList.toggle("active", state.isLooping);
  els.toggleLoop.setAttribute("aria-pressed", String(state.isLooping));
  els.reverseSample.classList.toggle("active", state.isReverse);
  els.reverseSample.setAttribute("aria-pressed", String(state.isReverse));
  els.glitchMode.classList.toggle("active", state.isGlitching);
  els.glitchMode.classList.toggle("danger", state.isGlitching);
  els.glitchMode.setAttribute("aria-pressed", String(state.isGlitching));
  setControlsEnabled(loaded);
}

function setControlsEnabled(enabled) {
  for (const control of [
    els.playPause,
    els.randomJump,
    els.setSample,
    els.toggleLoop,
    els.stutter,
    els.reverseSample,
    els.glitchMode,
    els.speed,
    els.loopLength,
    els.jumpIntensity,
    els.repeatCount,
    els.volume,
  ]) {
    control.disabled = !enabled;
  }
}

function updateSliderLabels() {
  els.speedValue.textContent = `${Number(els.speed.value).toFixed(2)}x`;
  els.loopLengthValue.textContent =
    Number(els.loopLength.value) < 1
      ? `${Math.round(Number(els.loopLength.value) * 1000)}ms`
      : `${Number(els.loopLength.value).toFixed(2)}s`;
  els.jumpValue.textContent = `${els.jumpIntensity.value}%`;
  els.repeatValue.textContent = els.repeatCount.value;
  els.volumeValue.textContent = `${Math.round(Number(els.volume.value) * 100)}%`;
}

function updateVisuals(time = 0) {
  if (time - state.lastVisualTick > 33) {
    const position = getCurrentPosition();
    const duration = state.buffer?.duration || 0;
    els.positionReadout.textContent = formatTime(position);
    els.sampleReadout.textContent = formatTime(state.samplePoint);
    els.progressBar.style.width = duration ? `${(position / duration) * 100}%` : "0%";
    state.lastVisualTick = time;
  }

  requestAnimationFrame(updateVisuals);
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
