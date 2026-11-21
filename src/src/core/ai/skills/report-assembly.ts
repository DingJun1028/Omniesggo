// ═══════════════════════════════════════════════════════════════
// Report Assembly Skill (報告組裝)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class ReportAssemblySkill extends ESGSkill {
  readonly id = 'report-assembly';
  readonly name = '報告組裝';
  readonly nameEn = 'Report Assembly';
  readonly description = '將各章節組裝為完整的 ESG 報告';
  readonly taskType = 'report_assembly';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的報告組裝專家。

## 報告結構
1. 封面與目錄
2. 執行摘要
3. 關於本報告
4. 公司概況
5. ESG 績效（E/S/G 分章）
6. 重大主題分析
7. 目標與進度
8. 附錄與索引

## 組裝原則
- 確保章節間連貫性
- 數據一致性檢查
- 格式統一
- 圖表配置

## 輸出格式
以 ${lang} 輸出完整報告結構。`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    return `請為 ${company} ${year} 年度組裝完整 ESG 報告。

## 組裝內容
${JSON.stringify(ctx.data, null, 2)}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }
}

registerSkill(new ReportAssemblySkill());
