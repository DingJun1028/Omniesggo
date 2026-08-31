/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ESGGO v5 永續報告系統 — 28 章專家級範本段落池
 * GRI 2021 + ISSB + TCFD + TNFD + SDGs 完整覆蓋
 * 
 * Copyright © 2026 ESGGO. All rights reserved.
 * Licensed under the ESGGO Commercial License.
 * 
 * This file is immutable — all exports are Object.freeze()'d.
 * Total: 28 chapters × 8-10 paragraphs = 232 expert templates
 * Target: ~280K characters per company report
 */

export interface ExpertParagraph {
  id: string;
  chapter: number;
  section: string;
  griCode: string;
  fiveTGate: 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';
  placeholders: string[];
  content: string;
  kpiIndicators: string[];
  chartTemplate?: {
    type: 'bar' | 'line' | 'pie' | 'radar' | 'heatmap';
    data: Record<string, number | string>;
  };
}

export interface ChapterStat {
  chapterTitle: string;
  totalParagraphs: number;
  estimatedWords: number;
  griCoverage: string[];
  fiveTGateDistribution: Record<string, number>;
}

// ─── Chapter 01: 組織溯源與報告邊界 (GRI 2-1~2-8, GRI 1) ───

const _C01_P01: ExpertParagraph = {
  id: 'ch01-p01',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-1',
  fiveTGate: 'traceable',
  placeholders: ['company_name', 'report_year', 'founded_year', 'headquarters', 'legal_name', 'stock_code'],
  content: `<h3>組織概述與基本資訊</h3>
<p>{{company_name}}（股票代碼：{{stock_code}}）創立於 {{founded_year}} 年，總部設於 {{headquarters}}，法定名稱為 {{legal_name}}。截至 {{report_year}} 年 12 月 31 日，本集團在全球 {{operation_count}} 個國家設有營運據點，員工人數達 {{total_employees}} 人，年合併營收為 NT\${{revenue_millions}} 億元。</p>
<p>本集團主要業務範圍涵蓋 {{business_segments}}，各營收佔比為：{{revenue_breakdown}}。依據 GRI 2-1 規範，本報告完整揭露集團組織架構、股權結構及價值鏈配置，確保所有利害關係人得以清楚理解集團的經濟規模與營運足跡。</p>
<p>報告邊界涵蓋所有由 {{company_name}} 擁有或控制的實體，包括 {{subsidiary_count}} 家子公司。對於合資企業與投資事業，依據持股比例與實質控制權判斷是否納入合併報導範圍，並在本報告附錄七「集團組織與投資架構圖」中完整說明。</p>`,
  kpiIndicators: ['員工人數', '營收規模', '營運據點數', '子公司數', '成立年份'],
  chartTemplate: {
    type: 'pie',
    data: { '營收佔比-半導體': 42, '營收佔比-綠能': 28, '營收佔比-金融': 18, '營收佔比-其他': 12 }
  }
};

const _C01_P02: ExpertParagraph = {
  id: 'ch01-p02',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-2',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'operation_regions', 'subsidiary_count', 'joint_venture_count'],
  content: `<h3>營運據點與價值鏈分佈</h3>
<p>{{company_name}} 的營運足跡遍佈 {{operation_regions}}，形成全球化的研發、製造與銷售網絡。截至 {{report_year}} 年底，本集團共有 {{manufacturing_sites}} 個生產基地、{{rd_centers}} 個研發中心及 {{sales_offices}} 個銷售據點。</p>
<p>在價值鏈佈局上，上游原材料採購來自 {{supplier_count}} 家合格供應商，中游製造透過 {{production_capacity}} 的年產能滿足市場需求，下游銷售與客戶服務則透過 {{distribution_channels}} 個分銷渠道觸達終端客戶。此完整價值鏈的揭露符合 GRI 2-2 對組織價值鏈結構的報導要求。</p>
<p>各區域營收貢獻度以亞洲佔 {{asia_revenue_pct}}% 最高，其次為北美 {{na_revenue_pct}}% 及歐洲 {{eu_revenue_pct}}%。新興市場（含東南亞、印度及中東）營收佔比逐年提升，{{report_year}} 年達 {{emerging_revenue_pct}}%，顯示集團全球佈局的均衡發展策略已見成效。</p>`,
  kpiIndicators: ['生產基地數', '研發中心數', '銷售據點數', '供應商數', '區域營收佔比'],
  chartTemplate: {
    type: 'bar',
    data: { '亞洲': 52, '北美': 25, '歐洲': 15, '其他': 8 }
  }
};

