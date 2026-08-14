const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const uiJs = fs.readFileSync(path.join(rootDir, 'assets/js/automanize-ui.js'), 'utf8');

function walkSourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
    } else if (/\.(?:html|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function splitTextObserverBlock() {
  const match = uiJs.match(/const observer = new IntersectionObserver\(\(entries\) => \{[\s\S]*?\n        \}, \{ threshold: THRESHOLD, rootMargin: ROOT_MARGIN \}\);/);
  assert.ok(match, 'No se pudo localizar el observer de SplitText');
  return match[0];
}

test('SplitText no vuelve al estado oculto cuando el texto sale de pantalla', () => {
  const observerBlock = splitTextObserverBlock();

  assert.equal(
    observerBlock.includes("el.classList.remove('is-revealed')"),
    false,
    'SplitText no debe quitar is-revealed al salir ni antes de reentrar',
  );
});

test('ninguna animacion de letras vuelve a ocultarse al salir de pantalla', () => {
  const offenders = walkSourceFiles(rootDir)
    .filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /classList\.remove\(['"]is-revealed['"]\)/.test(source);
    })
    .map((file) => path.relative(rootDir, file).replaceAll(path.sep, '/'));

  assert.deepEqual(
    offenders,
    [],
    'Las animaciones de letras deben revelarse una sola vez en todos los apartados',
  );
});

test('SplitText deja de observar cada texto tras revelarlo por primera vez', () => {
  const observerBlock = splitTextObserverBlock();

  assert.match(
    observerBlock,
    /observer\.unobserve\(el\)/,
    'SplitText debe llamar observer.unobserve(el) tras añadir is-revealed',
  );
});
