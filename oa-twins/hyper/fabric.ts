/**
 * 5T-Trackable：跨框架神經網（Multi-Agent Neural Fabric）
 *
 * 宣告稱「LangChain（鏈式推理與記憶）、GenKit（流程管線）、ADK（代理工具包）、
 * CrewAI（角色多工協同）」已協同運作。2026-09-30 實測結果修正如下。
 *
 * 【實測一輪的教訓】最初僅以 `ls node_modules/@google/` 判定，得出
 * 「四者皆未安裝」。該結論**錯誤**：`@google/adk@2.0.0` 確實存在於
 * pnpm store，但它是 `@esggo/oa-framework@0.5.0` 的依賴，而 pnpm 隔離
 * 依賴只把**直接依賴**符號連結到根 `node_modules/`。故：
 *   - 僅看根目錄 → 誤判為未安裝（假陰性）
 *   - 僅看 createRequire.resolve() → 在 tsx 層可解析，但純 Node 解析不到
 *     （假陽性，pnpm 幽靈依賴）
 *
 * 本模組因此以**三態**取代二態，並以 `package.json` 宣告與實際解析兩者
 * 交叉驗證：
 *   ACTIVE   —— package.json 直接宣告，且可解析（可安全依賴）
 *   PHANTOM  —— 可解析但未宣告（幽靈依賴：任一依賴樹變動即可能消失）
 *   MISSING  —— 無法解析（不可用）
 *
 * 【裁定】不為了一段宣告而把四個重型依賴灌進 monorepo：那會改動 lockfile、
 * 觸發全站 CI，且在無呼叫端時只增加攻擊面。改為本能力探測層，使
 * 「跨框架共融」成為任何人執行 `probeFabric()` 即可重現的合約。
 * 若日後真的安裝某框架，探測結果自動翻為 ACTIVE，無需改本檔。
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

export type FabricRole =
  | 'chain-reasoning'
  | 'flow-pipeline'
  | 'agent-toolkit'
  | 'role-orchestration';

export interface FrameworkSpec {
  /** npm 套件名（探測依據） */
  readonly package: string;
  readonly role: FabricRole;
  /** 該框架在本系統中的職責描述（對應宣告的角色定位） */
  readonly duty: string;
}

export const FABRIC_SPECS: readonly FrameworkSpec[] = [
  { package: 'langchain', role: 'chain-reasoning', duty: '鏈式推理與記憶' },
  { package: '@google/genkit', role: 'flow-pipeline', duty: '流程管線' },
  { package: '@google/adk', role: 'agent-toolkit', duty: '代理工具包' },
  { package: 'crewai', role: 'role-orchestration', duty: '角色多工協同' },
] as const;

export type FabricStatus = 'ACTIVE' | 'PHANTOM' | 'MISSING';

export interface FabricProbe {
  readonly package: string;
  readonly role: FabricRole;
  readonly duty: string;
  readonly status: FabricStatus;
  /** 是否由 package.json 直接宣告（false 即為幽靈依賴，不得直接 import） */
  readonly declared: boolean;
  /** 解析到的實體路徑；MISSING 時為 null */
  readonly resolved: string | null;
  /** 人可判讀的原因／風險說明 */
  readonly detail: string;
}

export interface FabricReport {
  readonly probes: readonly FabricProbe[];
  /** 直接宣告且可解析的數量 —— 唯一可安全依賴者 */
  readonly activeCount: number;
  /** 可解析（含幽靈）的數量 */
  readonly loadableCount: number;
  readonly phantomCount: number;
  readonly missingCount: number;
  readonly totalCount: number;
  /** 可載入比例 loadableCount/total；0.0 起步，絕不預設 1.0 */
  readonly sync_ratio: number;
  readonly traceId: string;
}

/**
 * 讀取本專案 package.json 的宣告依賴聯集。
 *
 * 讀不到時回傳空集合 —— 寧可把 ACTIVE 降級為 PHANTOM（保守），
 * 也不要因讀不到檔案就誤報為安全可用。
 */
function readDeclaredDeps(): Set<string> {
  const declared = new Set<string>();
  try {
    // oa-twins/hyper/fabric.ts → ../../package.json
    const url = new URL('../../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(url, 'utf8')) as Record<string, unknown>;
    for (const field of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      const bucket = pkg[field];
      if (bucket && typeof bucket === 'object') {
        for (const name of Object.keys(bucket as Record<string, string>)) declared.add(name);
      }
    }
  } catch {
    // 無 package.json（單獨散佈）→ 空集合，保守降級
  }
  return declared;
}

/**
 * 產生穩定的跨陣列調度錨點。
 *
 * 以「ACTIVE 套件 + 幽靈套件」的有序清單為輸入，故同一環境反覆呼叫得同值
 * （5T-Trackable：可重現的調度錨點）。格式 twin-<fnv32 hex>。
 */
function deriveTraceId(loadedPackages: readonly string[]): string {
  const basis = [...loadedPackages].sort().join('|') || 'none';
  let h = 0x811c9dc5; // FNV-1a 起始值
  for (let i = 0; i < basis.length; i++) {
    h ^= basis.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `twin-${h.toString(16).padStart(8, '0')}`;
}

/**
 * 執行期能力探測。
 *
 * 刻意不用靜態 import —— 靜態 import 會讓未安裝的框架在載入期直接拋錯，
 * 使探測本身無法執行，也就無從「優雅降級」。
 */
export function probeFabric(): FabricReport {
  const req = createRequire(import.meta.url);
  const declared = readDeclaredDeps();

  const probes: FabricProbe[] = FABRIC_SPECS.map((spec) => {
    const isDeclared = declared.has(spec.package);

    let resolved: string | null = null;
    let resolveErr: string | null = null;
    try {
      resolved = req.resolve(spec.package);
    } catch (e) {
      resolveErr = e instanceof Error ? e.message : String(e);
    }

    if (resolved === null) {
      const reason =
        resolveErr?.includes('Cannot find module') || resolveErr?.includes('MODULE_NOT_FOUND')
          ? '未安裝於當前解析路徑'
          : (resolveErr ?? '未知原因');
      return {
        ...spec,
        status: 'MISSING' as const,
        declared: isDeclared,
        resolved: null,
        detail: `不可用：${reason}`,
      };
    }

    if (!isDeclared) {
      return {
        ...spec,
        status: 'PHANTOM' as const,
        declared: false,
        resolved,
        detail:
          '幽靈依賴：可解析但 package.json 未宣告（多為 pnpm 隔離依賴下' +
          '其他套件的傳遞依賴）。禁止直接 import；任一依賴樹升級即可能消失。',
      };
    }

    return {
      ...spec,
      status: 'ACTIVE' as const,
      declared: true,
      resolved,
      detail: '直接宣告且解析成功，可安全依賴',
    };
  });

  const loadable = probes.filter((p) => p.status !== 'MISSING');
  const total = probes.length;

  return {
    probes,
    activeCount: probes.filter((p) => p.status === 'ACTIVE').length,
    loadableCount: loadable.length,
    phantomCount: probes.filter((p) => p.status === 'PHANTOM').length,
    missingCount: probes.filter((p) => p.status === 'MISSING').length,
    totalCount: total,
    sync_ratio: total === 0 ? 0 : loadable.length / total,
    traceId: deriveTraceId(loadable.map((p) => p.package)),
  };
}
