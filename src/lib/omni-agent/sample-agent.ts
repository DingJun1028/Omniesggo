// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { IBusEvent } from '../omni-core/contracts';
import { OmniAgent } from './index';

/**
 * 最小化範例 Agent：僅記錄事件並回傳確認。
 * 實際專案中可在此加入業務邏輯（驗算、資料轉換等）。
 */
export class SampleAgent extends OmniAgent {
  async execute(event: IBusEvent): Promise<void> {
    console.log(`[SampleAgent] 收到事件 → topic: ${event.topic}, payload:`, event.payload);
    // 這裡可以加入實際業務邏輯
  }
}

// 註冊為預設單例（與 OmniAgent.getInstance() 相同）
export const sampleAgent = SampleAgent.getInstance();