/**
 * OmniAPI — 萬能符文 (維度三: 動態驅動通訊)
 *
 * 外部能力封裝: 以符文 (rune) 名稱登記能力, 呼叫端以名稱 invoke,
 * 回傳結果一律 deepFreeze (能力出口即邊界, 不可篡改)。
 */
import { deepFreeze } from '@esggo/omni-core';
import { OmniArchError } from './types';

export type RuneFn<A, R> = (args: A) => Promise<R> | R;

type WrappedRune = (args: unknown) => Promise<unknown> | unknown;

export class OmniAPI {
  private readonly runes = new Map<string, WrappedRune>();

  engrave<A, R>(name: string, fn: RuneFn<A, R>): void {
    if (this.runes.has(name)) {
      throw new OmniArchError('E_RUNE_DUPLICATE', `符文 ${name} 已銘刻, MECE 禁止重複`);
    }
    this.runes.set(name, fn as WrappedRune);
  }

  async invoke<A, R>(name: string, args: A): Promise<Readonly<R>> {
    const rune = this.runes.get(name);
    if (!rune) {
      throw new OmniArchError('E_RUNE_UNKNOWN', `未知符文 ${name}, 拒絕猜測執行`);
    }
    const result = await rune(args);
    return deepFreeze(structuredClone(result)) as Readonly<R>;
  }

  runeCount(): number {
    return this.runes.size;
  }
}