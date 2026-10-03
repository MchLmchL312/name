import { contextFor } from './context.js';
import { createCourse } from './creation.js';
import { installAtelierBoundary } from './atelier-boundary.js';
const root = document.getElementById('admin-gate');
const params = new URLSearchParams(location.search);

async function mountAtelier() {
  installAtelierBoundary();
  const [{ default: AdminGate }, { default: mountReact }, { installRichHeadingButtons }] = await Promise.all([
    import('/cursus/assets/AdminGate.j8ckIzFX.js?v=youtube-embed-20260818'),
    import('/cursus/assets/client.BtDnPCOE.js'),
    import('/cursus/assets/rich-heading-buttons.20260818.js')
  ]);
  installRichHeadingButtons();
  mountReact(root)(AdminGate, {}, {}, { client: 'only' });
}
function element(tag, text, className) {
  const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node;
}
function link(text, href, className) { const node = element('a', text, className); node.href = href; return node; }
function field(form, label, name, type = 'text', value = '') {
  const wrapper = element('label', label); const input = document.createElement('input');
  Object.assign(input, { name, type, value, required: true });
  if (type === 'password') { input.minLength = 12; input.autocomplete = name === 'ownerPassword' ? 'current-password' : 'new-password'; }
  wrapper.append(input); form.append(wrapper); return input;
}
function creationForm(courses) {
  const target = params.get('inrichten');
  if (target && !courses.some(course => course.id === target && !course.configured)) throw new Error('Deze cursus bestaat al of kan niet worden ingericht.');
  const section = element('section', '', 'course-create');
  section.append(element('h2', target ? 'Online cursus inrichten' : 'Nieuwe cursus aanmaken'),
    element('p', 'Kies een eigen beheerwachtwoord en cursistenwachtwoord. De cursus verschijnt na publicatie op een eigen webadres.'));
  const form = document.createElement('form');
  const name = field(form, 'Cursusnaam', 'name', 'text', courses.find(course => course.id === target)?.name || ''); name.maxLength = 120;
  const id = field(form, 'Cursusadres', 'id', 'text', target || ''); id.pattern = '[a-z0-9]+(-[a-z0-9]+)*'; id.maxLength = 64; if (target) id.readOnly = true;
  const preview = element('small', `/cursus/cursussen/${id.value || 'cursusnaam'}/`); id.parentElement.append(preview);
  id.addEventListener('input', () => { preview.textContent = `/cursus/cursussen/${id.value || 'cursusnaam'}/`; });
  field(form, 'Nieuw beheerwachtwoord', 'adminPassword', 'password');
  field(form, 'Herhaal beheerwachtwoord', 'adminRepeat', 'password');
  field(form, 'Nieuw cursistenwachtwoord', 'studentPassword', 'password');
  field(form, 'Herhaal cursistenwachtwoord', 'studentRepeat', 'password');
  const permission = element('fieldset'); permission.append(element('legend', 'Beheer bevestigen'));
  permission.append(element('p', 'Gebruik je bestaande atelier-beheerwachtwoord om een cursus toe te voegen.'));
  field(permission, 'Bestaand atelier-beheerwachtwoord', 'ownerPassword', 'password');
  form.append(permission);
  const github = element('fieldset'); github.append(element('legend', 'Publicatieverbinding'));
  field(github, 'GitHub-eigenaar', 'owner'); field(github, 'Repository', 'repo'); field(github, 'Branch', 'branch', 'text', 'main');
  const token = field(github, 'GitHub-sleutel met schrijfrecht voor deze repository', 'token', 'password'); token.minLength = 1; token.autocomplete = 'off';
  github.append(element('small', 'De sleutel wordt alleen voor deze publicatie gebruikt. Je verbindt het nieuwe lesbeheer daarna via Instellingen.'));
  form.append(github);
  const button = element('button', target ? 'Cursus inrichten en publiceren' : 'Cursus aanmaken en publiceren', 'admin-button'); button.type = 'submit';
  const status = element('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  form.append(button, status);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (button.disabled) return;
    button.disabled = true; status.textContent = 'Wachtwoorden controleren en cursus aanmaken…';
    const data = Object.fromEntries(new FormData(form));
    try {
      const { sha, context } = await createCourse({ owner: data.owner.trim(), repo: data.repo.trim(), branch: data.branch.trim(), token: data.token.trim() }, data);
      for (const input of form.querySelectorAll('input[type=password]')) input.value = '';
      status.replaceChildren(element('span', `Cursus aangemaakt. GitHub-versie ${sha.slice(0, 7)}. De website wordt nu bijgewerkt; dit kan enkele minuten duren. `),
        link('Open het nieuwe lesbeheer', `${context.base}/beheer/`), document.createTextNode(' · '), link('Cursistenlogin', `${context.base}/`));
    } catch (error) { status.textContent = error.message; }
    finally { for (const key of ['token', 'ownerPassword', 'adminPassword', 'adminRepeat', 'studentPassword', 'studentRepeat']) data[key] = ''; button.disabled = false; }
  });
  section.append(form); return section;
}

async function showSelector() {
  const main = element('main', '', 'course-selector');
  main.append(element('p', 'Lesbeheer', 'admin-eyebrow'), element('h1', 'Kies een cursus'), element('p', 'Iedere cursus heeft eigen lessen en eigen toegang.'));
  const grid = element('div', '', 'course-grid');
  const atelier = element('article', '', 'course-card');
  atelier.append(element('h2', 'Atelier / offline'), element('p', 'De bestaande ateliercursus.'),
    link('Open lesbeheer', '/cursus/beheer/?cursus=atelier', 'admin-button'), link('Cursistenlogin', '/cursus/'));
  grid.append(atelier); main.append(grid); root.replaceChildren(main);
  const response = await fetch('/cursus/content/courses.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('De cursuslijst kon niet worden geladen. De ateliercursus blijft bereikbaar via bovenstaande knop.');
  const registry = await response.json();
  if (registry.version !== 1 || !Array.isArray(registry.courses)) throw new Error('De cursuslijst is ongeldig.');
  for (const course of registry.courses) {
    const context = contextFor(course.id); const card = element('article', '', 'course-card');
    card.append(element('h2', course.name), element('p', course.configured ? 'Afzonderlijke cursusomgeving.' : 'Stel eerst de eigen wachtwoorden in.'),
      link(course.configured ? 'Open lesbeheer' : 'Cursus inrichten', course.configured ? `${context.base}/beheer/` : `?inrichten=${course.id}`, 'admin-button'),
      link('Cursistenlogin', `${context.base}/`)); grid.append(card);
  }
  main.append(link('+ Nieuwe cursus', '?nieuw=1', 'admin-button secondary'));
  if (params.has('nieuw') || params.has('inrichten')) main.append(creationForm(registry.courses));
}
try {
  if (params.get('cursus') === 'atelier') {
    const switcher = element('div', '', 'course-switch'); switcher.append(link('← Andere cursus kiezen', '/cursus/beheer/'), link('+ Nieuwe cursus', '/cursus/beheer/?nieuw=1'));
    root.before(switcher); await mountAtelier();
  } else { await showSelector(); }
} catch (error) { const message = element('p', error.message); message.setAttribute('role', 'alert'); root.append(message); }
