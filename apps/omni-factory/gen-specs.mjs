#!/usr/bin/env node
// 一次生成所有 24 個缺失的模組 spec
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SPECS_DIR = './apps/omni-factory/specs';

const MODULES = [
  {
    id: 'MOD-DASHBOARD', medce: 'M', title: '控制台 Dashboard',
    functions: 'aggregateKpi, getAgentStatus, sealContent',
    components: 'BrandKpiCard, StandardPage, BrandT5Strip, HermesFloatingAgent',
    theme: 'solid-card-highlight', runes: 'R-MEDCE, R-5T, R-STATE',
    kpis: [
      ['GRI 覆蓋率', '85', '%'],
      ['5T 合規率', '96.5', '%'],
      ['模組完成率', '17', '/ 29'],
      ['系統健康度', '99.9', '%'],
    ],
    vault: [
      ['GRI 覆蓋率', 'GRI 通用標準 2021', '85%'],
      ['5T 合規率', '5T 協議', '96.5%'],
    ],
    sections: ['KPI 儀表板', 'GRI 覆蓋率矩陣', '5T 活動日誌', '功能導覽'],
  },
  {
    id: 'MOD-DTWIN', medce: 'M', title: '數位分身 Digital Twin',
    functions: 'createOmniAgent, executeAssembly, sealContent',
    components: 'StandardPage, HermesFloatingAgent, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-AGENT, R-5T',
    kpis: [
      ['知識資產量化', '1250', '項'],
      ['道德 DNA 參數', '42', '維度'],
      ['代理對話次數', '3580', '次'],
      ['分身同步率', '99.5', '%'],
    ],
    vault: [
      ['知識圖譜', '內部提報', '1,250 節點'],
      ['道德 DNA', '企業準則', '42 維度'],
    ],
    sections: ['知識資產圖譜', '道德 DNA 參數', '代理對話', '分身同步'],
  },
  {
    id: 'MOD-INTEL', medce: 'M', title: '商情中心 Intelligence',
    functions: 'aggregateKpi, validateTruth, sealContent',
    components: 'BrandSearchBar, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['法規追蹤數', '156', '項'],
      ['競品情報數', '89', '筆'],
      ['關鍵字訂閱', '42', '組'],
      ['週報覆蓋率', '100', '%'],
    ],
    vault: [
      ['法規追蹤', '政府公告', '156 項'],
      ['競品情報', '新聞/報告', '89 筆'],
    ],
    sections: ['法規動態', '競品情報', '關鍵字訂閱', '週報產出'],
  },
  {
    id: 'MOD-HEALTH', medce: 'E', title: '企業健檢 Health Check',
    functions: 'scoreMaturity, recordDecision, sealContent',
    components: 'BrandKpiCard, BrandT5Strip, StandardPage',
    theme: 'solid-card-highlight', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['成熟度總分', '72.5', '/ 100'],
      ['缺口改善率', '68', '%'],
      ['改善完成數', '23', '/ 34'],
      ['下次健檢', '90', '天後'],
    ],
    vault: [
      ['成熟度評估', 'GRI/SASB', '72.5 分'],
      ['缺口清單', '健檢報告', '34 項'],
    ],
    sections: ['成熟度雷達', '缺口清單', '改善建議', '行動追蹤'],
  },
  {
    id: 'MOD-STAKE', medce: 'M', title: '利害關係人 Stakeholders',
    functions: 'aggregateKpi, pairTags, sealContent',
    components: 'BrandKpiCard, StandardPage, BrandSearchBar',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['利害關係人類別', '8', '類'],
      ['溝通次數', '156', '次'],
      ['關注度回應率', '92', '%'],
      ['滿意度', '4.2', '/ 5.0'],
    ],
    vault: [
      ['關係人地圖', '內部調查', '8 類'],
      ['溝通紀錄', 'CRM', '156 次'],
    ],
    sections: ['關係人地圖', '關注度矩陣', '溝通紀錄', '滿意度分析'],
  },
  {
    id: 'MOD-FIN', medce: 'M', title: '永續財務 Finance',
    functions: 'aggregateKpi, computeMateriality, sealContent',
    components: 'BrandKpiCard, StandardPage, BrandT5Strip',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['氣候風險財務影響', '25000000', '元'],
      ['綠色資產比例', '35.8', '%'],
      ['TCFD 對齊率', '88', '%'],
      ['ESG 投資報酬率', '12.5', '%'],
    ],
    vault: [
      ['氣候風險', 'TCFD 框架', '2,500 萬元'],
      ['綠色資產', '內部會計', '35.8%'],
    ],
    sections: ['氣候風險財務影響', '綠色資產', 'TCFD 對齊', 'ESG 投資分析'],
  },
  {
    id: 'MOD-SUPPLY', medce: 'E', title: '供應鏈透明 Supply Chain',
    functions: 'aggregateKpi, validateTruth, sealContent',
    components: 'VaultOmniTable, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['供應商總數', '385', '家'],
      ['高風險供應商', '12', '家'],
      ['稽核覆蓋率', '78.5', '%'],
      ['糾偏完成率', '92', '%'],
    ],
    vault: [
      ['供應商評分', '內部稽核', '385 家'],
      ['風險熱力圖', 'ESG 評估', '12 高風險'],
    ],
    sections: ['供應商評分', '風險熱力圖', '糾偏追蹤', '供應鏈地圖'],
  },
  {
    id: 'MOD-LIB', medce: 'E', title: '永續智庫 Library',
    functions: 'aggregateKpi, pairTags, sealContent',
    components: 'BrandSearchBar, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['基準案例數', '2580', '筆'],
      ['最佳實務範本', '156', '件'],
      ['月搜尋次數', '4200', '次'],
      ['知識複用率', '68', '%'],
    ],
    vault: [
      ['基準庫', 'GRI/ISSB', '2,580 筆'],
      ['案例卡', '產業報告', '156 件'],
    ],
    sections: ['基準庫', '案例卡', '搜尋', '知識圖譜'],
  },
  {
    id: 'MOD-ADV', medce: 'A', title: '專家諮詢 Advisory',
    functions: 'createOmniAgent, getAgentStatus, sealContent',
    components: 'BrandAvatar, HermesFloatingAgent, StandardPage',
    theme: 'solid-card-default', runes: 'R-AGENT, R-5T',
    kpis: [
      ['SPIRIT 人格', '3', '模式'],
      ['諮詢次數', '856', '次'],
      ['建議採納率', '78', '%'],
      ['滿意度', '4.6', '/ 5.0'],
    ],
    vault: [
      ['人格切換', 'AI 代理', '3 模式'],
      ['建議輸出', '諮詢記錄', '856 次'],
    ],
    sections: ['人格切換', '對話介面', '建議輸出', '諮詢紀錄'],
  },
  {
    id: 'MOD-SW', medce: 'D', title: 'SustainWrite 永續撰寫',
    functions: 'executeAssembly, validateTruth, sealContent',
    components: 'StandardPage, BrandT5Strip, BrandButton',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T, R-SEAL',
    kpis: [
      ['撰寫中字數', '125000', '字'],
      ['GRI 對齊率', '92', '%'],
      ['AI 合規掃描', '100', '%'],
      ['章節完成率', '22', '/ 28'],
    ],
    vault: [
      ['GRI 對齊', 'GRI 標準', '92%'],
      ['5T 掃描', '5T 協議', '100%'],
    ],
    sections: ['章節編輯器', 'GRI 對齊提示', '5T 掃描條', 'AI 合規建議'],
  },
  {
    id: 'MOD-PUB', medce: 'D', title: '報告發佈 Publish',
    functions: 'assembleReport, executeAssembly, sealContent',
    components: 'StandardPage, BrandButton, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['已發佈報告', '15', '份'],
      ['版本數', '42', '版'],
      ['下載次數', '3580', '次'],
      ['分享次數', '856', '次'],
    ],
    vault: [
      ['報告版本', 'Publish 系統', '42 版'],
      ['下載紀錄', 'Analytics', '3,580 次'],
    ],
    sections: ['格式選擇', '版本樹', '發佈閘門', '下載分析'],
  },
  {
    id: 'MOD-READ', medce: 'D', title: '永續閱覽室 Reading Room',
    functions: 'verifySeal, validateTrust, sealContent',
    components: 'StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-SEAL',
    kpis: [
      ['公開報告數', '12', '份'],
      ['月瀏覽量', '8500', '次'],
      ['驗證次數', '2350', '次'],
      ['讀者滿意度', '4.5', '/ 5.0'],
    ],
    vault: [
      ['公開報告', 'PDF/HTML', '12 份'],
      ['驗證鏈接', 'VerifyLink™', '2,350 次'],
    ],
    sections: ['公開報告', '驗證鏈接', '讀者回饋', '瀏覽分析'],
  },
  {
    id: 'MOD-VERIFY', medce: 'C', title: 'VerifyLink™',
    functions: 'verifySeal, validateTrust, sealContent',
    components: 'VaultOmniTable, BrandBadge, StandardPage',
    theme: 'solid-card-highlight', runes: 'R-MEDCE, R-5T, R-SEAL',
    kpis: [
      ['驗證請求數', '580', '次'],
      ['驗證通過率', '100', '%'],
      ['第三方存取', '1250', '次'],
      ['信任分數', '98.5', '/ 100'],
    ],
    vault: [
      ['驗證請求', 'API/網頁', '580 次'],
      ['信任分數', '5T 協議', '98.5 分'],
    ],
    sections: ['驗證請求', '公開鏈接', '狀態追蹤', '信任分數'],
  },
  {
    id: 'MOD-VAULT', medce: 'C', title: '證據金庫 Vault',
    functions: 'sealContent, verifySeal, validateTrust',
    components: 'VaultOmniTable, BrandT5Strip, StandardPage',
    theme: 'solid-card-highlight', runes: 'R-MEDCE, R-5T, R-SEAL',
    kpis: [
      ['封存證據數', '2580', '筆'],
      ['雜湊驗證率', '100', '%'],
      ['ZKP 封印數', '156', '筆'],
      ['文件完整度', '99.8', '%'],
    ],
    vault: [
      ['聖碑表', 'SHA-256', '2,580 筆'],
      ['ZKP 封印', '零知識證明', '156 筆'],
    ],
    sections: ['聖碑表', '封印憑證', 'ZKP 標識', '文件管理'],
  },
  {
    id: 'MOD-AUDIT', medce: 'C', title: '審計日誌 Audit Log',
    functions: 'recordDecision, validateTrackable, sealContent',
    components: 'VaultOmniTable, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['操作紀錄數', '125000', '筆'],
      ['不可篡改率', '100', '%'],
      ['hash 錨定數', '125000', '次'],
      ['稽核就緒率', '100', '%'],
    ],
    vault: [
      ['操作軌跡', '系統日誌', '125,000 筆'],
      ['hash 錨定', 'SHA-256', '125,000 次'],
    ],
    sections: ['操作軌跡', 'hash 錨定', '稽核報表', '合規宣告'],
  },
  {
    id: 'MOD-TMPL', medce: 'C', title: '專家模板 Templates',
    functions: 'createOmniTag, validateGoodness, sealContent',
    components: 'BrandBadge, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['標準模板數', '45', '件'],
      ['合規預檢通過率', '95', '%'],
      ['模板使用率', '78', '%'],
      ['用戶滿意度', '4.4', '/ 5.0'],
    ],
    vault: [
      ['標準模板', 'GRI/ISSB/TCFD', '45 件'],
      ['合規預檢', '5T 協議', '95%'],
    ],
    sections: ['標準模板庫', '合規預檢', '模板客製', '使用統計'],
  },
  {
    id: 'MOD-TEST', medce: 'C', title: '系統測試 System Test',
    functions: 'validateTruth, validateTrust, sealContent',
    components: 'StandardPage, BrandT5Strip, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['自動化測試數', '285', '個'],
      ['通過率', '99.2', '%'],
      ['健康檢查分', '98.5', '/ 100'],
      ['效能基準', '100', '%'],
    ],
    vault: [
      ['測試報表', 'CI/CD', '285 個'],
      ['健康分', '5T 協議', '98.5 分'],
    ],
    sections: ['測試報表', '健康分', '效能基準', '持續整合'],
  },
  {
    id: 'MOD-API', medce: 'C', title: '整合中心 API Setup',
    functions: 'validateTruth, sealContent',
    components: 'StandardPage, BrandButton, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-5T',
    kpis: [
      ['API 金鑰數', '25', '組'],
      ['Webhook 數', '12', '個'],
      ['連線成功率', '99.9', '%'],
      ['回應時間', '< 200', 'ms'],
    ],
    vault: [
      ['金鑰管理', 'API Gateway', '25 組'],
      ['Webhook', '事件驅動', '12 個'],
    ],
    sections: ['金鑰管理', 'Webhook', '連線狀態', 'API 文件'],
  },
  {
    id: 'MOD-ACADEMY', medce: 'A', title: '永續學院 Academy',
    functions: 'aggregateKpi, sealContent',
    components: 'StandardPage, BrandKpiCard, BrandButton',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['課程數', '35', '門'],
      ['學員數', '1250', '人'],
      ['完課率', '85', '%'],
      ['證書核發數', '856', '張'],
    ],
    vault: [
      ['課程目錄', 'LMS', '35 門'],
      ['學員進度', 'LMS', '1,250 人'],
    ],
    sections: ['課程目錄', '進度追蹤', '證書管理', '師資陣容'],
  },
  {
    id: 'MOD-ADVISORS', medce: 'A', title: '顧問專區 Advisors',
    functions: 'createOmniAgent, sealContent',
    components: 'BrandAvatar, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-AGENT, R-5T',
    kpis: [
      ['認證顧問數', '58', '位'],
      ['專案匹配數', '125', '件'],
      ['知識共享數', '358', '篇'],
      ['顧問滿意度', '4.7', '/ 5.0'],
    ],
    vault: [
      ['顧問認證', '內部審核', '58 位'],
      ['專案匹配', 'CRM', '125 件'],
    ],
    sections: ['顧問卡', '認證狀態', '匹配機制', '知識共享'],
  },
  {
    id: 'MOD-AGENTS', medce: 'A', title: '代理專區 Agents',
    functions: 'createOmniAgent, getAgentStatus, executeAssembly',
    components: 'HermesFloatingAgent, StandardPage, BrandKpiCard',
    theme: 'solid-card-highlight', runes: 'R-AGENT, R-5T',
    kpis: [
      ['活躍代理數', '8', '個'],
      ['工作流數', '25', '條'],
      ['任務完成率', '96.5', '%'],
      ['協作效率', '88', '%'],
    ],
    vault: [
      ['代理清單', 'Agent Bus', '8 個'],
      ['工作流', 'OAB', '25 條'],
    ],
    sections: ['代理清單', '工作流編排', '狀態監控', '協作分析'],
  },
  {
    id: 'MOD-CONSULT', medce: 'A', title: '顧問服務 Consulting',
    functions: 'createOmniAgent, sealContent',
    components: 'BrandAvatar, StandardPage, BrandKpiCard',
    theme: 'solid-card-default', runes: 'R-AGENT, R-STATE',
    kpis: [
      ['專案數', '35', '件'],
      ['交付物數', '156', '項'],
      ['客戶滿意度', '4.6', '/ 5.0'],
      ['準時交付率', '92', '%'],
    ],
    vault: [
      ['專案看板', 'Consulting', '35 件'],
      ['交付物', '專案管理', '156 項'],
    ],
    sections: ['專案看板', '交付物管理', '客戶回饋', '服務報告'],
  },
  {
    id: 'MOD-AIPLAT', medce: 'A', title: 'AI 整合平台 AI Platform',
    functions: 'createOmniAgent, executeAssembly, sealContent',
    components: 'HermesFloatingAgent, StandardPage, BrandKpiCard',
    theme: 'solid-card-highlight', runes: 'R-AGENT, R-5T',
    kpis: [
      ['模型數', '12', '個'],
      ['提示庫數', '258', '條'],
      ['RAG 知識庫', '45', '個'],
      ['推論延遲', '< 500', 'ms'],
    ],
    vault: [
      ['模型路由', 'AI Gateway', '12 個'],
      ['提示庫', '提示工程', '258 條'],
    ],
    sections: ['模型路由', '提示庫', 'RAG 配置', '推論監控'],
  },
  {
    id: 'MOD-TASKS', medce: 'A', title: '任務中心 Tasks',
    functions: 'recordDecision, sealContent',
    components: 'StandardPage, BrandKpiCard, BrandButton',
    theme: 'solid-card-default', runes: 'R-MEDCE, R-STATE',
    kpis: [
      ['待辦任務數', '45', '件'],
      ['已完成數', '235', '件'],
      ['協作流程數', '18', '條'],
      ['按時完成率', '88', '%'],
    ],
    vault: [
      ['任務看板', 'Task Center', '45 待辦'],
      ['協作流', 'OA-Team', '18 條'],
    ],
    sections: ['任務看板', '進度追蹤', '協作流程', '通知中心'],
  },
];

