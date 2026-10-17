import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(process.argv[2] || fileURLToPath(new URL('../app', import.meta.url)));
const release = JSON.parse(await readFile(path.join(app, 'release.json'), 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
for (const file of release.files) {
  const resolved = path.resolve(app, file.path);
  if (!resolved.startsWith(app + path.sep)) throw new Error(`Invalid release path: ${file.path}`);
  if (hash(await readFile(resolved)) !== file.sha256) throw new Error(`CRM release mismatch: ${file.path}`);
}
const index = await readFile(path.join(app, 'index.html'), 'utf8');
if (!index.includes(`src="./${release.entry}"`)) throw new Error('The CRM index points to a different release');
const files = new Set(release.files.map(file => file.path));
for (const match of index.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)) {
  if (!files.has(match[1])) throw new Error(`Unversioned CRM dependency: ${match[1]}`);
}
console.log(`CRM ${release.id}: ${release.files.length} versioned files verified.`);
