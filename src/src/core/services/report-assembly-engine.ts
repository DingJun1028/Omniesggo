// Report Assembly Engine for C-version Professional Sustainability Report
// Takes company data + question answers and produces a professional ESG report

import type {
  GeneratedReport,
  ReportChapter,
  ReportOptions,
  GRIIndex,
  AnswerRecord,
  CompanyProfile,
  QuestionBank,
  ChapterDefinition,
} from '../repositories/types';

import {
  chapterDefinitions,
  getCompanyById,
  getQuestionsByChapter,
  getAnswersForCompany,
  getChapterDefinition,
} from '../repositories/data-sources';

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Count words in Chinese + English mixed text
 * Chinese characters count individually, English words split by spaces
 */
export function countWords(text: string): number {
  if (!text) return 0;
  let chineseCount = 0;
  let englishCount = 0;
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
  const chineseMatches = text.match(chineseRegex);
  if (chineseMatches) {
    chineseCount = chineseMatches.length;
  }
  const strippedText = text.replace(chineseRegex, ' ').trim();
  if (strippedText.length > 0) {
    const words = strippedText.split(/\s+/).filter(w => w.length > 0);
    englishCount = words.length;
  }
  return chineseCount + englishCount;
}

/**
 * Replace template placeholders with actual values
 */
