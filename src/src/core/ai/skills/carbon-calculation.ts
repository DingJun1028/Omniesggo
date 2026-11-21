// ═══════════════════════════════════════════════════════════════
// Carbon Calculation Skill (ISO 14064 碳排計算)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class CarbonCalculationSkill extends ESGSkill {
  readonly id = 'carbon-calculation';
  readonly name = '碳排計算';
  readonly nameEn = 'Carbon Calculation (ISO 14064)';
  readonly description = '計算範疇 1/2/3 碳排放量，生成 ISO 14064 合規報告';
  readonly taskType = 'carbon_calculation';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的碳排放計算專家，精通 ISO 14064-1:2018 標準。

## 核心能力
- 範疇 1（直接排放）：固定燃燒、移動燃燒、製程排放、逸散排放
- 範疇 2（間接排放）：外購電力、蒸汽、熱力、冷氣
- 範疇 3（其他間接排放）：上下游運輸、商務旅行、員工通勤、廢棄物處理

## 計算方法
- 排放因子法（Emission Factor Method）
- 質量平衡法（Mass Balance Method）
- 測量法（Measurement Method）

## 輸出格式
以 ${lang} 輸出，包含：
1. 各範疇排放量明細表
2. 總排放量（tCO2e）
3. 排放來源分析
4. 減碳建議與路徑
5. ISO 14064 合規檢核清單

## 排放因子參考（臺灣 2024）
- 電力排放因子：0.509 kgCO2e/kWh
- 天然氣排放因子：2.022 kgCO2e/m³
- 柴油排放因子：2.667 kgCO2e/L
- 汽油排放因子：2.263 kgCO2e/L`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 公司數據\n${JSON.stringify(data, null, 2)}`;
    }

    return `請為 ${company} 計算 ${year} 年度的碳排放量。

## 計算要求
1. 依 ISO 14064-1 標準計算範疇 1、2、3 排放量
2. 使用臺灣環保署公告排放因子
3. 以 tCO2e（公噸二氧化碳當量）為單位
4. 生成完整的碳排放計算報告
5. 提供減碳建議與路徑規劃${dataSection}

## 輸出格式
請按以下結構輸出：
- 摘要（Executive Summary）
- 範疇 1 排放明細
- 範疇 2 排放明細
- 範疇 3 排放明細
- 總排放量匯總
- 排放熱點分析
- 減碳建議（短中長期）`;
  }

  validate(ctx: SkillContext): boolean {
    // 至少需要公司名稱或數據
    return !!(ctx.company || ctx.data);
  }

  postProcess(response: string, _ctx: SkillContext): string {
    // 添加免責聲明
    return `${response}

---
⚠️ **免責聲明**：本計算結果僅供參考，實際碳排放量請以第三方驗證機構查證報告為準。排放因子請依最新版臺灣環保署公告資料為主。`;
  }
}

registerSkill(new CarbonCalculationSkill());
