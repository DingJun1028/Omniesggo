// test/consumer.test.ts
// 證明 @esggo/i18n 的 exports 對其他 package 可用
// (Stage 5 落地部署: 觸發 pnpm lockfile 整合)

import { describe, it, expect } from 'vitest';
import { LOCALES } from '../src/types/canon.i18n.ts';
import type { Locale, DictKey } from '../src/canon.d.ts';
import en from '../src/i18n/en.json';
import zhTW from '../src/i18n/zh-TW.json';

describe('@esggo/i18n consumer', () => {
  it('exports LOCALES = [en, zh-TW]', () => {
    expect(LOCALES).toEqual(['en', 'zh-TW']);
  });

  it('en.json is valid I18nBundle', () => {
    expect(en.locale).toBe('en');
    expect(en.version).toBe('1.0.0');
    expect(typeof en.dict).toBe('object');
  });

  it('zh-TW.json is valid I18nBundle', () => {
    expect(zhTW.locale).toBe('zh-TW');
    expect(zhTW.version).toBe('1.0.0');
    expect(typeof zhTW.dict).toBe('object');
  });

  it('zh-TW has all 8 keys', () => {
    const keys = Object.keys(zhTW.dict).sort();
    expect(keys).toEqual([
      'app.subtitle',
      'app.title',
      'app.welcome',
      'btn.cancel',
      'btn.submit',
      'nav.about',
      'nav.contact',
      'nav.home',
    ]);
  });

  it('en has all 8 keys', () => {
    const keys = Object.keys(en.dict).sort();
    expect(keys).toEqual([
      'app.subtitle',
      'app.title',
      'app.welcome',
      'btn.cancel',
      'btn.submit',
      'nav.about',
      'nav.contact',
      'nav.home',
    ]);
  });

  it('zh-TW app.title = 萬能分身', () => {
    expect(zhTW.dict['app.title']).toBe('萬能分身');
  });

  it('en app.title = Omni Avatar', () => {
    expect(en.dict['app.title']).toBe('Omni Avatar');
  });

  it('Locale type accepts both', () => {
    const a: Locale = 'en';
    const b: Locale = 'zh-TW';
    expect(a).toBe('en');
    expect(b).toBe('zh-TW');
  });

  it('DictKey type accepts all 8', () => {
    const keys: DictKey[] = [
      'app.title',
      'app.subtitle',
      'app.welcome',
      'nav.home',
      'nav.about',
      'nav.contact',
      'btn.submit',
      'btn.cancel',
    ];
    expect(keys.length).toBe(8);
  });
});