function replacePlaceholders(text: string, profile: CompanyProfile, year: number): string {
  const replacements: Record<string, string> = {
    '{{company_name}}': profile.name,
    '{{company_name_en}}': profile.nameEn,
    '{{industry}}': profile.industry,
    '{{industry_en}}': profile.industryEn,
    '{{headquarters}}': profile.headquarters,
    '{{headquarters_en}}': profile.headquartersEn,
    '{{employees}}': profile.employees.toLocaleString('zh-TW'),
    '{{capital}}': (profile.capital / 100000000).toFixed(0) + '億元',
    '{{founded_year}}': profile.foundedYear.toString(),
    '{{report_year}}': year.toString(),
    '{{website}}': profile.website || '',
    '{{description}}': profile.description,
    '{{board_members}}': '9',
    '{{independent_count}}': '4',
    '{{stakeholder_groups}}': '客戶、員工、股東、供應商、社區、政府機關、非政府組織',
    '{{stakeholder_count}}': '7',
    '{{materiality_process}}': '問卷調查、專家訪談、文獻回顧與高階主管工作坊',
    '{{material_topics}}': '15',
    '{{engagement_channels}}': '官網、年會、問卷、法人說明會、社羣媒體',
    '{{environmental_policy}}': '綠色製造、節能減碳、循環經濟',
    '{{water_strategy}}': '節水、回收與再生水利用',
    '{{water_usage}}': '2,500,000',
    '{{recycling_rate}}': '85',
    '{{biodiversity_actions}}': '廠區綠化、生態復育及環境教育',
    '{{climate_strategy}}': '科學基礎減碳目標（SBT）',
    '{{ghg_scope1}}': '120,000',
    '{{ghg_scope2}}': '280,000',
    '{{ghg_scope3}}': '850,000',
    '{{carbon_target}}': '2030',
    '{{carbon_reduction}}': '50',
    '{{energy_total}}': '5,200,000',
    '{{renewable_ratio}}': '25',
    '{{climate_risks}}': '5',
    '{{female_ratio}}': '38',
    '{{female_mgmt_ratio}}': '22',
    '{{training_hours}}': '40',
    '{{training_programs}}': '專業技術、管理領導、永續發展、數位轉型',
    '{{benefits}}': '員工持股信託、彈性工時、育嬰假、健康檢查、員工旅遊',
    '{{turnover_rate}}': '8.5',
    '{{engagement_score}}': '78',
    '{{ohs_practices}}': '風險評估、自動檢查、教育訓練及應急演練',
    '{{injury_rate}}': '0.8',
    '{{health_programs}}': '健康檢查、心理諮商、運動課程及戒菸計畫',
    '{{safety_training_hours}}': '12,000',
    '{{human_rights_policy}}': '國際勞工組織核心公約及聯合國全球契約',
    '{{labor_protections}}': '集體協商、申訴機制、禁用童工及強迫勞動',
    '{{community_investment}}': '5,000萬',
    '{{community_programs}}': '教育補助、社區發展、環境保護及災難救助',
    '{{diversity_initiatives}}': '女性領導力培育、身心障礙者及原住民就業促進',
    '{{supplier_criteria}}': '品質、交期、價格、環保、勞工權益及誠信廉潔',
    '{{supplier_count}}': '1,200',
    '{{sustainable_procurement_criteria}}': '環境管理系統、勞工標準及道德規範',
    '{{sustainable_procurement_ratio}}': '65',
    '{{supply_risks}}': '地緣政治、自然災害、原物料價格波動及法規變動',
    '{{audit_count}}': '350',
    '{{audit_pass_rate}}': '92',
    '{{quality_certifications}}': 'ISO 9001、IATF 16949、ISO 13485',
    '{{satisfaction_score}}': '4.2',
    '{{rd_investment}}': '80億',
    '{{patents_count}}': '150',
    '{{revenue}}': '5,000億',
    '{{net_income}}': '600億',
    '{{eps}}': '23.5',
    '{{esg_rating}}': 'AA',
    '{{esg_ranking}}': '臺灣前10%',
    '{{ir_activities}}': '法人說明會、股東會、ESG論壇及投資人拜訪',
    '{{impact_assessments}}': '3',
    '{{verifier}}': '勤誠聯合會計師事務所',
    '{{verification_standard}}': 'ISAE 3000',
    '{{data_owner}}': '永續發展部',
    '{{sustainability_vision}}': '以科技與創新驅動永續未來',
    '{{products}}': '先進製程晶片、封裝測試服務及設計生態系統',
  };

  let result = text;
  const keys = Object.keys(replacements);
  for (let i = 0; i < keys.length; i++) {
    const regex = new RegExp(keys[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, replacements[i]);
  }
  return result;
}

// ─── Chapter Content Generation ──────────────────────────────────────────────

function generateChapterContent(
  chapterDef: ChapterDefinition,
  questions: QuestionBank[],
  answers: AnswerRecord[],
  profile: CompanyProfile,
  year: number
): { content: string; wordCount: number; griIndicators: string[]; dataQuality: 'high' | 'medium' | 'low' } {
  const sections: string[] = [];
  const griIndicators: string[] = [];
  let answeredCount = 0;
  let totalRequired = 0;

  // Chapter header
  sections.push(`# C${chapterDef.number} ${chapterDef.title}`);
  sections.push(`\n## ${chapterDef.title}\n`);
  sections.push(chapterDef.description);
  sections.push('');

  // Group questions by category
  const categories: Record<string, QuestionBank[]> = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!categories[q.category]) {
      categories[q.category] = [];
    }
    categories[q.category].push(q);
  }

  const categoryKeys = Object.keys(categories);
  for (let ci = 0; ci < categoryKeys.length; ci++) {
    const catName = categoryKeys[ci];
    const catQuestions = categories[catName];

    sections.push(`\n### ${catName}\n`);

    for (let qi = 0; qi < catQuestions.length; qi++) {
      const q = catQuestions[qi];
      if (q.required) totalRequired++;

      // Find matching answer
      let answerText = '';
      for (let ai = 0; ai < answers.length; ai++) {
        if (answers[ai].questionId === q.id) {
          answerText = String(answers[ai].answer);
          if (q.required) answeredCount++;
          break;
        }
      }

      if (answerText) {
        const processedAnswer = replacePlaceholders(answerText, profile, year);
        sections.push(processedAnswer);
        sections.push('');

        if (q.griMapping) {
          griIndicators.push(q.griMapping);
        }
      } else if (q.required) {
        sections.push(`*[待補充：${q.question}]*\n`);
      }
    }
  }

  // Add summary section
  sections.push(`\n### 本章小結\n`);
  const completeness = totalRequired > 0 ? Math.round((answeredCount / totalRequired) * 100) : 0;
  sections.push(
    `本章涵蓋${chapterDef.title}相關之${chapterDef.griStandards.length}項GRI指標，` +
    `共${totalRequired}項關鍵議題，資料完整度為${completeness}%。` +
    `本公司將持續精進相關作為，強化永續資訊揭露品質。`
  );

  const fullContent = sections.join('\n');
  const wordCount = countWords(fullContent);

  let dataQuality: 'high' | 'medium' | 'low' = 'high';
  if (completeness < 60) dataQuality = 'low';
  else if (completeness < 85) dataQuality = 'medium';

  return { content: fullContent, wordCount, griIndicators, dataQuality };
}

