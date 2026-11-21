// Chaos Self-Heal – 突變測試引擎 (奇效九：混沌自癒)
// ------------------------------------------------------------
// 此模組負責在 CI/本地環境執行突變測試，偵測程式碼在被隨機突變後是否仍能通過測試。
// 若測試失敗，視為潛在安全或穩定性問題，將自動觸發 OAG 自癒機制或發送警報。
// 使用者可自行設定突變測試指令 (預設 npm script: "test:mutate")，
// 並可透過環境變數啟用/停用此功能。

import * as child_process from "child_process";
import { promisify } from "util";

const exec = promisify(child_process.exec);

/**
 * 執行突變測試。
 * 透過 `npm run test:mutate` (或自訂指令) 來執行 mutation testing。
 * 若測試全部通過則回傳 true，否則回傳 false。
 */
export async function runMutationTesting(): Promise<boolean> {
  const enabled = process.env.CHAOS_SELF_HEAL_ENABLED !== "false";
  if (!enabled) {
    console.debug("[ChaosSelfHeal] Disabled via env");
    return true;
  }

  // 允許使用自訂指令，預設 npm script
  const command = process.env.MUTATION_TEST_CMD ?? "npm run test:mutate";
  const cwd = process.env.MUTATION_TEST_CWD ?? process.cwd();

  try {
    console.info(`[ChaosSelfHeal] Running mutation tests: ${command}`);
    const { stdout, stderr } = await exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 });
    console.debug(`[ChaosSelfHeal] Mutation test output:\n${stdout}`);
    if (stderr) {
      console.warn(`[ChaosSelfHeal] Mutation test stderr:\n${stderr}`);
    }
    // 假設測試成功時 exit code = 0，exec throws on non‑zero, so reaching here means success
    return true;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error(`[ChaosSelfHeal] Mutation testing failed: ${err.message}`);
    if (e && typeof e === 'object' && 'stdout' in e) console.debug((e as { stdout: string }).stdout);
    if (e && typeof e === 'object' && 'stderr' in e) console.warn((e as { stderr: string }).stderr);
    return false;
  }
}

/**
 * 在突變測試失敗時自動觸發 OAG 的 selfHeal 機制。
 * @param issueId 用於標識本次自癒事件的唯一 ID（例如 "mutation-failure"）
 */
export async function selfHealOnMutationFailure(issueId: string = "mutation-failure"): Promise<void> {
  const passed = await runMutationTesting();
  if (passed) {
    console.info("[ChaosSelfHeal] Mutation tests passed – no healing required.");
    return;
  }

  console.warn(`[ChaosSelfHeal] Mutation tests failed – invoking OAG selfHeal for issue ${issueId}`);
  try {
    // 動態載入 OAG 實例 (假設在專案中已有實作)
    const { omniAgentGateway } = await import("../agents/oag-instance");
    if (omniAgentGateway && typeof omniAgentGateway.selfHeal === "function") {
      await omniAgentGateway.selfHeal(issueId, { cause: "mutation_test_failure" });
      console.info(`[ChaosSelfHeal] OAG selfHeal invoked for ${issueId}`);
    } else {
      console.error("[ChaosSelfHeal] OAG instance not found or missing selfHeal method.");
    }
  } catch (importErr) {
    console.error(`[ChaosSelfHeal] Failed to load OAG instance: ${importErr}`);
  }
}

/**
 * 快速入口 – 在應用啟動時或 CI 階段呼叫。
 * ```ts
 * import { selfHealOnMutationFailure } from "./chaos-self-heal";
 * await selfHealOnMutationFailure();
 * ```
 */
export async function startChaosSelfHealWatcher(): Promise<void> {
  // 監聽 Node.js process exit 事件，以確保在結束前完成檢測
  process.on("beforeExit", async () => {
    await selfHealOnMutationFailure();
  });
  console.info("[ChaosSelfHeal] Watcher registered – will evaluate on process exit.");
}

// 若直接執行此檔案，可作為手動測試入口
if (require.main === module) {
  (async () => {
    await selfHealOnMutationFailure();
    process.exit(0);
  })();
}
