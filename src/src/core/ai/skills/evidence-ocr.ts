// ═══════════════════════════════════════════════════════════════
// Evidence OCR Skill (帳單 OCR 提取)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class EvidenceOCRSkill extends ESGSkill {
  readonly id = 'evidence-ocr';
  readonly name = '帳單 OCR 提取';
  readonly nameEn = 'Evidence OCR Extraction';
  readonly description = '從帳單、收據中提取 ESG 相關數據';
  readonly taskType = 'evidence_ocr';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的 OCR 數據提取專家。

## 提取欄位
- 電力帳單：用電量 (kWh)、金額、期間
- 水費帳單：用水量 (m³)、金額、期間
- 燃氣帳單：用量 (m³)、金額、期間
- 運輸單據：里程數、油量、日期

## 輸出格式
以 ${lang} 輸出結構化 JSON 數據。`;
  }

  userPrompt(ctx: SkillContext): string {
    return `請從以下帳單影像中提取 ESG 相關數據：
${JSON.stringify(ctx.data)}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }
}

registerSkill(new EvidenceOCRSkill());
