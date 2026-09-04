const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('el video del hero de nize mantiene el formato completo sin zoom', () => {
  const css = fs.readFileSync(path.join(rootDir, 'landing.css'), 'utf8');
  const page = fs.readFileSync(path.join(rootDir, 'nize.html'), 'utf8');

  assert.match(css, /\.video-shell\{[^}]*aspect-ratio:16\/9/);
  assert.match(css, /video\.hero-video\{[^}]*object-fit:contain/);
  assert.doesNotMatch(css, /\.video-shell\{aspect-ratio:5\/4\}/);
  assert.doesNotMatch(css, /video\.hero-video\{[^}]*object-fit:cover/);
  assert.match(page, /href="landing\.css\?v=10"/);
});