const _C01_P03: ExpertParagraph = {
  id: 'ch01-p03',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-3',
  fiveTGate: 'traceable',
  placeholders: ['company_name', 'report_year', 'fiscal_year_end', 'reporting_cycle', 'previous_report_year'],
  content: `<h3>報導期間與報告週期</h3>
<p>本永續報告涵蓋期間為 {{report_year}} 年 1 月 1 日至 12 月 31 日，與 {{company_name}} 的財務報導期間一致，確保永續資訊與財務資訊的可比較性。報告週期為每年一次，上一期報告刊發於 {{previous_report_year}} 年 {{publish_month}} 月。</p>
<p>本報告依循 GRI 準則 2021 年版編製，並參照 ISSB IFRS S1 及 S2 準則、TCFD 建議及 TNFD 揭露框架。報導範圍涵蓋 {{company_name}} 及其合併子公司，對於新併購或處分的事業，依據所有權期間按比例報導。</p>
<p>報告編製流程包括：永續議題蒐集與重大性分析、各功能委員會資料彙整、數據查證與品質管理、董事會審議通過後發布。預計下一期報告將於 {{next_report_year}} 年 {{next_publish_month}} 月發布，持續維持每年定期報導的承諾。</p>`,
  kpiIndicators: ['報導期間', '報告週期', '發布日期', '準則版本'],
  chartTemplate: {
    type: 'line',
    data: { '2021': 1, '2022': 1, '2023': 1, '2024': 1, '2025': 1 }
  }
};

const _C01_P04: ExpertParagraph = {
  id: 'ch01-p04',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-4',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'restatement_count', 'restatement_reason', 'data_boundary_changes'],
  content: `<h3>資訊重編與報導邊界變動</h3>
<p>{{report_year}} 年度報告中，{{company_name}} 對 {{restatement_count}} 項歷史資訊進行重編，主要係因 {{restatement_reason}}。重編資訊已於報告中以註記標示，並確保利害關係人得以前後比較。</p>
<p>本年度報導邊界較前一年度 {{boundary_change_description}}。{{data_boundary_changes}}。所有邊界變動均經永續委員會審議確認，並於本報告附錄中提供邊界調整對照表。</p>
<p>為確保資訊品質，{{company_name}} 採用三層數據驗證機制：第一層由各業務單位自行查證、第二層由永續發展部進行交叉比對、第三層由外部確信機構抽樣驗證。重編政策與程序詳載於集團「永續資訊編製管理辦法」，確保資訊的一致性與可靠性。</p>`,
  kpiIndicators: ['重編次數', '邊界變動數', '驗證層級數'],
  chartTemplate: {
    type: 'bar',
    data: { '重編次數': 2, '邊界變動': 1, '驗證層級': 3 }
  }
};

