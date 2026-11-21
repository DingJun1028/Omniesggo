// ═══════════════════════════════════════════════════════════════
// ESGGO Skill Base Class
// 所有 ESG 技能的基底類別
// ═══════════════════════════════════════════════════════════════

export interface SkillResult {
  success: boolean;
  content: string;
  metadata: {
    skillId: string;
    taskType: string;
    model: string;
    provider: string;
    tokens: number;
    duration: number;
  };
}

export interface SkillContext {
  company?: string;
  year?: string;
  language?: 'zh-TW' | 'en';
  data?: Record<string, unknown>;
}

export abstract class ESGSkill {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly nameEn: string;
  abstract readonly description: string;
  abstract readonly taskType: string;

  /**
   * 生成系統提示詞
   */
  abstract systemPrompt(ctx: SkillContext): string;

  /**
   * 生成用戶提示詞
   */
  abstract userPrompt(ctx: SkillContext): string;

  /**
   * 驗證輸入數據
   */
  validate(_ctx: SkillContext): boolean {
    return true;
  }

  /**
   * 後處理 AI 回應
   */
  postProcess(response: string, _ctx: SkillContext): string {
    return response;
  }

  /**
   * 獲取技能資訊
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      description: this.description,
      taskType: this.taskType,
    };
  }
}

// ── 技能註冊表 ────────────────────────────────────────────────
const skillRegistry = new Map<string, ESGSkill>();

export function registerSkill(skill: ESGSkill): void {
  skillRegistry.set(skill.id, skill);
}

export function getSkill(taskType: string): ESGSkill | undefined {
  const skills = Array.from(skillRegistry.values());
  return skills.find(skill => skill.taskType === taskType);
}

export function getAllSkills(): ESGSkill[] {
  return Array.from(skillRegistry.values());
}
