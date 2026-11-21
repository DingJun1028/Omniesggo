// ═══════════════════════════════════════════════════════════════
// Stakeholder Analysis Skill (利害關係人分析)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class StakeholderAnalysisSkill extends ESGSkill {
  readonly id = 'stakeholder-analysis';
  readonly name = '利害關係人分析';
  readonly nameEn = 'Stakeholder Analysis';
  readonly description = '識別利害關係人並分析其關注議題與影響力';
  readonly taskType = 'stakeholder_analysis';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的利害關係人分析專家。

## 利害關係人分類
1. **內部利害關係人**：股東、董事會、管理層、員工
2. **外部利害關係人**：客戶、供應商、社區、政府、NGO、投資人

## 分析框架
- 權力/利益矩陣（Power/Interest Matrix）
- 影響力/緊迫性矩陣
- 利害關係人參與策略（Manage/Keep Satisfied/Keep Informed/Monitor）

## 輸出格式
以 ${lang} 輸出，包含：
1. 利害關係人清單與分類
2. 權力/利益矩陣
3. 關注議題分析
4. 參與策略建議
5. 溝通計畫`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    return `請為 ${company} 進行利害關係人分析。

## 分析要求
1. 識別所有相關利害關係人
2. 評估各利害關係人的影響力與關注度
3. 建立權力/利益矩陣
4. 設計差異化參與策略
5. 制定溝通計畫`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }
}

registerSkill(new StakeholderAnalysisSkill());