const _C01_P05: ExpertParagraph = {
  id: 'ch01-p05',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-5',
  fiveTGate: 'trustworthy',
  placeholders: ['company_name', 'report_year', 'assurance_provider', 'assurance_level', 'assurance_scope'],
  content: `<h3>外部確信與查證聲明</h3>
<p>本報告已取得 {{assurance_provider}} 的有限確信（Limited Assurance），確信範圍涵蓋 {{assurance_scope}}。確信標準採用 ISAE 3000（國際確信業務準則 3000）及 AA1000 確信標準，由獨立查證團隊執行。</p>
<p>查證範圍包括：溫室氣體排放數據（範疇一、二、三）、員工統計數據、工時與安全指標、水資源使用量、廢棄物產生量等關鍵量化指標。質化資訊如治理架構、政策承諾及風險管理流程亦納入確信範圍。</p>
<p>確信結論指出：「基於上述程序，我們認為 {{company_name}} {{report_year}} 年度永續報告所包含的指定資訊，在所有重大方面均依循 GRI 準則 2021 年版編製，未有發現需修正之情事。」完整確信聲明請見本報告附錄一。</p>`,
  kpiIndicators: ['確信機構', '確信等級', '確信範圍覆蓋率', '關鍵指標數'],
  chartTemplate: {
    type: 'pie',
    data: { '確信範圍-排放': 30, '確信範圍-社會': 25, '確信範圍-治理': 20, '確信範圍-環境': 25 }
  }
};

const _C01_P06: ExpertParagraph = {
  id: 'ch01-p06',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-6',
  fiveTGate: 'tangible',
  placeholders: ['company_name', 'report_year', 'business_model', 'value_chain_position', 'key_products'],
  content: `<h3>商業模式與價值鏈定位</h3>
<p>{{company_name}} 的商業模式以 {{business_model}} 為核心，透過 {{value_chain_position}} 的產業定位，為客戶提供 {{key_products}} 等產品與服務。集團的競爭優勢來源於 {{competitive_advantages}}。</p>
<p>在價值創造過程中，集團投入 {{input_capital_types}} 六種資本，包括財務資本、製造資本、人力資本、社會與關係資本、自然資本及人力資本，透過經營活動產出 {{output_types}} 等產出。{{report_year}} 年集團總產值達 NT\${{total_value_created}} 億元。</p>
<p>集團持續推動商業模式創新，{{report_year}} 年在研發方面投入 NT\${{rd_expense}} 億元，佔營收 {{rd_ratio}}%，並推出 {{new_product_count}} 項新產品，其中 {{green_product_count}} 項具備環境或社會效益，顯示集團將永續價值內化於核心業務的決心。</p>`,
  kpiIndicators: ['研發投入金額', '研發佔比', '新產品數', '綠色產品數', '總產值'],
  chartTemplate: {
    type: 'radar',
    data: { '財務資本': 8, '製造資本': 7, '人力資本': 9, '社會資本': 6, '自然資本': 7, '智慧資本': 8 }
  }
};

const _C01_P07: ExpertParagraph = {
  id: 'ch01-p07',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-7',
  fiveTGate: 'trackable',
  placeholders: ['company_name', 'report_year', 'total_employees', 'employee_growth_rate', 'turnover_rate', 'avg_tenure_years'],
  content: `<h3>人力規模與僱用概況</h3>
<p>截至 {{report_year}} 年 12 月 31 日，{{company_name}} 全球員工人數為 {{total_employees}} 人，較前一年度成長 {{employee_growth_rate}}%。其中正職員工佔 {{fulltime_ratio}}%，兼職/臨時人員佔 {{parttime_ratio}}%。集團提供具競爭力的薪酬福利，{{report_year}} 年離職率為 {{turnover_rate}}%，平均年資為 {{avg_tenure_years}} 年。</p>
<p>人力結構依功能別：研發人員 {{rd_headcount}} 人（佔 {{rd_headcount_pct}}%）、生產製造 {{production_headcount}} 人、銷售與行銷 {{sales_headcount}} 人、行政管理 {{admin_headcount}} 人。依性別別：男性佔 {{male_ratio}}%、女性佔 {{female_ratio}}%。</p>
<p>{{company_name}} 承諾提供平等僱用機會，{{report_year}} 年女性主管佔比達 {{female_manager_ratio}}%，較前一年提升 {{female_manager_increase}} 個百分比。身心障礙者僱用人數為 {{disabled_employees}} 人，超過法定比例要求。集團並透過 {{internship_count}} 名實習生培育計畫，建立產學合作人才管道。</p>`,
  kpiIndicators: ['總員工人數', '離職率', '平均年資', '女性主管佔比', '研發人力'],
  chartTemplate: {
    type: 'bar',
    data: { '研發人員': 0, '生產製造': 0, '銷售與行銷': 0, '行政管理': 0 }
  }
};

