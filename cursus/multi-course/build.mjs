// Build a separate editor from the deployed atelier bundle. Never edit the source bundle.
// Exact replacements fail closed if the source changes; regenerate and run the isolation tests.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
let admin = readFileSync(new URL('assets/AdminGate.j8ckIzFX.js', root), 'utf8');
function replaceOnce(from, to) {
  if (admin.split(from).length !== 2) throw new Error(`Expected exactly one editor anchor: ${from}`);
  admin = admin.replace(from, to);
}
replaceOnce('from"./index.CCgrM4u1.js"', 'from"../assets/index.CCgrM4u1.js"');
replaceOnce('pc="machiel-admin-auth",ta="machiel-admin-unlocked",yb="/cursus/content/admin-auth.json"', 'pc=courseContext.storage+":auth",ta=courseContext.storage+":unlocked",yb=courseContext.base+"/content/admin-auth.json"');
replaceOnce('trustedDeviceDb="machiel-cursus-admin"', 'trustedDeviceDb=courseContext.storage+":admin"');
replaceOnce('bx="machiel-lesbeheer"', 'bx=courseContext.storage+":editor"');
admin = admin.replaceAll('"machiel-repository"', '(courseContext.storage+":repository")');
replaceOnce('ld="cursus/"', 'ld=courseContext.repoBase+"/"');
replaceOnce('Ax="/cursus",Ox="cursus"', 'Ax=courseContext.base,Ox=courseContext.repoBase');
replaceOnce('fp="cursus/content/admin-drafts.enc.json"', 'fp=courseContext.repoBase+"/content/admin-drafts.enc.json"');
replaceOnce('DD="cursus/content/admin-auth.json"', 'DD=courseContext.repoBase+"/content/admin-auth.json"');
replaceOnce('async function oa(t,e,n,r=8){', 'async function oa(t,e,n,r=8){assertWritePaths(n,courseContext);');
replaceOnce('async function Tc(t){', 'async function Tc(t){validatePage(t);');
replaceOnce('course:"",module:"",menu:!1,sortOrder:-Date.now()', 'course:courseContext.name||courseContext.id,module:"",menu:!1,sortOrder:-Date.now()');
const start = admin.indexOf('function Ix(t){');
const end = admin.indexOf('\nconst youtubeEmbedLabel', start);
if (start < 0 || end < 0) throw new Error('Missing lesson URL parser');
admin = admin.slice(0, start) + 'function Ix(t){return lessonSlug(t,courseContext)}\n' + admin.slice(end);
admin = admin.replaceAll('href:"/cursus/"', 'href:courseContext.base+"/"');
admin = admin.replaceAll('"/cursus/",M.slug', 'courseContext.base+"/",M.slug');
admin = admin.replaceAll('"/cursus"', 'courseContext.base');
admin = admin.replaceAll('children:"cursus"', 'children:courseContext.base');
admin = admin.replaceAll('Gepubliceerd in /cursus.', 'Gepubliceerd in de geselecteerde cursus.');
admin = admin.replaceAll('children:"Lesbeheer"', 'children:"Lesbeheer · "+(courseContext.name||courseContext.id)');
// Setup is handled by the authenticated course creator, even on localhost.
replaceOnce('function Sb(t=globalThis.location?.hostname,e=globalThis.location?.protocol){return e==="file:"||t==="localhost"||t==="127.0.0.1"||t==="::1"}', 'function Sb(){return false}');
admin = 'import {currentContext,assertWritePaths,validatePage,lessonSlug} from "./context.js";\nconst courseContext=Object.freeze({...currentContext(),...globalThis.__COURSE_METADATA__});\n' + admin;
// Metadata must never override the validated directory or storage namespace.
admin = admin.replace('{...currentContext(),...globalThis.__COURSE_METADATA__}', '{name:globalThis.__COURSE_METADATA__?.name,...currentContext()}');
writeFileSync(new URL('multi-course/admin.js', root), admin);

let student = readFileSync(new URL('runtime/student.js', root), 'utf8');
student = student.replace("const DB_NAME = 'machiel-les-toegang';", "import { currentContext } from '/cursus/multi-course/context.js';\nconst context = currentContext();\nconst DB_NAME = context.storage + ':student';");
student = student.replace("const COURSE_BASE = '/cursus';", 'const COURSE_BASE = context.base;');
student = student.replace("if (!envelope) return [];", "if (!envelope) throw new Error('Deze cursus is nog niet geopend. Neem contact op met de docent.');");
// Render server/network error messages as text, including unexpected lesson failures.
student = student.replace('if (root) root.innerHTML = `<div class="lesson-error"><h1>Deze les kan niet worden geopend</h1><p>${error instanceof Error ? error.message : \'Probeer opnieuw in te loggen.\'}</p><a href="${COURSE_BASE}/">Naar de cursuslogin</a></div>`;', `if (root) {
      root.replaceChildren();
      const message = document.createElement('p');
      message.textContent = error instanceof Error ? error.message : 'Probeer opnieuw in te loggen.';
      const link = document.createElement('a'); link.href = COURSE_BASE + '/'; link.textContent = 'Naar de cursuslogin';
      root.append(message, link);
    }`);
writeFileSync(new URL('multi-course/student.js', root), student);
let nav = readFileSync(new URL('runtime/public-nav.js', root), 'utf8');
nav = "import { currentContext } from '/cursus/multi-course/context.js';\n" + nav.replace("const COURSE_BASE = '/cursus';", 'const COURSE_BASE = currentContext().base;');
writeFileSync(new URL('multi-course/public-nav.js', root), nav);
console.log('Separate admin, student and navigation runtimes generated.');
