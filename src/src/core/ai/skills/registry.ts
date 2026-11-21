// ═══════════════════════════════════════════════════════════════
// ESGGO Skill Registry
// 自動註冊所有 ESG 技能 + MECE 最佳實踐
// ═══════════════════════════════════════════════════════════════

// 導入所有技能（會自動觸發 registerSkill）
import './carbon-calculation';
import './tcfd-analysis';
import './sdg-mapping';
import './compliance-review';
import './gri-report-draft';
import './materiality-matrix';
import './stakeholder-analysis';
import './email-archival';
import './evidence-ocr';
import './report-assembly';
import './junaikey-sovereign';

// 重新匯出基底類別和註冊函數
export {
  ESGSkill,
  registerSkill,
  getSkill,
  getAllSkills,
} from './index';

export type {
  SkillResult,
  SkillContext,
} from './index';

// 匯出 MECE 最佳實踐框架
export {
  getAllPractices,
  getPracticesByPillar,
  getPracticesByCategory,
  getPracticesByLevel,
  getPracticeById,
  calculateOverallScore,
  validateMECECompleteness,
  validateMECEExclusivity,
} from './best-practices';

export type {
  BestPractice,
  PracticeAssessment,
  ESGPillar,
  PracticeLevel,
  PracticeStatus,
} from './best-practices';
