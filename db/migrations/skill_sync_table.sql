-- ============================================================
-- skill_sync — 技能同步記錄表
-- 用於記錄 agents/skills/* 的同步狀態
-- ============================================================
create table if not exists public.skill_sync (
  id            uuid primary key default gen_random_uuid(),
  skill_name    text not null,
  skill_path    text not null,
  version       text,
  category      text,
  description   text,
  sync_status   text not null default 'pending', -- pending | syncing | synced | error
  last_synced_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Enable RLS
alter table public.skill_sync enable row level security;

-- Policy: 公開讀取（由應用端控制寫入）
create policy "Allow public read access" on public.skill_sync
  for select using (true);

-- Indexes
create index idx_skill_sync_name on public.skill_sync (skill_name);
create index idx_skill_sync_status on public.skill_sync (sync_status);
create index idx_skill_sync_updated on public.skill_sync (updated_at);

-- updated_at 觸發器
create or replace function update_skill_sync_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_skill_sync_updated_at
  before update on public.skill_sync
  for each row
  execute function update_skill_sync_updated_at();

-- 範例：插入 52 個技能
insert into public.skill_sync (skill_name, skill_path, version, category, description, sync_status)
select
  split_part(path, '/', 1) as skill_name,
  path as skill_path,
  version as version,
  category as category,
  description as description,
  'pending' as sync_status
from (
  select
    'accidental-data-loss-prevention' as path,
    '意外資料損失防範' as version,
    '安全' as category,
    '意外資料損失防範' as description
  union all select 'best-practice-awakening', '最佳實踐覺醒', '最佳實踐', '最佳實踐覺醒'
  union all select 'data-autocleaning', '資料自動清理', '資料清理', '資料自動清理'
  union all select 'encoding-forensics', '編碼取證', '編碼分析', '編碼取證'
  union all select 'esggo-omniskill', 'ESG GO Omniskill', 'ESG 技能', 'ESG GO 技能集合'
  union all select 'esggo-standards', 'ESG-GO 標準', '標準規範', 'ESG-GO 標準'
  union all select 'eslint-optimizer', 'ESLint 優化', '程式碼優化', 'ESLint 優化'
  union all select 'gcloud-auth-verification', 'GCP 認證驗證', '雲端認證', 'GCP 認證驗證'
  union all select 'github-actions-fixer', 'GitHub Actions 修復', 'GitHub Actions', 'GitHub Actions 修復'
  union all select 'global-healing', '無作妙德 | 圓通無礙', '全域治理', '系統長時期運作的自我修復與無阻流轉境界'
  union all select 'junai-sovereign-ultimate', 'Juna 要主權終極', '集體智慧', 'Juna 要主權終極'
  union all select 'junaikey', 'Junaikey', '開發者金鑰', 'Junaikey'
  union all select 'lhub-ai-routing', 'LHUB AI 路由', '路由', 'LHUB AI 路由'
  union all select 'managing-python-dependencies', 'Python 依賴管理', 'Python 管理', 'Python 依賴管理'
  union all select 'ml-best-practices', '機器學習最佳實踐', 'ML 最佳實踐', '機器學習最佳實踐'
  union all select 'notebook-guidance', '筆記指引', '筆記指引', '筆記指引'
  union all select 'oa-ecosystem-best-practices', 'OA 生態最佳實踐', 'OA 生態', 'OA 生態最佳實踐'
  union all select 'oa-team-bee-colony', 'OA 蜂群', '蜂群協作', 'OA 蜂群'
  union all select 'omni-bitwarden', '萬能金庫', '秘典處理', '萬能金庫系統'
  union all select 'omni-sync-memory', 'Omni 同步記憶', '同步記憶', 'Omni 同步記憶'
  union all select 'omnibase-global-healing', 'OmniBase 全域痊癒', '基礎治理', 'OmniBase 全域痊癒'
  union all select 'omnitag', 'Omni Tag', '標籤管理', 'Omni Tag'
  union all select 'pdf-decoder', 'PDF 解析', '資料處理', 'PDF 解析'
  union all select 'python-ci-setup', 'Python CI 設定', 'Python CI', 'Python CI 設定'
  union all select 'react-quality-fix', 'React 品質修復', 'React 品質', 'React 品質修復'
  union all select 'render-background-workers', 'Render 背景工作', '系統佈署', 'Render 背景工作'
  union all select 'render-blueprints', 'Render 藍圖', '系統佈署', 'Render 藍圖'
  union all select 'render-cli', 'Render CLI', '系統佈署', 'Render CLI'
  union all select 'render-cron-jobs', 'Render 排程工作', '系統佈署', 'Render 排程工作'
  union all select 'render-debug', 'Render 除錯', '系統佈署', 'Render 除錯'
  union all select 'render-deploy', 'Render 部署', '系統佈署', 'Render 部署'
  union all select 'render-disks', 'Render 磁碟', '系統佈署', 'Render 磁碟'
  union all select 'render-docker', 'Render Docker', '系統佈署', 'Render Docker'
  union all select 'render-domains', 'Render 域名', '系統佈署', 'Render 域名'
  union all select 'render-env-vars', 'Render 環境變數', '系統佈署', 'Render 環境變數'
  union all select 'render-keyvalue', 'Render Key-Value', '系統佈署', 'Render Key-Value'
  union all select 'render-mcp', 'Render MCP', '系統佈署', 'Render MCP'
  union all select 'render-migrate-from-heroku', 'Render 從 Heroku 遷移', '系統佈署', 'Render 遷移'
  union all select 'render-monitor', 'Render 監控', '系統佈署', 'Render 監控'
  union all select 'render-networking', 'Render 網路', '系統佈署', 'Render 網路'
  union all select 'render-postgres', 'Render PostgreSQL', '系統佈署', 'Render PostgreSQL'
  union all select 'render-private-services', 'Render 私有服務', '系統佈署', 'Render 私有服務'
  union all select 'render-scaling', 'Render 擴縮', '系統佈署', 'Render 擴縮'
  union all select 'render-static-sites', 'Render 靜態網站', '系統佈署', 'Render 靜態網站'
  union all select 'render-web-services', 'Render 網頁服務', '系統佈署', 'Render 網頁服務'
  union all select 'render-workflows', 'Render 工作流程', '系統佈署', 'Render 工作流程'
  union all select 'skill-repair', '技能修復', '技能修復', '技能修復'
  union all select 'smart-ai-router', 'Smart AI Router', 'AI 路由', 'Smart AI Router'
  union all select 'supabase', 'Supabase', 'Supabase', 'Supabase'
  union all select 'supabase-postgres-best-practices', 'Supabase PostgreSQL 最佳實踐', '資料庫', 'Supabase PostgreSQL 最佳實踐'
  union all select 'web-design', 'Web 設計', '網頁設計', 'Web 設計'
  union all select 'xcode-project-setup', 'Xcode 專案設定', 'Xcode', 'Xcode 專案設定'
  union all select 'zkp-seal', 'ZKP 封印', '零知識證明', 'ZKP 封印'
) as skill_list;

-- 查詢語法範例
-- 查詢所有技能
select * from public.skill_sync order by skill_name;

-- 查詢已同步的技能
select * from public.skill_sync where sync_status = 'synced' order by skill_name;

-- 查詢未同步的技能
select * from public.skill_sync where sync_status = 'pending' order by skill_name;

-- 更新技能同步狀態
update public.skill_sync
set sync_status = 'synced',
    last_synced_at = now()
where skill_name = 'omni-bitwarden';
