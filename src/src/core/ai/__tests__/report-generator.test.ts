import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIReportGenerator } from '../report-generator';
import type { FreeProviderConfig } from '../model-router';

describe('AIReportGenerator — FreeProvider 加性兜底', () => {
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    // 隔離：確保主 OpenRouter 分支與 FreeProvider 池的 Key 狀態由測試控制
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    process.env.GROQ_API_KEY = originalGroqKey;
  });

  it('無 OpenRouter Key 時，章節內容改由 FreeProvider 兜底產生', async () => {
    process.env.GROQ_API_KEY = 'test-key'; // 讓 FreeProvider 池有「已配置」候選，不被全跳過
    let usedModel = '';
    const send = vi.fn(async (cfg: FreeProviderConfig) => {
      usedModel = cfg.model;
      return `FREE:${cfg.model}`;
    });
    const gen = new AIReportGenerator({ freeProviderSend: send });

    const result = await gen.generateReport({
      companyName: '測試公司',
      industry: '製造',
      year: '2024',
      sections: ['executive_summary'],
    });

    expect(result.success).toBe(true);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].content).toMatch(/^FREE:/);
    // 記錄的 model 應反映實際採用的免費模型（與注入發送器收到的模型一致）
    expect(result.sections[0].model).toBe(usedModel);
    expect(send).toHaveBeenCalled();
  });

  it('FreeProvider 也全數失敗時，優雅回退至範本內容（不拋錯）', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const send = vi.fn(async () => {
      throw new Error('all down');
    });
    const gen = new AIReportGenerator({ freeProviderSend: send });

    const result = await gen.generateReport({
      companyName: '測試公司',
      industry: '製造',
      year: '2024',
      sections: ['executive_summary'],
    });

    expect(result.success).toBe(true);
    // 範本回退內容開頭為提示設定 Key 的訊息
    expect(result.sections[0].content).toContain('需要 OPENROUTER_API_KEY');
    expect(result.sections[0].model).toBe('template-fallback');
  });

  it('有 OpenRouter Key 但主呼叫失敗時，自動轉 FreeProvider 兜底', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.GROQ_API_KEY = 'test-key';
    // 模擬主 OpenRouter 呼叫失敗（無網路），但不影響注入的 FreeProvider 發送器
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const send = vi.fn(async (cfg: FreeProviderConfig) => `FREE:${cfg.model}`);
    const gen = new AIReportGenerator({ freeProviderSend: send });

    const result = await gen.generateReport({
      companyName: '測試公司',
      industry: '製造',
      year: '2024',
      sections: ['executive_summary'],
    });

    expect(result.sections[0].content).toMatch(/^FREE:/);
    expect(send).toHaveBeenCalled();
  });
});
