// ============================================================
// Resources API — Platform resource inventory
// app/api/resources/route.ts
// ============================================================

import { jsonResponse } from '@lib/api-utils';

export interface ModuleResource {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  route: string;
  description: string;
  category: 'core' | 'report' | 'governance' | 'intelligence' | 'system';
  status: 'active' | 'beta' | 'planned';
  completeness: number;
  apiEndpoints: string[];
  dependencies: string[];
  whw: { why: string; how: string; what: string };
}

export interface AIModelResource {
  provider: string;
  models: {
    id: string;
    name: string;
    tier: 'free' | 'paid';
    speed: 'fast' | 'medium' | 'slow';
    contextWindow: string;
    specialty: string;
  }[];
  apiKeyEnv: string;
  rateLimit: string;
  status: 'active' | 'configured' | 'unconfigured';
}

export interface InfraResource {
  id: string;
  name: string;
  icon: string;
  type: 'database' | 'cache' | 'auth' | 'compute' | 'storage' | 'monitoring';
  provider: string;
  tier: string;
  status: 'healthy' | 'degraded' | 'offline' | 'optional';
  description: string;
  configKey: string;
}

// GET /api/resources — Full platform resource inventory
export async function GET() {
  const modules: ModuleResource[] = [
    {
      id: 'omni-center',
      name: '萬能中心',
      nameEn: 'OmniCore Center',
      icon: '◎',
      route: '/omni-center',
      description: '8 分頁儀錶板：Dashboard、Notes、Tasks、Calendar、Chat、5T Radar、RAG、ZKP Vault',
      category: 'core',
      status: 'active',
      completeness: 62,
      apiEndpoints: ['/api/omni/plugins', '/api/rag/query', '/api/memory'],
      dependencies: ['Firebase', 'Upstash Redis'],
      whw: { why: '統一控管所有 ESG 資料與 AI 功能的中央操控臺', how: '8 個分頁模組透過 Firebase 即時同步 + EventBus 事件驅動', what: '儀錶板、筆記、任務、日曆、AI 對話、5T 雷達、RAG 知識庫、ZKP 密庫' },
    },
    {
      id: 'sustain-write',
      name: 'ESG 報告產生器',
      nameEn: 'Sustain Write v5',
      icon: '📊',
      route: '/sustain-write/v5',
      description: 'GRI 28 章、TCFD 12 章、投資者 5 章，AI 自動合規生成報告',
      category: 'report',
      status: 'active',
      completeness: 82,
      apiEndpoints: ['/api/sustain-write/v5', '/api/sustain-write/v5/async', '/api/sustain-write/v5/progress/[taskId]', '/api/sustain-write/v5/download', '/api/sustain-write/v5/evidence'],
      dependencies: ['Gemini', 'Groq', 'OpenRouter'],
      whw: { why: '企業需要符合國際標準的 ESG 報告，手動撰寫耗時且易出錯', how: 'AI 模型鏈自動生成 + 非同步任務引擎 + 5T 封印驗證', what: '選擇公司/範本 → 一鍵生成 → 即時進度 → 預覽/下載 → 證據卡片' },
    },
    {
      id: 'sustain-center',
      name: '萬能永續中心',
      nameEn: 'Sustain Center',
      icon: '🌱',
      route: '/sustain-center',
      description: 'ESG 儀錶板、碳排驗算、趨勢分析、信任帳本',
      category: 'core',
      status: 'active',
      completeness: 70,
      apiEndpoints: ['/api/esg/assess', '/api/esg/skills'],
      dependencies: ['Firebase'],
      whw: { why: '企業需要即時掌握 ESG 整體表現與碳排放數據', how: '互動式圖表 + AI 洞察引擎 + 信任帳本審計軌跡', what: '總覽儀錶板、圖表分析、洞察網格、信任帳本、WebSocket 心跳' },
    },
    {
      id: 'village',
      name: '村莊治理',
      nameEn: 'Village Governance',
      icon: '🏡',
      route: '/village',
      description: '二次方投票（cost = votes² × 10）、影響力專案、OmniOne 趨勢預測',
      category: 'governance',
      status: 'active',
      completeness: 72,
      apiEndpoints: ['/api/village/data', '/api/village/vote', '/api/village/trends'],
      dependencies: ['Firebase', 'ZKP Seal'],
      whw: { why: 'ESG 決策需要公平民主的參與機制，避免財富集中影響', how: '二次方投票公式 + Firebase 交易 + ZKP 不可竄改封印', what: '專案看板、二次方投票、貢獻排行榜、活動動態、AI 趨勢預測' },
    },
    {
      id: 'wiki',
      name: '知識庫',
      nameEn: 'OmniWiki',
      icon: '📚',
      route: '/wiki',
      description: 'ESG 法規查詢：GRI、TCFD、CSRD、SDG 標準解析（52+ 篇文章，支援搜尋與分類）',
      category: 'intelligence',
      status: 'active',
      completeness: 65,
      apiEndpoints: [],
      dependencies: ['Markdown files'],
      whw: { why: 'ESG 從業人員需要快速查閱各國法規與標準', how: 'Markdown 檔案系統 + Server/Client 分離架構 + 即時搜尋', what: '文章列表、全文搜尋、分類篩選、Markdown 渲染、5T 封印' },
    },
    {
      id: 'omni-agent',
      name: 'AI 代理主控臺',
      nameEn: 'OmniAgent Console',
      icon: '🤖',
      route: '/omni-agent',
      description: 'AI 聊天、5T 子代理派遣、6 個快速命令',
      category: 'core',
      status: 'active',
      completeness: 55,
      apiEndpoints: ['/api/omni-agent', '/api/omni-agent/console', '/api/ai/generate'],
      dependencies: ['Gemini', 'Groq', 'OpenRouter'],
      whw: { why: '使用者需要自然語言介面來執行 ESG 任務', how: '意圖分類器 + 子代理派遣 + EventBus 事件流', what: 'AI 聊天、快速命令、5T 子代理面板、即時狀態監控' },
    },
    {
      id: 'daily',
      name: '每日永續觀察',
      nameEn: 'Daily Observer',
      icon: '📅',
      route: '/daily',
      description: 'ESG 每日摘要、法規變更、嚴重度分類、歷史封存（30 天）',
      category: 'intelligence',
      status: 'active',
      completeness: 60,
      apiEndpoints: ['/api/daily-report', '/api/daily-report/generate'],
      dependencies: ['Sonnar', 'Prisma'],
      whw: { why: 'ESG 團隊需要每日掌握法規變更與市場動態', how: '爬蟲引擎自動蒐集 + AI 摘要生成 + 嚴重度分級', what: '每日摘要、嚴重度篩選、日期選擇器、歷史封存、一鍵生成' },
    },
    {
      id: 'sonnar',
      name: 'ESG Sonnar',
      nameEn: 'Data Intelligence Radar',
      icon: '🔍',
      route: '/sonnar',
      description: '資料爬取、雷達訊號、主題分析、即時警報、OCR',
      category: 'intelligence',
      status: 'active',
      completeness: 58,
      apiEndpoints: ['/api/sonnar/crawl', '/api/sonnar/radar', '/api/sonnar/alerts', '/api/sonnar/ocr'],
      dependencies: ['WebSocket', 'Gateway'],
      whw: { why: 'ESG 資料分散在多個來源，需要自動化蒐集與監控', how: '爬蟲排程器 + 雷達訊號聚合 + WebSocket 即時推送', what: '資料來源管理、雷達訊號、主題分析、嚴重度篩選、即時警報' },
    },
    {
      id: 'emm',
      name: 'EMM 環境監控',
      nameEn: 'Environment + Model Monitor',
      icon: '💻',
      route: '/emm',
      description: '系統指標、AI 閘道狀態、模型供應商監控、SSE 即時串流',
      category: 'system',
      status: 'active',
      completeness: 68,
      apiEndpoints: ['/api/emm/metrics', '/api/emm/metrics/stream'],
      dependencies: ['Gateway'],
      whw: { why: '平臺穩定性需要即時監控系統資源與 AI 模型狀態', how: 'SSE 串流 + 外部閘道代理 + 6 卡片儀錶板', what: 'CPU/記憶體監控、閘道狀態、AI 模型狀態、Telegram、Sonnar、Sparkline 圖表' },
    },
    {
      id: 'profile',
      name: '使用者成長系統',
      nameEn: 'User Growth',
      icon: '👤',
      route: '/profile',
      description: '5 級成長（Seed→Guardian）、XP、成就、排行榜',
      category: 'governance',
      status: 'active',
      completeness: 72,
      apiEndpoints: ['/api/user/growth', '/api/user/leaderboard', '/api/user/tasks'],
      dependencies: ['Firebase Auth', 'Prisma'],
      whw: { why: '遊戲化機制提升使用者參與度與 ESG 學習動機', how: 'XP 經驗值系統 + 等級門檻 + 成就解鎖 + 排行榜', what: '5 級成長路徑、每日任務、成就徽章、排行榜、快速 XP 面板' },
    },
    {
      id: 'omni-todo',
      name: 'OmniTodo',
      nameEn: 'Task Manager',
      icon: '✅',
      route: '/omni-todo',
      description: '統一 ESG 任務管理面板（CRUD、分類、優先級、匯出）',
      category: 'core',
      status: 'active',
      completeness: 78,
      apiEndpoints: ['/api/omni-todo'],
      dependencies: ['In-memory store'],
      whw: { why: 'ESG 團隊需要統一管理合規檢查、資料蒐集、報告撰寫等任務', how: 'Action-based API + 狀態機轉換 + 7 種 ESG 分類', what: '建立/編輯/刪除、優先級、截止日、分類篩選、批次操作、JSON/MD 匯出' },
    },
    {
      id: 'omni-base',
      name: 'OmniBase 外掛系統',
      nameEn: 'Plugin Manager',
      icon: '🔌',
      route: '/omni-base',
      description: '外掛註冊、啟用/停用、熱重載、EventBus 架構',
      category: 'system',
      status: 'active',
      completeness: 68,
      apiEndpoints: ['/api/omni/plugins'],
      dependencies: ['EventBus'],
      whw: { why: '平臺需要可擴展的模組化架構，支援功能熱插拔', how: 'EventBus 事件總線 + 生命週期管理 + 4 個內建外掛', what: '外掛註冊、啟用/停用、熱重載、健康監控、EventBus 訂閱' },
    },
  ];

  const aiModels: AIModelResource[] = [
    {
      provider: 'Groq',
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tier: 'free', speed: 'fast', contextWindow: '128K', specialty: 'General reasoning' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', tier: 'free', speed: 'fast', contextWindow: '128K', specialty: 'Quick responses' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tier: 'free', speed: 'fast', contextWindow: '8K', specialty: 'Compact tasks' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tier: 'free', speed: 'fast', contextWindow: '32K', specialty: 'Multi-language' },
      ],
      apiKeyEnv: 'GROQ_API_KEY',
      rateLimit: '30 req/min',
      status: 'configured',
    },
    {
      provider: 'OpenRouter',
      models: [
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B :free', tier: 'free', speed: 'medium', contextWindow: '128K', specialty: 'General' },
        { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B :free', tier: 'free', speed: 'medium', contextWindow: '128K', specialty: 'Chinese NLP' },
        { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B :free', tier: 'free', speed: 'fast', contextWindow: '8K', specialty: 'Compact' },
        { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B :free', tier: 'free', speed: 'fast', contextWindow: '32K', specialty: 'Code & reasoning' },
      ],
      apiKeyEnv: 'OPENROUTER_API_KEY',
      rateLimit: '20 req/min',
      status: 'configured',
    },
    {
      provider: 'Gemini',
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'free', speed: 'fast', contextWindow: '1M', specialty: 'Multimodal, fast' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tier: 'free', speed: 'fast', contextWindow: '1M', specialty: 'Long context' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'free', speed: 'medium', contextWindow: '2M', specialty: 'Complex analysis' },
      ],
      apiKeyEnv: 'GEMINI_API_KEY',
      rateLimit: '15 req/min',
      status: 'configured',
    },
  ];

  const infra: InfraResource[] = [
    {
      id: 'firebase-auth',
      name: 'Firebase Authentication',
      icon: '🔐',
      type: 'auth',
      provider: 'Firebase',
      tier: 'Spark (Free)',
      status: 'healthy',
      description: 'Google 登入、使用者管理、JWT Token',
      configKey: 'FIREBASE_*',
    },
    {
      id: 'firestore',
      name: 'Cloud Firestore',
      icon: '📄',
      type: 'database',
      provider: 'Firebase',
      tier: 'Spark (Free)',
      status: 'healthy',
      description: 'NoSQL 文件資料庫，50K 讀/日、20K 寫/日',
      configKey: 'FIREBASE_*',
    },
    {
      id: 'supabase',
      name: 'Supabase PostgreSQL',
      icon: '🐘',
      type: 'database',
      provider: 'Supabase',
      tier: 'Free',
      status: 'healthy',
      description: '關係型資料庫，500MB 儲存、50K 行插入/月',
      configKey: 'SUPABASE_*',
    },
    {
      id: 'prisma',
      name: 'Prisma ORM',
      icon: '💎',
      type: 'database',
      provider: 'Prisma',
      tier: 'Free (CLI)',
      status: 'healthy',
      description: 'Type-safe ORM，Schema 定義、Migration 管理',
      configKey: 'DATABASE_URL',
    },
    {
      id: 'upstash-redis',
      name: 'Upstash Redis',
      icon: '⚡',
      type: 'cache',
      provider: 'Upstash',
      tier: 'Free',
      status: 'healthy',
      description: 'Serverless Redis，10K 命令/日、資料快取',
      configKey: 'UPSTASH_REDIS_REST_URL',
    },
    {
      id: 'ioredis',
      name: 'ioredis (Local)',
      icon: '💾',
      type: 'cache',
      provider: 'Self-hosted',
      tier: 'N/A',
      status: 'optional',
      description: '本地 Redis 連線（VPS 部署時使用）',
      configKey: 'REDIS_URL',
    },
    {
      id: 'docker',
      name: 'Docker',
      icon: '🐳',
      type: 'compute',
      provider: 'Docker Inc.',
      tier: 'Free (Community)',
      status: 'healthy',
      description: '容器化部署，multi-stage build，ARM64 支援',
      configKey: 'N/A',
    },
    {
      id: 'nextjs',
      name: 'Next.js 16 on Cloudflare Workers',
      icon: '▲',
      type: 'compute',
      provider: 'Cloudflare Workers',
      tier: 'Free',
      status: 'healthy',
      description: 'App Router、Server Components，vinext 建置部署至 Cloudflare Workers',
      configKey: 'N/A',
    },
    {
      id: 'oracle-vps',
      name: 'Oracle Cloud VPS',
      icon: '☁️',
      type: 'compute',
      provider: 'Oracle Cloud',
      tier: 'Always Free',
      status: 'healthy',
      description: 'ARM Ampere A1，4C/24GB，10TB 出站流量',
      configKey: 'VPS_HOST',
    },
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      icon: '⚙️',
      type: 'monitoring',
      provider: 'GitHub',
      tier: 'Free (2,000 min/mo)',
      status: 'healthy',
      description: 'CI/CD pipeline：TypeScript、ESLint、Vitest、Docker build',
      configKey: 'N/A',
    },
    {
      id: 'prometheus',
      name: 'Prometheus',
      icon: '📡',
      type: 'monitoring',
      provider: 'Prometheus',
      tier: 'Free (Self-hosted)',
      status: 'optional',
      description: '指標蒐集、Grafana 視覺化',
      configKey: 'N/A',
    },
  ];

  return jsonResponse({
    timestamp: Date.now(),
    platform: 'OmniCore',
    version: 'v5.0',
    modules,
    aiModels,
    infrastructure: infra,
    summary: {
      totalModules: modules.length,
      activeModules: modules.filter(m => m.status === 'active').length,
      totalAIModels: aiModels.reduce((sum, p) => sum + p.models.length, 0),
      freeAIModels: aiModels.reduce((sum, p) => sum + p.models.filter(m => m.tier === 'free').length, 0),
      totalInfra: infra.length,
      healthyInfra: infra.filter(i => i.status === 'healthy').length,
    },
  });
}
