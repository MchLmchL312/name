// The unchanged atelier editor restores every blob under cursus/. Exclude only
// the new subsystem from its tree inventory; keep every atelier entry intact.
const newPaths = ['cursus/cursussen/', 'cursus/multi-course/'];
export function isNewSystemPath(path) {
  return path === 'cursus/content/courses.json' || path === 'cursus/beheer/index.html' || path === 'cursus/index.html' || newPaths.some(prefix => path.startsWith(prefix));
}
export function installAtelierBoundary() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input, options) {
    const url = new URL(typeof input === 'string' ? input : input.url, globalThis.location.origin);
    const isGitHubTree = url.origin === 'https://api.github.com' && /^\/repos\/[^/]+\/[^/]+\/git\/trees(?:\/[^/]+)?$/.test(url.pathname);
    if (isGitHubTree && options?.method === 'POST') {
      const body = JSON.parse(options.body);
      if (body.tree?.some(file => isNewSystemPath(file.path))) throw new Error('De atelierbewerking probeert bestanden van een andere cursus te wijzigen.');
    }
    const response = await originalFetch(input, options);
    if (isGitHubTree && (!options?.method || options.method === 'GET') && response.ok && url.searchParams.get('recursive') === '1') {
      const body = await response.json();
      body.tree = body.tree.filter(file => !isNewSystemPath(file.path));
      return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
    }
    return response;
  };
}
