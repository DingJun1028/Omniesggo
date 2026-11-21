// ═══════════════════════════════════════════════════════════════
// Materiality Matrix Skill (重大性矩陣)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

// 常見 ESG 重大主題
const COMMON_TOPICS = {
  environmental: [
    '氣候變遷與減碳',
    '能源管理',
    '水資源管理',
    '廢棄物管理',
    '生物多樣性',
    '污染防治',
    '循環經濟',
  ],
  social: [
    '員工健康與安全',
    '人才招募與留任',
    '多元與包容',
    '供應鏈管理',
    '客戶關係',
    '社區參與',
    '人權保障',
  ],
  governance: [
    '公司治理',
    '商業倫理',
    '資訊安全',
    '風險管理',
    '法規遵循',
    '供應商管理',
    '利害關係人溝通',
  ],
};

class MaterialityMatrixSkill extends ESGSkill {
  readonly id = 'materiality-matrix';
  readonly name = '重大性矩陣';
  readonly nameEn = 'Materiality Matrix';
  readonly description = '識別 ESG 重大主題並建立重大性評估矩陣';
  readonly taskType = 'materiality_matrix';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    const topicsList = Object.entries(COMMON_TOPICS)
      .map(([category, topics]) => `### ${category.toUpperCase()}\n${topics.map(t => `- ${t}`).join('\n')}`)
      .join('\n\n');

    return `你是 OmniCore 的重大性評估專家，精通 ESG 重大性矩陣分析方法論。

## 常見 ESG 重大主題
${topicsList}

## 重大性評估方法
1. **雙重重大性**（Double Materiality）：
   - 財務重大性：對企業財務的影響
   - 影響重大性：對環境和社會的影響

2. **評估維度**：
   - 對業務的影響程度（1-5）
   - 對利害關係人的影響程度（1-5）
   - 發生可能性（1-5）
   - 可管理性（1-5）

3. **評估流程**：
   - 利害關係人調查
   - 專家訪談
   - 同業分析
   - 法規要求檢視

## 輸出格式
以 ${lang} 輸出，包含：
1. 重大性評估方法論
2. 利害關係人調查結果
3. 重大性矩陣圖（文字描述）
4. 重大主題清單與優先級
5. 管理建議`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 公司資訊\n${JSON.stringify(data, null, 2)}`;
    }

    return `請為 ${company} ${year} 年度進行 ESG 重大性評估並建立重大性矩陣。

## 評估要求
1. 識別所有相關 ESG 主題
2. 進行雙重重大性評估
3. 建立重大性矩陣
4. 識別前 5-10 大重大主題
5. 提供管理建議

## 輸出格式
### 評估方法論
描述評估流程與標準

### 重大主題清單
| 主題 | 類別 | 業務影響 | 社會影響 | 重大性分數 | 優先級 |

### 重大性矩陣
文字描述矩陣圖（X軸：業務影響，Y軸：社會影響）

### 前 10 大重大主題
各主題的詳細說明與管理建議

### 管理建議
如何管理各重大主題${dataSection}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }

  postProcess(response: string, _ctx: SkillContext): string {
    return `${response}

---
📋 **重大性評估注意事項**
- 重大性評估應至少每年更新一次
- 建議納入多元利害關係人觀點
- 重大主題應與 GRI/CSRD 揭露要求對齊
- 評估結果應經董事會或管理層確認`;
  }
}

registerSkill(new MaterialityMatrixSkill());
