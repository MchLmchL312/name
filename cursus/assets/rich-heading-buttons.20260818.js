const EDITOR_SELECTOR = ".rich-editor-content";
const TOOLBAR_SELECTOR = ".rich-toolbar";

function editorForToolbar(toolbar) {
  return toolbar.closest(".rich-editor")?.querySelector(EDITOR_SELECTOR) ?? null;
}

function activeHeadingLevel(toolbar) {
  const editor = editorForToolbar(toolbar);
  const selection = document.getSelection();
  const anchor = selection?.anchorNode;
  const element = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
  const heading = element?.closest?.("h2, h3");

  if (!editor || !element || !editor.contains(element) || !heading) {
    return 0;
  }

  return Number(heading.tagName.slice(1));
}

function refreshButtons() {
  document.querySelectorAll(TOOLBAR_SELECTOR).forEach((toolbar) => {
    const activeLevel = activeHeadingLevel(toolbar);

    toolbar.querySelectorAll("[data-heading-level]").forEach((button) => {
      const isActive = Number(button.dataset.headingLevel) === activeLevel;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  });
}

function toggleHeading(toolbar, level) {
  const editor = editorForToolbar(toolbar);
  if (!editor) {
    return;
  }

  editor.focus({ preventScroll: true });

  const isApple = /Mac|iPhone|iPad/.test(navigator.platform);
  const handled = !editor.dispatchEvent(new KeyboardEvent("keydown", {
    key: String(level),
    code: `Digit${level}`,
    altKey: true,
    ctrlKey: !isApple,
    metaKey: isApple,
    bubbles: true,
    cancelable: true,
  }));

  if (!handled && typeof document.execCommand === "function") {
    document.execCommand("formatBlock", false, `h${level}`);
  }

  requestAnimationFrame(refreshButtons);
}

function createHeadingButton(toolbar, level) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `Kop ${level}`;
  button.dataset.headingLevel = String(level);
  button.title = `Maak van deze alinea een kop ${level}`;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => toggleHeading(toolbar, level));
  return button;
}

function enhanceToolbar(toolbar) {
  const existingButtons = toolbar.querySelectorAll("[data-heading-level]");
  if (existingButtons.length === 2) {
    return;
  }

  existingButtons.forEach((button) => button.remove());

  const italicButton = Array.from(toolbar.children).find((button) =>
    button.textContent?.trim() === "Cursief"
  );
  const insertionPoint = italicButton?.nextSibling ?? toolbar.firstChild;

  toolbar.insertBefore(createHeadingButton(toolbar, 2), insertionPoint);
  toolbar.insertBefore(createHeadingButton(toolbar, 3), insertionPoint);
}

function enhanceAllToolbars() {
  document.querySelectorAll(TOOLBAR_SELECTOR).forEach(enhanceToolbar);
  refreshButtons();
}

export function installRichHeadingButtons() {
  const observer = new MutationObserver(enhanceAllToolbars);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("selectionchange", refreshButtons);
  enhanceAllToolbars();
}
