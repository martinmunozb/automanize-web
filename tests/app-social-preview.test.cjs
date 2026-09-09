const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

test('la app web publica una vista previa profesional para WhatsApp y redes sociales', () => {
  const page = read('app/index.html');
  const expectedDescription =
    'Nize centraliza inmuebles, inquilinos, cobros, incidencias y automatizaciones de WhatsApp en un CRM inmobiliario profesional.';

  assert.match(page, /<title>Nize by Automanize - CRM inmobiliario<\/title>/);
  assert.match(page, new RegExp(`<meta name="description" content="${expectedDescription}" />`));
  assert.match(page, /<link rel="canonical" href="https:\/\/automanize\.com\/app\/" \/>/);
  assert.match(page, /<meta property="og:type" content="website" \/>/);
  assert.match(page, /<meta property="og:site_name" content="Automanize" \/>/);
  assert.match(page, /<meta property="og:title" content="Nize by Automanize - CRM inmobiliario" \/>/);
  assert.match(page, new RegExp(`<meta property="og:description" content="${expectedDescription}" />`));
  assert.match(page, /<meta property="og:url" content="https:\/\/automanize\.com\/app\/" \/>/);
  assert.match(page, /<meta property="og:image" content="https:\/\/automanize\.com\/assets\/images\/nize\.png" \/>/);
  assert.match(page, /<meta property="og:image:alt" content="Logo de Nize by Automanize" \/>/);
  assert.match(page, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(page, /<meta name="twitter:title" content="Nize by Automanize - CRM inmobiliario" \/>/);
  assert.match(page, new RegExp(`<meta name="twitter:description" content="${expectedDescription}" />`));
  assert.match(page, /<meta name="twitter:image" content="https:\/\/automanize\.com\/assets\/images\/nize\.png" \/>/);
  assert.match(page, /<link rel="icon" type="image\/png" href="https:\/\/automanize\.com\/assets\/images\/nize-isotipo-256\.webp" \/>/);
});

test('todas las paginas html publicables tienen vista previa social completa', () => {
  const requiredSnippets = [
    '<meta name="description"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
  ];
  const missingByFile = {};

  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'test-results'].includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.html')) continue;

      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const page = fs.readFileSync(fullPath, 'utf8');
      const missing = requiredSnippets.filter((snippet) => !page.includes(snippet));
      const imageMatches = [
        ...page.matchAll(/<(?:meta) [^>]*(?:property="og:image"|name="twitter:image")[^>]*content="([^"]+)"/g),
      ];
      const hasOnlyAbsoluteSocialImages = imageMatches.every((match) =>
        match[1].startsWith('https://automanize.com/'),
      );

      if (missing.length || !hasOnlyAbsoluteSocialImages) {
        missingByFile[relPath] = [
          ...missing,
          ...(hasOnlyAbsoluteSocialImages ? [] : ['social image absoluta https://automanize.com/...']),
        ];
      }
    }
  }

  scan(rootDir);

  assert.deepEqual(missingByFile, {});
});
