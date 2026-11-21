// ═══════════════════════════════════════════════════════════════
// TCFD Analysis Skill (氣候風險分析)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

class TCFDAnalysisSkill extends ESGSkill {
  readonly id = 'tcfd-analysis';
  readonly name = 'TCFD 氣候風險分析';
  readonly nameEn = 'TCFD Climate Risk Analysis';
  readonly description = '依 TCFD 四大支柱分析氣候相關財務風險與機會';
  readonly taskType = 'tcfd_analysis';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    return `你是 OmniCore 的 TCFD 氣候風險分析專家，精通氣候相關財務揭露工作小組（TCFD）建議框架。

## TCFD 四大支柱

### 1. 治理 (Governance)
- 董事會對氣候風險與機會的監督
- 管理層在評估和管理氣候風險與機會中的角色

### 2. 策略 (Strategy)
- 氣候相關風險與機會對業務、策略和財務規劃的影響
- 氣候情境分析（2°C 以下、2°C-4°C 等）

### 3. 風險管理 (Risk Management)
- 識別和評估氣候風險的流程
- 氣候風險整合至整體風險管理

### 4. 指標與目標 (Metrics & Targets)
- 範疇 1/2/3 GHG 排放量
- 氣候相關風險與機會的量化指標
- 減碳目標與績效

## 情境分析框架
- 轉型風險：政策法規、技術變革、市場轉變、聲譽影響
- 實體風險：急性（極端天氣）、慢性（長期氣候變化）
- 機會：資源效率、能源來源、產品/服務、市場、韌性

## 輸出格式
以 ${lang} 輸出，嚴格遵循 TCFD 建議結構。`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 公司氣候相關數據\n${JSON.stringify(data, null, 2)}`;
    }

    return `請為 ${company} 進行 ${year} 年度 TCFD 氣候風險分析報告。

## 分析要求
1. 依 TCFD 四大支柱完整分析
2. 進行至少 2 種氣候情境分析（如 1.5°C、2°C、4°C）
3. 識別轉型風險與實體風險
4. 評估氣候相關財務影響
5. 提供管理建議

## 輸出結構
### 治理
- 董事會監督機制
- 管理層角色與職責

### 策略
- 氣候風險與機會識別
- 情境分析結果
- 財務影響評估

### 風險管理
- 風險識別流程
- 風險評估矩陣
- 整合至企業風險管理

### 指標與目標
- GHG 排放量（範疇 1/2/3）
- 減碳目標與路徑
- 績效追蹤機制${dataSection}`;
  }

  validate(ctx: SkillContext): boolean {
    return !!(ctx.company || ctx.data);
  }

  postProcess(response: string, _ctx: SkillContext): string {
    return `${response}

---
📋 **TCFD 合規檢核**
- [ ] 治理揭露完整
- [ ] 策略與情境分析包含
- [ ] 風險管理流程描述
- [ ] 指標與目標量化
- [ ] 財務影響評估`;
  }
}

registerSkill(new TCFDAnalysisSkill());
