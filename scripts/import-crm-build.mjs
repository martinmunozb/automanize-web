import { readdir, readFile, writeFile, mkdir, lstat, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || '');
const releaseId = process.argv[3];
if (!process.argv[2] || !/^[a-z0-9-]+$/.test(releaseId || '')) {
  throw new Error('Usage: node scripts/import-crm-build.mjs APP_INMUEBLES_PATH RELEASE_ID');
}
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'src', 'public', 'package.json', 'package-lock.json', 'vite.web.config.js', 'renderer-web.html', 'seendy.html'], { cwd: source, stdio: 'pipe' });
const dist = path.join(source, 'web-dist');
const app = path.join(root, 'app');
const permittedRoots = new Set(['assets', 'leads', 'seendy', 'third-party', 'renderer-web.html', 'seendy.html']);
const files = [];
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink in build: ${relative}`);
    if (!permittedRoots.has(relative.split('/')[0]) || relative.split('/').some(p => p.startsWith('.')) || /\.(?:map|sql|env)$/i.test(relative)) {
      throw new Error(`Unexpected build resource: ${relative}`);
    }
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative + '/');
    else if (entry.isFile()) files.push(relative);
  }
}
await collect(dist);
for (const relative of files.sort((a, b) => Number(a.endsWith('.html')) - Number(b.endsWith('.html')) || a.localeCompare(b))) {
  const target = path.resolve(app, relative);
  if (!target.startsWith(app + path.sep)) throw new Error(`Invalid path: ${relative}`);
  const existing = await lstat(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
  if (existing?.isSymbolicLink()) throw new Error(`Symlink destination: ${relative}`);
  await mkdir(path.dirname(target), { recursive: true });
  const from = path.join(dist, relative);
  if (/\.(?:js|css|html|svg|json|txt)$/i.test(relative) || path.basename(relative) === 'LICENSE') {
    await writeFile(target, (await readFile(from, 'utf8')).replace(/\r\n?/g, '\n'), 'utf8');
  } else {
    await copyFile(from, target);
  }
}
const html = (await readFile(path.join(dist, 'renderer-web.html'), 'utf8')).replace(/\r\n?/g, '\n');
const entry = html.match(/<script[^>]+src="\.\/([^"?#]+)"/)?.[1];
if (!entry || !files.includes(entry)) throw new Error('Missing built entry script');
await writeFile(path.join(app, 'index.html'), html, 'utf8');
const included = new Set([...files, 'index.html']);
const documents = files.filter(file => !file.includes('/') && file.endsWith('.html') && file !== 'index.html').sort();
for (const document of ['index.html', ...documents]) {
  const content = await readFile(path.join(app, document), 'utf8');
  for (const match of content.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)) {
    const dependency = match[1];
    if (!included.has(dependency)) {
      if (dependency.includes('..') || !permittedRoots.has(dependency.split('/')[0])) throw new Error(`Unexpected dependency: ${dependency}`);
      await readFile(path.join(app, dependency));
      included.add(dependency);
    }
  }
}
const manifest = {
  id: releaseId,
  createdAt: new Date().toISOString(),
  sourceCommit,
  entry,
  documents,
  files: await Promise.all([...included].sort().map(async relative => ({
    path: relative,
    sha256: createHash('sha256').update(await readFile(path.join(app, relative))).digest('hex'),
  }))),
};
await writeFile(path.join(app, 'release.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`${releaseId}: imported ${manifest.files.length} resources from ${sourceCommit}. Previous hashed assets retained.`);
