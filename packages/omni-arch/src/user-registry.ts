/**
 * OmniUserRegistry — 萬能用戶 RAG 成長資料庫 (個體層)
 *
 * 與 OmniMemory (群體層) 互補: 個人化思維偏好與成長軌跡,
 * 每筆成長紀錄以 IComponentCore + Hash Lock 封存 (不可篡改)。
 */
import { createComponentCore, sealComponentCore, type IComponentCore } from '@esggo/omni-core';
import { OmniArchError } from './types';

export interface GrowthEntry {
  readonly core: IComponentCore;
  readonly note: string;
}

export class OmniUserRegistry {
  private readonly profiles = new Map<string, GrowthEntry[]>();

  private async append(userId: string, note: string): Promise<Readonly<GrowthEntry>> {
    const core = createComponentCore(`omni-arch://omni-user-registry/${userId}`);
    const sealed = await sealComponentCore(core);
    const entry: GrowthEntry = Object.freeze({ core: sealed, note });
    const entries = this.profiles.get(userId) ?? [];
    entries.push(entry);
    this.profiles.set(userId, entries);
    return entry;
  }

  /** 個體成長: 記錄偏好/里程碑 (空備註拒收, 杜絕雜訊) */
  async grow(userId: string, note: string): Promise<Readonly<GrowthEntry>> {
    if (userId === '') {
      throw new OmniArchError('E_USER_REQUIRED', 'userId 不可為空');
    }
    if (note.trim() === '') {
      throw new OmniArchError('E_NOTE_REQUIRED', '成長備註不可為空');
    }
    return this.append(userId, note);
  }

  /** 成長軌跡: 依時間序回放該用戶全部紀錄 */
  trajectory(userId: string): readonly GrowthEntry[] {
    return [...(this.profiles.get(userId) ?? [])];
  }

  userCount(): number {
    return this.profiles.size;
  }
}