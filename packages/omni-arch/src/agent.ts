/**
 * OmniAgent — UX 靈魂 (維度三: 動態驅動通訊)
 *
 * 意圖理解與零儀式感分發: 意圖註冊表 + understand 分發,
 * 未註冊意圖 fail-fast (不猜測、不靜默吞掉, 杜絕幻覺執行)。
 */
import { OmniArchError } from './types';

export type IntentHandler<A, R> = (args: A) => Promise<R> | R;

type WrappedHandler = (args: unknown) => Promise<unknown> | unknown;

export class OmniAgent {
  private readonly handlers = new Map<string, WrappedHandler>();

  onIntent<A, R>(intent: string, handler: IntentHandler<A, R>): void {
    if (this.handlers.has(intent)) {
      throw new OmniArchError('E_INTENT_DUPLICATE', `意圖 ${intent} 已註冊, MECE 禁止重複`);
    }
    this.handlers.set(intent, handler as WrappedHandler);
  }

  async understand<A, R>(intent: string, args: A): Promise<R> {
    const handler = this.handlers.get(intent);
    if (!handler) {
      throw new OmniArchError('E_INTENT_UNKNOWN', `未知意圖 ${intent}, 拒絕猜測執行`);
    }
    return (await handler(args)) as R;
  }

  intents(): readonly string[] {
    return [...this.handlers.keys()];
  }
}