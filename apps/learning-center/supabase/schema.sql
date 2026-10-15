-- ============================================================
-- supabase/schema.sql — Learning Center Supabase schema
-- 於 Supabase Dashboard → SQL Editor 執行。RLS 開啟、寬鬆起步
-- (anon + authenticated: 讀寫自家資料)，上線前可再收緊。
-- Realtime: 已加入 publication，前端 postgres_changes 訂閱。
-- ============================================================

-- 1) submissions ------------------------------------------------
create table if not exists public.lc_submissions (
  id         text primary key,
  user_id    uuid not null,
  type       text not null default 'submission',
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lc_submissions_user_idx on public.lc_submissions (user_id, created_at desc);

-- 2) profiles ---------------------------------------------------
create table if not exists public.lc_profiles (
  uid          uuid primary key,
  display_name text not null default '',
  email        text not null default '',
  role         text not null default 'student',
  org          text not null default '',
  status       text not null default 'active',
  updated_at   timestamptz not null default now()
);

-- 3) TAs --------------------------------------------------------
create table if not exists public.lc_tas (
  uid                uuid primary key,
  is_ta              boolean not null default false,
  bio                text not null default '',
  slots              jsonb not null default '[]'::jsonb,
  assigned_students  jsonb not null default '[]'::jsonb,
  updated_at         timestamptz not null default now()
);

-- 4) pairings ---------------------------------------------------
create table if not exists public.lc_pairings (
  id         text primary key,
  mentor_uid uuid not null,
  mentee_uid uuid not null,
  status     text not null default 'pending',
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lc_pairings_mentor_idx on public.lc_pairings (mentor_uid);
create index if not exists lc_pairings_mentee_idx on public.lc_pairings (mentee_uid);

-- 5) knowledge (RAG) -------------------------------------------
create table if not exists public.lc_knowledge (
  id      text primary key,
  roles   text[] not null default '{}',
  content jsonb not null default '{}'::jsonb
);

-- RLS ----------------------------------------------------------
alter table public.lc_submissions enable row level security;
alter table public.lc_profiles    enable row level security;
alter table public.lc_tas         enable row level security;
alter table public.lc_pairings    enable row level security;
alter table public.lc_knowledge   enable row level security;

-- 匿名/登入用戶可讀寫（起步策略；上線前依業務收緊）
drop policy if exists lc_rw on public.lc_submissions;
create policy lc_rw on public.lc_submissions for all using (true) with check (true);
drop policy if exists lc_rw on public.lc_profiles;
create policy lc_rw on public.lc_profiles for all using (true) with check (true);
drop policy if exists lc_rw on public.lc_tas;
create policy lc_rw on public.lc_tas for all using (true) with check (true);
drop policy if exists lc_rw on public.lc_pairings;
create policy lc_rw on public.lc_pairings for all using (true) with check (true);
drop policy if exists lc_ro on public.lc_knowledge;
create policy lc_ro on public.lc_knowledge for select using (true);
drop policy if exists lc_rw on public.lc_knowledge;
create policy lc_rw on public.lc_knowledge for all using (true) with check (true);

-- Realtime -----------------------------------------------------
alter publication supabase_realtime add table public.lc_submissions;
alter publication supabase_realtime add table public.lc_profiles;
alter publication supabase_realtime add table public.lc_tas;
alter publication supabase_realtime add table public.lc_pairings;
alter publication supabase_realtime add table public.lc_knowledge;
