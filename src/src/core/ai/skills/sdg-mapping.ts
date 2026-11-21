// ═══════════════════════════════════════════════════════════════
// SDG Mapping Skill (永續發展目標對應)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

// SDG 17 項目標定義
const SDG_GOALS = [
  { id: 1, name: '消除貧窮', nameEn: 'No Poverty', icon: '🔴' },
  { id: 2, name: '消除飢餓', nameEn: 'Zero Hunger', icon: '🟡' },
  { id: 3, name: '良好健康與福祉', nameEn: 'Good Health', icon: '🟢' },
  { id: 4, name: '優質教育', nameEn: 'Quality Education', icon: '🔴' },
  { id: 5, name: '性別平等', nameEn: 'Gender Equality', icon: '🟠' },
  { id: 6, name: '潔淨水與衛生', nameEn: 'Clean Water', icon: '🔵' },
  { id: 7, name: '可負擔的潔淨能源', nameEn: 'Affordable Energy', icon: '🟡' },
  { id: 8, name: ' decent work and economic growth', nameEn: 'Decent Work', icon: '🔴' },
  { id: 9, name: '產業創新和基礎設施', nameEn: 'Industry & Innovation', icon: '🟠' },
  { id: 10, name: '減少不平等', nameEn: 'Reduced Inequalities', icon: '🩷' },
  { id: 11, name: '永續城市和社區', nameEn: 'Sustainable Cities', icon: '🟠' },
  { id: 12, name: '負責任的消費和生產', nameEn: 'Responsible Consumption', icon: '🟤' },
  { id: 13, name: '氣候行動', nameEn: 'Climate Action', icon: '🟢' },
  { id: 14, name: '水下生物', nameEn: 'Life Below Water', icon: '🔵' },
  { id: 15, name: '陸地生物', nameEn: 'Life on Land', icon: '🟢' },
  { id: 16, name: '和平正義與強健制度', nameEn: 'Peace & Justice', icon: '🔵' },
  { id: 17, name: '夥伴關係', nameEn: 'Partnerships', icon: '🔵' },
];

class SDGMappingSkill extends ESGSkill {
  readonly id = 'sdg-mapping';
  readonly name = 'SDG 目標對應';
  readonly nameEn = 'SDG Goal Mapping';
  readonly description = '將企業活動對應至聯合國 17 項永續發展目標';
  readonly taskType = 'sdg_mapping';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    const goalsList = SDG_GOALS.map(g => `- SDG ${g.id}: ${g.name} (${g.nameEn})`).join('\n');

    return `你是 OmniCore 的 SDG 對應專家，精通聯合國 17 項永續發展目標（SDGs）。

## 17 項 SDG 目標
${goalsList}

## 對應方法論
1. **直接貢獻**：企業活動直接推動某個 SDG 目標
2. **間接貢獻**：透過供應鏈、投資等間接影響
3. **負面影響**：企業活動可能阻礙某個 SDG 目標
4. **補充指標**：使用官方補充指標量化貢獻

## 對應框架
- 活動描述 → SDG 目標匹配
- 影響評估 → 正面/負面/中性
- 貢獻程度 → 主要/次要/潛在
- 量化指標 → KPI 設計

## 輸出格式
以 ${lang} 輸出，包含：
1. SDG 對應矩陣表
2. 各目標貢獻說明
3. 補充指標建議
4. 改進建議`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 公司活動與永續作為\n${JSON.stringify(data, null, 2)}`;
    }

    return `請為 ${company} ${year} 年度的企業活動進行 SDG 目標對應分析。

## 對應要求
1. 識別與公司活動相關的 SDG 目標
2. 評估各目標的貢獻程度（主要/次要/潛在）
3. 設計量化 KPI 指標
4. 識別可能的負面影響
5. 提供改進建議

## 輸出格式
### SDG 對應矩陣
| SDG | 目標名稱 | 貢獻程度 | 關聯活動 | KPI 指標 |

### 詳細說明
各目標的具體貢獻與量化指標

### 改進建議
如何加強 SDG 貢獻${dataSection}`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }

  postProcess(response: string, _ctx: SkillContext): string {
    // 確保包含所有 17 個 SDG 的提及
    return `${response}

---
🌍 **SDG 對應完整性檢核**
- [ ] 已識別所有相關 SDG 目標
- [ ] 各目標有明確 KPI 指標
- [ ] 負面影響已評估
- [ ] 改進建議具體可行`;
  }
}

registerSkill(new SDGMappingSkill());
