/**
 * ProphetBridge — 先知矩陣 × OmniAgent 意圖層接線 (正典 §7 後續編排)
 *
 * bindProphetToAgent(agent, prophet) 回傳單一 foreseeIntent 註冊器:
 *   foreseeIntent(intent, handler, candidates) 同時完成兩件事 —
 *   (1) prophet.foresee: 候選宇宙平行預運算 (0ms 路徑之因);
 *   (2) agent.onIntent: understand 分發委派 prophet.ask (0ms 路徑之果)。
 * 兩模組職責 MECE 不重疊: agent 管意圖分發契約, prophet 管預判與命中。
 * 註冊順序固定先 prophet 後 agent: 重複意圖之錯誤碼為
 * E_PROPHET_INTENT_DUPLICATE (先知先報), 判讀可預期。
 *
 * 5T 對應: Tangible (命中即 0ms, 命中率可驗收) / Trustworthy (閘門數據說話)
 */
import type { IntentHandler, OmniAgent } from './agent';
import type { OmniProphet } from './prophet';

export type ForeseeIntent = <A, R>(
  intent: string,
  handler: IntentHandler<A, R>,
  candidates: readonly A[]
) => void;

export function bindProphetToAgent(agent: OmniAgent, prophet: OmniProphet): ForeseeIntent {
  return (intent, handler, candidates) => {
    prophet.foresee(intent, async (args) => await handler(args), candidates);
    agent.onIntent(intent, (args) => prophet.ask(intent, args));
  };
}
