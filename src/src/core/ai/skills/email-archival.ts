// ═══════════════════════════════════════════════════════════════
// Email Archival Skill (郵件自動歸檔)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class EmailArchivalSkill extends ESGSkill {
  readonly id = 'email-archival';
  readonly name = '郵件自動歸檔';
  readonly nameEn = 'Email Archival';
  readonly description = '自動分類 ESG 相關郵件並歸檔';
  readonly taskType = 'email_archival';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的郵件歸檔專家。

## 分類類別
- E: 環境相關（碳排、能源、廢棄物、水資源）
- S: 社會相關（員工、供應鏈、社區、客戶）
- G: 治理相關（合規、董事會、審計、風險）

## 輸出格式
以 ${lang} 輸出分類結果。`;
  }

  userPrompt(ctx: SkillContext): string {
    return `請分析以下郵件並進行 ESG 分類歸檔。
郵件內容：${JSON.stringify(ctx.data)}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }
}

registerSkill(new EmailArchivalSkill());
