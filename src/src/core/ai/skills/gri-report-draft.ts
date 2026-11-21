// ═══════════════════════════════════════════════════════════════
// GRI Report Draft Skill (GRI 報告草稿)
// ═══════════════════════════════════════════════════════════════

import { ESGSkill, SkillContext, registerSkill } from './index';

// GRI 報告結構
const GRI_STRUCTURE = {
  '1': { title: '組織簡介', titleEn: 'Organizational Profile', description: '組織規模、結構、策略、利害關係人關係' },
  '2': { title: '利害關係人參與', titleEn: 'Stakeholder Engagement', description: '利害關係人識別、參與方式、頻率' },
  '3': { title: '報告實務', titleEn: 'Reporting Practices', description: '報告期間、參照標準、重大主題' },
  '2-6': { title: '利害關係人參與', titleEn: 'Stakeholder Engagement', description: '利害關係人分類、需求、參與方式' },
  '3-1': { title: '重大主題識別流程', titleEn: 'Material Topics', description: '重大性評估方法、結果' },
  '2-1': { title: '組織概況', titleEn: 'Organizational Profile', description: '法律名稱、總部、行業別' },
  '2-2': { title: '策略', titleEn: 'Strategy', description: '永續策略、目標、里程碑' },
  '2-9': { title: '供應鏈', titleEn: 'Supply Chain', description: '供應鏈範圍、管理方式' },
  '3-3': { title: '報告期間', titleEn: 'Reporting Period', description: '報告起迄日、更新頻率' },
  '3-4': { title: '參照標準', titleEn: 'Reporting Standards', description: '引用標準、選用索引' },
  '3-5': { title: '重大主題', titleEn: 'Material Topics', description: '重大主題清單、排序' },
  '3-6': { title: '利害關係人觀點', titleEn: 'Stakeholder Perspectives', description: '利害關係人回饋摘要' },
  '3-7': { title: '重大性評估', titleEn: 'Materiality Assessment', description: '評估方法、結果' },
  '3-8': { title: '參照 GRI 內容索引', titleEn: 'GRI Content Index', description: 'GRI 內容索引表' },
  '4': { title: '一般揭露', titleEn: 'General Disclosures', description: '組織治理、策略、管理' },
};

class GRIReportDraftSkill extends ESGSkill {
  readonly id = 'gri-report-draft';
  readonly name = 'GRI 報告草稿';
  readonly nameEn = 'GRI Report Draft';
  readonly description = '依 GRI Standards 2021 生成永續報告草稿';
  readonly taskType = 'gri_report_draft';

  systemPrompt(ctx: SkillContext): string {
    const lang = ctx.language === 'en' ? 'English' : '繁體中文';
    const structure = Object.entries(GRI_STRUCTURE)
      .map(([code, item]) => `- ${code}: ${item.title} (${item.titleEn}) - ${item.description}`)
      .join('\n');

    return `你是 OmniCore 的 GRI 報告撰寫專家，精通 GRI Standards 2021 永續報告標準。

## GRI 報告結構
${structure}

## 撰寫原則
1. **materiality-based**：以重大主題為核心
2. **balanced reporting**：平衡正面與負面資訊
3. **complete information**：提供完整揭露
4. **accurate data**：確保數據準確
5. **clear presentation**：清晰易讀的呈現
6. **timely disclosure**：資訊時效性

## 報告品質要求
- 使用繁體中文撰寫
- 數據需有明確來源與期間
- 建議配圖表輔助說明
- 遵循 GRI 內容索引格式

## 輸出格式
以 ${lang} 輸出完整 GRI 報告草稿，包含所有必要章節。`;
  }

  userPrompt(ctx: SkillContext): string {
    const company = ctx.company || '該公司';
    const year = ctx.year || '2024';
    const data = ctx.data as Record<string, unknown> | undefined;

    let dataSection = '';
    if (data) {
      dataSection = `\n## 公司資料\n${JSON.stringify(data, null, 2)}`;
    }

    return `請為 ${company} 撰寫 ${year} 年度 GRI 永續報告草稿。

## 撰寫要求
1. 依 GRI Standards 2021 結構撰寫
2. 涵蓋所有一般揭露項目（GRI 2-3）
3. 針對重大主題撰寫績效揭露
4. 提供具體數據與範例
5. 建議配圖表輔助說明

## 輸出結構
1. 執行摘要
2. 關於本報告
3. 組織概況
4. 利害關係人參與
5. 重大主題
6. 績效揭露（依 GRI 200-400 主題）
7. GRI 內容索引
8. 外部保證聲明（建議）${dataSection}

## 重要提醒
- 確保所有揭露項目有明確數據支撐
- 數據需標註期間與單位
- 建議提供同業比較參考`;
  }

  validate(_ctx: SkillContext): boolean {
    return true;
  }

  postProcess(response: string, _ctx: SkillContext): string {
    return `${response}

---
📊 **GRI 報告品質檢核**
- [ ] 所有一般揭露項目完整
- [ ] 重大主題績效揭露
- [ ] 數據準確性確認
- [ ] GRI 內容索引完整
- [ ] 利害關係人觀點納入`;
  }
}

registerSkill(new GRIReportDraftSkill());
