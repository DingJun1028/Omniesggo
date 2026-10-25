import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
let passed = 0;
function t(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

const wfPath = '.github/workflows/deploy-ghcr.yml';

t('G17.1 deploy-ghcr workflow exists', () => {
  assert.ok(existsSync(new URL(wfPath, root)));
});

const wf = read(wfPath);
const docker = read('Dockerfile');

t('G17.2 workflow pushes to GHCR with minimal permissions', () => {
  assert.ok(wf.includes('ghcr.io/'));
  assert.ok(wf.includes('packages: write'));
  assert.ok(wf.includes('contents: read'));
  assert.ok(wf.includes('secrets.GITHUB_TOKEN'));
});

t('G17.3 workflow triggers on main and manual dispatch', () => {
  assert.ok(wf.includes('branches: [main]'));
  assert.ok(wf.includes('workflow_dispatch'));
});

t('G17.4 missing secrets degrade to a warning instead of failing CI', () => {
  assert.ok(wf.includes('::warning::'));
  assert.ok(wf.includes('DEPLOY_WEBHOOK_URL: ${{ secrets.DEPLOY_WEBHOOK_URL }}'));
  assert.ok(!wf.includes('if: ${{ secrets.'));
  assert.ok(wf.includes('continue-on-error: true'));
});

t('G17.5 no plaintext secrets in workflow or Dockerfile', () => {
  const bad = [/ghp_[A-Za-z0-9]{20,}/, /gsk_[A-Za-z0-9]{20,}/, /sk-[A-Za-z0-9]{20,}/, /AKIA[0-9A-Z]{16}/];
  for (const re of bad) {
    assert.ok(!re.test(wf), 'workflow leaks ' + re);
    assert.ok(!re.test(docker), 'Dockerfile leaks ' + re);
  }
});

t('G17.6 Dockerfile is a multi-stage production build', () => {
  assert.ok(docker.includes('AS deps'));
  assert.ok(docker.includes('AS builder'));
  assert.ok(docker.includes('AS runner'));
  assert.ok(docker.includes('NODE_ENV=production'));
  assert.ok(docker.includes('HOSTNAME="0.0.0.0"'));
  assert.ok(docker.includes('EXPOSE 3000'));
  assert.ok(docker.includes('HEALTHCHECK'));
});

t('G17.7 runner image ships SDK and 5T sanctuary', () => {
  assert.ok(docker.includes('/app/sdks'));
  assert.ok(docker.includes('/app/Omni-Sanctuary'));
});

console.log('G17: ' + passed + ' deploy contract checks passed');
