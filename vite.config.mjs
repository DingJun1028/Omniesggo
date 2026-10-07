import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// tsconfig.json 的 `"@lib/*": ["./src/lib/*", "./lib/*"]` 有兩個 fallback，
// 兩棵目錄皆活躍且各有獨有檔案（api-utils.ts 兩邊皆存在）。
// vinext 的 materializeTsconfigPathAliases 只取 targets[0]（./src/lib/*），
// 於是所有只存在 ./lib/* 的 import 解析到不存在的 /src/lib/... → 9 處
// UNLOADABLE_DEPENDENCY（os error 3）。此 plugin 依 tsconfig 原始順序
// （src/lib 先、lib 次）補齊 fallback，行為與 Next/TS 一致。
const LIB_BASES = [path.join(ROOT, 'src', 'lib'), path.join(ROOT, 'lib')];
const LIB_EXTS = ['', '.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'];
const LIB_INDEXES = LIB_EXTS.slice(1).map((ext) => `index${ext}`);

function resolveLibPath(rel) {
  const relNorm = rel.replace(/^[/\\]+/, '');
  for (const base of LIB_BASES) {
    const abs = path.join(base, relNorm);
    for (const ext of LIB_EXTS) {
      const cand = abs + ext;
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }
    for (const idx of LIB_INDEXES) {
      const cand = path.join(abs, idx);
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }
  }
  return null;
}

// 同時攔 `@lib/*`（alias 尚未套用）與 vinext 轉出的 root-relative
// `/src/lib/*`、`/lib/*`，任一來源皆可修回真實路徑。
function libPathsFallback() {
  return {
    name: 'esggo:lib-paths-fallback',
    enforce: 'pre',
    resolveId(source) {
      let rel = null;
      if (source.startsWith('@lib/')) rel = source.slice(5);
      else if (source.startsWith('/src/lib/')) rel = source.slice(9);
      else if (source.startsWith('/lib/')) rel = source.slice(5);
      if (rel == null) return null;
      return resolveLibPath(rel);
    },
  };
}

// vinext + Cloudflare Workers 設定（App Router）。
// 原名 vite.vinext.config.mjs —— vinext CLI 的 findViteConfigPath 僅依 Vite 預設
// precedence（vite.config.js > .mjs > .ts）偵測，故改為標準檔名。
// 既有 vite.config.js（react/plugin 殘留、無 script 引用）已改名 vite.config.legacy.js；
// vitest 有獨立 vitest.config.js/.ts，不受影響。
// 與 wrangler.toml（OmniGateway，name="esggo"）分離 —— 網站 worker 另名 esggo-web
// （wrangler.web.jsonc），Next.js 既有 `pnpm run build` 亦不受影響（並存期零衝突）。
// vinext 自動註冊 @vitejs/plugin-rsc（rsc 預設啟用），無需手動設定。
export default defineConfig({
  plugins: [
    libPathsFallback(),
    vinext({
      // ISR / data cache 落 KV（vinext 偵測到 ISR 後必填，否則拒絕部署）。
      // binding VINEXT_KV_CACHE 由 wrangler.web.jsonc 定義、namespace 需先建立。
      cache: {
        data: kvDataAdapter(),
      },
    }),
    cloudflare({
      configPath: 'wrangler.web.jsonc',
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    target: 'es2022',
  },
});