const _C01_P08: ExpertParagraph = {
  id: 'ch01-p08',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 2-8',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'non_employee_workers', 'contractor_count', 'worker_categories'],
  content: `<h3>非員工工作者與外包人力</h3>
<p>{{report_year}} 年度，{{company_name}} 運用 {{non_employee_workers}} 名非員工工作者，包括 {{contractor_count}} 名承攬人員及 {{agency_worker_count}} 名派遣人員。這些工作者主要從事 {{worker_categories}} 等工作。</p>
<p>集團依據「非員工工作者管理規範」，確保所有非員工工作者享有與正職員工同等的安全防護標準、職業訓練機會及申訴管道。{{report_year}} 年非員工工作者訓練時數達 {{non_employee_training_hours}} 人時，與承攬商的合約中明確納入勞動權益保障條款。</p>
<p>為強化供應鏈人權盡職調查，集團對派遣公司及承攬商進行 {{contractor_audit_count}} 次稽核，涵蓋勞動條件、工時管理、薪酬合規等項目。稽核發現 {{contractor_noncompliance_count}} 項缺失，均已要求改善並完成追蹤。{{company_name}} 承諾持續提升非員工工作者的勞動權益保障水準。</p>`,
  kpiIndicators: ['非員工工作者數', '承攬商稽核次數', '訓練人時', '缺失改善率'],
  chartTemplate: {
    type: 'pie',
    data: { '正職員工': 78, '承攬人員': 12, '派遣人員': 7, '實習生': 3 }
  }
};

const _C01_P09: ExpertParagraph = {
  id: 'ch01-p09',
  chapter: 1,
  section: '組織溯源與報告邊界',
  griCode: 'GRI 1',
  fiveTGate: 'trustworthy',
  placeholders: ['company_name', 'report_year', 'gri_version', 'issb_reference', 'tcfd_alignment', 'tnfd_alignment'],
  content: `<h3>準則依循與報導框架</h3>
<p>本報告依循 GRI 準則 2021 年版（含 GRI 1：基礎 2021、GRI 2：一般揭露 2021、GRI 3：重大主題 2021 及各項行業準則）編製，採用「報導要求」作為合規基準。同時參照 {{issb_reference}} 準則、{{tcfd_alignment}} 建議及 {{tnfd_alignment}} 框架。</p>
<p>報導品質依循 GRI 1 所訂定的八大報導原則：正確性、平衡性、清晰性、比較性、可靠性、完整性、時效性及可驗證性。各章節均標明對應的 GRI 準則編號與揭露項目，確保利害關係人得以快速定位所需資訊。</p>
<p>本報告同時回應 ISSB IFRS S1（一般永續相關揭露要求）及 IFRS S2（氣候相關揭露）的報導要求，在氣候策略、風險管理、指標與目標等章節進行對應揭露。{{company_name}} 計畫於 {{issb_adoption_year}} 年全面接軌 ISSB 準則，展現與國際永續報導標準同步的決心。</p>`,
  kpiIndicators: ['GRI 準則版本', 'ISSB 接軌進度', 'TCFD 對齊程度', 'TNFD 揭露範圍'],
  chartTemplate: {
    type: 'radar',
    data: { 'GRI': 9, 'ISSB': 7, 'TCFD': 8, 'TNFD': 6, 'SDGs': 8 }
  }
};

