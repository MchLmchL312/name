import { currentContext } from './context.js';
const root = document.getElementById('admin-gate');
try {
  const context = currentContext();
  const metadataResponse = await fetch(`${context.base}/course.json`, { cache: 'no-store' });
  if (!metadataResponse.ok) throw new Error('Deze cursus kan niet worden geladen.');
  const metadata = await metadataResponse.json();
  if (metadata.id !== context.id) throw new Error('Het cursusadres komt niet overeen.');
  const authResponse = await fetch(`${context.base}/content/admin-auth.json`, { cache: 'no-store' });
  if (authResponse.status === 404) {
    const message = document.createElement('p'); message.textContent = 'Deze cursus moet nog worden ingericht.';
    const link = document.createElement('a'); link.href = `/cursus/beheer/?inrichten=${encodeURIComponent(context.id)}`; link.textContent = 'Cursus inrichten';
    root.className = 'auth-card setup-card'; root.append(message, link);
  } else {
    if (!authResponse.ok) throw new Error('De cursuslogin kon niet worden geladen. Probeer het later opnieuw.');
    const auth = await authResponse.json();
    if (auth.version !== 1 || typeof auth.verifier !== 'string') throw new Error('De cursuslogin is ongeldig.');
    globalThis.__COURSE_METADATA__ = { name: metadata.name };
    const [{ default: AdminGate }, { default: mountReact }, { installRichHeadingButtons }] = await Promise.all([
      import('./admin.js'), import('/cursus/assets/client.BtDnPCOE.js'), import('/cursus/assets/rich-heading-buttons.20260818.js')
    ]);
    installRichHeadingButtons();
    mountReact(root)(AdminGate, {}, {}, { client: 'only' });
  }
} catch (error) { root.textContent = error.message; root.setAttribute('role', 'alert'); }
