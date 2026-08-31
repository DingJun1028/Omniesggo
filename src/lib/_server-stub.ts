// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Server-only stub — replaces firebase-admin / @upstash/redis during build
 * to prevent build-time crashes when env vars are missing.
 *
 * The real modules are loaded lazily at runtime on the server.
 */

// Lazy proxy that deferres actual loading to first use
function createLazyProxy(importPath: string): unknown {
  let cached: unknown = null;
  const loader = () => {
    if (!cached) {
      try {
        cached = require(importPath);
      } catch {
        console.warn(`[ServerStub] Failed to load ${importPath}`);
        cached = {};
      }
    }
    return cached;
  };
  return new Proxy({}, {
    get(_t, prop) {
      const mod = loader();
      return (mod as Record<string, unknown>)[prop as string];
    },
    apply(_t, _this, args) {
      const mod = loader();
      if (typeof mod === 'function') return mod(...args);
      return mod;
    },
  });
}

const AdminModule = createLazyProxy('firebase-admin');
const UpstashModule = createLazyProxy('@upstash/redis');

export default AdminModule;
export const apps = (AdminModule as Record<string, unknown>).apps ?? [];
export const initializeApp = (AdminModule as Record<string, unknown>).initializeApp ?? (() => ({}));
export const credential = (AdminModule as Record<string, unknown>).credential ?? {};
export const firestore = (AdminModule as Record<string, unknown>).firestore ?? (() => ({}));
export const Redis = (UpstashModule as Record<string, unknown>).Redis ?? class StubRedis { constructor() { /* stub */ } };