// ─── Chapter 02: 永續治理架構 (GRI 2-9~2-21, 董事會) ───

const _C02_P01: ExpertParagraph = {
  id: 'ch02-p01',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-9',
  fiveTGate: 'traceable',
  placeholders: ['company_name', 'report_year', 'board_size', 'independent_director_ratio', 'board_meeting_count', 'board_attendance_rate'],
  content: `<h3>治理架構與董事會組成</h3>
<p>{{company_name}} 的永續治理架構以董事會為最高治理單位，下設永續發展委員會、審計委員會、薪酬委員會及風險管理委員會。{{report_year}} 年度董事會共 {{board_size}} 位董事，其中獨立董事 {{independent_directors}} 位，佔比 {{independent_director_ratio}}%，超過法規要求的 {{regulatory_ratio}}%。</p>
<p>董事會於 {{report_year}} 年共召開 {{board_meeting_count}} 次會議，平均出席率達 {{board_attendance_rate}}%。董事成員具備 {{board_competencies}} 等多元專業背景，包括財務、法律、科技、永續管理等領域。其中 {{female_director_count}} 位女性董事，佔比 {{female_director_ratio}}%，落實性別平等的治理承諾。</p>
<p>董事長與 CEO 職務由不同人擔任，確保治理獨立性。董事會下設 {{committee_count}} 個功能性委員會，各委員會依據職權規範運作，並定期向董事會報告執行情形。{{report_year}} 年董事會通過 {{board_resolution_count}} 項決議案，其中 {{sustainability_resolutions}} 項與永續發展相關。</p>`,
  kpiIndicators: ['董事會人數', '獨立董事比率', '董事會出席率', '女性董事比率', '委員會數'],
  chartTemplate: {
    type: 'pie',
    data: { '獨立董事': 5, '非獨立董事': 4, '女性董事': 3 }
  }
};

const _C02_P02: ExpertParagraph = {
  id: 'ch02-p02',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-10',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'nomination_process', 'board_diversity_policy', 'selection_criteria'],
  content: `<h3>董事提名與選任程序</h3>
<p>本公司董事選任採用 {{nomination_process}}，由董事會依據「董事提名與選任辦法」辦理提名、審查及選任程序。{{report_year}} 年度董事會提名 {{nominated_directors}} 位新任董事，經股東會投票選任通過。</p>
<p>董事提名考量因素包括：{{selection_criteria}}。董事會已訂定「董事會多元化政策」（{{board_diversity_policy}}），明確規範性別、年齡、專業背景、產業經驗等多元化目標。{{report_year}} 年董事會成員年齡分布為 {{age_distribution}}。</p>
<p>為確保董事獨立性，獨立董事選任須符合 {{independence_criteria}}，包括：未在公司或關係企業擔任執行職務、未持有公司已發行股份總額一定比例以上、未與公司或董事有特定親屬或業務關係等。{{report_year}} 年所有獨立董事均通過獨立性評估。</p>`,
  kpiIndicators: ['新任董事人數', '多元化指標達成率', '獨立性評估通過率'],
  chartTemplate: {
    type: 'bar',
    data: { '年齡40-50': 2, '年齡51-60': 4, '年齡61-70': 2, '年齡70+': 1 }
  }
};

