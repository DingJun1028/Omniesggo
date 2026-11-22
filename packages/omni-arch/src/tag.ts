/**
 * OmniTag — 語義標籤 (維度二: 邊界實體語義)
 *
 * 6 維 MECE 結構化標籤 + 信任分級的語義入口: 高危標籤 (如 #高危操作)
 * 觸發唯讀防護色 (MartialLock), 聯動 OmniTheme 與 OmniGateway 的戒嚴語義。
 */
import { deepFreeze } from '@esggo/omni-core';
import { OmniArchError } from './types';
import type { ThemeState } from './types';

export const HIGH_RISK_TAG = '#高危操作';

export type TagProtection = 'readonly' | 'none';

export interface OmniTagDef {
  readonly tag: string;
  readonly protection: TagProtection;
}

export class OmniTagRegistry {
  private readonly definitions = new Map<string, OmniTagDef>();

  define(tag: string, protection: TagProtection = 'none'): Readonly<OmniTagDef> {
    if (!tag.startsWith('#')) {
      throw new OmniArchError('E_TAG_FORMAT', `標籤 ${tag} 必須以 # 開頭`);
    }
    const def = deepFreeze({ tag, protection });
    this.definitions.set(tag, def);
    return def;
  }

  isProtected(tag: string): boolean {
    return this.definitions.get(tag)?.protection === 'readonly';
  }

  /** 唯讀防護色: 受保護標籤回傳戒嚴防護色, 其餘回傳液態玻璃 */
  protectionTheme(tag: string): ThemeState {
    return this.isProtected(tag) ? 'MartialLock' : 'LiquidGlass';
  }

  all(): readonly OmniTagDef[] {
    return [...this.definitions.values()];
  }
}