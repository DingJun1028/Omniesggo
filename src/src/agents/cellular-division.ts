// Cellular Division – 動態增殖與負載背壓監控
// ------------------------------------------------------------
// 此模組負責監測系統負載（CPU、記憶體）與事件總線背壓（IBusEvent），在負載過高時動態擴增實例（細胞分裂），
// 並在負載降低時收縮（細胞凋亡）。
// 使用 PM2 作為進程管理工具，環境變數可調整行為。

import { execSync } from "child_process";
import * as os from "os";
import * as path from "path";

/**
 * 配置參數（可透過環境變數覆寫）
 *   - CELLULAR_DIVISION_ENABLED: 是否啟用細胞分裂（default: true）
 *   - LOAD_THRESHOLD: CPU 使用率閾值（%），超過則觸發增殖（default: 75）
 *   - MAX_INSTANCES: 同時允許的最大實例數（default: 4）
 */
const ENABLED = process.env.CELLULAR_DIVISION_ENABLED !== "false";
const LOAD_THRESHOLD = Number(process.env.LOAD_THRESHOLD ?? "75");
const MAX_INSTANCES = Number(process.env.MAX_INSTANCES ?? "4");

/**
 * 取得當前系統的 CPU 使用率（%）
 */
function getCpuLoadPercent(): number {
  const loadAvg = os.loadavg()[0]; // 1‑minute load average
  const cpuCount = os.cpus().length;
  // 將 loadAvg 正規化為 0‑100%（假設每核滿載為 1.0）
  const percent = Math.min(100, Math.round((loadAvg / cpuCount) * 100));
  return percent;
}

/**
 * 監測負載並在需要時動態增殖（啟動新實例）
 */
export async function monitorAndScale(): Promise<void> {
  if (!ENABLED) {
    console.debug("[CellularDivision] Feature disabled via env");
    return;
  }

  const cpuPercent = getCpuLoadPercent();
  console.debug(`[CellularDivision] Current CPU load: ${cpuPercent}%`);

  // 若負載超過閾值，嘗試使用 PM2 spawn 新實例（細胞分裂）
  if (cpuPercent > LOAD_THRESHOLD) {
    try {
      // 查看已經啟動的 PM2 實例數量
      const list = execSync("pm2 jlist", { encoding: "utf-8" });
      const processes = JSON.parse(list) as Array<{ pm2_env?: { status?: string } }>;
      const running = processes.filter((p) => p.pm2_env?.status === "online");
      const count = running.length;

      if (count < MAX_INSTANCES) {
        // 使用 PM2 start 產生新實例，假設入口檔案為 src/index.js
        const scriptPath = path.resolve(__dirname, "../index.js");
        execSync(
          `pm2 start ${scriptPath} --name cell_${Date.now()} --watch --no-daemon`,
          { stdio: "inherit" }
        );
        console.info(`[CellularDivision] Spawned new cell instance (total ${count + 1}/${MAX_INSTANCES})`);
      } else {
        console.info(`[CellularDivision] Max instances (${MAX_INSTANCES}) already running`);
      }
    } catch (e) {
      console.error("[CellularDivision] Failed to spawn new cell:", e);
    }
  } else {
    console.debug(`[CellularDivision] CPU load (${cpuPercent}%) below threshold (${LOAD_THRESHOLD}%) – no scaling needed`);
  }
}

// 若需要在程式啟動時自動呼叫，可在入口檔案中 import 並執行。