const _C02_P03: ExpertParagraph = {
  id: 'ch02-p03',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-11',
  fiveTGate: 'trustworthy',
  placeholders: ['company_name', 'report_year', 'conflict_policy', 'related_party_transactions', 'recusal_count'],
  content: `<h3>利益衝突管理與獨立性</h3>
<p>{{company_name}} 訂定「董事利益衝突管理辦法」（{{conflict_policy}}），規範董事應避免涉及個人利益與公司利益衝突的情事。{{report_year}} 年度董事會進行 {{recusal_count}} 次利益迴避，主要涉及 {{recusal_topics}} 等議案。</p>
<p>關係人交易均經審計委員會事前審核，{{report_year}} 年共 {{related_party_transactions}} 筆關係人交易，交易金額合計 NT\${{rpt_amount}} 億元，佔集團合併營收 {{rpt_ratio}}%。所有關係人交易均依「關係人交易管理辦法」辦理，並充分揭露於財務報告附註。</p>
<p>董事每年須簽署獨立性聲明書，確認其符合公司及法規的獨立性要求。{{report_year}} 年全體董事均完成簽署，並通過董事會委任的外部專家獨立性評估。對於董事持有的競業禁止、保密及忠實義務，公司亦透過定期訓練與告知強化遵循。</p>`,
  kpiIndicators: ['利益迴避次數', '關係人交易筆數', '獨立性聲明簽署率'],
  chartTemplate: {
    type: 'bar',
    data: { '利益迴避': 5, '關係人交易': 12, '獨立性聲明': 100 }
  }
};

const _C02_P04: ExpertParagraph = {
  id: 'ch02-p04',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-12',
  fiveTGate: 'tangible',
  placeholders: ['company_name', 'report_year', 'sustainability_oversight', 'esg_committee_role', 'board_esg_training_hours'],
  content: `<h3>董事會永續發展監督職責</h3>
<p>董事會為 {{company_name}} 永續發展的最高監督單位，透過 {{sustainability_oversight}} 機制確保永續策略的有效執行。{{report_year}} 年永續發展委員會（{{esg_committee_role}}）共召開 {{esg_committee_meetings}} 次會議，審議議題包括：{{esg_topics}}。</p>
<p>董事會成員每年須接受永續發展相關訓練，{{report_year}} 年每人平均訓練時數達 {{board_esg_training_hours}} 小時，訓練主題涵蓋 {{board_training_topics}}。{{report_year}} 年董事會永續訓練涵蓋率達 {{board_training_coverage}}%。</p>
<p>董事會每年執行永續績效與目標達成情形之檢視，包括：溫室氣體減量進度、能源效率提升目標、員工留任率、客戶滿意度、供應商永續評核通過率等。{{report_year}} 年 {{sustainability_target_count}} 項永續目標中，達成率達 {{target_achievement_rate}}%。</p>`,
  kpiIndicators: ['永續委員會會議次數', '董事會訓練時數', '訓練涵蓋率', '目標達成率'],
  chartTemplate: {
    type: 'line',
    data: { '2021': 72, '2022': 78, '2023': 82, '2024': 85, '2025': 88 }
  }
};

const _C02_P05: ExpertParagraph = {
  id: 'ch02-p05',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-13',
  fiveTGate: 'trackable',
  placeholders: ['company_name', 'report_year', 'sustainability_responsibility', 'management_esg_kpi', 'esg_compensation_ratio'],
  content: `<h3>永續發展管理權責與績效連結</h3>
<p>{{company_name}} 明確將永續發展納入管理階層的職責與績效考核。{{sustainability_responsibility}} 永續長（CSO）或指定高階主管負責永續策略之規劃與執行，並定期向董事會報告。{{report_year}} 年管理階層 KPI 中，ESG 相關指標佔比達 {{esg_compensation_ratio}}%。</p>
<p>各事業群設有 {{esg_business_unit_count}} 位永續聯絡人，負責推動各單位的永續專案。{{report_year}} 年各單位執行 {{esg_project_count}} 項永續專案，投入經費 NT\${{esg_project_budget}} 萬元。</p>
<p>高階主管的薪酬與永續績效連結，透過 {{esg_compensation_ratio}}% 的績效獎金與 ESG 指標掛鉤。{{report_year}} 年永續績效評核結果：{{esg_performance_rating}}。集團並設有「永續創新獎」，鼓勵各單位提出創新永續方案，{{report_year}} 年共收到 {{esg_innovation_submissions}} 件提案。</p>`,
  kpiIndicators: ['ESG 績效佔比', '永續專案數', '專案預算', '創新提案數'],
  chartTemplate: {
    type: 'radar',
    data: { '治理': 8, '環境': 7, '社會': 7, '經濟': 6, '科技': 7 }
  }
};

