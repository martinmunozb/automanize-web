import assert from 'node:assert/strict';

const pages = [
  ['https://automanize.com/nize-privacy', ['ChatGPT', 'Claude', 'protocolo MCP']],
  ['https://automanize.com/nize', ['Nize']],
  ['https://automanize.com/contactus', ['Contacto']],
  ['https://automanize.com/terms', [/T.rminos/i]],
];

for (const [url, required] of pages) {
  const response = await fetch(url, { headers: { 'User-Agent': 'ChatGPT-User/1.0' }, redirect: 'follow' });
  assert.equal(response.status, 200, `${url} debe ser accesible para ChatGPT-User`);
  const body = await response.text();
  for (const text of required) {
    const pattern = text instanceof RegExp ? text : new RegExp(text, 'i');
    assert.match(body, pattern, `${url} debe contener ${text}`);
  }
  process.stdout.write(`OK ${url}\n`);
}
