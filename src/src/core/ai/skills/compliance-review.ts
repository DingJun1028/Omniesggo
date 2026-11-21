// ═══════════════════════════════════════════════════════════════
// Compliance Review Skill (合規審查)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

// 合規標準定義
const COMPLIANCE_STANDARDS = {
  GRI: {
    name: 'GRI Standards',
    version: '2021',
    description: '全球報告倡議組織永續報告標準',
    key_requirements: [
      'GRI 1: 基礎 2021',
      'GRI 2: 一般揭露 2021',
      'GRI 3: 重大主題 2021',
      'GRI 200-400: 經濟、環境、社會主題',
    ],
  },
  CSRD: {
    name: 'CSRD (EU)',
    version: '2023',
    description: '歐盟企業永續發展報告指令',
    key_requirements: [
      '雙重重大性評估',
      '歐洲永續發展報告標準 (ESRS)',
      '有限保證要求',
      '數位化標記',
    ],
  },
  TCFD: {
    name: 'TCFD',
    version: '2017',
    description: '氣候相關財務揭露工作小組建議',
    key_requirements: [
      '治理揭露',
      '策略揭露',
      '風險管理揭露',
      '指標與目標揭露',
    ],
  },
  ISSB: {
    name: 'ISSB S1/S2',
    version: '2023',
    description: '國際永續準則理事會揭露標準',
    key_requirements: [
      'S1: 永續相關財務資訊揭露',
      'S2: 氣候相關揭露',
      '行業特定揭露',
      '過渡期間規定',
    ],
  },
};

class ComplianceReviewSkill extends ESGSkill {
  readonly id = 'compliance-review';
  readonly name = '合規審查';
  readonly nameEn = 'Compliance Review';
  readonly description = '審查 ESG 報告是否符合 GRI/CSRD/TCFD/ISSB 標準';
  readonly taskType = 'compliance_review';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    const standards = Object.entries(COMPLIANCE_STANDARDS)
      .map(([key, std]) => `### ${key} (${std.version})\n${std.description}\n要求：${std.key_requirements.join('、')}`)
      .join('\n\n');

    return `你是 OmniCore 的合規審查專家，精通以下國際標準：

${standards}

## 審查方法
1. **完整性檢查**：是否涵蓋所有必要揭露項目
2. **準確性檢查**：數據是否準確、一致
3. **時效性檢查**：資料是否為最新
4. **可比較性**：是否可與同業比較
5. **可驗證性**：是否有第三方驗證

## 審查等級
- ✅ 完全合規
- ⚠️ 部分合規（需改善）
- ❌ 不合規（需修正）
- 📋 不適用

## 輸出格式
以 ${lang} 輸出，包含：
1. 各標準合規評分
2. 缺失項目清單
3. 改善建議
4. 優先級排序`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 待審查報告內容\n${JSON.stringify(data, null, 2)}`;
    }

    return `請對 ${company} ${year} 年度的 ESG 報告進行合規審查。

## 審查範圍
1. GRI Standards 2021 合規性
2. CSRD (EU) 適用性（如適用）
3. TCFD 建議遵循度
4. ISSB S1/S2 準則符合度

## 審查要求
1. 逐項檢核各標準要求
2. 評估合規程度（完全/部分/不合規）
3. 識別缺失與風險
4. 提供具體改善建議
5. 優先級排序

## 輸出格式
### 合規評分總覽
| 標準 | 合規分數 | 等級 | 缺失數 |

### 缺失項目清單
| 項目 | 標準要求 | 現況 | 差距 | 優先級 |

### 改善建議
各項目的具體改善措施${dataSection}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }

  postProcess(response: string, _ctx: SkillContext): string {
    return `${response}

---
📋 **合規審查注意事項**
- 本審查為初步評估，正式合規需由第三方驗證機構確認
- 各標準適用性依公司規模、行業、上市狀態而異
- 建議定期（至少每年）進行合規審查`;
  }
}

registerSkill(new ComplianceReviewSkill());