const _C02_P06: ExpertParagraph = {
  id: 'ch02-p06',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-14',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'board_self_evaluation', 'evaluation_result', 'improvement_actions'],
  content: `<h3>董事會自我評估與效能提升</h3>
<p>{{report_year}} 年度，{{company_name}} 董事會依據「董事會自我評估辦法」進行年度自我評估（{{board_self_evaluation}}）。評估範圍包括：董事會運作效能、董事專業能力、決策品質、風險監督、永續治理等構面。</p>
<p>評估結果顯示：{{evaluation_result}}。整體董事會效能評分為 {{board_score}} 分（滿分 5 分），較前一年度 {{board_score_change}}。為持續提升董事會效能，已規劃 {{improvement_actions}} 等改善行動。</p>
<p>每三年委任外部專業機構進行董事會效能評估，最近一次為 {{external_evaluation_year}} 年。{{report_year}} 年 {{external_evaluation_status}}。評估建議包括：增加永續治理相關董事席次、強化董事資訊即時性、提升委員會運作效率等，均已納入改善計畫。</p>`,
  kpiIndicators: ['董事會效能評分', '評估構面數', '改善行動數', '外部評估週期'],
  chartTemplate: {
    type: 'bar',
    data: { '治理': 4.2, '策略': 4.0, '風險': 3.8, '永續': 3.9, '效能': 4.1 }
  }
};

const _C02_P07: ExpertParagraph = {
  id: 'ch02-p07',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-15',
  fiveTGate: 'trustworthy',
  placeholders: ['company_name', 'report_year', 'risk_oversight_structure', 'risk_committee_meetings', 'key_risks_identified'],
  content: `<h3>風險監督與治理機制</h3>
<p>董事會透過 {{risk_oversight_structure}} 風險管理委員會，監督集團整體風險管理架構之有效性。{{report_year}} 年風險管理委員會共召開 {{risk_committee_meetings}} 次會議，審議 {{key_risks_identified}} 項關鍵風險。</p>
<p>關鍵風險類別包括：{{risk_categories}}。董事會每年執行風險胃納量（Risk Appetite）檢視，確保集團承擔的風險在可接受範圍內。{{report_year}} 年風險胃納量聲明經董事會審議通過，設定限額包括：{{risk_limits}}。</p>
<p>集團採用 Enterprise Risk Management（ERM）框架，整合策略風險、營運風險、財務風險及合規風險之管理。{{report_year}} 年透過風險評估識別 {{material_risks}} 項重大風險，並制定風險減緩計畫。內部稽核制度確保風險控制之有效性，{{report_year}} 年執行 {{audit_count}} 項稽核計畫。</p>`,
  kpiIndicators: ['風險委員會會議次數', '關鍵風險數', '重大風險數', '稽核計畫數'],
  chartTemplate: {
    type: 'heatmap',
    data: { '策略風險': 8, '營運風險': 6, '財務風險': 5, '合規風險': 7, '資安風險': 9 }
  }
};

