/**
 * UNVERIFIED 子框架註冊表 — 待補真實 repo URL 即升級為 VERIFIED
 *
 * 前輪實測: 用戶貼的下列 repo 無法核實 (404 / 逾時 / 額度耗盡),
 * 故以 scaffold + graceful 降級先行整合, 標 UNVERIFIED。
 * 一經用戶提供真實 URL, 即將 status 改 VERIFIED 並升級對應 adapter 的
 * dispatch() 為真實 CLI/API 呼叫 (對齊 AgentReach 模式)。
 *
 * 誠實原則: 本表不假造 repo 存在性, 只記錄「待核實」狀態。
 */
export interface UnverifiedEntry {
  subFrame: 'openmontage' | 'omniroute' | 'turbovec';
  label: string;
  userProvidedRepo: string;   // 用戶貼出的原始連結
  verifyStatus: 'UNVERIFIED' | 'VERIFIED';
  realRepoUrl?: string;        // 用戶補充的真實 URL (填入即升級)
  verifyMethod: string;        // 前輪核實方式與結果
  note: string;
}

export const UNVERIFIED_REGISTRY: UnverifiedEntry[] = [
  {
    subFrame: 'openmontage',
    label: 'OpenMontage 本地 AI 影片生產',
    userProvidedRepo: 'github.com/RayCodes/RayCodes_OpenMontage',
    verifyStatus: 'UNVERIFIED',
    verifyMethod: 'browser_navigate 實測 → 404 Page not found',
    note: 'repo 不存在/已改名/私密。scaffold 已建 (ollama gemma4 → ffmpeg → hyperframes)。待真實 URL。',
  },
  {
    subFrame: 'omniroute',
    label: 'OmniRoute 統一 AI 閘道',
    userProvidedRepo: 'github.com/diegosouzapw/OmniRoute',
    verifyStatus: 'UNVERIFIED',
    verifyMethod: 'browser 逾時 + web_extract 額度耗盡 (Payment Required), 本輪無法核實',
    note: 'OpenAI-compatible /v1 gateway (localhost:20128)。scaffold 已建。待真實 URL 或確認。',
  },
  {
    subFrame: 'turbovec',
    label: 'TurboVec/PotatoRAG 本地 4-bit RAG',
    userProvidedRepo: 'github.com/google/turbovec',
    verifyStatus: 'UNVERIFIED',
    verifyMethod: 'browser_navigate 實測 → 404 (Google 未公開此 repo)',
    note: 'TurboQuant 為 Google 內部演算法。本地 RAG 檢索層 scaffold 已建。待真實 URL。',
  },
];

/** 升級某子框架為 VERIFIED (用戶補充真實 URL 時呼叫) */
export function upgradeToVerified(subFrame: UnverifiedEntry['subFrame'], realRepoUrl: string): void {
  const e = UNVERIFIED_REGISTRY.find((x) => x.subFrame === subFrame);
  if (!e) return;
  e.verifyStatus = 'VERIFIED';
  e.realRepoUrl = realRepoUrl;
  e.note = `VERIFIED @ ${realRepoUrl} — 可升級 adapter dispatch() 為真實呼叫`;
}

export function pendingUnverified(): UnverifiedEntry[] {
  return UNVERIFIED_REGISTRY.filter((e) => e.verifyStatus === 'UNVERIFIED');
}
