export interface Task {
  id: string
  type: 'analysis' | 'refactor' | 'test' | 'build' | 'deploy' | 'monitor' | 'optimize' | 'security'
  description: string
  parameters: Record<string, unknown>
  dependencies: string[]
  priority: 'high' | 'medium' | 'low'
  timeout: number
  retryCount: number
  tags: string[]
  createdAt: number
  metadata?: Record<string, unknown>
}

export interface TaskResult {
  success: boolean
  result?: unknown
  error?: string
  metrics?: {
    executionTime: number
    memoryUsage?: number
    qualityScore?: number
    complianceScore?: number
  }
  suggestions?: string[]
  timestamp: number
}

export interface MultiStepResult {
  success: boolean
  results: TaskResult[]
  summary: {
    totalTasks: number
    successfulTasks: number
    failedTasks: number
    executionTime: number
    averageQualityScore: number
  }
  recommendations: string[]
}

export interface OptimizationStrategy {
  id: string
  description: string
  priority: 'high' | 'medium' | 'low'
  riskLevel: 'low' | 'medium' | 'high'
  estimatedTime: number
  estimatedCost: number
  tasks: OptimizationTask[]
  expectedImpact: {
    performance: number
    security: number
    quality: number
  }
}

export interface OptimizationTask {
  id: string
  name: string
  description: string
  complexity: 'simple' | 'moderate' | 'complex'
  dependencies: string[]
  estimatedTime: number
  requiredSkills: string[]
}

export interface ImplementationPlan {
  phases: ImplementationPhase[]
  totalPhases: number
  estimatedTotalTime: number
  budget?: string
  successMetrics: string[]
}

export interface ImplementationPhase {
  phase: number
  description: string
  tasks: {
    name: string
    complexity: string
    dependencies: string[]
    estimatedTime: number
  }[]
  priority: string
  riskLevel: string
  estimatedTime: number
}

export interface FeedbackReport {
  systemHealth: SystemHealth
  aiPerformance: AIPerformance
  coordinationMetrics: CoordinationMetrics
  recommendations: Recommendation[]
  nextReview: Date
}

export interface SystemHealth {
  overallScore: number
  performance: {
    score: number
    responseTime: number
    throughput: number
  }
  memory: {
    usage: number
    available: number
  }
  cpu: {
    usage: number
  }
}

export interface AIPerformance {
  modelLatency: number
  responseAccuracy: number
  costPerTask: number
  tasksProcessed: number
}

export interface CoordinationMetrics {
  tasksCompleted: number
  collaborationEfficiency: number
  communicationLatency: number
}

export interface Recommendation {
  category: 'performance' | 'security' | 'coordination' | 'quality'
  message: string
  priority: 'high' | 'medium' | 'low'
  action: string
}

export interface StepResult {
  taskId: string
  success: boolean
  result?: unknown
  error?: string
  executionTime: number
  qualityScore: number
}

export interface AgentStatus {
  name: string
  version: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  capabilities: string[]
  protocols: string[]
  health: SystemHealth
  uptime: number
  lastTask?: string
}

export interface ExecutionContext {
  startTime: number
  currentTasks: string[]
  completedTasks: string[]
  failedTasks: string[]
  getLastTask(): string
}

// ── 5T Gate Contracts (restored for gates.ts) ────────────────

export type FiveTDimension = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

export interface FiveTVerificationResult {
  passed: boolean;
  issues: string[];
  gate: FiveTDimension;
  score: number;
}

export type FiveTScore = Record<FiveTDimension, number>;

export const FIVE_T_GATES: FiveTDimension[] = [
  'traceable',
  'transparent',
  'tangible',
  'trustworthy',
  'trackable',
];

export const FIVE_T_META: Record<FiveTDimension, { zh: string; color: string }> = {
  traceable: { zh: '可追溯', color: '#2563EB' },
  transparent: { zh: '可透明', color: '#0EA5E9' },
  tangible: { zh: '可量化', color: '#F59E0B' },
  trustworthy: { zh: '可信任', color: '#10B981' },
  trackable: { zh: '可追蹤', color: '#8B5CF6' },
};
