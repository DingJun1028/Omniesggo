-- Universal Notes (/notes) — Supabase free-tier schema
-- Facilities: Postgres table + Row Level Security, Realtime (postgres_changes),
-- Auth users (auth.users), Storage bucket for note attachments.

-- ── notes ────────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  content     text not null default '',
  tags        jsonb not null default '[]'::jsonb,
  "fiveTGate" text,
  "createdAt" bigint not null,
  "updatedAt" bigint
);

create index if not exists notes_user_created_idx on public.notes (user_id, "createdAt" desc);

alter table public.notes enable row level security;

drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;

create policy notes_select on public.notes for select using (auth.uid() = user_id);
create policy notes_insert on public.notes for insert with check (auth.uid() = user_id);
create policy notes_update on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete on public.notes for delete using (auth.uid() = user_id);

-- Realtime: let clients subscribe to their own rows
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;

-- ── note_attachments (metadata for files in the storage bucket) ──────────────
create table if not exists public.note_attachments (
  id          text primary key,
  note_id     text not null references public.notes (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint not null default 0,
  type        text not null default '',
  url         text not null default '',
  "createdAt" bigint not null
);

create index if not exists note_attachments_note_idx on public.note_attachments (note_id);

alter table public.note_attachments enable row level security;

drop policy if exists note_attachments_select on public.note_attachments;
drop policy if exists note_attachments_insert on public.note_attachments;
drop policy if exists note_attachments_delete on public.note_attachments;

create policy note_attachments_select on public.note_attachments for select using (auth.uid() = user_id);
create policy note_attachments_insert on public.note_attachments for insert with check (auth.uid() = user_id);
create policy note_attachments_delete on public.note_attachments for delete using (auth.uid() = user_id);

-- ── storage bucket: note-attachments (public read, owner write) ──────────────
insert into storage.buckets (id, name, public)
values ('note-attachments', 'note-attachments', true)
on conflict (id) do nothing;

drop policy if exists note_attachments_storage_select on storage.objects;
drop policy if exists note_attachments_storage_insert on storage.objects;
drop policy if exists note_attachments_storage_delete on storage.objects;

create policy note_attachments_storage_select on storage.objects
  for select using (bucket_id = 'note-attachments');

create policy note_attachments_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy note_attachments_storage_delete on storage.objects
  for delete using (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
