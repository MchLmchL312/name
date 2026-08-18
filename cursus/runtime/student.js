const DB_NAME = 'machiel-les-toegang';
const STORE = 'sleutels';
const KEY_NAME = 'seizoen';
const COURSE_BASE = '/cursus';
const YOUTUBE_EMBED_LABEL = '__youtube_embed_v1__';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeKey(key) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(key, KEY_NAME);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function readKey() {
  const db = await openDb();
  const key = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(KEY_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return key;
}

async function clearKey() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(KEY_NAME);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

async function deriveKey(password, config) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(config.salt), iterations: config.iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptJson(envelope, key) {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.data)
    );
    return JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error('Het seizoenswachtwoord is niet juist.');
  }
}

async function fetchJson(path, optional = false) {
  const response = await fetch(path, { cache: 'no-store' });
  if (optional && response.status === 404) return null;
  if (!response.ok) throw new Error('De lessen konden niet worden geladen. Probeer het later opnieuw.');
  return response.json();
}

function safeUrl(value) {
  if (typeof value !== 'string') return '';
  if (value.startsWith(COURSE_BASE) || value.startsWith('/media/') || value.startsWith('/cursus/media/')) return value;
  try {
    return ['https:', 'mailto:'].includes(new URL(value).protocol) ? value : '';
  } catch {
    return '';
  }
}

