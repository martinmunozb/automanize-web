const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

test('demo download links and API lookups use the current public update channel', () => {
  for (const page of ['solicitar-demo.html', 'usar-demo.html', 'descarga-nize.html']) {
    const html = readFileSync(path.join(__dirname, '..', page), 'utf8');
    const urls = html.match(/https:\/\/(?:api\.)?github\.com\/(?:repos\/)?[^/'"\s]+\/Nize-Releases\/releases\/latest/g) || [];
    assert.ok(urls.length >= 2, `download and lookup missing from ${page}`);
    for (const url of urls) assert.match(url, /(?:com\/|repos\/)martinmunozb\/Nize-Releases\//, `${page} points to an obsolete release channel`);
  }
});