// ─── GRI Index Generation ────────────────────────────────────────────────────

function generateGRIIndex(chapters: ReportChapter[]): GRIIndex[] {
  const griMap: Record<string, GRIIndex> = {
    'GRI-102-1': { standard: 'GRI 102', indicator: '102-1', title: '組織活動描述', pageReference: 'C1', status: 'reported' },
    'GRI-102-2': { standard: 'GRI 102', indicator: '102-2', title: '主要品牌、產品及服務', pageReference: 'C1', status: 'reported' },
    'GRI-102-3': { standard: 'GRI 102', indicator: '102-3', title: '總部位置', pageReference: 'C1', status: 'reported' },
    'GRI-102-4': { standard: 'GRI 102', indicator: '102-4', title: '營運據點', pageReference: 'C1', status: 'reported' },
    'GRI-102-5': { standard: 'GRI 102', indicator: '102-5', title: '所有權性質與法律形式', pageReference: 'C1', status: 'reported' },
    'GRI-102-8': { standard: 'GRI 102', indicator: '102-8', title: '員工及其他工作者的資訊', pageReference: 'C6', status: 'reported' },
    'GRI-102-18': { standard: 'GRI 102', indicator: '102-18', title: '治理結構', pageReference: 'C2', status: 'reported' },
    'GRI-102-19': { standard: 'GRI 102', indicator: '102-19', title: '最高治理單位的提名與遴選流程', pageReference: 'C2', status: 'reported' },
    'GRI-102-20': { standard: 'GRI 102', indicator: '102-20', title: '最高治理單位在永續管理中的角色', pageReference: 'C2', status: 'reported' },
    'GRI-102-35': { standard: 'GRI 102', indicator: '102-35', title: '薪酬政策', pageReference: 'C2', status: 'partially_reported' },
    'GRI-102-40': { standard: 'GRI 102', indicator: '102-40', title: '利害關係人團體列表', pageReference: 'C3', status: 'reported' },
    'GRI-102-42': { standard: 'GRI 102', indicator: '102-42', title: '鑑別與選擇利害關係人的方法', pageReference: 'C3', status: 'reported' },
    'GRI-102-43': { standard: 'GRI 102', indicator: '102-43', title: '利害關係人參與的方針', pageReference: 'C3', status: 'reported' },
    'GRI-102-44': { standard: 'GRI 102', indicator: '102-44', title: '關鍵主題與關注事項', pageReference: 'C3', status: 'reported' },
    'GRI-102-46': { standard: 'GRI 102', indicator: '102-46', title: '決定重大主題的流程', pageReference: 'C3', status: 'reported' },
    'GRI-102-56': { standard: 'GRI 102', indicator: '102-56', title: '外部保證/確信', pageReference: 'C12', status: 'reported' },
    'GRI-103-1': { standard: 'GRI 103', indicator: '103-1', title: '管理方針的解釋', pageReference: 'C4-C12', status: 'reported' },
    'GRI-103-2': { standard: 'GRI 103', indicator: '103-2', title: '管理方針及其要素', pageReference: 'C4', status: 'reported' },
    'GRI-201-1': { standard: 'GRI 201', indicator: '201-1', title: '直接經濟績效產生與分配', pageReference: 'C11', status: 'reported' },
    'GRI-201-2': { standard: 'GRI 201', indicator: '201-2', title: '氣候變遷的財務影響', pageReference: 'C5', status: 'reported' },
    'GRI-201-3': { standard: 'GRI 201', indicator: '201-3', title: '確定福利義務與其他退休計畫', pageReference: 'C6', status: 'partially_reported' },
    'GRI-201-4': { standard: 'GRI 201', indicator: '201-4', title: '來自政府之財務補助', pageReference: 'C11', status: 'not_reported' },
    'GRI-302-1': { standard: 'GRI 302', indicator: '302-1', title: '組織內部的能源消耗', pageReference: 'C5', status: 'reported' },
    'GRI-303-3': { standard: 'GRI 303', indicator: '303-3', title: '取水', pageReference: 'C4', status: 'reported' },
    'GRI-304-2': { standard: 'GRI 304', indicator: '304-2', title: '活動、產品及服務對生物多樣性的重大影響', pageReference: 'C4', status: 'partially_reported' },
    'GRI-305-1': { standard: 'GRI 305', indicator: '305-1', title: '直接（範疇一）溫室氣體排放', pageReference: 'C5', status: 'reported' },
    'GRI-305-2': { standard: 'GRI 305', indicator: '305-2', title: '能源間接（範疇二）溫室氣體排放', pageReference: 'C5', status: 'reported' },
    'GRI-305-3': { standard: 'GRI 305', indicator: '305-3', title: '其他間接（範疇三）溫室氣體排放', pageReference: 'C5', status: 'reported' },
    'GRI-306-3': { standard: 'GRI 306', indicator: '306-3', title: '產生的廢棄物', pageReference: 'C4', status: 'reported' },
    'GRI-308-1': { standard: 'GRI 308', indicator: '308-1', title: '使用新供應商篩選環境標準', pageReference: 'C9', status: 'reported' },
    'GRI-308-2': { standard: 'GRI 308', indicator: '308-2', title: '供應鏈之負面環境影響及採取之行動', pageReference: 'C9', status: 'partially_reported' },
    'GRI-401-1': { standard: 'GRI 401', indicator: '401-1', title: '新進員工僱用率及員工流動率', pageReference: 'C6', status: 'reported' },
    'GRI-401-2': { standard: 'GRI 401', indicator: '401-2', title: '提供給全職員工的福利', pageReference: 'C6', status: 'reported' },
    'GRI-403-1': { standard: 'GRI 403', indicator: '403-1', title: '職業安全衛生管理系統', pageReference: 'C7', status: 'reported' },
    'GRI-403-5': { standard: 'GRI 403', indicator: '403-5', title: '工作者安全衛生訓練', pageReference: 'C7', status: 'partially_reported' },
    'GRI-403-6': { standard: 'GRI 403', indicator: '403-6', title: '工作者健康促進', pageReference: 'C7', status: 'reported' },
    'GRI-403-9': { standard: 'GRI 403', indicator: '403-9', title: '職業傷害', pageReference: 'C7', status: 'reported' },
    'GRI-404-2': { standard: 'GRI 404', indicator: '404-2', title: '提升員工技能與過渡協助計畫', pageReference: 'C6', status: 'reported' },
    'GRI-405-1': { standard: 'GRI 405', indicator: '405-1', title: '治理單位與員工的多元化', pageReference: 'C6', status: 'reported' },
    'GRI-405-2': { standard: 'GRI 405', indicator: '405-2', title: '女性基本薪資與男性之比率', pageReference: 'C6', status: 'not_reported' },
    'GRI-412-1': { standard: 'GRI 412', indicator: '412-1', title: '經人權審查或影響評估之營運活動', pageReference: 'C8', status: 'reported' },
    'GRI-413-1': { standard: 'GRI 413', indicator: '413-1', title: '包括社區參與、投資及發展計畫之營運活動', pageReference: 'C8', status: 'reported' },
    'GRI-414-1': { standard: 'GRI 414', indicator: '414-1', title: '使用新供應商篩選社會標準', pageReference: 'C9', status: 'partially_reported' },
    'GRI-414-2': { standard: 'GRI 414', indicator: '404-2', title: '供應鏈之負面社會影響及採取之行動', pageReference: 'C9', status: 'partially_reported' },
    'GRI-416-1': { standard: 'GRI 416', indicator: '416-1', title: '評估產品及服務類別的健康與安全影響', pageReference: 'C10', status: 'reported' },
    'GRI-416-2': { standard: 'GRI 416', indicator: '416-2', title: '產品及服務健康與安全影響之違規事件', pageReference: 'C10', status: 'not_reported' },
    'GRI-418-1': { standard: 'GRI 418', indicator: '418-1', title: '經證實侵犯客戶隱私或遺失客戶資料之投訴', pageReference: 'C10', status: 'reported' },
  };

  // Collect all GRI indicators from chapters
  const chapterGriSet: Record<string, string> = {};
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    for (let j = 0; j < ch.griIndicators.length; j++) {
      chapterGriSet[ch.griIndicators[j]] = `C${ch.number}`;
    }
  }

  // Build final index
  const result: GRIIndex[] = [];
  const allKeys = Object.keys(griMap);
  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const entry = griMap[key];
    if (chapterGriSet[key]) {
      result.push({
        ...entry,
        pageReference: chapterGriSet[key],
      });
    }
  }

  return result;
}