function youtubeVideoId(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const parts = url.pathname.split('/').filter(Boolean);
    let id = '';
    if (host === 'youtu.be') id = parts[0] || '';
    if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      if (['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1] || '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

function youtubeEmbedUrl(value) {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}

function safeRichText(html) {
  const allowed = new Set(['P', 'BR', 'STRONG', 'EM', 'U', 'S', 'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A']);
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const clean = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (!(node instanceof Element) || !allowed.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      [...node.childNodes].forEach((child) => fragment.append(clean(child)));
      return fragment;
    }
    const element = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'A') {
      const href = safeUrl(node.getAttribute('href') || '');
      if (href) {
        element.href = href;
        element.rel = 'noopener noreferrer';
        if (href.startsWith('https:')) element.target = '_blank';
      }
    }
    [...node.childNodes].forEach((child) => element.append(clean(child)));
    return element;
  };
  const fragment = document.createDocumentFragment();
  [...parsed.body.childNodes].forEach((node) => fragment.append(clean(node)));
  return fragment;
}

function renderBlock(block) {
  const wrapper = document.createElement('div');
  wrapper.className = `content-block block-${block.type}`;
  if (block.type === 'richText') wrapper.append(safeRichText(block.html || ''));
  if (block.type === 'heading') {
    const heading = document.createElement(block.level === 'h3' ? 'h3' : 'h2');
    heading.textContent = block.text;
    wrapper.append(heading);
  }
  if (block.type === 'image') {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = safeUrl(block.src);
    image.alt = block.alt || '';
    image.loading = 'lazy';
    figure.append(image);
    if (block.caption) {
      const caption = document.createElement('figcaption');
      caption.textContent = block.caption;
      figure.append(caption);
    }
    wrapper.append(figure);
  }
  if (block.type === 'gallery') {
    const gallery = document.createElement('div');
    gallery.className = 'published-gallery';
    (block.items || []).forEach((item) => {
      const image = document.createElement('img');
      image.src = safeUrl(item.src);
      image.alt = item.alt || '';
      image.loading = 'lazy';
      gallery.append(image);
    });
    wrapper.append(gallery);
  }
  if (block.type === 'externalLink' && block.label === YOUTUBE_EMBED_LABEL) {
    const embedUrl = youtubeEmbedUrl(block.url);
    if (embedUrl) {
      const embed = document.createElement('div');
      embed.className = 'youtube-embed';
      const frame = document.createElement('iframe');
      frame.src = embedUrl;
      frame.title = 'YouTube-video';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      embed.append(frame);
      wrapper.append(embed);
    } else {
      const warning = document.createElement('p');
      warning.className = 'youtube-warning';
      warning.textContent = 'Plak een geldige YouTube-link in het videoblok.';
      wrapper.append(warning);
    }
  }
  if (block.type === 'button' || (block.type === 'externalLink' && block.label !== YOUTUBE_EMBED_LABEL)) {
    const link = document.createElement('a');
    link.className = block.type === 'button' ? 'published-button' : 'published-link';
    link.href = safeUrl(block.href || block.url);
    link.textContent = block.label;
    link.rel = 'noopener noreferrer';
    if (link.href.startsWith('http')) link.target = '_blank';
    wrapper.append(link);
  }
  if (block.type === 'pdf') {
    const link = document.createElement('a');
    link.className = 'pdf-card';
    link.href = safeUrl(block.url);
    link.textContent = `PDF - ${block.title}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    wrapper.append(link);
  }
  if (block.type === 'divider') wrapper.append(document.createElement('hr'));
  if (block.type === 'spacer') wrapper.style.height = { small: '24px', medium: '54px', large: '90px' }[block.size] || '24px';
  return wrapper;
}

function renderPage(page) {
  document.title = `${page.title} | Cursus`;
  const root = document.querySelector('[data-protected-page]');
  if (!root) return;
  root.replaceChildren();
  const article = document.createElement('article');
  article.className = 'published-page';
  const header = document.createElement('header');
  header.className = 'published-hero';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = [page.course, page.module, page.date].filter(Boolean).join(' - ') || 'Cursusles';
  const title = document.createElement('h1');
  title.textContent = page.title;
  const summary = document.createElement('p');
  summary.textContent = page.summary || '';
  header.append(eyebrow, title, summary);
  article.append(header);
  (page.sections || []).forEach((section) => {
    const sectionElement = document.createElement('section');
    sectionElement.className = `published-section columns-${section.columns.length}`;
    section.columns.forEach((column) => {
      const columnElement = document.createElement('div');
      columnElement.className = 'published-column';
      column.blocks.forEach((block) => columnElement.append(renderBlock(block)));
      sectionElement.append(columnElement);
    });
    article.append(sectionElement);
  });
  const controls = document.createElement('div');
  controls.className = 'student-controls';
  const back = document.createElement('a');
  back.href = `${COURSE_BASE}/`;
  back.textContent = 'Terug naar alle lessen';
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.textContent = 'Uitloggen';
  logout.addEventListener('click', async () => {
    await clearKey();
    location.href = `${COURSE_BASE}/`;
  });
  controls.append(back, logout);
  article.prepend(controls);
  root.append(article);
}

function renderIndex(entries) {
  document.getElementById('login-panel')?.classList.add('hidden');
  document.getElementById('lesson-panel')?.classList.remove('hidden');
  const list = document.getElementById('lesson-list');
  if (!list) return;
  list.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Er zijn nog geen lessen gepubliceerd.';
    list.append(empty);
    return;
  }
  const orderValue = (entry) => Number.isFinite(entry.sortOrder)
    ? entry.sortOrder
    : -(Date.parse(entry.updatedAt || entry.date || '') || 0);
  entries.sort((a, b) => orderValue(a) - orderValue(b) || (b.date || '').localeCompare(a.date || '') || String(a.title || '').localeCompare(String(b.title || ''))).forEach((entry) => {
    const link = document.createElement('a');
    link.href = entry.href;
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const meta = document.createElement('span');
    meta.textContent = [entry.date, entry.summary].filter(Boolean).join(' - ');
    link.append(title, meta);
    list.append(link);
  });
}

async function loadManifest(key) {
  const envelope = await fetchJson(`${COURSE_BASE}/content/protected/index.enc.json`, true);
  if (!envelope) return [];
  return decryptJson(envelope, key);
}

async function startIndex() {
  const form = document.getElementById('student-login-form');
  const message = document.getElementById('login-message');
  document.getElementById('student-logout')?.addEventListener('click', async () => {
    await clearKey();
    location.reload();
  });
  const existing = await readKey();
  if (existing) {
    try {
      renderIndex(await loadManifest(existing));
      return;
    } catch {
      await clearKey();
    }
  }
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'De lessen worden geopend...';
    try {
      const password = new FormData(form).get('password');
      if (typeof password !== 'string' || password.length < 12) throw new Error('Gebruik het volledige seizoenswachtwoord.');
      const config = await fetchJson(`${COURSE_BASE}/content/security.json`);
      const key = await deriveKey(password, config);
      const entries = await loadManifest(key);
      await storeKey(key);
      renderIndex(entries);
      message.textContent = '';
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : 'Inloggen is niet gelukt.';
    }
  });
}

async function startLesson(slug) {
  const root = document.querySelector('[data-protected-page]');
  try {
    const key = await readKey();
    if (!key) {
      location.href = `${COURSE_BASE}/?terug=${encodeURIComponent(location.pathname)}`;
      return;
    }
    const envelope = await fetchJson(`${COURSE_BASE}/content/protected/${encodeURIComponent(slug)}.enc.json`);
    renderPage(await decryptJson(envelope, key));
  } catch (error) {
    await clearKey();
    if (root) root.innerHTML = `<div class="lesson-error"><h1>Deze les kan niet worden geopend</h1><p>${error instanceof Error ? error.message : 'Probeer opnieuw in te loggen.'}</p><a href="${COURSE_BASE}/">Naar de cursuslogin</a></div>`;
  }
}

if (document.querySelector('[data-student-index]')) startIndex();
if (window.__LESSON_SLUG__) startLesson(window.__LESSON_SLUG__);
