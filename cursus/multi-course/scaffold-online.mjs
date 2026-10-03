import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffold } from './creation.js';
const files = scaffold('online', 'Online cursus').map(file => ({ ...file, path: fileURLToPath(new URL('../' + file.path.slice('cursus/'.length), import.meta.url)) }));
if (files.some(file => existsSync(file.path))) throw new Error('De online cursusmap bestaat al. Gebruik Lesbeheer; bestaande bestanden worden niet overschreven.');
for (const { path, content } of files) {
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content);
}
console.log('Online course scaffold created without passwords or atelier changes.');
