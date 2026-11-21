const path = require('path');
// Load ioredis from node_modules
const Redis = require(path.join('/app/node_modules/ioredis/built/index.js')).default;
console.log('Redis class:', typeof Redis);

const r = new Redis('redis://esggo-redis:6379', {
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => { console.log('retry', times); if (times > 2) return null; return 500; },
  lazyConnect: true
});

r.on('connect', () => console.log('EVENT: connect'));
r.on('ready', () => { console.log('EVENT: ready'); r.ping().then(p => { console.log('PING:', p); r.quit(); process.exit(0); }); });
r.on('error', (e) => console.log('EVENT: error:', e.message));
r.on('close', () => console.log('EVENT: close'));
r.on('reconnecting', () => console.log('EVENT: reconnecting'));

r.connect().then(() => {
  console.log('connect() resolved');
}).catch(e => {
  console.log('connect() rejected:', e.message);
  process.exit(1);
});

setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 8000);
