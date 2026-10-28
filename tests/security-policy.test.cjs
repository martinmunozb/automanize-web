const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');

test('Caddy denies internal files and declared AI crawlers, preserving UI and public portals', async t => {
  const policyPath = path.join(__dirname, '../ops/caddy/client-security.caddy');
  const snippet = fs.existsSync(policyPath) ? fs.readFileSync(policyPath, 'utf8') : '';
  const binary = process.env.CADDY_BIN || 'caddy';
  const version = spawnSync(binary, ['version'], { encoding: 'utf8' });
  assert.equal(version.status, 0, 'Set CADDY_BIN to a Caddy executable to run the HTTP security tests');
  const reserve = net.createServer();
  await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve));
  const port = reserve.address().port;
  await new Promise(resolve => reserve.close(resolve));
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'automanize-caddy-'));
  const config = path.join(fixture, 'Caddyfile');
  fs.writeFileSync(config, `{\n admin off\n auto_https off\n}\nhttp://127.0.0.1:${port} {\n${snippet}\n header Referrer-Policy "strict-origin-when-cross-origin"\n rewrite /solicitar-demo /solicitar-demo.html\n respond "public content" 200\n}\n`);
  const validation = spawnSync(binary, ['validate', '--config', config, '--adapter', 'caddyfile'], { encoding: 'utf8' });
  assert.equal(validation.status, 0, validation.stderr);
  const child = spawn(binary, ['run', '--config', config, '--adapter', 'caddyfile'], { windowsHide: true, stdio: 'ignore' });
  t.after(async () => {
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill(); await stopped;
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  const request = (url, agent = 'Mozilla/5.0') => new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: url, headers: { 'User-Agent': agent } }, res => {
      res.resume(); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    }).on('error', reject);
  });
  for (let attempt = 0; ; attempt++) {
    try { await request('/'); break; }
    catch (error) { if (attempt >= 80) throw error; await new Promise(resolve => setTimeout(resolve, 50)); }
  }
  for (const url of ['/.git/config', '/%2egit/config', '/.env', '/docs/general.md', '/app/docs/readme.md', '/src/main.jsx', '/scripts/secret.js', '/netlify/functions/stripe.js', '/ops/caddy/crm-cache.caddy', '/package-lock.json', '/app/assets/ui.js.map', '/backup.sql', '/config.json.bak']) {
    assert.equal((await request(url)).status, 404, `must deny ${url}`);
  }
  for (const url of ['/', '/crm.html', '/app/', '/app/seendy.html', '/app/assets/ui.js', '/formulario.html?t=test', '/pago.html?t=test', '/oauth-drive.html', '/.well-known/acme-challenge/test']) {
    assert.equal((await request(url)).status, 200, `must preserve ${url}`);
  }
  for (const agent of ['GPTBot/1.0', 'ClaudeBot', 'ChatGPT-User', 'PerplexityBot', 'CCBot/2.0', 'Amazonbot']) {
    assert.equal((await request('/app/', agent)).status, 403, `must deny ${agent}`);
  }
  assert.equal((await request('/crm.html', 'Googlebot')).status, 200);
  for (const url of ['/app', '/app/', '/usar-demo.html', '/solicitar-demo.html', '/panel-interno.html', '/solicitar-demo', '/usar-demo', '/panel-interno', '/oauth-drive', '/onboarding-cliente']) {
    assert.match((await request(url)).headers['x-robots-tag'], /noindex/);
  }
  assert.equal((await request('/')).headers['x-content-type-options'], 'nosniff');
  assert.equal((await request('/app/')).headers['referrer-policy'], 'no-referrer');
});