function frontmatter(mod) {
  return `---
id: ${mod.id}
title: ${mod.title}
medce: ${mod.medce}
functions: ${mod.functions}
components: ${mod.components}
theme: ${mod.theme}
runes: ${mod.runes}
---`;
}

function kpiSection(kpis) {
  return '## KPI 指標\n' + kpis.map(([n, v, u]) => `- ${n}: ${v} ${u}`).join('\n');
}

function t5Section() {
  return `## 5T 品質狀態
- 溯源 Traceable: ✓ 已建立來源標記
- 透明 Transparent: ✓ 即時公開
- 可量化 Tangible: ✓ 統計數據
- 信任 Trustworthy: ✓ 第三方驗證
- 可追蹤 Trackable: ✓ 定期更新`;
}

function vaultSection(vaults) {
  if (!vaults.length) return '';
  return '## 證據金庫\n' + vaults.map(([n, s, v]) => `- ${n} | ${s} | ${v}`).join('\n');
}

function sectionsSection(sections) {
  return '## 章節\n' + sections.map(s => `- ${s}`).join('\n');
}

mkdirSync(SPECS_DIR, { recursive: true });

for (const mod of MODULES) {
  const content = [
    frontmatter(mod),
    '',
    `# ${mod.title}`,
    '',
    kpiSection(mod.kpis),
    '',
    t5Section(),
    '',
    vaultSection(mod.vault),
    '',
    sectionsSection(mod.sections),
    '',
  ].join('\n');
  writeFileSync(join(SPECS_DIR, `${mod.id.toLowerCase().replace('mod-', '')}.md`), content, 'utf8');
}

console.log(`✓ 已生成 ${MODULES.length} 個模組 spec 至 ${SPECS_DIR}/`);
