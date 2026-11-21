/**
 * src/types/sustain-write.ts — Sustain Write 共用型別
 *
 * 前後端統一使用的型別定義，確保 API 請求/回應結構一致。
 */

// ── Company ──────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  shortName: string;
  industry: string;
}

// ── Task Progress ─────────────────────────────────────────────

export type TaskStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskProgress {
  readonly taskId: string;
  readonly status: TaskStatus;
  readonly taskType?: 'report_generation' | 'grammar_rewrite' | 'ocr_processing';
  readonly templateId?: string;
  readonly companyId: string;
  readonly currentChapter: number;
  readonly totalChapters: number;
  readonly chapterTitle: string;
  readonly wordsSoFar: number;
  readonly fiveTGate: string;
  readonly tagsCreated: number;
  readonly decisionsCount: number;
  readonly percent: number;
  readonly updatedAt?: string;
  readonly result?: TaskResult;
}

export interface TaskResult {
  totalWords: number;
  totalTags: number;
  trinityHash: string;
  durationMs: number;
  companyId: string;
}

// ── Evidence Card ─────────────────────────────────────────────

export interface EvidenceCard {
  id: string;
  chapter: string;
  receiptName: string;
  why: string;
  what: string;
  how: string;
  tags: string[];
  hashLock: string;
}

// ── Report Chapter ────────────────────────────────────────────

export interface ReportChapter {
  id: string;
  title: string;
  fiveTGate: string;
  wordCount: number;
  content: string;
  griCodes?: string[];
}

// ── C-Version Report ──────────────────────────────────────────

export interface CVersionReport {
  companyId: string;
  companyName: string;
  version: string;
  totalWords: number;
  fiveTStatus?: string;
  chapters: ReportChapter[];
  generatedAt: string;
}

// ── V5 Report ─────────────────────────────────────────────────

export interface V5Report {
  companyId: string;
  companyName: string;
  version: string;
  totalWords: number;
  totalTags: number;
  trinityHash: string;
  chapters: ReportChapter[];
  generatedAt: string;
  durationMs: number;
}

// ── API Response Structures ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

// ── Health Check ──────────────────────────────────────────────

export interface HealthCheckResponse {
  app: string;
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  responseMs: number;
  components: {
    redis: string;
    agnes_api: string;
    firebase_admin: string;
    celestial_flow: string;
    esgsonar_gateway: string;
  };
}

// ── Download/Preview ──────────────────────────────────────────

export type ReportFormat = 'html' | 'markdown' | 'md';

export interface DownloadParams {
  companyId: string;
  format?: ReportFormat;
}
