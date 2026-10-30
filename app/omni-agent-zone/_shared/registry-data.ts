// 共用 mock 代理註冊表 — agents 頁面 fallback 與 /api/omni-agent/registry 同源（DRY，PR #114 品質閘修復）。
export type RegistryAgent = {
  id: string;
  name: string;
  type: 'omni' | 'hermes' | 'jules' | 'custom';
  status: 'online' | 'busy' | 'offline' | 'error';
  capabilities: string[];
  endpoint?: string;
  lastHeartbeat: number;
  tasksCompleted: number;
  memoryUsage: number;
};

export const REGISTRY_AGENTS: RegistryAgent[] = [
      {
        id: 'omni-core-01',
        name: 'OmniAgent Core',
        type: 'omni',
        status: 'online',
        capabilities: ['報告生成', '重大性分析', '碳盤查', '供應鏈盡調', 'AI 建議'],
        endpoint: '/api/omni-agent',
        lastHeartbeat: Date.now() - 30000,
        tasksCompleted: 156,
        memoryUsage: 45,
      },
      {
        id: 'hermes-30-01',
        name: 'Hermes 30 蜂群',
        type: 'hermes',
        status: 'online',
        capabilities: ['自動巡檢', '自癒修復', '排程任務', '監控告警', '萬能分身'],
        endpoint: '/api/cron',
        lastHeartbeat: Date.now() - 15000,
        tasksCompleted: 892,
        memoryUsage: 32,
      },
      {
        id: 'jules-assistant',
        name: 'Jules AI',
        type: 'jules',
        status: 'busy',
        capabilities: ['程式開發', '代碼審查', '除錯修復', '文件撰寫', '重構優化'],
        lastHeartbeat: Date.now() - 60000,
        tasksCompleted: 234,
        memoryUsage: 67,
      },
      {
        id: 'custom-gateway',
        name: 'MCP Gateway',
        type: 'custom',
        status: 'online',
        capabilities: ['MCP 協議', '工具橋接', '資源存取', '安全閘道'],
        endpoint: '/api/mcp',
        lastHeartbeat: Date.now() - 20000,
        tasksCompleted: 78,
        memoryUsage: 28,
      },
    ];
