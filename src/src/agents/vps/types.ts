// VPS Agent 類型定義
// ------------------------------------------------------------
// 定義 VPS Agent 專屬的任務類型、配置與結果結構
// ------------------------------------------------------------

import { IComponentCore } from "../../types/omni-agent";

/** VPS 任務類型枚舉 */
export type VPSTaskType =
  | "deploy"           // 部署應用
  | "rollback"         // 回滾版本
  | "health_check"     // 健康檢查
  | "backup"           // 備份數據
  | "restore"          // 還原備份
  | "nginx_configure"  // 配置 Nginx
  | "ssl_setup"        // 設置 SSL
  | "docker_manage"    // 管理 Docker 容器
  | "pm2_manage"       // 管理 PM2 進程
  | "system_monitor"   // 系統監控
  | "log_cleanup"      // 日誌清理
  | "security_scan"    // 安全掃描
  | "performance_test" // 性能測試
  | "config_update";   // 配置更新

/** VPS 配置 */
export interface IVPSConfig {
  /** VPS IP 地址 */
  host: string;
  /** SSH 端口 */
  port: number;
  /** SSH 用戶名 */
  user: string;
  /** SSH 密鑰路徑（可選） */
  keyPath?: string;
  /** 項目路徑 */
  projectPath: string;
  /** 備份目錄 */
  backupDir: string;
  /** 應用端口 */
  appPort: number;
  /** Gateway 端口 */
  gatewayPort: number;
  /** 監控端口 */
  monitorPort?: number;
}

/** VPS 任務規格 */
export interface IVPSTaskSpec extends IComponentCore {
  /** 任務類型 */
  readonly taskType: VPSTaskType;
  /** 任務參數 */
  readonly params: Record<string, unknown>;
  /** 目標服務（可選） */
  readonly target?: "app" | "gateway" | "nginx" | "docker" | "all";
  /** 是否乾跑模式（僅模擬） */
  readonly dryRun?: boolean;
}

/** VPS 任務結果 */
export interface IVPSTaskResult extends IComponentCore {
  /** 對應的任務 UUID */
  readonly taskId: string;
  /** 執行狀態 */
  readonly status: "success" | "failed" | "partial" | "cancelled";
  /** 任務輸出 */
  readonly output: VPSOutput;
  /** 執行日誌 */
  readonly logs: string[];
  /** 執行時長（毫秒） */
  readonly durationMs: number;
}

/** VPS 輸出結構 */
export interface VPSOutput {
  /** 操作類型 */
  action: string;
  /** 服務狀態 */
  services?: Record<string, ServiceStatus>;
  /** 備份路徑（備份操作時） */
  backupPath?: string;
  /** 錯誤信息（失敗時） */
  error?: string;
  /** 額外數據 */
  extra?: Record<string, unknown>;
}

/** 服務狀態 */
export interface ServiceStatus {
  /** 服務名稱 */
  name: string;
  /** 運行狀態 */
  status: "running" | "stopped" | "error" | "unknown";
  /** PM2 進程 ID（PM2 服務） */
  pid?: number;
  /** 端口 */
  port?: number;
  /** 內存使用（MB） */
  memoryMb?: number;
  /** CPU 使用率 */
  cpuPercent?: number;
  /** 運行時間（秒） */
  uptimeSeconds?: number;
}

/** VPS 健康報告 */
export interface IVPSHealthReport {
  /** 報告時間戳 */
  timestamp: number;
  /** 系統資源 */
  system: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    loadAverage: number[];
  };
  /** 服務狀態 */
  services: Record<string, ServiceStatus>;
  /** Nginx 狀態 */
  nginx: {
    configValid: boolean;
    activeConnections: number;
    requestsPerSecond: number;
  };
  /** Docker 容器狀態 */
  docker: {
    containers: Array<{
      name: string;
      status: string;
      health: string;
    }>;
  };
  /** 安全狀態 */
  security: {
    ufwActive: boolean;
    fail2banActive: boolean;
    lastLoginAttempt?: number;
  };
  /** 問題列表 */
  issues: Array<{
    severity: "critical" | "warning" | "info";
    message: string;
    service?: string;
  }>;
}

/** VPS 備份元數據 */
export interface IVPSBackupMeta {
  /** 備份名稱 */
  name: string;
  /** 備份時間 */
  timestamp: number;
  /** 備份大小（字節） */
  sizeBytes: number;
  /** 備份類型 */
  type: "full" | "incremental" | "database" | "config";
  /** 包含的組件 */
  components: string[];
  /** 備份路徑 */
  path: string;
}