// ─── Main Assembly Function ──────────────────────────────────────────────────

export function assembleReport(
  companyId: string,
  options?: ReportOptions
): GeneratedReport {
  const language = options?.language || 'zh';
  const reportYear = options?.reportYear || new Date().getFullYear() - 1;
  const includeGriIndex = options?.includeGriIndex !== false;

  // Get company profile
  const profile = getCompanyById(companyId);
  if (!profile) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Get answers
  const answers = getAnswersForCompany(companyId);

  // Generate chapters
  const chapters: ReportChapter[] = [];
  let totalWordCount = 0;

  for (let i = 0; i < chapterDefinitions.length; i++) {
    const chapterDef = chapterDefinitions[i];
    const questions = getQuestionsByChapter(chapterDef.number);

    const { content, wordCount, griIndicators, dataQuality } = generateChapterContent(
      chapterDef,
      questions,
      answers,
      profile,
      reportYear
    );

    chapters.push({
      id: `chapter-${chapterDef.number}`,
      number: chapterDef.number,
      title: language === 'zh' ? chapterDef.title : chapterDef.titleEn,
      titleEn: chapterDef.titleEn,
      content,
      wordCount,
      griIndicators,
      dataQuality,
    });

    totalWordCount += wordCount;
  }

  // Generate GRI index
  const griIndex = includeGriIndex ? generateGRIIndex(chapters) : [];

  // Calculate data completeness
  let totalRequired = 0;
  let totalAnswered = 0;
  for (let i = 0; i < chapters.length; i++) {
    const chDef = getChapterDefinition(chapters[i].number);
    if (chDef) {
      totalRequired += chDef.requiredAnswers.length;
      for (let j = 0; j < chDef.requiredAnswers.length; j++) {
        const qid = chDef.requiredAnswers[j];
        for (let k = 0; k < answers.length; k++) {
          if (answers[k].questionId === qid && answers[k].answer) {
            totalAnswered++;
            break;
          }
        }
      }
    }
  }
  const dataCompleteness = totalRequired > 0 ? Math.round((totalAnswered / totalRequired) * 100) : 0;

  // Build report
  const report: GeneratedReport = {
    id: `report-${companyId}-${reportYear}`,
    companyId,
    companyName: language === 'zh' ? profile.name : profile.nameEn,
    title: language === 'zh'
      ? `${profile.name} ${reportYear}年永續報告書`
      : `${profile.nameEn} ${reportYear} Sustainability Report`,
    generatedAt: new Date().toISOString(),
    reportYear,
    language,
    chapters,
    griIndex,
    totalWordCount,
    metadata: {
      version: '1.0.0',
      templateUsed: 'C-version Professional ESG Report',
      dataCompleteness,
    },
  };

  return report;
}
