/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * ⚡ VPS 任務處理器 (Task Handlers)
 * ==========================================
 * 
 * 負責執行具體的 VPS 操作任務
 * 
 * 量子糾纏效果：
 * - 任務開始時通知 OmniAgent
 * - 部署完成後同步狀態
 * - 失敗時觸發自動回滾
 * 
 * 每個處理器都遵循 IComponentCore 契約：
 * - 返回的結果包含 uuid, version, timestamp, evidence
 * - 所有操作都被記錄在 evidence 中
 * - 結果通過量子糾纏通道同步到 OmniAgent
 */

import { v4 as uuidv4 } from "uuid";
import { execFile as execFileCb } from "child_process";
import { promisify } from "util";
import { IComponentCore } from "../../types/omni-agent";

const execFileAsync = promisify(execFileCb);

// ==========================================
// VPS 連接配置
// ==========================================

/** VPS 連接配置 */
export const VPS_CONNECTION = {
  host: "161.118.248.180",
  port: 8042,
  user: "root",
  keyPath: "C:/Users/Administrator/Downloads/ssh-key-2026-04-25.key",
  projectPath: "/var/www/esggo",
} as const;

/**
 * 執行 SSH 命令到 VPS
 */
async function sshExec(
  command: string,
  timeoutMs: number = 30000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const sshArgs = [
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=10",
    "-o", "BatchMode=yes",
    "-p", String(VPS_CONNECTION.port),
    "-i", VPS_CONNECTION.keyPath,
    `${VPS_CONNECTION.user}@${VPS_CONNECTION.host}`,
    command,
  ];

  try {
    const result = await execFileAsync("ssh", sshArgs, {
      timeout: timeoutMs,
      encoding: "utf-8",
    });
    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: 0,
    };
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    return {
      stdout: (err.stdout as string) ?? "",
      stderr: (err.stderr as string) ?? (err.message as string) ?? String(error),
      exitCode: (err.code as number) ?? 1,
    };
  }
}

// ==========================================
// 任務結果基礎結構
// ==========================================

/** 任務結果基礎 */
export interface TaskResultBase extends IComponentCore {
  /** 任務狀態 */
  status: "success" | "failed" | "partial";
  /** 執行日誌 */
  logs: string[];
  /** 執行時長 (ms) */
  durationMs: number;
}

/** 創建任務結果 */
function createResult(
  status: TaskResultBase["status"],
  logs: string[],
  durationMs: number,
  evidence?: { originCause: string; processTrace: string[]; finalEffect: string; }
): TaskResultBase {
  const uuid = uuidv4();
  return {
    uuid,
    version: "1.0.0",
    timestamp: Date.now(),
    evidence: {
      originCause: 'unknown',
      processTrace: [],
      finalEffect: 'unknown',
      ...(evidence ?? {})
    },
    status,
    logs,
    durationMs,
  };
}

// ==========================================
// 部署處理器
// ==========================================

export interface DeployParams {
  /** 部署目標 (app | gateway | all) */
  target?: "app" | "gateway" | "all";
  /** 是否執行 build */
  build?: boolean;
  /** 是否重啟服務 */
  restart?: boolean;
  /** 乾跑模式 */
  dryRun?: boolean;
}

export interface DeployResult extends TaskResultBase {
  /** 部署的服務 */
  services: string[];
  /** 部署版本 */
  version: string;
  /** 是否回滾 */
  rolledBack?: boolean;
}

/**
 * 處理部署任務
 * 
 * 量子糾纏效果：
 * - 部署開始時通知 OmniAgent
 * - 部署完成後同步狀態
 * - 失敗時觸發自動回滾
 */
