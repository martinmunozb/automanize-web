"""Apply only the CRM document cache policy to the existing Caddy host block.

Run on the VPS with sudo after reviewing ops/caddy/crm-cache.caddy.
Validate first, keep a backup and reload Caddy 2.11+ through SIGUSR1.
"""
import pathlib
import subprocess
import sys

target = pathlib.Path('/root/caddy-main/Caddyfile')
snippet = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8').replace('\r', '')
before = target.read_bytes()
anchor = 'automanize.com, www.automanize.com {\n'
source = before.decode('utf-8')
if source.count(anchor) != 1:
    raise SystemExit('Expected one Automanize host block; configuration left intact.')
if '@crm_documents' in source:
    raise SystemExit('CRM policy already exists; inspect it before applying another policy.')
version = subprocess.check_output(['docker', 'exec', 'caddy_main', 'caddy', 'version'], text=True)
parts = tuple(int(part) for part in version.split()[0].lstrip('v').split('.')[:2])
if parts < (2, 11):
    raise SystemExit('This install requires Caddy 2.11+ signal reload support.')
candidate = pathlib.Path('/tmp/Caddyfile.crm-cache-20261017')
candidate.write_text(source.replace(anchor, anchor + snippet + '\n', 1), encoding='utf-8')
subprocess.run(['docker', 'cp', str(candidate), 'caddy_main:/tmp/Caddyfile.crm-cache'], check=True)
subprocess.run(['docker', 'exec', 'caddy_main', 'caddy', 'validate', '--config', '/tmp/Caddyfile.crm-cache', '--adapter', 'caddyfile'], check=True)
backup = target.with_name('Caddyfile.before-crm-cache-20261017')
if backup.exists():
    raise SystemExit('Backup already exists; configuration left intact.')
backup.write_bytes(before)
try:
    # Keep the bind-mounted inode so the running container sees the new file.
    target.write_bytes(candidate.read_bytes())
    subprocess.run(['docker', 'kill', '--signal=USR1', 'caddy_main'], check=True)
except Exception:
    target.write_bytes(before)
    subprocess.run(['docker', 'kill', '--signal=USR1', 'caddy_main'], check=False)
    raise
print('CRM cache policy validated and reloaded. Backup:', backup)
