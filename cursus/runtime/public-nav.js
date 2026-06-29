async function addPublishedPages() {
  const COURSE_BASE = '/cursus';
  const navigations = document.querySelectorAll('[data-public-nav]');
  if (!navigations.length) return;
  try {
    const response = await fetch(`${COURSE_BASE}/content/pages/index.json`, { cache: 'no-store' });
    if (!response.ok) return;
    const pages = await response.json();
    const orderValue = (page) => Number.isFinite(page.sortOrder)
      ? page.sortOrder
      : -(Date.parse(page.updatedAt || page.date || '') || 0);
    pages
      .filter((page) => page.menu && typeof page.href === 'string' && page.href.startsWith(COURSE_BASE) && !page.href.startsWith(`${COURSE_BASE}/beheer/`))
      .sort((a, b) => orderValue(a) - orderValue(b) || String(a.title || '').localeCompare(String(b.title || '')))
      .forEach((page) => {
        navigations.forEach((navigation) => {
          if (navigation.querySelector(`[href="${CSS.escape(page.href)}"]`)) return;
          const link = document.createElement('a');
          link.href = page.href;
          link.textContent = page.title;
          const login = navigation.querySelector(`[href="${COURSE_BASE}/"]`);
          navigation.insertBefore(link, login);
        });
      });
  } catch {
    /* De vaste navigatie blijft bruikbaar als het menu niet geladen kan worden. */
  }
}

addPublishedPages();