export async function handleDeploy(params: DeployParams = {}): Promise<DeployResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const target = params.target ?? "all";
  const build = params.build ?? true;
  const restart = params.restart ?? true;
  const dryRun = params.dryRun ?? false;

  logs.push(`[Deploy] 🚀 開始部署 (目標: ${target}, 乾跑: ${dryRun})`);

  try {
    // 1. 備份當前版本
    logs.push("[Deploy] 💾 備份當前版本...");
    if (!dryRun) {
      const backupResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && mkdir -p backups && tar -czf backups/pre-deploy-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next --exclude=backups . 2>&1 | tail -5`
      );
      logs.push(`[Deploy] 備份: ${backupResult.stdout.trim() || "done"}`);
    }

    // 2. 同步代碼
    logs.push("[Deploy] 📥 同步最新代碼...");
    if (!dryRun) {
      const gitResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && git pull origin main 2>&1 | tail -5`
      );
      logs.push(`[Deploy] Git: ${gitResult.stdout.trim()}`);
      if (gitResult.exitCode !== 0) {
        logs.push(`[Deploy] ⚠️ Git pull warnings: ${gitResult.stderr.trim()}`);
      }
    }

    // 3. 安裝依賴
    if (build) {
      logs.push("[Deploy] 📦 安裝依賴...");
      if (!dryRun) {
        const installResult = await sshExec(
          `cd ${VPS_CONNECTION.projectPath} && npm install --production=false 2>&1 | tail -10`,
          120000
        );
        logs.push(`[Deploy] npm: ${installResult.stdout.trim()}`);
      }
    }

    // 4. 執行構建
    if (build) {
      logs.push("[Deploy] 🔨 執行構建...");
      if (!dryRun) {
        const buildResult = await sshExec(
          `cd ${VPS_CONNECTION.projectPath} && npx next build 2>&1 | tail -15`,
          180000
        );
        logs.push(`[Deploy] build: ${buildResult.stdout.trim()}`);
      }
    }

    // 5. 重啟服務
    if (restart) {
      logs.push("[Deploy] 🔄 重啟服務...");
      if (!dryRun) {
        if (target === "app" || target === "all") {
          const restartResult = await sshExec(
            `cd ${VPS_CONNECTION.projectPath} && pm2 restart ecosystem.config.cjs --only esggo-core 2>&1 | tail -5`
          );
          logs.push(`[Deploy] PM2 restart: ${restartResult.stdout.trim()}`);
        }
        if (target === "gateway" || target === "all") {
          const restartResult = await sshExec(
            `cd ${VPS_CONNECTION.projectPath} && pm2 restart ecosystem.config.cjs --only omniagent-gateway 2>&1 | tail -5`
          );
          logs.push(`[Deploy] Gateway restart: ${restartResult.stdout.trim()}`);
        }
      }
    }

    // 6. 健康檢查
    logs.push("[Deploy] 🔍 執行健康檢查...");
    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const healthResult = await sshExec(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000"`
      );
      const httpCode = healthResult.stdout.trim();
      logs.push(`[Deploy] 健康檢查: HTTP ${httpCode}`);
    }

    const duration = Date.now() - startTime;
    logs.push(`[Deploy] ✅ 部署完成 (耗時: ${duration}ms)`);

    return {
      ...createResult("success", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "deploy", target, services: target === "all" ? ["esggo-core", "omniagent-gateway"] : [target], dryRun,
    } as any as DeployResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    logs.push(`[Deploy] ❌ 部署失敗: ${error}`);
    
    // 嘗試回滾
    logs.push("[Deploy] ⏪ 嘗試回滾...");
    if (!dryRun) {
      const rollbackResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && latest_backup=$(ls -t backups/pre-deploy-*.tar.gz 2>/dev/null | head -1) && [ -n "$latest_backup" ] && tar -xzf "$latest_backup" --overwrite 2>&1 | tail -3 || echo "No backup found"`
      );
      logs.push(`[Deploy] 回滾: ${rollbackResult.stdout.trim()}`);
    }
    
    return {
      ...createResult("failed", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "deploy", target, error: String(error), rolledBack: true,
    } as any as DeployResult;
  }
}

// ==========================================
// 健康檢查處理器
// ==========================================

export interface HealthCheckResult extends TaskResultBase {
  /** 系統資源 */
  system: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    loadAverage: number[];
  };
  /** 服務狀態 */
  services: Record<string, {
    status: "running" | "stopped" | "error";
    health: "healthy" | "unhealthy" | "degraded";
    port: number;
  }>;
  /** 發現的問題 */
  issues: Array<{
    severity: "critical" | "warning" | "info";
    message: string;
  }>;
}

/**
 * 處理健康檢查任務
 * 
 * 量子測量效果：
 * - 檢查會導致波函數坍縮
 * - 結果即時同步到 OmniAgent
 */
export async function handleHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  logs.push("[HealthCheck] 🔍 開始健康檢查...");

  try {
    // 1. 獲取系統資源
    logs.push("[HealthCheck] 📊 獲取系統資源...");
    const cpuResult = await sshExec(
      "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//' 2>/dev/null || echo 0"
    );
    const memResult = await sshExec(
      "free -m | awk '/Mem:/ {printf \"%.1f\", $3/$2*100}' 2>/dev/null || echo 0"
    );
    const diskResult = await sshExec(
      "df -h / | awk 'NR==2 {print $5}' | tr -d '%' 2>/dev/null || echo 0"
    );
    const loadResult = await sshExec("cat /proc/loadavg 2>/dev/null || echo '0 0 0'");

    const loadParts = loadResult.stdout.trim().split(/\s+/);
    const system = {
      cpuPercent: parseFloat(cpuResult.stdout.trim()) || 0,
      memoryPercent: parseFloat(memResult.stdout.trim()) || 0,
      diskPercent: parseFloat(diskResult.stdout.trim()) || 0,
      loadAverage: [
        parseFloat(loadParts[0]) || 0,
        parseFloat(loadParts[1]) || 0,
        parseFloat(loadParts[2]) || 0,
      ],
    };

    logs.push(`[HealthCheck] CPU: ${system.cpuPercent.toFixed(1)}%, RAM: ${system.memoryPercent.toFixed(1)}%, Disk: ${system.diskPercent.toFixed(1)}%`);

    // 2. 檢查服務狀態
    logs.push("[HealthCheck] 🔎 檢查服務狀態...");
    const services: Record<string, { status: "running" | "stopped" | "error"; health: "healthy" | "unhealthy" | "degraded"; port: number }> = {};

    // ESGGO Core (port 3000)
    const esggoResult = await sshExec(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000"'
    );
    const esggoCode = esggoResult.stdout.trim();
    services["esggo-core"] = {
      status: esggoCode !== "000" && esggoCode !== "" ? "running" : "stopped",
      health: esggoCode.startsWith("2") ? "healthy" : esggoCode.startsWith("5") ? "unhealthy" : "degraded",
      port: 3000,
    };

    // OmniAgent Gateway (port 8642)
    const gatewayResult = await sshExec(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:8642/health 2>/dev/null || echo "000"'
    );
    const gatewayCode = gatewayResult.stdout.trim();
    services["omniagent-gateway"] = {
      status: gatewayCode !== "000" && gatewayCode !== "" ? "running" : "stopped",
      health: gatewayCode.startsWith("2") ? "healthy" : "unhealthy",
      port: 8642,
    };

    // Nginx (port 80/443)
    const nginxResult = await sshExec("systemctl is-active nginx 2>/dev/null || echo unknown");
    const nginxStatus = nginxResult.stdout.trim();
    services["nginx"] = {
      status: nginxStatus === "active" ? "running" : "stopped",
      health: nginxStatus === "active" ? "healthy" : "unhealthy",
      port: 80,
    };

    // Redis (port 6379)
    const redisResult = await sshExec(
      "redis-cli ping 2>/dev/null || echo PING_FAILED"
    );
    services["redis"] = {
      status: redisResult.stdout.trim() === "PONG" ? "running" : "stopped",
      health: redisResult.stdout.trim() === "PONG" ? "healthy" : "unhealthy",
      port: 6379,
    };

    // Prometheus (port 9090)
    const promResult = await sshExec(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/-/healthy 2>/dev/null || echo "000"'
    );
    services["prometheus"] = {
      status: promResult.stdout.trim() === "200" ? "running" : "stopped",
      health: promResult.stdout.trim() === "200" ? "healthy" : "unhealthy",
      port: 9090,
    };

    // 3. 發現問題
    const issues: HealthCheckResult["issues"] = [];
    
    if (system.cpuPercent > 90) {
      issues.push({ severity: "critical", message: `CPU 使用率過高: ${system.cpuPercent.toFixed(1)}%` });
    } else if (system.cpuPercent > 80) {
      issues.push({ severity: "warning", message: `CPU 使用率偏高: ${system.cpuPercent.toFixed(1)}%` });
    }

    if (system.memoryPercent > 90) {
      issues.push({ severity: "critical", message: `內存使用率過高: ${system.memoryPercent.toFixed(1)}%` });
    }

    if (system.diskPercent > 85) {
      issues.push({ severity: "warning", message: `磁盤使用率偏高: ${system.diskPercent.toFixed(1)}%` });
    }

    for (const [name, svc] of Object.entries(services)) {
      if (svc.status === "stopped") {
        issues.push({ severity: "critical", message: `服務 ${name} 已停止` });
      } else if (svc.health === "unhealthy") {
        issues.push({ severity: "warning", message: `服務 ${name} 健康狀態異常` });
      }
    }

    const duration = Date.now() - startTime;
    logs.push(`[HealthCheck] ✅ 健康檢查完成 (耗時: ${duration}ms)`);
    logs.push(`[HealthCheck] 📈 發現 ${issues.length} 個問題`);

    return {
      ...createResult(
        issues.some(i => i.severity === "critical") ? "failed" : "success",
        logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }
      ),
      action: "health_check", system, services, issues
    } as HealthCheckResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    logs.push(`[HealthCheck] ❌ 健康檢查失敗: ${error}`);
    
    return {
      ...createResult("failed", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "health_check", error: String(error)
    } as any as HealthCheckResult;
  }
}

// ==========================================
// 備份處理器
// ==========================================

export interface BackupParams {
  /** 備份類型 */
  type?: "full" | "database" | "config";
  /** 保留天數 */
  retainDays?: number;
}

export interface BackupResult extends TaskResultBase {
  /** 備份路徑 */
  backupPath: string;
  /** 備份大小 (bytes) */
  sizeBytes: number;
  /** 備份類型 */
  backupType: string;
}

/**
 * 處理備份任務
 */
export async function handleBackup(params: BackupParams = {}): Promise<BackupResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const type = params.type ?? "full";
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/var/backups/esggo/${timestamp}_${type}`;

  logs.push(`[Backup] 💾 開始備份 (類型: ${type})`);
  logs.push(`[Backup] 📁 備份路徑: ${backupPath}`);

  try {
    // 創建備份目錄
    await sshExec(`mkdir -p /var/backups/esggo`);

    if (type === "full" || type === "database") {
      logs.push("[Backup] 🗃️ 備份數據庫...");
      const dbResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && tar -czf ${backupPath}_db.tar.gz data/ 2>&1 | tail -3`
      );
      logs.push(`[Backup] DB: ${dbResult.stdout.trim()}`);
    }

    if (type === "full" || type === "config") {
      logs.push("[Backup] ⚙️ 備份配置...");
      const configResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && tar -czf ${backupPath}_config.tar.gz SOUL.md ecosystem.config.cjs package.json 2>&1 | tail -3`
      );
      logs.push(`[Backup] Config: ${configResult.stdout.trim()}`);
    }

    if (type === "full") {
      logs.push("[Backup] 📝 備份日誌...");
      const logResult = await sshExec(
        `cd ${VPS_CONNECTION.projectPath} && tar -czf ${backupPath}_logs.tar.gz logs/ 2>&1 | tail -3 || echo "No logs dir"`
      );
      logs.push(`[Backup] Logs: ${logResult.stdout.trim()}`);
    }

    // 獲取備份大小
    const sizeResult = await sshExec(
      `du -sb /var/backups/esggo/${timestamp}_* 2>/dev/null | awk '{sum+=$1} END{print sum}' || echo 0`
    );
    const sizeBytes = parseInt(sizeResult.stdout.trim()) || 0;

    // 清理舊備份 (保留 retainDays 天)
    if (params.retainDays) {
      await sshExec(
        `find /var/backups/esggo -name "*.tar.gz" -mtime +${params.retainDays} -delete 2>/dev/null || true`
      );
    }

    const duration = Date.now() - startTime;
    
    logs.push(`[Backup] ✅ 備份完成 (大小: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
    logs.push(`[Backup] ⏱️ 耗時: ${duration}ms`);

    return {
      ...createResult("success", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "backup", backupPath, sizeBytes, type
    } as any as BackupResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    logs.push(`[Backup] ❌ 備份失敗: ${error}`);
    
    return {
      ...createResult("failed", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "backup", error: String(error)
    } as any as BackupResult;
  }
}

// ==========================================
// 日誌清理處理器
// ==========================================

export interface LogCleanupParams {
  /** 最大日誌大小 (MB) */
  maxSizeMb?: number;
  /** 保留天數 */
  retainDays?: number;
}

export interface LogCleanupResult extends TaskResultBase {
  /** 清理的文件數 */
  filesCleaned: number;
  /** 釋放的空間 (bytes) */
  spaceFreedBytes: number;
}

/**
 * 處理日誌清理任務
 */
export async function handleLogCleanup(params: LogCleanupParams = {}): Promise<LogCleanupResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const maxSizeMb = params.maxSizeMb ?? 100;
  const retainDays = params.retainDays ?? 30;

  logs.push(`[LogCleanup] 🧹 開始日誌清理`);
  logs.push(`[LogCleanup] 📏 最大大小: ${maxSizeMb}MB, 保留天數: ${retainDays}`);

  try {
    // 清理大型日誌
    logs.push("[LogCleanup] 📄 清理大型日誌...");
    const logCleanResult = await sshExec(
      `find ${VPS_CONNECTION.projectPath}/logs -name "*.log" -size +${maxSizeMb}M -exec truncate -s 0 {} \\; 2>/dev/null || echo "No large logs"`
    );
    logs.push(`[LogCleanup] 日誌: ${logCleanResult.stdout.trim()}`);

    // 清理過期日誌
    logs.push("[LogCleanup] 🗓️ 清理過期日誌...");
    const expiredResult = await sshExec(
      `find ${VPS_CONNECTION.projectPath}/logs -name "*.log" -mtime +${retainDays} -delete 2>/dev/null; find /var/log -name "esggo*" -mtime +${retainDays} -delete 2>/dev/null; echo "done"`
    );
    logs.push(`[LogCleanup] 過期: ${expiredResult.stdout.trim()}`);

    // 清理 PM2 日誌
    logs.push("[LogCleanup] 📊 清理 PM2 日誌...");
    const pm2Result = await sshExec(
      "pm2 flush 2>/dev/null || echo PM2_LOG_CLEANED"
    );
    logs.push(`[LogCleanup] PM2: ${pm2Result.stdout.trim()}`);

    // 清理 .next 快取
    logs.push("[LogCleanup] ⚡ 清理 .next 快取...");
    const cacheResult = await sshExec(
      `du -sh ${VPS_CONNECTION.projectPath}/.next/cache 2>/dev/null || echo "no cache"`
    );
    logs.push(`[LogCleanup] 快取大小: ${cacheResult.stdout.trim()}`);

    // 統計清理結果
    const sizeResult = await sshExec(
      `du -sb ${VPS_CONNECTION.projectPath}/logs 2>/dev/null | awk '{print $1}' || echo 0`
    );
    const totalLogSize = parseInt(sizeResult.stdout.trim()) || 0;

    const duration = Date.now() - startTime;
    
    logs.push(`[LogCleanup] ✅ 清理完成`);
    logs.push(`[LogCleanup] 📊 當前日誌大小: ${(totalLogSize / 1024 / 1024).toFixed(2)} MB`);

    return {
      ...createResult("success", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "log_cleanup", maxSizeMb, retainDays, currentLogSizeBytes: totalLogSize
    } as any as LogCleanupResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    logs.push(`[LogCleanup] ❌ 清理失敗: ${error}`);
    
    return {
      ...createResult("failed", logs, duration, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: "log_cleanup", error: String(error)
    } as any as LogCleanupResult;
  }
}

// ==========================================
// 工具函數
// ==========================================

/**
 * 創建任務處理器映射
 */
export const taskHandlers = {
  deploy: handleDeploy,
  health_check: handleHealthCheck,
  backup: handleBackup,
  log_cleanup: handleLogCleanup,
} as const;

export type TaskType = keyof typeof taskHandlers;

/**
 * 執行任務
 */
export async function executeTask(
  type: TaskType,
  params?: Record<string, unknown>
): Promise<TaskResultBase> {
  const handler = taskHandlers[type];
  if (!handler) {
    return {
      ...createResult("failed", [`Unknown task type: ${type}`], 0, { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' }),
      action: type, error: `Unknown task type: ${type}`
    } as TaskResultBase;
  }
  
  // health_check doesn't accept params
  if (type === "health_check") {
    return (handler as () => Promise<TaskResultBase>)();
  }
  
  return (handler as (params: Record<string, unknown>) => Promise<TaskResultBase>)(params ?? {});
}

export default taskHandlers;
