(function () {
  "use strict";

  const BOARD_WIDTH = 1200;
  const BOARD_HEIGHT = 900;
  const JPEG_QUALITY = 0.86;
  const MIN_ITEM_SIZE = 30;
  const HANDLE_SIZE = 24;

  const canvas = document.getElementById("boardCanvas");
  const ctx = canvas.getContext("2d");
  const fileInput = document.getElementById("fileInput");
  const addButton = document.getElementById("addButton");
  const saveButton = document.getElementById("saveButton");
  const dropZone = document.getElementById("dropZone");
  const nextName = document.getElementById("nextName");
  const statusText = document.getElementById("statusText");
  const layers = document.getElementById("layers");
  const selectionName = document.getElementById("selectionName");
  const scaleSlider = document.getElementById("scaleSlider");
  const forwardButton = document.getElementById("forwardButton");
  const backwardButton = document.getElementById("backwardButton");
  const deleteButton = document.getElementById("deleteButton");
  const toast = document.getElementById("toast");
  const swatches = Array.from(document.querySelectorAll(".swatch"));

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = BOARD_WIDTH;
  exportCanvas.height = BOARD_HEIGHT;
  const exportCtx = exportCanvas.getContext("2d");

  const state = {
    background: "#808080",
    items: [],
    selectedId: null,
    nextFileName: "",
    interaction: null,
    toastTimer: 0
  };

  function uid() {
    return "item-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function selectedItem() {
    return state.items.find((item) => item.id === state.selectedId) || null;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function boardPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT
    };
  }

  function fitItemToBoard(image) {
    const maxWidth = BOARD_WIDTH * 0.45;
    const maxHeight = BOARD_HEIGHT * 0.58;
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
    return {
      width: Math.max(MIN_ITEM_SIZE, image.naturalWidth * scale),
      height: Math.max(MIN_ITEM_SIZE, image.naturalHeight * scale)
    };
  }

  function normalizePosition(item) {
    item.width = clamp(item.width, MIN_ITEM_SIZE, BOARD_WIDTH);
    item.height = clamp(item.height, MIN_ITEM_SIZE, BOARD_HEIGHT);
    item.x = clamp(item.x, 0, Math.max(0, BOARD_WIDTH - item.width));
    item.y = clamp(item.y, 0, Math.max(0, BOARD_HEIGHT - item.height));
  }

  function render(targetCtx, includeSelection) {
    targetCtx.save();
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = "high";
    targetCtx.fillStyle = state.background;
    targetCtx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    for (const item of state.items) {
      targetCtx.drawImage(item.image, item.x, item.y, item.width, item.height);
    }

    if (includeSelection) {
      const item = selectedItem();
      if (item) {
        targetCtx.strokeStyle = "#ffe45c";
        targetCtx.lineWidth = 3;
        targetCtx.setLineDash([12, 8]);
        targetCtx.strokeRect(item.x, item.y, item.width, item.height);
        targetCtx.setLineDash([]);
        targetCtx.fillStyle = "#ffe45c";
        targetCtx.strokeStyle = "#101010";
        targetCtx.lineWidth = 2;
        const size = HANDLE_SIZE;
        const hx = item.x + item.width - size / 2;
        const hy = item.y + item.height - size / 2;
        targetCtx.fillRect(hx, hy, size, size);
        targetCtx.strokeRect(hx, hy, size, size);
      }
    }

    targetCtx.restore();
  }

  function draw() {
    render(ctx, true);
  }

  function showToast(message) {
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function setStatus(message) {
    statusText.textContent = message;
  }

  function updateSelectionControls() {
    const item = selectedItem();
    const hasSelection = Boolean(item);
    forwardButton.disabled = !hasSelection;
    backwardButton.disabled = !hasSelection;
    deleteButton.disabled = !hasSelection;
    scaleSlider.disabled = !hasSelection;

    if (!item) {
      selectionName.textContent = "Geen selectie";
      scaleSlider.value = "100";
      return;
    }

    const percent = Math.round((item.width / item.baseWidth) * 100);
    scaleSlider.value = String(clamp(percent, Number(scaleSlider.min), Number(scaleSlider.max)));
    selectionName.textContent = item.name;
  }

  function updateLayers() {
    layers.innerHTML = "";
    const ordered = [...state.items].reverse();

    for (const item of ordered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "layer" + (item.id === state.selectedId ? " is-active" : "");
      button.title = item.name;
      button.dataset.id = item.id;

      const thumb = document.createElement("img");
      thumb.src = item.src;
      thumb.alt = "";

      const label = document.createElement("span");
      label.textContent = item.name;

      button.append(thumb, label);
      layers.appendChild(button);
    }
  }

  function refreshUi() {
    swatches.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.bg === state.background);
    });
    saveButton.disabled = state.items.length === 0;
    updateSelectionControls();
    updateLayers();
    draw();
  }

  async function refreshStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Status niet beschikbaar");
      }

      const data = await response.json();
      state.nextFileName = data.nextName || "";
      nextName.textContent = state.nextFileName || "board...";
      setStatus("Klaar voor " + state.nextFileName);
    } catch (error) {
      nextName.textContent = "server offline";
      setStatus("Start via start-board-creator.cmd");
    }
  }

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Kan bestand niet lezen"));
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve({ file, image, src: String(reader.result) });
        image.onerror = () => reject(new Error("Kan afbeelding niet laden"));
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      return;
    }

    for (const file of files) {
      try {
        const loaded = await loadImageFile(file);
        const size = fitItemToBoard(loaded.image);
        const offset = (state.items.length % 6) * 28;
        const item = {
          id: uid(),
          name: loaded.file.name,
          src: loaded.src,
          image: loaded.image,
          naturalWidth: loaded.image.naturalWidth,
          naturalHeight: loaded.image.naturalHeight,
          baseWidth: size.width,
          baseHeight: size.height,
          x: (BOARD_WIDTH - size.width) / 2 + offset,
          y: (BOARD_HEIGHT - size.height) / 2 + offset,
          width: size.width,
          height: size.height
        };
        normalizePosition(item);
        state.items.push(item);
        state.selectedId = item.id;
      } catch (error) {
        showToast(file.name + " kon niet worden geladen");
      }
    }

    refreshUi();
  }

  function hitHandle(item, point) {
    const hx = item.x + item.width;
    const hy = item.y + item.height;
    return Math.abs(point.x - hx) <= HANDLE_SIZE && Math.abs(point.y - hy) <= HANDLE_SIZE;
  }

  function hitItem(item, point) {
    return point.x >= item.x && point.x <= item.x + item.width && point.y >= item.y && point.y <= item.y + item.height;
  }

  function findHit(point) {
    for (let i = state.items.length - 1; i >= 0; i--) {
      const item = state.items[i];
      if (hitItem(item, point)) {
        return item;
      }
    }
    return null;
  }

  function pointerDown(event) {
    const point = boardPoint(event);
    const current = selectedItem();
    let item = current && hitHandle(current, point) ? current : findHit(point);

    if (!item) {
      state.selectedId = null;
      state.interaction = null;
      refreshUi();
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    state.selectedId = item.id;

    const mode = hitHandle(item, point) ? "resize" : "move";
    state.interaction = {
      pointerId: event.pointerId,
      mode,
      startPoint: point,
      startX: item.x,
      startY: item.y,
      startWidth: item.width,
      startHeight: item.height
    };

    refreshUi();
  }

  function pointerMove(event) {
    const interaction = state.interaction;
    const item = selectedItem();
    if (!interaction || !item || interaction.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const point = boardPoint(event);
    const dx = point.x - interaction.startPoint.x;
    const dy = point.y - interaction.startPoint.y;

    if (interaction.mode === "move") {
      item.x = interaction.startX + dx;
      item.y = interaction.startY + dy;
    } else {
      const aspect = interaction.startHeight / interaction.startWidth;
      const requestedWidth = interaction.startWidth + Math.max(dx, dy / aspect);
      item.width = clamp(requestedWidth, MIN_ITEM_SIZE, BOARD_WIDTH);
      item.height = item.width * aspect;
      if (item.height > BOARD_HEIGHT) {
        item.height = BOARD_HEIGHT;
        item.width = item.height / aspect;
      }
    }

    normalizePosition(item);
    updateSelectionControls();
    draw();
  }

  function pointerUp(event) {
    if (state.interaction && state.interaction.pointerId === event.pointerId) {
      state.interaction = null;
      canvas.releasePointerCapture(event.pointerId);
      refreshUi();
    }
  }

  function moveSelectedLayer(delta) {
    const index = state.items.findIndex((item) => item.id === state.selectedId);
    if (index < 0) {
      return;
    }

    const nextIndex = clamp(index + delta, 0, state.items.length - 1);
    if (nextIndex === index) {
      return;
    }

    const item = state.items.splice(index, 1)[0];
    state.items.splice(nextIndex, 0, item);
    refreshUi();
  }

  function deleteSelected() {
    const index = state.items.findIndex((item) => item.id === state.selectedId);
    if (index < 0) {
      return;
    }

    state.items.splice(index, 1);
    state.selectedId = state.items.length ? state.items[Math.min(index, state.items.length - 1)].id : null;
    refreshUi();
  }

  function resizeSelectedWithSlider() {
    const item = selectedItem();
    if (!item) {
      return;
    }

    const scale = Number(scaleSlider.value) / 100;
    item.width = item.baseWidth * scale;
    item.height = item.baseHeight * scale;
    normalizePosition(item);
    draw();
  }

  async function saveBoard() {
    if (!state.items.length) {
      showToast("Voeg eerst een afbeelding toe");
      return;
    }

    saveButton.disabled = true;
    saveButton.querySelector("span:last-child").textContent = "Opslaan...";
    setStatus("Opslaan...");

    try {
      render(exportCtx, false);
      const image = exportCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Opslaan mislukt");
      }

      showToast("Opgeslagen als " + data.name);
      state.nextFileName = data.nextName || "";
      nextName.textContent = state.nextFileName || "board...";
      setStatus("Opgeslagen als " + data.name);
    } catch (error) {
      showToast(error.message || "Opslaan mislukt");
      setStatus(error.message || "Opslaan mislukt");
    } finally {
      saveButton.querySelector("span:last-child").textContent = "Opslaan";
      refreshUi();
      refreshStatus();
    }
  }

  addButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  swatches.forEach((button) => {
    button.addEventListener("click", () => {
      state.background = button.dataset.bg;
      refreshUi();
    });
  });

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
    addFiles(event.dataTransfer.files);
  });

  layers.addEventListener("click", (event) => {
    const button = event.target.closest(".layer");
    if (!button) {
      return;
    }
    state.selectedId = button.dataset.id;
    refreshUi();
  });

  forwardButton.addEventListener("click", () => moveSelectedLayer(1));
  backwardButton.addEventListener("click", () => moveSelectedLayer(-1));
  deleteButton.addEventListener("click", deleteSelected);
  scaleSlider.addEventListener("input", resizeSelectedWithSlider);
  saveButton.addEventListener("click", saveBoard);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      const active = document.activeElement;
      if (active && ["INPUT", "TEXTAREA"].includes(active.tagName)) {
        return;
      }
      deleteSelected();
    }
  });

  refreshUi();
  refreshStatus();
})();
