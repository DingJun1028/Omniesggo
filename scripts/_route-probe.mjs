import fs from 'node:fs';
const BASE = 'http://127.0.0.1:8420';
const paths = [
  '/',
  '/health',
  '/healthz',
  '/ready',
  '/v3/',
  '/v3/conversation/',
  '/v3/conversation/add',
  '/v3/conversation/search',
  '/api/',
  '/api/conversation/add',
  '/v3/conversation/add/',
];
(async () => {
  for (const p of paths) {
    try {
      const r = await fetch(BASE + p, { method: 'GET' });
      console.log(p, '->', r.status);
    } catch (e) {
      console.log(p, '-> ERR', e.message);
    }
  }
})();
