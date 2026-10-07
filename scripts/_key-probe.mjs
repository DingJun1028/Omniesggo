import fs from 'node:fs';
const BASE = 'http://127.0.0.1:8420';
const SVC = 'oa-team-swarm';

function authHeaders(key) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${key}`,
    'x-tdai-service-id': SVC,
  };
}

async function call(key, tag) {
  try {
    const r = await fetch(`${BASE}/v3/conversation/add`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify({
        service_id: SVC,
        user_id: 'admin',
        session_id: `probe-${tag}`,
        messages: [{ role: 'user', content: `[bee-07] healthcheck probe ${tag}` }],
      }),
    });
    const d = await r.json().catch(() => ({}));
    console.log(tag, '->', r.status, JSON.stringify(d).slice(0, 160));
  } catch (e) {
    console.log(tag, '-> ERR', e.message);
  }
}

const adminKey = 'sk-mem-xvAwoarSnapAt05DEgZxqDTTGMZsLhQbHMEfJ9De2';
const yamlKey = '676cb13c6b19635d8af083b0676cb13c6b19635d8af083b0676cb13c6b13c6d7';

(async () => {
  await call(adminKey, 'admin-key');
  await call(yamlKey, 'yaml-32key');
  // test search too
  const r = await fetch(`${BASE}/v3/conversation/search`, {
    method: 'POST',
    headers: authHeaders(adminKey),
    body: JSON.stringify({
      service_id: SVC,
      user_id: 'admin',
      session_id: 'probe-search1',
      query: 'healthcheck',
      limit: 10,
    }),
  });
  const d = await r.json().catch(() => ({}));
  console.log('search-admin-key ->', r.status, JSON.stringify(d).slice(0, 160));

  const r2 = await fetch(`${BASE}/v3/conversation/search`, {
    method: 'POST',
    headers: authHeaders(yamlKey),
    body: JSON.stringify({
      service_id: SVC,
      user_id: 'admin',
      session_id: 'probe-search2',
      query: 'healthcheck',
      limit: 10,
    }),
  });
  const d2 = await r2.json().catch(() => ({}));
  console.log('search-yaml-key ->', r2.status, JSON.stringify(d2).slice(0, 160));
})();
