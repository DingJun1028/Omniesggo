#!/usr/bin/env tsx
// gen.ts -- 從 @esggo/shared SSOT 生成 i18n/*.json + canon.schema.json + canon.i18n.ts
// 終始矩陣: KEYS / Locale / LOCALES 全部從 shared 衍生 (杜絕 drift)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { LOCALES, KEYS, type Locale, type DictKey } from '@esggo/shared/types';

const DICT: Record<Locale, Record<DictKey, string>> = {
  en: {
    'app.title': 'Omni Avatar',
    'app.subtitle': 'Share with everyone, everywhere',
    'app.welcome': 'Welcome to Omni Avatar',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',
  },
  'zh-TW': {
    'app.title': '萬能分身',
    'app.subtitle': '與人共享，無處不在',
    'app.welcome': '歡迎來到萬能分身',
    'nav.home': '首頁',
    'nav.about': '關於',
    'nav.contact': '聯絡我們',
    'btn.submit': '提交',
    'btn.cancel': '取消',
  },
};

const VERSION = '1.0.0';

function gen() {
  if (!existsSync('src/i18n')) mkdirSync('src/i18n', { recursive: true });
  if (!existsSync('dist')) mkdirSync('dist');
  if (!existsSync('src/types')) mkdirSync('src/types', { recursive: true });

  for (const locale of LOCALES) {
    const bundle: I18nBundle = {
      locale,
      version: VERSION,
      dict: DICT[locale],
    };
    writeFileSync(join('src/i18n', `${locale}.json`), JSON.stringify(bundle, null, 2) + '\n');
  }

  // canon.schema.json
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'OmniShare i18n Bundle',
    type: 'object',
    required: ['locale', 'version', 'dict'],
    properties: {
      locale: { type: 'string', enum: ['en', 'zh-TW'] },
      version: { type: 'string' },
      dict: {
        type: 'object',
        additionalProperties: { type: 'string' },
        required: [...KEYS],
      },
    },
  };
  writeFileSync('dist/canon.schema.json', JSON.stringify(schema, null, 2) + '\n');

  // canon.i18n.ts -- 自動生成，勿手改
  // 終始矩陣: 全從 @esggo/shared re-export, 不再自行定義, 杜絕 drift
  const i18nTs = `// canon.i18n.ts -- 自動生成，勿手改
export { LOCALES, DICT, VERSION } from '@esggo/shared/i18n-runtime';

import type { DictKey } from '@esggo/shared/types';
`;
  writeFileSync('src/types/canon.i18n.ts', i18nTs);

  // canon.d.ts.lock (sha256 of DICT + KEYS for 5T lock)
  const lockPayload = JSON.stringify({ DICT, KEYS, LOCALES });
  const lockSha = createHash('sha256').update(lockPayload).digest('hex');
  writeFileSync('dist/canon.d.ts.lock', lockSha + '\n');

  console.log(`✓ gen: wrote 2 i18n bundles, schema, i18n.ts, lock=${lockSha.slice(0, 12)}...`);
}

gen();