const _C02_P08: ExpertParagraph = {
  id: 'ch02-p08',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-16',
  fiveTGate: 'tangible',
  placeholders: ['company_name', 'report_year', 'critical_concerns', 'board_notification_process', 'escalation_mechanism'],
  content: `<h3>關鍵關注事項與回報機制</h3>
<p>董事會建立 {{escalation_mechanism}} 關鍵事項回報機制，確保重大永續相關事項得以及時呈報與處理。{{report_year}} 年共有 {{critical_concerns}} 項關鍵事項向董事會報告，主題涵蓋 {{critical_topics}}。</p>
<p>回報機制包含 {{board_notification_process}}，設定不同層級事項的通報時限與處理流程。重大事項（如重大工安事件、環境違規、客戶資料外洩等）須於 {{escalation_hours}} 小時內通報董事會。{{report_year}} 年所有關鍵事項均依時限完成通報。</p>
<p>董事會透過定期聽取管理階層報告、審閱永續績效儀表板、實地訪視營運據點等方式，掌握集團永續發展的重要議題。{{report_year}} 年董事會成員執行 {{board_site_visits}} 次營運據點訪視，深入了解第一線執行情形。</p>`,
  kpiIndicators: ['關鍵事項數', '通報時限達成率', '董事會訪視次數'],
  chartTemplate: {
    type: 'bar',
    data: { '工安事件': 3, '環境合規': 2, '客戶隱私': 1, '供應鏈': 2, '其他': 1 }
  }
};

const _C02_P09: ExpertParagraph = {
  id: 'ch02-p09',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-17',
  fiveTGate: 'trackable',
  placeholders: ['company_name', 'report_year', 'board_awareness_program', 'director_training_topics', 'collective_awareness_score'],
  content: `<h3>董事會永續意識與集體認知</h3>
<p>{{company_name}} 透過 {{board_awareness_program}} 持續提升董事會成員的永續意識與專業認知。{{report_year}} 年董事會永續訓練主題包括：{{director_training_topics}}。</p>
<p>訓練方式包括：內部專家講座、外部講師專題演講、標竿企業參訪、案例研讨及線上課程等。{{report_year}} 年董事會每人平均永續訓練時數達 {{avg_sustainability_training_hours}} 小時，較法規要求 {{regulatory_training_hours}} 小時高出 {{training_excess_ratio}}%。</p>
<p>為評估董事會對永續議題的認知程度，{{report_year}} 年執行 {{collective_awareness_score}} 董事會永續認知評量，結果顯示董事會對氣候風險、人權議題、生物多樣性等重大永續議題的認知度達 {{awareness_score}} 分（滿分 100），顯示董事會已具備充分的永續治理能量。</p>`,
  kpiIndicators: ['平均訓練時數', '認知評量分數', '訓練主題數'],
  chartTemplate: {
    type: 'line',
    data: { '2021': 72, '2022': 78, '2023': 82, '2024': 86, '2025': 91 }
  }
};

const _C02_P10: ExpertParagraph = {
  id: 'ch02-p10',
  chapter: 2,
  section: '永續治理架構',
  griCode: 'GRI 2-18~2-21',
  fiveTGate: 'transparent',
  placeholders: ['company_name', 'report_year', 'committee_evaluation', 'compensation_committee_work', 'nomination_committee_work', 'audit_committee_work'],
  content: `<h3>功能性委員會運作與薪酬治理</h3>
<p>{{report_year}} 年度，{{company_name}} 各功能性委員會有效運作，發揮預期的治理功能。{{committee_evaluation}} 各委員會運作評估結果均為「有效」以上。</p>
<p>薪酬委員會（{{compensation_committee_work}}）於 {{report_year}} 年召開 {{compensation_meetings}} 次會議，審議高階主管薪酬政策、績效評核與薪酬分配。{{report_year}} 年高階主管薪酬與 ESG 績效連結比率達 {{esg_pay_ratio}}%。</p>
<p>提名委員會（{{nomination_committee_work}}）於 {{report_year}} 年審議 {{nomination_items}} 項提名議案，包括董事改選、高階主管任命等。審計委員會（{{audit_committee_work}}）審議 {{audit_items}} 項稽核事項，確保內控制度有效運作。</p>`,
  kpiIndicators: ['委員會會議次數', 'ESG 薪酬連結比', '審議議案數', '運作評估等級'],
  chartTemplate: {
    type: 'pie',
    data: { '審計委員會': 4, '薪酬委員會': 3, '提名委員會': 3, '永續委員會': 5 }
  }
};
