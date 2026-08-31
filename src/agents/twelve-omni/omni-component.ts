 
/**
 * ==========================================
 * 🌌 OmniComponent — 萬能元件實現
 * ==========================================
 * The smallest molecular unit in each Omni series, yet infinitely scalable.
 * 每個萬能系列中最小的分子，可無限小亦可無限大，數量可增多或減少，元件生命週期管理，支持版本控制和依賴追蹤。
 */

import { randomUUID } from 'crypto';
import {
  IOmniComponent,
  ComponentId,
  ComponentInfo,
  DependencyGraph,
  ComponentVersion,
  ComponentHealth,
} from '../../types/twelve-omni';

/**
 * OmniComponent 實現
 * 組件生命週期管理
 */
export class OmniComponent implements IOmniComponent {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 組件存儲 */
  private components: Map<ComponentId, ComponentInfo> = new Map();

  /** 版本歷史 */
  private _versionHistory: Map<ComponentId, ComponentVersion[]> = new Map();

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 註冊組件
   */
  async register(component: Omit<ComponentInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComponentId> {
    const id = `COMP-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const fullComponent: ComponentInfo = {
      ...component,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.components.set(id, fullComponent);
    this._versionHistory.set(id, [
      {
        version: component.version,
        timestamp: Date.now(),
        changes: ['Initial registration'],
        breakingChanges: false,
      },
    ]);

    return id;
  }

  /**
   * 獲取組件
   */
  async get(id: ComponentId): Promise<ComponentInfo | null> {
    return this.components.get(id) || null;
  }

  /**
   * 更新組件
   */
  async update(id: ComponentId, delta: Partial<ComponentInfo>): Promise<void> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component ${id} not found`);
    }

    const updated: ComponentInfo = {
      ...component,
      ...delta,
      id, // 保持 ID 不變
      updatedAt: Date.now(),
    };

    this.components.set(id, updated);

    // 記錄版本歷史
    const history = this._versionHistory.get(id) || [];
    history.push({
      version: updated.version,
      timestamp: Date.now(),
      changes: ['Component updated'],
      breakingChanges: delta.version !== component.version,
    });
    this._versionHistory.set(id, history);
  }

  /**
   * 移除組件
   */
  async remove(id: ComponentId): Promise<void> {
    this.components.delete(id);
    this._versionHistory.delete(id);
  }

  /**
   * 依賴圖
   */
  async dependencyGraph(): Promise<DependencyGraph> {
    const nodes: DependencyGraph['nodes'] = [];
    const edges: DependencyGraph['edges'] = [];

    for (const component of Array.from(this.components.values())) {
      nodes.push({
        id: component.id,
        name: component.name,
        type: component.type,
      });

      for (const depId of component.dependencies) {
        edges.push({
          from: component.id,
          to: depId,
          type: 'depends',
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * 版本歷史
   */
  async versionHistory(id: ComponentId): Promise<ComponentVersion[]> {
    return this._versionHistory.get(id) || [];
  }

  /**
   * 組件健康度
   */
  async healthCheck(id: ComponentId): Promise<ComponentHealth> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component ${id} not found`);
    }

    // 模擬健康檢查
    const errorRate = Math.random() * 0.1;
    const responseTime = Math.random() * 100;

    return {
      status: errorRate < 0.05 ? 'active' : 'error',
      lastCheck: Date.now(),
      uptime: Date.now() - component.createdAt,
      errorRate,
      responseTime,
    };
  }
}

/**
 * OmniComponent 單例工廠
 */
let _instance: OmniComponent | null = null;

export function getOmniComponent(): OmniComponent {
  if (!_instance) {
    _instance = new OmniComponent();
  }
  return _instance;
}
