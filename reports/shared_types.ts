/**
 * 共享類型定義
 * 供 Auto-Swarm 系統使用
 */

export interface MotherAgentState {
  id: string;
  name: string;
  status: 'idle' | 'monitoring' | 'triggering' | 'done';
  taskQueue: MotherTask[];
  subAgentCount: number;
  totalTriggered: number;
  lastTriggerTime: number;
}

export interface SubAgentState {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  parentId: string;
  payload: any;
  result?: any;
  error?: string;
  executedAt: number;
  duration: number;
}

export interface MotherTask {
  id: string;
  priority: 'critical' | 'normal' | 'low';
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
}

export interface SwarmTask {
  id: string;
  priority: 'critical' | 'normal' | 'low';
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
}

export interface SwarmState {
  motherAgent: {
    id: string;
    name: string;
    status: 'idle' | 'monitoring' | 'triggering' | 'done';
    taskQueue: string[];
    subAgentCount: number;
    totalTriggered: number;
    lastTriggerTime: number;
  };
  subAgents: Map<string, any>;
  swarmState: 'idle' | 'running' | 'paused';
  triggerProbability: number;
}

export interface SwarmControllerConfig {
  triggerProbability: number;
  autoRepair: boolean;
}
