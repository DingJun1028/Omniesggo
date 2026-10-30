export interface SharedMemory {
  id: string;
  content: string;
  layer: 'L0' | 'L1' | 'L2' | 'L3';
  tags: string[];
  timestamp: number;
  source: string;
}

/**
 * 第二共享大腦示範資料。
 * 由 /api/omni-agent/shared-brain/memories 與專區首頁 fallback 共用，
 * 避免同一份 mock 兩處維護（PR #114 品質閘去重）。
 */
export const MOCK_MEMORIES: SharedMemory[] = [
  {
    id: '1',
    content: 'ESG 報告書需遵循 GRI 2024 標準，重點關注雙重重大性分析與利害關係人參與',
    layer: 'L2',
    tags: ['ESG', 'GRI', '重大性', '利害關係人'],
    timestamp: Date.now() - 3600000,
    source: 'omni-agent',
  },
  {
    id: '2',
    content: '5T 協議：Traceable（可溯源）、Transparent（可驗算）、Tangible（可感知）、Trustworthy（不可篡改）、Trackable（可追蹤）',
    layer: 'L3',
    tags: ['5T', '協議', '信任', '治理'],
    timestamp: Date.now() - 7200000,
    source: 'core',
  },
  {
    id: '3',
    content: '用戶偏好使用繁體中文介面，偏好深色主題，重視無障礙設計',
    layer: 'L1',
    tags: ['偏好', 'UI', '語言', '無障礙'],
    timestamp: Date.now() - 1800000,
    source: 'user-session',
  },
  {
    id: '4',
    content: 'CSRD 法規要求大型企業從 2024 年起申報永續報告，需採用 ESRS 標準',
    layer: 'L2',
    tags: ['CSRD', 'ESRS', '法規', '合規'],
    timestamp: Date.now() - 5400000,
    source: 'omni-agent',
  },
  {
    id: '5',
    content: '當前任務：重構根平台 UI/UX/RWD，採用行銷與應用分離架構',
    layer: 'L0',
    tags: ['任務', '重構', 'UI/UX'],
    timestamp: Date.now() - 900000,
    source: 'current-session',
  },
];
