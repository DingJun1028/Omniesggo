const fs = require('fs');
const path = require('path');

// Simulate the eval approach
const modPath = path.join('/app/node_modules/ioredis/built/index.js');
const code = fs.readFileSync(modPath, 'utf8');
const m = { exports: {} };
const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', code);
fn(m.exports, require, m, modPath, path.dirname(modPath));
const Redis = m.exports.default || m.exports;

console.log('Redis type:', typeof Redis);
console.log('Redis:', Redis.name);

const r = new Redis('redis://esggo-redis:6379', {
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  lazyConnect: true
});

r.on('connect', () => console.log('EVENT: connect'));
r.on('ready', () => { console.log('EVENT: ready'); r.ping().then(p => { console.log('PING:', p); r.quit(); process.exit(0); }); });
r.on('error', (e) => console.log('EVENT: error:', e.message));
r.on('close', () => console.log('EVENT: close'));

r.connect().then(() => console.log('connect() resolved')).catch(e => { console.log('connect() rejected:', e.message); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 8000);
